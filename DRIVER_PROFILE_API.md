# Driver Profile API Documentation

## Overview
Driver profile setup + management API. Covers the three-step onboarding flow
(Bank Details → Vehicle Details → Document Upload), the post-onboarding
"Account Details" + "Account Setting" screens, and OTP-verified phone/email
changes.

All endpoints require `Authorization: Bearer {token}` and the authenticated
user to hold the `driver` role.

---

## Onboarding Setup Flow (3 steps)

The flow is split into three sequential endpoints, one per UI screen.
Each step:

- Persists its data (re-submitting the same step **overwrites** the existing
  values — used when the driver taps Back to edit an earlier screen).
- Advances `setup_step` only forward — going back to step 1 from step 2 does
  **not** drop progress back to 1.
- Returns `{ step_completed, next_step, is_setup_complete }` so the client
  knows which screen to show next.
- Step 3 also flips `approval_status = pending` and ends the flow.

`setup_step` values: `0` not started · `1` bank done · `2` vehicle done
· `3` documents done (submitted for verification).

### Standard Step Response

```json
{
  "success": true,
  "message": "Step 1 (Bank Details) completed. Proceed to step 2.",
  "data": {
    "profile": { ...DriverProfileResource... },
    "step_completed": 1,
    "next_step": 2,
    "is_setup_complete": false
  }
}
```

On step 3 the message becomes `"Step 3 (Document Upload) completed. Profile submitted for verification."`,
`next_step` is `null`, and `is_setup_complete` is `true`.

If the driver tries to skip ahead (e.g. calling step 2 before step 1 is done)
the API returns `422`:
```json
{
  "errors": { "setup_step": ["Complete Step 1 (Bank Details) before submitting vehicle details."] }
}
```

---

### Step 1 of 3 — Bank Details

```
POST /api/driver/profile/setup/step-1/bank-details
```

**Request (JSON):**
```json
{
  "account_holder_name": "Alexandra Arnold",
  "account_number": "78458712",
  "sort_code": "12-34-56",
  "bank_name": "HSBC"
}
```

Account number is encrypted at rest; the resource returns it masked
(e.g. `****8712`).

---

### Step 2 of 3 — Vehicle Details

```
POST /api/driver/profile/setup/step-2/vehicle-details
```

Requires step 1 to have been completed at least once.

**Request (JSON):**
```json
{
  "vehicle_type": "motorcycle",
  "vehicle_registration": "AB12 CDE",
  "vehicle_make": "Yamaha",
  "vehicle_model": "Yamaha YZF-R125",
  "vehicle_color": "Black",
  "year_of_manufacture": 2021,
  "insurance_type": "comprehensive",
  "insurance_expiry_date": "2026-02-10",
  "mot_expiry_date": "2026-05-06"
}
```

`vehicle_type` ∈ `bicycle | motorcycle | car | van`.
`insurance_type` ∈ `comprehensive | third_party | third_party_fire_theft`.
`mot_expiry_date` is only required if vehicle is over 3 years old (client
enforces).

---

### Step 3 of 3 — Document Upload

```
POST /api/driver/profile/setup/step-3/documents
```

Requires step 2 to have been completed.
`Content-Type: multipart/form-data`.

Form fields (jpg/jpeg/png/pdf, max 5MB each):
- `documents[driving_licence_front]` — required
- `documents[driving_licence_back]` — required
- `documents[id_proof]` — required
- `documents[insurance_certificate]` — required
- `documents[vehicle_registration_certificate]` — optional

On success, `approval_status` is set to `pending` and the client should show
the "Document Verification In Progress" screen.

---

### Re-upload a Single Document (post-onboarding)

```
POST /api/driver/profile/documents/single
```

Form fields:
- `type` — one of the document types above
- `file` — the file to upload
- `expires_at` — optional date

Re-uploading replaces the existing document for that type (old file is removed
from storage).

---

## Profile Management

### Get Profile

```
GET /api/driver/profile
```

Returns driver profile, vehicle, bank (masked), notification settings,
documents and approval status.

### Update Basic Profile (name / avatar / DOB)

```
PUT /api/driver/profile
```

Multipart or JSON:
```json
{
  "name": "Alexandra Arnold",
  "date_of_birth": "1992-06-15"
}
```
With `profile_photo` as a file field (jpg/jpeg/png/webp, max 2MB).

---

## Phone Number Change (OTP)

```
POST /api/driver/profile/change-phone/initiate
```
```json
{ "mobile": "1234567890", "country_code": "+44" }
```

```
POST /api/driver/profile/change-phone/verify
```
```json
{ "mobile": "1234567890", "country_code": "+44", "code": "1234" }
```

Uniqueness against existing users is enforced before OTP is sent.

## Email Change (OTP)

```
POST /api/driver/profile/change-email/initiate
```
```json
{ "email": "new@example.com" }
```

```
POST /api/driver/profile/change-email/verify
```
```json
{ "email": "new@example.com", "code": "1234" }
```

---

## Account Settings

### Notification Settings

```
PUT /api/driver/profile/notifications
```
```json
{
  "notify_delivery_updates": true,
  "notify_general": false
}
```

### Delete Account

```
DELETE /api/driver/profile
```
```json
{ "confirm": true }
```

Removes profile, all documents (file + DB row), and the user.

---

## Architecture

### Directory Structure
```
app/
├── Contracts/Profile/
│   ├── CustomerProfileServiceInterface.php
│   └── DriverProfileServiceInterface.php
├── Services/Profile/
│   ├── BaseProfileService.php          ← shared phone/email change logic
│   ├── CustomerProfileService.php      ← extends BaseProfileService
│   └── DriverProfileService.php        ← extends BaseProfileService
├── Http/
│   ├── Controllers/Api/Driver/
│   │   └── DriverProfileController.php
│   ├── Requests/Driver/Profile/
│   │   ├── UpdateProfileRequest.php
│   │   ├── UpdateBankDetailsRequest.php
│   │   ├── UpdateVehicleDetailsRequest.php
│   │   ├── UploadDocumentsRequest.php
│   │   ├── UploadSingleDocumentRequest.php
│   │   ├── UpdateNotificationSettingsRequest.php
│   │   ├── InitiatePhoneChangeRequest.php
│   │   ├── CompletePhoneChangeRequest.php
│   │   ├── InitiateEmailChangeRequest.php
│   │   ├── CompleteEmailChangeRequest.php
│   │   └── DeleteAccountRequest.php
│   └── Resources/Driver/
│       ├── DriverProfileResource.php
│       └── DriverDocumentResource.php
└── Models/
    └── DriverProfile.php               ← updated with new fillable + casts
```

### Common code reuse

`BaseProfileService` holds the four methods that are identical for both
customer and driver:

- `initiatePhoneChange()`
- `initiateEmailChange()`
- `completePhoneChange()`
- `completeEmailChange()`

plus the `canonicalPhone()`, `firstName()`, `lastName()` helpers. Both
`CustomerProfileService` and `DriverProfileService` extend it.

The request classes for phone/email change reuse the existing
`App\Http\Requests\Auth\Concerns\CanonicalizesTarget` trait.

### Migrations

`2026_05_14_175455_add_setup_step_to_driver_profiles_table.php` adds the
`setup_step` tinyint (0-3, monotonically advancing) used by the 3-step flow.

`2026_05_14_151041_add_setup_fields_to_driver_profiles_table.php` adds:

| Column | Type | Notes |
|---|---|---|
| `date_of_birth` | date, nullable | |
| `vehicle_color` | string, nullable | |
| `year_of_manufacture` | smallint unsigned, nullable | |
| `insurance_type` | enum, nullable | comprehensive / third_party / third_party_fire_theft |
| `insurance_expiry_date` | date, nullable | |
| `mot_expiry_date` | date, nullable | |
| `account_holder_name` | string, nullable | |
| `account_number` | string, nullable | encrypted via accessor/mutator |
| `sort_code` | string(20), nullable | |
| `bank_name` | string, nullable | |
| `notify_delivery_updates` | boolean, default true | |
| `notify_general` | boolean, default true | |

### Document Storage

Documents are stored on the `public` disk under `driver/documents/{user_id}/`
and recorded in the polymorphic `documents` table via
`DriverProfile::documents()` (morphMany). The `Document` model already
existed — no schema change needed.
