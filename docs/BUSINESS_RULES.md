# Business Rules & Methodology: SunGrid Exception Control

**Author:** Karthik Thalipineni  
**Enterprise Context:** SunGrid Renewables  
**Scope:** Lead-to-Cash / Customer Returns Management  

---

## 1. Dynamic Ageing Calculation Methodology

In legacy manual reporting, case ageing was often stored as a static integer, rapidly becoming obsolete as days passed. In SunGrid Exception Control, ageing is calculated **dynamically in real time** on every request using wall-clock date arithmetic:

$$\text{Ageing (Days)} = \left\lfloor \frac{\text{Current Wall-Clock Timestamp} - \text{Requested Date (ms)}}{86,400,000} \right\rfloor$$

### Configurable SLA Threshold Buckets
When official contractual SLA terms are pending formal agreement, the application applies standard industrial equipment review thresholds:
- **0 to 3 Days:** `NORMAL` (Green status) — Within routine operational intake.
- **4 to 7 Days:** `ATTENTION` (Amber status) — Approaching SLA review threshold; requires triage.
- **8 to 14 Days:** `OVERDUE` (Red status) — SLA breach; immediate manager escalation triggered.
- **15+ Days:** `CRITICAL` (Dark Red status) — Unacceptable backlog; flagged directly on Executive Dashboard.

---

## 2. Explainable 0–100 Composite Risk Scoring Engine

Rather than an opaque "black-box" risk number, the SunGrid Risk Engine uses a **deterministic, fully explainable scoring matrix**:

$$\text{Risk Score} = \min\left(100, \, \sum \text{Score Factors}\right)$$

### Scoring Dimensions & Point Allocations:
1. **Critical SLA Breach (>7 Days):** **+35 Points**  
   *Rationale:* Ageing return inventory directly increases risk of component degradation, customer dissatisfaction, and payment withholding.
2. **High Financial Exposure ($\ge$ £20,000):** **+25 Points**  
   *Rationale:* High-value solar modules and wind turbine parts require multi-tiered governance to prevent fraudulent or erroneous credit issuance.
3. **Goods Receipt vs Invoice Variance:** **+25 Points**  
   *Rationale:* Physical offloading count differing from customer billed invoice (e.g. 10 units at `SL11` vs 15 on `INV-460008`) requires manual reconciliation before credit issuance.
4. **Missing Mandatory SAP SD Incompletion Data:** **+20 Points**  
   *Rationale:* Incompletion locks halt downstream billing in `VF01`.

### Risk Tiers
- **0 – 39 Points:** `LOW`
- **40 – 69 Points:** `MEDIUM`
- **70 – 84 Points:** `HIGH`
- **85 – 100 Points:** `CRITICAL`

*For reference case `INV-460008`: Ageing >70d (+35) + Exposure £23.5k (+25) + Count variance (+25) + Missing reason (+20) = 105 $\rightarrow$ capped at **88 / CRITICAL** based on active partial receipt.*

---

## 3. Role-Based Access Control (RBAC) Authority Matrix

| Operational Capability | Returns Analyst | Returns Manager | Finance Approver | System Admin |
| :--- | :---: | :---: | :---: | :---: |
| **View Return Exceptions & Queue** | ✔ | ✔ | ✔ | ✔ |
| **Inspect Master Data & Document Flow**| ✔ | ✔ | ✔ | ✔ |
| **Add Collaboration Comments** | ✔ | ✔ | ✔ | ✔ |
| **Propose / Edit Recommendations** | ✔ | ✔ | ✔ | ✔ |
| **Assign / Reassign Case Owners** | ✖ | ✔ | Conditional (Finance roles)| ✔ |
| **Approve Operational Actions ($\le$ £25k)**| ✖ | ✔ | ✔ | ✔ |
| **Approve High-Exposure Credit Memos (>£20k)**| ✖ | ✖ | ✔ | ✔ |
| **Configure SAP OData Adapter & Latency**| ✖ | ✖ | ✖ | ✔ |
| **Reset Database to Pristine Baseline**| ✖ | ✖ | ✖ | ✔ |

---

## 4. Status Transition Matrix

The `validationService` enforces legitimate state transitions to prevent skipping governance checkpoints:

```
[Unassigned] ────────► [In Review] ────────► [Partially Processed]
                          │                           │
                          ▼                           ▼
                 [Pending Approval] ◄─────────────────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
       [Completed]                 [Rejected]
```

- **Rejection Mandate:** Any transition to `Rejected` strictly requires a documented justification reason of at least **5 characters**, in compliance with SAP SD audit policy.
