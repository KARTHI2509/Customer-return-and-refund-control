import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import ExceptionWorkQueue from './components/ExceptionWorkQueue';
import ReturnObjectDetails from './components/ReturnObjectDetails';
import ResolutionWorkspace from './components/ResolutionWorkspace';
import AnalyticsReports from './components/AnalyticsReports';
import NotificationsCenter from './components/NotificationsCenter';
import SettingsProcessContext from './components/SettingsProcessContext';
import InterviewMasteryGuide from './components/InterviewMasteryGuide';

// Configurable API Base URL for local dev and Vercel/Render deployment
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [returns, setReturns] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [sapStatus, setSapStatus] = useState({ isDemoMode: true, status: 'HEALTHY' });
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [authToken, setAuthToken] = useState(null);

  // Active Demo Persona
  const [currentPersona, setCurrentPersona] = useState({
    id: 'manager',
    name: 'P. Sundaram',
    role: 'Returns Manager',
    permissions: 'Assign, Triage, Approve Operational'
  });

  // Request headers helper
  const getHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
      'x-persona': currentPersona.role,
      'x-actor': currentPersona.name
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };

  // Fetch all initial data from PostgreSQL-backed API
  const loadAllData = async () => {
    try {
      const [returnsRes, analyticsRes, sapRes, notifRes] = await Promise.all([
        fetch(`${API_BASE}/returns`, { headers: getHeaders() }),
        fetch(`${API_BASE}/analytics`, { headers: getHeaders() }),
        fetch(`${API_BASE}/sap/status`),
        fetch(`${API_BASE}/notifications`, { headers: getHeaders() })
      ]);

      const returnsData = await returnsRes.json();
      const analyticsData = await analyticsRes.json();
      const sapData = await sapRes.json();
      const notifData = notifRes.ok ? await notifRes.json() : [];

      setReturns(Array.isArray(returnsData) ? returnsData : []);
      setAnalytics(analyticsData);
      setSapStatus(sapData);
      setNotifications(Array.isArray(notifData) ? notifData : []);

      // Default selected return to the primary reference transaction INV-460008
      if (Array.isArray(returnsData) && returnsData.length > 0) {
        const primary = returnsData.find(r => r.sapDocument === 'INV-460008') || returnsData[0];
        setSelectedReturn(prev => {
          if (!prev) return primary;
          const fresh = returnsData.find(r => r.id === prev.id || r.sapDocument === prev.sapDocument);
          return fresh || primary;
        });
      }
    } catch (err) {
      console.error('Error fetching data from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentPersona]);

  // Quick navigation to primary reference record
  const handleOpenReference = () => {
    const primary = returns.find(r => r.sapDocument === 'INV-460008') || returns[0];
    if (primary) {
      setSelectedReturn(primary);
      setCurrentTab('details');
    }
  };

  const handleSelectReturn = (record, targetTab = 'details') => {
    setSelectedReturn(record);
    setCurrentTab(targetTab);
  };

  // 1. Assign Owner Handler
  const handleAssignOwner = async (newOwner, reason) => {
    if (!selectedReturn) return;
    try {
      const res = await fetch(`${API_BASE}/returns/${selectedReturn.id}/assign`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          newOwner,
          reason,
          actor: currentPersona.name,
          persona: currentPersona.role
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedReturn(data.record);
        await loadAllData();
      } else {
        alert(data.error || 'Failed to update owner.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating owner.');
    }
  };

  // 2. Add Comment Handler
  const handleAddComment = async (text) => {
    if (!selectedReturn) return;
    try {
      const res = await fetch(`${API_BASE}/returns/${selectedReturn.id}/comment`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          text,
          author: `${currentPersona.name} (${currentPersona.role})`,
          persona: currentPersona.role
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedReturn(prev => ({ ...prev, comments: data.comments }));
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Recommendation Decision Handler
  const handleRecommendationDecision = async (decision, feedback, revisedAction) => {
    if (!selectedReturn) return;
    try {
      const res = await fetch(`${API_BASE}/returns/${selectedReturn.id}/recommendation-decision`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          decision,
          feedback,
          revisedAction,
          actor: currentPersona.name,
          persona: currentPersona.role
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedReturn(prev => ({ ...prev, recommendation: data.recommendation }));
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Execute Action Handler (Approve, Reject, Request Approval)
  const handleExecuteAction = async (actionType, targetStatus, reason) => {
    if (!selectedReturn) return;
    try {
      const res = await fetch(`${API_BASE}/returns/${selectedReturn.id}/action`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          actionType,
          targetStatus,
          reason,
          actor: currentPersona.name,
          persona: currentPersona.role
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedReturn(data.record);
        await loadAllData();
        alert(`Action '${actionType}' completed successfully. ${data.sapResult?.sapMessage || ''}`);
      } else {
        alert(data.error || 'Action execution failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error executing action.');
    }
  };

  // 5. Database Notification Actions
  const handleToggleNotificationRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Error updating notification read state:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // 6. Ping SAP Endpoint
  const handlePingSap = async () => {
    const res = await fetch(`${API_BASE}/sap/ping`, { method: 'POST' });
    const data = await res.json();
    const statusRes = await fetch(`${API_BASE}/sap/status`);
    const statusData = await statusRes.json();
    setSapStatus(statusData);
    return data;
  };

  // 7. Toggle Error Simulation
  const handleToggleSimulateError = async () => {
    const updated = await fetch(`${API_BASE}/sap/config`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ simulateError: !sapStatus.simulateError })
    });
    const data = await updated.json();
    setSapStatus(data);
  };

  // 8. Reset Demo Data in PostgreSQL
  const handleResetData = async () => {
    if (!window.confirm('Reset demo dataset in Neon PostgreSQL back to original baseline (including INV-460008)?')) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/reset-data`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        await loadAllData();
        alert('Demo data has been reset to its original seeded baseline in Neon PostgreSQL.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate unread alerts count from persisted notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#0f172a',
        color: '#fff',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#38bdf8' }}>
            SunGrid Renewables
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            Connecting to Neon PostgreSQL & Initializing SAP S/4HANA SD Exception Control...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Dark Navy Enterprise Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openReferenceRecord={handleOpenReference}
        sapStatus={sapStatus}
        counts={{
          activeExceptions: returns.filter(r => r.processingStatus !== 'Completed').length,
          pendingApprovals: returns.filter(r => r.processingStatus === 'Pending Approval').length,
          unreadAlerts: unreadCount
        }}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <Header
          currentTab={currentTab}
          currentPersona={currentPersona}
          setCurrentPersona={setCurrentPersona}
          onResetData={handleResetData}
          unreadAlertsCount={unreadCount}
          openNotifications={() => setCurrentTab('notifications')}
          openReferenceRecord={handleOpenReference}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Dynamic Page Body */}
        <main className="page-body">
          {currentTab === 'dashboard' && (
            <ExecutiveDashboard
              returns={returns}
              analytics={analytics}
              onSelectReturn={handleSelectReturn}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'workqueue' && (
            <ExceptionWorkQueue
              returns={returns}
              onSelectReturn={handleSelectReturn}
              currentPersona={currentPersona}
            />
          )}

          {currentTab === 'details' && (
            <ReturnObjectDetails
              currentReturn={selectedReturn}
              onNavigateToWorkspace={() => setCurrentTab('workspace')}
              onBackToQueue={() => setCurrentTab('workqueue')}
            />
          )}

          {currentTab === 'workspace' && (
            <ResolutionWorkspace
              currentReturn={selectedReturn}
              currentPersona={currentPersona}
              onAssignOwner={handleAssignOwner}
              onAddComment={handleAddComment}
              onRecommendationDecision={handleRecommendationDecision}
              onExecuteAction={handleExecuteAction}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsReports
              returns={returns}
              analytics={analytics}
            />
          )}

          {currentTab === 'notifications' && (
            <NotificationsCenter
              returns={returns}
              notifications={notifications}
              onSelectReturn={handleSelectReturn}
              onToggleRead={handleToggleNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsProcessContext
              sapStatus={sapStatus}
              onPingSap={handlePingSap}
              onToggleSimulateError={handleToggleSimulateError}
              onResetData={handleResetData}
            />
          )}

          {currentTab === 'interview' && (
            <InterviewMasteryGuide
              onSelectReference={handleOpenReference}
            />
          )}
        </main>
      </div>
    </div>
  );
}
