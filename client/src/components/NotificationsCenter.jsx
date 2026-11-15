import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Filter,
  Eye,
  Info,
  Database
} from 'lucide-react';

export default function NotificationsCenter({ 
  returns = [], 
  notifications = [],
  onSelectReturn,
  onToggleRead,
  onMarkAllRead
}) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [localReadIds, setLocalReadIds] = useState(new Set());

  // Merge database-persisted notifications with dynamic SLA alerts
  const combinedAlerts = [];
  const processedKeys = new Set();

  // 1. Process Database-Backed Notifications
  if (Array.isArray(notifications) && notifications.length > 0) {
    notifications.forEach(n => {
      const relatedRecord = returns.find(r => r.id === n.relatedReturnId || r.sapDocument === n.relatedReturnId);
      processedKeys.add(n.id);
      if (n.relatedReturnId) processedKeys.add(n.relatedReturnId);

      combinedAlerts.push({
        id: n.id,
        recordId: n.relatedReturnId,
        sapDocument: relatedRecord?.sapDocument || n.relatedReturnId || 'SAP-SD-EXCEPTION',
        returnRecord: relatedRecord || returns[0],
        severity: n.notificationType || 'HIGH',
        title: n.title,
        message: n.message,
        timestamp: n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Active Alert',
        deliveryChannel: 'PostgreSQL Operational Event Log',
        rule: n.rule || 'ENTERPRISE_RISK_TRIGGER',
        isRead: n.isRead || localReadIds.has(n.id),
        isDbPersisted: true
      });
    });
  }

  // 2. Add any live dynamic SLA breaches not yet in DB
  returns.forEach(r => {
    const alertId = `alert-overdue-${r.id}`;
    if (!processedKeys.has(r.id) && r.ageingStatus === 'OVERDUE') {
      combinedAlerts.push({
        id: alertId,
        recordId: r.id,
        sapDocument: r.sapDocument,
        returnRecord: r,
        severity: 'CRITICAL',
        title: `Critical SLA Breach: ${r.sapDocument} (${r.material})`,
        message: `Case ageing of ${r.ageingDays} days has breached the 7-day review SLA threshold. Outstanding exposure is £${Number(r.amount).toLocaleString()}.`,
        timestamp: 'Live Breach (Dynamic)',
        deliveryChannel: 'In-App Operational Event',
        rule: 'SLA_THRESHOLD_EXCEEDED',
        isRead: localReadIds.has(alertId),
        isDbPersisted: false
      });
    }
  });

  const filteredAlerts = combinedAlerts.filter(alert => {
    if (filterSeverity === 'ALL') return true;
    return alert.severity === filterSeverity;
  });

  const handleMarkAllRead = () => {
    if (onMarkAllRead) {
      onMarkAllRead();
    }
    const allIds = new Set(combinedAlerts.map(a => a.id));
    setLocalReadIds(allIds);
  };

  const handleToggleRead = (alert) => {
    if (onToggleRead && alert.isDbPersisted) {
      onToggleRead(alert.id);
    } else {
      setLocalReadIds(prev => {
        const next = new Set(prev);
        if (next.has(alert.id)) next.delete(alert.id);
        else next.add(alert.id);
        return next;
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Notice Banner */}
      <div className="card" style={{ background: '#f8fafc', borderLeft: '4px solid #0284c7' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800' }}>
                In-App Notification & Risk Escalation Center
              </h2>
              <span className="badge badge-normal" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Database size={11} />
                Persisted in PostgreSQL
              </span>
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
              Real-time threshold breaches, SLA overruns, and financial exposure triggers backed by Neon database
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm">
              <CheckCircle2 size={14} />
              Mark All as Read
            </button>
          </div>
        </div>

        <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', background: '#eff6ff', padding: '8px 12px', borderRadius: '6px' }}>
          <Info size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          <strong>Delivery Channel Status:</strong> All notifications are captured in-app and persisted in Neon PostgreSQL. External SMTP email delivery is deactivated in Demo Mode to ensure compliance and zero external outbound leaks.
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setFilterSeverity('ALL')}
          className={`btn btn-sm ${filterSeverity === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All Alerts ({combinedAlerts.length})
        </button>
        <button
          onClick={() => setFilterSeverity('CRITICAL')}
          className={`btn btn-sm ${filterSeverity === 'CRITICAL' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Critical ({combinedAlerts.filter(a => a.severity === 'CRITICAL').length})
        </button>
        <button
          onClick={() => setFilterSeverity('HIGH')}
          className={`btn btn-sm ${filterSeverity === 'HIGH' ? 'btn-primary' : 'btn-secondary'}`}
        >
          High ({combinedAlerts.filter(a => a.severity === 'HIGH').length})
        </button>
      </div>

      {/* Alerts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredAlerts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
            No active alerts matching filter.
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isRead = alert.isRead;
            return (
              <div 
                key={alert.id}
                className="card"
                style={{
                  padding: '16px 20px',
                  borderLeft: `4px solid ${alert.severity === 'CRITICAL' ? '#dc2626' : '#d97706'}`,
                  backgroundColor: isRead ? '#f8fafc' : '#ffffff',
                  opacity: isRead ? 0.75 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: alert.severity === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
                      color: alert.severity === 'CRITICAL' ? '#dc2626' : '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {alert.severity === 'CRITICAL' ? <AlertTriangle size={18} /> : <Clock size={18} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a' }}>
                          {alert.title}
                        </h4>
                        <span className={`badge ${alert.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`} style={{ fontSize: '10px' }}>
                          {alert.severity}
                        </span>
                        {isRead && <span style={{ fontSize: '11px', color: '#64748b' }}>(Read)</span>}
                      </div>

                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px', maxWidth: '780px' }}>
                        {alert.message}
                      </div>

                      <div style={{ display: 'flex', gap: '14px', marginTop: '8px', fontSize: '11.5px', color: '#94a3b8' }}>
                        <span>Channel: <strong>{alert.deliveryChannel}</strong></span>
                        <span>•</span>
                        <span>Rule: <code>{alert.rule}</code></span>
                        <span>•</span>
                        <span>{alert.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleToggleRead(alert)}
                      className="btn btn-secondary btn-sm"
                    >
                      {isRead ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    {alert.returnRecord && (
                      <button
                        onClick={() => onSelectReturn(alert.returnRecord, 'workspace')}
                        className="btn btn-primary btn-sm"
                      >
                        <Eye size={13} />
                        Inspect & Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
