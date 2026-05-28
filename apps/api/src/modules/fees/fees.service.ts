import type {
  FeeBulkInvoiceInput,
  FeeInvoiceInput,
  FeePaymentInput,
  FeeStructureInput,
} from "@uganda-cbc-sms/shared";
import type { PoolClient } from "pg";
import { query, withTransaction } from "../../config/db";
import { HttpError } from "../../utils/httpError";
import { nextSequence, padNumber } from "../../utils/sequences";
import {
  mapFeeBalance,
  mapFeeInvoice,
  mapFeePayment,
  mapFeeStructure,
} from "./fees.mappers";

const INVOICE_SELECT = `
  SELECT fi.*,
         s.full_name AS student_name,
         s.student_number,
         CONCAT('Term ', t.term_number::text) AS term_label,
         ay.name AS year_name
  FROM fee_invoices fi
  JOIN students s ON s.id = fi.student_id
  JOIN terms t ON t.id = fi.term_id
  JOIN academic_years ay ON ay.id = t.academic_year_id`;

const PAYMENT_SELECT = `
  SELECT fp.*,
         s.full_name AS student_name,
         s.student_number
  FROM fee_payments fp
  JOIN students s ON s.id = fp.student_id`;

function amt(v: string | number): string {
  if (typeof v === "number") return v.toFixed(2);
  return String(v);
}

function parseAmount(v: string | number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) {
    throw new HttpError(400, "Amount must be greater than zero.");
  }
  return n;
}

export async function createFeeStructure(input: FeeStructureInput) {
  try {
    const { rows } = await query(
      `INSERT INTO fee_structures (class_id, term_id, category, amount)
       VALUES ($1, $2, $3, $4::numeric)
       RETURNING *`,
      [input.classId, input.termId, input.category, amt(input.amount)],
    );
    return mapFeeStructure(rows[0] as Record<string, unknown>);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "23505") {
      throw new HttpError(400, "A fee structure already exists for this class, term, and category.");
    }
    throw new HttpError(500, "We could not save the fee structure. Please try again.");
  }
}

export async function listFeeStructures() {
  const { rows } = await query(`SELECT * FROM fee_structures ORDER BY category, created_at DESC`);
  return rows.map((r) => mapFeeStructure(r as Record<string, unknown>));
}

export async function createInvoice(input: FeeInvoiceInput) {
  const total = parseAmount(input.totalAmount);
  const existing = await query<{ id: string }>(
    `SELECT id FROM fee_invoices WHERE student_id = $1 AND term_id = $2 LIMIT 1`,
    [input.studentId, input.termId],
  );
  if (existing.rows.length > 0) {
    throw new HttpError(
      409,
      "This student already has an invoice for the selected term. Open the existing invoice or adjust it instead.",
    );
  }

  try {
    const { rows } = await query(
      `INSERT INTO fee_invoices (student_id, term_id, total_amount, amount_paid)
       VALUES ($1, $2, $3::numeric, 0)
       RETURNING *`,
      [input.studentId, input.termId, amt(total)],
    );
    const created = await getInvoice(String(rows[0]!.id));
    return created;
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "23505") {
      throw new HttpError(409, "This student already has an invoice for the selected term.");
    }
    if (e instanceof HttpError) throw e;
    throw new HttpError(500, "We could not create the invoice. Please try again.");
  }
}

export async function getInvoice(invoiceId: string) {
  const { rows } = await query(`${INVOICE_SELECT} WHERE fi.id = $1`, [invoiceId]);
  if (rows.length === 0) {
    throw new HttpError(404, "We could not find that invoice. It may have been removed.");
  }
  return mapFeeInvoice(rows[0] as Record<string, unknown>);
}

export async function listInvoices(studentId?: string) {
  const { rows } = studentId
    ? await query(`${INVOICE_SELECT} WHERE fi.student_id = $1 ORDER BY fi.created_at DESC`, [studentId])
    : await query(`${INVOICE_SELECT} ORDER BY fi.created_at DESC`);
  return rows.map((r) => mapFeeInvoice(r as Record<string, unknown>));
}

export async function generateInvoicesFromStructure(input: FeeBulkInvoiceInput) {
  const { rows: structureRows } = await query<{ amount: string }>(
    `SELECT amount FROM fee_structures WHERE class_id = $1 AND term_id = $2`,
    [input.classId, input.termId],
  );
  if (structureRows.length === 0) {
    throw new HttpError(
      400,
      "No fee structure is configured for this class and term. Ask an administrator to set it up first.",
    );
  }
  const totalAmount = structureRows.reduce((sum, r) => sum + Number(r.amount), 0);
  if (totalAmount <= 0) {
    throw new HttpError(400, "The fee structure total must be greater than zero.");
  }

  const { rows: students } = await query<{ id: string }>(
    `SELECT id FROM students WHERE class_id = $1 AND status = 'active' ORDER BY student_number`,
    [input.classId],
  );
  if (students.length === 0) {
    throw new HttpError(400, "There are no active students in this class.");
  }

  let created = 0;
  let skipped = 0;
  const totalStr = totalAmount.toFixed(2);

  await withTransaction(async (client: PoolClient) => {
    for (const st of students) {
      const exists = await client.query(
        `SELECT 1 FROM fee_invoices WHERE student_id = $1 AND term_id = $2 LIMIT 1`,
        [st.id, input.termId],
      );
      if (exists.rows.length > 0) {
        skipped += 1;
        continue;
      }
      await client.query(
        `INSERT INTO fee_invoices (student_id, term_id, total_amount, amount_paid)
         VALUES ($1, $2, $3::numeric, 0)`,
        [st.id, input.termId, totalStr],
      );
      created += 1;
    }
  });

  return { created, skipped, totalAmount: totalStr };
}

export async function recordPayment(input: FeePaymentInput, recordedBy: string) {
  const payAmount = parseAmount(input.amount);
  if (input.method === "mobile_money" && !input.transactionRef?.trim()) {
    throw new HttpError(400, "Enter the mobile money transaction reference.");
  }

  const threshold = Number(process.env.FEE_ARREARS_THRESHOLD_UGX ?? 500000);

  try {
    return await withTransaction(async (client: PoolClient) => {
      const inv = await client.query<{
        student_id: string;
        balance: string;
      }>(`SELECT student_id, balance::text AS balance FROM fee_invoices WHERE id = $1 FOR UPDATE`, [
        input.invoiceId,
      ]);
      if (inv.rows.length === 0) {
        throw new HttpError(404, "We could not find that invoice. Refresh the page and try again.");
      }
      if (inv.rows[0]!.student_id !== input.studentId) {
        throw new HttpError(400, "The selected invoice does not belong to this student.");
      }

      const balanceBefore = Number(inv.rows[0]!.balance);
      if (balanceBefore <= 0) {
        throw new HttpError(400, "This invoice is already fully paid.");
      }
      if (payAmount > balanceBefore + 0.009) {
        throw new HttpError(
          400,
          `Payment exceeds the outstanding balance (${balanceBefore.toLocaleString()} UGX).`,
        );
      }

      const year = new Date().getFullYear();
      const n = await nextSequence(client, `receipt_${year}`);
      const receiptNumber = `RCP-${year}-${padNumber(n, 6)}`;

      await client.query(
        `INSERT INTO fee_payments (invoice_id, student_id, amount, method, transaction_ref, receipt_number, recorded_by)
         VALUES ($1, $2, $3::numeric, $4, $5, $6, $7)`,
        [
          input.invoiceId,
          input.studentId,
          amt(payAmount),
          input.method,
          input.transactionRef?.trim() || null,
          receiptNumber,
          recordedBy,
        ],
      );

      await client.query(
        `UPDATE fee_invoices SET amount_paid = amount_paid + $1::numeric WHERE id = $2`,
        [amt(payAmount), input.invoiceId],
      );

      const bal = await client.query<{ balance: string }>(
        `SELECT balance::text AS balance FROM fee_invoices WHERE id = $1`,
        [input.invoiceId],
      );
      const balanceNum = Number(bal.rows[0]?.balance ?? 0);
      await client.query(`UPDATE fee_invoices SET is_flagged = $1 WHERE id = $2`, [
        balanceNum > threshold,
        input.invoiceId,
      ]);

      return { receiptNumber, balance: bal.rows[0]?.balance ?? "0" };
    });
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(500, "We could not record the payment. Please try again.");
  }
}

export async function listPayments(studentId?: string) {
  const { rows } = studentId
    ? await query(`${PAYMENT_SELECT} WHERE fp.student_id = $1 ORDER BY fp.paid_at DESC`, [studentId])
    : await query(`${PAYMENT_SELECT} ORDER BY fp.paid_at DESC`);
  return rows.map((r) => mapFeePayment(r as Record<string, unknown>));
}

export async function getBalance(studentId: string) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(balance), 0)::text AS total_balance FROM fee_invoices WHERE student_id = $1`,
    [studentId],
  );
  return mapFeeBalance(studentId, rows[0]?.total_balance ?? "0");
}

export async function feeTermReport(termId: string) {
  const { rows } = await query(`${INVOICE_SELECT} WHERE fi.term_id = $1 ORDER BY s.student_number`, [termId]);
  const invoices = rows.map((r) => mapFeeInvoice(r as Record<string, unknown>));
  const { rows: sums } = await query(
    `SELECT COALESCE(SUM(total_amount),0)::text AS billed,
            COALESCE(SUM(amount_paid),0)::text AS collected,
            COUNT(*)::text AS invoice_count,
            COUNT(*) FILTER (WHERE is_flagged)::text AS flagged_count
     FROM fee_invoices WHERE term_id = $1`,
    [termId],
  );
  const billed = Number(sums[0]?.billed ?? 0);
  const collected = Number(sums[0]?.collected ?? 0);
  return {
    invoices,
    summary: {
      billed: String(sums[0]?.billed ?? "0"),
      collected: String(sums[0]?.collected ?? "0"),
      outstanding: String(Math.max(0, billed - collected)),
      invoiceCount: Number(sums[0]?.invoice_count ?? 0),
      flaggedCount: Number(sums[0]?.flagged_count ?? 0),
    },
  };
}
