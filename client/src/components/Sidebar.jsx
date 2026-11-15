import React from 'react';
import { 
  LayoutDashboard, 
  AlertOctagon, 
  FileCheck2, 
  BarChart3, 
  Bell, 
  Settings, 
  GraduationCap, 
  Layers, 
  Sparkles,
  Server
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  openReferenceRecord, 
  sapStatus,
  counts 
}) {
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Executive Dashboard', 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      id: 'workqueue', 
      label: 'Exception Work Queue', 
      icon: AlertOctagon,
      badge: counts.activeExceptions || 7,
      danger: true
    },
    { 
      id: 'details', 
      label: 'Return Object Details', 
      icon: Layers,
      badge: null
    },
    { 
      id: 'workspace', 
      label: 'Resolution Workspace', 
      icon: FileCheck2,
      badge: counts.pendingApprovals || 2
    },
    { 
      id: 'analytics', 
      label: 'Analytics & Reports', 
      icon: BarChart3,
      badge: null
    },
    { 
      id: 'notifications', 
      label: 'Notifications & Alerts', 
      icon: Bell,
      badge: counts.unreadAlerts || 3
    },
    { 
      id: 'settings', 
      label: 'SAP Context & Config', 
      icon: Settings,
      badge: null
    },
    { 
      id: 'interview', 
      label: 'Interview Mastery Hub', 
      icon: GraduationCap,
      badge: 'PRO'
    }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-badge">
          <div className="brand-logo-icon">SG</div>
          <div>
            <div className="brand-title">SunGrid Renewables</div>
            <div className="brand-sub">SAP SD Returns Control</div>
          </div>
        </div>

        {/* SAP Adapter Indicator */}
        <div className={`sap-mode-indicator ${sapStatus?.status === 'DEGRADED' ? 'degraded' : ''}`}>
          <div className={`pulse-dot ${sapStatus?.status === 'DEGRADED' ? 'degraded' : ''}`}></div>
          <span>{sapStatus?.isDemoMode ? 'SAP OData: Demo Adapter' : 'SAP S/4HANA: Live'}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Operations & Control</div>
        {navItems.slice(0, 4).map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-item-content">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`nav-badge ${item.danger ? 'danger' : ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="nav-section-title" style={{ marginTop: '12px' }}>Intelligence & Governance</div>
        {navItems.slice(4).map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-item-content">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`nav-badge ${item.danger ? 'danger' : ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Primary Reference Spotlight Shortcut */}
      <div className="sidebar-footer">
        <div 
          className="reference-card-shortcut"
          onClick={openReferenceRecord}
          title="Click to view the exact KAAR assessment reference transaction"
        >
          <div className="ref-shortcut-title">
            <Sparkles size={13} />
            <span>Primary Demo Case</span>
          </div>
          <div className="ref-shortcut-doc">INV-460008</div>
          <div className="ref-shortcut-meta">Plant 1108 • £23,500 • CP-12</div>
        </div>
      </div>
    </aside>
  );
}
