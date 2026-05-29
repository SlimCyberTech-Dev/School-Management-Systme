import type { Role } from "@uganda-cbc-sms/shared";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; sessionId: string; tenantId: string };
      tenant?: { id: string; slug: string; displayName: string; status: string };
      platformAdmin?: { id: string; email: string; fullName: string };
    }
  }
}

export {};
