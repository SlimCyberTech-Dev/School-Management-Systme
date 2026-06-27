# CBC competency API (NCDC 4-level scale)

REST endpoints under `/api/school/assessments/cbc/*` (authenticated, tenant-scoped via RLS).

## Competency levels

| Value | Display label |
|-------|----------------|
| `exceeds_expectations` | Exceeds Expectations |
| `meets_expectations` | Meets Expectations |
| `approaching_expectations` | Approaching Expectations |
| `below_expectations` | Below Expectations |

Legacy letter `rating` on `assessments_cbc` / `cbc_scores` is still dual-written during transition using a **lossy shim**: exceeds→A, meets→B, approaching→C, below→D.

---

## POST `/assessments/cbc/activities`

Create an assessment activity (the graded event).

**Roles:** `subject_teacher`, `class_teacher`

**Body**

```json
{
  "subjectId": "uuid",
  "classId": "uuid",
  "termId": "uuid",
  "academicYearId": "uuid",
  "activityType": "assignment | project | group_work | practical | participation | presentation | test",
  "title": "string",
  "activityDate": "YYYY-MM-DD"
}
```

**Notes:** `teacher_id` is taken from the JWT, not the request body. Server verifies the teacher is assigned to `classId` + `subjectId` + `academicYearId`.

**Response:** `201` — created `assessment_activities` row.

---

## POST `/assessments/cbc/ratings`

Bulk insert competency ratings for an activity.

**Roles:** `subject_teacher`, `class_teacher`

**Body**

```json
{
  "assessmentActivityId": "uuid",
  "ratings": [
    {
      "studentId": "uuid",
      "competencyId": "uuid",
      "strandId": "uuid",
      "competencyLevel": "exceeds_expectations"
    }
  ]
}
```

**Errors:** `400` if parent activity `is_locked`; `403` if caller is not the activity owner or not assigned to the class/subject.

**Side effects:** Each rating dual-writes legacy `assessments_cbc` + `cbc_scores` via `cbcRatingWrite.ts`.

---

## PATCH `/assessments/cbc/activities/:id/lock`

Lock an activity (FR-023 at activity level).

**Roles:** `subject_teacher`, `class_teacher` (activity owner)

**Response:** Updated activity with `is_locked: true`, `locked_at` set.

---

## GET `/assessments/cbc/term-summary`

Query: `studentId`, `subjectId`, `termId`

**Roles:** `subject_teacher`, `class_teacher`, `admin`, `headteacher`

Computes NCDC **most-frequent** aggregation (tie-break: higher rank wins) over all `competency_ratings` for the scope, upserts `term_competency_summary`, returns cached rows with `effective_level` (honours headteacher override when set).

---

## PATCH `/assessments/cbc/term-summary/:id/override`

**Roles:** `headteacher` only

**Body**

```json
{
  "overriddenLevel": "meets_expectations",
  "overrideJustification": "required text"
}
```

**Errors:** `400` if `overrideJustification` is missing or empty.

---

## POST `/assessments/cbc/learning-outcomes`

**Roles:** `subject_teacher`, `class_teacher`

**Body:** `{ subjectId, strandId, termId, description }`

---

## POST `/assessments/cbc/learning-outcome-records`

**Roles:** `subject_teacher`, `class_teacher`

**Body:** `{ studentId, learningOutcomeId, achievementLevel, remark? }`

`achievementLevel` uses the same `competency_level` enum.
