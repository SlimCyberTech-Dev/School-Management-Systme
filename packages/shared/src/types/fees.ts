export type FeeInvoice = {
  id: string;
  studentId: string;
  termId: string;
  totalAmount: string;
  amountPaid: string;
  balance: string;
  isFlagged: boolean;
  createdAt: string;
  studentName?: string;
  studentNumber?: string;
  classId?: string;
  termLabel?: string;
  yearName?: string;
};

export type FeePayment = {
  id: string;
  invoiceId: string;
  studentId: string;
  amount: string;
  method: string;
  transactionRef: string | null;
  receiptNumber: string;
  recordedBy: string | null;
  paidAt: string;
  studentName?: string;
  studentNumber?: string;
};

export type FeePaymentResult = {
  receiptNumber: string;
  balance: string;
};

export type FeeBalance = {
  studentId: string;
  totalBalance: string;
};

export type FeeStructure = {
  id: string;
  classId: string;
  termId: string;
  category: string;
  amount: string;
  createdAt: string;
  className?: string;
  classStream?: string | null;
  termLabel?: string;
  yearName?: string;
};

export type FeeStructureCopyResult = {
  created: number;
  skipped: number;
};

export type FeeTermReport = {
  invoices: FeeInvoice[];
  summary: {
    billed: string;
    collected: string;
    outstanding: string;
    invoiceCount: number;
    flaggedCount: number;
  };
};

export type BulkInvoiceResult = {
  created: number;
  skipped: number;
  totalAmount: string;
};

export type FeeScheduleStatus = "draft" | "published" | "billed";

export type FeeScheduleRelease = {
  id: string;
  classId: string;
  termId: string;
  status: FeeScheduleStatus;
  publishedAt: string | null;
  billedAt: string | null;
  className?: string;
  classStream?: string | null;
  termLabel?: string;
  yearName?: string;
  categoryCount: number;
  totalPerStudent: string;
  activeStudentCount: number;
  invoicedStudentCount: number;
};

export type BulkInvoicePreviewStudent = {
  studentId: string;
  studentName: string;
  studentNumber: string;
  hasInvoice: boolean;
};

export type BulkInvoicePreview = {
  classId: string;
  termId: string;
  scheduleStatus: FeeScheduleStatus;
  totalPerStudent: string;
  categoryCount: number;
  activeStudentCount: number;
  wouldCreate: number;
  wouldSkip: number;
  alreadyInvoiced: number;
  students: BulkInvoicePreviewStudent[];
};
