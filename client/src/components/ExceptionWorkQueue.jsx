import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  ArrowUpDown, 
  ChevronRight, 
  AlertTriangle, 
  ShieldAlert, 
  Download,
  Bookmark,
  CheckCircle,
  XCircle,
  Eye,
  FileCheck2
} from 'lucide-react';

export default function ExceptionWorkQueue({ 
  returns, 
  onSelectReturn, 
  currentPersona,
  onOpenCreate 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedAgeing, setSelectedAgeing] = useState('ALL');
  const [sortField, setSortField] = useState('calculatedRiskScore');
  const [sortDirection, setSortDirection] = useState('desc');

  // Filter Variants
  const applyVariant = (variantName) => {
    if (variantName === 'PRIMARY_DEMO') {
      setSearchTerm('INV-460008');
      setSelectedPlant('ALL');
      setSelectedRisk('ALL');
      setSelectedStatus('ALL');
      setSelectedAgeing('ALL');
    } else if (variantName === 'HIGH_EXPOSURE') {
      setSearchTerm('');
      setSelectedPlant('ALL');
      setSelectedRisk('CRITICAL');
      setSelectedStatus('ALL');
      setSelectedAgeing('ALL');
    } else if (variantName === 'OVERDUE_SLA') {
      setSearchTerm('');
      setSelectedPlant('ALL');
      setSelectedRisk('ALL');
      setSelectedStatus('ALL');
      setSelectedAgeing('OVERDUE');
    } else if (variantName === 'PLANT_1108_SL11') {
      setSearchTerm('');
      setSelectedPlant('1108');
      setSelectedRisk('ALL');
      setSelectedStatus('ALL');
      setSelectedAgeing('ALL');
    } else if (variantName === 'UNASSIGNED') {
      setSearchTerm('Unassigned');
      setSelectedPlant('ALL');
      setSelectedRisk('ALL');
      setSelectedStatus('ALL');
      setSelectedAgeing('ALL');
    } else if (variantName === 'RESET') {
      setSearchTerm('');
      setSelectedPlant('ALL');
      setSelectedRisk('ALL');
      setSelectedStatus('ALL');
      setSelectedAgeing('ALL');
    }
  };

  // Filtered & Sorted items
  const filteredReturns = useMemo(() => {
    return returns
      .filter(item => {
        // Search filter
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchDoc = item.sapDocument?.toLowerCase().includes(q);
          const matchOrder = item.returnOrder?.toLowerCase().includes(q);
          const matchMaterial = item.material?.toLowerCase().includes(q);
          const matchReason = item.primaryExceptionReason?.toLowerCase().includes(q);
          const matchOwner = item.assignedOwner?.toLowerCase().includes(q);
          const matchPartner = item.businessPartner?.toLowerCase().includes(q) || item.businessPartnerName?.toLowerCase().includes(q);
          if (!matchDoc && !matchOrder && !matchMaterial && !matchReason && !matchOwner && !matchPartner) {
            return false;
          }
        }

        // Plant filter
        if (selectedPlant !== 'ALL' && item.plant !== selectedPlant) return false;

        // Risk filter
        if (selectedRisk !== 'ALL' && item.calculatedRiskLevel !== selectedRisk) return false;

        // Status filter
        if (selectedStatus !== 'ALL' && item.processingStatus !== selectedStatus) return false;

        // Ageing filter
        if (selectedAgeing !== 'ALL') {
          if (selectedAgeing === 'OVERDUE' && item.ageingStatus !== 'OVERDUE') return false;
          if (selectedAgeing === 'ATTENTION' && item.ageingStatus !== 'ATTENTION') return false;
          if (selectedAgeing === 'NORMAL' && item.ageingStatus !== 'NORMAL') return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (sortField === 'amount' || sortField === 'calculatedRiskScore' || sortField === 'ageingDays') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [returns, searchTerm, selectedPlant, selectedRisk, selectedStatus, selectedAgeing, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Saved Filter Variants Bar */}
      <div className="card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bookmark size={16} color="#0284c7" />
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
              Saved Filter Variants:
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button 
              onClick={() => applyVariant('PRIMARY_DEMO')} 
              className="btn btn-secondary btn-sm"
              style={{ borderColor: '#38bdf8', color: '#0284c7', background: '#f0f9ff' }}
            >
              <Sparkles size={12} />
              Primary Reference (INV-460008)
            </button>

            <button 
              onClick={() => applyVariant('HIGH_EXPOSURE')} 
              className="btn btn-secondary btn-sm"
            >
              High Risk &gt; £20,000
            </button>

            <button 
              onClick={() => applyVariant('OVERDUE_SLA')} 
              className="btn btn-secondary btn-sm"
            >
              Overdue SLA (&gt; 7 Days)
            </button>

            <button 
              onClick={() => applyVariant('PLANT_1108_SL11')} 
              className="btn btn-secondary btn-sm"
            >
              Plant 1108 (Solar SL11)
            </button>

            <button 
              onClick={() => applyVariant('UNASSIGNED')} 
              className="btn btn-secondary btn-sm"
            >
              Unassigned Ownership
            </button>

            <button 
              onClick={() => applyVariant('RESET')} 
              className="btn btn-secondary btn-sm"
              style={{ color: '#64748b' }}
            >
              Reset Filters
            </button>

            {onOpenCreate && (
              <button
                onClick={onOpenCreate}
                className="btn btn-primary btn-sm"
                style={{ marginLeft: 'auto', fontWeight: '700' }}
              >
                + New Return Case
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Multi-Filter Controls */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            <input 
              type="text"
              placeholder="Search document, material, partner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {/* Plant Selector */}
          <div>
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                background: '#fff'
              }}
            >
              <option value="ALL">All Plants (1108 & 1102)</option>
              <option value="1108">Plant 1108 (Solar Module Fab)</option>
              <option value="1102">Plant 1102 (Wind Turbine Fab)</option>
            </select>
          </div>

          {/* Risk Level Selector */}
          <div>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                background: '#fff'
              }}
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="CRITICAL">Critical (Score &gt;= 70)</option>
              <option value="HIGH">High (Score &gt;= 50)</option>
              <option value="MEDIUM">Medium (Score &gt;= 30)</option>
              <option value="LOW">Low (Score &lt; 30)</option>
            </select>
          </div>

          {/* Processing Status Selector */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                background: '#fff'
              }}
            >
              <option value="ALL">All Processing Statuses</option>
              <option value="Partially Processed">Partially Processed</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Unassigned">Unassigned</option>
              <option value="In Review">In Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Ageing SLA Selector */}
          <div>
            <select
              value={selectedAgeing}
              onChange={(e) => setSelectedAgeing(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                background: '#fff'
              }}
            >
              <option value="ALL">All Ageing Profiles</option>
              <option value="OVERDUE">Overdue (&gt; 7 Days)</option>
              <option value="ATTENTION">Attention (4-7 Days)</option>
              <option value="NORMAL">Normal (0-3 Days)</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>Showing <strong>{filteredReturns.length}</strong> of <strong>{returns.length}</strong> records</span>
          <span>Sorted by: <strong>{sortField}</strong> ({sortDirection.toUpperCase()})</span>
        </div>
      </div>

      {/* Main Work Queue Table */}
      <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('sapDocument')} style={{ cursor: 'pointer' }}>
                  Document Ref <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: '4px' }} />
                </th>
                <th>Org Units (Co/Plant/SLoc)</th>
                <th>Material & Business Partner</th>
                <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>
                  Amount (GBP) <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: '4px' }} />
                </th>
                <th onClick={() => handleSort('ageingDays')} style={{ cursor: 'pointer' }}>
                  Ageing <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: '4px' }} />
                </th>
                <th onClick={() => handleSort('calculatedRiskScore')} style={{ cursor: 'pointer' }}>
                  Risk Score <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: '4px' }} />
                </th>
                <th>Status</th>
                <th>Exception Reason & Business Consequence</th>
                <th>Accountable Owner</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No return exception records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredReturns.map(item => (
                  <tr 
                    key={item.id} 
                    className={item.isPrimaryReference ? 'highlight-ref' : ''}
                  >
                    {/* Document Ref */}
                    <td>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.sapDocument}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>RO: {item.returnOrder}</div>
                      {item.isPrimaryReference && (
                        <span className="badge badge-ref" style={{ fontSize: '9px', padding: '1px 6px', marginTop: '3px' }}>
                          KAAR Reference
                        </span>
                      )}
                    </td>

                    {/* Org Units */}
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '12.5px' }}>CoCode {item.companyCode}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Plant {item.plant} • {item.storageLocation}</div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>CC: {item.costCenter}</div>
                    </td>

                    {/* Material & Partner */}
                    <td>
                      <div style={{ fontWeight: '600' }}>{item.material}</div>
                      <div style={{ fontSize: '11.5px', color: '#475569' }}>
                        {item.businessPartner}
                      </div>
                    </td>

                    {/* Amount */}
                    <td style={{ fontWeight: '700', color: '#0f172a' }}>
                      £{Number(item.amount).toLocaleString()}
                    </td>

                    {/* Ageing */}
                    <td>
                      <span className={`badge ${
                        item.ageingStatus === 'OVERDUE' ? 'badge-critical' : 
                        item.ageingStatus === 'ATTENTION' ? 'badge-high' : 'badge-low'
                      }`}>
                        {item.ageingDays}d ({item.ageingStatus})
                      </span>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                        Req: {item.requestedDate}
                      </div>
                    </td>

                    {/* Risk Score */}
                    <td>
                      <span className={`badge ${
                        item.calculatedRiskLevel === 'CRITICAL' ? 'badge-critical' :
                        item.calculatedRiskLevel === 'HIGH' ? 'badge-high' :
                        item.calculatedRiskLevel === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                      }`}>
                        {item.calculatedRiskLevel} ({item.calculatedRiskScore})
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className="badge badge-neutral" style={{ fontWeight: '600' }}>
                        {item.processingStatus}
                      </span>
                    </td>

                    {/* Exception Reason & Consequence */}
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontSize: '12px', color: '#334155', fontWeight: '500' }}>
                        {item.primaryExceptionReason}
                      </div>
                    </td>

                    {/* Owner */}
                    <td style={{ fontSize: '12px' }}>
                      {item.assignedOwner && !item.assignedOwner.includes('Unassigned') ? (
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{item.assignedOwner}</span>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: '700' }}>Unassigned</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button 
                        onClick={() => onSelectReturn(item, 'details')}
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px' }}
                        title="View Full Object Details"
                      >
                        <Eye size={13} />
                        View
                      </button>
                      <button 
                        onClick={() => onSelectReturn(item, 'workspace')}
                        className="btn btn-primary btn-sm"
                        title="Open Resolution Workspace"
                      >
                        <FileCheck2 size={13} />
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
