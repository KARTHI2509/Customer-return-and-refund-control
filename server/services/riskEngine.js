// Transparent Risk & Dynamic Ageing Engine for SunGrid Renewables

// Default SLA thresholds in days
export const DEFAULT_THRESHOLDS = {
  normalDays: 3,     // 0-3 days: Normal
  attentionDays: 7,  // 4-7 days: Attention
  overdueDays: 7     // >7 days: Overdue Review
};

export function calculateAgeing(requestedDateStr, referenceDate = new Date()) {
  if (!requestedDateStr) return { days: 0, status: 'NORMAL', label: '0 days' };
  
  const reqDate = new Date(requestedDateStr);
  const refDate = new Date(referenceDate);
  const diffTime = Math.max(0, refDate - reqDate);
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let status = 'NORMAL';
  if (days > DEFAULT_THRESHOLDS.attentionDays) {
    status = 'OVERDUE';
  } else if (days > DEFAULT_THRESHOLDS.normalDays) {
    status = 'ATTENTION';
  }

  return {
    days,
    status,
    label: `${days} day${days === 1 ? '' : 's'}`
  };
}

export function evaluateRisk(record, thresholds = DEFAULT_THRESHOLDS, referenceDate = new Date()) {
  let score = 10; // Baseline score
  const reasons = [];

  // Factor 1: Dynamic Ageing & SLA Breaches
  const ageing = calculateAgeing(record.requestedDate, referenceDate);
  if (ageing.days > thresholds.attentionDays) {
    score += 35;
    reasons.push(`Critical SLA breach: Ageing of ${ageing.days} days exceeds the ${thresholds.attentionDays}-day overdue threshold (+35 pts)`);
  } else if (ageing.days > thresholds.normalDays) {
    score += 15;
    reasons.push(`SLA Attention: Ageing of ${ageing.days} days exceeds the ${thresholds.normalDays}-day normal window (+15 pts)`);
  }

  // Factor 2: Financial Exposure (GBP)
  const amount = Number(record.amount) || 0;
  if (amount >= 20000) {
    score += 25;
    reasons.push(`High Financial Exposure: £${amount.toLocaleString()} exceeds Tier-1 threshold of £20,000 (+25 pts)`);
  } else if (amount >= 10000) {
    score += 15;
    reasons.push(`Moderate Financial Exposure: £${amount.toLocaleString()} exceeds Tier-2 threshold of £10,000 (+15 pts)`);
  } else if (amount >= 5000) {
    score += 5;
    reasons.push(`Financial Exposure: £${amount.toLocaleString()} exceeds Tier-3 threshold of £5,000 (+5 pts)`);
  }

  // Factor 3: Missing Mandatory or Inconsistent Data
  const exceptionText = (record.primaryExceptionReason || '').toLowerCase();
  if (exceptionText.includes('missing') || exceptionText.includes('inconsistent') || exceptionText.includes('error')) {
    score += 20;
    reasons.push('Data Inconsistency: Mandatory fields or SAP SD incompletion rules flagged (+20 pts)');
  }

  // Factor 4: Quantity or Physical Mismatch
  if (exceptionText.includes('mismatch') || exceptionText.includes('short-shipped') || exceptionText.includes('inspection found')) {
    score += 25;
    reasons.push('Execution Variance: Physical warehouse goods receipt does not match sales order quantity (+25 pts)');
  }

  // Factor 5: Accountability / Unassigned Case
  if (!record.assignedOwner || record.assignedOwner.toLowerCase().includes('unassigned')) {
    score += 20;
    reasons.push('Accountability Risk: No owner assigned to actively coordinate resolution (+20 pts)');
  }

  // Factor 6: Approval Block
  if (record.billingBlock && record.billingBlock !== 'None') {
    score += 10;
    reasons.push(`Billing Block Active: ${record.billingBlock} prevents automatic Credit Memo generation (+10 pts)`);
  }

  // Cap score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(5, score));

  let riskLevel = 'LOW';
  if (normalizedScore >= 70) {
    riskLevel = 'CRITICAL';
  } else if (normalizedScore >= 50) {
    riskLevel = 'HIGH';
  } else if (normalizedScore >= 30) {
    riskLevel = 'MEDIUM';
  }

  return {
    score: normalizedScore,
    riskLevel,
    ageing,
    reasons
  };
}
