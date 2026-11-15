import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  PoundSterling, 
  TrendingUp, 
  CheckCircle2, 
  RotateCw, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Building2,
  Calendar,
  AlertOctagon,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function ExecutiveDashboard({ 
  returns, 
  analytics, 
  onSelectReturn, 
  onNavigate 
}) {
  const kpis = analytics?.kpis || {};
  const ageingBuckets = analytics?.ageingBuckets || {};
  const plantCounts = analytics?.plantCounts || {};

  // Find exact primary reference transaction
  const primaryRef = returns.find(r => r.sapDocument === 'INV-460008') || returns[0];

  // Chart data for Ageing
  const ageingChartData = Object.keys(ageingBuckets).map(key => ({
    name: key.split(' ')[0], // '0-3', '4-7', '8-14', '15+'
    fullName: key,
    count: ageingBuckets[key]
  }));

  // Chart data for Plant distribution
  const plantChartData = Object.keys(plantCounts).map(key => ({
    name: key.includes('1108') ? 'Plant 1108 (Solar)' : 'Plant 1102 (Wind)',
    value: plantCounts[key],
    color: key.includes('1108') ? '#0284c7' : '#0d9488'
  }));

  // Critical exceptions needing triage
  const criticalQueue = returns
    .filter(r => r.calculatedRiskLevel === 'CRITICAL' || r.ageingStatus === 'OVERDUE')
    .slice(0, 5);

  const COLORS = ['#dc2626', '#d97706', '#0284c7', '#16a34a', '#8b5cf6'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Strategic Scenario Context Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: '16px',
        padding: '20px 24px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: '1px solid #334155',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '780px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              background: '#0ea5e9',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '6px',
              textTransform: 'uppercase'
            }}>
              Executive Brief
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              SunGrid Renewables • £2.1B Annual Revenue • 7,600 Employees
            </span>
          </div>
          <h2 style={{ fontSize: '19px', fontWeight: '700', marginBottom: '6px' }}>
            Customer Returns Exception Control — SAP S/4HANA SD BKP
          </h2>
          <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.5' }}>
            Delays in return order completions risk <strong>1% to 2% of annual revenue (£21M–£42M)</strong> through avoidable premium freight, overtime, write-offs, and customer disputes. This operational layer prioritises high-risk exceptions, explains root causes, and guides human-in-the-loop SAP resolution.
          </p>
        </div>

        <div style={{ textAlign: 'right', minWidth: '180px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>
            Active Exposure at Risk
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8' }}>
            £{(kpis.totalExposureGbp || 144700).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            Across {kpis.activeExceptions || 7} open exceptions
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Total & Exceptions */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: '#fef2f2',
            color: '#dc2626',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Active Exceptions
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
              {kpis.activeExceptions || 7} <span style={{ fontSize: '14px', fontWeight: '500', color: '#94a3b8' }}>/ {kpis.totalReturns || 8} total</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600' }}>
              {kpis.overdueCases || 3} overdue review
            </div>
          </div>
        </div>

        {/* Card 2: Pending Approvals */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: '#fffbeb',
            color: '#d97706',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Pending Approvals
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
              {kpis.pendingApprovals || 2}
            </div>
            <div style={{ fontSize: '11.5px', color: '#d97706', fontWeight: '600' }}>
              Waiting in inbox &gt; 5 days
            </div>
          </div>
        </div>

        {/* Card 3: SLA Adherence */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: '#f0fdf4',
            color: '#16a34a',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              SLA Adherence
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
              {kpis.slaAdherencePct || 78}%
            </div>
            <div style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: '600' }}>
              Target: &gt; 85% by Q4
            </div>
          </div>
        </div>

        {/* Card 4: First-Pass Yield */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: '#eff6ff',
            color: '#2563eb',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              First-Pass Yield
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
              {kpis.firstPassYieldPct || 68}%
            </div>
            <div style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: '600' }}>
              Target outcome: +20-35%
            </div>
          </div>
        </div>
      </div>

      {/* PRIMARY DEMO SPOTLIGHT: EXACT REFERENCE TRANSACTION INV-460008 */}
      {primaryRef && (
        <div className="card" style={{
          border: '2px solid #0284c7',
          background: 'linear-gradient(to right, #f0f9ff, #ffffff)',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-ref">
                <Sparkles size={13} />
                ASSESSMENT PRIMARY CASE
              </span>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                Document: {primaryRef.sapDocument}
              </h3>
              <span className="badge badge-critical">
                Risk Score: {primaryRef.calculatedRiskScore || 88} / 100 ({primaryRef.calculatedRiskLevel})
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => onSelectReturn(primaryRef, 'details')}
                className="btn btn-secondary btn-sm"
              >
                Inspect Object Details
              </button>
              <button 
                onClick={() => onSelectReturn(primaryRef, 'workspace')}
                className="btn btn-primary btn-sm"
              >
                Open Resolution Workspace
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Grid of Exact Assessment Values */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #e0f2fe'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Company Code</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{primaryRef.companyCode} (SunGrid HQ)</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Plant & Storage Loc</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{primaryRef.plant} / {primaryRef.storageLocation} (SL11)</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Cost Centre</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{primaryRef.costCenter}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Material</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{primaryRef.material}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Amount (GBP)</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0284c7' }}>£{Number(primaryRef.amount).toLocaleString()}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Requested Date</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{primaryRef.requestedDate}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Processing Status</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#d97706' }}>{primaryRef.processingStatus}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Business Partner</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>{primaryRef.businessPartner}</div>
            </div>
          </div>

          <div style={{ marginTop: '12px', fontSize: '12.5px', color: '#475569', lineHeight: '1.4' }}>
            <strong>Why it matters:</strong> {primaryRef.primaryExceptionReason}
          </div>
        </div>
      )}

      {/* Two Column Section: Ageing & Plant Distribution Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* Ageing Profile Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Dynamic Ageing Profile (Days)</div>
              <div className="card-subtitle">Calculated dynamically from requested dates vs SLA thresholds</div>
            </div>
            <span className="badge badge-neutral">SLA: 7d Threshold</span>
          </div>
          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="fullName" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Plant Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Returns Volume by Production Plant</div>
              <div className="card-subtitle">SunGrid Solar (1108) vs Wind (1102) manufacturing centres</div>
            </div>
          </div>
          <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={plantChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {plantChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '40%' }}>
              {plantChartData.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: item.color }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.value} returns</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Exception Priority Queue Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <AlertTriangle size={18} color="#dc2626" />
              Prioritised Critical Exception Work Queue
            </div>
            <div className="card-subtitle">Cases posing high financial exposure, SLA breaches, or inventory discrepancies</div>
          </div>
          <button 
            onClick={() => onNavigate('workqueue')} 
            className="btn btn-secondary btn-sm"
          >
            View Full Queue ({returns.length})
          </button>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document / Ref</th>
                <th>Material & Plant</th>
                <th>Exposure (GBP)</th>
                <th>Ageing</th>
                <th>Risk Tier</th>
                <th>Root Cause Finding</th>
                <th>Accountable Owner</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {criticalQueue.map(item => (
                <tr key={item.id} className={item.isPrimaryReference ? 'highlight-ref' : ''}>
                  <td>
                    <div style={{ fontWeight: '700' }}>{item.sapDocument}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{item.returnOrder}</div>
                    {item.isPrimaryReference && (
                      <span className="badge badge-ref" style={{ fontSize: '9px', padding: '1px 5px', marginTop: '2px' }}>
                        Primary Reference
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{item.material}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Plant {item.plant} • {item.storageLocation}</div>
                  </td>
                  <td style={{ fontWeight: '700', color: '#0f172a' }}>
                    £{Number(item.amount).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${item.ageingStatus === 'OVERDUE' ? 'badge-critical' : 'badge-high'}`}>
                      {item.ageingDays} days
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${item.calculatedRiskLevel === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`}>
                      {item.calculatedRiskLevel} ({item.calculatedRiskScore})
                    </span>
                  </td>
                  <td style={{ maxWidth: '280px', fontSize: '12px', color: '#475569' }}>
                    {item.primaryExceptionReason}
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    {item.assignedOwner || <span style={{ color: '#dc2626', fontWeight: '600' }}>Unassigned</span>}
                  </td>
                  <td>
                    <button 
                      onClick={() => onSelectReturn(item, 'workspace')}
                      className="btn btn-primary btn-sm"
                    >
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
