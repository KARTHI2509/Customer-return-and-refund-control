-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('RETURNS_ANALYST', 'RETURNS_MANAGER', 'FINANCE_APPROVER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'RETURNS_ANALYST',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnRecord" (
    "id" TEXT NOT NULL,
    "returnOrder" TEXT NOT NULL,
    "sapDocument" TEXT NOT NULL,
    "companyCode" TEXT NOT NULL DEFAULT '1300',
    "plant" TEXT NOT NULL,
    "plantName" TEXT,
    "storageLocation" TEXT NOT NULL,
    "storageLocationName" TEXT,
    "costCenter" TEXT NOT NULL,
    "costCenterName" TEXT,
    "material" TEXT NOT NULL,
    "materialId" TEXT,
    "businessPartner" TEXT,
    "businessPartnerRaw" TEXT,
    "businessPartnerName" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "amount" DECIMAL(12,2) NOT NULL,
    "requestedDate" TIMESTAMP(3) NOT NULL,
    "processingStatus" TEXT NOT NULL DEFAULT 'Unassigned',
    "exceptionCategory" TEXT,
    "primaryExceptionReason" TEXT,
    "assignedOwner" TEXT,
    "assignedOwnerId" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskReasons" TEXT[],
    "isPrimaryReference" BOOLEAN NOT NULL DEFAULT false,
    "deliveryDocument" TEXT,
    "goodsReceiptStatus" TEXT,
    "billingBlock" TEXT,
    "creditMemoDoc" TEXT,
    "recommendedAction" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnComment" (
    "id" TEXT NOT NULL,
    "returnRecordId" TEXT NOT NULL,
    "userId" TEXT,
    "author" TEXT NOT NULL,
    "persona" TEXT,
    "text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "returnRecordId" TEXT NOT NULL,
    "requestedById" TEXT,
    "approverId" TEXT,
    "actionType" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "decisionComment" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnEvent" (
    "id" TEXT NOT NULL,
    "returnRecordId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "docRef" TEXT,
    "sapTx" TEXT,
    "detail" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "actor" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "recordId" TEXT,
    "sapDocument" TEXT,
    "action" TEXT NOT NULL,
    "fieldChanged" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'Resolution Workspace',
    "sapReference" TEXT,
    "ipAddress" TEXT,
    "timestamp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedReturnId" TEXT,
    "rule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationFeedback" (
    "id" TEXT NOT NULL,
    "returnRecordId" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "confidence" TEXT,
    "recommendationEvidence" TEXT[],
    "userDecision" TEXT NOT NULL,
    "feedbackComment" TEXT,
    "revisedAction" TEXT,
    "userId" TEXT,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRecord_sapDocument_key" ON "ReturnRecord"("sapDocument");

-- CreateIndex
CREATE INDEX "ReturnRecord_sapDocument_idx" ON "ReturnRecord"("sapDocument");

-- CreateIndex
CREATE INDEX "ReturnRecord_plant_idx" ON "ReturnRecord"("plant");

-- CreateIndex
CREATE INDEX "ReturnRecord_processingStatus_idx" ON "ReturnRecord"("processingStatus");

-- CreateIndex
CREATE INDEX "ReturnRecord_riskLevel_idx" ON "ReturnRecord"("riskLevel");

-- CreateIndex
CREATE INDEX "ReturnRecord_assignedOwnerId_idx" ON "ReturnRecord"("assignedOwnerId");

-- CreateIndex
CREATE INDEX "ReturnComment_returnRecordId_idx" ON "ReturnComment"("returnRecordId");

-- CreateIndex
CREATE INDEX "Approval_returnRecordId_idx" ON "Approval"("returnRecordId");

-- CreateIndex
CREATE INDEX "Approval_approvalStatus_idx" ON "Approval"("approvalStatus");

-- CreateIndex
CREATE INDEX "ReturnEvent_returnRecordId_idx" ON "ReturnEvent"("returnRecordId");

-- CreateIndex
CREATE INDEX "AuditLog_recordId_idx" ON "AuditLog"("recordId");

-- CreateIndex
CREATE INDEX "AuditLog_sapDocument_idx" ON "AuditLog"("sapDocument");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_persona_idx" ON "AuditLog"("persona");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_relatedReturnId_idx" ON "Notification"("relatedReturnId");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_returnRecordId_idx" ON "RecommendationFeedback"("returnRecordId");

-- AddForeignKey
ALTER TABLE "ReturnRecord" ADD CONSTRAINT "ReturnRecord_assignedOwnerId_fkey" FOREIGN KEY ("assignedOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnComment" ADD CONSTRAINT "ReturnComment_returnRecordId_fkey" FOREIGN KEY ("returnRecordId") REFERENCES "ReturnRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnComment" ADD CONSTRAINT "ReturnComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_returnRecordId_fkey" FOREIGN KEY ("returnRecordId") REFERENCES "ReturnRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnEvent" ADD CONSTRAINT "ReturnEvent_returnRecordId_fkey" FOREIGN KEY ("returnRecordId") REFERENCES "ReturnRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ReturnRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationFeedback" ADD CONSTRAINT "RecommendationFeedback_returnRecordId_fkey" FOREIGN KEY ("returnRecordId") REFERENCES "ReturnRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationFeedback" ADD CONSTRAINT "RecommendationFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
