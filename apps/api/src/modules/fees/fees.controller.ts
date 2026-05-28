import type { Request, Response } from "express";
import * as sharedSchemas from "@uganda-cbc-sms/shared";
import { HttpError } from "../../utils/httpError";
import * as svc from "./fees.service";

const {
  feeInvoiceSchema,
  feePaymentSchema,
  feeStructureSchema,
  feeBulkInvoiceSchema,
} = sharedSchemas;

export async function postStructure(req: Request, res: Response): Promise<void> {
  const body = feeStructureSchema.parse(req.body);
  const row = await svc.createFeeStructure(body);
  res.status(201).json({ success: true, data: row, message: "Fee structure saved." });
}

export async function getStructure(_req: Request, res: Response): Promise<void> {
  const rows = await svc.listFeeStructures();
  res.json({ success: true, data: rows });
}

export async function postInvoice(req: Request, res: Response): Promise<void> {
  const body = feeInvoiceSchema.parse(req.body);
  const row = await svc.createInvoice(body);
  res.status(201).json({ success: true, data: row, message: "Invoice created successfully." });
}

export async function postBulkInvoices(req: Request, res: Response): Promise<void> {
  const body = feeBulkInvoiceSchema.parse(req.body);
  const result = await svc.generateInvoicesFromStructure(body);
  const message =
    result.created === 0
      ? `No new invoices created (${result.skipped} already had invoices).`
      : `Created ${result.created} invoice${result.created === 1 ? "" : "s"}${result.skipped ? `; ${result.skipped} skipped (already billed).` : "."}`;
  res.status(201).json({ success: true, data: result, message });
}

export async function getInvoice(req: Request, res: Response): Promise<void> {
  const row = await svc.getInvoice(req.params["invoiceId"]!);
  res.json({ success: true, data: row });
}

export async function getInvoices(req: Request, res: Response): Promise<void> {
  const studentId = req.query["studentId"] as string | undefined;
  const rows = await svc.listInvoices(studentId);
  res.json({ success: true, data: rows });
}

export async function postPayment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new HttpError(401, "Please sign in to continue.");
  const body = feePaymentSchema.parse(req.body);
  const row = await svc.recordPayment(body, req.user.id);
  res.status(201).json({
    success: true,
    data: row,
    message: `Payment recorded. Receipt ${row.receiptNumber}.`,
  });
}

export async function getPayments(req: Request, res: Response): Promise<void> {
  const studentId = req.query["studentId"] as string | undefined;
  const rows = await svc.listPayments(studentId);
  res.json({ success: true, data: rows });
}

export async function getBalance(req: Request, res: Response): Promise<void> {
  const row = await svc.getBalance(req.params["studentId"]!);
  res.json({ success: true, data: row });
}

export async function getReports(req: Request, res: Response): Promise<void> {
  const termId = req.query["termId"] as string | undefined;
  if (!termId) {
    throw new HttpError(400, "Please select a term to view the financial report.");
  }
  const row = await svc.feeTermReport(termId);
  res.json({ success: true, data: row });
}
