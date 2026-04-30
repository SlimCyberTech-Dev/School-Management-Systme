import type {
  FeeInvoiceInput,
  FeePaymentInput,
  FeeStructureInput,
} from "@uganda-cbc-sms/shared";
import type { PoolClient } from "pg";
import { query, withTransaction } from "../../config/db";
import { HttpError } from "../../utils/httpError";
import { nextSequence, padNumber } from "../../utils/sequences";

function amt(v: string | number): string {
  if (typeof v === "number") return v.toFixed(2);
  return String(v);
}

export async function createFeeStructure(input: FeeStructureInput) {
  try {
    const { rows } = await query(
      `INSERT INTO fee_structures (class_id, term_id, category, amount)
       VALUES ($1, $2, $3, $4::numeric)
       RETURNING *`,
      [input.classId, input.termId, input.category, amt(input.amount)],
    );
    return rows[0];
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "23505") throw new HttpError(400, "Fee structure already exists for this category");
    throw new Error(e instanceof Error ? e.message : "Could not create fee structure");
  }
}

export async function listFeeStructures() {
  try {
    const { rows } = await query(`SELECT * FROM fee_structures ORDER BY category`);
    return rows;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not list fee structures");
  }
}

export async function createInvoice(input: FeeInvoiceInput) {
  try {
    const { rows } = await query(
      `INSERT INTO fee_invoices (student_id, term_id, total_amount, amount_paid)
       VALUES ($1, $2, $3::numeric, 0)
       RETURNING *`,
      [input.studentId, input.termId, amt(input.totalAmount)],
    );
    return rows[0];
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not create invoice");
  }
}

export async function listInvoices(studentId?: string) {
  try {
    const { rows } = studentId
      ? await query(`SELECT * FROM fee_invoices WHERE student_id = $1 ORDER BY created_at DESC`, [
          studentId,
        ])
      : await query(`SELECT * FROM fee_invoices ORDER BY created_at DESC`);
    return rows;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not list invoices");
  }
}

export async function recordPayment(input: FeePaymentInput, recordedBy: string) {
  try {
    const threshold = Number(process.env.FEE_ARREARS_THRESHOLD_UGX ?? 500000);
    return await withTransaction(async (client: PoolClient) => {
      const inv = await client.query<{ student_id: string }>(
        `SELECT student_id FROM fee_invoices WHERE id = $1`,
        [input.invoiceId],
      );
      if (inv.rows.length === 0) throw new HttpError(404, "Invoice not found");
      if (inv.rows[0]!.student_id !== input.studentId) {
        throw new HttpError(400, "Student does not match invoice");
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
          amt(input.amount),
          input.method,
          input.transactionRef ?? null,
          receiptNumber,
          recordedBy,
        ],
      );

      await client.query(
        `UPDATE fee_invoices SET amount_paid = amount_paid + $1::numeric WHERE id = $2`,
        [amt(input.amount), input.invoiceId],
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

      return { receiptNumber, balance: bal.rows[0]?.balance };
    });
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new Error(e instanceof Error ? e.message : "Could not record payment");
  }
}

export async function listPayments(studentId?: string) {
  try {
    const { rows } = studentId
      ? await query(
          `SELECT * FROM fee_payments WHERE student_id = $1 ORDER BY paid_at DESC`,
          [studentId],
        )
      : await query(`SELECT * FROM fee_payments ORDER BY paid_at DESC`);
    return rows;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not list payments");
  }
}

export async function getBalance(studentId: string) {
  try {
    const { rows } = await query(
      `SELECT COALESCE(SUM(balance), 0)::text AS total_balance FROM fee_invoices WHERE student_id = $1`,
      [studentId],
    );
    return { studentId, totalBalance: rows[0]?.total_balance ?? "0" };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not get balance");
  }
}

export async function feeTermReport(termId: string) {
  try {
    const { rows } = await query(
      `SELECT fi.*, s.full_name, s.student_number
       FROM fee_invoices fi
       JOIN students s ON s.id = fi.student_id
       WHERE fi.term_id = $1
       ORDER BY s.student_number`,
      [termId],
    );
    const { rows: sums } = await query(
      `SELECT COALESCE(SUM(total_amount),0)::text AS billed,
              COALESCE(SUM(amount_paid),0)::text AS collected
       FROM fee_invoices WHERE term_id = $1`,
      [termId],
    );
    return { invoices: rows, summary: sums[0] };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not build fee report");
  }
}
