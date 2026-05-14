# Common Mobile Login API (Customer + Driver)

## Overview
A single mobile-OTP login flow shared by the customer and driver apps. Login is
mobile-only — the email field is not used. The user's role (`customer` /
`driver`) is returned in the response so the client can route to the right
home screen.

---

## Step 1 — Send Login OTP

```
POST /api/auth/login/send-otp
```

**Request:**
```json
{
  "country_code": "+44",
  "mobile": "7700900123"
}
```

**Behaviour:**
1. Canonicalises mobile (`country_code + mobile`, or as-is if it begins with `+`).
2. Looks up `users.mobile`.
3. If the mobile is **not registered**, returns `404` with:
   ```json
   {
     "success": false,
     "message": "This mobile number is not registered. Please sign up first.",
     "errors": { "mobile": ["This mobile number is not registered. Please sign up first."] }
   }
   ```
4. Otherwise sends an SMS OTP and returns `200`:
   ```json
   {
     "success": true,
     "message": "OTP sent.",
     "data": {
       "target": "+447700900123",
       "expires_in": 300,
       "test_code": "1234"
     }
   }
   ```
   `test_code` is only populated in dev/staging when `OTP_TEST_CODE` is set.

---

## Step 2 — Verify Login OTP

```
POST /api/auth/login/verify-otp
```

**Request:**
```json
{
  "country_code": "+44",
  "mobile": "7700900123",
  "code": "1234"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Authenticated.",
  "data": {
    "user": {
      "id": 12,
      "name": "Alexandra Arnold",
      "email": "alex@example.com",
      "mobile": "+447700900123",
      "status": "active",
      "roles": ["driver"],
      "created_at": "2026-04-30T09:12:00.000000Z"
    },
    "token": "1|abc123…"
  }
}
```

The same endpoint serves customer and driver — read `user.roles[0]` to decide
which app surface to load.

If the mobile is no longer registered (deleted between send and verify) the
endpoint returns the same `404 mobileNotRegistered` error as send-otp. If the
OTP is invalid/expired it returns `422` with the standard
`OtpException::invalidCode` payload.

---

## Registration vs Login

| Concern                | Endpoint                          |
|------------------------|-----------------------------------|
| Login (existing user)  | `/api/auth/login/send-otp` + `/api/auth/login/verify-otp` |
| Sign-up: send OTP      | `/api/auth/send-otp` (allows new mobile/email) |
| Sign-up: verify OTP    | `/api/auth/verify-otp` |
| Sign-up: create user   | `/api/auth/register/{customer\|driver}` |

### Sign-up Response

`POST /api/auth/register/{customer|driver}` returns the same shape as
`login/verify-otp` — `{ user, token }` — so the client drops the user
straight into the app after registration:

```json
{
  "success": true,
  "message": "Driver registered.",
  "data": {
    "user": { "id": 12, "name": "...", "roles": ["driver"], ... },
    "token": "1|abc123…"
  }
}
```

### Driver Sign-up Includes Profile Photo

Driver registration is multipart and **requires** `profile_photo`
(`jpg/jpeg/png/webp`, max 2 MB). The image is stored under
`storage/app/public/driver/profile/` and saved to
`driver_profiles.profile_photo`.

Customer registration does **not** accept `profile_photo` — they upload it
later via `PUT /api/customer/profile`.

| Field           | Customer | Driver        |
|-----------------|----------|---------------|
| name            | required | required      |
| email           | required | required      |
| country_code    | required | required      |
| mobile          | required | required      |
| profile_photo   | —        | required (file) |

The two send/verify endpoints are intentionally separate:
- **`login/send-otp`** rejects mobiles that don't exist (so the app shows
  "register first").
- **`send-otp`** accepts any mobile/email — it's used during sign-up where
  the user record doesn't exist yet.

---

## Uniqueness Guarantees

`users.mobile` and `users.email` are both `UNIQUE` at the database level.
Registration requests now also enforce this in validation:

- `RegisterRequest`, `RegisterCustomerRequest`, `RegisterRestaurantRequest`
  - `email` → `unique:users,email`
  - `mobile` → custom `withValidator` check on the **canonical** mobile
    (`country_code + mobile`), so `(+44, 7700900123)` and
    `(+44, 077-009-00123)` are treated as the same number.

Attempting to register with a mobile that already exists returns `422` with
`{ "errors": { "mobile": ["This mobile number is already registered."] } }`.
