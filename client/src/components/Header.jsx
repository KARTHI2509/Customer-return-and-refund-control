import React from 'react';
import { 
  Bell, 
  Sparkles, 
  PlusCircle,
  LogOut,
  User,
  Shield,
  Briefcase
} from 'lucide-react';

export default function Header({ 
  currentTab, 
  currentUser,
  onLogout,
  unreadAlertsCount,
  openNotifications,
  openReferenceRecord,
  openCreateReturn
}) {
  const pageTitles = {
    dashboard: { title: 'Executive Control Dashboard', subtitle: 'SunGrid Renewables • Lead to Cash (SAP SD BKP Returns)' },
    workqueue: { title: 'Exception Work Queue', subtitle: 'Prioritised, explainable operational exception triage' },
    details: { title: 'Return Object Details & Document Flow', subtitle: 'Master data, document relationships, and timeline audit' },
    workspace: { title: 'Resolution & Approval Workspace', subtitle: 'Human-governed workflow, intelligent recommendations & SAP postings' },
    analytics: { title: 'Analytics & Root Cause Reports', subtitle: 'Pareto distribution, SLA performance, and multi-format exports' },
    notifications: { title: 'Notifications & Risk Escalations', subtitle: 'Threshold breaches, overdue alerts, and delivery logs' },
    users: { title: 'User Management & Authorization', subtitle: 'Administer operator registrations, approvals, and RBAC privileges' },
    settings: { title: 'SAP Integration & Process Context', subtitle: 'S/4HANA OData boundaries, RFC health, and Signavio BKP model' },
    interview: { title: 'Interview Mastery & Defense Hub', subtitle: 'KAAR Technologies 2nd Round Scenario Defense & Architecture' }
  };

  const currentInfo = pageTitles[currentTab] || pageTitles.dashboard;

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' };
      case 'FINANCE_APPROVER':
        return { backgroundColor: '#f3e8ff', color: '#6b21a8', borderColor: '#e9d5ff' };
      case 'RETURNS_MANAGER':
        return { backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' };
      case 'RETURNS_ANALYST':
      default:
        return { backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' };
    }
  };

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
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Create New Return Button */}
        <button
          onClick={openCreateReturn}
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
          title="Create and persist a new customer return case in PostgreSQL"
        >
          <PlusCircle size={15} />
          <span>New Return</span>
        </button>

        {/* Quick Reference Spotlight Button */}
        <button 
          onClick={openReferenceRecord}
          className="btn btn-secondary btn-sm"
          style={{ borderColor: '#38bdf8', color: '#0284c7', background: '#f0f9ff' }}
          title="Instant drill-down to INV-460008 reference case"
        >
          <Sparkles size={14} />
          <span>Case INV-460008</span>
        </button>

        {/* Notifications Bell */}
        <button 
          onClick={openNotifications}
          className="header-btn"
          title="View In-App Notifications & SLA Breaches"
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
          {unreadAlertsCount > 0 && <span className="btn-counter">{unreadAlertsCount}</span>}
        </button>

        {/* Authenticated User Badge & Profile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#0284c7',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
          </div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>
              {currentUser?.name || 'Authenticated Operator'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: '700',
                padding: '1px 6px',
                borderRadius: '4px',
                border: '1px solid',
                ...getRoleBadgeStyle(currentUser?.role)
              }}>
                {currentUser?.role || 'RETURNS_ANALYST'}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '4px 8px',
              marginLeft: '4px',
              color: '#dc2626',
              borderColor: '#fca5a5',
              background: '#fff'
            }}
            title="Sign out of SunGrid Exception Control"
          >
            <LogOut size={13} />
            <span style={{ fontSize: '11px' }}>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
