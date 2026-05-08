# SwiftDrop — Project Context for Claude

> **Purpose of this file:** Give Claude (or any AI assistant) the minimum context needed to work on the SwiftDrop codebase without re-reading the full 60+ page SRS every session. Read this first. The full SRS (`SwiftDrop_v_1_SRS.docx`) is the source of truth for anything ambiguous.

---

## 1. What SwiftDrop is

SwiftDrop is a multi-platform, on-demand **food delivery system** connecting four user types in one ecosystem:

- **Customers** — browse restaurants, order food, track deliveries (mobile + web)
- **Drivers** — accept deliveries, navigate, update status (mobile)
- **Restaurants** — manage menus, process orders (web panel)
- **Admins** — monitor and configure the platform (web panel)

Think Zomato / DoorDash / Uber Eats. The architecture is client-server with REST APIs, WebSockets for real-time updates, and integrations for payments, maps, SMS, email, and push notifications.

---

## 2. Tech architecture (as specified in SRS)

| Layer | Choice |
|---|---|
| Customer / Driver apps | Android + iOS (native or cross-platform) |
| Restaurant / Admin panels | Web (modern browsers) |
| Backend | Cloud-hosted services exposing REST APIs |
| Real-time | WebSocket (or similar) for tracking + status |
| Database | Relational (primary), with caching for hot data |
| Hosting | Cloud (AWS / Azure / similar), auto-scaling |
| Data format | JSON over HTTPS |

**External integrations:** payment gateway, mapping/navigation, push notification service, SMS gateway, email service.

> ⚠️ The SRS does **not** lock in specific frameworks (e.g., React Native vs Flutter, Node vs Django, Postgres vs MySQL). Confirm the chosen stack with the team before generating implementation code, or ask the user if it isn't clear from the codebase.

---

## 3. Core data model

These are the entities Claude will touch most often. All IDs are unique identifiers; relationships are noted in parentheses.

- **User** — base entity (role, mobile, email, status). Every customer/driver/restaurant-user/admin has a User record.
- **CustomerProfile** (1↔1 User) — name, saved addresses, preferences.
- **DriverProfile** (1↔1 User) — name, vehicle type/number, availability (online/offline).
- **Restaurant** — name, address, status, rating. Has many **MenuItems**.
- **MenuItem** — name, description, price, category, availability.
- **Order** (Customer 1→N, Restaurant 1→N) — total, status, timestamps. Has many **OrderItems**, one **Payment**, one **Delivery**.
- **OrderItem** — item snapshot, quantity, price, customizations.
- **Payment** — method (card/UPI/COD), status, transaction ID.
- **Delivery** — assigned driver, status, ETA. One per order.
- **ReviewAndRating** — customer feedback on restaurant + delivery.
- **CouponAndOffer** — discount rules, validity, eligibility.

**Key relationships to remember:**
- One order → one restaurant, one payment, one delivery, many order items.
- One delivery → one driver.
- A user has exactly one role-specific profile.

---

## 4. The order lifecycle (memorize this)

Every order moves through these states in order. **Invalid transitions must be rejected.**

```
Placed → Accepted → Preparing → Ready for Pickup
       → Out for Delivery → Delivered
                          ↘ Cancelled (from any pre-Delivered state)
```

**Who can change what:**
- *Restaurant* sets: Accepted, Preparing, Ready for Pickup
- *Driver* sets: Out for Delivery (after pickup), Delivered
- *System* sets: Placed, Cancelled (auto-cancel on timeout/payment-fail/no-driver)
- *Customer* can request: Cancelled (only before preparation starts, per Section 8.3.1)
- *Admin* can override: any transition (logged in audit trail)

---

## 5. Module map (where to find what)

When asked to work on a feature, map it to its module:

| Module | Owns | Key use cases (SRS §5) |
|---|---|---|
| **Customer** | auth, discovery, cart, checkout, tracking, history, reviews, coupons | Register/Login, Browse, Add to Cart, Place Order, Track Order |
| **Driver** | onboarding, availability, accept/reject, navigation, status updates, earnings | Accept Delivery, Update Delivery Status |
| **Restaurant** | profile, menu CRUD, order accept/reject, prep status, sales reports | Accept/Reject Order, Update Order Status |
| **Admin** | dashboard, user mgmt, order monitoring, support, offers, platform config | Manage Users, Monitor Orders |
| **Notifications** | push/SMS/email/in-app routing, retries, fallbacks, preferences | (cross-cutting; SRS §11) |
| **Reporting** | order/revenue/user/delivery/cancellation reports + real-time dashboards | (cross-cutting; SRS §12) |

---

## 6. Non-negotiable rules

These come up constantly. When in doubt, default to these:

### Auth
- Customer + driver login → **mobile + OTP**.
- Restaurant + admin login → **credentials** (username/password).
- All access is **RBAC**. Never expose endpoints without role checks.
- Sessions auto-timeout on inactivity.

### Payments
- Online payment **must succeed before** the order is created. Don't create an order on a failed payment.
- Detect duplicate payments via unique idempotency keys.
- COD orders skip the gateway and create directly.
- Refunds go back through the original payment method.

### Cancellation refunds
- Cancel **before preparation** → full refund.
- Cancel **after preparation starts** → partial / no refund (per platform policy — confirm with team).
- Restaurant rejection after payment → automatic full refund.

### Driver assignment
- Only **online** drivers receive requests.
- Assignment considers proximity, availability, workload.
- Reject or no-response → reassign to another driver.
- No driver available after retries → escalate or auto-cancel.

### Data integrity
- Multi-step operations must be **atomic** — rollback on partial failure.
- Prevent duplicate order creation via idempotency keys / unique request IDs.
- Sensitive data (credentials, payment details) must be encrypted at rest and in transit.
- The platform **does not store raw card numbers** — use the gateway's tokenization.

### Communication
- All client↔backend traffic over **HTTPS**.
- Real-time channels (tracking, status) over **WebSocket** (or equivalent persistent connection).

---

## 7. Edge cases Claude should always think about

When implementing any flow, mentally check these (from SRS §10):

1. **Payment succeeded but order creation failed** → log txn, retry create, else auto-refund.
2. **Restaurant doesn't respond in time** → auto-cancel + refund.
3. **Item becomes unavailable mid-order** → notify customer, offer modify or cancel.
4. **Driver accepts then cancels** → reassign immediately, notify customer of delay.
5. **Driver GPS unavailable** → fall back to last known location, inform customer of degraded tracking.
6. **Customer unreachable on delivery** → defined wait time, then mark failed delivery per policy.
7. **Push notification fails** → retry, then fall back to SMS for critical messages.
8. **Order stuck in intermediate state** → trigger admin alert.

If a flow doesn't handle one of these, flag it.

---

## 8. Non-functional bar

Don't sacrifice these for speed of implementation:

- **Performance** — handle peak meal-hour load, sub-second API responses, low-latency real-time updates.
- **Security** — encrypted comms, RBAC, rate limiting, input validation, audit logs for admin actions.
- **Reliability** — atomic transactions, retry mechanisms, no duplicate orders/payments.
- **Scalability** — stateless services, horizontal scaling, load balancing, regional expansion-ready.
- **Compatibility** — Android, iOS, modern browsers, varying screen sizes.

---

## 9. How Claude should work on this project

### Before writing code
1. **Identify the module(s)** the request touches (Customer / Driver / Restaurant / Admin / Notifications / Reporting).
2. **Locate the relevant SRS section** if the requirement is non-trivial:
   - Features overview → §3
   - Use cases / flows → §5
   - Data model → §6
   - Business rules → §8
   - Workflows → §9
   - Edge cases → §10
3. **Check the order state machine** if the change touches an order.
4. **Check applicable business rules** (payments §8.4, refunds §8.5, cancellation §8.3, etc.).

### When implementing
- Match field names to the **data dictionary** (SRS §6.3) so naming stays consistent.
- Wrap multi-step operations (order + payment + delivery creation) in a transaction.
- Always validate role + permission server-side, not just in the client.
- Emit notifications on lifecycle events (see §11.2 for triggers per role).
- Log critical actions (auth, order creation, payment, admin actions) for audit (§13.6).

### When unsure
- Ambiguous requirement → check the SRS first, then ask the user.
- Feature not in SRS → likely belongs in **Future Enhancements (§16)** — confirm scope before building.
- Conflict between SRS sections → flag to the user; don't silently pick one.

### What NOT to do
- Don't store raw card numbers or full payment details.
- Don't allow order status transitions that skip steps (e.g., Placed → Delivered).
- Don't create an order before payment confirmation (for online payments).
- Don't disable critical notifications (OTP, order status) via user preferences.
- Don't hardcode third-party API keys, commission rates, or delivery charges — these are platform configs (§3.4.7).

---

## 10. Glossary (quick reference)

- **OTP** — one-time password for mobile auth
- **ETA** — estimated time of arrival
- **RBAC** — role-based access control
- **COD** — cash on delivery
- **Order Lifecycle** — Placed → Accepted → Preparing → Ready → Out for Delivery → Delivered (or Cancelled)
- **Commission** — platform fee taken from restaurant on each order
- **Delivery Fee** — charge to customer for delivery (variable by distance/demand)

---

## 11. Document conventions

- Section references like "§5.1.4" or "SRS §8.3" point to the SRS document.
- "Out of scope" or "future" features live in SRS §16 — don't build them unless explicitly asked.
- The SRS uses "should" liberally; treat business rules (§8) and security requirements (§13) as **must**.

---

*Last updated to match: SwiftDrop SRS v1. If the SRS is updated, refresh this file.*