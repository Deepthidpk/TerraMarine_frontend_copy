import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, Activity, ShieldCheck, Megaphone, BarChart3, 
  Users, Check, X, FileText, PlusCircle, Search, RefreshCw, 
  CheckCircle, AlertCircle, ShieldAlert, Award, Database, Server,
  Sliders, Lock, HardDriveDownload, LifeBuoy, Download, Cpu, Key
} from 'lucide-react';

const UserApproval = () => {
  const { user, authFetch } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  // System Admin Active Tab state
  const [activeAdminTab, setActiveAdminTab] = useState(urlTab || 'organizations'); 

  useEffect(() => {
    if (urlTab && urlTab !== activeAdminTab) {
      setActiveAdminTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tabKey) => {
    setActiveAdminTab(tabKey);
    setSearchParams({ tab: tabKey });
  };
  // 'organizations' | 'org_admins' | 'settings' | 'security' | 'health' | 'announcements' | 'audit' | 'backup' | 'reports' | 'support'

  // Admin Feature Data States
  const [organizations, setOrganizations] = useState([]);
  const [orgAdmins, setOrgAdmins] = useState([]);
  const [settings, setSettings] = useState({});
  const [systemHealth, setSystemHealth] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [subscriptionReports, setSubscriptionReports] = useState(null);
  const [supportTickets, setSupportTickets] = useState([]);

  // Authority (District User Management) States
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeAuthorityTab, setActiveAuthorityTab] = useState('pending');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State: Onboard Organization (Admin)
  const [orgForm, setOrgForm] = useState({
    full_name: 'City Municipal Administrator',
    email: '',
    phone: '',
    password: '',
    organization_name: '',
    district: 'Kochi',
    state: 'Kerala'
  });
  const [orgFormLoading, setOrgFormLoading] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);

  // Form State: Platform Settings (Admin)
  const [settingsForm, setSettingsForm] = useState({
    maintenance_mode: 'false',
    max_file_upload_mb: '25',
    session_timeout_minutes: '60',
    password_min_length: '8',
    max_login_attempts: '5',
    jwt_expiry_hours: '24',
    google_oauth_enabled: 'true'
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Form State: System Announcement (Admin)
  const [announceForm, setAnnounceForm] = useState({
    title: '',
    message: '',
    severity: 'Info',
    target_role: 'All'
  });

  // Ticket Resolution Modal State
  const [activeTicket, setActiveTicket] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Data Fetchers
  const fetchOrganizations = async () => {
    try {
      const res = await authFetch('/admin/organizations');
      if (res.ok) { const data = await res.json(); setOrganizations(data.organizations); }
    } catch (err) { console.error('Error fetching orgs:', err); }
  };

  const fetchOrgAdmins = async () => {
    try {
      const res = await authFetch('/admin/org-admins');
      if (res.ok) { const data = await res.json(); setOrgAdmins(data.admins); }
    } catch (err) { console.error('Error fetching org admins:', err); }
  };

  const fetchSettings = async () => {
    try {
      const res = await authFetch('/admin/settings');
      if (res.ok) { 
        const data = await res.json(); 
        setSettings(data.settings); 
        setSettingsForm(prev => ({ ...prev, ...data.settings }));
      }
    } catch (err) { console.error('Error fetching settings:', err); }
  };

  const fetchSystemHealth = async () => {
    try {
      const res = await authFetch('/admin/system-health');
      if (res.ok) { const data = await res.json(); setSystemHealth(data.health); }
    } catch (err) { console.error('Error fetching health:', err); }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await authFetch('/admin/announcements');
      if (res.ok) { const data = await res.json(); setAnnouncements(data.announcements); }
    } catch (err) { console.error('Error fetching announcements:', err); }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await authFetch('/admin/system-logs');
      if (res.ok) { const data = await res.json(); setAuditLogs(data.logs); }
    } catch (err) { console.error('Error fetching audit logs:', err); }
  };

  const fetchBackups = async () => {
    try {
      const res = await authFetch('/admin/backup/history');
      if (res.ok) { const data = await res.json(); setBackups(data.backups); }
    } catch (err) { console.error('Error fetching backups:', err); }
  };

  const fetchSubscriptionReports = async () => {
    try {
      const res = await authFetch('/admin/subscription-reports');
      if (res.ok) { const data = await res.json(); setSubscriptionReports(data); }
    } catch (err) { console.error('Error fetching reports:', err); }
  };

  const fetchSupportTickets = async () => {
    try {
      const res = await authFetch('/admin/support-tickets');
      if (res.ok) { const data = await res.json(); setSupportTickets(data.tickets); }
    } catch (err) { console.error('Error fetching support tickets:', err); }
  };

  // Authority Fetchers
  const fetchDistrictPendingUsers = async () => {
    try {
      const res = await authFetch('/authority/users?status=Pending');
      if (res.ok) { const data = await res.json(); setPendingUsers(data.users); }
    } catch (err) { console.error('Error fetching pending users:', err); }
  };

  const fetchAllDistrictUsers = async () => {
    try {
      const res = await authFetch('/authority/users');
      if (res.ok) { const data = await res.json(); setAllUsers(data.users); }
    } catch (err) { console.error('Error fetching all users:', err); }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isAdmin) {
        await Promise.all([
          fetchOrganizations(),
          fetchOrgAdmins(),
          fetchSettings(),
          fetchSystemHealth(),
          fetchAnnouncements(),
          fetchAuditLogs(),
          fetchBackups(),
          fetchSubscriptionReports(),
          fetchSupportTickets()
        ]);
      } else {
        await Promise.all([fetchDistrictPendingUsers(), fetchAllDistrictUsers()]);
      }
    } catch (err) {
      setError('Failed to load control center data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  // Handlers
  const handleOnboardOrg = async (e) => {
    e.preventDefault();
    setOrgFormLoading(true);
    setError(''); setSuccess('');
    try {
      const res = await authFetch('/admin/organizations', {
        method: 'POST',
        body: JSON.stringify(orgForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to onboard organization.');
      
      setSuccess(`Organization "${data.organization.organization_name}" onboarded successfully!`);
      setShowOrgModal(false);
      setOrgForm({
        full_name: 'City Municipal Administrator', email: '', phone: '',
        password: '', organization_name: '', district: 'Kochi', state: 'Kerala'
      });
      await fetchOrganizations();
      await fetchOrgAdmins();
      await fetchSystemHealth();
    } catch (err) { setError(err.message); } finally { setOrgFormLoading(false); }
  };

  const handleUpdateSubscription = async (orgId, licenseStatus) => {
    setError(''); setSuccess('');
    try {
      const res = await authFetch(`/admin/organizations/${orgId}/subscription`, {
        method: 'PUT',
        body: JSON.stringify({ license_status: licenseStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update organization status.');
      setSuccess(data.message);
      await fetchOrganizations();
    } catch (err) { setError(err.message); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setError(''); setSuccess('');
    try {
      const res = await authFetch('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: settingsForm })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings.');
      setSuccess('Platform settings and security policies saved successfully!');
      await fetchSettings();
    } catch (err) { setError(err.message); } finally { setSettingsLoading(false); }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await authFetch('/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(announceForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish announcement.');
      setSuccess('Maintenance announcement broadcasted successfully!');
      setAnnounceForm({ title: '', message: '', severity: 'Info', target_role: 'All' });
      await fetchAnnouncements();
    } catch (err) { setError(err.message); }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      const res = await authFetch(`/admin/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) { setSuccess('Announcement deleted.'); await fetchAnnouncements(); }
    } catch (err) { setError('Failed to delete announcement.'); }
  };

  const handleTriggerBackup = async () => {
    setError(''); setSuccess('');
    try {
      const res = await authFetch('/admin/backup/trigger', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Backup failed.');
      setSuccess(`Database disaster recovery snapshot created: ${data.backup.filename}`);
      await fetchBackups();
      await fetchSystemHealth();
    } catch (err) { setError(err.message); }
  };

  const handleUpdateTicket = async (ticketId, status) => {
    setError(''); setSuccess('');
    try {
      const res = await authFetch(`/admin/support-tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, resolution_notes: resolutionNotes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update ticket.');
      setSuccess('Support ticket updated successfully!');
      setActiveTicket(null);
      setResolutionNotes('');
      await fetchSupportTickets();
      await fetchSystemHealth();
    } catch (err) { setError(err.message); }
  };

  const handleExportSubscriptionCSV = () => {
    if (organizations.length === 0) return;
    const headers = ['Organization Name', 'Admin Contact', 'Email', 'District', 'State', 'License Status', 'Created At'];
    const csvRows = [headers.join(',')];
    organizations.forEach(o => {
      csvRows.push([
        `"${o.organization_name || 'Municipal Authority'}"`,
        `"${o.full_name}"`,
        `"${o.email}"`,
        `"${o.district}"`,
        `"${o.state}"`,
        `"${o.license_status}"`,
        `"${new Date(o.created_at).toLocaleDateString()}"`
      ].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `terramarine_organizations_${new Date().toISOString().slice(0, 10)}.csv`);
    a.click();
  };

  // Authority User Approval Handler
  const handleUpdateDistrictUserStatus = async (userId, newStatus) => {
    setError(''); setSuccess('');
    try {
      const res = await authFetch(`/authority/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user status.');
      setSuccess(data.message);
      await Promise.all([fetchDistrictPendingUsers(), fetchAllDistrictUsers()]);
    } catch (err) { setError(err.message); }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1350px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: isAdmin ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: '#ffffff',
        padding: '28px',
        borderRadius: '16px',
        marginBottom: '28px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isAdmin ? <Building2 size={32} color="#38bdf8" /> : <ShieldCheck size={32} color="#38bdf8" />}
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>
                {isAdmin ? 'TerraMarine System Administrator Control Center' : 'District Operational User Management'}
              </h1>
            </div>
            <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
              {isAdmin 
                ? 'Product Provider Control Panel — Full suite for client onboarding, security policies, backup recovery, and platform health.'
                : `Municipal Authority Workspace — Manage local volunteers, researchers, NGOs, and citizens within ${user?.district || 'your jurisdiction'}.`}
            </p>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleTriggerBackup}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <HardDriveDownload size={18} />
                Quick Backup Snapshot
              </button>

              <button
                onClick={() => setShowOrgModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                }}
              >
                <PlusCircle size={18} />
                Onboard Organization
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alert Notifications */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SYSTEM ADMIN VIEW — 12 FUNCTIONALITY SUITE */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div>

          {/* TAB 1: CLIENT ORGANIZATIONS (Functionality #1, #2, #5) */}
          {activeAdminTab === 'organizations' && (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a', fontWeight: '700' }}>Municipal Authorities & Client Organizations</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Functionalities #1, #2, #5 — Onboard, License Keys & Account Statuses</span>
                </div>
                <button onClick={handleExportSubscriptionCSV} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> Export CSV
                </button>
              </div>

              {organizations.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <Building2 size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p>No Municipal Authorities found. Click "Onboard Organization" to register a client organization.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '14px 18px' }}>Organization Name</th>
                        <th style={{ padding: '14px 18px' }}>Admin Account</th>
                        <th style={{ padding: '14px 18px' }}>Jurisdiction</th>
                        <th style={{ padding: '14px 18px' }}>License Status</th>
                        <th style={{ padding: '14px 18px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizations.map((org) => (
                        <tr key={org.user_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '14px 18px', fontWeight: '600', color: '#0f172a' }}>
                            {org.organization_name || 'Municipal Authority'}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div>{org.full_name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{org.email}</div>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#334155' }}>
                            {org.district}, {org.state}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
                              background: org.license_status === 'Active' ? '#dcfce7' : '#fee2e2',
                              color: org.license_status === 'Active' ? '#166534' : '#991b1b'
                            }}>
                              {org.license_status || 'Active'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleUpdateSubscription(org.user_id, org.license_status === 'Active' ? 'Suspended' : 'Active')}
                                style={{
                                  padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                                  background: org.license_status === 'Active' ? '#fef2f2' : '#f0fdf4',
                                  color: org.license_status === 'Active' ? '#991b1b' : '#166534'
                                }}
                              >
                                {org.license_status === 'Active' ? 'Suspend' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ORGANIZATION ADMINISTRATORS (Functionality #4) */}
          {activeAdminTab === 'org_admins' && (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>Organization-Level Administrators</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Functionality #4 — Manage administrative accounts assigned to client Municipal Authorities.</p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px' }}>Admin Name</th>
                      <th style={{ padding: '12px' }}>Email Address</th>
                      <th style={{ padding: '12px' }}>Organization</th>
                      <th style={{ padding: '12px' }}>District</th>
                      <th style={{ padding: '12px' }}>Account Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgAdmins.map(admin => (
                      <tr key={admin.user_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a' }}>{admin.full_name}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{admin.email}</td>
                        <td style={{ padding: '12px', fontWeight: '500' }}>{admin.organization_name || 'Municipal Authority'}</td>
                        <td style={{ padding: '12px' }}>{admin.district}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: '600' }}>
                            {admin.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PLATFORM SETTINGS & CONFIGURATION (Functionality #3) */}
          {activeAdminTab === 'settings' && (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ marginTop: 0, color: '#0f172a' }}>Global Platform Settings & Controls</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>Functionality #3 — Configure system-wide maintenance mode, upload bounds, and session timeouts.</p>

              <form onSubmit={handleSaveSettings} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>System Maintenance Mode</label>
                  <select
                    value={settingsForm.maintenance_mode}
                    onChange={(e) => setSettingsForm({ ...settingsForm, maintenance_mode: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="false">Disabled (Normal Operations)</option>
                    <option value="true">Enabled (Restricts Non-Admin Access)</option>
                  </select>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>When enabled, non-admin users will see a scheduled maintenance notice.</p>
                </div>

                <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Max Upload Size (MB)</label>
                  <input
                    type="number"
                    value={settingsForm.max_file_upload_mb}
                    onChange={(e) => setSettingsForm({ ...settingsForm, max_file_upload_mb: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Maximum file upload size for pollution evidence photos.</p>
                </div>

                <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Session Timeout (Minutes)</label>
                  <input
                    type="number"
                    value={settingsForm.session_timeout_minutes}
                    onChange={(e) => setSettingsForm({ ...settingsForm, session_timeout_minutes: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Automatic logout duration on inactivity.</p>
                </div>

                <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Google OAuth SSO Authentication</label>
                  <select
                    value={settingsForm.google_oauth_enabled}
                    onChange={(e) => setSettingsForm({ ...settingsForm, google_oauth_enabled: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="true">Enabled (Allow One-Click Google Login)</option>
                    <option value="false">Disabled (Password-Only Authentication)</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    style={{ background: '#0284c7', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {settingsLoading ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SECURITY & AUTHENTICATION POLICIES (Functionality #7) */}
          {activeAdminTab === 'security' && (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ marginTop: 0, color: '#0f172a' }}>Security, Authentication & Access Policies</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>Functionality #7 — Manage security rules, JWT validity, and login attempt thresholds.</p>

              <form onSubmit={handleSaveSettings} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Minimum Password Length</label>
                  <input
                    type="number"
                    value={settingsForm.password_min_length}
                    onChange={(e) => setSettingsForm({ ...settingsForm, password_min_length: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Max Failed Login Attempts</label>
                  <input
                    type="number"
                    value={settingsForm.max_login_attempts}
                    onChange={(e) => setSettingsForm({ ...settingsForm, max_login_attempts: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>JWT Token Expiry (Hours)</label>
                  <input
                    type="number"
                    value={settingsForm.jwt_expiry_hours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, jwt_expiry_hours: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <button type="submit" disabled={settingsLoading} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                    {settingsLoading ? 'Saving...' : 'Update Security Policies'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: PLATFORM HEALTH & PERFORMANCE (Functionality #6) */}
          {activeAdminTab === 'health' && systemHealth && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}><Database color="#0284c7" /><h4 style={{ margin: 0 }}>Database Status</h4></div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#166534' }}>{systemHealth.databaseConnection}</div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Latency: {systemHealth.apiLatencyMs} ms</p>
                </div>

                <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}><Server color="#0284c7" /><h4 style={{ margin: 0 }}>Server Engine</h4></div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>Uptime: {Math.floor(systemHealth.uptimeSeconds / 60)} mins</div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Memory Heap: {systemHealth.memoryUsageMB} MB</p>
                </div>

                <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}><Cpu color="#0284c7" /><h4 style={{ margin: 0 }}>CPU Load Estimate</h4></div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0284c7' }}>{systemHealth.cpuLoadEstimate}</div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>System load normal</p>
                </div>

                <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}><LifeBuoy color="#0284c7" /><h4 style={{ margin: 0 }}>Open Helpdesk Tickets</h4></div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: systemHealth.openSupportTickets > 0 ? '#b45309' : '#166534' }}>{systemHealth.openSupportTickets} Pending</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MAINTENANCE & BROADCAST NOTICES (Functionality #8) */}
          {activeAdminTab === 'announcements' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, color: '#0f172a' }}>Publish Platform Update Notice</h3>
                <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Notice Title</label>
                    <input type="text" required value={announceForm.title} onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })} placeholder="e.g. Scheduled Maintenance Notice" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Message Details</label>
                    <textarea required rows={4} value={announceForm.message} onChange={(e) => setAnnounceForm({ ...announceForm, message: e.target.value })} placeholder="Enter update details..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Severity</label>
                      <select value={announceForm.severity} onChange={(e) => setAnnounceForm({ ...announceForm, severity: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        <option value="Info">Info</option>
                        <option value="Warning">Warning</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Target Audience</label>
                      <select value={announceForm.target_role} onChange={(e) => setAnnounceForm({ ...announceForm, target_role: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        <option value="All">All Client Organizations</option>
                        <option value="Authority">Municipal Authorities Only</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" style={{ background: '#0284c7', color: 'white', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                    Publish Announcement Broadcast
                  </button>
                </form>
              </div>

              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, color: '#0f172a' }}>Active System Announcements</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {announcements.map((a) => (
                    <div key={a.announcement_id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <h4 style={{ margin: 0, color: '#0f172a' }}>{a.title}</h4>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', fontWeight: '600' }}>{a.severity}</span>
                          <button onClick={() => handleDeleteAnnouncement(a.announcement_id)} style={{ border: 'none', background: 'none', color: '#991b1b', cursor: 'pointer' }}><X size={16} /></button>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>{a.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY AUDIT LOGS (Functionality #9) */}
          {activeAdminTab === 'audit' && (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ marginTop: 0, color: '#0f172a' }}>Security Audit Trails & Action Logs</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>Functionality #9 — Complete audit log of administrative and system security events.</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Timestamp</th>
                      <th style={{ padding: '12px' }}>User Email</th>
                      <th style={{ padding: '12px' }}>Action</th>
                      <th style={{ padding: '12px' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.log_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', color: '#64748b' }}>{new Date(log.created_at).toLocaleString()}</td>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{log.user_email}</td>
                        <td style={{ padding: '12px' }}><span style={{ padding: '3px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontWeight: '600' }}>{log.action}</span></td>
                        <td style={{ padding: '12px', color: '#334155' }}>{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: DATABASE BACKUP & DISASTER RECOVERY (Functionality #10) */}
          {activeAdminTab === 'backup' && (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>Database Backup & Disaster Recovery Snapshots</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Functionality #10 — Create recovery snapshots and review backup health.</p>
                </div>
                <button onClick={handleTriggerBackup} style={{ background: '#166534', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HardDriveDownload size={16} /> Create Backup Snapshot
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px' }}>Snapshot Filename</th>
                      <th style={{ padding: '12px' }}>File Size</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px' }}>Created Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((b) => (
                      <tr key={b.backup_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a' }}>{b.filename}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{b.size_mb} MB</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: '600' }}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{new Date(b.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: USAGE & PLATFORM REPORTS (Functionality #11) */}
          {activeAdminTab === 'reports' && subscriptionReports && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#0f172a' }}>Platform Usage Reports</h3>
                <button onClick={handleExportSubscriptionCSV} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={16} /> Export Reports CSV
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ marginTop: 0, color: '#0f172a' }}>User Role Distribution</h4>
                  {subscriptionReports.roleBreakdown.map((role) => (
                    <div key={role.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span>{role.name}</span>
                      <span style={{ fontWeight: '700' }}>{role.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: TECHNICAL SUPPORT HELPDESK (Functionality #12) */}
          {activeAdminTab === 'support' && (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ marginTop: 0, color: '#0f172a' }}>Technical Support Helpdesk</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>Functionality #12 — Technical support tickets submitted by subscribing Municipal Authorities.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {supportTickets.map((t) => (
                  <div key={t.ticket_id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, color: '#0f172a' }}>{t.subject}</h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: t.status === 'Resolved' ? '#dcfce7' : '#fef3c7', color: t.status === 'Resolved' ? '#166534' : '#b45309' }}>
                          {t.status}
                        </span>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: '#e0f2fe', color: '#0369a1' }}>
                          {t.priority} Priority
                        </span>
                      </div>
                    </div>
                    <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', color: '#64748b' }}>From: <strong>{t.org_name}</strong> ({t.contact_email})</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>{t.description}</p>

                    {t.resolution_notes && (
                      <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.85rem', color: '#166534' }}>
                        <strong>Resolution Notes:</strong> {t.resolution_notes}
                      </div>
                    )}

                    <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                      {t.status !== 'Resolved' && (
                        <button
                          onClick={() => { setActiveTicket(t); setResolutionNotes(t.resolution_notes || ''); }}
                          style={{ background: '#0284c7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Resolve Ticket
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ticket Resolution Modal */}
      {activeTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '100%' }}>
            <h3 style={{ marginTop: 0 }}>Resolve Support Ticket</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{activeTicket.subject} ({activeTicket.org_name})</p>
            <textarea
              rows={4}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Enter resolution notes or troubleshooting instructions..."
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setActiveTicket(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleUpdateTicket(activeTicket.ticket_id, 'Resolved')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#166534', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Onboard Municipal Authority (Admin Only) */}
      {showOrgModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '28px', maxWidth: '550px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Onboard Municipal Authority / Client Organization</h3>
            <form onSubmit={handleOnboardOrg} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Organization Name</label>
                <input type="text" required value={orgForm.organization_name} onChange={(e) => setOrgForm({ ...orgForm, organization_name: e.target.value })} placeholder="e.g. Kochi Municipal Corporation" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Admin Contact Name</label>
                  <input type="text" required value={orgForm.full_name} onChange={(e) => setOrgForm({ ...orgForm, full_name: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Admin Email</label>
                  <input type="email" required value={orgForm.email} onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} placeholder="authority@kochi.gov.in" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Password</label>
                <input type="password" required value={orgForm.password} onChange={(e) => setOrgForm({ ...orgForm, password: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>District</label>
                  <input type="text" required value={orgForm.district} onChange={(e) => setOrgForm({ ...orgForm, district: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>State</label>
                  <input type="text" required value={orgForm.state} onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowOrgModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={orgFormLoading} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0284c7', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                  {orgFormLoading ? 'Onboarding...' : 'Confirm Onboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserApproval;
