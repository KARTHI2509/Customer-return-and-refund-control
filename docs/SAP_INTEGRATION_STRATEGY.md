# SAP S/4HANA SD Integration Strategy

**Author:** Karthik Thalipineni  
**Target Enterprise ERP:** SAP S/4HANA Cloud / On-Premise (Release 2023 / 2024)  
**Standard SAP Scope Item:** Customer Returns (BKP)  
**OData Service:** `API_CUSTOMER_RETURN_SRV`  

---

## 1. Executive Notice: Current Demo Boundary vs Production Vision

> **IMPORTANT COMPLIANCE STATEMENT:**  
> The current application implementation features a **transparent, simulated SAP OData Adapter** ([server/services/sapAdapter.js](file:///c:/Users/karth/Downloads/kaar-2ndround/server/services/sapAdapter.js)) operating in **Demo Mode**.  
> **No live SAP credentials have been fabricated, and no actual financial postings are transmitted to external SAP servers during demo execution.**  
> The adapter is intentionally architected to mirror official SAP OData entities and RFC response payloads to facilitate immediate, seamless plug-in to a live SAP Gateway upon corporate authorization.

---

## 2. SAP System of Record Relationship

In enterprise architecture, establishing clear boundaries between transaction engines and operational sidecars is vital:

| Responsibility | SAP S/4HANA SD | SunGrid Exception Control Application |
| :--- | :--- | :--- |
| **General Ledger & Financial Postings** | **Authoritative System of Record** | Read-only reference / Post request initiator |
| **Material Master Data & Plant Hierarchy**| Master Authority (`MARA`, `T001W`) | Cached lookup & validation rules |
| **Document Number Ranges (`NRIV`)** | Sole Generator (`VA01`, `VL01N`, `VF01`)| Uses SAP document reference numbers |
| **Exception Triage & Work Queue** | Dispersed across transaction codes | **Centralized operational workspace** |
| **Ageing & Multi-Factor Risk Prioritization**| None (requires custom BW / SAC reports)| **Real-time dynamic engine** |
| **Collaboration & Human Justifications** | Fragmented in SAP text headers | **Relational comments & immutable audit log** |

---

## 3. Official OData Service Mapping

The application's data models map 1-to-1 with SAP standard OData service `API_CUSTOMER_RETURN_SRV`:

```
┌─────────────────────────────────┐          ┌──────────────────────────────────────────────┐
│  SunGrid ReturnRecord (Prisma)  │          │  SAP S/4HANA API_CUSTOMER_RETURN_SRV Entity  │
├─────────────────────────────────┤          ├──────────────────────────────────────────────┤
│  returnOrder                    │ ◄──────► │  A_CustomerReturn.CustomerReturn             │
│  sapDocument (Billing Ref)      │ ◄──────► │  A_CustomerReturn.ReferenceSDDocument        │
│  companyCode ("1300")           │ ◄──────► │  A_CustomerReturn.CompanyCode                │
│  plant ("1108" / "1102")        │ ◄──────► │  A_CustomerReturnItem.Plant                  │
│  storageLocation ("SL11")       │ ◄──────► │  A_CustomerReturnItem.StorageLocation        │
│  material ("Composite Panel")   │ ◄──────► │  A_CustomerReturnItem.Material               │
│  amount (Decimal GBP)           │ ◄──────► │  A_CustomerReturnItem.NetPriceAmount         │
│  billingBlock                   │ ◄──────► │  A_CustomerReturn.BillingBlockReason         │
│  deliveryDocument               │ ◄──────► │  A_CustomerReturnDelivery.DeliveryDocument   │
│  creditMemoDoc                  │ ◄──────► │  A_CustReturnProcessStep.SubsequentDocument  │
└─────────────────────────────────┘          └──────────────────────────────────────────────┘
```

---

## 4. Production Integration Roadmap

### Step 1: Authentication & Communication Security
- Establish a dedicated **SAP BTP (Business Technology Platform) Cloud Foundry Destination**.
- Use **OAuth 2.0 SAML Bearer Assertion** or Client Credentials flow against the SAP Gateway.
- Mutual TLS (mTLS) with corporate certificates terminating at `https://s4hana-gateway.sungrid.internal:44300`.

### Step 2: Inbound Event Synchronization (SAP -> SunGrid App)
- Configure **SAP Event Mesh** to publish real-time change events:
  - `sap/s4/beh/customerreturn/v1/CustomerReturn/Created/v1`
  - `sap/s4/beh/customerreturn/v1/CustomerReturn/Changed/v1`
- SunGrid backend listens via secure webhook, upserting records into Neon PostgreSQL via Prisma.

### Step 3: Outbound Action Execution (SunGrid App -> SAP)
- When a Returns Manager approves a quantity adjustment or releases a billing block:
  1. SunGrid backend issues an OData HTTP `PATCH` to update the Return Order item quantity.
  2. Issues an OData function import `ReleaseBillingBlock(CustomerReturn='RO-772109')`.
  3. Receives SAP reference document (`DOC-XXXXXX`) and records it in `AuditLog.sapReference`.

### Step 4: Resilience, Retry & Idempotency
- **Circuit Breaker:** If SAP Gateway returns 503 or latency exceeds 4,000ms, the adapter opens the circuit and queues pending transactions in Neon PostgreSQL.
- **Idempotency Key:** Outbound calls carry `X-Correlation-ID: <auditId>` to prevent duplicate credit memo creation in case of network timeouts.
