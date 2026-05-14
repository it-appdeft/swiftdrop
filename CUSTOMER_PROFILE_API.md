# Customer Profile API Documentation

## Overview
Customer profile management API with OTP-verified phone/email changes and address management.

## API Endpoints

### Profile Management

#### Get Profile
```
GET /api/customer/profile
```
Returns customer profile with all addresses.

#### Update Profile
```
PUT /api/customer/profile
```
Update name, avatar, and date of birth.

**Request:**
```json
{
  "name": "John Doe",
  "profile_photo": "url/to/photo",
  "date_of_birth": "1990-01-15"
}
```

### Phone Number Management

#### Initiate Phone Change
```
POST /api/customer/profile/change-phone/initiate
```
Send OTP to new phone number. Verifies phone uniqueness.

**Request:**
```json
{
  "mobile": "1234567890",
  "country_code": "+1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to new phone number.",
  "data": {
    "target": "+11234567890",
    "expires_in": 300,
    "test_code": "1234"
  }
}
```

#### Complete Phone Change
```
POST /api/customer/profile/change-phone/verify
```
Verify OTP and update phone number. User remains same, only contact info updates.

**Request:**
```json
{
  "mobile": "1234567890",
  "country_code": "+1",
  "code": "1234"
}
```

### Email Management

#### Initiate Email Change
```
POST /api/customer/profile/change-email/initiate
```
Send OTP to new email. Verifies email uniqueness.

**Request:**
```json
{
  "email": "newemail@example.com"
}
```

#### Complete Email Change
```
POST /api/customer/profile/change-email/verify
```
Verify OTP and update email address.

**Request:**
```json
{
  "email": "newemail@example.com",
  "code": "1234"
}
```

### Address Management

#### Add Address
```
POST /api/customer/addresses
```
Add new address. First address becomes default automatically.

**Request:**
```json
{
  "label": "Home",
  "address_line_1": "123 Main St",
  "address_line_2": "Apt 4B",
  "city": "New York",
  "county": "NY",
  "postcode": "10001",
  "lat": 40.7128,
  "lng": -74.0060,
  "is_default": false
}
```

#### Update Address
```
PUT /api/customer/addresses/{addressId}
```
Update address details. All fields optional.

#### Delete Address
```
DELETE /api/customer/addresses/{addressId}
```
Delete address. Auto-sets another as default if needed.

#### Set Default Address
```
POST /api/customer/addresses/{addressId}/set-default
```
Mark address as default. Unsets other defaults.

## Architecture

### Directory Structure
```
app/
├── Contracts/Profile/
│   └── CustomerProfileServiceInterface.php
├── Services/Profile/
│   └── CustomerProfileService.php
├── Http/
│   ├── Controllers/Api/Customer/
│   │   └── CustomerProfileController.php
│   ├── Requests/Customer/Profile/
│   │   ├── UpdateProfileRequest.php
│   │   ├── InitiatePhoneChangeRequest.php
│   │   ├── InitiateEmailChangeRequest.php
│   │   ├── CompletePhoneChangeRequest.php
│   │   ├── CompleteEmailChangeRequest.php
│   │   ├── AddAddressRequest.php
│   │   └── UpdateAddressRequest.php
│   └── Resources/Customer/
│       ├── CustomerProfileResource.php
│       └── AddressResource.php
```

### Key Features

1. **OTP Verification Flow**
   - Reuses existing OtpService for consistency
   - Supports SMS (mobile) and EMAIL channels
   - Automatic rate limiting and expiration

2. **Uniqueness Validation**
   - Phone/Email checked against existing users
   - Only allows change if unique or belongs to current user
   - Prevents duplicate phone/email in system

3. **Transaction Safety**
   - All operations wrapped in DB::transaction()
   - Atomic address updates (prevents orphaned records)
   - Automatic default address management

4. **Address Management**
   - Automatic default assignment for first address
   - Prevents orphaned defaults on deletion
   - Supports multiple labeled addresses (Home, Work, Other)
   - GPS coordinates with proper validation

## Request Validation

All requests use form validation with:
- Canonicalization (normalize phone/email format)
- OTP verification for sensitive changes
- Standard Laravel rules
- Reuses CanonicalizesTarget trait for consistency

## Services & Interfaces

**CustomerProfileServiceInterface** defines:
- `updateProfile(User, array): User`
- `initiatePhoneChange(User, string, string): void`
- `initiateEmailChange(User, string): void`
- `completePhoneChange(User, string, string): User`
- `completeEmailChange(User, string, string): User`
- `addAddress(User, array): CustomerAddress`
- `updateAddress(User, int, array): CustomerAddress`
- `deleteAddress(User, int): bool`
- `setDefaultAddress(User, int): CustomerAddress`

All implementations follow the same pattern as RegistrationService:
- Constructor injection of dependencies
- DB::transaction() for atomicity
- Proper error handling with custom exceptions

## Models Used

- **User** - Core user with mobile/email
- **CustomerProfile** - Profile details (name, avatar, DOB)
- **CustomerAddress** - Saved addresses with labels

## Testing Endpoints

All authenticated endpoints require `Authorization: Bearer {token}` header.

Use test OTP from response: `test_code` field (only in dev/staging).
