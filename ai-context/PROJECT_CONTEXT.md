# Project: SwiftDrop Food Delivery Platform

---

## 1. System Overview

SwiftDrop is a multi-city food delivery platform connecting:
- Customers
- Restaurants
- Delivery Drivers
- Admin

The platform supports:
- Food ordering
- Real-time delivery tracking
- Wallet & payments
- Config-driven pricing & commissions

---

## 2. Architecture

### Core Stack
- Backend: Laravel (Core APIs, Admin Panel, Restaurant Panel, Customer Web)
- Frontend: React (Admin + Restaurant + Customer Web)
- Mobile: Flutter (Customer + Driver Apps)
- Services: Node.js (Driver Assignment, Tracking, WebSockets)
- Messaging: RabbitMQ
- Cache: Redis
- Storage: AWS S3 (future-ready)

---

### Design Approach
- Modular Monolith (Laravel)
- Event-driven services (Node.js)
- Service separation for high-load components

---

## 3. Scale Assumptions

### Users
- MAU: 100,000 – 500,000
- DAU: 10,000 – 50,000

### Orders
- Peak per day: 5,000 – 20,000
- Peak per minute: 50 – 150

### Drivers
- Active (peak): 1,000 – 5,000

### Real-Time Load
- Location updates every 5 seconds
- 400 – 1,000 updates/sec expected

---

## 4. Performance Requirements

- API response: < 200ms
- Real-time latency: < 2 seconds
- Order success rate: > 99%
- Payment reliability: > 99.5%

---

## 5. Scalability Strategy

### Laravel
- Stateless APIs
- Horizontal scaling
- Load balancing

### Node Services
- Independent scaling
- Separate services:
  - Driver assignment
  - Tracking
  - WebSockets

### Database
- Primary: MongoDB or MySQL
- Indexed queries
- Future: Read replicas

### Redis
- Caching
- Driver live locations
- Session handling

### RabbitMQ
- Event-driven communication
- Retry mechanisms

---

## 6. Real-Time System

- Node handles high-frequency updates
- Laravel stores final states only
- WebSockets for live tracking

---

## 7. Core Modules

- Auth
- Users
- Restaurants
- Menu
- Orders
- Payments
- Wallet
- Drivers
- Notifications
- Admin Config

---

## 8. Core Flow

Customer → Browse → Order → Restaurant Accept →  
Driver Assigned → Pickup → Delivery → Completed

---

## 9. Constraints

- Clean architecture mandatory
- No business logic in controllers
- Idempotent APIs for critical operations
- Event-driven system
- Retry and fallback mechanisms required

---

## 10. Future Scalability

- Multi-city expansion
- Surge pricing
- Subscription plans
- Analytics dashboard
- AI recommendations