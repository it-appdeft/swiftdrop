# Driver Profile API Documentation

## Overview
Driver profile setup + management API. Covers the three-step onboarding flow
(Bank Details → Vehicle Details → Document Upload), the post-onboarding
"Account Details" + "Account Setting" screens, and OTP-verified phone/email
changes.

All endpoints require `Authorization: Bearer {token}` and the authenticated
user to hold the `driver` role.

---

## Onboarding Setup Flow

### Combined One-Shot Submission (recommended for the 3-step UI)

```
POST /api/driver/profile/complete-setup
```

`Content-Type: multipart/form-data`. Submits Bank + Vehicle + Documents in
one call and automatically marks `approval_status = pending`.

Form fields:

**Bank Details**
- `account_holder_name`
- `account_number` (6-12 digits)
- `sort_code` (`XX-XX-XX` or `XXXXXX`)
- `bank_name`

**Vehicle Details**
- `vehicle_type` — bicycle / motorcycle / car / van
- `vehicle_registration`
- `vehicle_make`
- `vehicle_model`
- `vehicle_color`
- `year_of_manufacture` (integer)
- `insurance_type` — comprehensive / third_party / third_party_fire_theft
- `insurance_expiry_date` (`YYYY-MM-DD`, must be after today)
- `mot_expiry_date` (optional, `YYYY-MM-DD`)

**Documents** (file fields, jpg/jpeg/png/pdf, max 5MB each)
- `documents[driving_licence_front]` (required)
- `documents[driving_licence_back]` (required)
- `documents[id_proof]` (required)
- `documents[insurance_certificate]` (required)
- `documents[vehicle_registration_certificate]` (optional)

Wrapped in a single DB transaction — if any step fails, the whole submission
rolls back so the driver retries with no partial state.

---

### Per-step endpoints (for editing later)

The endpoints below let drivers update one section at a time after the
initial submission (used on the "Account Details" edit screen).

### Step 1 — Bank Details

```
PUT /api/driver/profile/bank-details
```

**Request:**
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

### Step 2 — Vehicle Details

```
PUT /api/driver/profile/vehicle-details
```

**Request:**
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

### Step 3 — Document Upload

Upload multiple in one request (multipart/form-data):

```
POST /api/driver/profile/documents
```

Form fields:
- `documents[driving_licence_front]` (file)
- `documents[driving_licence_back]` (file)
- `documents[id_proof]` (file)
- `documents[insurance_certificate]` (file)
- `documents[vehicle_registration_certificate]` (file)

Allowed types: `jpg, jpeg, png, pdf`. Max 5MB each.

### Re-upload a Single Document

```
POST /api/driver/profile/documents/single
```

Form fields:
- `type` — one of the document types above
- `file` — the file to upload
- `expires_at` — optional date

Re-uploading replaces the existing document for that type (old file is removed
from storage).

### Submit for Verification

```
POST /api/driver/profile/submit-for-verification
```

Marks `approval_status = pending` so admin can review and approve/reject.
Shown to the driver as "Document Verification In Progress".

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

### Migration

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
