# O-Level term assessment policy

SchoolManage uses a **school-internal** term grading model (not UNEB strand descriptors).

## Term subject grade

For each learner, subject, and term:

1. **Exam average** — arithmetic mean of `(score / max_score) × 100` from **compulsory** `exam_subjects` linked to exams in that term.
2. **Project average** — arithmetic mean of normalized project work scores for that term only.
3. **Composite** — when `includeProjectWorkInTermGrade` is true:  
   `composite = caWeight × projectAverage + eocWeight × examAverage`  
   Weights must sum to 1. Defaults: project 0.2, exam 0.8.
4. **Final grade** — A–E from tenant `grading_scales` rows.

Results are stored in `term_subject_results` with per-exam breakdown JSON and `formula_version = term_exam_avg_v1`.

## Configuration

Managed under **Assessment → Rules** (admin):

- Exam weight / project weight
- Include project work in term grade (toggle)
- Expected projects per term

## Reports

Term report PDFs show: Subject | C1…Cn | AVG | GRADE | COMMENT | INITIAL, plus grading scale legend and overall average.

## A-Level

A-Level assessment remains a separate track (percentage marks, division summary). Unchanged by this policy.
