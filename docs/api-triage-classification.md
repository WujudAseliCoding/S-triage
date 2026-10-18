# S-Triage — Triage Classification API contract

Rule version: `fkpt-adapted-2026.10.1`

This documents the API changes made for the auditable AI classification flow, so
the frontend and any other consumer can rely on a stable contract.

---

## 1. Endpoints

| Method | Path | Purpose | Classification in response? |
|---|---|---|---|
| `POST` | `/api/triage/register` | Staff registration: full auditable result | ✅ full |
| `POST` | `/api/triage/intake` | Public (login-less) patient intake | ❌ patient-safe only |
| `GET`  | `/api/triage/patients` | List patients (audit fields included) | stored data |
| `GET`  | `/api/triage/patients/:id` | Single patient | stored data |
| `PUT`  | `/api/triage/patients/:id/verify` | Record the clinician's final decision | verification result |

> **Prototype caveat:** `/register`, `/patients*` are currently unauthenticated
> (pre-existing). They should be protected with `verifyToken` + `requireRoles`.
> `/intake` is intentionally public but never returns the classification.

---

## 2. Request body (`/register` and `/intake`) — Zod `triageInputSchema`

```jsonc
{
  "nama_pasien": "Siti",           // >= 2 chars
  "umur": 60,                      // positive integer
  "satuan_umur": "Tahun",          // "Tahun" | "Bulan" | "Hari" (optional, default Tahun)
  "jenis_kelamin": "P",            // "L" | "P"
  "keluhan_utama": "Nyeri dada...",// >= 3 chars
  "tanda_vital": {                 // optional; clinician-measured only
    "sistole": 120, "diastole": 80, "nadi": 88,
    "pernapasan": 20, "suhu": 37.0, "spo2": 97
  },
  "skala_nyeri": 7,                // optional, integer 0..10
  "prioritas_triage": "P2"         // OPTIONAL staff override (was previously required)
}
```

**Behaviour change (backward compatible):** `prioritas_triage` is no longer a
required input. Sending it is treated as a **staff override**, recorded in
`final_prioritas` while the engine recommendation is preserved in
`ai_recommended_category`.

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
      "prioritas_triage": "P2",              // operative / queue category
      "ai_recommended_category": "P2",       // engine recommendation (never mutated)
      "final_prioritas": null,               // staff override at registration, if any
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
    "queue": { "id": "…uuid…", "nomor_antrean": "B-01", "status": "WAITING" }
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
    "queue": { "id": "…", "nomor_antrean": "C-01", "status": "WAITING" }
  }
}
```

No classification, no priority, no reason is returned to the patient.

---

## 5. `PUT /api/triage/patients/:id/verify` — human verification

Request:

```jsonc
{
  "final_prioritas": "P2",                       // required: P1 | P2 | P3 | P0
  "override_reason": "Perburukan saat asesmen.", // required only if != ai_recommended_category
  "reviewer_id": "…uuid…"                        // optional (else req.user.id)
}
```

Rules:

- If `final_prioritas !== ai_recommended_category` → `override_reason` (≥ 3 chars) is **required**, otherwise `400`.
- The final decision is stored separately (`final_prioritas`, `reviewed_by`,
  `reviewed_at`, `override_reason`); `ai_recommended_category` is never
  overwritten. `review_required` becomes `false`.
- The queue number prefix is re-issued to match the confirmed priority.

Response `200`:

```jsonc
{
  "status": "success",
  "message": "Prioritas final tersimpan terpisah dari rekomendasi AI.",
  "data": {
    "id": "…uuid…",
    "ai_recommended_category": "P2",
    "final_prioritas": "P2",
    "changed": false,
    "override_reason": null,
    "reviewed_at": "2026-…Z",
    "review_required": false
  }
}
```

---

## 6. Error handling

| Case | Status | Body |
|---|---|---|
| Zod validation failure | `400` | `{ status: "error", message: "Validasi data gagal.", errors: [...] }` |
| Patient not found | `404` | `{ status: "error", message: "Pasien tidak ditemukan." }` |
| Change without reason | `400` | `{ status: "error", message: "Alasan perubahan wajib diisi …" }` |
| Unknown route | `404` | `{ status: "error", message: "Rute … tidak ditemukan" }` |
| Unexpected error | `500` | `{ status: "error", message: "…" }` (stack only in development) |

Model failures never become a `400`/`500` for the caller: they degrade inside the
pipeline to `keyword_fallback` (still classified) or `TECHNICAL_FAILURE`
(review required), and are surfaced in `extraction.mode` / `extraction.error`.

---

## 7. Frontend integration

- `frontend/src/services/triageService.js` — `submitPatientIntake`, `registerTriage`, `verifyTriage`.
- `frontend/src/pages/patient/PatientFormPage.jsx` — posts real intake (sends only
  patient-supplied data; `tanda_vital` is empty because patients cannot measure vitals).
- `frontend/src/components/staff/TriageClassificationPanel.jsx` — runs the
  classification, shows status/review/rules/reason/missing info, and records the
  human verification.

Colour mapping `P1→Merah`, `P2→Kuning`, `P3→Hijau` is an **operational** mapping,
not ESI. The UI labels it as such.
