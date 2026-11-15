import React from 'react';
import { 
  Bell, 
  RotateCcw, 
  Sparkles, 
  UserCheck, 
  ShieldCheck, 
  Search,
  ExternalLink
} from 'lucide-react';

export default function Header({ 
  currentTab, 
  currentPersona, 
  setCurrentPersona, 
  onResetData, 
  unreadAlertsCount,
  openNotifications,
  openReferenceRecord,
  searchQuery,
  setSearchQuery
}) {
  const pageTitles = {
    dashboard: { title: 'Executive Control Dashboard', subtitle: 'SunGrid Renewables • Lead to Cash (SAP SD BKP Returns)' },
    workqueue: { title: 'Exception Work Queue', subtitle: 'Prioritised, explainable operational exception triage' },
    details: { title: 'Return Object Details & Document Flow', subtitle: 'Master data, document relationships, and timeline audit' },
    workspace: { title: 'Resolution & Approval Workspace', subtitle: 'Human-governed workflow, intelligent recommendations & SAP postings' },
    analytics: { title: 'Analytics & Root Cause Reports', subtitle: 'Pareto distribution, SLA performance, and multi-format exports' },
    notifications: { title: 'Notifications & Risk Escalations', subtitle: 'Threshold breaches, overdue alerts, and delivery logs' },
    settings: { title: 'SAP Integration & Process Context', subtitle: 'S/4HANA OData boundaries, RFC health, and Signavio BKP model' },
    interview: { title: 'Interview Mastery & Defense Hub', subtitle: 'KAAR Technologies 2nd Round Scenario Defense & Architecture' }
  };

  const currentInfo = pageTitles[currentTab] || pageTitles.dashboard;

  return (
    <header className="top-header">
      {/* Page Title */}
      <div className="header-left">
        <div className="page-title-badge">
          <h1 className="page-title">{currentInfo.title}</h1>
          <span className="page-subtitle">{currentInfo.subtitle}</span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="header-right">
        {/* Quick Demo Case Button */}
        <button 
          onClick={openReferenceRecord}
          className="btn btn-secondary btn-sm"
          style={{ borderColor: '#38bdf8', color: '#0284c7', background: '#f0f9ff' }}
          title="Instant drill-down to INV-460008 reference case"
        >
          <Sparkles size={14} />
          <span>Case INV-460008</span>
        </button>

        {/* Persona Switcher */}
        <div className="persona-selector-box">
          <UserCheck size={16} color="#64748b" />
          <span className="persona-label">Persona:</span>
          <select 
            value={currentPersona.id}
            onChange={(e) => {
              const selectedId = e.target.value;
              const personas = {
                analyst: { id: 'analyst', name: 'A. Sharma', role: 'Returns Analyst', permissions: 'Inspect, Validate, Comment' },
                manager: { id: 'manager', name: 'P. Sundaram', role: 'Returns Manager', permissions: 'Assign, Triage, Approve Operational' },
                finance: { id: 'finance', name: 'R. Nair', role: 'Finance Approver', permissions: 'High-Value Approvals, Credit Memo Release' },
                admin: { id: 'admin', name: 'System Admin', role: 'Administrator', permissions: 'Config, OData Mock Toggle, Reset Data' }
              };
              setCurrentPersona(personas[selectedId]);
            }}
            className="persona-select"
          >
            <option value="analyst">A. Sharma (Returns Analyst)</option>
            <option value="manager">P. Sundaram (Returns Manager)</option>
            <option value="finance">R. Nair (Finance Approver)</option>
            <option value="admin">System Admin (Full Access)</option>
          </select>
        </div>

        {/* Notifications Bell */}
        <button 
          onClick={openNotifications}
          className="header-btn"
          title="View In-App Notifications & SLA Breaches"
        >
          <Bell size={18} />
          {unreadAlertsCount > 0 && <span className="btn-counter">{unreadAlertsCount}</span>}
        </button>

        {/* Reset Demo Data Button */}
        <button 
          onClick={onResetData}
          className="btn btn-secondary btn-sm"
          title="Reset dataset to initial seeded state (including INV-460008)"
        >
          <RotateCcw size={14} />
          <span>Reset Demo</span>
        </button>
      </div>
    </header>
  );
}
