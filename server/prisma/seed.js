import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const RETURNS_FILE = path.join(__dirname, '../data/returnsData.json');
const AUDIT_FILE = path.join(__dirname, '../data/auditLogs.json');

async function main() {
  console.log('--- Starting SunGrid S/4HANA SD Data Migration to Neon PostgreSQL ---');

  // 1. Seed or Upsert Standard Users with bcrypt
  console.log('Seeding standard role-based users...');
  const saltRounds = 10;
  const defaultPassword = process.env.DEFAULT_SEED_PASSWORD || 'SunGrid@2026!';
  const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

  const initialUsers = [
    {
      email: 'sundaram@sungrid.com',
      name: 'P. Sundaram',
      role: 'RETURNS_MANAGER',
      department: 'Customer Returns & Operations',
      designation: 'Senior Returns Manager',
      employeeId: 'EMP-1108-01',
      status: 'APPROVED',
      isActive: true
    },
    {
      email: 'sharma@sungrid.com',
      name: 'A. Sharma',
      role: 'RETURNS_ANALYST',
      department: 'Quality Assurance & Returns',
      designation: 'Returns Analyst',
      employeeId: 'EMP-1108-04',
      status: 'APPROVED',
      isActive: true
    },
    {
      email: 'finance@sungrid.com',
      name: 'R. Nair',
      role: 'FINANCE_APPROVER',
      department: 'Corporate Finance & Warranty Control',
      designation: 'Lead Finance Approver',
      employeeId: 'EMP-1300-88',
      status: 'APPROVED',
      isActive: true
    },
    {
      email: 'admin@sungrid.com',
      name: 'System Admin',
      role: 'ADMIN',
      department: 'Enterprise IT & ERP Systems',
      designation: 'System Administrator',
      employeeId: 'EMP-ADMIN-01',
      status: 'APPROVED',
      isActive: true
    }
  ];

  const userMap = {}; // key: name or role -> user id

  for (const u of initialUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        department: u.department,
        designation: u.designation,
        employeeId: u.employeeId,
        status: u.status,
        isActive: u.isActive
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        department: u.department,
        designation: u.designation,
        employeeId: u.employeeId,
        status: u.status,
        isActive: u.isActive
      }
    });
    userMap[u.name] = user.id;
    userMap[u.role] = user.id;
    console.log(`User created/updated: ${user.name} (${user.role}) - ${user.email}`);
  }

  // 2. Read JSON Data
  const rawReturns = JSON.parse(fs.readFileSync(RETURNS_FILE, 'utf-8'));
  const rawAuditLogs = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));

  console.log(`Original return records read from JSON: ${rawReturns.length}`);
  console.log(`Original audit logs read from JSON: ${rawAuditLogs.length}`);

  let returnsSuccess = 0;
  let commentsCount = 0;
  let timelineEventsCount = 0;
  let recommendationsCount = 0;
  let auditLogsSuccess = 0;

  // 3. Upsert Return Records Losslessly
  for (const r of rawReturns) {
    // Resolve assignedOwnerId if possible
    let assignedOwnerId = null;
    if (r.assignedOwner) {
      if (r.assignedOwner.includes('Sundaram')) assignedOwnerId = userMap['P. Sundaram'];
      else if (r.assignedOwner.includes('Sharma')) assignedOwnerId = userMap['A. Sharma'];
      else if (r.assignedOwner.includes('Nair')) assignedOwnerId = userMap['R. Nair'];
    }

    const returnRecord = await prisma.returnRecord.upsert({
      where: { id: r.id },
      update: {
        returnOrder: r.returnOrder,
        sapDocument: r.sapDocument,
        companyCode: String(r.companyCode || '1300'),
        plant: String(r.plant),
        plantName: r.plantName || null,
        storageLocation: String(r.storageLocation),
        storageLocationName: r.storageLocationName || null,
        costCenter: String(r.costCenter),
        costCenterName: r.costCenterName || null,
        material: r.material,
        materialId: r.materialId || null,
        businessPartner: r.businessPartner || null,
        businessPartnerRaw: r.businessPartnerRaw || null,
        businessPartnerName: r.businessPartnerName || null,
        currency: r.currency || 'GBP',
        amount: new Prisma.Decimal(r.amount),
        requestedDate: new Date(r.requestedDate),
        processingStatus: r.processingStatus || 'Unassigned',
        exceptionCategory: r.exceptionCategory || null,
        primaryExceptionReason: r.primaryExceptionReason || null,
        assignedOwner: r.assignedOwner || null,
        assignedOwnerId,
        riskLevel: r.riskLevel || 'LOW',
        riskScore: Number(r.riskScore) || 0,
        riskReasons: r.riskReasons || [],
        isPrimaryReference: Boolean(r.isPrimaryReference),
        deliveryDocument: r.deliveryDocument || null,
        goodsReceiptStatus: r.goodsReceiptStatus || null,
        billingBlock: r.billingBlock || null,
        creditMemoDoc: r.creditMemoDoc || null,
        recommendedAction: r.recommendation?.nextAction || null
      },
      create: {
        id: r.id,
        returnOrder: r.returnOrder,
        sapDocument: r.sapDocument,
        companyCode: String(r.companyCode || '1300'),
        plant: String(r.plant),
        plantName: r.plantName || null,
        storageLocation: String(r.storageLocation),
        storageLocationName: r.storageLocationName || null,
        costCenter: String(r.costCenter),
        costCenterName: r.costCenterName || null,
        material: r.material,
        materialId: r.materialId || null,
        businessPartner: r.businessPartner || null,
        businessPartnerRaw: r.businessPartnerRaw || null,
        businessPartnerName: r.businessPartnerName || null,
        currency: r.currency || 'GBP',
        amount: new Prisma.Decimal(r.amount),
        requestedDate: new Date(r.requestedDate),
        processingStatus: r.processingStatus || 'Unassigned',
        exceptionCategory: r.exceptionCategory || null,
        primaryExceptionReason: r.primaryExceptionReason || null,
        assignedOwner: r.assignedOwner || null,
        assignedOwnerId,
        riskLevel: r.riskLevel || 'LOW',
        riskScore: Number(r.riskScore) || 0,
        riskReasons: r.riskReasons || [],
        isPrimaryReference: Boolean(r.isPrimaryReference),
        deliveryDocument: r.deliveryDocument || null,
        goodsReceiptStatus: r.goodsReceiptStatus || null,
        billingBlock: r.billingBlock || null,
        creditMemoDoc: r.creditMemoDoc || null,
        recommendedAction: r.recommendation?.nextAction || null
      }
    });

    returnsSuccess++;

    // Comments Migration
    if (r.comments && Array.isArray(r.comments)) {
      for (const c of r.comments) {
        let userId = null;
        if (c.author) {
          if (c.author.includes('Sharma')) userId = userMap['A. Sharma'];
          else if (c.author.includes('Sundaram')) userId = userMap['P. Sundaram'];
        }

        const commentId = c.id && c.id.length > 5 ? c.id : `COM-${r.id}-${commentsCount + 1}`;
        await prisma.returnComment.upsert({
          where: { id: commentId },
          update: {
            text: c.text,
            author: c.author || 'User',
            persona: c.persona || null,
            timestamp: c.timestamp ? new Date(c.timestamp.replace(' ', 'T') + 'Z') : new Date()
          },
          create: {
            id: commentId,
            returnRecordId: r.id,
            userId,
            author: c.author || 'User',
            persona: c.persona || null,
            text: c.text,
            timestamp: c.timestamp ? new Date(c.timestamp.replace(' ', 'T') + 'Z') : new Date()
          }
        });
        commentsCount++;
      }
    }

    // Timeline Events Migration
    if (r.timeline && Array.isArray(r.timeline)) {
      for (let i = 0; i < r.timeline.length; i++) {
        const t = r.timeline[i];
        const eventId = `EVT-${r.id}-${i + 1}`;
        await prisma.returnEvent.upsert({
          where: { id: eventId },
          update: {
            step: t.step,
            timestamp: t.timestamp || new Date().toISOString(),
            actor: t.actor || 'System',
            status: t.status || 'INFO',
            docRef: t.docRef || null,
            sapTx: t.sapTx || null,
            detail: t.detail || null
          },
          create: {
            id: eventId,
            returnRecordId: r.id,
            step: t.step,
            timestamp: t.timestamp || new Date().toISOString(),
            actor: t.actor || 'System',
            status: t.status || 'INFO',
            docRef: t.docRef || null,
            sapTx: t.sapTx || null,
            detail: t.detail || null
          }
        });
        timelineEventsCount++;
      }
    }

    // Recommendation Migration
    if (r.recommendation) {
      const recId = `REC-${r.id}`;
      await prisma.recommendationFeedback.upsert({
        where: { id: recId },
        update: {
          recommendation: r.recommendation.nextAction || 'Standard resolution procedure',
          confidence: r.recommendation.confidence || '90%',
          recommendationEvidence: r.recommendation.evidence || [],
          userDecision: r.recommendation.status || 'PENDING_DECISION',
          feedbackComment: r.recommendation.userFeedback || null,
          revisedAction: r.recommendation.revisedAction || null,
          decidedBy: r.recommendation.decidedBy || null,
          decidedAt: r.recommendation.decidedAt ? new Date(r.recommendation.decidedAt) : null
        },
        create: {
          id: recId,
          returnRecordId: r.id,
          recommendation: r.recommendation.nextAction || 'Standard resolution procedure',
          confidence: r.recommendation.confidence || '90%',
          recommendationEvidence: r.recommendation.evidence || [],
          userDecision: r.recommendation.status || 'PENDING_DECISION',
          feedbackComment: r.recommendation.userFeedback || null,
          revisedAction: r.recommendation.revisedAction || null,
          decidedBy: r.recommendation.decidedBy || null,
          decidedAt: r.recommendation.decidedAt ? new Date(r.recommendation.decidedAt) : null
        }
      });
      recommendationsCount++;
    }
  }

  // 4. Audit Logs Migration
  for (const a of rawAuditLogs) {
    let userId = null;
    if (a.actor && a.actor.includes('Sundaram')) userId = userMap['P. Sundaram'];
    else if (a.actor && a.actor.includes('Sharma')) userId = userMap['A. Sharma'];

    await prisma.auditLog.upsert({
      where: { id: a.id },
      update: {
        actor: a.actor,
        persona: a.persona,
        recordId: a.recordId || null,
        sapDocument: a.sapDocument || null,
        action: a.action,
        fieldChanged: a.fieldChanged || null,
        oldValue: a.oldValue !== undefined ? String(a.oldValue) : null,
        newValue: a.newValue !== undefined ? String(a.newValue) : null,
        reason: a.reason || null,
        source: a.source || 'Resolution Workspace',
        sapReference: a.sapReference || null,
        timestamp: a.timestamp || new Date().toISOString()
      },
      create: {
        id: a.id,
        userId,
        actor: a.actor,
        persona: a.persona,
        recordId: a.recordId || null,
        sapDocument: a.sapDocument || null,
        action: a.action,
        fieldChanged: a.fieldChanged || null,
        oldValue: a.oldValue !== undefined ? String(a.oldValue) : null,
        newValue: a.newValue !== undefined ? String(a.newValue) : null,
        reason: a.reason || null,
        source: a.source || 'Resolution Workspace',
        sapReference: a.sapReference || null,
        timestamp: a.timestamp || new Date().toISOString()
      }
    });
    auditLogsSuccess++;
  }

  // 5. Seed Initial Database-Backed Notifications
  console.log('Seeding database-backed notifications...');
  const initialNotifications = [
    {
      id: 'notif-sla-inv-460008',
      title: 'Critical SLA Breach: INV-460008 (Composite Panel CP-12)',
      message: 'Case ageing of 70+ days has breached the 7-day review SLA threshold. Outstanding exposure is £23,500.',
      notificationType: 'CRITICAL',
      isRead: false,
      relatedReturnId: 'RET-2026-001',
      rule: 'SLA_THRESHOLD_EXCEEDED'
    },
    {
      id: 'notif-exposure-inv-460012',
      title: 'High Exposure Alert: £42,000 (INV-460012)',
      message: 'Financial exposure exceeds single-manager governance limit of £20,000. Finance sign-off required to release billing block.',
      notificationType: 'HIGH',
      isRead: false,
      relatedReturnId: 'RET-2026-002',
      rule: 'FINANCIAL_THRESHOLD_TRIGGER'
    },
    {
      id: 'notif-unassigned-inv-459990',
      title: 'Unassigned Exception: INV-459990',
      message: 'No accountable owner has been assigned to return order RO-772120. Case is accumulating unmonitored ageing.',
      notificationType: 'HIGH',
      isRead: false,
      relatedReturnId: 'RET-2026-003',
      rule: 'MISSING_ACCOUNTABLE_OWNER'
    }
  ];

  for (const n of initialNotifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {
        title: n.title,
        message: n.message,
        notificationType: n.notificationType,
        isRead: n.isRead,
        relatedReturnId: n.relatedReturnId,
        rule: n.rule
      },
      create: {
        id: n.id,
        title: n.title,
        message: n.message,
        notificationType: n.notificationType,
        isRead: n.isRead,
        relatedReturnId: n.relatedReturnId,
        rule: n.rule
      }
    });
  }

  console.log('--- Migration & Seeding Summary ---');
  console.log(`Successfully migrated Return Records: ${returnsSuccess} / ${rawReturns.length}`);
  console.log(`Successfully migrated Return Comments: ${commentsCount}`);
  console.log(`Successfully migrated Timeline Events: ${timelineEventsCount}`);
  console.log(`Successfully migrated Recommendations: ${recommendationsCount}`);
  console.log(`Successfully migrated Audit Logs: ${auditLogsSuccess} / ${rawAuditLogs.length}`);
  console.log(`Successfully seeded Notifications: ${initialNotifications.length}`);
}

main()
  .catch((e) => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

