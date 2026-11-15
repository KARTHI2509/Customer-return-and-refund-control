# Project Overview: Customer Return Exception Control

**Project Title:** SunGrid Renewables — Customer Return Exception Control  
**System of Record Alignment:** SAP S/4HANA Sales & Distribution (SD) — BKP Best Practice Scope  
**Author:** Karthik Thalipineni  
**Target Enterprise:** SunGrid Renewables Ltd (~7,600 employees, 2 manufacturing plants, 4 distribution centers, ~£2.1B annual revenue)  

---

## 1. Executive Summary

In utility-scale renewable energy manufacturing (solar modules, wind turbine nacelles, pitch sensors), customer returns carry extreme financial and contractual exposure. SunGrid Renewables operates core sales, distribution, and logistics execution in **SAP S/4HANA SD**. 

While SAP S/4HANA successfully executes standard transactional flows (`VA01` Return Orders, `VL01N` Inbound Deliveries, `QA32` Quality Inspections, `VF01` Credit Memos), operational adoption often stalls when customer returns encounter **exceptions**:
1. **Missing Mandatory Attributes:** SAP incompletion logs lock returns lacking specific Return Reason codes, plant-storage pairings, or cost centers.
2. **Execution Mismatches:** Physical receipt counts at storage quarantine locations (e.g., Plant 1108 / Storage Location `SL11`) frequently deviate from customer invoices.
3. **Approval Bottlenecks:** Returns exceeding single-manager governance thresholds (£20,000–£25,000) sit unmonitored in ERP billing blocks (`08 - Awaiting Technical & Manager Approval`).
4. **Accountability Gaps:** Return cases age beyond agreed Service Level Agreement (SLA) review windows (>7 days) without assigned owners.

This project delivers a **dedicated, database-backed operational exception control platform** designed to sit alongside SAP S/4HANA. It provides executive visibility, rule-based incompletion validation, automated ageing and risk scoring, deterministic resolution recommendations, role-based approval governance, and audit trails.

---

## 2. Core Capabilities

| Capability | Technical Realization | Business Impact |
| :--- | :--- | :--- |
| **Operational Database Layer** | Neon-hosted PostgreSQL with Prisma ORM 6 | Full ACID transaction guarantees, relational referential integrity, and persistent audit logging. |
| **SAP S/4HANA BKP Alignment** | OData Service Boundary (`API_CUSTOMER_RETURN_SRV`) | Non-disruptive integration; SAP remains the authoritative system of record for financial postings. |
| **Dynamic Ageing & Risk Scoring** | Explainable millisecond date arithmetic & multi-factor scoring | Prioritizes critical, high-exposure exceptions over routine operational noise. |
| **Deterministic Recommendation Engine** | Rule-based dispute resolution logic | Eliminates guesswork by comparing invoice line items against warehouse receipts (e.g. saving £7,833.30 on INV-460008). |
| **Enterprise RBAC Governance** | JWT authentication + bcrypt password hashing | Enforces separation of duties between Returns Analysts, Returns Managers, Finance Approvers, and System Admins. |
| **Executive Reporting & Export** | Recharts visualizations, SheetJS XLSX & jsPDF generation | Provides live C-suite transparency into exposure at risk, SLA compliance, and Pareto defect distributions. |

---

## 3. Technology Stack

- **Frontend:** React 19, Vite, Recharts, Lucide React, SheetJS (`xlsx`), jsPDF
- **Backend:** Node.js, Express (ES Modules), Helmet, CORS, Express-Rate-Limit, Dotenv
- **Database & ORM:** PostgreSQL (Neon Serverless with PgBouncer Pooling), Prisma ORM v6.19
- **Authentication:** JSON Web Tokens (JWT), bcryptjs password hashing
- **Deployment Targets:** Vercel (Frontend SPA), Render (Backend Express REST Service), Neon (Cloud PostgreSQL)
