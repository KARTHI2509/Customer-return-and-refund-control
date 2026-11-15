// Intelligent Recommendation Engine with Transparent Business Rules & Evidence Trail

export function generateRecommendation(record) {
  const exception = (record.primaryExceptionReason || '').toLowerCase();
  const amount = Number(record.amount) || 0;
  const plant = record.plant;

  // Case 1: Primary Demo Record INV-460008 (Composite Panel CP-12 at Plant 1108 SL11)
  if (record.sapDocument === 'INV-460008') {
    return {
      actionId: 'REC-INV-460008',
      type: 'QUANTITY_ADJUSTMENT_AND_REASON_CODE',
      recommendation: "Adjust Return Order RO-772109 quantity from 15 to 10 units in VA02; set Return Reason code to '015 - Solar Panel Cell Fracture'; submit variance credit memo of £15,666.70 for Finance approval.",
      confidence: 94,
      targetDocument: 'VA02 / VL02N / VF01',
      evidence: [
        `Warehouse goods receipt document #DEL-80004128 logged 10 units at Plant 1108 Storage Location SL11.`,
        `Customer initial invoice INV-460008 billed 15 units at £1,566.67/unit (£23,500 total).`,
        `Short-shipment variance of 5 units (£7,833.30) confirmed retained by distributor for third-party diagnostic.`,
        `SAP Incompletion check requires Return Reason code on Header tab to permit billing block removal.`
      ],
      suggestedRole: 'Returns Manager',
      estimatedSavings: '£7,833.30 avoided erroneous credit posting',
      status: 'PENDING_DECISION'
    };
  }

  // Case 2: High financial threshold exceeding manager approval
  if (amount > 25000) {
    return {
      actionId: `REC-${record.id}-FIN`,
      type: 'FINANCE_GOVERNANCE_ESCALATION',
      recommendation: `High exposure value (£${amount.toLocaleString()}) exceeds single-manager limit (£25,000). Route return order ${record.returnOrder || record.sapDocument} to Finance Approver for 2-tier approval sign-off.`,
      confidence: 91,
      targetDocument: 'Workflow Inbox / VF01',
      evidence: [
        `Total claim amount £${amount.toLocaleString()} exceeds SunGrid delegated financial authority limit of £25,000.`,
        `Requires cost center ${record.costCenter} budget verification.`
      ],
      suggestedRole: 'Finance Approver',
      estimatedSavings: 'Governance compliance & capital preservation',
      status: 'PENDING_DECISION'
    };
  }

  // Case 3: Missing ownership & ageing
  if (!record.assignedOwner || record.assignedOwner.includes('Unassigned')) {
    return {
      actionId: `REC-${record.id}-ASSIGN`,
      type: 'OWNERSHIP_ASSIGNMENT',
      recommendation: `Assign accountable case owner for Plant ${plant} immediately to prevent further SLA breach. Dispatch Return Merchandise Authorisation (RMA) instructions to customer.`,
      confidence: 96,
      targetDocument: 'Manage Customer Returns Worklist',
      evidence: [
        `Case currently has no accountable owner.`,
        `SLA ageing is accumulating without documented customer communication.`
      ],
      suggestedRole: 'Returns Manager',
      estimatedSavings: 'Reduction in penalty claims and customer churn',
      status: 'PENDING_DECISION'
    };
  }

  // Case 4: Valuation or Master data missing in delivery
  if (exception.includes('valuation') || exception.includes('incomplete')) {
    return {
      actionId: `REC-${record.id}-VALUATION`,
      type: 'MASTER_DATA_REMEDIATION',
      recommendation: `Maintain Valuation Class 'DEFECTIVE' on inbound delivery ${record.deliveryDocument || 'item'} in VL02N and re-trigger Post Goods Receipt (PGR).`,
      confidence: 97,
      targetDocument: 'VL02N (Inbound Delivery)',
      evidence: [
        `Split-valuation material requires inventory account assignment before MM stock update.`,
        `QA testing protocol verified non-conforming batch condition.`
      ],
      suggestedRole: 'Returns Analyst',
      estimatedSavings: 'Avoid inventory reconciliation discrepancies',
      status: 'PENDING_DECISION'
    };
  }

  // Default fallback recommendation
  return {
    actionId: `REC-${record.id}-STANDARD`,
    type: 'STANDARD_REVIEW',
    recommendation: `Validate incoming goods inspection report and confirm if replacement unit or credit memo is requested by ${record.businessPartnerName || 'customer'}.`,
    confidence: 85,
    targetDocument: 'VA02 / Manage Customer Returns',
    evidence: [
      `Review standard Customer Returns (BKP) flow.`,
      `Verify physical return arrived at storage location ${record.storageLocation}.`
    ],
    suggestedRole: 'Returns Analyst',
    estimatedSavings: 'Operational process adherence',
    status: 'PENDING_DECISION'
  };
}
