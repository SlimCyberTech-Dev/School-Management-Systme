import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const zErr = err as ZodError;
    const msg = zErr.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    res.status(400).json({ success: false, error: msg });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ success: false, error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  const status =
    err instanceof Error && "status" in err && typeof (err as { status?: number }).status === "number"
      ? (err as { status: number }).status
      : 500;
  console.error(err);
  res.status(status >= 400 && status < 600 ? status : 500).json({
    success: false,
    error: message,
  });
}
