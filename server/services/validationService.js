// Validation Service for SAP SD Customer Returns (BKP Best Practice)

const VALID_COMPANY_CODES = ['1300'];
const VALID_PLANTS = ['1108', '1102'];
const VALID_STORAGE_LOCATIONS = ['SL11', 'SL02', 'SL01', 'SL04'];
const VALID_CURRENCIES = ['GBP'];
const VALID_STATUSES = [
  'Unassigned',
  'In Review',
  'Partially Processed',
  'Pending Approval',
  'Approved',
  'Completed',
  'Rejected'
];

export function validateReturnRecord(record, existingRecords = []) {
  const errors = [];
  const warnings = [];

  // 1. Mandatory Fields Check
  if (!record.companyCode) errors.push('Company Code is required (Mandatory SAP Org Unit)');
  else if (!VALID_COMPANY_CODES.includes(String(record.companyCode))) {
    warnings.push(`Company Code '${record.companyCode}' not in standard SunGrid company codes (${VALID_COMPANY_CODES.join(', ')})`);
  }

  if (!record.plant) errors.push('Plant is required (Mandatory SAP Logistics Org Unit)');
  else if (!VALID_PLANTS.includes(String(record.plant))) {
    warnings.push(`Plant '${record.plant}' is not recognized in SunGrid Renewables network`);
  }

  if (!record.storageLocation) errors.push('Storage Location is required for physical goods receipt');
  else if (!VALID_STORAGE_LOCATIONS.includes(String(record.storageLocation))) {
    warnings.push(`Storage Location '${record.storageLocation}' not defined in Plant master`);
  }

  if (!record.costCenter) errors.push('Cost Center is required for warranty/return cost absorption');
  if (!record.material) errors.push('Material description/identifier is required');
  if (!record.sapDocument) errors.push('SAP Invoice/Document reference is required');

  // 2. Financial Amount & Currency
  if (record.amount === undefined || record.amount === null || isNaN(Number(record.amount))) {
    errors.push('Amount must be a valid numeric quantity');
  } else if (Number(record.amount) <= 0) {
    errors.push('Return amount must be greater than £0.00');
  }

  if (record.currency && record.currency !== 'GBP') {
    warnings.push(`Currency '${record.currency}' detected. SunGrid standard reporting requires GBP (£)`);
  }

  // 3. Requested Date
  if (!record.requestedDate) {
    errors.push('Requested Date is mandatory for SLA tracking');
  } else {
    const parsedDate = new Date(record.requestedDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push(`Invalid date format for Requested Date: '${record.requestedDate}' (Expected YYYY-MM-DD)`);
    }
  }

  // 4. Processing Status
  if (!record.processingStatus || !VALID_STATUSES.includes(record.processingStatus)) {
    warnings.push(`Processing status '${record.processingStatus}' is non-standard. Allowed: ${VALID_STATUSES.join(', ')}`);
  }

  // 5. Duplicate Check
  if (existingRecords.length > 0 && record.id) {
    const duplicates = existingRecords.filter(r => r.id !== record.id && r.sapDocument === record.sapDocument);
    if (duplicates.length > 0) {
      warnings.push(`Duplicate document reference detected: '${record.sapDocument}' is already referenced by ${duplicates.map(d => d.id).join(', ')}`);
    }
  }

  // 6. Business Partner Check
  if (!record.businessPartner && !record.businessPartnerRaw) {
    warnings.push('Business Partner reference is missing or truncated');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    checkedAt: new Date().toISOString()
  };
}

export function validateAllowedStatusTransition(currentStatus, targetStatus, role) {
  const allowedTransitions = {
    'Unassigned': ['In Review', 'Partially Processed', 'Pending Approval', 'Rejected'],
    'In Review': ['Partially Processed', 'Pending Approval', 'Completed', 'Rejected'],
    'Partially Processed': ['Pending Approval', 'Completed', 'Rejected'],
    'Pending Approval': ['Approved', 'Completed', 'Rejected'],
    'Approved': ['Completed', 'Partially Processed'],
    'Completed': [], // terminal state
    'Rejected': []   // terminal state
  };

  if (currentStatus === targetStatus) return { allowed: true };

  const validTargets = allowedTransitions[currentStatus] || [];
  if (!validTargets.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Cannot transition from '${currentStatus}' directly to '${targetStatus}'. Allowed: ${validTargets.join(', ') || 'None (Terminal state)'}`
    };
  }

  // Role constraints
  if (targetStatus === 'Approved' || targetStatus === 'Completed') {
    if (role === 'Returns Analyst') {
      return {
        allowed: false,
        reason: "Role 'Returns Analyst' can recommend or request approval, but cannot finalize 'Approved' or 'Completed' status. Requires 'Returns Manager' or 'Finance Approver'."
      };
    }
  }

  return { allowed: true };
}
