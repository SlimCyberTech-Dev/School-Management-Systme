# Term results API

Base path: `/assessments` (authenticated).

## GET `/assessments/term-results`

Class grid preview for admins and headteachers.

**Query:** `classId`, `termId` (required)

**Response:** subjects × students with exam averages, composite scores, grades, and exam column metadata.

---

## POST `/assessments/term-results/recalculate`

Manually trigger recomputation.

**Body:**

```json
{
  "classId": "uuid",
  "termId": "uuid"
}
```

Optional `studentId` to recompute a single learner.

**Roles:** admin, headteacher

---

## GET `/assessments/project-work`

List project work scores for a class/subject/term.

**Query:** `classId`, `subjectId`, `termId`, `yearId`

---

## PUT `/assessments/project-work/bulk`

Bulk save project work. Triggers automatic term grade recompute for the affected class/term.

---

## POST `/academic/grading-scales/recalculate-olevel`

Legacy route name; now recalculates **term** subject results. Requires `termId` (and optional `classId` / `studentId`).

---

## Deprecated

CBC competency endpoints (`/cbc/activities`, `/cbc/ratings`, `/cbc/term-summary`, legacy `/cbc` sheet) have been removed. Historical strand data remains in the database only.
