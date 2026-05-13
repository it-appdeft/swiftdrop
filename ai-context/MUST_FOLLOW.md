# SwiftDrop – Enterprise Development Standards & Rules

## Project Overview

SwiftDrop is an enterprise-level food delivery platform consisting of:

- Mobile Applications
- Laravel API Backend
- Laravel Web Application
- Laravel Admin Panel
- Inertia React Frontend
- MySQL Database
- Queue & Background Processing

This project MUST follow scalable architecture, reusable development patterns, clean code standards, and optimized system design.

---

# Core Development Principles

## MUST FOLLOW

- Write clean and readable code
- Write scalable architecture
- Keep code reusable
- Follow SOLID principles
- Follow DRY (Don't Repeat Yourself)
- Follow KISS (Keep It Simple)
- Use meaningful naming conventions
- Avoid duplicate logic
- Maintain proper project structure
- Optimize performance from beginning
- Write maintainable code
- Keep modules isolated
- Maintain consistency across entire project

---

# Project Architecture Rules

## MUST FOLLOW LAYERED ARCHITECTURE

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Model / Database
```

---

# Laravel Backend Standards

# 1. MUST Use Eloquent ORM

All database operations MUST use Eloquent ORM.

GOOD:

```php
User::where('status', UserStatusEnum::ACTIVE)->get();
```

BAD:

```php
DB::select("SELECT * FROM users");
```

---

# 2. MUST NOT Use Raw Queries

Raw SQL queries are NOT allowed unless absolutely necessary for performance optimization.

BAD:

```php
DB::statement("SELECT * FROM orders");
```

Use:

- Eloquent
- Query Builder
- Relationships
- Scopes

---

# 3. MUST Use Enum Classes

Never hardcode statuses or types.

BAD:

```php
if ($order->status == 'pending')
```

GOOD:

```php
if ($order->status === OrderStatusEnum::PENDING)
```

Examples:

```text
OrderStatusEnum
PaymentStatusEnum
UserRoleEnum
DeliveryStatusEnum
TransactionStatusEnum
```

---

# 4. MUST Use Service Classes

All business logic MUST stay inside Services.

Controllers MUST remain thin.

GOOD:

```php
$this->orderService->create($request->validated());
```

BAD:

```php
public function store()
{
    // business logic here
}
```

---

# 5. MUST Use Request Classes

Validation MUST stay inside Request classes.

GOOD:

```text
StoreOrderRequest
UpdateProfileRequest
CreateRestaurantRequest
```

BAD:

```php
$request->validate([...]);
```

inside controllers.

---

# 6. MUST Use Repository Pattern

Database logic MUST stay inside repositories.

Structure:

```text
Repositories/
├── Contracts/
└── Eloquent/
```

Repositories should handle:

- Queries
- Filters
- Database operations
- Reusable DB logic

---

# 7. MUST Use Event & Listener

Use event-driven architecture for decoupled systems.

Examples:

```text
OrderPlacedEvent
PaymentSuccessEvent
DriverAssignedEvent
```

Listeners:

```text
SendOrderNotificationListener
GenerateInvoiceListener
UpdateAnalyticsListener
```

---

# 8. MUST Use Jobs for Heavy Tasks

Heavy operations MUST use queues/jobs.

Examples:

- Emails
- Notifications
- Reports
- PDF generation
- Image processing
- Analytics
- Push notifications

---

# 9. MUST Use Console Commands

Scheduled and maintenance operations MUST use commands.

Examples:

```text
orders:expire
reports:generate
drivers:sync
```

---

# 10. MUST Use Custom Exceptions

Create domain-based exceptions.

BAD:

```php
throw new Exception();
```

GOOD:

```php
throw new OrderException('Order already completed');
```

Examples:

```text
OrderException
PaymentException
RestaurantException
```

---

# 11. MUST Use Policies

Authorization MUST use Laravel Policies.

Never write authorization logic directly in controllers.

GOOD:

```php
$this->authorize('update', $order);
```

---

# 12. MUST Use API Resources

Never return models directly.

GOOD:

```text
OrderResource
UserResource
RestaurantResource
```

BAD:

```php
return $order;
```

---

# 13. MUST Use Database Transactions

Critical operations MUST use transactions.

GOOD:

```php
DB::transaction(function () {
    // operations
});
```

Examples:

- Payments
- Wallet updates
- Order placement
- Refunds

---

# 14. MUST Use Proper Relationships

Use Eloquent relationships properly.

GOOD:

```php
$order->user
$order->items
$restaurant->menus
```

Avoid unnecessary manual joins.

---

# 15. MUST Use Eager Loading

Prevent N+1 query problems.

GOOD:

```php
Order::with(['user', 'items'])->get();
```

BAD:

```php
foreach ($orders as $order) {
    $order->user;
}
```

---

# 16. MUST Use Scopes

Reusable query filters MUST use scopes.

GOOD:

```php
User::active()->verified()->get();
```

---

# 17. MUST Use Observers

Use observers for model-related actions.

Examples:

- Slug generation
- Activity logging
- Audit trails

---

# 18. MUST Keep Controllers Thin

Controllers should ONLY:

- Validate request
- Call service
- Return response

Controllers MUST NOT contain:

- Business logic
- Huge queries
- Complex processing

---

# 19. MUST Use Helper Functions Carefully

Helpers should contain only generic reusable utilities.

GOOD:

```text
currencyFormat()
generateSlug()
fileUrl()
```

Helpers MUST NOT contain business logic.

---

# 20. MUST Use Dependency Injection

Always use dependency injection.

BAD:

```php
new OrderService();
```

GOOD:

```php
public function __construct(
    protected OrderService $orderService
) {}
```

---

# 21. MUST Use Interfaces

Repositories and services should use interfaces where needed.

Examples:

```text
OrderRepositoryInterface
PaymentGatewayInterface
```

---

# 22. MUST Use Proper Naming

GOOD:

```text
OrderService
ProcessPaymentJob
CreateOrderRequest
```

BAD:

```text
Helper
TestService
DoSomething()
```

---

# 23. MUST Write Reusable Code

Avoid duplicate logic.

If code repeats:

- Create service
- Create helper
- Create trait
- Create reusable component

---

# 24. MUST Remove Debug Code

Production code MUST NOT contain:

```text
dd()
dump()
console.log()
var_dump()
print_r()
```

---

# React + Inertia Standards

# 1. MUST Create Reusable Components

Examples:

```text
Button
Input
Modal
Table
Select
Badge
Loader
Pagination
Toast
```

---

# 2. MUST Keep Components Small

Avoid huge components.

Split into reusable smaller components.

---

# 3. MUST Keep Pages Clean

Pages should only handle rendering.

Move logic into:

- hooks
- services
- utilities

---

# 4. MUST Centralize API Calls

Never call APIs directly inside components.

GOOD:

```text
services/orderService.js
```

BAD:

```js
axios.get(...)
```

inside component.

---

# 5. MUST Use Custom Hooks

Examples:

```text
useAuth
usePagination
useDebounce
useOrderTracking
```

---

# 6. MUST Use Proper Folder Structure

```text
resources/js/
├── Components/
├── Pages/
├── Layouts/
├── Hooks/
├── Services/
├── Utils/
├── Store/
├── Context/
└── Types/
```

---

# 7. MUST Use Proper Form Handling

Use:

- React Hook Form
- Validation libraries

---

# 8. MUST Use Lazy Loading

Use lazy loading for pages/components.

Improve performance.

---

# 9. MUST Use Global Error Handling

Implement:

- Toast notifications
- Error boundaries
- API error handlers

---

# 10. MUST Avoid Inline Logic

Avoid huge inline conditions and functions inside JSX.

---

# API Standards

# MUST FOLLOW

- APIs MUST be versioned
- APIs MUST use consistent responses
- APIs MUST use proper HTTP status codes
- APIs MUST use Resources
- APIs MUST use pagination
- APIs MUST use authentication
- APIs MUST use rate limiting

---

# Standard API Response

SUCCESS:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

ERROR:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}
```

---

# Database Standards

# MUST FOLLOW

- Use foreign keys
- Use indexes
- Use timestamps
- Use proper column types
- Avoid unnecessary nullable fields
- Normalize properly
- Use soft deletes only when needed

---

# Migration Rules

GOOD:

```php
$table->foreignId('user_id')->constrained();
$table->index(['status', 'created_at']);
```

---

# Security Standards

# MUST FOLLOW

- Never trust frontend validation
- Always validate uploads
- Prevent SQL injection
- Prevent XSS attacks
- Use CSRF protection
- Use secure authentication
- Store secrets only in .env
- Never expose sensitive data

---

# Queue & Background Processing Standards

Use queues for:

- Emails
- Notifications
- Reports
- Analytics
- File processing
- Push notifications

Recommended:

```text
Redis + Horizon
```

---

# Performance Standards

# MUST FOLLOW

- Avoid N+1 queries
- Use eager loading
- Use caching
- Optimize images
- Optimize database queries
- Use chunking for large datasets
- Avoid unnecessary loops
- Queue heavy operations

---

# Logging Standards

Use structured logs.

Never leave random logs.

Use channels:

```text
daily
stack
slack
```

---

# Git Standards

# Branch Structure

```text
main
develop
api
web-admin
```

---

# Branch Responsibilities

## api branch

Responsible for:

```text
API
Services
Repositories
Database
Enums
Jobs
Events
Policies
Backend architecture
```

---

## web-admin branch

Responsible for:

```text
React
Inertia
Admin panel
Web frontend
Reusable UI components
```

---

# Commit Standards

```text
feat:
fix:
refactor:
docs:
chore:
```

Examples:

```text
feat: add order tracking API
fix: resolve payment issue
refactor: optimize order service
```

---

# Code Formatting Standards

Mandatory tools:

```text
Laravel Pint
PHPStan
ESLint
Prettier
```

All code MUST pass formatting before push.

---

# Environment Standards

Separate environments:

```text
local
staging
production
```

Never expose secrets.

Use `.env` properly.

---

# Testing Standards

Mandatory tests:

- Feature tests
- Unit tests
- API tests

Critical modules MUST have tests:

- Authentication
- Payments
- Orders
- Delivery system

---

# Monitoring Standards

Use:

- Laravel Telescope
- Horizon
- Sentry
- Uptime monitoring

---

# Prohibited Practices

# STRICTLY NOT ALLOWED

- Raw queries without approval
- Business logic inside controllers
- Validation inside controllers
- Duplicate code
- Huge React components
- Hardcoded values
- Unoptimized queries
- Direct DB access inside frontend
- Unused imports
- Random helper functions
- Console logs in production
- dd() in production
- dump() in production

---

# Final Golden Rules

1. Controllers MUST stay thin
2. Services MUST contain business logic
3. Repositories MUST handle DB operations
4. Requests MUST handle validation
5. Policies MUST handle authorization
6. Enums MUST handle statuses/types
7. Jobs MUST handle heavy tasks
8. Events MUST decouple logic
9. Components MUST be reusable
10. Code MUST stay clean and scalable

---

# Development Mindset

Always write code like:

- Another developer will maintain it
- The project will scale to millions of users
- The module will grow in future
- The code will be reused elsewhere

Clean architecture today prevents technical debt tomorrow.

---