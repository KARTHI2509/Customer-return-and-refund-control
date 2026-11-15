import React, { useState } from 'react';
import { 
  UserPlus, 
  MessageSquare, 
  Paperclip, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Send,
  Building,
  UploadCloud,
  FileCheck
} from 'lucide-react';

export default function ResolutionWorkspace({ 
  currentReturn, 
  currentPersona, 
  onAssignOwner, 
  onAddComment, 
  onRecommendationDecision, 
  onExecuteAction 
}) {
  const [selectedOwner, setSelectedOwner] = useState(currentReturn?.assignedOwner || 'P. Sundaram (Returns Manager)');
  const [reassignReason, setReassignReason] = useState('');
  const [newComment, setNewComment] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: 'Warehouse_Receipt_SL11_Inspection.pdf', size: '2.4 MB', uploadedAt: '2026-08-16 14:15' }
  ]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [recEditMode, setRecEditMode] = useState(false);
  const [revisedRecommendation, setRevisedRecommendation] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  if (!currentReturn) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
        <h3>No Return Record Selected</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Select a case from the Exception Work Queue to enter the Resolution Workspace.
        </p>
      </div>
    );
  }

  const rec = currentReturn.recommendation || {};
  const isPrimary = currentReturn.sapDocument === 'INV-460008';

  // Permission logic
  const canApprove = currentPersona.role === 'Returns Manager' || currentPersona.role === 'Finance Approver' || currentPersona.role === 'Administrator';
  const canReleaseFinanceBlock = currentPersona.role === 'Finance Approver' || currentPersona.role === 'Administrator';

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles(prev => [
        ...prev,
        {
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        }
      ]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Workspace Header */}
      <div className="card" style={{
        background: 'linear-gradient(to right, #ffffff, #f0f9ff)',
        borderLeft: '4px solid #0284c7'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-ref">Case #{currentReturn.id}</span>
              <h2 style={{ fontSize: '19px', fontWeight: '800' }}>
                Resolution Control: {currentReturn.sapDocument}
              </h2>
              <span className="badge badge-neutral">{currentReturn.processingStatus}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Material: <strong>{currentReturn.material}</strong> • Exposure: <strong style={{ color: '#0f172a' }}>£{Number(currentReturn.amount).toLocaleString()}</strong> • Plant {currentReturn.plant} ({currentReturn.storageLocation})
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setShowDocPreview(true)}
              className="btn btn-secondary btn-sm"
            >
              <FileText size={14} />
              Preview SAP Credit Draft
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Intelligent Recommendation & Human Approvals */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '20px'
      }}>
        
        {/* Intelligent Recommendation Engine Card */}
        <div className="card" style={{ border: '2px solid #bae6fd', position: 'relative' }}>
          <div className="card-header">
            <div className="card-title">
              <Sparkles size={18} color="#0284c7" />
              Intelligent Recommendation Engine (Transparent Evidence Trail)
            </div>
            <span className="badge badge-medium">
              Confidence: {rec.confidence || '94%'}
            </span>
          </div>

          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid #e0f2fe',
            marginBottom: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
              Recommended Business Resolution:
            </div>
            {recEditMode ? (
              <textarea
                value={revisedRecommendation || rec.nextAction || rec.recommendation}
                onChange={(e) => setRevisedRecommendation(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #0284c7',
                  fontSize: '13px'
                }}
              />
            ) : (
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a', lineHeight: '1.4' }}>
                {revisedRecommendation || rec.nextAction || rec.recommendation}
              </div>
            )}
            
            <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#0369a1', fontWeight: '600' }}>
              Target Document: {rec.targetDocument || 'VA02 / VL02N / VF01'}
            </div>
          </div>

          {/* Supporting Evidence List */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
              Evidence Gathered from SAP SD Timeline:
            </div>
            <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: '#334155' }}>
              {(rec.evidence || []).map((ev, idx) => (
                <li key={idx}>{ev}</li>
              ))}
            </ul>
          </div>

          {/* User Decision / Feedback Controls */}
          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Status: <strong>{rec.status || 'PENDING_DECISION'}</strong>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {recEditMode ? (
                <button
                  onClick={() => {
                    onRecommendationDecision('EDITED', feedbackText, revisedRecommendation);
                    setRecEditMode(false);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Save Edited Action
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onRecommendationDecision('ACCEPTED', 'Accepted standard recommendation')}
                    className="btn btn-success btn-sm"
                    title="Accept and queue for execution"
                  >
                    <CheckCircle2 size={13} />
                    Accept Action
                  </button>
                  <button
                    onClick={() => {
                      setRecEditMode(true);
                      setRevisedRecommendation(rec.nextAction || rec.recommendation);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Edit Action
                  </button>
                  <button
                    onClick={() => onRecommendationDecision('REJECTED', 'User rejected recommendation')}
                    className="btn btn-danger btn-sm"
                  >
                    <XCircle size={13} />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Human Governance & Action Execution Panel */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={18} color="#16a34a" />
              Human Governance & Action Authorization
            </div>
            <span className="badge badge-neutral">Role: {currentPersona.role}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Accountable Owner Assignment */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <UserPlus size={15} color="#0284c7" />
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#475569' }}>
                  Assign Accountable Case Owner
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#fff'
                  }}
                >
                  <option value="A. Sharma (Returns Analyst)">A. Sharma (Returns Analyst)</option>
                  <option value="P. Sundaram (Returns Manager)">P. Sundaram (Returns Manager)</option>
                  <option value="R. Nair (Finance Approver)">R. Nair (Finance Approver)</option>
                  <option value="Warehouse Supervisor (Plant 1108)">Warehouse Supervisor (Plant 1108)</option>
                </select>
                <button
                  onClick={() => onAssignOwner(selectedOwner, 'Assigned via Resolution Workspace')}
                  className="btn btn-secondary btn-sm"
                >
                  Update Owner
                </button>
              </div>
            </div>

            {/* Approval Execution Buttons */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>
                Permitted Governance Actions:
              </div>

              {/* Request Finance Approval */}
              <button
                onClick={() => onExecuteAction('REQUEST_APPROVAL', 'Pending Approval', 'Submitted for Finance sign-off')}
                className="btn btn-secondary"
                style={{ justifyContent: 'center' }}
              >
                Request Secondary Finance Review
              </button>

              {/* Release Billing Block / Approve Credit Memo */}
              <button
                onClick={() => {
                  if (!canApprove) {
                    alert("Permission Denied: Only Returns Manager or Finance Approver can approve SAP SD Customer Returns.");
                    return;
                  }
                  onExecuteAction('APPROVE', 'Completed', 'Approved quantity adjustment and released billing block');
                }}
                className="btn btn-success"
                style={{ justifyContent: 'center' }}
                disabled={!canApprove}
                title={!canApprove ? "Switch to Returns Manager or Finance Approver persona to approve" : "Approve and post to SAP S/4HANA"}
              >
                <CheckCircle2 size={16} />
                Approve & Release SAP Billing Block
              </button>

              {/* Reject Return (Requires Mandatory Reason) */}
              <button
                onClick={() => setShowRejectModal(true)}
                className="btn btn-danger"
                style={{ justifyContent: 'center' }}
              >
                <XCircle size={16} />
                Reject Return Case (Mandatory Reason)
              </button>
            </div>

            {!canApprove && (
              <div style={{ fontSize: '11.5px', color: '#b45309', background: '#fffbeb', padding: '8px 12px', borderRadius: '6px' }}>
                Note: You are currently acting as <strong>{currentPersona.role}</strong>. Approval actions require <strong>Returns Manager</strong> or <strong>Finance Approver</strong> persona.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Two Column: Collaboration Comments & Supporting Document Attachments */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        
        {/* Collaboration Comments Log */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <MessageSquare size={18} color="#0284c7" />
              Operational Collaboration & Comments
            </div>
            <span className="badge badge-neutral">{currentReturn.comments?.length || 0} Comments</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', marginBottom: '14px' }}>
            {(currentReturn.comments || []).map((comm, idx) => (
              <div key={idx} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                    {comm.author}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {comm.timestamp}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#334155' }}>
                  {comm.text}
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment Input */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Add observation or cross-functional note..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newComment.trim()) {
                  onAddComment(newComment);
                  setNewComment('');
                }
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px'
              }}
            />
            <button
              onClick={() => {
                if (newComment.trim()) {
                  onAddComment(newComment);
                  setNewComment('');
                }
              }}
              className="btn btn-primary btn-sm"
            >
              <Send size={14} />
              Post
            </button>
          </div>
        </div>

        {/* Supporting File Attachments */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Paperclip size={18} color="#0284c7" />
              Supporting Evidence & Attachments
            </div>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <UploadCloud size={14} />
              Upload Document
              <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uploadedFiles.map((file, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={16} color="#0284c7" />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#0f172a' }}>{file.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{file.size} • Uploaded {file.uploadedAt}</div>
                  </div>
                </div>
                <span className="badge badge-low" style={{ fontSize: '10px' }}>Attached</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#64748b' }}>
            Accepted files: Inspection reports, Carrier Bills of Lading, RMA slips, and calibration photos.
          </div>
        </div>

      </div>

      {/* MODAL: Reject Return Case (Mandatory Reason) */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} />
                Reject Customer Return (Mandatory Audit Reason)
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
              Under SAP SD Governance policy, rejecting return order <strong>{currentReturn.returnOrder}</strong> requires a documented explanation citing warranty terms, inspection non-conformities, or commercial decisions.
            </p>

            <textarea
              placeholder="Enter mandatory justification for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none'
              }}
            />

            <div className="modal-footer">
              <button 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (rejectReason.trim().length < 5) {
                    alert("Please provide at least 5 characters explaining the rejection reason.");
                    return;
                  }
                  onExecuteAction('REJECT', 'Rejected', rejectReason);
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="btn btn-danger"
              >
                Confirm Rejection & Log Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SAP Illustrative Credit Memo Draft Preview */}
      {showDocPreview && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={20} color="#0284c7" />
                Illustrative SAP Credit Memo Draft (VF01 Simulation)
              </h3>
            </div>

            <div style={{
              border: '2px solid #e2e8f0',
              padding: '24px',
              borderRadius: '8px',
              background: '#ffffff',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>SUNGRID RENEWABLES LIMITED</div>
                  <div>Company Code: {currentReturn.companyCode} | Tax ID: GB-882910291</div>
                  <div>Plant: {currentReturn.plant} | Storage Location: {currentReturn.storageLocation}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>CREDIT MEMO DRAFT</div>
                  <div>Ref Doc: {currentReturn.sapDocument}</div>
                  <div>Date: {new Date().toISOString().substring(0, 10)}</div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>BILL-TO PARTY:</strong> {currentReturn.businessPartnerName || currentReturn.businessPartner}<br />
                <strong>COST CENTRE:</strong> {currentReturn.costCenter} ({currentReturn.costCenterName})<br />
                <strong>REASON CODE:</strong> 015 - Solar Panel Cell Fracture
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #0f172a' }}>
                    <th style={{ textAlign: 'left', padding: '4px' }}>Item</th>
                    <th style={{ textAlign: 'left', padding: '4px' }}>Material</th>
                    <th style={{ textAlign: 'right', padding: '4px' }}>Accepted Qty</th>
                    <th style={{ textAlign: 'right', padding: '4px' }}>Unit Price (GBP)</th>
                    <th style={{ textAlign: 'right', padding: '4px' }}>Net Value (GBP)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px' }}>000010</td>
                    <td style={{ padding: '4px' }}>{currentReturn.material}</td>
                    <td style={{ textAlign: 'right', padding: '4px' }}>10 EA</td>
                    <td style={{ textAlign: 'right', padding: '4px' }}>£1,566.67</td>
                    <td style={{ textAlign: 'right', padding: '4px' }}>£15,666.70</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ textAlign: 'right', borderTop: '1px solid #0f172a', paddingTop: '8px' }}>
                <div>Net Adjusted Total: <strong>£15,666.70</strong></div>
                <div>VAT (20%): <strong>£3,133.34</strong></div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                  Total Credit Amount: £18,800.04
                </div>
                <div style={{ color: '#16a34a', fontSize: '11px', marginTop: '4px' }}>
                  Avoided Over-Credit: £7,833.30 (5 units withheld at distributor)
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowDocPreview(false)} className="btn btn-secondary">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
