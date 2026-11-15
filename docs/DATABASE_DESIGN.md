# Database Design: Relational Schema & Models (PostgreSQL + Prisma)

**Author:** Karthik Thalipineni  
**Database Engine:** Neon-hosted PostgreSQL  
**ORM:** Prisma 6.19.3  

---

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ ReturnRecord : "assigns/owns"
    User ||--o{ ReturnComment : "authors"
    User ||--o{ Approval : "requests/approves"
    User ||--o{ AuditLog : "triggers"
    User ||--o{ Notification : "receives"
    User ||--o{ RecommendationFeedback : "decides"

    ReturnRecord ||--o{ ReturnComment : "has"
    ReturnRecord ||--o{ Approval : "undergoes"
    ReturnRecord ||--o{ ReturnEvent : "tracks"
    ReturnRecord ||--o{ AuditLog : "audits"
    ReturnRecord ||--o{ RecommendationFeedback : "evaluates"

    User {
        string id PK
        string name
        string email UK
        string passwordHash
        enum role
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    ReturnRecord {
        string id PK
        string returnOrder
        string sapDocument UK
        string companyCode
        string plant
        string storageLocation
        string costCenter
        string material
        decimal amount
        string currency
        datetime requestedDate
        string processingStatus
        string riskLevel
        int riskScore
        string_array riskReasons
        boolean isPrimaryReference
        string deliveryDocument
        string goodsReceiptStatus
        string billingBlock
        string creditMemoDoc
        string recommendedAction
        datetime createdAt
        datetime updatedAt
    }

    ReturnComment {
        string id PK
        string returnRecordId FK
        string userId FK
        string author
        string persona
        string text
        datetime timestamp
        datetime createdAt
    }

    Approval {
        string id PK
        string returnRecordId FK
        string requestedById FK
        string approverId FK
        string actionType
        string approvalStatus
        string decisionComment
        datetime decidedAt
        datetime createdAt
        datetime updatedAt
    }

    ReturnEvent {
        string id PK
        string returnRecordId FK
        string step
        string timestamp
        string actor
        string status
        string docRef
        string sapTx
        string detail
        json metadata
        datetime createdAt
    }

    AuditLog {
        string id PK
        string userId FK
        string actor
        string persona
        string recordId FK
        string sapDocument
        string action
        string fieldChanged
        string oldValue
        string newValue
        string reason
        string source
        string sapReference
        string ipAddress
        string timestamp
        datetime createdAt
    }

    Notification {
        string id PK
        string userId FK
        string title
        string message
        string notificationType
        boolean isRead
        string relatedReturnId
        string rule
        datetime createdAt
    }

    RecommendationFeedback {
        string id PK
        string returnRecordId FK
        string recommendation
        string confidence
        string_array recommendationEvidence
        string userDecision
        string feedbackComment
        string revisedAction
        string userId FK
        string decidedBy
        datetime decidedAt
        datetime createdAt
    }
```

---

## 2. Table Specifications & Design Decisions

### Model 1: `User`
- **Purpose:** Manages operator identities, credentials, and role-based access control.
- **Key Columns:**
  - `id`: String UUID Primary Key.
  - `email`: Unique index; used for authentication login.
  - `passwordHash`: Bcrypt hash (10 salt rounds); plain-text passwords are never stored.
  - `role`: Enum (`RETURNS_ANALYST`, `RETURNS_MANAGER`, `FINANCE_APPROVER`, `ADMIN`).
  - `isActive`: Boolean flag supporting soft deactivation.

### Model 2: `ReturnRecord`
- **Purpose:** Stores the operational return cases mirroring SAP SD BKP structures.
- **Key Columns & Design Choices:**
  - `id`: String Primary Key (preserves existing human-readable IDs such as `RET-2026-001`).
  - `sapDocument`: String with **Unique Constraint** (`INV-460008`) preventing duplicate document processing.
  - `amount`: **`Decimal(12, 2)`** instead of floating-point to guarantee absolute financial accuracy without rounding errors.
  - `currency`: String default `GBP`; prevents mixed currency contamination.
  - `riskReasons`: Native PostgreSQL text array (`text[]`) storing multi-factor risk drivers.
  - Indexes: B-tree indexes placed on `sapDocument`, `plant`, `processingStatus`, `riskLevel`, and `assignedOwnerId` for rapid work-queue filtering.

### Model 3: `ReturnComment`
- **Purpose:** Internal operational collaboration thread between Analysts, Managers, and Finance.
- **Foreign Key:** `returnRecordId` references `ReturnRecord.id` with `onDelete: Cascade`.

### Model 4: `Approval`
- **Purpose:** Tracks governance approval requests and decisions.
- **Key Columns:** `actionType` (`APPROVE`, `REJECT`, `REQUEST_APPROVAL`), `approvalStatus` (`PENDING`, `APPROVED`, `REJECTED`), `decisionComment`, and `decidedAt`.

### Model 5: `ReturnEvent` (Timeline)
- **Purpose:** Complete document flow milestone history (e.g., `VA01` Order Created -> `VL01N` Delivery -> `SL11` Receipt -> `VF01` Credit Memo).
- **Foreign Key:** `returnRecordId` with cascade delete.

### Model 6: `AuditLog`
- **Purpose:** Immutable compliance trace recording every state mutation, user action, justification reason, and SAP reference document ID.
- **Indexes:** Indexed on `recordId`, `sapDocument`, `action`, and `persona`.

### Model 7: `Notification`
- **Purpose:** In-app operational alerts and SLA breach warnings.
- **Key Feature:** **Database-persisted `isRead` flag**, ensuring that marking alerts as read persists across browser sessions and device reloads.

### Model 8: `RecommendationFeedback`
- **Purpose:** Records human decisions on system recommendations (`ACCEPTED`, `EDITED`, `REJECTED`) along with supporting evidence and revised actions.
