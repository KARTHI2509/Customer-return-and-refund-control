import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Shield, ShieldAlert, KeyRound, Search, Filter, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionMessage, setActionMessage] = useState(null);

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
  const token = localStorage.getItem('sungrid_token');

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (userId, newStatus, role) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus, role })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchUsers();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to update user status.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Network failure updating user.' });
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchUsers();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to change role.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Network failure changing role.' });
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    if (filterRole !== 'ALL' && u.role !== filterRole) return false;
    if (filterStatus !== 'ALL' && u.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q));
    }
    return true;
  });

  const pendingCount = users.filter(u => u.status === 'PENDING').length;
  const approvedCount = users.filter(u => u.status === 'APPROVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="card" style={{ background: '#f8fafc', borderLeft: '4px solid #0284c7' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={22} color="#0284c7" />
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                Enterprise User Management & RBAC Administration
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Authorize pending operator registrations, delegate financial authorities, and enforce separation of duties.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#d97706' }}>{pendingCount}</div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Pending Review</div>
            </div>
            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0284c7' }}>{approvedCount}</div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Active Accounts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: actionMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${actionMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: actionMessage.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>{actionMessage.text}</div>
          <button
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search by operator name, corporate email, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved / Active</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Role:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }}
            >
              <option value="ALL">All Roles</option>
              <option value="RETURNS_ANALYST">Returns Analyst</option>
              <option value="RETURNS_MANAGER">Returns Manager</option>
              <option value="FINANCE_APPROVER">Finance Approver</option>
              <option value="ADMIN">System Administrator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 18px' }}>Operator</th>
              <th style={{ padding: '12px 18px' }}>Department & Designation</th>
              <th style={{ padding: '12px 18px' }}>Assigned Role</th>
              <th style={{ padding: '12px 18px' }}>Account Status</th>
              <th style={{ padding: '12px 18px' }}>Registered On</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Admin Governance Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  Loading operators directory from Neon PostgreSQL...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  No operator accounts matching search criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => {
                const isPending = user.status === 'PENDING';
                const isCurrent = user.id === currentUser?.id;

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isPending ? '#fffbeb' : '#fff' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{user.name} {isCurrent && <span style={{ fontSize: '10px', color: '#0284c7' }}>(You)</span>}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
                      {user.employeeId && <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {user.employeeId}</div>}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div>{user.department || 'General Operations'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{user.designation || 'Operator'}</div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <select
                        value={user.role}
                        disabled={isCurrent}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: user.role === 'ADMIN' ? '#eff6ff' : user.role === 'FINANCE_APPROVER' ? '#f5f3ff' : '#fff'
                        }}
                      >
                        <option value="RETURNS_ANALYST">Returns Analyst</option>
                        <option value="RETURNS_MANAGER">Returns Manager</option>
                        <option value="FINANCE_APPROVER">Finance Approver</option>
                        <option value="ADMIN">System Administrator</option>
                      </select>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span className={`badge ${user.status === 'APPROVED' ? 'badge-normal' : user.status === 'PENDING' ? 'badge-attention' : 'badge-critical'}`}>
                        {user.status}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', fontSize: '12px', color: '#64748b' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(user.id, 'APPROVED')}
                              className="btn btn-sm btn-primary"
                              style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                              title="Approve registration and grant operational access"
                            >
                              <UserCheck size={13} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(user.id, 'REJECTED')}
                              className="btn btn-sm btn-secondary"
                              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                              title="Reject registration"
                            >
                              <UserX size={13} />
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            {user.status === 'APPROVED' ? (
                              <button
                                disabled={isCurrent}
                                onClick={() => handleUpdateStatus(user.id, 'SUSPENDED')}
                                className="btn btn-sm btn-secondary"
                                style={{ fontSize: '11px', color: '#d97706' }}
                                title="Deactivate / Suspend account"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(user.id, 'APPROVED')}
                                className="btn btn-sm btn-secondary"
                                style={{ fontSize: '11px', color: '#059669' }}
                                title="Reactivate account"
                              >
                                Activate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

