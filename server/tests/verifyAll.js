import { PrismaClient, Prisma } from '@prisma/client';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const results = [];

function recordTest(name, expected, actual, passed, notes = '') {
  results.push({ name, expected, actual, passed, notes });
  const symbol = passed ? '✔ PASS' : '✘ FAIL';
  console.log(`${symbol} | ${name}: ${notes || actual}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('   SUNGRID RENEWABLES: COMPREHENSIVE AUTOMATED TEST SUITE       ');
  console.log('================================================================\n');

  // --- 1. Database Connectivity ---
  try {
    const timeRes = await prisma.$queryRaw`SELECT NOW() as current_time`;
    recordTest(
      'Database Connection',
      'Successful connection to Neon PostgreSQL',
      `Connected! DB Server Time: ${timeRes[0].current_time}`,
      true
    );
  } catch (err) {
    recordTest('Database Connection', 'Connected', err.message, false);
  }

  // --- 2. Foreign Key & CRUD Operations ---
  const testId = `TEST-RET-${Date.now()}`;
  const testSapDoc = `TEST-DOC-${Date.now()}`;
  try {
    const created = await prisma.returnRecord.create({
      data: {
        id: testId,
        returnOrder: 'RO-TEST-999',
        sapDocument: testSapDoc,
        companyCode: '1300',
        plant: '1108',
        storageLocation: 'SL11',
        costCenter: 'CC-2208',
        material: 'Test Solar Wafer',
        amount: new Prisma.Decimal(12500.50),
        requestedDate: new Date('2026-09-01'),
        processingStatus: 'In Review',
        riskLevel: 'MEDIUM',
        riskScore: 55,
        riskReasons: ['Test case insertion']
      }
    });

    const comment = await prisma.returnComment.create({
      data: {
        returnRecordId: testId,
        author: 'P. Sundaram',
        persona: 'Returns Manager',
        text: 'Automated test comment verifying foreign key cascading.'
      }
    });

    const event = await prisma.returnEvent.create({
      data: {
        returnRecordId: testId,
        step: 'Automated Test Inspection',
        actor: 'Test Runner',
        status: 'VERIFIED',
        timestamp: new Date().toISOString()
      }
    });

    const fetched = await prisma.returnRecord.findUnique({
      where: { id: testId },
      include: { comments: true, timeline: true }
    });

    const passed = fetched && fetched.comments.length === 1 && fetched.timeline.length === 1;
    recordTest(
      'Prisma CRUD & Foreign Key Relationships',
      'Create and retrieve record with nested comments and timeline',
      `Record ${testId} created and verified with ${fetched.comments.length} comment and ${fetched.timeline.length} timeline event.`,
      passed
    );

    // Cascade delete test
    await prisma.returnRecord.delete({ where: { id: testId } });
    const remainingComments = await prisma.returnComment.count({ where: { returnRecordId: testId } });
    recordTest(
      'Cascade Deletion Integrity',
      'Child comments deleted when parent ReturnRecord deleted',
      `Remaining child comments: ${remainingComments}`,
      remainingComments === 0
    );
  } catch (err) {
    recordTest('Prisma CRUD & Foreign Key', 'Success', err.message, false);
  }

  // --- 3. Duplicate Document Prevention ---
  try {
    await prisma.returnRecord.create({
      data: {
        id: `DUP-${Date.now()}`,
        returnOrder: 'RO-DUP-001',
        sapDocument: 'INV-460008', // Existing document number!
        companyCode: '1300',
        plant: '1108',
        storageLocation: 'SL11',
        costCenter: 'CC-2208',
        material: 'Duplicate Material',
        amount: new Prisma.Decimal(5000),
        requestedDate: new Date()
      }
    });
    recordTest('Duplicate Prevention', 'Reject duplicate sapDocument', 'Inserted duplicate (unexpected!)', false);
  } catch (err) {
    const isP2002 = err.code === 'P2002' || err.message.includes('Unique constraint');
    recordTest(
      'Duplicate Document Unique Constraint',
      'Rejection with Prisma P2002 unique constraint violation on sapDocument',
      `Rejected as expected with error code: ${err.code}`,
      isP2002
    );
  }

  // --- 4. API Endpoints Testing ---
  const API_HOST = 'http://localhost:5000';
  let token = null;

  // Health Endpoint
  try {
    const res = await fetch(`${API_HOST}/api/health`);
    const health = await res.json();
    const isOk = health.status === 'ONLINE' && health.database.includes('CONNECTED');
    recordTest(
      'API Health Endpoint (/api/health)',
      'status: ONLINE and database: CONNECTED',
      `Status: ${health.status}, DB: ${health.database}, Records: ${health.recordsCount}`,
      isOk
    );
  } catch (err) {
    recordTest('API Health Endpoint', 'Accessible', err.message, false);
  }

  // Authentication & Login
  try {
    const loginRes = await fetch(`${API_HOST}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sundaram@sungrid.com', password: 'SunGrid@2026!' })
    });
    const loginData = await loginRes.json();
    token = loginData.token;
    const isSuccess = loginData.success && !!token && loginData.user.role === 'RETURNS_MANAGER';
    recordTest(
      'JWT Authentication & Login (/api/auth/login)',
      'Returns valid JWT token and user profile for P. Sundaram',
      `Login successful! Role: ${loginData.user?.role}, Token received.`,
      isSuccess
    );
  } catch (err) {
    recordTest('JWT Authentication & Login', 'Login success', err.message, false);
  }

  // Invalid Password Rejection
  try {
    const badLoginRes = await fetch(`${API_HOST}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sundaram@sungrid.com', password: 'WrongPassword999' })
    });
    recordTest(
      'Security: Invalid Password Rejection',
      'HTTP 401 Unauthorized on incorrect password',
      `HTTP status: ${badLoginRes.status}`,
      badLoginRes.status === 401
    );
  } catch (err) {
    recordTest('Security: Invalid Password Rejection', '401', err.message, false);
  }

  // Returns Retrieval & Primary Spotlight Case
  try {
    const res = await fetch(`${API_HOST}/api/returns`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const returns = await res.json();
    const primary = returns.find(r => r.sapDocument === 'INV-460008');
    const isVerified = returns.length === 8 && primary && Number(primary.amount) === 23500;
    recordTest(
      'Returns Retrieval & Primary Case Verification (/api/returns)',
      '8 returns retrieved, INV-460008 verified with £23,500 exposure',
      `Total returned: ${returns.length}, Primary case plant: ${primary?.plant}, amount: £${primary?.amount}`,
      isVerified
    );
  } catch (err) {
    recordTest('Returns Retrieval', '8 returns', err.message, false);
  }

  // Plant Filtering
  try {
    const res = await fetch(`${API_HOST}/api/returns?plant=1108`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const plantReturns = await res.json();
    const all1108 = plantReturns.every(r => r.plant === '1108');
    recordTest(
      'Logistics Org Unit Filtering (Plant 1108 Solar)',
      'Only Plant 1108 records returned',
      `Returned ${plantReturns.length} records, all plant 1108: ${all1108}`,
      all1108 && plantReturns.length > 0
    );
  } catch (err) {
    recordTest('Logistics Org Unit Filtering', 'Filtered', err.message, false);
  }

  // Adding Comment via API
  try {
    const res = await fetch(`${API_HOST}/api/returns/RET-2026-004/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text: 'Automated integration test comment verifying live database persistence.',
        author: 'P. Sundaram (Returns Manager)',
        persona: 'Returns Manager'
      })
    });
    const data = await res.json();
    recordTest(
      'Live Comment Creation & Audit Trail (/api/returns/:id/comment)',
      'Comment saved and audit entry created in PostgreSQL',
      `Comment success: ${data.success}, total comments now: ${data.comments?.length}`,
      data.success && data.comments?.length > 0
    );
  } catch (err) {
    recordTest('Live Comment Creation', 'Success', err.message, false);
  }

  // Analytics Calculation
  try {
    const res = await fetch(`${API_HOST}/api/analytics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const analytics = await res.json();
    const hasKPIs = analytics.kpis && analytics.kpis.totalReturns === 8 && analytics.kpis.totalExposureGbp > 0;
    recordTest(
      'Analytics & Financial Exposure at Risk (/api/analytics)',
      'Aggregates exposure, SLA compliance, and ageing profiles',
      `Active exceptions: ${analytics.kpis?.activeExceptions}, Exposure at Risk: £${analytics.kpis?.totalExposureGbp.toLocaleString()}`,
      hasKPIs
    );
  } catch (err) {
    recordTest('Analytics Calculation', 'KPIs computed', err.message, false);
  }

  // Notification Persistence & Read State
  try {
    const res = await fetch(`${API_HOST}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const notifs = await res.json();
    const target = notifs[0];
    const readRes = await fetch(`${API_HOST}/api/notifications/${target.id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const readData = await readRes.json();
    recordTest(
      'Database-Backed Notification Persistence (/api/notifications)',
      'Notifications fetched and read status toggled in PostgreSQL',
      `Fetched ${notifs.length} notifications, marked ${target.id} as read: ${readData.success}`,
      readData.success && readData.notification?.isRead === true
    );
  } catch (err) {
    recordTest('Notification Persistence', 'Success', err.message, false);
  }

  // Simulated SAP OData Adapter Health Ping
  try {
    const res = await fetch(`${API_HOST}/api/sap/ping`, { method: 'POST' });
    const sapPing = await res.json();
    recordTest(
      'SAP S/4HANA OData Boundary Health (/api/sap/ping)',
      'HTTP 200 OK with simulated latency and S/4HANA BKP metadata',
      `SAP Status: ${sapPing.status} ${sapPing.statusText}, Message: ${sapPing.message}`,
      sapPing.status === 200 && sapPing.success === true
    );
  } catch (err) {
    recordTest('SAP OData Boundary Health', '200 OK', err.message, false);
  }

  // --- Summary Report ---
  console.log('\n================================================================');
  console.log('                      TEST EXECUTION SUMMARY                    ');
  console.log('================================================================');
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = total - passedCount;
  console.log(`Total Test Cases Executed: ${total}`);
  console.log(`Passed:                   ${passedCount}`);
  console.log(`Failed:                   ${failedCount}`);
  console.log(`Overall Status:           ${failedCount === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('================================================================\n');

  await prisma.$disconnect();
  process.exit(failedCount === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});

