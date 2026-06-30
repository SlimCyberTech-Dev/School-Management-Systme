import { recomputeTermForClass } from "./termSubjectGrade.js";

/** Fire-and-forget term grade recompute for a class/term scope. */
export function scheduleTermRecompute(classId: string, termId: string): void {
  void recomputeTermForClass(classId, termId).catch((err) => {
    console.error("[termSubjectGrade] recompute failed", { classId, termId, err });
  });
}
