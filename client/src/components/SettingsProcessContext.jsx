import React, { useState } from 'react';
import { 
  Server, 
  ShieldCheck, 
  Sliders, 
  RotateCcw, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Info,
  ExternalLink,
  Layers,
  FileText
} from 'lucide-react';

export default function SettingsProcessContext({ 
  sapStatus, 
  onPingSap, 
  onToggleSimulateError, 
  onResetData 
}) {
  const [pingResult, setPingResult] = useState(null);
  const [pinging, setPinging] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handlePing = async () => {
    setPinging(true);
    setPingResult(null);
    try {
      const res = await onPingSap();
      setPingResult(res);
    } catch (err) {
      setPingResult({
        success: false,
        status: 503,
        message: err.message || 'RFC gateway connection timeout.'
      });
    } finally {
      setPinging(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* SECTION 1: SAP S/4HANA OData Adapter & Boundary */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Server size={18} color="#0284c7" />
            SAP S/4HANA SD OData Service Boundary & Adapter
          </div>
          <span className={`badge ${sapStatus?.status === 'DEGRADED' ? 'badge-critical' : 'badge-low'}`}>
            Status: {sapStatus?.status || 'HEALTHY'}
          </span>
        </div>

        <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
          This application provides an <strong>exception-management and decision-support layer</strong>, not a replacement for SAP. All business objects adhere to standard SAP S/4HANA Sales & Distribution (SD) structures.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px',
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>OData Service Endpoint</div>
            <div style={{ fontSize: '12.5px', fontFamily: 'monospace', color: '#0f172a', wordBreak: 'break-all' }}>
              /sap/opu/odata/sap/API_CUSTOMER_RETURN_SRV
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Adapter Mode</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0284c7' }}>
              {sapStatus?.isDemoMode ? 'Transparent Demo Adapter (Seeded S/4HANA Data)' : 'Live OData Production Channel'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Client & Org Context</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
              Client 100 • Company Code 1300
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Authentication Boundary</div>
            <div style={{ fontSize: '13px', color: '#334155' }}>
              OAuth 2.0 / SAML 2.0 Bearer Token (Secure Gateway)
            </div>
          </div>
        </div>

        {/* Test Ping & Simulation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={handlePing}
              disabled={pinging}
              className="btn btn-primary btn-sm"
            >
              <Activity size={14} />
              {pinging ? 'Testing RFC Gateway...' : 'Ping SAP OData Endpoint'}
            </button>

            <button
              onClick={onToggleSimulateError}
              className={`btn btn-sm ${sapStatus?.simulateError ? 'btn-danger' : 'btn-secondary'}`}
              title="Simulate SAP RFC 503 Gateway failure to verify retry logic and graceful error handling"
            >
              {sapStatus?.simulateError ? 'Disable Failure Simulation' : 'Simulate SAP RFC 503 Timeout'}
            </button>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Simulation is useful to prove that the application degrades gracefully when SAP is unreachable.
          </div>
        </div>

        {/* Ping Result Box */}
        {pingResult && (
          <div style={{
            marginTop: '14px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: pingResult.success ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${pingResult.success ? '#bbf7d0' : '#fecaca'}`,
            fontSize: '12.5px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: pingResult.success ? '#15803d' : '#b91c1c' }}>
              {pingResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              HTTP {pingResult.status}: {pingResult.statusText || (pingResult.success ? 'OK' : 'Error')}
            </div>
            <div style={{ marginTop: '4px', color: '#334155' }}>
              {pingResult.message}
            </div>
            {pingResult.details && (
              <div style={{ marginTop: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>
                Entities: {JSON.stringify(pingResult.details)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: SAP Signavio Process Alignment & Reference Apps */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={18} color="#0284c7" />
            SAP Signavio Alignment & Transaction References
          </div>
          <span className="badge badge-neutral">Lead to Cash &gt; Returns Management</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase' }}>
              SAP Fiori Reference App
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', marginTop: '2px' }}>
              Manage Customer Returns
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Fiori Catalog ID: <strong>F2133 / F4093</strong>
            </div>
            <p style={{ fontSize: '12px', color: '#475569', marginTop: '8px' }}>
              Used in standard SAP for manual order entry. This custom app extends it with dynamic risk prioritization, automated incompletion diagnosis, and guided cross-functional approvals.
            </p>
          </div>

          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase' }}>
              Core SAP SD Transactions
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '2px' }}>
              VA01 • VL01N/VL02N • VF01
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Returns Order → Inbound Delivery → Credit Memo
            </div>
            <p style={{ fontSize: '12px', color: '#475569', marginTop: '8px' }}>
              All documents referenced in the application map directly to standard document types: <code>CBRE</code> (Customer Return Order), <code>LR</code> (Return Delivery), and <code>G2</code> (Credit Memo).
            </p>
          </div>

          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase' }}>
              Best Practice Scope Item
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', marginTop: '2px' }}>
              Customer Returns (BKP)
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              SAP S/4HANA Cloud & On-Premise SD Standard
            </div>
            <p style={{ fontSize: '12px', color: '#475569', marginTop: '8px' }}>
              Enforces technical quality inspection at storage location SL11 before credit authorization, preventing premature financial postings.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: Configurable Business Rules & SLA Thresholds */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Sliders size={18} color="#0284c7" />
            Configurable Business Rules & SLA Thresholds
          </div>
          <span className="badge badge-neutral">Governance Defaults</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#16a34a' }}>0 – 3 Days: Normal SLA</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Standard operational window for warehouse receipt at SL11 and initial quality grading.
            </div>
          </div>

          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#d97706' }}>4 – 7 Days: Attention SLA</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Triggered when missing fields or technical review exceed 72 hours. Escalated to Returns Analyst.
            </div>
          </div>

          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#dc2626' }}>&gt; 7 Days: Overdue Review</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Critical breach. Automatically flags executive dashboard and requires Returns Manager sign-off.
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Role Permissions Matrix */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ShieldCheck size={18} color="#0284c7" />
            Role-Based Access Control (RBAC) Matrix
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Persona / Role</th>
                <th>Inspect & Validate</th>
                <th>Add Comments & Evidence</th>
                <th>Assign Case Owner</th>
                <th>Approve Operational Action</th>
                <th>Release Credit Memo (&gt; £10k)</th>
                <th>Config & SAP Reset</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: '700' }}>Returns Analyst (A. Sharma)</td>
                <td style={{ color: '#16a34a' }}>✓ Permitted</td>
                <td style={{ color: '#16a34a' }}>✓ Permitted</td>
                <td style={{ color: '#64748b' }}>Propose Only</td>
                <td style={{ color: '#dc2626' }}>✗ Restricted</td>
                <td style={{ color: '#dc2626' }}>✗ Restricted</td>
                <td style={{ color: '#dc2626' }}>✗ Restricted</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '700' }}>Returns Manager (P. Sundaram)</td>
                <td style={{ color: '#16a34a' }}>✓ Permitted</td>
                <td style={{ color: '#16a34a' }}>✓ Permitted</td>
                <td style={{ color: '#16a34a' }}>✓ Full Authority</td>
                <td style={{ color: '#16a34a' }}>✓ Full Authority</td>
                <td style={{ color: '#64748b' }}>Up to £25k</td>
                <td style={{ color: '#dc2626' }}>✗ Restricted</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '700' }}>Finance Approver (R. Nair)</td>
                <td style={{ color: '#16a34a' }}>✓ Permitted</td>
                <td style={{ color: '#16a34a' }}>✓ Permitted</td>
                <td style={{ color: '#64748b' }}>Finance cases</td>
                <td style={{ color: '#16a34a' }}>✓ Permitted</td>
                <td style={{ color: '#16a34a' }}>✓ Full Authority</td>
                <td style={{ color: '#dc2626' }}>✗ Restricted</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '700' }}>System Administrator</td>
                <td style={{ color: '#16a34a' }}>✓ Permitted</td>
                <td style={{ color: '#16a34a' }}>✓ Permitted</td>
                <td style={{ color: '#16a34a' }}>✓ Permitted</td>
                <td style={{ color: '#16a34a' }}>✓ Permitted</td>
                <td style={{ color: '#16a34a' }}>✓ Permitted</td>
                <td style={{ color: '#16a34a' }}>✓ Full Authority</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: Data Reset with Confirmation */}
      <div className="card" style={{ border: '1px solid #fecaca', background: '#fff5f5' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#b91c1c' }}>
              Reset Demo Dataset to Original Seeded State
            </h4>
            <div style={{ fontSize: '12.5px', color: '#7f1d1d', marginTop: '2px' }}>
              Restores initial 8 returns records including the exact <strong>INV-460008</strong> reference case.
            </div>
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn btn-danger btn-sm"
          >
            <RotateCcw size={14} />
            Reset Data to Factory State
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#dc2626' }}>
                Confirm Demo Data Reset
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              Are you sure you want to reset all return records and audit history to their original seeded state? Any newly added comments or simulated approvals will be restored to initial values.
            </p>
            <div className="modal-footer">
              <button onClick={() => setShowResetConfirm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  onResetData();
                  setShowResetConfirm(false);
                }}
                className="btn btn-danger"
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
