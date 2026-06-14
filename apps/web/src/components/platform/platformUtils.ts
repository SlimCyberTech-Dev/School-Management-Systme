export function platformApiError(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;

  if ("response" in err) {
    const ax = err as {
      response?: { data?: { error?: string }; status?: number };
      code?: string;
      message?: string;
    };

    if (!ax.response) {
      if (ax.code === "ERR_NETWORK" || ax.message?.includes("Network Error")) {
        return "Cannot reach the API server. Restart npm run dev and ensure port 5000 is running.";
      }
      return "The API did not respond. Check that the server is running.";
    }

    const data = ax.response.data;
    if (typeof data?.error === "string") return data.error;

    if (ax.response.status && ax.response.status >= 500) {
      return "Server error during sign-in. Check the API terminal for details.";
    }
  }

  return null;
}

export const FEATURE_FLAG_LABELS: Record<string, string> = {
  fees: "Fees & billing",
  exams: "Exams",
  alevel: "A-Level assessments",
  timetable: "Timetable",
  attendance: "Attendance",
  analytics: "Analytics",
};

export function formatAuditAction(action: string): string {
  const labels: Record<string, string> = {
    TENANT_CREATED: "School created",
    TENANT_UPDATED: "School updated",
    TENANT_SUSPENDED: "School suspended",
    TENANT_ACTIVATED: "School reactivated",
    TENANT_ADMIN_PASSWORD_RESET: "School admin password reset",
    PLATFORM_LOGIN_SUCCESS: "Signed in",
    PLATFORM_LOGIN_FAILED: "Failed sign-in attempt",
    PLATFORM_LOGOUT: "Signed out",
    PLATFORM_PASSWORD_CHANGED: "Password changed",
    PLATFORM_ADMIN_CREATED: "Operator added",
    PLATFORM_ADMIN_DEACTIVATED: "Operator deactivated",
    PLATFORM_ADMIN_SEEDED: "Super-admin seeded",
  };
  if (labels[action]) return labels[action];
  return action
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
