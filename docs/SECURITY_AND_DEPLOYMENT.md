# Security Architecture & Production Deployment Guide

**Author:** Karthik Thalipineni  
**Target Environments:** Neon (PostgreSQL), Render (Express Backend), Vercel (React Frontend)  

---

## 1. Security Architecture & Threat Mitigation

### A. Secret Management & Zero-Leakage Policy
- **Database Credentials:** Connection strings (`DATABASE_URL`, `DIRECT_URL`) reside exclusively in server-side environment variables. They are never exposed in Git, client bundles, or frontend `VITE_` variables.
- **Git Exclusions:** Both `.gitignore` and `server/.gitignore` exclude `.env`, `.env.local`, and build artifacts.
- **Connection Sanitization:** Full connection strings and passwords are never output to application logs.

### B. Authentication & Password Security
- **Algorithm:** Passwords hashed with `bcryptjs` using 10 salt rounds. Plain-text passwords are never stored or compared in memory.
- **Stateless Tokens:** JSON Web Tokens (JWT) signed with a 256-bit cryptographically secure secret (`JWT_SECRET`), expiring after 24 hours.
- **Brute-Force Mitigation:** `express-rate-limit` enforces a ceiling of 100 authentication requests per 15-minute window per IP on `/api/auth/login`.

### C. Defense-in-Depth Middleware
- **Security Headers (`helmet`):** Injects standard HTTP headers, disables `x-powered-by`, and enforces `crossOriginResourcePolicy: { policy: 'cross-origin' }`.
- **CORS Protection:** Rejects unauthorized origin headers while allowing configured client domains.
- **SQL Injection Prevention:** Prisma ORM automatically uses parameterized queries across all database operations, completely neutralizing SQL injection risks.

---

## 2. Neon PostgreSQL Database Configuration

1. **Database Provider:** Neon Cloud PostgreSQL (AWS `us-east-2`).
2. **Pooled Endpoint (`DATABASE_URL`):**
   ```
   postgresql://neondb_owner:<password>@ep-lucky-bread-beiju9t3-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
   *Usage:* Runtime queries from Express backend via PgBouncer.
3. **Direct Endpoint (`DIRECT_URL`):**
   ```
   postgresql://neondb_owner:<password>@ep-lucky-bread-beiju9t3.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
   *Usage:* Prisma migration engine (`prisma migrate dev`, `prisma migrate deploy`).

---

## 3. Render Backend Deployment Configuration

- **Service Type:** Web Service
- **Environment:** Node.js
- **Root Directory:** `server`
- **Build Command:**
  ```bash
  npm install && npx prisma generate && npx prisma migrate deploy
  ```
- **Start Command:**
  ```bash
  npm start
  ```
- **Environment Variables:**
  - `DATABASE_URL`: `<Neon Pooled Connection String>`
  - `DIRECT_URL`: `<Neon Direct Connection String>`
  - `JWT_SECRET`: `<64-character random secret>`
  - `NODE_ENV`: `production`
  - `CLIENT_URL`: `https://<your-vercel-frontend>.vercel.app`
- **Health Check Path:** `/api/health`

---

## 4. Vercel Frontend Deployment Configuration

- **Framework Preset:** Vite
- **Root Directory:** `client`
- **Build Command:**
  ```bash
  npm run build
  ```
- **Output Directory:** `dist`
- **Environment Variable:**
  - `VITE_API_BASE_URL`: `https://<your-render-backend-service>.onrender.com/api`
- **SPA Routing Rewrite (`vercel.json`):**
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
