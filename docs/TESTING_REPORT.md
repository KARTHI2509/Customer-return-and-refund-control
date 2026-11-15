# Testing Report & Verification Evidence

**Author:** Karthik Thalipineni  
**Project:** SunGrid Customer Return Exception Control  
**Execution Timestamp:** 2026-11-15 11:18 IST  
**Environment:** Node.js v22.19.0, Prisma v6.19.3, Neon PostgreSQL 16 (AWS us-east-2)  

---

## 1. Executive Test Results Summary

| Total Test Cases | Passed | Failed | Status |
| :---: | :---: | :---: | :---: |
| **14** | **14** | **0** | **ALL TESTS PASSED (100%)** |

All tests were programmatically executed against live Neon PostgreSQL instances and active Node.js / Express servers.

---

## 2. Detailed Test Cases & Verification Results

| # | Test Case | Target Component | Expected Result | Actual Result | Status |
| :- | :--- | :--- | :--- | :--- | :---: |
| **1** | Database Connectivity | Neon PostgreSQL | Successful query to PostgreSQL server (`SELECT NOW()`) | Server timestamp returned: `Sun Nov 15 2026 11:18:07 GMT+0530` | **PASS** |
| **2** | Prisma CRUD Operations | `ReturnRecord` | Record created with Decimal amount and requested date | Created `TEST-RET-1794721686846` with Decimal `12500.50` | **PASS** |
| **3** | Foreign Key Relationships | `ReturnComment`, `ReturnEvent` | Child entities link to parent `ReturnRecordId` | Retrieved record with 1 comment and 1 timeline event intact | **PASS** |
| **4** | Cascade Deletion Integrity | Database Schema | Deleting parent record cascades to delete child comments | Remaining child comments count: `0` | **PASS** |
| **5** | Unique Constraint Enforcement | `ReturnRecord.sapDocument` | Duplicate `INV-460008` insertion rejected with error | Prisma rejected insertion with error code `P2002` | **PASS** |
| **6** | API Health Endpoint | `GET /api/health` | Returns `status: ONLINE` and `database: CONNECTED` | `status: 'ONLINE'`, `database: 'CONNECTED (Neon PostgreSQL)'`, `recordsCount: 8` | **PASS** |
| **7** | JWT Authentication & Login | `POST /api/auth/login` | Valid credentials return JWT token and role | HTTP 200 OK, token issued, role: `RETURNS_MANAGER` | **PASS** |
| **8** | Invalid Password Rejection | `POST /api/auth/login` | Incorrect password rejected with HTTP 401 | HTTP 401 Unauthorized | **PASS** |
| **9** | Returns Retrieval & Spotlight | `GET /api/returns` | Returns 8 records; verifies `INV-460008` (£23,500) | 8 records returned; `INV-460008` verified at Plant 1108, amount £23,500 | **PASS** |
| **10**| Logistics Org Unit Filter | `GET /api/returns?plant=1108` | Returns only Plant 1108 solar records | 5 records returned; all plant attributes equal `1108` | **PASS** |
| **11**| Live Comment Creation | `POST /api/returns/:id/comment` | Appends comment and creates audit log in PostgreSQL | Comment persisted, audit entry generated | **PASS** |
| **12**| Executive Analytics Engine | `GET /api/analytics` | Computes exposure at risk and ageing buckets | Active exceptions: 6; Exposure at risk: `£142,100`; Ageing buckets computed | **PASS** |
| **13**| Notification Persistence | `PUT /api/notifications/:id/read` | Toggles notification read status in PostgreSQL | Notification updated to `isRead: true` in Neon database | **PASS** |
| **14**| Process Lifecycle Persistence | Independent Node Process | Record inserted in Process 1 retrievable in Process 2 | Record, comments, and audit logs retrieved in new process with full fidelity | **PASS** |

---

## 3. Known Issues & Operational Considerations

1. **Vercel Cold Starts on Free Tier:** If backend service on Render spins down due to inactivity, initial requests may take 15–20 seconds to warm up. A loading spinner is implemented in the UI.
2. **SAP Live Mode:** Currently in simulated Demo Mode. Transitioning to live SAP S/4HANA requires corporate network firewall clearance for port 44300.

