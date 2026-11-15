import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from '../config/database.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'sungrid_default_secret_key_change_in_production';

// Map textual personas to canonical enum roles
export const PERSONA_TO_ROLE = {
  'Returns Analyst': 'RETURNS_ANALYST',
  'Returns Manager': 'RETURNS_MANAGER',
  'Finance Approver': 'FINANCE_APPROVER',
  'Administrator': 'ADMIN',
  'Admin': 'ADMIN',
  'RETURNS_ANALYST': 'RETURNS_ANALYST',
  'RETURNS_MANAGER': 'RETURNS_MANAGER',
  'FINANCE_APPROVER': 'FINANCE_APPROVER',
  'ADMIN': 'ADMIN'
};

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Authentication middleware (extracts JWT or falls back to persona context for seamless demo/API transition)
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired session token. Please sign in again.' });
    }
  }

  // Graceful fallback for demo UI persona selector if no token provided
  const headerPersona = req.headers['x-persona'] || req.body?.persona;
  const headerActor = req.headers['x-actor'] || req.body?.actor;

  if (headerPersona) {
    const canonicalRole = PERSONA_TO_ROLE[headerPersona] || 'RETURNS_ANALYST';
    req.user = {
      id: null,
      name: headerActor || headerPersona,
      role: canonicalRole,
      isDemoPersona: true
    };
    return next();
  }

  // Allow unauthenticated reading for public endpoints or assign default viewer
  req.user = {
    id: null,
    name: 'P. Sundaram',
    role: 'RETURNS_MANAGER',
    isDemoPersona: true
  };
  next();
}

// Strict authentication middleware (requires valid JWT token)
export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Authorization Bearer token missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Role-based authorization middleware
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const userRole = req.user.role;
    if (userRole === 'ADMIN' || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      error: `Access denied. Role '${userRole}' is not authorized to perform this action. Required: ${allowedRoles.join(' or ')}.`
    });
  };
}

