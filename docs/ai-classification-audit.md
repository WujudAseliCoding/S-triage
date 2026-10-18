# S-Triage — AI Classification Audit & Evaluation Report

Scope: audit of the AI-assisted urgency classification, the changes made, and the
actual test/evaluation results. Read together with
`docs/esi-implementation-notes.md`.

> Plain statement: **software tests passing does not establish clinical validity
> or readiness for real patient care.**

---

## 1. Audit findings

### 1.1 What already worked

- A working Express + Sequelize backend with auth, triage registration, live
  queue, and referral endpoints (`backend/src/routes/api.routes.js`).
- A patient+queue creation flow wrapped in a DB transaction
  (`triage.controller.js`).
- A Way/Gutech gateway client with a timeout-free `fetch`
  (`backend/src/config/ai.js`).
- A React/Vite/Tailwind frontend with a login-less patient flow and a protected
  staff flow; UI copy was already appropriately cautious ("AI belum tervalidasi
  klinis").
- Repo hygiene: `.env` is git-ignored; no real secrets in tracked files.

### 1.2 What was incomplete or incorrect

1. **The LLM chose the triage label.** `analyzeTriageWithAI` asked the model for
   `prioritas_triage` and used it directly. This is exactly the anti-pattern the
   task forbids.
2. **No separation between extraction and decision.** Free-text in, free-text
   label out; `analisis_ai` was a persuasive narrative, not an auditable reason.
3. **The `prioritas_triage` field was required input**, so the "AI" label could
   be overridden silently with no reason and no separation between AI and human.
4. **No audit trail**: no rule ids, no status, no review flag, no rule version,
   no record of who confirmed/overrode.
5. **Fragile error handling**: `response.status` thrown as a bare message; no
   timeout; `JSON.parse` unguarded; malformed model output fell through to a
   keyword classifier that could silently return `P3`.
6. **Dangerous label mixing**: `P0` ("meninggal") could be produced by an AI
   keyword match; `P0` was also mapped to a queue prefix `D`, i.e. treated as a
   fourth queue category.
7. **UI/queue driven by mock data**: `LiveQueuePage` reads `mockData.js`;
   `TriageRegistrationPage` is static; the patient form never calls the backend.
8. **No tests at all** (`test_features.js` needs a live DB; no assertions).
9. **No RAG present.** No retrieval collection, endpoint, or call exists in the
   code (only Supabase Storage/Realtime is referenced in `.env.example`).
10. **Scope confusion**: docs/UI mix an "adapted ESI" idea with a `Merah/Kuning/
    Hijau` 3-tier operational queue; ESI is never actually implemented, and its
    ED-only nature was not acknowledged.
11. **Risk of real credentials at rest**: the nested `S-triage/S-triage/` clone
    contains real `.env` files (a `WAY_API_KEY`, a `DATABASE_URL`). They are not
    tracked by the outer repo, but the duplicate working tree is a hygiene risk.

### 1.3 Relevant files (before changes)

`backend/src/config/ai.js`, `backend/src/controllers/triage.controller.js`,
`backend/src/schema/triage.schema.js`, `backend/src/models/TriagePatient.js`,
`frontend/src/pages/patient/PatientFormPage.jsx`,
`frontend/src/pages/staff/TriageRegistrationPage.jsx`,
`frontend/src/pages/staff/LiveQueuePage.jsx`, `frontend/src/data/mockData.js`.

### 1.4 Smallest implementation plan (executed)

1. Scope decision + honest documentation (FKTP, ESI v4 out of scope). ✅
2. LLM = extraction only, Zod-validated (`clinicalExtractor.js` + `extractionSchema.js`). ✅
3. Deterministic, versioned rule engine (`esiRuleEngine.js`). ✅
4. Orchestration + audit fields + separate human verification (`classificationService.js`, controller, model). ✅
5. Safe failure modes + degraded conservative scan. ✅
6. Tests (rule engine, extraction, API, evaluation). ✅
7. Minimal frontend integration (patient intake + staff panel). ✅

---

## 2. Security & data-handling audit

| Check | Result |
|---|---|
| Secrets in tracked files | ✅ none (only placeholders in `.env.example`) |
| `.env` ignored | ✅ `.gitignore` |
| API key only backend-side | ✅ `WAY_API_KEY` read in `config/ai.js`; frontend only has `VITE_API_BASE_URL` |
| Secrets/patient data in logs | ✅ gateway errors log status/code only; extraction failures are not logged with complaint text |
| Third-party copyrighted doc not redistributed | ✅ `docs/reference/` added to `.gitignore` |
| Patient PII exposure | ⚠️ `/api/triage/register` and `/api/triage/patients` are currently **unauthenticated** (pre-existing). A patient-safe `/api/triage/intake` was added so the public flow never receives classification. **Recommendation:** add `verifyToken`/`requireRoles` to the staff triage/queue/referral routes. |
| Nested duplicate clone with real `.env` | ⚠️ hygiene risk; recommend deleting `S-triage/S-triage/` or adding it to `.gitignore`. |

---

## 3. What changed (files created / modified)

Created:
- `backend/src/services/triage/esiRuleEngine.js`
- `backend/src/services/triage/extractionSchema.js`
- `backend/src/services/triage/clinicalExtractor.js`
- `backend/src/services/triage/classificationService.js`
- `backend/test/triage/esiRuleEngine.test.js`
- `backend/test/triage/clinicalExtractor.test.js`
- `backend/test/triage/classificationService.test.js`
- `backend/test/integration/triageApi.test.js`
- `backend/test/evaluation/dataset.js`, `metrics.js`, `runEvaluation.js`, `evaluation.test.js`
- `frontend/src/services/triageService.js`
- `frontend/src/components/staff/TriageClassificationPanel.jsx`
- `docs/esi-implementation-notes.md`, `docs/ai-classification-audit.md`, `docs/api-triage-classification.md`

Modified:
- `backend/src/config/ai.js` (gateway client with timeout; `analyzeTriageWithAI` deprecated)
- `backend/src/controllers/triage.controller.js` (pipeline, audit persistence, `/intake`, `/verify`)
- `backend/src/schema/triage.schema.js` (`prioritas_triage` optional = override; added fields)
- `backend/src/models/TriagePatient.js` (audit + verification columns)
- `backend/src/routes/api.routes.js` (`/triage/intake`, `/triage/patients/:id/verify`)
- `backend/src/server.js` (dev `sync({ alter: true })`)
- `backend/package.json` (test/eval scripts)
- `frontend/src/utils/patientFormSchema.js`, `pages/patient/PatientFormPage.jsx`,
  `pages/staff/TriageRegistrationPage.jsx`
- `.gitignore`

---

## 4. Tests executed — actual results

Command: `npm test -w backend` (Node built-in runner).

```
ℹ tests 50
ℹ pass 50
ℹ fail 0
```

Breakdown: rule engine (16), LLM extraction (12), service (5), API/integration (10),
evaluation (7). Frontend: `npm run build -w frontend` ✅ success; `npm run lint -w frontend` ✅ clean.

---

## 5. Classification evaluation — actual results

Command: `npm run eval -w backend`. Dataset: 30 base + 8 paraphrase **synthetic**
cases (`backend/test/evaluation/dataset.js`). Rule version `fkpt-adapted-2026.10.1`.

> Reference labels were authored by the implementer from the rule specification
> and cited handbook sections; they have **not** been clinically reviewed. Metrics
> therefore measure **consistency against the reference set, not clinical
> validity.** No prediction was ever `P0`.

### 5.1 Rule engine vs. specification (gold structured input)

| Set | Accuracy | Macro F1 | Under-triage | Over-triage | Review-required |
|---|---|---|---|---|---|
| Base (30) | 100.0% | 100.0% | 0 | 0 | 0.0% |
| Paraphrase (8) | 100.0% | 100.0% | 0 | 0 | 0.0% |

This validates the **decision logic against its own specification** (unit-test
like). It is *not* independent evidence of correctness, because the dataset's
structured field encodes the same rule codes the engine consumes.

### 5.2 End-to-end **offline** pipeline (keyword extraction + engine)

| Set | Accuracy | Macro F1 | Under-triage | Over-triage | Review-required |
|---|---|---|---|---|---|
| Base (30) | 100.0% | 100.0% | 0 | 0 | 0.0% |
| Paraphrase (8) | 50.0% | 61.1% | 4 | 0 | 0.0% |

Per-class (paraphrase E2E): P1 P=100%/R=100%; P2 P=100%/R=20%; P3 P=33.3%/R=100%.

The paraphrase gap (P01, P02, P04, P05 → under-triaged) is the **keyword
fallback missing synonyms** ("dada seperti ditindih benda berat", "mulut miring…").
This is the expected motivation for the LLM extraction stage; the LLM path was
**not** exercised here (no API key available in this environment) — see §6.

### 5.3 Baseline comparison (original keyword classifier)

| Set | Accuracy | Macro F1 | Under-triage | Over-triage |
|---|---|---|---|---|
| Base (30) | 50.0% | 46.2% | 11 | 4 |
| Baseline per-class (base) | P1 P/R 57.1/66.7 · P2 33.3/7.7 · P3 50.0/90.9 | | | |

**A valid baseline comparison was possible**: the original classifier is
deterministic and was evaluated on the **same frozen** reference set as the new
pipeline. On the base set the baseline under-triaged 11/30 and the original
`P2` recall was 7.7% (13 P2 cases, 1 correct). The new pipeline (offline mode)
under-triaged 0/30 on the base set and 4/30 on the paraphrase set.

**What cannot be concluded:** these numbers are consistency against a synthetic,
non-clinically-reviewed set. They do **not** demonstrate improved clinical
outcomes, reduced waiting time, or safety. They must not be quoted as clinical
accuracy.

### 5.4 Metrics not computed

- **Cohen's / weighted kappa:** not reported. A kappa requires multiple raters
  or repeated model runs against an independent gold standard; neither exists
  (single implementer, deterministic reference). Reporting one would be
  fabricated precision.
- **Prediction consistency / flip rate (LLM):** requires repeated live model
  calls; not run (no API key). The offline path is deterministic by construction.

---

## 6. Integration status

| Component | Status |
|---|---|
| **LLM extraction (Way/Gutech)** | Implemented and unit-tested with a mocked gateway (valid JSON, invalid JSON, missing fields, invented values, HTTP error, empty, timeout). **Live call not verified** — no `WAY_API_KEY` in this workspace. The client performs a real `POST` to `WAY_API_URL` and validates the response. |
| **Deterministic rule engine** | Implemented, tested, versioned. |
| **RAG** | **Not present and not implemented.** No retrieval collection/endpoint/call exists in the code. Per instructions, RAG was deliberately **not** built before the extraction/validation/rule/review flow works. If added later: keep executable rules out of the collection, keep evaluation cases separate from operational knowledge documents, and do not let retrieved examples override verified rules. |
| **Frontend** | Patient form now POSTs real intake (limited response). Staff `TriageClassificationPanel` runs the classification, shows category/status/review flag/rules/reason/missing info, and records the human verification (separate from the AI recommendation). Live queue still uses mock data (unchanged — out of the minimal scope; the queue API already returns the new audit fields). |
| **Human review** | Implemented in the backend (`PUT /triage/patients/:id/verify`) and surfaced in the staff panel. |
| **Queue** | Operative category drives the existing `A/B/C` prefix logic. Provisional/undetermined cases are placed in the safety-first bucket, not the non-urgent one. |

---

## 7. Known limitations & highest-priority remaining work

1. **Adult danger-zone vital thresholds unverified** (handbook figure not
   text-extractable) → not implemented. Needs clinician sign-off + a verified
   source before adding.
2. **No live LLM verification** in this environment; run the extraction against
   the real gateway with `WAY_API_KEY` set and record results.
3. **Auth gap**: staff triage/queue/referral routes remain unauthenticated.
4. **Reference labels are not clinically validated** — need blinded review by a
   clinician before any accuracy claim.
5. **High-risk vocabulary is not exhaustive** — clinician review required.
6. **Live queue UI still uses mock data** — swap to `/api/queue/live` and render
   `review_required` / classification status distinctly from the colour.
7. **Nested duplicate clone with real `.env`** — remove or ignore.
8. **`sequelize.sync({ alter: true })` in dev** adds the new columns; ensure a
   controlled migration for any shared/production database.
