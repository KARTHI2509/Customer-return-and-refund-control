import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import * as XLSX from 'xlsx';

export default function AnalyticsReports({ 
  returns, 
  analytics 
}) {
  const [selectedPlantFilter, setSelectedPlantFilter] = useState('ALL');
  const [exportNotice, setExportNotice] = useState('');

  const kpis = analytics?.kpis || {};
  const exceptionCategories = analytics?.exceptionCategories || {};

  // Root cause chart data
  const rootCauseData = Object.keys(exceptionCategories).map(cat => ({
    name: cat,
    count: exceptionCategories[cat]
  }));

  // Exposure by Product
  const productExposure = {};
  returns.forEach(r => {
    productExposure[r.material] = (productExposure[r.material] || 0) + Number(r.amount);
  });

  const productData = Object.keys(productExposure).map(prod => ({
    name: prod,
    exposure: productExposure[prod]
  }));

  const COLORS = ['#0284c7', '#0d9488', '#d97706', '#dc2626', '#8b5cf6', '#ec4899'];

  // 1. Export to Excel (.xlsx) using real XLSX library
  const handleExportExcel = () => {
    const exportRows = returns.map(r => ({
      'Return ID': r.id,
      'SAP Return Order': r.returnOrder,
      'SAP Invoice Ref': r.sapDocument,
      'Company Code': r.companyCode,
      'Plant': r.plant,
      'Storage Location': r.storageLocation,
      'Cost Centre': r.costCenter,
      'Material': r.material,
      'Business Partner': r.businessPartner,
      'Amount (GBP)': r.amount,
      'Requested Date': r.requestedDate,
      'Ageing (Days)': r.ageingDays,
      'Ageing SLA Status': r.ageingStatus,
      'Risk Score': r.calculatedRiskScore,
      'Risk Level': r.calculatedRiskLevel,
      'Processing Status': r.processingStatus,
      'Primary Exception Reason': r.primaryExceptionReason,
      'Accountable Owner': r.assignedOwner
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Returns Exceptions');

    // Auto-fit column widths
    const maxCols = Object.keys(exportRows[0] || {}).map(key => ({
      wch: Math.max(key.length, 16)
    }));
    worksheet['!cols'] = maxCols;

    XLSX.writeFile(workbook, `SunGrid_Returns_Exception_Report_${new Date().toISOString().substring(0, 10)}.xlsx`);

    setExportNotice('Excel report (.xlsx) successfully generated and downloaded.');
    setTimeout(() => setExportNotice(''), 4000);
  };

  // 2. Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Return ID',
      'SAP Return Order',
      'SAP Invoice Ref',
      'Company Code',
      'Plant',
      'Storage Location',
      'Cost Centre',
      'Material',
      'Business Partner',
      'Amount GBP',
      'Requested Date',
      'Ageing Days',
      'Risk Level',
      'Status',
      'Exception Reason',
      'Assigned Owner'
    ];

    const rows = returns.map(r => [
      `"${r.id}"`,
      `"${r.returnOrder}"`,
      `"${r.sapDocument}"`,
      `"${r.companyCode}"`,
      `"${r.plant}"`,
      `"${r.storageLocation}"`,
      `"${r.costCenter}"`,
      `"${r.material}"`,
      `"${r.businessPartner}"`,
      r.amount,
      `"${r.requestedDate}"`,
      r.ageingDays,
      `"${r.calculatedRiskLevel}"`,
      `"${r.processingStatus}"`,
      `"${(r.primaryExceptionReason || '').replace(/"/g, '""')}"`,
      `"${r.assignedOwner}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SunGrid_Returns_Exceptions_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('CSV report successfully exported.');
    setTimeout(() => setExportNotice(''), 4000);
  };

  // 3. Export to PDF (formatted print preview)
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header and Export Toolbar */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800' }}>
              Operational Analytics & Root Cause Intelligence
            </h2>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Synthesised data across Plants 1108 and 1102 to support continuous process improvement (BKP)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleExportExcel} className="btn btn-secondary btn-sm" title="Download Excel (.xlsx) file">
              <FileSpreadsheet size={15} color="#16a34a" />
              Export Excel (.xlsx)
            </button>
            <button onClick={handleExportCSV} className="btn btn-secondary btn-sm" title="Download CSV file">
              <Download size={15} color="#0284c7" />
              Export CSV
            </button>
            <button onClick={handleExportPDF} className="btn btn-primary btn-sm" title="Print or save as PDF">
              <FileText size={15} />
              Print / PDF Report
            </button>
          </div>
        </div>

        {exportNotice && (
          <div style={{ marginTop: '12px', padding: '8px 12px', background: '#f0fdf4', color: '#16a34a', borderRadius: '6px', fontSize: '12.5px', fontWeight: '600' }}>
            ✓ {exportNotice}
          </div>
        )}
      </div>

      {/* KPI Performance Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div className="card">
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Average Resolution Cycle</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>6.4 Days</div>
          <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600', marginTop: '2px' }}>Target: &lt; 7.0 Days</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>First-Pass Processing Yield</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>68%</div>
          <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '600', marginTop: '2px' }}>Expected lift: +20-35%</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Recurrent Discrepancy Rate</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>14%</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Main driver: Inbound inspection count</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Strategic Context</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>1% - 2% Revenue at Risk</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>£21M - £42M enterprise risk pool</div>
        </div>
      </div>

      {/* Charts Section: Root Causes & Product Exposure */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '20px'
      }}>
        {/* Exception Root Causes Pareto */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <BarChart3 size={18} color="#0284c7" />
              Exception Root Causes Pareto
            </div>
            <span className="badge badge-neutral">Top Drivers</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rootCauseData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0284c7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Exposure by Material / Product */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={18} color="#0d9488" />
              Exposure by Material (GBP)
            </div>
            <span className="badge badge-neutral">Inventory At Risk</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `£${val / 1000}k`} />
                <Tooltip formatter={(value) => `£${Number(value).toLocaleString()}`} />
                <Bar dataKey="exposure" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
