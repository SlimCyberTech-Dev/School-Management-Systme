# Term assessment workflow — role guide

SchoolManage computes **O-Level term grades** from compulsory exam marks averaged per subject, optionally blended with term project work, then maps the composite to tenant **A–E** grading scales. This replaces the former strand/competency activity track.

---

## Overview

| Component | Source | Default weight |
|-----------|--------|----------------|
| Exam average | Mean of normalized % marks from **compulsory** exams in the reporting term | 80% (`eocWeight`) |
| Project work | Mean of term-scoped `project_work_scores` | 20% (`caWeight`) |

When **Include project work in term grade** is off, the final score is the exam average only.

**High-level flow:**

1. **Admin** creates terms, classes, exams per term, and configures grading scales + term grade policy.
2. **Teachers** enter exam marks (Exams) and optional project work (Assessment → Project work).
3. The system **recomputes** `term_subject_results` when marks, project work, or policy change.
4. **Headteacher / admin** generate term report cards (PDF) with dynamic C1…Cn exam columns.
5. Class ranking uses term subject averages.

---

## Roles

| Role | Responsibilities |
|------|------------------|
| Admin | Exams, grading scales, term grade policy, academic structure |
| Subject / class teacher | Exam marks, project work entry |
| Headteacher | Review exams, generate reports, class/head comments |
| Class teacher | Report comments for homeroom learners |

---

## Admin setup checklist

1. Academic year, terms, and classes
2. Class–subject assignments with teachers
3. O-Level A–E grading scales
4. Term grade policy (exam/project weights, include project toggle)
5. Create compulsory exams for each term/class

---

## API

See [api-term-results-endpoints.md](./api-term-results-endpoints.md).

---

## Historical data

Legacy CBC strand tables (`cbc_strands`, `assessment_activities`, etc.) remain in the database for archival purposes but are no longer written or surfaced in the UI.
