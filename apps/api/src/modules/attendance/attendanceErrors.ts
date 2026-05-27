import { HttpError } from "../../utils/httpError";

type PgError = {
  code?: string;
  constraint?: string;
  message?: string;
};

export function rethrowAttendanceSaveError(err: unknown, context: "homeroom" | "lesson"): never {
  if (err instanceof HttpError) throw err;

  const pg = err as PgError;
  if (pg?.code === "42P10") {
    throw new HttpError(
      500,
      "Attendance could not be saved because the database is missing a required update. Please ask your school administrator to run the latest system migrations, then try again.",
    );
  }
  if (pg?.code === "23505") {
    throw new HttpError(
      409,
      context === "lesson"
        ? "Attendance for this lesson period was already recorded. Refresh the page to view it."
        : "Attendance for this class and date was already recorded. Refresh the page to view it.",
    );
  }
  if (pg?.code === "23503") {
    throw new HttpError(
      400,
      "One or more learners could not be found. Refresh the class list and try again.",
    );
  }

  throw new HttpError(
    500,
    context === "lesson"
      ? "We could not save lesson attendance right now. Please check your connection and try again."
      : "We could not save attendance right now. Please check your connection and try again.",
  );
}
