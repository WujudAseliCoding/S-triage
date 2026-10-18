# S-Triage — AI Triage Implementation Notes

Status: hackathon prototype. **Not clinically validated. Not for real patient care.**
Rule version: `fkpt-adapted-2026.10.1`

This document describes how the AI-assisted triage classification works, which
clinical rules are implemented, where they are implemented, which rules remain
unresolved, and how the behaviour is tested.

---

## 1. Scope decision: why this is NOT a full ESI v4 implementation

Before writing code, the product scope was determined from the repository
(proposal, UI copy, API, and docs):

- **Product target: primary care (FKTP — puskesmas/klinik pratama)**, not an
  emergency department. See `proposal_text.txt` (target users: "Puskesmas dan
  klinik pratama (FKTP)"; goal: reduce FKTP queue overcrowding) and the staff/patient
  UI copy ("simulasi asesmen awal FKTP/puskesmas").
- The proposal mentions "Emergency Severity Index (ESI) yang **diadaptasi**"
  (an *adapted* ESI), not a compliant ESI deployment.

The official ESI v4 handbook states it is **"a tool for use in emergency
department (ED) triage"** (Ch.1) and produces **five** levels driven partly by
*expected resource needs* in an ED. Neither the setting nor the resource model
matches this product.

Consequences, applied deliberately:

1. The engine **does not emit ESI levels 1–5**. `esi_supported=false`,
   `esi_level=null` in every result.
2. The engine uses the app's existing **operational categories** `P1` / `P2` /
   `P3` (Merah / Kuning / Hijau). `P0` (Hitam/deceased) is **never** produced by
   the engine — it is a human-confirmed outcome only.
3. ESI's **Decision Point C (resource counting)** is **not implemented**: resource
   needs cannot be predicted from complaint text and are not part of FKTP
   operational triage here. `resource_assessment.status = "not_assessed"`.
4. Only a **small, enumerated subset** of ESI danger/high-risk criteria is adapted.
   This is explicitly a *partial* implementation and must not be called a
   compliant ESI v4 algorithm.

> If the product ever targets an emergency department, this module must be
> replaced by a proper ESI v4 implementation (including Decision Point C) under
> qualified clinical review, with the Algorithm used unchanged per its license.

---

## 2. Reference used

Primary reference (provided in the workspace):

> Gilboy N, Tanabe T, Travers D, Rosenau AM. *Emergency Severity Index (ESI): A
> Triage Tool for Emergency Department Care, Version 4: Implementation Handbook,
> 2012 Edition.* AHRQ Publication No. 12-0014.

Workspace file: `docs/reference/ESI_v4_Implementation_Handbook_2012.docx`
(text extracted locally for reading; the handbook is **not** committed to the
repository — `docs/reference/` is git-ignored — to respect its license).

Official links:
- https://www.govinfo.gov/content/pkg/GOVPUB-HE20_6500-PURL-gpo23161/pdf/GOVPUB-HE20_6500-PURL-gpo23161.pdf
- https://esitriage.org/handbook.asp

**Licensing note:** the ESI Algorithm is the intellectual property of the ESI
Triage Research Team, LLC. This project implements a *small adapted subset* of
danger-sign criteria for a non-ED setting; it does not reproduce the Algorithm
and must not be presented as ESI v4.

> Caveat: the handbook's numeric **Danger Zone Vital Signs figure (Figure 5-2 /
> Figure 2-5)** is an image and did **not** extract to text. Its adult
> HR/RR/SpO2 numeric thresholds could therefore not be verified and are **not**
> hard-coded (see §5, Limitation L1).

---

## 3. Classification pipeline

```
patient/clinician input
        │
        ▼
1. LLM information extraction        backend/src/services/triage/clinicalExtractor.js
   (structured facts + provenance; NO category)
        │
        ▼
2. Schema validation (Zod)           backend/src/services/triage/extractionSchema.js
        │   invalid / timeout / non-2xx / empty  ──► deterministic keyword extraction
        │                                            or explicit failure (never a fake label)
        ▼
3. Deterministic rule engine         backend/src/services/triage/esiRuleEngine.js
   (fixed decision order A → B → C, versioned)
        │
        ▼
4. Auditable result + human review   backend/src/services/triage/classificationService.js
                                     backend/src/controllers/triage.controller.js
```

Invariant: **the final category is produced only by step 3**. The LLM never
selects the category; it only extracts facts.

---

## 4. Implemented rules

Every rule is declared in `esiRuleEngine.js` in the `RULES` array, with an
`id`, a `step` (A/B/C), a `severity`, a `source`, and a deterministic
`describe(ctx)` predicate.

### Step A — immediate life threat → `P1`

| Rule id | Criterion | Source (ESI v4 handbook) | Code |
|---|---|---|---|
| `A1-red-flag` | unresponsive; apneic; pulseless; severe respiratory distress; acute mental status change; airway compromise | Ch.2 **Decision Point A** ("Does the Patient Require Immediate Life-Saving Intervention?") and the level-1 criteria list: *intubated, apneic, pulseless, severe respiratory distress, SpO2 < 90 percent, acute mental status changes, or unresponsive*; level-1 examples pdf pp. ~633–651 | `RED_FLAGS` vocabulary + `A1` predicate |
| `A2-spo2-below-90` | measured `SpO2 < 90%` | Ch.2 Decision Point A ("SpO2 < 90 percent") | `A2` predicate; requires `vitals_verified` |

### Step B — should not wait → `P2`

| Rule id | Criterion | Source | Code |
|---|---|---|---|
| `B1-high-risk-condition` | recognised high-risk presentations | Ch.2 **Decision Point B** + Ch.3 high-risk examples (ACS chest pain stable, stroke signs, rule-out ectopic pregnancy, immunocompromised with fever, suicidal/homicidal, anaphylaxis risk, severe abdominal pain) | `HIGH_RISK_FLAGS` + `B1` |
| `B2-mental-status` | confused / lethargic / disoriented | Ch.2 Decision Point B ("Is the patient confused, lethargic or disoriented?") | `B2` |
| `B3-severe-pain` | pain rating ≥ 7 on a 0–10 scale | Ch.2: *severe pain/distress = rating ≥ 7 on a 0–10 pain scale* | `B3` |
| `B4-pediatric-fever-neonate` | age 1–28 days and temp > 38.0 °C | Ch.5 **Table 5-1** (ESI Pediatric Temperature Criteria) | `B4`; requires `vitals_verified` |
| `B5-pediatric-fever-infant` | age 1–3 months and temp > 38.0 °C | Ch.5 Table 5-1 ("consider 2") | `B5`; requires `vitals_verified` |

### Step C — default → `P3`

| Rule id | Criterion | Source | Code |
|---|---|---|---|
| `C1-default-non-urgent` | no Step A/B criterion met on the available information | Adapted default (consistent with the decision order; not a verbatim ESI rule) | `C1` |

### Decision order matters

Rules are evaluated A → B, and once any rule fires, **later steps are not used**
to override an earlier one. Step C runs **only** when no A/B rule fired **and**
the information was adequate. This is tested ("earlier step A wins over later
step B").

### Provenance of vitals

Only **clinician-measured** vitals (`vitals_verified=true`) can trigger vital-sign
rules. Patient-reported or model-inferred vitals never up-triage. `SpO2 < 90`
and the pediatric fever rules are gated on this.

---

## 5. Statuses, missing information, and safety behaviour

`classification_status` (never confused with a category):

- `SUPPORTED` — a rule fired on adequate input, or an adequate negative screen
  produced `P3`.
- `REVIEW_REQUIRED` — information missing/insufficient; no supported category
  (`category = null`); `review_required = true`.
- `TECHNICAL_FAILURE` — extraction unavailable and no conservative danger
  signal; `category = null`.

Additional behaviour:

- **Never default to non-urgent.** When the category is undetermined, the
  provisional `queue_category` is `P2` (safety-first bucket) and `provisional=true`.
- **Failures cannot suppress a warning.** If extraction fails, the raw complaint
  is scanned conservatively (`CONSERVATIVE_DANGER_KEYWORDS`); a danger hit still
  escalates (`evaluateDegraded`).
- **Contradictory/unknown inputs do not fabricate certainty.** A direct
  contradiction (`unresponsive` flag with `mental_status: normal`) is still
  resolved by the higher-severity rule and surfaced through `supporting_facts`.
- `missing_information` always lists what was absent (vitals, mental status, …).

### Rules that remain incomplete / need clinical clarification

- **L1 — Adult Danger Zone vital signs (HR/RR/SpO2 thresholds).** The handbook's
  numeric figure is not text-extractable; the exact adult thresholds were **not
  verified** and are **not** implemented. Only `SpO2 < 90` (an explicit
  Decision-Point-A criterion) is used. *Unresolved.*
- **L2 — Resource prediction (Decision Point C).** Out of scope for FKTP; not
  implemented.
- **L3 — "High-risk situation" is inherently clinical judgement.** The engine
  only recognises an enumerated vocabulary; anything not enumerated (or not
  extracted) cannot raise a high-risk flag. Requires clinician review of the
  vocabulary.
- **L4 — Seizure severity.** The handbook is ambiguous about whether an ongoing
  seizure is level 1 or 2; this implementation treats it as `P2` high-risk.
  *Needs clinical confirmation.*
- **L5 — Pain scale reliability.** `B3` depends on a reliable 0–10 pain rating
  being recorded; if absent, severe pain is not detected.
- **L6 — Pediatric fever for 3–36 months.** Table 5-1 says "consider level 3"
  for temp > 39.0 °C; this does **not** up-triage and is not implemented as a
  special rule (it falls through to Step C).
- **L7 — Category boundaries are FKTP-operational, not ESI.** `P1`/`P2`/`P3`
  must not be read as ESI 1–5.

---

## 6. Code map

| Concern | File |
|---|---|
| Rule catalog, decision order, degraded evaluation | `backend/src/services/triage/esiRuleEngine.js` |
| LLM extraction + prompt + JSON parsing + fallbacks | `backend/src/services/triage/clinicalExtractor.js` |
| Extraction Zod schema + controlled vocabularies | `backend/src/services/triage/extractionSchema.js` |
| Orchestration (extraction → validation → rules), age handling | `backend/src/services/triage/classificationService.js` |
| API handlers, persistence, human-verification endpoint | `backend/src/controllers/triage.controller.js` |
| Input contract (Zod) | `backend/src/schema/triage.schema.js` |
| Audit columns | `backend/src/models/TriagePatient.js` |
| Gateway client (timeout, errors) | `backend/src/config/ai.js` |

---

## 7. Tests

Run: `npm test -w backend` (Node built-in test runner, no new dependency).

- **Rule engine** — `backend/test/triage/esiRuleEngine.test.js`: each decision
  branch, decision ordering, missing/unknown/invalid inputs, determinism, that
  the reason matches the executed rule, that `P0` is never produced, that
  degraded evaluation cannot be suppressed.
- **LLM extraction** — `backend/test/triage/clinicalExtractor.test.js`: valid
  JSON, fenced/prose JSON, invalid JSON, missing fields, invented enum values,
  gateway HTTP error, empty response, timeout.
- **Service** — `backend/test/triage/classificationService.test.js`: age
  normalisation, vitals detection, end-to-end separation of extraction and rules.
- **API / integration** — `backend/test/integration/triageApi.test.js`:
  validation errors, response-schema compatibility, patient-safe intake,
  human-verification rules (reason required only when overriding).
- **Evaluation** — `backend/test/evaluation/*`: metrics + reference set.

See `docs/ai-classification-audit.md` for the actual results and
`docs/api-triage-classification.md` for the API contract.
