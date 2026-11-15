# 3-Minute Assessment Demonstration Script

**Author:** Karthik Thalipineni  
**Presentation Context:** KAAR Technologies 2nd Round Interview  
**Target Duration:** Exactly 3 Minutes  

---

## Minute 1: The Enterprise Challenge & Executive Dashboard (0:00 – 1:00)

### What to Show:
- Open the application at `http://localhost:5173` (or deployed production link).
- Point to the **Executive Control Dashboard**.

### What to Say:
> *"Good morning, members of the evaluation committee. Today, I am demonstrating the Customer Return Exception Control platform engineered for SunGrid Renewables, an enterprise operating in utility-scale solar and wind manufacturing with ~£2.1 Billion in annual revenue.*
>
> *While SunGrid operates core sales and distribution in SAP S/4HANA SD, return exceptions currently stall across disconnected spreadsheets and emails. Leadership estimates between £21 Million and £42 Million is tied up in disputed customer billing blocks, inventory write-offs, and avoidable freight.*
>
> *On the Executive Dashboard, we immediately see our total active exception exposure: **£142,100**, with **6 active cases**, and **3 cases overdue beyond our 7-day review SLA**. Notice our real-time ageing distribution, plant breakdown between Solar Plant 1108 and Wind Plant 1102, and live database connection to **Neon PostgreSQL via Prisma ORM**."*

---

## Minute 2: Triage & Deep Dive into Reference Case INV-460008 (1:00 – 2:00)

### What to Show:
- Click the quick-access pill in the header: **"Case INV-460008"**.
- This navigates directly to **Return Object Details**.

### What to Say:
> *"Let us drill directly into the primary assessment case: Document INV-460008 for Composite Panel CP-12 at Plant 1108, Storage Location SL11, and Cost Center CC-2208.*
>
> *Our application highlights exactly why the standard SAP process stalled for over 70 days: customer Meridian Stores reported micro-cracks on 15 panels billed at £23,500. However, when the inbound delivery arrived at Plant 1108 SL11, physical inspection sheet #QA-412 confirmed only 10 panels were delivered intact. Carrier retained 5.*
>
> *Furthermore, the initial VA01 return order omitted the mandatory Return Reason code, triggering an SAP incompletion lock and Billing Block 08. Our dynamic risk engine calculates an explainable composite risk score of **88/100 (CRITICAL)**, detailing every contributing factor: +35 for SLA overdue, +25 for financial exposure, +25 for physical receipt discrepancy, and +20 for incompletion."*

---

## Minute 3: Resolution Workspace, Financial Savings & Database Persistence (2:00 – 3:00)

### What to Show:
- Click **"Open Resolution Workspace"**.
- Point to the intelligent recommendation card.
- Click **"Approve & Execute Resolution"** (using the Returns Manager or Finance Approver persona).
- Show the success confirmation with SAP OData mock document reference (`DOC-XXXXXX`).
- Switch to **Notifications Center** and demonstrate clicking "Mark Read" with persistent database update.

### What to Say:
> *"Now we enter the Resolution Workspace. Our deterministic recommendation engine eliminates guesswork: it detects the 5-unit variance and recommends adjusting the Return Order from 15 to 10 units, assigning Reason Code '015 - Solar Panel Cell Fracture', and releasing the Finance billing block.*
>
> *By catching this discrepancy before credit issuance, the application delivers immediate financial savings of **£7,833.30** on this single transaction alone!*
>
> *As Returns Manager P. Sundaram, I execute the approved resolution. Notice the multi-table database transaction: the return status updates to Completed, the billing block is cleared, credit memo reference CR-907800 is assigned, and an immutable entry is written to our PostgreSQL Audit Log with full actor attribution.*
>
> *Finally, our in-app notifications and read states are fully persisted in Neon PostgreSQL. If I refresh the browser or restart the backend, every comment, milestone, and approval persists with full relational integrity.*
>
> *Thank you, and I look forward to your questions."*
