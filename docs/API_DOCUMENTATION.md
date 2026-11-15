# REST API Documentation: SunGrid Customer Return Exception Control

**Author:** Karthik Thalipineni  
**Base URL:** `http://localhost:5000/api` (Local Dev) / `https://<render-service-url>/api` (Production)  
**Authentication Scheme:** Bearer Token (JWT) in HTTP `Authorization` header  

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticates an operator and returns a signed 24-hour JWT token.

- **Rate Limit:** 100 requests per 15 minutes per IP.
- **Request Body:**
  ```json
  {
    "email": "sundaram@sungrid.com",
    "password": "SunGrid@2026!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "e8a93bf8-...",
      "name": "P. Sundaram",
      "email": "sundaram@sungrid.com",
      "role": "RETURNS_MANAGER"
    }
  }
  ```

### `GET /api/auth/me`
Retrieves current authenticated operator profile.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):** User object with `id`, `name`, `email`, `role`.

---

## 2. Core Return Record Endpoints

### `GET /api/health`
System health check, database connectivity status, and SAP adapter state.
- **Response (200 OK):**
  ```json
  {
    "status": "ONLINE",
    "enterprise": "SunGrid Renewables",
    "database": "CONNECTED (Neon PostgreSQL)",
    "recordsCount": 8,
    "sapAdapter": { "modeLabel": "Demo Mode (Local SAP S/4HANA Adapter)", "status": "HEALTHY" }
  }
  ```

### `GET /api/returns`
Lists return records with dynamic multi-factor risk, ageing, and validation enrichment.
- **Query Parameters (Optional):**
  - `search`: Case-insensitive text search across document numbers, materials, and exception reasons.
  - `plant`: Filter by plant code (`1108` or `1102`).
  - `riskLevel`: Filter by tier (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
  - `processingStatus`: Filter by lifecycle state (`Unassigned`, `Partially Processed`, `Pending Approval`, `Completed`).
  - `owner`: Filter by assigned operator name or `unassigned`.
- **Response (200 OK):** Array of enriched return objects.

### `GET /api/returns/:id`
Retrieves a single return case by either internal ID (`RET-2026-001`) or SAP document number (`INV-460008`).

### `POST /api/returns/:id/assign`
Assigns or reassigns an accountable case owner.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "newOwner": "P. Sundaram (Returns Manager)",
    "reason": "Escalated due to high exposure exceeding £20k",
    "actor": "P. Sundaram",
    "persona": "Returns Manager"
  }
  ```
- **Database Behavior:** Atomic transaction updates `ReturnRecord.assignedOwner` and inserts a new `AuditLog` row.

### `POST /api/returns/:id/comment`
Appends an operational note to the collaboration thread.
- **Request Body:**
  ```json
  {
    "text": "Confirmed warehouse inspection sheet #QA-412 at Plant 1108 SL11.",
    "author": "A. Sharma (Returns Analyst)",
    "persona": "Returns Analyst"
  }
  ```
- **Database Behavior:** Inserts into `ReturnComment` and creates an `AuditLog` record.

### `POST /api/returns/:id/action`
Executes an operational workflow decision (`APPROVE`, `REJECT`, `REQUEST_APPROVAL`).
- **Authorization:** Enforces RBAC permissions based on user persona and financial exposure.
- **Request Body:**
  ```json
  {
    "actionType": "APPROVE",
    "targetStatus": "Completed",
    "reason": "Approved quantity adjustment to 10 units and released billing block.",
    "actor": "P. Sundaram",
    "persona": "Returns Manager"
  }
  ```
- **Database Behavior:** Atomic transaction updates `ReturnRecord`, inserts into `ReturnEvent`, inserts into `Approval`, creates `AuditLog`, and invokes `sapAdapter.postReturnAction()`.

---

## 3. Analytics, Notifications & Admin Endpoints

### `GET /api/analytics`
Aggregates enterprise KPIs: active exceptions, total financial exposure at risk, overdue ageing buckets, SLA compliance percentage, plant distribution, and Pareto defect categories.

### `GET /api/notifications`
Retrieves database-backed operational alerts and SLA breach warnings.

### `PUT /api/notifications/:id/read`
Updates `Notification.isRead` to `true` in Neon PostgreSQL.

### `PUT /api/notifications/mark-all-read`
Batch-updates all unread notifications to `isRead: true` in Neon PostgreSQL.

### `POST /api/reset-data`
Admin-only endpoint that executes `prisma/seed.js` to reset the database to its pristine demo state.
