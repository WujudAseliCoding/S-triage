# S-Triage — Triage Classification API contract

Rule version: `fkpt-adapted-2026.10.1`

This documents the API of the auditable AI classification flow, so the frontend
and any other consumer can rely on a stable contract.

> This contract reflects the merged integration: the deterministic classification
> pipeline (audit fields, `/intake`, `/verify`) coexists with the staff
> edit/verify + queue-numbering features from the main branch.

---

## 1. Endpoints

| Method | Path | Auth | Purpose | Classification in response? |
|---|---|---|---|---|
| `POST` | `/api/triage/register` | public | Staff registration: full auditable result | ✅ full |
| `POST` | `/api/triage/intake` | public | Public (login-less) patient intake | ⚠️ provisional category only |
| `GET`  | `/api/triage/patients` | `verifyToken` | List patients (`?verifikasi=pending\|done\|all`) | stored data |
| `GET`  | `/api/triage/patients/:id` | `verifyToken` | Single patient | stored data |
| `PUT`  | `/api/triage/patients/:id` | `verifyToken` | Full edit **and** verification (`triageVerifySchema`) | stored data |
| `PUT`  | `/api/triage/patients/:id/verify` | `verifyToken` | Compact "record final priority" action | verification result |
| `DELETE` | `/api/triage/patients/:id` | `verifyToken` | Delete patient + queue + referrals | — |

Auth uses `Authorization: Bearer <jwt>` (`verifyToken`, secret `JWT_SECRET`).

> **Prototype caveat:** `/register` and `/intake` are public by design (patient
> QR flow / prototype registration) but `/register` returns the full
> classification. In production, `/register` should require `verifyToken`
> too; `/intake` must stay public and exposes **only the provisional operative
> category** (so the patient's queue colour matches Manajemen Antrean), never
> the full auditable classification block or the AI internals.

---

## 2. Request body (`/register` and `/intake`) — Zod `triageInputSchema`

```jsonc
{
  "nama_pasien": "Siti",           // >= 2 chars
  "umur": 60,                      // positive integer
  "satuan_umur": "tahun",          // "tahun" | "bulan" | "hari" (optional, default "tahun")
  "jenis_kelamin": "P",            // "L" | "P"
  "nik": "3271…",                  // optional, exactly 16 digits
  "tanggal_lahir": "1966-04-28",   // optional, YYYY-MM-DD
  "keluhan_utama": "Nyeri dada...",// >= 3 chars
  "waktu_mulai_keluhan": "sejak 1 jam", // optional
  "alergi_obat": "penisilin",      // optional
  "tanda_vital": {                 // optional; clinician-measured only
    "sistole": 120, "diastole": 80, "nadi": 88,
    "pernapasan": 20, "suhu": 37.0, "spo2": 97
  },
  "skala_nyeri": 7,                // optional, integer 0..10
  "prioritas_triage": "P2"         // OPTIONAL staff override (was previously required)
}
```

**Note:** `satuan_umur` is stored lowercase (`tahun`/`bulan`/`hari`). The rule
engine also accepts the legacy capitalised form case-insensitively.

**Behaviour change (backward compatible):** `prioritas_triage` is no longer a
required input. Sending it is treated as a **staff override**: it becomes the
operative `prioritas_triage`, while the engine recommendation is preserved
separately in `prioritas_ai`.

---

## 3. `POST /api/triage/register` — `201` response

```jsonc
{
  "status": "success",
  "message": "Pasien berhasil didaftarkan dan antrean telah digenerate.",
  "data": {
    "patient": {
      "id": "…uuid…",
      "nama_pasien": "Siti",
      "prioritas_triage": "P2",              // operative / final category
      "prioritas_ai": "P2",                  // engine recommendation (never mutated)
      "ai_recommended_category": "P2",       // alias of prioritas_ai (compat)
      "final_prioritas": null,               // staff override at registration, if any (alias)
      "skor_urgensi": 3,                     // legacy 1–5 scale (compatibility)
      "analisis_ai": "Ringkasan faktual…",   // factual summary (NOT a reason)
      "alasan_esi": "Aturan yang diterapkan…",// decision reason from executed rules
      "classification_status": "SUPPORTED",
      "review_required": false
    },
    "classification": {
      "rule_version": "fkpt-adapted-2026.10.1",
      "classification_status": "SUPPORTED", // SUPPORTED | REVIEW_REQUIRED | TECHNICAL_FAILURE
      "category": "P2",                      // "P1" | "P2" | "P3" | null  (never "P0")
      "queue_category": "P2",                // operative bucket (P2 when undetermined)
      "provisional": false,
      "review_required": false,
      "escalation": { "required": true, "rule_ids": ["B1-high-risk-condition"], "reason": "…" },
      "decision_step": "B",                  // "A" | "B" | "C" | null
      "applied_rule_ids": ["B1-high-risk-condition"],
      "supporting_facts": [ { "rule_id": "…", "detail": "…", "source": "…" } ],
      "missing_information": ["Tanda vital terverifikasi belum tersedia …"],
      "resource_assessment": { "status": "not_assessed", "reason": "…" },
      "esi_supported": false,                // ESI v4 is NOT implemented (FKTP scope)
      "esi_level": null,
      "alasan_esi": "…"
    },
    "extraction": {
      "mode": "llm",                         // "llm" | "keyword_fallback" | "failed"
      "ok": true,
      "error": null,
      "data": {
        "factual_summary": "…",
        "symptoms": [ { "name": "…", "onset": null, "duration": null, "details": null, "source": "patient" } ],
        "warning_signs": [],
        "red_flags": [],
        "high_risk_flags": ["possible_acs_chest_pain"],
        "reported_vitals": {},
        "mental_status": "normal",
        "pain_scale": null,
        "missing_information": []
      }
    },
    "queue": { "id": "…uuid…", "nomor_antrean": "02", "status": "WAITING" }
  }
}
```

### Status semantics (must not be confused with a category)

| Field value | Meaning |
|---|---|
| `classification_status = "SUPPORTED"` | A verified rule fired on adequate input, or an adequate negative screen produced `P3`. |
| `classification_status = "REVIEW_REQUIRED"` | Information insufficient → `category = null`, `review_required = true`, `queue_category = "P2"` (safety-first provisional). |
| `classification_status = "TECHNICAL_FAILURE"` | Extraction unavailable and no conservative danger signal → `category = null`. |
| `esi_supported = false`, `esi_level = null` | ESI v4 is out of scope for this FKTP product; see implementation notes. |

**Invariants**

- `category` is `null` whenever `review_required` is `true`.
- `category`/`queue_category` are never `"P0"`.
- `queue_category` is never `"P3"` when the category is undetermined.
- `alasan_esi` is derived from the rules that actually ran (see `applied_rule_ids`).

### Queue numbering

Queue numbers are a **single daily sequence** (`01`, `02`, …) assigned by
`renumberQueuesForDay()`, ordered by risk (`P1 → P2 → P3 → P0`) then arrival
time. There is **no `A/B/C/D` prefix**. Reordering happens whenever a priority
changes (registration, verification, deletion).

---

## 4. `POST /api/triage/intake` — `201` response (patient-safe)

```jsonc
{
  "status": "success",
  "message": "Pengajuan diterima. Menunggu verifikasi petugas.",
  "data": {
    "id": "…uuid…",
    "nama_pasien": "Rina",
    "status": "WAITING",
    "referensi": "SIM-2026-AB12CD",
    "prioritas_triage": "P2",   // provisional operative category (null if "review required")
    "queue": { "id": "…", "nomor_antrean": "03", "status": "WAITING" }
  }
}
```

Only `prioritas_triage` (the same value the staff queue uses, so the colour is
identical) is exposed. The full `classification` audit block, `prioritas_ai`,
`analisis_ai`, and `alasan_esi` are **not** returned to the patient. The
category is provisional: staff can change it after assessment/verification.

---

## 5. Human verification

There are two staff paths; both keep the AI recommendation immutable.

### 5a. `PUT /api/triage/patients/:id/verify` — compact

Request:

```jsonc
{
  "final_prioritas": "P2",                       // required: P1 | P2 | P3 | P0
  "override_reason": "Perburukan saat asesmen."  // required only if != prioritas_ai
}
```

Rules:

- If `final_prioritas !== prioritas_ai` → `override_reason` (≥ 3 chars) is
  **required**, otherwise `400`.
- Writes `prioritas_triage` (final), `alasan_override`,
  `status_verifikasi` (`DIVERIFIKASI` \| `OVERRIDDEN`), `petugas_verifikator_id`
  (from `req.user`), `waktu_verifikasi`, and sets `review_required = false`.
- `prioritas_ai` is never overwritten.
- The day's queue is renumbered when the priority changes.

Response `200`:

```jsonc
{
  "status": "success",
  "message": "Prioritas final tersimpan terpisah dari rekomendasi AI.",
  "data": {
    "id": "…uuid…",
    "ai_recommended_category": "P2",   // alias of prioritas_ai
    "final_prioritas": "P2",           // alias of prioritas_triage
    "changed": false,
    "override_reason": null,
    "status_verifikasi": "DIVERIFIKASI",
    "reviewed_at": "2026-…Z",
    "review_required": false
  }
}
```

### 5b. `PUT /api/triage/patients/:id` — full edit + verify

Body validated by `triageVerifySchema` (identity, vitals, `asesmen`,
`catatan_petugas`, `prioritas_triage`, `alasan_override`, `verifikasi`). With
`verifikasi: true`, the patient is marked verified/overridden like above.
Changing priority from `prioritas_ai` without `alasan_override` → `400`.

---

## 6. Error handling

| Case | Status | Body |
|---|---|---|
| Zod validation failure | `400` | `{ status: "error", message: "…", errors: [{ field, message }] }` |
| Missing/invalid token (staff routes) | `401` | `{ status: "error", message: "Akses ditolak. …" }` |
| Patient not found | `404` | `{ status: "error", message: "Pasien tidak ditemukan." }` |
| Change without reason | `400` | `{ status: "error", message: "Alasan perubahan wajib diisi …" }` |
| Unknown route | `404` | `{ status: "error", message: "Rute … tidak ditemukan" }` |
| Unexpected error | `500` | `{ status: "error", message: "…" }` (stack only in development) |

Model failures never become a `400`/`500` for the caller: they degrade inside the
pipeline to `keyword_fallback` (still classified) or `TECHNICAL_FAILURE`
(review required), and are surfaced in `extraction.mode` / `extraction.error`.

---

## 7. Storage (audit / accountability)

`triage_patients` columns added for traceability:

| Column | Meaning |
|---|---|
| `prioritas_ai` | AI/engine recommendation (immutable). |
| `prioritas_triage` | Operative/final category (staff may override). |
| `status_verifikasi` | `BELUM_DIVERIFIKASI` \| `DIVERIFIKASI` \| `OVERRIDDEN`. |
| `alasan_override`, `petugas_verifikator_id`, `nama_verifikator`, `waktu_verifikasi` | Human verification record. |
| `classification_status`, `review_required` | Engine confidence/uncertainty flags. |
| `rule_version`, `extraction_mode`, `alasan_esi` | Reproducibility: which rule set, how the text was read, and the reason. |
| `ai_recommendation` (JSONB) | Full engine output (rules, facts, missing info). |

---

## 8. Frontend integration

- `frontend/src/services/triageService.js` — `submitPatientIntake`,
  `registerTriage`/`registerTriagePatient`, `getTriagePatients`,
  `getTriagePatientById`, `updateTriagePatient`, `verifyTriage`,
  `deleteTriagePatient`.
- `frontend/src/pages/patient/PatientFormPage.jsx` — posts real intake (sends
  only patient-supplied data; `tanda_vital` is empty because patients cannot
  measure vitals).
- `frontend/src/pages/staff/TriageRegistrationPage.jsx` — staff list + edit +
  verify, and renders the classification reason/status.
- `frontend/src/components/staff/TriageClassificationPanel.jsx` — runs the
  classification and records the human verification (demo widget).

Colour mapping `P1→Merah`, `P2→Kuning`, `P3→Hijau` is an **operational** mapping,
not ESI. The UI labels it as such.
