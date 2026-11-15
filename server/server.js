import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';

import prisma from './config/database.js';
import { Prisma } from '@prisma/client';
import { validateReturnRecord, validateAllowedStatusTransition } from './services/validationService.js';
import { calculateAgeing, evaluateRisk, DEFAULT_THRESHOLDS } from './services/riskEngine.js';
import { generateRecommendation } from './services/recommendationEngine.js';
import { sapAdapter } from './services/sapAdapter.js';
import { authenticateToken, requireAuth, requireRole, generateToken, PERSONA_TO_ROLE } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Uploads configuration
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitized}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF, PNG, JPG, and XLSX are permitted.'));
    }
  }
});

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Rate Limiter for Authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' }
});

// Helper: Enrich return record with dynamic calculations
function enrichReturn(record, allRecords = []) {
  const plainRecord = {
    ...record,
    amount: Number(record.amount),
    requestedDate: record.requestedDate instanceof Date ? record.requestedDate.toISOString().substring(0, 10) : record.requestedDate,
    timeline: record.timeline ? record.timeline.map(t => ({
      step: t.step,
      timestamp: t.timestamp,
      actor: t.actor,
      status: t.status,
      docRef: t.docRef,
      sapTx: t.sapTx,
      detail: t.detail
    })) : [],
    comments: record.comments ? record.comments.map(c => ({
      id: c.id,
      author: c.author,
      persona: c.persona,
      timestamp: c.timestamp instanceof Date ? c.timestamp.toISOString().replace('T', ' ').substring(0, 19) : c.timestamp,
      text: c.text
    })) : [],
    attachments: record.attachments ? record.attachments.map(a => ({
      id: a.id,
      fileName: a.fileName,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
      fileUrl: a.fileUrl,
      uploadedByName: a.uploadedByName,
      createdAt: a.createdAt
    })) : []
  };

  let recommendation = null;
  if (record.recommendationFeedbacks && record.recommendationFeedbacks.length > 0) {
    const latestRec = record.recommendationFeedbacks[record.recommendationFeedbacks.length - 1];
    recommendation = {
      nextAction: latestRec.recommendation,
      confidence: latestRec.confidence || '94%',
      evidence: latestRec.recommendationEvidence || [],
      status: latestRec.userDecision,
      userFeedback: latestRec.feedbackComment,
      revisedAction: latestRec.revisedAction,
      decidedBy: latestRec.decidedBy,
      decidedAt: latestRec.decidedAt
    };
  } else if (record.recommendedAction) {
    recommendation = generateRecommendation(plainRecord);
  } else {
    recommendation = generateRecommendation(plainRecord);
  }

  const riskEval = evaluateRisk(plainRecord);
  const validation = validateReturnRecord(plainRecord, allRecords);

  return {
    ...plainRecord,
    ageingDays: riskEval.ageing.days,
    ageingStatus: riskEval.ageing.status,
    ageingLabel: riskEval.ageing.label,
    calculatedRiskScore: riskEval.score,
    calculatedRiskLevel: riskEval.riskLevel,
    riskReasons: riskEval.reasons,
    validation,
    recommendation
  };
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & REGISTRATION ENDPOINTS
// -------------------------------------------------------------

// POST /api/auth/register
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, confirmPassword, department, designation, employeeId } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Full name, email address, password, and confirmation are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match. Please verify your password entry.' });
    }

    if (password.length < 8 || !/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long and contain both letters and numbers.' });
    }

    const emailClean = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: emailClean } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const auditId = `AUD-${Date.now()}`;
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const [newUser] = await prisma.$transaction([
      prisma.user.create({
        data: {
          name: name.trim(),
          email: emailClean,
          passwordHash,
          role: 'RETURNS_ANALYST', // Public registrations default to Analyst
          status: 'PENDING',        // Requires Administrator Approval
          department: department ? department.trim() : 'Customer Returns & Operations',
          designation: designation ? designation.trim() : 'Operational Analyst',
          employeeId: employeeId ? employeeId.trim() : null,
          isActive: true
        }
      }),
      // Notification for Administrators
      prisma.notification.create({
        data: {
          title: `New Account Pending Approval: ${name.trim()}`,
          message: `${name.trim()} (${emailClean}) registered from ${department || 'General Department'}. Administrator approval required before access is granted.`,
          notificationType: 'HIGH',
          rule: 'USER_REGISTRATION_APPROVAL_REQUIRED'
        }
      }),
      // Audit Log
      prisma.auditLog.create({
        data: {
          id: auditId,
          timestamp: timestampStr,
          actor: name.trim(),
          persona: 'New Applicant',
          action: 'USER_REGISTERED',
          fieldChanged: 'status',
          oldValue: 'None',
          newValue: 'PENDING',
          reason: 'Self-service public user registration awaiting admin approval.',
          source: 'Registration Portal'
        }
      })
    ]);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully! Your access is currently PENDING administrator approval. Once approved, you can log in.',
      userId: newUser.id,
      email: newUser.email,
      status: newUser.status
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal failure processing account registration.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    // Check account approval status
    if (user.status === 'PENDING') {
      return res.status(403).json({
        error: 'Your registration is currently PENDING administrator approval. Please wait for an administrator to review and activate your access.'
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        error: 'Your account registration was reviewed and REJECTED by an administrator. Contact IT support if you believe this is in error.'
      });
    }

    if (!user.isActive || user.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Your user account has been deactivated or suspended. Please contact your system administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        employeeId: user.employeeId,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication service encountered an internal error.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        department: true,
        designation: true,
        employeeId: true,
        isActive: true,
        createdAt: true
      }
    });
    if (!user) return res.status(404).json({ error: 'User profile not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// POST /api/auth/forgot-password (Development/Demo Password Reset Flow)
app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      // Security: do not leak whether email exists
      return res.json({ success: true, message: 'If an account exists with that email, a password reset token has been generated.' });
    }

    const resetToken = `RST-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: expires
      }
    });

    res.json({
      success: true,
      message: 'Password reset token generated.',
      devNotice: 'In production, this token is dispatched via enterprise SMTP. In this environment, use the reset token below.',
      resetToken
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: 'Email, reset token, and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || user.passwordResetToken !== resetToken || !user.passwordResetExpires || new Date() > user.passwordResetExpires) {
      return res.status(400).json({ error: 'Invalid or expired password reset token. Please request a new token.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    await prisma.auditLog.create({
      data: {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: user.name,
        persona: user.role,
        action: 'PASSWORD_RESET',
        reason: 'Password successfully updated via verified reset token.',
        source: 'Security Services'
      }
    });

    res.json({ success: true, message: 'Password has been updated successfully. You can now log in with your new password.' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed.' });
  }
});

// -------------------------------------------------------------
// 2. USER MANAGEMENT & ADMIN ENDPOINTS (Admin Only)
// -------------------------------------------------------------

// GET /api/admin/users
app.get('/api/admin/users', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const where = {};

    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        department: true,
        designation: true,
        employeeId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ error: 'Failed to retrieve users directory.' });
  }
});

// PUT /api/admin/users/:id/status (Approve, Reject, Activate, Deactivate)
app.put('/api/admin/users/:id/status', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { status, role } = req.body;
    const targetId = req.params.id;

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) return res.status(404).json({ error: 'Target user not found.' });

    // Protect against deactivating the last active Admin
    if (targetUser.role === 'ADMIN' && (status === 'REJECTED' || status === 'SUSPENDED')) {
      const activeAdmins = await prisma.user.count({
        where: { role: 'ADMIN', status: 'APPROVED', isActive: true, id: { not: targetId } }
      });
      if (activeAdmins === 0) {
        return res.status(400).json({ error: 'Action denied: Cannot deactivate the sole remaining Administrator account.' });
      }
    }

    const updateData = {
      status,
      isActive: status === 'APPROVED'
    };
    if (role) updateData.role = role;
    if (status === 'APPROVED') updateData.approvedAt = new Date();

    const [updated, audit] = await prisma.$transaction([
      prisma.user.update({
        where: { id: targetId },
        data: updateData
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: req.user.name,
          persona: req.user.role,
          action: `USER_STATUS_${status}`,
          fieldChanged: 'status',
          oldValue: targetUser.status,
          newValue: status,
          reason: `Admin updated account status for ${targetUser.email} to ${status}${role ? ` (Role: ${role})` : ''}.`,
          source: 'User Management Console'
        }
      }),
      prisma.notification.create({
        data: {
          userId: targetId,
          title: `Account Registration ${status === 'APPROVED' ? 'Approved' : 'Updated'}`,
          message: status === 'APPROVED'
            ? `Your SunGrid account has been approved by ${req.user.name} with role ${role || targetUser.role}. You now have full access.`
            : `Your SunGrid account status was changed to ${status}.`,
          notificationType: status === 'APPROVED' ? 'INFO' : 'HIGH',
          rule: 'ADMIN_ACCOUNT_STATUS_CHANGE'
        }
      })
    ]);

    res.json({ success: true, message: `User status successfully updated to ${status}.`, user: updated });
  } catch (err) {
    console.error('Error updating user status:', err);
    res.status(500).json({ error: 'Failed to update user account status.' });
  }
});

// PUT /api/admin/users/:id/role
app.put('/api/admin/users/:id/role', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { role } = req.body;
    const targetId = req.params.id;

    if (!['RETURNS_ANALYST', 'RETURNS_MANAGER', 'FINANCE_APPROVER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    // Protect against demoting last remaining active admin
    if (targetUser.role === 'ADMIN' && role !== 'ADMIN') {
      const remainingAdmins = await prisma.user.count({
        where: { role: 'ADMIN', status: 'APPROVED', isActive: true, id: { not: targetId } }
      });
      if (remainingAdmins === 0) {
        return res.status(400).json({ error: 'Action denied: Cannot remove admin privileges from the last remaining Administrator.' });
      }
    }

    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id: targetId },
        data: { role }
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: req.user.name,
          persona: req.user.role,
          action: 'USER_ROLE_CHANGED',
          fieldChanged: 'role',
          oldValue: targetUser.role,
          newValue: role,
          reason: `Admin changed role for ${targetUser.email} to ${role}.`,
          source: 'User Management Console'
        }
      })
    ]);

    res.json({ success: true, message: `User role successfully updated to ${role}.`, user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// -------------------------------------------------------------
// 3. RETURN RECORD MANAGEMENT & CRUD ENDPOINTS
// -------------------------------------------------------------

// POST /api/returns (Create Return Record)
app.post('/api/returns', authenticateToken, async (req, res) => {
  try {
    const {
      sapDocument,
      returnOrder,
      companyCode,
      plant,
      storageLocation,
      costCenter,
      material,
      materialId,
      businessPartner,
      amount,
      currency,
      requestedDate,
      exceptionCategory,
      primaryExceptionReason,
      exceptionType,
      exceptionDescription
    } = req.body;

    // Validate required fields
    if (!sapDocument || !material || !plant || !storageLocation || !amount) {
      return res.status(400).json({
        error: 'Missing mandatory fields: SAP Document reference, Material, Plant, Storage Location, and Amount are required.'
      });
    }

    const cleanDoc = sapDocument.trim().toUpperCase();

    // Check duplicates in PostgreSQL
    const existing = await prisma.returnRecord.findUnique({ where: { sapDocument: cleanDoc } });
    if (existing) {
      return res.status(409).json({
        error: `Duplicate return rejected: A return record already exists for SAP Document reference '${cleanDoc}'.`
      });
    }

    const returnId = `RET-${Date.now().toString().slice(-6)}`;
    const parsedAmount = new Prisma.Decimal(amount);
    const dateParsed = requestedDate ? new Date(requestedDate) : new Date();

    const plantName = plant === '1108' ? 'Plant 1108 (Solar Module Fabrication)' : 'Plant 1102 (Wind Turbine Components)';
    const storageLocationName = storageLocation === 'SL11' ? 'SL11 - Returns & Quality Quarantine' : `${storageLocation} - Returns Intake`;
    const costCenterName = costCenter === 'CC-2208' ? 'CC-2208 - Customer Service & Warranty' : `${costCenter} - Operational Absorption`;

    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const [newReturn, timelineEvent, auditEntry] = await prisma.$transaction([
      prisma.returnRecord.create({
        data: {
          id: returnId,
          returnOrder: returnOrder || `RO-${Math.floor(700000 + Math.random() * 90000)}`,
          sapDocument: cleanDoc,
          companyCode: companyCode || '1300',
          plant,
          plantName,
          storageLocation,
          storageLocationName,
          costCenter: costCenter || 'CC-2208',
          costCenterName,
          material: material.trim(),
          materialId: materialId || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
          businessPartner: businessPartner || 'External Customer',
          amount: parsedAmount,
          currency: currency || 'GBP',
          requestedDate: dateParsed,
          processingStatus: 'Unassigned',
          exceptionCategory: exceptionCategory || 'Execution Mismatch',
          primaryExceptionReason: primaryExceptionReason || exceptionDescription || 'Customer return exception pending triage',
          exceptionType: exceptionType || 'Quality & Quantity Variance',
          exceptionDescription: exceptionDescription || primaryExceptionReason,
          createdById: req.user?.id || null,
          riskLevel: Number(parsedAmount) > 20000 ? 'HIGH' : 'MEDIUM',
          riskScore: Number(parsedAmount) > 20000 ? 65 : 40,
          riskReasons: ['New exception created in system', `Initial exposure: £${Number(parsedAmount).toLocaleString()}`]
        }
      }),
      prisma.returnEvent.create({
        data: {
          returnRecordId: returnId,
          step: 'Customer Return Case Created',
          timestamp: timestampStr,
          actor: `${req.user?.name || 'Operator'} (${req.user?.role || 'Returns Analyst'})`,
          status: 'CREATED',
          docRef: cleanDoc,
          sapTx: 'VA01 / SunGrid Portal',
          detail: `Case created with initial exposure £${Number(parsedAmount).toLocaleString()}.`
        }
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now()}`,
          timestamp: timestampStr,
          actor: req.user?.name || 'Operator',
          persona: req.user?.role || 'Returns Analyst',
          recordId: returnId,
          sapDocument: cleanDoc,
          action: 'RETURN_CREATED',
          fieldChanged: 'id',
          oldValue: 'None',
          newValue: returnId,
          reason: `New return record created with amount £${Number(parsedAmount).toLocaleString()}.`,
          source: 'Work Queue Portal'
        }
      }),
      prisma.notification.create({
        data: {
          title: `New Return Case Created: ${cleanDoc}`,
          message: `Return order for ${material} (${cleanDoc}) at Plant ${plant} has been registered. Triage and owner assignment required.`,
          notificationType: Number(parsedAmount) > 20000 ? 'HIGH' : 'INFO',
          relatedReturnId: returnId,
          rule: 'NEW_RETURN_CREATED'
        }
      })
    ]);

    res.status(201).json({
      success: true,
      message: `Customer return record '${cleanDoc}' created successfully in PostgreSQL.`,
      record: enrichReturn(newReturn)
    });
  } catch (err) {
    console.error('Error creating return:', err);
    res.status(500).json({ error: 'Database transaction failed creating return record.' });
  }
});

// GET /api/returns (Query with server-side filters, search & pagination)
app.get('/api/returns', authenticateToken, async (req, res) => {
  try {
    const { search, plant, riskLevel, processingStatus, owner, page = 1, limit = 50, includeArchived } = req.query;

    const where = {};
    if (includeArchived !== 'true') {
      where.isArchived = false;
    }
    if (plant) where.plant = plant;
    if (riskLevel) where.riskLevel = riskLevel;
    if (processingStatus) where.processingStatus = processingStatus;

    if (owner) {
      if (owner === 'unassigned') {
        where.OR = [{ assignedOwner: null }, { assignedOwner: { contains: 'Unassigned', mode: 'insensitive' } }];
      } else {
        where.assignedOwner = { contains: owner, mode: 'insensitive' };
      }
    }

    if (search) {
      where.OR = [
        { sapDocument: { contains: search, mode: 'insensitive' } },
        { returnOrder: { contains: search, mode: 'insensitive' } },
        { material: { contains: search, mode: 'insensitive' } },
        { businessPartner: { contains: search, mode: 'insensitive' } },
        { primaryExceptionReason: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const take = Number(limit);

    const [totalCount, rawRecords] = await Promise.all([
      prisma.returnRecord.count({ where }),
      prisma.returnRecord.findMany({
        where,
        include: {
          comments: { orderBy: { createdAt: 'asc' } },
          timeline: { orderBy: { createdAt: 'asc' } },
          attachments: { orderBy: { createdAt: 'asc' } },
          recommendationFeedbacks: { orderBy: { createdAt: 'asc' } }
        },
        orderBy: { requestedDate: 'asc' },
        skip,
        take
      })
    ]);

    const enriched = rawRecords.map(r => enrichReturn(r, rawRecords));

    res.json({
      data: enriched,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching return records:', err);
    res.status(500).json({ error: 'Database query failure fetching returns.' });
  }
});

// GET /api/returns/:id
app.get('/api/returns/:id', authenticateToken, async (req, res) => {
  try {
    const record = await prisma.returnRecord.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { sapDocument: req.params.id }
        ]
      },
      include: {
        comments: { orderBy: { createdAt: 'asc' } },
        timeline: { orderBy: { createdAt: 'asc' } },
        attachments: { orderBy: { createdAt: 'asc' } },
        recommendationFeedbacks: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!record) {
      return res.status(404).json({ error: `Return record '${req.params.id}' not found in database.` });
    }

    res.json(enrichReturn(record));
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve record from database.' });
  }
});

// PUT /api/returns/:id (Update Record)
app.put('/api/returns/:id', authenticateToken, async (req, res) => {
  try {
    const record = await prisma.returnRecord.findFirst({
      where: { OR: [{ id: req.params.id }, { sapDocument: req.params.id }] }
    });

    if (!record) return res.status(404).json({ error: 'Record not found' });

    const updates = {};
    const allowed = ['material', 'storageLocation', 'costCenter', 'exceptionCategory', 'primaryExceptionReason', 'resolutionNotes', 'deliveryDocument', 'goodsReceiptStatus'];
    allowed.forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const [updated, audit] = await prisma.$transaction([
      prisma.returnRecord.update({
        where: { id: record.id },
        data: updates,
        include: {
          comments: { orderBy: { createdAt: 'asc' } },
          timeline: { orderBy: { createdAt: 'asc' } },
          attachments: { orderBy: { createdAt: 'asc' } },
          recommendationFeedbacks: { orderBy: { createdAt: 'asc' } }
        }
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: req.user?.name || 'Operator',
          persona: req.user?.role || 'Returns Analyst',
          recordId: record.id,
          sapDocument: record.sapDocument,
          action: 'RETURN_UPDATED',
          reason: req.body.updateReason || 'Record metadata updated.',
          source: 'Return Details Workspace'
        }
      })
    ]);

    res.json({ success: true, record: enrichReturn(updated) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update return record in database.' });
  }
});

// DELETE /api/returns/:id (Controlled Soft Archival)
app.delete('/api/returns/:id', authenticateToken, requireRole('ADMIN', 'RETURNS_MANAGER'), async (req, res) => {
  try {
    const record = await prisma.returnRecord.findFirst({
      where: { OR: [{ id: req.params.id }, { sapDocument: req.params.id }] }
    });

    if (!record) return res.status(404).json({ error: 'Record not found' });

    const [archived] = await prisma.$transaction([
      prisma.returnRecord.update({
        where: { id: record.id },
        data: {
          isArchived: true,
          archivedAt: new Date(),
          archivedById: req.user?.id || null
        }
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: req.user?.name || 'Operator',
          persona: req.user?.role || 'Admin',
          recordId: record.id,
          sapDocument: record.sapDocument,
          action: 'RETURN_ARCHIVED',
          reason: req.body.reason || 'Record soft-archived by authorized manager.',
          source: 'Exception Work Queue'
        }
      })
    ]);

    res.json({ success: true, message: `Record '${record.sapDocument}' has been safely archived in PostgreSQL.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive record.' });
  }
});

// POST /api/returns/:id/attachments (File Upload)
app.post('/api/returns/:id/attachments', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const record = await prisma.returnRecord.findFirst({
      where: { OR: [{ id: req.params.id }, { sapDocument: req.params.id }] }
    });

    if (!record) return res.status(404).json({ error: 'Record not found' });

    const attachment = await prisma.attachment.create({
      data: {
        returnRecordId: record.id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileUrl: `/uploads/${req.file.filename}`,
        uploadedById: req.user?.id || null,
        uploadedByName: req.user?.name || 'Operator'
      }
    });

    await prisma.auditLog.create({
      data: {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: req.user?.name || 'Operator',
        persona: req.user?.role || 'Operator',
        recordId: record.id,
        sapDocument: record.sapDocument,
        action: 'ATTACHMENT_UPLOADED',
        newValue: req.file.originalname,
        reason: `Supporting document uploaded: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`,
        source: 'Resolution Workspace'
      }
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded and linked to return record in PostgreSQL.',
      attachment
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: err.message || 'File upload failed.' });
  }
});

// -------------------------------------------------------------
// 4. ASSIGNMENT, COMMENTS & APPROVAL WORKFLOWS
// -------------------------------------------------------------

// POST /api/returns/:id/assign
app.post('/api/returns/:id/assign', authenticateToken, async (req, res) => {
  try {
    const { newOwner, reason, actor, persona } = req.body;
    const callerPersona = req.user?.role || persona || 'RETURNS_MANAGER';

    const record = await prisma.returnRecord.findFirst({
      where: { OR: [{ id: req.params.id }, { sapDocument: req.params.id }] }
    });

    if (!record) return res.status(404).json({ error: 'Record not found' });

    // Role verification
    if (callerPersona === 'FINANCE_APPROVER' && !newOwner.includes('Finance')) {
      return res.status(403).json({ error: 'Finance Approvers can only reassign to Finance roles.' });
    }

    const previousOwner = record.assignedOwner || 'Unassigned';
    const auditId = `AUD-${Date.now()}`;
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const [updatedRecord, auditEntry, notif] = await prisma.$transaction([
      prisma.returnRecord.update({
        where: { id: record.id },
        data: {
          assignedOwner: newOwner,
          processingStatus: record.processingStatus === 'Unassigned' ? 'In Review' : record.processingStatus
        },
        include: {
          comments: { orderBy: { createdAt: 'asc' } },
          timeline: { orderBy: { createdAt: 'asc' } },
          attachments: { orderBy: { createdAt: 'asc' } },
          recommendationFeedbacks: { orderBy: { createdAt: 'asc' } }
        }
      }),
      prisma.auditLog.create({
        data: {
          id: auditId,
          timestamp: timestampStr,
          actor: actor || req.user?.name || 'P. Sundaram',
          persona: persona || req.user?.role || 'Returns Manager',
          recordId: record.id,
          sapDocument: record.sapDocument,
          action: 'OWNER_REASSIGNED',
          fieldChanged: 'assignedOwner',
          oldValue: previousOwner,
          newValue: newOwner,
          reason: reason || 'Operational case reassignment',
          source: 'Exception Work Queue'
        }
      }),
      prisma.notification.create({
        data: {
          title: `Case Assigned: ${record.sapDocument}`,
          message: `Return order ${record.returnOrder} has been assigned to ${newOwner}. Please review and execute required triage.`,
          notificationType: 'INFO',
          relatedReturnId: record.id,
          rule: 'CASE_ASSIGNMENT'
        }
      })
    ]);

    res.json({
      success: true,
      message: `Owner successfully assigned to ${newOwner}`,
      record: enrichReturn(updatedRecord),
      auditEntry
    });
  } catch (err) {
    console.error('Error assigning owner:', err);
    res.status(500).json({ error: 'Database transaction failed during assignment.' });
  }
});

// POST /api/returns/:id/comment
app.post('/api/returns/:id/comment', authenticateToken, async (req, res) => {
  try {
    const { text, author, persona } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    const record = await prisma.returnRecord.findFirst({
      where: { OR: [{ id: req.params.id }, { sapDocument: req.params.id }] }
    });

    if (!record) return res.status(404).json({ error: 'Record not found' });

    const commentId = `COM-${Date.now()}`;
    const auditId = `AUD-${Date.now()}`;
    const authorName = author || req.user?.name || 'User';
    const personaName = persona || req.user?.role || 'Returns Analyst';
    const now = new Date();
    const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const [newComment, auditEntry] = await prisma.$transaction([
      prisma.returnComment.create({
        data: {
          id: commentId,
          returnRecordId: record.id,
          userId: req.user?.id || null,
          author: authorName,
          persona: personaName,
          text: text.trim(),
          timestamp: now
        }
      }),
      prisma.auditLog.create({
        data: {
          id: auditId,
          timestamp: timestampStr,
          actor: authorName,
          persona: personaName,
          recordId: record.id,
          sapDocument: record.sapDocument,
          action: 'COMMENT_ADDED',
          fieldChanged: 'comments',
          oldValue: 'Previous comments',
          newValue: text.trim().substring(0, 60),
          reason: text.trim().substring(0, 100),
          source: 'Resolution Workspace'
        }
      })
    ]);

    const allComments = await prisma.returnComment.findMany({
      where: { returnRecordId: record.id },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      comment: {
        id: newComment.id,
        author: newComment.author,
        persona: newComment.persona,
        timestamp: timestampStr,
        text: newComment.text
      },
      comments: allComments.map(c => ({
        id: c.id,
        author: c.author,
        persona: c.persona,
        timestamp: c.timestamp instanceof Date ? c.timestamp.toISOString().replace('T', ' ').substring(0, 19) : c.timestamp,
        text: c.text
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record comment in database.' });
  }
});

// POST /api/returns/:id/recommendation-decision
app.post('/api/returns/:id/recommendation-decision', authenticateToken, async (req, res) => {
  try {
    const { decision, feedback, revisedAction, actor, persona } = req.body;

    const record = await prisma.returnRecord.findFirst({
      where: { OR: [{ id: req.params.id }, { sapDocument: req.params.id }] }
    });

    if (!record) return res.status(404).json({ error: 'Record not found' });

    const defaultRec = generateRecommendation(record);
    const recId = `REC-${record.id}-${Date.now()}`;
    const auditId = `AUD-${Date.now()}`;
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const [recFeedback, auditEntry] = await prisma.$transaction([
      prisma.recommendationFeedback.create({
        data: {
          id: recId,
          returnRecordId: record.id,
          recommendation: revisedAction || defaultRec.nextAction || 'Standard resolution procedure',
          confidence: defaultRec.confidence || '94%',
          recommendationEvidence: defaultRec.evidence || [],
          userDecision: decision,
          feedbackComment: feedback || '',
          revisedAction: revisedAction || null,
          userId: req.user?.id || null,
          decidedBy: actor || req.user?.name || 'User',
          decidedAt: new Date()
        }
      }),
      prisma.auditLog.create({
        data: {
          id: auditId,
          timestamp: timestampStr,
          actor: actor || req.user?.name || 'User',
          persona: persona || req.user?.role || 'Returns Analyst',
          recordId: record.id,
          sapDocument: record.sapDocument,
          action: `RECOMMENDATION_${decision}`,
          fieldChanged: 'recommendation.status',
          oldValue: 'PENDING_DECISION',
          newValue: decision,
          reason: feedback || `User ${decision.toLowerCase()} recommendation`,
          source: 'Recommendation Engine'
        }
      })
    ]);

    res.json({
      success: true,
      recommendation: {
        status: recFeedback.userDecision,
        nextAction: recFeedback.recommendation,
        confidence: recFeedback.confidence,
        evidence: recFeedback.recommendationEvidence,
        userFeedback: recFeedback.feedbackComment,
        revisedAction: recFeedback.revisedAction,
        decidedBy: recFeedback.decidedBy,
        decidedAt: recFeedback.decidedAt
      },
      auditEntry
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record recommendation decision.' });
  }
});

// POST /api/returns/:id/action (Approve, Reject, Request Approval, Escalate, Resolve)
app.post('/api/returns/:id/action', authenticateToken, async (req, res) => {
  try {
    const { actionType, targetStatus, reason, actor, persona, adjustmentDetails } = req.body;

    const record = await prisma.returnRecord.findFirst({
      where: { OR: [{ id: req.params.id }, { sapDocument: req.params.id }] }
    });

    if (!record) return res.status(404).json({ error: 'Record not found' });

    // Enforce rejection reason
    if (actionType === 'REJECT' && (!reason || reason.trim().length < 5)) {
      return res.status(400).json({
        error: 'A detailed rejection reason (minimum 5 characters) is mandatory to reject a customer return in compliance with SAP SD audit policy.'
      });
    }

    // Role & Approval Authority Check
    const userRole = req.user?.role || PERSONA_TO_ROLE[persona] || 'RETURNS_ANALYST';
    const amountVal = Number(record.amount);

    if (actionType === 'APPROVE') {
      if (userRole === 'RETURNS_ANALYST') {
        return res.status(403).json({ error: 'Returns Analysts cannot approve returns. Operational approval requires Returns Manager or Finance Approver.' });
      }
      if (amountVal > 20000 && userRole !== 'FINANCE_APPROVER' && userRole !== 'ADMIN') {
        return res.status(403).json({ error: `Return exposure of £${amountVal.toLocaleString()} exceeds the single-manager limit of £20,000. Finance Approver role required.` });
      }
    }

    const nextStatus = targetStatus || (actionType === 'APPROVE' ? 'Completed' : actionType === 'REJECT' ? 'Rejected' : 'Pending Approval');
    const transitionCheck = validateAllowedStatusTransition(record.processingStatus, nextStatus, persona);

    if (!transitionCheck.allowed) {
      return res.status(403).json({ error: transitionCheck.reason });
    }

    // SAP OData Adapter integration call
    let sapResult = null;
    try {
      sapResult = await sapAdapter.postReturnAction(record.id, actionType, {
        requestedBy: actor || req.user?.name,
        persona,
        reason,
        adjustmentDetails
      });
    } catch (sapErr) {
      return res.status(502).json({
        error: sapErr.message,
        sapAdapterStatus: 'SAP RFC connection failed. Live transaction not committed.'
      });
    }

    const oldStatus = record.processingStatus;
    const now = new Date();
    const timestampStr = now.toISOString().replace('T', ' ').substring(0, 16);
    const auditTimestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    let updatedBillingBlock = record.billingBlock;
    let updatedCreditMemo = record.creditMemoDoc;

    if (actionType === 'APPROVE') {
      updatedBillingBlock = 'None';
      updatedCreditMemo = updatedCreditMemo || `CR-${Math.floor(900000 + Math.random() * 90000)}`;
    } else if (actionType === 'REJECT') {
      updatedBillingBlock = '99 - Return Rejected / Cancelled';
    }

    const eventId = `EVT-${record.id}-${Date.now()}`;
    const approvalId = `APP-${record.id}-${Date.now()}`;
    const auditId = `AUD-${Date.now()}`;

    const [updatedRecord, timelineEvent, auditEntry, approvalRecord, notif] = await prisma.$transaction([
      prisma.returnRecord.update({
        where: { id: record.id },
        data: {
          processingStatus: nextStatus,
          billingBlock: updatedBillingBlock,
          creditMemoDoc: updatedCreditMemo
        },
        include: {
          comments: { orderBy: { createdAt: 'asc' } },
          timeline: { orderBy: { createdAt: 'asc' } },
          attachments: { orderBy: { createdAt: 'asc' } },
          recommendationFeedbacks: { orderBy: { createdAt: 'asc' } }
        }
      }),
      prisma.returnEvent.create({
        data: {
          id: eventId,
          returnRecordId: record.id,
          step: actionType === 'APPROVE' ? 'Credit Memo Approved & Posted' : actionType === 'REJECT' ? 'Return Rejected' : 'Approval Requested',
          timestamp: timestampStr,
          actor: `${actor || req.user?.name || 'User'} (${persona || req.user?.role || 'Operator'})`,
          status: actionType === 'APPROVE' ? 'COMPLETED' : actionType === 'REJECT' ? 'REJECTED' : 'PENDING',
          docRef: updatedCreditMemo || record.sapDocument,
          sapTx: actionType === 'APPROVE' ? 'VF01 (Credit Posted)' : 'VA02 / BKP',
          detail: reason || `Action ${actionType} completed successfully via SAP OData adapter.`
        }
      }),
      prisma.auditLog.create({
        data: {
          id: auditId,
          timestamp: auditTimestamp,
          actor: actor || req.user?.name || 'User',
          persona: persona || req.user?.role || 'Operator',
          recordId: record.id,
          sapDocument: record.sapDocument,
          action: `ACTION_${actionType}`,
          fieldChanged: 'processingStatus',
          oldValue: oldStatus,
          newValue: nextStatus,
          reason: reason || `Action ${actionType} triggered by ${persona || req.user?.role}`,
          source: 'Resolution Workspace',
          sapReference: sapResult.sapReferenceDoc
        }
      }),
      prisma.approval.create({
        data: {
          id: approvalId,
          returnRecordId: record.id,
          requestedById: actionType === 'REQUEST_APPROVAL' ? req.user?.id : null,
          approverId: actionType === 'APPROVE' || actionType === 'REJECT' ? req.user?.id : null,
          actionType,
          approvalStatus: actionType === 'APPROVE' ? 'APPROVED' : actionType === 'REJECT' ? 'REJECTED' : 'PENDING',
          decisionComment: reason || null,
          decidedAt: now
        }
      }),
      prisma.notification.create({
        data: {
          title: `Return Status: ${record.sapDocument} -> ${nextStatus}`,
          message: `Return ${record.sapDocument} transitioned to '${nextStatus}' by ${actor || req.user?.name}. Action: ${actionType}.`,
          notificationType: actionType === 'REJECT' ? 'CRITICAL' : 'INFO',
          relatedReturnId: record.id,
          rule: 'STATUS_TRANSITION'
        }
      })
    ]);

    res.json({
      success: true,
      record: enrichReturn(updatedRecord),
      auditEntry,
      sapResult
    });
  } catch (err) {
    console.error('Error executing action:', err);
    res.status(500).json({ error: 'Database transaction failed executing return action.' });
  }
});

// -------------------------------------------------------------
// 5. AUDIT LOGS, NOTIFICATIONS & REPORTING EXPORTS
// -------------------------------------------------------------

// GET /api/audit-logs
app.get('/api/audit-logs', authenticateToken, async (req, res) => {
  try {
    const { search, recordId, persona, limit = 100 } = req.query;

    const where = {};
    if (recordId) {
      where.OR = [{ recordId }, { sapDocument: recordId }];
    }
    if (persona) {
      where.persona = { equals: persona, mode: 'insensitive' };
    }

    let logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(a =>
        a.action.toLowerCase().includes(q) ||
        a.actor.toLowerCase().includes(q) ||
        (a.reason && a.reason.toLowerCase().includes(q)) ||
        (a.sapDocument && a.sapDocument.toLowerCase().includes(q))
      );
    }

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve audit trail from database.' });
  }
});

// GET /api/analytics
app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const rawRecords = await prisma.returnRecord.findMany({
      where: { isArchived: false },
      include: {
        comments: true,
        timeline: true,
        recommendationFeedbacks: true
      }
    });

    const enriched = rawRecords.map(r => enrichReturn(r, rawRecords));
    const recentActivities = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const totalReturns = enriched.length;
    const activeExceptions = enriched.filter(r => r.processingStatus !== 'Completed' && r.processingStatus !== 'Rejected').length;
    const pendingApprovals = enriched.filter(r => r.processingStatus === 'Pending Approval').length;
    const overdueCases = enriched.filter(r => r.ageingStatus === 'OVERDUE').length;

    const totalExposureGbp = enriched
      .filter(r => r.processingStatus !== 'Completed' && r.processingStatus !== 'Rejected')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const completedReturns = enriched.filter(r => r.processingStatus === 'Completed');
    const compliantReturns = completedReturns.filter(r => r.ageingDays <= DEFAULT_THRESHOLDS.attentionDays).length;
    const slaAdherencePct = completedReturns.length > 0 ? Math.round((compliantReturns / completedReturns.length) * 100) : 78;
    const firstPassYieldPct = 68;
    const recurrenceRatePct = 14;

    const ageingBuckets = {
      '0-3 Days (Normal)': enriched.filter(r => r.ageingDays <= 3).length,
      '4-7 Days (Attention)': enriched.filter(r => r.ageingDays > 3 && r.ageingDays <= 7).length,
      '8-14 Days (Overdue)': enriched.filter(r => r.ageingDays > 7 && r.ageingDays <= 14).length,
      '15+ Days (Critical)': enriched.filter(r => r.ageingDays > 14).length
    };

    const statusCounts = {};
    enriched.forEach(r => {
      statusCounts[r.processingStatus] = (statusCounts[r.processingStatus] || 0) + 1;
    });

    const plantCounts = {
      'Plant 1108 (Solar)': enriched.filter(r => r.plant === '1108').length,
      'Plant 1102 (Wind)': enriched.filter(r => r.plant === '1102').length
    };

    const exceptionCategories = {};
    enriched.forEach(r => {
      const cat = r.exceptionCategory || 'General Discrepancy';
      exceptionCategories[cat] = (exceptionCategories[cat] || 0) + 1;
    });

    res.json({
      kpis: {
        totalReturns,
        activeExceptions,
        pendingApprovals,
        overdueCases,
        totalExposureGbp,
        averageResolutionDays: 6.4,
        firstPassYieldPct,
        slaAdherencePct,
        recurrenceRatePct,
        annualRevenueAtRiskContext: '1% - 2% of £2.1B annual revenue (£21M - £42M enterprise context)'
      },
      ageingBuckets,
      statusCounts,
      plantCounts,
      exceptionCategories,
      recentActivities
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate analytics from database.' });
  }
});

// GET /api/notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load notifications.' });
  }
});

// PUT /api/notifications/:id/read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json({ success: true, notification: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification read status.' });
  }
});

// PUT /api/notifications/mark-all-read
app.put('/api/notifications/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
});

// GET /api/reports/export (CSV / JSON data export)
app.get('/api/reports/export', authenticateToken, async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const records = await prisma.returnRecord.findMany({
      where: { isArchived: false },
      orderBy: { requestedDate: 'desc' }
    });

    const enriched = records.map(r => enrichReturn(r, records));

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="sungrid_returns_report.json"');
      return res.json(enriched);
    }

    // CSV format
    const headers = ['ID', 'SAP_Document', 'Return_Order', 'Plant', 'Storage_Location', 'Cost_Center', 'Material', 'Amount_GBP', 'Status', 'Risk_Level', 'Risk_Score', 'Ageing_Days', 'Assigned_Owner', 'Requested_Date'];
    const rows = enriched.map(r => [
      r.id,
      r.sapDocument,
      r.returnOrder,
      r.plant,
      r.storageLocation,
      r.costCenter,
      `"${r.material}"`,
      r.amount,
      r.processingStatus,
      r.calculatedRiskLevel,
      r.calculatedRiskScore,
      r.ageingDays,
      `"${r.assignedOwner || 'Unassigned'}"`,
      r.requestedDate
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sungrid_customer_returns_report.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report export.' });
  }
});

// -------------------------------------------------------------
// 6. SAP S/4HANA ADAPTER BOUNDARY
// -------------------------------------------------------------

app.get('/api/sap/status', (req, res) => {
  res.json(sapAdapter.getConfig());
});

app.post('/api/sap/config', authenticateToken, (req, res) => {
  const updated = sapAdapter.updateConfig(req.body);
  res.json(updated);
});

app.post('/api/sap/ping', async (req, res) => {
  const pingResult = await sapAdapter.pingHealth();
  res.status(pingResult.status === 200 ? 200 : 503).json(pingResult);
});

// Health check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'DISCONNECTED';
  let recordsCount = 0;

  try {
    const count = await prisma.returnRecord.count();
    dbStatus = 'CONNECTED (Neon PostgreSQL)';
    recordsCount = count;
  } catch (err) {
    dbStatus = `ERROR: ${err.message}`;
  }

  res.json({
    status: 'ONLINE',
    enterprise: 'SunGrid Renewables',
    systemOfRecord: 'SAP S/4HANA SD (Lead to Cash > Returns Management - BKP)',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    recordsCount,
    sapAdapter: sapAdapter.getConfig()
  });
});

// POST /api/reset-data (Admin only)
app.post('/api/reset-data', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { execSync } = await import('child_process');
    execSync('node prisma/seed.js', { cwd: __dirname, stdio: 'inherit' });
    const count = await prisma.returnRecord.count();
    res.json({
      success: true,
      message: 'Demo dataset successfully restored to original baseline in Neon PostgreSQL.',
      recordsCount: count
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset demo dataset.' });
  }
});

// Serve static frontend build if present
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`SunGrid Renewables SAP SD Exception Control Server running on port ${PORT}`);
  console.log(`Operational Database: Neon PostgreSQL via Prisma ORM`);
});
