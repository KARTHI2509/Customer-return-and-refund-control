import React, { useState } from 'react';
import { PlusCircle, X, ShieldAlert, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

export default function CreateReturnModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    sapDocument: '',
    returnOrder: '',
    companyCode: '1300',
    plant: '1108',
    storageLocation: 'SL11',
    costCenter: 'CC-2208',
    material: '',
    materialId: '',
    businessPartner: '',
    amount: '',
    currency: 'GBP',
    requestedDate: new Date().toISOString().substring(0, 10),
    exceptionCategory: 'Execution Mismatch',
    primaryExceptionReason: '',
    exceptionType: 'Physical Inspection Variance'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
  const token = localStorage.getItem('sungrid_token');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      // Auto-sync storage location and cost center based on plant
      if (name === 'plant') {
        if (value === '1108') {
          next.storageLocation = 'SL11';
          next.costCenter = 'CC-2208';
        } else if (value === '1102') {
          next.storageLocation = 'SL02';
          next.costCenter = 'CC-1102';
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.sapDocument || !formData.material || !formData.amount) {
      setError('SAP Document reference, Material description, and Amount are mandatory.');
      return;
    }

    if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      setError('Amount must be a valid positive number in GBP.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/returns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create return record.');
        return;
      }

      onSuccess(data.record);
      onClose();
    } catch (err) {
      setError('Network failure connecting to PostgreSQL backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 9999,
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
              Create Customer Return Case (SAP SD BKP)
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Register a new return exception into Neon PostgreSQL with SAP SD incompletion rules
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #ef4444',
              color: '#991b1b',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>{error}</div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                SAP Document Reference * (e.g. INV-XXXXXX)
              </label>
              <input
                type="text"
                name="sapDocument"
                required
                placeholder="INV-460250"
                value={formData.sapDocument}
                onChange={handleChange}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                Return Order (Optional VA01 Ref)
              </label>
              <input
                type="text"
                name="returnOrder"
                placeholder="RO-772180"
                value={formData.returnOrder}
                onChange={handleChange}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                Manufacturing Plant *
              </label>
              <select
                name="plant"
                value={formData.plant}
                onChange={handleChange}
                style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              >
                <option value="1108">Plant 1108 (Solar Module)</option>
                <option value="1102">Plant 1102 (Wind Turbine)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                Storage Location *
              </label>
              <input
                type="text"
                name="storageLocation"
                required
                value={formData.storageLocation}
                onChange={handleChange}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                Cost Center *
              </label>
              <input
                type="text"
                name="costCenter"
                required
                value={formData.costCenter}
                onChange={handleChange}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                Material Description *
              </label>
              <input
                type="text"
                name="material"
                required
                placeholder="e.g. Bifacial Solar Module BSM-400"
                value={formData.material}
                onChange={handleChange}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                Financial Exposure (GBP) *
              </label>
              <input
                type="number"
                name="amount"
                required
                step="0.01"
                placeholder="18500.00"
                value={formData.amount}
                onChange={handleChange}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                Customer / Business Partner
              </label>
              <input
                type="text"
                name="businessPartner"
                placeholder="Meridian Renewable Grids Ltd"
                value={formData.businessPartner}
                onChange={handleChange}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                Requested Return Date
              </label>
              <input
                type="date"
                name="requestedDate"
                value={formData.requestedDate}
                onChange={handleChange}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
              Exception Reason & Discrepancy Findings
            </label>
            <textarea
              name="primaryExceptionReason"
              rows="3"
              placeholder="Describe the discrepancy (e.g. 8 units received at SL11 inspection vs 10 units on invoice; missing Return Reason code 015 in VA01)."
              value={formData.primaryExceptionReason}
              onChange={handleChange}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          {/* Modal Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Creating in PostgreSQL...' : 'Create & Persist Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

