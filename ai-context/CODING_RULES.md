# Coding Rules (Strict)

These rules are mandatory. Any deviation must be explicitly approved.

---

## 1. Laravel (Backend)

### 1.1 Architecture
- Controllers MUST NOT contain business logic.
- All business logic MUST reside in Service classes.
- Data access MUST be handled via Repository layer only.
- Direct model queries inside controllers are strictly prohibited.

---

### 1.2 Folder Structure (Mandatory)
Each module must follow:

/Modules/{ModuleName}/
  - Controllers/
  - Services/
  - Repositories/
  - Models/
  - Requests/
  - Routes/

---

### 1.3 Validation
- All input MUST be validated using Form Request classes.
- No inline validation inside controllers.

---

### 1.4 Database Access
- Use Repository layer only.
- No direct DB queries in Controllers or Services.
- Use transactions for critical operations (orders, payments).

---

### 1.5 Error Handling
- All APIs MUST return standardized responses:
  - success: boolean
  - message: string
  - data: object/null
  - error: object/null
- No unhandled exceptions.
- Use try-catch in Service layer for critical operations.

---

### 1.6 API Design
- APIs must be RESTful.
- Use consistent naming conventions.
- No breaking changes without versioning.

---

### 1.7 Idempotency (Critical)
- Order creation, payments, and wallet operations MUST be idempotent.
- Duplicate requests MUST NOT create duplicate records.

---

---

## 2. React (Frontend)

### 2.1 Component Rules
- Only functional components allowed.
- No business logic inside UI components.
- Logic must be separated using hooks/services.

---

### 2.2 UI States (Mandatory)
Every API-based screen MUST handle:
- Loading state
- Error state
- Empty state

---

### 2.3 Structure
- Reusable components must be created for repeated UI.
- No duplicate UI logic across components.

---

### 2.4 API Handling
- All API calls must be centralized (service layer).
- No direct API calls inside components.

---

---

## 3. Node.js (Services)

### 3.1 Architecture
- Each service must be isolated:
  - Driver Assignment Service
  - Tracking Service
  - Notification Service

---

### 3.2 Code Structure
- Use modular architecture.
- Separate:
  - Controllers (if any)
  - Services
  - Event handlers

---

### 3.3 Async Handling
- Only async/await allowed.
- No callbacks.
- No blocking operations.

---

### 3.4 Event Handling
- All inter-service communication MUST use RabbitMQ.
- Services MUST be stateless.

---

### 3.5 Failure Handling
- Retry logic required for:
  - Driver assignment
  - Event processing
- Must handle:
  - Timeout
  - No data
  - Service failure

---

---

## 4. General Rules (Non-Negotiable)

### 4.1 Input Validation
- Every input must be validated (frontend + backend).
- Never trust client input.

---

### 4.2 Error Handling
- No silent failures.
- Every failure must return a controlled response.

---

### 4.3 Logging
- All critical operations must be logged:
  - Orders
  - Payments
  - Driver assignment
- Logs must include:
  - timestamp
  - request ID
  - error details

---

### 4.4 No Code Duplication
- Shared logic must be abstracted.
- Duplicate code is not allowed.

---

### 4.5 Naming Conventions
- Use clear and meaningful names.
- No abbreviations or unclear naming.

---

### 4.6 Scalability
- Code must be stateless where possible.
- Avoid tight coupling.
- Must support horizontal scaling.

---

### 4.7 Performance
- Avoid unnecessary DB queries.
- Use indexing where required.
- Use caching (Redis) for frequently accessed data.

---

### 4.8 Security
- Validate all inputs
- Sanitize data
- Protect APIs with authentication
- No sensitive data in logs

---

---

## 5. Code Review Checklist (Mandatory)

Every PR must verify:

- No business logic in controllers
- Proper validation implemented
- Error handling present
- No duplicate code
- Follows folder structure
- API response format consistent
- Edge cases handled

PR must be rejected if any rule is violated.