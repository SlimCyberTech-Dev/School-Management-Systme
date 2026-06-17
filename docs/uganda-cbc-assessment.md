# Uganda CBC Assessment (O-Level)

This document describes how **SchoolManage** aligns O-Level assessment and grading with UNEB/NCDC CBC policy. Confirm cut-points and compulsory subject lists against your school's current NCDC/UNEB circular before end-of-cycle reporting.

## §4 — A–E competency ratings

- Teachers record strand/competency ratings **A through E** (not A–D).
- Descriptors: A Exceptional, B Outstanding, C Satisfactory, D Basic, E Elementary.
- Ratings are stored in `assessments_cbc` and dual-synced to legacy `cbc_scores` when strand mapping exists.

## §5 — 20/80 composite and school CA rules

- **Final subject grade** = `0.2 × CA + 0.8 × EOC` (weights configurable in tenant `assessment_config` with policy note).
- **CA (continuous assessment)** is derived from school-defined rules in **Admin → Assessment → Assessment rules**:
  - Default method: map each rating to a percentage (A=100, B=80, C=60, D=40, E=20), then average across strands.
  - Optional: per-subject strand weights (`weighted_strand_average`).
- **EOC (end of cycle)** comes from formal exam marks (`exam_marks`), normalized to 0–100.
- **Project work** is tracked in `assessments_cbc_project` and shown on reports separately; it is **not** folded into `ca_score`. Project completion is required for UCE certification.

Persisted composites live in `olevel_subject_results` and recompute when CBC, exam marks, or project work changes.

## §6 — Result 1 / 2 / 3 (divisions abolished at O-Level)

UCE certification is computed per student per academic year (`olevel_certification_status`):

| Code | Meaning |
|------|---------|
| **RESULT_1** | Qualifies for certificate |
| **RESULT_2** | Does not qualify (reasons stored) |
| **RESULT_3** | Every sat subject at grade E |

**Result 1** requires (configurable defaults):

- At least one subject at **D+** (grades A, B, C, or D)
- At least **8** subjects with final grades
- All **compulsory** subjects sat (catalog default: ENG, MATH, SCI, SST, CRE — overridable per school)
- CA and project work complete for each sat subject

Result 2 stores explicit `reason_codes` (e.g. `missing_project`, `subjects_lt_8`).

## §7 — Report card fields

CBC report payloads include:

- Strand-level competency lines (existing)
- **Subject summaries**: CA %, EOC %, composite, final A–E grade, project status
- **Certification** block: Result 1/2/3 label and reasons when applicable
- Class ranking uses **composite average** (not legacy best-8 points) when summaries exist

## A-Level

A-Level grading is unchanged (`grading_config.aLevel.scheme = legacy_uneb_points_v1`). Divisions and UNEB points still apply. Post-CBC UACE scheme remains unconfirmed — contact your exams office before changing A-Level bands.

## Admin checklist

1. Apply O-Level CBC defaults on **Grading scales** (O-Level tab) if no scale exists.
2. Confirm cut-points against NCDC/UNEB circular.
3. Configure **Assessment rules** (CA map, compulsory subjects).
4. Enter A–E on CBC grids; verify dual-sync if using legacy CBC API.
5. Enter EOC via formal exams; ensure project work is recorded.
6. Regenerate report cards; verify certification reasons for incomplete data.
