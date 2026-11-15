# Technical Interview Preparation & Defense Guide

**Author:** Karthik Thalipineni  
**Target Panel:** KAAR Technologies Assessment Evaluation Committee  
**Role Scope:** Senior Full-Stack Engineer / PostgreSQL Database Architect / SAP SD Consultant  

---

## 1. Top 10 Technical Questions & High-Impact Model Answers

### Q1: Why build a custom web application when SAP has Fiori app "Manage Customer Returns" (F2133)?
> **Model Answer:**  
> *"SAP Fiori F2133 is an outstanding transaction-entry tool for creating and updating standard customer return orders. However, in complex utility-scale renewables manufacturing, return resolution involves cross-departmental collaboration between warehouse quality teams at Storage Location SL11, customer service absorbing costs in CC-2208, and corporate finance managing £20k+ billing blocks. Standard Fiori screens require toggling across multiple applications and lack automated execution discrepancy matching (comparing 15 units billed on INV-460008 against 10 units physically offloaded). Our application does NOT replace SAP—it acts as an intelligent exception triage layer that computes dynamic risk, reconciles counts, enforces multi-role governance, and prepares clean postings back to SAP S/4HANA via OData."*

### Q2: Why migrate from file-based JSON storage to Neon PostgreSQL and Prisma ORM?
> **Model Answer:**  
> *"While flat JSON files coupled with in-memory arrays provided an initial prototype mechanism, they are unsuitable for multi-operator enterprise execution. They lack ACID transactional guarantees, risk catastrophic file corruption under concurrent writes, and fail immediately when deployed to serverless environments like Vercel or Render where containers feature ephemeral, read-only filesystems. By migrating to Neon PostgreSQL via Prisma ORM, we achieved relational data normalization, foreign key cascading, unique document indexing (preventing duplicate claims on INV-460008), Decimal precision for financial amounts, connection pooling via PgBouncer, and persistent audit logging."*

### Q3: How do you handle financial precision in PostgreSQL?
> **Model Answer:**  
> *"We explicitly used `Decimal(12, 2)` in our Prisma schema rather than floating-point data types (`Float` / `Double`). In enterprise finance, floating-point arithmetic introduces IEEE-754 binary rounding inaccuracies that compound across thousands of transactions. Decimal maps directly to PostgreSQL's arbitrary-precision `NUMERIC` type, guaranteeing exact penny and pound reconciliation."*

### Q4: How is dynamic ageing calculated and why not store it as a static number in the database?
> **Model Answer:**  
> *"Storing ageing as a static integer in a database creates stale data the moment a day turns over. Our backend computes ageing dynamically on every request using millisecond date arithmetic: $\lfloor(\text{Now} - \text{Requested Date}) / 86,400,000\rfloor$. This ensures that SLA alerts and executive dashboard ageing profiles are always 100% accurate without requiring daily batch cron jobs to increment integers."*

### Q5: How do you ensure separation of duties between Returns Analysts and Finance Approvers?
> **Model Answer:**  
> *"We enforce multi-tiered Role-Based Access Control (RBAC) on the backend via Express middleware and JWT claims. A Returns Analyst can review cases, inspect document flow, add notes, and submit recommendations, but cannot release credit memos. Returns Managers can approve operational adjustments up to £25,000. Returns exceeding £20,000 require the Finance Approver persona to release billing blocks. Crucially, this is enforced on the server-side API endpoints (`POST /api/returns/:id/action`), not merely by hiding UI buttons in React."*

### Q6: What happens if the SAP Gateway experiences an outage or network timeout?
> **Model Answer:**  
> *"Our SAP OData adapter incorporates a circuit-breaker pattern with configurable timeouts (4,000ms) and retry logic (3 attempts). In Settings, we demonstrate error injection where an RFC communication failure returns HTTP 502/503. The application catches this cleanly, prevents local state inconsistency by aborting unconfirmed postings, and informs the operator that the SAP RFC connection timed out without committing unverified credits."*

### Q7: What is the specific business significance of reference case INV-460008?
> **Model Answer:**  
> *"Case INV-460008 perfectly illustrates the £21M–£42M revenue leak SunGrid faces. Customer Meridian Stores requested a return for 15 damaged composite solar panels (£23,500 total). At Plant 1108 SL11, warehouse inspection found only 10 panels were actually delivered—the carrier held 5. Because the return order was missing the mandatory Return Reason code, SAP locked it with Billing Block 08, and the case sat unattended for >70 days. Our recommendation engine immediately flagged the 5-unit variance, recommending an adjustment to 10 units, saving SunGrid exactly £7,833.30 from an erroneous over-credit."*

### Q8: How is the database connection configured to prevent connection exhaustion in serverless or container deployments?
> **Model Answer:**  
> *"We implement a dual-endpoint architecture in Prisma. Runtime queries use `DATABASE_URL` pointing to Neon's PgBouncer pooler (`-pooler` hostname), which multiplexes hundreds of concurrent client connections over a compact pool of server connections. For database migrations, Prisma requires session locks and advisory locks unsupported by transaction-mode PgBouncer; we configure `DIRECT_URL` pointing directly to PostgreSQL application port 5432."*

### Q9: Why use deterministic business rules instead of an LLM for resolution recommendations?
> **Model Answer:**  
> *"In enterprise ERP and financial compliance, auditability and determinism are paramount. An LLM can hallucinate non-existent Return Reason codes or generate non-repeatable financial calculations. Our deterministic engine compares line-item invoice data against warehouse inspection counts, calculates exact unit prices, and applies pre-approved SAP SD reason catalogs (`015 - Solar Panel Cell Fracture`). It is 100% explainable, repeatable, and verifiable by external auditors."*

### Q10: How do you verify that data persists across process lifecycles?
> **Model Answer:**  
> *"We implemented an automated verification script that inserts a return record with comments and audit logs in one Node.js process, terminates the connection and process completely, and then launches a totally independent second process to query and verify that every child relationship and attribute remained perfectly intact in Neon PostgreSQL. Our test suite achieved 14/14 automated passes."*
