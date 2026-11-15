import React from 'react';
import { 
  Building2, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Truck, 
  Receipt, 
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
  Layers,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

export default function ReturnObjectDetails({ 
  currentReturn, 
  onNavigateToWorkspace,
  onBackToQueue 
}) {
  if (!currentReturn) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
        <h3>No Return Object Selected</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Please select a return transaction from the Exception Work Queue or Executive Dashboard.
        </p>
        <button 
          onClick={onBackToQueue}
          className="btn btn-primary btn-sm"
          style={{ marginTop: '16px' }}
        >
          Go to Exception Work Queue
        </button>
      </div>
    );
  }

  const isPrimary = currentReturn.sapDocument === 'INV-460008';
  const validation = currentReturn.validation || { isValid: true, errors: [], warnings: [] };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner with Navigation Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={onBackToQueue} className="btn btn-secondary btn-sm">
            ← Back to Work Queue
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>
              Return Document: {currentReturn.sapDocument}
            </h2>
            {isPrimary && (
              <span className="badge badge-ref">
                <Sparkles size={12} />
                KAAR PRIMARY REFERENCE
              </span>
            )}
            <span className={`badge ${
              currentReturn.calculatedRiskLevel === 'CRITICAL' ? 'badge-critical' :
              currentReturn.calculatedRiskLevel === 'HIGH' ? 'badge-high' : 'badge-medium'
            }`}>
              {currentReturn.calculatedRiskLevel} RISK ({currentReturn.calculatedRiskScore || 88}/100)
            </span>
          </div>
        </div>

        <button 
          onClick={onNavigateToWorkspace}
          className="btn btn-primary"
        >
          Open Resolution Workspace
          <ArrowRight size={15} />
        </button>
      </div>

      {/* SAP SD Process Context & Transaction References */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Info size={18} color="#0284c7" />
          <div style={{ fontSize: '13px', color: '#334155' }}>
            <strong>SAP Process Context:</strong> SAP S/4HANA Sales & Distribution (SD) • Customer Returns (BKP Best-Practice) • Signavio <em>Lead to Cash &gt; Returns Management</em>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
          <span>Standard Fiori Ref: <strong>Manage Customer Returns</strong></span>
          <span>•</span>
          <span>SAP Transaction: <strong>VA01</strong></span>
        </div>
      </div>

      {/* SECTION 1: Exact Business & Organisational Master Data */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Building2 size={18} color="#0284c7" />
            Business & Organisational Data (SAP S/4HANA Master Record)
          </div>
          <span className="badge badge-neutral">Status: {currentReturn.processingStatus}</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Company Code</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{currentReturn.companyCode}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>SunGrid Renewables Ltd</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Plant</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{currentReturn.plant}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>{currentReturn.plantName || 'Plant 1108'}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Storage Location</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{currentReturn.storageLocation}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>{currentReturn.storageLocationName || 'SL11 (Quarantine)'}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Cost Centre</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{currentReturn.costCenter}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>{currentReturn.costCenterName || 'CC-2208'}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Material</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0284c7' }}>{currentReturn.material}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {currentReturn.materialId || 'MAT-CP-1200'}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Amount (GBP)</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              £{Number(currentReturn.amount).toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Currency: {currentReturn.currency || 'GBP'}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Requested Date</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{currentReturn.requestedDate}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Ageing: {currentReturn.ageingDays} days ({currentReturn.ageingStatus})</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Business Partner</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>
              {currentReturn.businessPartner}
            </div>
            {isPrimary && (
              <div style={{ fontSize: '10.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                (Truncated in source screenshot; kept strictly as M... Stores)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Document Relationships & Flow (VA01 -> VL01N -> VF01) */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={18} color="#2563eb" />
            SAP Document Chain & Relationships (BKP Returns Lifecycle)
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            System of Record: S/4HANA SD
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {/* Step 1: Return Sales Order */}
          <div style={{
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '16px',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase' }}>
                1. Return Order (VA01)
              </span>
              <span className="badge badge-neutral">Doc Type: CBRE</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
              {currentReturn.returnOrder}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Source Reference: {currentReturn.sapDocument}
            </div>
            <div style={{ marginTop: '10px', fontSize: '11.5px', color: '#334155' }}>
              Status: Drafted in SAP SD. Flagged for missing Return Reason code header attribute.
            </div>
          </div>

          {/* Step 2: Inbound Delivery & Goods Receipt */}
          <div style={{
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '16px',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0d9488', textTransform: 'uppercase' }}>
                2. Inbound Delivery (VL01N / VL02N)
              </span>
              <span className="badge badge-medium">PGR Completed</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
              Delivery #{currentReturn.deliveryDocument || 'DEL-80004128'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Plant {currentReturn.plant} • SLoc {currentReturn.storageLocation}
            </div>
            <div style={{ marginTop: '10px', fontSize: '11.5px', color: '#334155' }}>
              Physical inspection: 10 units received into quarantine stock (5 units short of 15 invoiced).
            </div>
          </div>

          {/* Step 3: Billing & Credit Memo Document */}
          <div style={{
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '16px',
            backgroundColor: currentReturn.billingBlock !== 'None' ? '#fff5f5' : '#f0fdf4'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: currentReturn.billingBlock !== 'None' ? '#dc2626' : '#16a34a', textTransform: 'uppercase' }}>
                3. Credit Memo (VF01)
              </span>
              <span className={`badge ${currentReturn.billingBlock !== 'None' ? 'badge-critical' : 'badge-low'}`}>
                {currentReturn.billingBlock !== 'None' ? 'Billing Block Active' : 'Released'}
              </span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
              {currentReturn.creditMemoDoc || 'Awaiting Authorization'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Block Code: {currentReturn.billingBlock}
            </div>
            <div style={{ marginTop: '10px', fontSize: '11.5px', color: currentReturn.billingBlock !== 'None' ? '#b91c1c' : '#15803d' }}>
              {currentReturn.billingBlock !== 'None' 
                ? 'Credit Memo generation suspended to prevent erroneous £23,500 cash payout.' 
                : 'Credit Memo successfully settled in SAP FI-AR.'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Dynamic Risk Scoring Explanation & Incompletion Validation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* Transparent Risk Score Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldAlert size={18} color="#dc2626" />
              Transparent Risk Engine Breakdown
            </div>
            <span className="badge badge-critical">
              Score: {currentReturn.calculatedRiskScore || 88} / 100
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
            Risk is evaluated through deterministic business rules considering ageing, exposure, incomplete data, and execution variances:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(currentReturn.riskReasons || []).map((reason, idx) => (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  color: '#991b1b'
                }}
              >
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Incompletion & Validation Findings Checklist */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CheckCircle2 size={18} color="#16a34a" />
              Incompletion Procedure & Validation Findings
            </div>
            <span className="badge badge-neutral">Checked at {new Date().toLocaleTimeString()}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '500' }}>Mandatory Org Units (CoCode 1300, Plant 1108)</span>
              <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '12px' }}>✓ VALID</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '500' }}>Storage Location SL11 & Quarantine Posting</span>
              <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '12px' }}>✓ VALID</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '500', color: '#b91c1c' }}>Return Reason Code (SAP SD Header Incompletion)</span>
              <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '12px' }}>✗ MISSING</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '500', color: '#b91c1c' }}>Physical vs Billed Qty (10 inspected vs 15 on invoice)</span>
              <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '12px' }}>✗ VARIANCE</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '500' }}>Accountable Case Owner Assigned</span>
              <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '12px' }}>✓ {currentReturn.assignedOwner}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Chronological Process Timeline */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={18} color="#0284c7" />
            Chronological Process Timeline (Audit Trail)
          </div>
          <span className="badge badge-neutral">{currentReturn.timeline?.length || 0} Events Recorded</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', paddingLeft: '10px' }}>
          {(currentReturn.timeline || []).map((step, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: step.status === 'COMPLETED' ? '#16a34a' : step.status === 'WARNING' ? '#d97706' : '#dc2626',
                marginTop: '5px',
                flexShrink: 0
              }} />
              <div style={{
                flex: 1,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#0f172a' }}>
                    {step.step}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {step.timestamp} • Actor: <strong>{step.actor}</strong>
                  </div>
                </div>

                <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
                  {step.detail}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', color: '#0284c7' }}>
                  <span>Doc Ref: {step.docRef}</span>
                  <span>•</span>
                  <span>SAP Tx: {step.sapTx}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
