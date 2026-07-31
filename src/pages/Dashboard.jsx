import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LeafletMap from '../components/LeafletMap';
import UserApproval from './UserApproval';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  AlertOctagon, Calendar, Users, Award, ShieldAlert, CheckCircle, Bell, BellOff,
  AlertTriangle, Camera, MapPin, Clipboard, Search, HeartHandshake, ArrowRight,
  Info, Check, Map, Compass, Trash2, Clock, CheckCircle2, ChevronRight
} from 'lucide-react';

const COLORS = ['#00bbf9', '#00f5d4', '#d946ef', '#f59e0b', '#ef4444', '#10b981'];

const Dashboard = () => {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Citizen Dashboard specific states
  const [selectedReportForProgress, setSelectedReportForProgress] = useState(null);
  const [activeReportDetails, setActiveReportDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Hover states for action buttons (inline hover effects)
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsRes = await authFetch('/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch reports
      const reportsRes = await authFetch('/reports');
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports);
      }

      // Fetch campaigns
      const campaignsRes = await authFetch('/campaigns');
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData.campaigns);
      }

      // Fetch weather alerts
      const alertsRes = await authFetch('/alerts');
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts);
      }

      // Fetch notifications
      const notifRes = await authFetch('/notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications);
      }

    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDismissNotification = async (notifId) => {
    try {
      const res = await authFetch(`/notifications/${notifId}`, { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.notification_id !== notifId));
      }
    } catch (err) {
      console.error('Dismiss notification error:', err);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      const res = await authFetch('/notifications', { method: 'PUT' });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Clear notifications error:', err);
    }
  };

  const handleJoinCampaign = async (campaignId) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await authFetch(`/campaigns/${campaignId}/join`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not join campaign.');
      }
      setSuccessMessage('Successfully registered for the cleanup campaign!');
      setTimeout(() => setSuccessMessage(''), 4000);
      fetchDashboardData();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to join campaign.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleOpenDetails = async (reportId) => {
    try {
      const res = await authFetch(`/reports/${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveReportDetails(data);
        setShowDetailsModal(true);
        // Select it for timeline progress display
        setSelectedReportForProgress(data.report);
      }
    } catch (err) {
      console.error('Error fetching report details:', err);
    }
  };

  if (loading) {
    return <div style={{ color: '#171c42', fontSize: '1.2rem', padding: '40px', fontWeight: 600 }}>Loading dashboard analytics...</div>;
  }

  // System Administrator Control Center (12 Functionality Suite)
  if (user?.role === 'Admin') {
    return <UserApproval />;
  }

  // Branch here: If not Citizen, Fisherman, or Volunteer, display the original general dashboard
  if (user.role !== 'Citizen' && user.role !== 'Fisherman' && user.role !== 'Volunteer') {
    const summary = stats?.summary || {
      totalReports: 0,
      verifiedReports: 0,
      completedReports: 0,
      activeCampaigns: 0,
      registeredVolunteers: 0
    };

    return (
      <div>
        {/* Header welcome banner */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
            Welcome back, <span style={{ color: 'var(--accent-primary)' }}>{user.full_name}</span>!
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Here is your personalized summary of coastal monitoring activities in <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{user.district || 'Kochi'}</span> district.
          </p>
        </div>

        {/* Weather alerts notification box */}
        {alerts.length > 0 && (
          <div className="glass-panel" style={{ 
            background: 'rgba(239, 68, 68, 0.08)', 
            borderColor: 'rgba(239, 68, 68, 0.3)', 
            marginBottom: '30px', 
            display: 'flex', 
            gap: '16px', 
            alignItems: 'center' 
          }}>
            <ShieldAlert size={36} color="var(--danger)" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ color: 'var(--danger)', marginBottom: '4px', fontSize: '1.1rem' }}>
                ACTIVE COASTAL WARNING: {alerts[0].title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#b91c1c' }}>
                {alerts[0].description} (Radius: {alerts[0].radius_km} km around {alerts[0].latitude}, {alerts[0].longitude})
              </p>
            </div>
          </div>
        )}

        {/* Grid of stats summary */}
        <div className="dashboard-grid">
          <div className="glass-panel stat-card">
            <div className="stat-icon" style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}>
              <AlertOctagon size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Complaints</span>
              <div className="stat-number">{summary.totalReports - summary.completedReports}</div>
            </div>
          </div>

          <div className="glass-panel stat-card">
            <div className="stat-icon" style={{ color: 'var(--accent-secondary)', background: 'rgba(0, 187, 249, 0.1)' }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Completed Cleanups</span>
              <div className="stat-number">{summary.completedReports}</div>
            </div>
          </div>

          <div className="glass-panel stat-card">
            <div className="stat-icon" style={{ color: 'var(--accent-primary)', background: 'rgba(0, 245, 212, 0.1)' }}>
              <Calendar size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Campaigns</span>
              <div className="stat-number">{summary.activeCampaigns}</div>
            </div>
          </div>

          <div className="glass-panel stat-card">
            <div className="stat-icon" style={{ color: '#d946ef', background: 'rgba(217, 70, 239, 0.1)' }}>
              <Users size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Registered Volunteers</span>
              <div className="stat-number">{summary.registeredVolunteers}</div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>GIS Incident Hotspots & Campaigns</h2>
          <div className="map-container">
            <LeafletMap reports={reports} campaigns={campaigns} />
          </div>
        </div>

        {/* Grid splits for Charts and Notifications */}
        <div className="grid-2col">
          {/* Charts Panel */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
              Pollution Metrics & Trends
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', minHeight: '260px' }}>
              {/* Waste type pie chart */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>
                  Waste Types Distribution
                </h4>
                <div style={{ width: '100%', height: '180px' }}>
                  {stats?.wasteTypes?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.wasteTypes}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.wasteTypes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
                      No report data
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', fontSize: '0.7rem', marginTop: '10px' }}>
                  {stats?.wasteTypes?.map((item, idx) => (
                    <span key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }}></span>
                      {item.name} ({item.value})
                    </span>
                  ))}
                </div>
              </div>

              {/* Severity bar chart */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>
                  Reports Severity Level
                </h4>
                <div style={{ width: '100%', height: '180px' }}>
                  {stats?.severity?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.severity}>
                        <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} width={20} />
                        <Tooltip cursor={{ fill: 'rgba(15, 23, 42, 0.03)' }} />
                        <Bar dataKey="value" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
                      No severity stats
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notifications list */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid var(--card-border)', 
              paddingBottom: '12px',
              marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={20} color="var(--accent-primary)" />
                Notifications
              </h3>
              {notifications.length > 0 && (
                <button 
                  onClick={handleClearAllNotifications} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Clear all
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-secondary)', gap: '8px' }}>
                  <BellOff size={32} opacity={0.5} />
                  <span style={{ fontSize: '0.85rem' }}>No new notifications</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.notification_id} 
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: notif.is_read ? 'rgba(15, 23, 42, 0.015)' : 'rgba(15, 23, 42, 0.04)',
                      border: '1px solid rgba(15, 23, 42, 0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{notif.title}</h5>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', wordBreak: 'break-word' }}>
                        {notif.message}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '6px', display: 'block' }}>
                        {new Date(notif.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDismissNotification(notif.notification_id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      &times;
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- REDESIGNED CITIZEN DASHBOARD ---

  const myReports = reports.filter(r => r.reported_by === user.user_id);
  const userDistrict = user.district || 'Ernakulam';

  // Calculate or retrieve citizen statistics
  const userStatsObj = stats?.userStats || {
    activeReports: myReports.filter(r => r.status !== 'Completed').length,
    resolvedReports: myReports.filter(r => r.status === 'Completed').length,
    nearbyReports: reports.filter(r => (r.location_name || '').toLowerCase().includes(userDistrict.toLowerCase())).length,
    campaignsJoined: 0,
    joinedCampaignIds: []
  };

  const activeReportsCount = userStatsObj.activeReports;
  const resolvedReportsCount = userStatsObj.resolvedReports;
  const nearbyReportsCount = userStatsObj.nearbyReports;
  const campaignsJoinedCount = userStatsObj.campaignsJoined;
  const joinedCampaignIds = userStatsObj.joinedCampaignIds || [];

  // Filter lists
  const activeCampaigns = campaigns.filter(c => c.status === 'Upcoming' || c.status === 'Ongoing');
  const nearbyReportsList = reports.filter(r => (r.location_name || '').toLowerCase().includes(userDistrict.toLowerCase()));
  const highRiskReportsList = reports.filter(r => r.severity === 'High');

  // Determine current complaint progress report
  const currentProgressReport = selectedReportForProgress || (myReports.length > 0 ? myReports[0] : null);

  const getReportStepIndex = (status) => {
    if (status === 'Completed') return 4;
    if (status === 'Verified') return 3; // Assigned maps here
    return 1; // Submitted maps here
  };

  const currentStepIndex = currentProgressReport ? getReportStepIndex(currentProgressReport.status) : 0;

  const getStatusBadge = (status, severity) => {
    if (severity === 'High') {
      return { text: 'High Priority', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)' };
    }
    if (status === 'Completed') {
      return { text: 'Resolved', color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)' };
    }
    if (status === 'Verified') {
      return { text: 'Active', color: '#F97316', bg: 'rgba(249, 115, 22, 0.08)' };
    }
    return { text: 'Pending', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.08)' };
  };

  // Card hover shadow utility
  const cardStyle = (id) => ({
    background: '#ffffff',
    borderRadius: '20px',
    border: '1px solid rgba(23, 28, 66, 0.08)',
    boxShadow: hoveredCard === id 
      ? '0 12px 30px rgba(23, 28, 66, 0.08)' 
      : '0 4px 20px rgba(23, 28, 66, 0.03)',
    padding: '24px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden'
  });

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '24px 0' }}>
      
      {/* Toast notifications */}
      {successMessage && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 1100,
          background: '#10B981', color: 'white', padding: '16px 24px',
          borderRadius: '12px', boxShadow: '0 10px 25px rgba(16,185,129,0.3)',
          fontWeight: '600', animation: 'slideIn 0.3s ease-out'
        }}>
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 1100,
          background: '#EF4444', color: 'white', padding: '16px 24px',
          borderRadius: '12px', boxShadow: '0 10px 25px rgba(239,68,68,0.3)',
          fontWeight: '600', animation: 'slideIn 0.3s ease-out'
        }}>
          {errorMessage}
        </div>
      )}

      {/* 1. Welcome Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: '700', 
            letterSpacing: '-0.02em',
            lineHeight: '1.2',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #171c42 0%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            Welcome back, {user.full_name}!
          </h1>
          <p style={{ 
            fontSize: '15px', 
            color: '#64748B', 
            lineHeight: '1.6' 
          }}>
            {user.role === 'Volunteer' 
              ? 'Coordinate cleanup tasks, track coastal pollution reports, and participate in keeping our coastline clean.' 
              : 'Monitor coastal pollution, track your reports, and participate in keeping our coastline clean.'}
          </p>
        </div>
      </div>

      {/* Active Warnings if exist */}
      {alerts.length > 0 && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.04)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '32px', 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center' 
        }}>
          <ShieldAlert size={30} color="#EF4444" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ color: '#EF4444', marginBottom: '4px', fontSize: '16px', fontWeight: '600' }}>
              ACTIVE COASTAL WARNING: {alerts[0].title}
            </h3>
            <p style={{ fontSize: '14px', color: '#7F1D1D', lineHeight: '1.5' }}>
              {alerts[0].description} (Radius: {alerts[0].radius_km} km around {alerts[0].latitude}, {alerts[0].longitude})
            </p>
          </div>
        </div>
      )}

      {/* 2. Quick Statistics Cards */}
      <div className="dashboard-stats-grid">
        {/* Active Reports */}
        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#64748B' }}>Active Reports</span>
            <div style={{ color: '#171c42', padding: '8px', borderRadius: '12px', background: 'rgba(23, 28, 66, 0.04)' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#171c42' }}>
            {activeReportsCount}
          </div>
        </div>

        {/* Resolved Reports */}
        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#64748B' }}>Resolved Reports</span>
            <div style={{ color: '#171c42', padding: '8px', borderRadius: '12px', background: 'rgba(23, 28, 66, 0.04)' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#171c42' }}>
            {resolvedReportsCount}
          </div>
        </div>

        {/* Nearby Pollution Reports */}
        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#64748B' }}>Nearby Reports</span>
            <div style={{ color: '#171c42', padding: '8px', borderRadius: '12px', background: 'rgba(23, 28, 66, 0.04)' }}>
              <MapPin size={20} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#171c42' }}>
            {nearbyReportsCount}
          </div>
        </div>

        {/* Cleanup Campaigns Joined */}
        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#64748B' }}>Campaigns Joined</span>
            <div style={{ color: '#171c42', padding: '8px', borderRadius: '12px', background: 'rgba(23, 28, 66, 0.04)' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#171c42' }}>
            {campaignsJoinedCount}
          </div>
        </div>
      </div>

      {/* Tab Switcher Navigation */}
      <div className="dashboard-tabs-container">
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Compass size={18} />
            <span>Overview</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <Clipboard size={18} />
            <span>My Reports</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            <Calendar size={18} />
            <span>Cleanup Campaigns</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <Bell size={18} />
            <span>Updates & Warnings</span>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <>
          {/* Quick Actions */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              fontSize: '22px', 
              fontWeight: '600', 
              marginBottom: '20px', 
              color: '#171c42'
            }}>
              Quick Actions
            </h2>
            <div className="dashboard-actions-grid">
              {/* Card 1: Report Pollution */}
              <div className="premium-card">
                <div style={{ color: '#171c42', marginBottom: '16px' }}>
                  <Camera size={28} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#171c42', marginBottom: '8px' }}>Report Pollution</h3>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', marginBottom: '20px', minHeight: '42px' }}>
                  File a new coastal pollution complaint with GPS coordinates and images.
                </p>
                <button 
                  onClick={() => navigate('/reports')}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #171c42 0%, #0ea5e9 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>Report Now</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Card 2: View Nearby Reports */}
              <div className="premium-card">
                <div style={{ color: '#171c42', marginBottom: '16px' }}>
                  <MapPin size={28} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#171c42', marginBottom: '8px' }}>View Nearby Reports</h3>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', marginBottom: '20px', minHeight: '42px' }}>
                  Explore active pollution reports submitted around your current district.
                </p>
                <button 
                  onClick={() => {
                    const el = document.getElementById('nearby-map');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #171c42 0%, #0ea5e9 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>View Map</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Card 3: Track Complaint Status */}
              <div className="premium-card">
                <div style={{ color: '#171c42', marginBottom: '16px' }}>
                  <Clipboard size={28} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#171c42', marginBottom: '8px' }}>Track Complaint Status</h3>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', marginBottom: '20px', minHeight: '42px' }}>
                  Monitor progress and review administrative updates on your submissions.
                </p>
                <button 
                  onClick={() => setActiveTab('reports')}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #171c42 0%, #0ea5e9 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>Track Reports</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Card 4: Cleanup Campaigns */}
              <div className="premium-card">
                <div style={{ color: '#171c42', marginBottom: '16px' }}>
                  <Users size={28} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#171c42', marginBottom: '8px' }}>Cleanup Campaigns</h3>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', marginBottom: '20px', minHeight: '42px' }}>
                  Join environmental cleanup initiatives organized by active agencies.
                </p>
                <button 
                  onClick={() => setActiveTab('campaigns')}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #171c42 0%, #0ea5e9 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>Explore Campaigns</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Map Section */}
          <div id="nearby-map" style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', color: '#171c42' }}>
              Nearby Coastal Pollution Map
            </h2>
            <div className="dashboard-split-grid">
              {/* GIS Map */}
              <div style={{
                background: 'white',
                borderRadius: '20px',
                border: '1px solid rgba(23, 28, 66, 0.08)',
                boxShadow: '0 4px 20px rgba(23, 28, 66, 0.03)',
                overflow: 'hidden',
                height: '450px'
              }}>
                <LeafletMap reports={reports} campaigns={campaigns} />
              </div>

              {/* Location Summary Panel */}
              <div style={{
                background: 'white',
                borderRadius: '20px',
                border: '1px solid rgba(23, 28, 66, 0.08)',
                boxShadow: '0 4px 20px rgba(23, 28, 66, 0.03)',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#171c42', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Compass size={20} />
                    Location Summary
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                      <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '500', marginBottom: '4px' }}>CURRENT DISTRICT</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#171c42' }}>{userDistrict}</div>
                    </div>

                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', color: '#64748B', fontWeight: '500' }}>Nearby Reports</span>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#171c42' }}>{nearbyReportsList.length}</span>
                    </div>

                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', color: '#64748B', fontWeight: '500' }}>Active Campaigns</span>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#171c42' }}>{activeCampaigns.length}</span>
                    </div>

                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', paddingBottom: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', color: '#64748B', fontWeight: '500' }}>High-Risk Areas</span>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#EF4444' }}>{highRiskReportsList.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'reports' && (
        <div className="dashboard-split-grid" style={{ minHeight: '400px' }}>
          {/* Recent Reports Table Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: '1px solid rgba(23, 28, 66, 0.08)',
            boxShadow: '0 4px 20px rgba(23, 28, 66, 0.03)',
            padding: '28px',
            overflow: 'hidden'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#171c42', marginBottom: '24px' }}>
              My Recent Pollution Reports
            </h3>
            {myReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                <div style={{ fontSize: '15px', color: '#64748B', marginBottom: '16px', fontWeight: '500' }}>
                  You haven't submitted any pollution reports yet.
                </div>
                <button 
                  onClick={() => navigate('/reports')}
                  style={{
                    background: '#171c42', color: 'white', border: 'none',
                    padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  Report Pollution Now
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                      <th style={{ padding: '12px 16px', fontSize: '13px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' }}>Report ID</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' }}>Type</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' }}>Location</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myReports.map((rep) => {
                      const badge = getStatusBadge(rep.status, rep.severity);
                      const isSelected = currentProgressReport?.report_id === rep.report_id;
                      return (
                        <tr 
                          key={rep.report_id} 
                          onClick={() => setSelectedReportForProgress(rep)}
                          style={{ 
                            borderBottom: '1px solid #F8FAFC', 
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(23, 28, 66, 0.02)' : 'transparent',
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#171c42' }}>
                            #{rep.report_id.slice(0, 8)}
                          </td>
                          <td style={{ padding: '16px', fontSize: '15px', color: '#334155' }}>
                            {rep.waste_type || 'General Litter'}
                          </td>
                          <td style={{ padding: '16px', fontSize: '15px', color: '#334155' }}>
                            {rep.location_name || 'Coastal boundary'}
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#64748B' }}>
                            {new Date(rep.reported_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ 
                              display: 'inline-flex', padding: '4px 10px', borderRadius: '9999px',
                              fontSize: '13px', fontWeight: '600', color: badge.color, backgroundColor: badge.bg
                            }}>
                              {badge.text}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetails(rep.report_id);
                              }}
                              style={{ 
                                background: 'linear-gradient(135deg, #171c42 0%, #0ea5e9 100%)', color: '#ffffff', border: 'none',
                                padding: '6px 12px', borderRadius: '6px', fontSize: '13px',
                                cursor: 'pointer', fontWeight: '500', transition: 'opacity 0.2s ease'
                              }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Complaint Progress Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: '1px solid rgba(23, 28, 66, 0.08)',
            boxShadow: '0 4px 20px rgba(23, 28, 66, 0.03)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#171c42', marginBottom: '24px' }}>
              Complaint Progress
            </h3>
            
            {currentProgressReport ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '500' }}>TRACKING REPORT</span>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#171c42', marginTop: '2px' }}>
                    #{currentProgressReport.report_id.slice(0, 8)}: {currentProgressReport.title}
                  </div>
                </div>

                {/* Vertical Progress Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative', paddingLeft: '8px' }}>
                  
                  {/* Timeline vertical connector line */}
                  <div style={{ 
                    position: 'absolute', left: '11px', top: '12px', bottom: '12px', width: '2px', 
                    backgroundColor: '#E2E8F0', zIndex: 1 
                  }}></div>

                  {/* Step 1: Submitted */}
                  <div style={{ display: 'flex', gap: '16px', zIndex: 2, position: 'relative' }}>
                    <div style={{ 
                      width: '24px', height: '24px', borderRadius: '50%', 
                      background: currentStepIndex >= 1 ? '#171c42' : '#E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 'bold'
                    }}>
                      {currentStepIndex >= 1 ? <Check size={12} /> : '1'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: currentStepIndex >= 1 ? '600' : '400', color: currentStepIndex >= 1 ? '#171c42' : '#64748B' }}>Submitted</h4>
                    </div>
                  </div>

                  {/* Step 2: Under Review */}
                  <div style={{ display: 'flex', gap: '16px', zIndex: 2, position: 'relative', alignItems: 'center' }}>
                    <div style={{ 
                      width: '24px', height: '24px', borderRadius: '50%', 
                      background: currentStepIndex >= 2 ? '#171c42' : '#E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 'bold'
                    }}>
                      {currentStepIndex >= 2 ? <Check size={12} /> : '2'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: currentStepIndex >= 2 ? '600' : '400', color: currentStepIndex >= 2 ? '#171c42' : '#64748B' }}>Under Review</h4>
                    </div>
                  </div>

                  {/* Step 3: Assigned */}
                  <div style={{ display: 'flex', gap: '16px', zIndex: 2, position: 'relative', alignItems: 'center' }}>
                    <div style={{ 
                      width: '24px', height: '24px', borderRadius: '50%', 
                      background: currentStepIndex >= 3 ? '#171c42' : '#E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 'bold'
                    }}>
                      {currentStepIndex >= 3 ? <Check size={12} /> : '3'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: currentStepIndex >= 3 ? '600' : '400', color: currentStepIndex >= 3 ? '#171c42' : '#64748B' }}>Assigned</h4>
                    </div>
                  </div>

                  {/* Step 4: Resolved */}
                  <div style={{ display: 'flex', gap: '16px', zIndex: 2, position: 'relative', alignItems: 'center' }}>
                    <div style={{ 
                      width: '24px', height: '24px', borderRadius: '50%', 
                      background: currentStepIndex >= 4 ? '#171c42' : '#E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 'bold'
                    }}>
                      {currentStepIndex >= 4 ? <Check size={12} /> : '4'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: currentStepIndex >= 4 ? '600' : '400', color: currentStepIndex >= 4 ? '#171c42' : '#64748B' }}>Resolved</h4>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '15px', minHeight: '200px' }}>
                Select a report from the table to track its detailed resolution progress.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', color: '#171c42' }}>
            Upcoming Cleanup Campaigns
          </h2>
          
          {activeCampaigns.length === 0 ? (
            <div style={{ 
              background: 'white', borderRadius: '20px', border: '1px solid rgba(23, 28, 66, 0.08)',
              padding: '40px', textAlign: 'center', color: '#64748B' 
            }}>
              No upcoming coastal cleanup campaigns found. Check back later!
            </div>
          ) : (
            <div className="dashboard-campaigns-grid">
              {activeCampaigns.map((camp) => {
                const hasJoined = joinedCampaignIds.includes(camp.campaign_id);
                return (
                  <div 
                    key={camp.campaign_id} 
                    className="premium-card"
                    style={{
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    {/* Campaign Header */}
                    <div style={{ 
                      background: 'linear-gradient(135deg, #171c42 0%, #303770 100%)', 
                      height: '140px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      position: 'relative'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <Compass size={40} style={{ opacity: 0.8 }} />
                        <div style={{ fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '6px', fontWeight: '600' }}>Cleanup Drive</div>
                      </div>
                      {hasJoined && (
                        <span style={{
                          position: 'absolute', top: '16px', right: '16px',
                          background: '#10B981', color: 'white', padding: '4px 10px',
                          borderRadius: '9999px', fontSize: '13px', fontWeight: '700',
                          boxShadow: '0 4px 10px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                          <Check size={12} /> Registered
                        </span>
                      )}
                    </div>

                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#171c42', marginBottom: '8px' }}>
                          {camp.campaign_name}
                        </h3>
                        <p style={{ fontSize: '15px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <MapPin size={16} /> {camp.location}
                        </p>
                        <p style={{ fontSize: '15px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                          <Calendar size={16} /> {new Date(camp.campaign_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
                          <Users size={16} />
                          <span>{camp.volunteer_count} / {camp.maximum_volunteers || 'No Limit'} vols</span>
                        </div>

                        <button
                          onClick={() => !hasJoined && handleJoinCampaign(camp.campaign_id)}
                          disabled={hasJoined || camp.status === 'Completed'}
                          style={{
                            background: hasJoined ? 'rgba(16, 185, 129, 0.1)' : 'linear-gradient(135deg, #171c42 0%, #0ea5e9 100%)',
                            color: hasJoined ? '#10B981' : 'white',
                            border: hasJoined ? '1px solid rgba(16,185,129,0.2)' : 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: hasJoined ? 'default' : 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {hasJoined ? 'Registered' : 'Join'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', color: '#171c42' }}>
            Latest Updates & Notifications
          </h2>
          
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: '1px solid rgba(23, 28, 66, 0.08)',
            boxShadow: '0 4px 20px rgba(23, 28, 66, 0.03)',
            padding: '28px'
          }}>
            {notifications.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '12px' }}>
                <BellOff size={40} strokeWidth={1.5} style={{ opacity: 0.4, color: '#171c42' }} />
                <span style={{ fontSize: '15px', color: '#64748B', fontWeight: '500' }}>You're all caught up! No new notifications.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                {/* Clear All button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-8px' }}>
                  <button 
                    onClick={handleClearAllNotifications}
                    style={{
                      background: 'none', border: 'none', color: '#64748B', fontWeight: '600',
                      fontSize: '13px', cursor: 'pointer', textDecoration: 'underline'
                    }}
                  >
                    Clear all notifications
                  </button>
                </div>

                {/* Notification timeline layout */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  {/* Timeline vertical connector */}
                  <div style={{
                    position: 'absolute', left: '23px', top: '10px', bottom: '10px', width: '2px',
                    backgroundColor: '#F1F5F9', zIndex: 1
                  }}></div>

                  {notifications.map((notif) => (
                    <div 
                      key={notif.notification_id}
                      style={{
                        display: 'flex', gap: '16px', alignItems: 'flex-start', zIndex: 2, position: 'relative',
                        background: notif.is_read ? 'transparent' : 'rgba(23, 28, 66, 0.01)',
                        padding: '12px', borderRadius: '12px'
                      }}
                    >
                      {/* Timeline bullet */}
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: notif.is_read ? '#E2E8F0' : '#171c42',
                        border: '4px solid white', boxShadow: '0 0 0 1px rgba(23,28,66,0.08)',
                        marginTop: '4px', flexShrink: 0
                      }}></div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#171c42' }}>{notif.title}</h4>
                            <p style={{ fontSize: '15px', color: '#64748B', marginTop: '4px', lineHeight: '1.5' }}>{notif.message}</p>
                            <span style={{ fontSize: '13px', color: '#94A3B8', marginTop: '6px', display: 'block' }}>
                              {new Date(notif.created_at).toLocaleString()}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDismissNotification(notif.notification_id)}
                            style={{
                              background: 'none', border: 'none', color: '#94A3B8', fontSize: '20px',
                              cursor: 'pointer', lineHeight: '1', padding: '0 4px'
                            }}
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && activeReportDetails && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(23, 28, 66, 0.6)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            background: 'white', borderRadius: '24px', padding: '32px', position: 'relative',
            boxShadow: '0 20px 50px rgba(23, 28, 66, 0.15)'
          }}>
            <button 
              onClick={() => setShowDetailsModal(false)}
              style={{
                position: 'absolute', right: '24px', top: '24px', background: 'none',
                border: 'none', color: '#171c42', fontSize: '28px', cursor: 'pointer'
              }}
            >
              &times;
            </button>

            <h2 style={{ fontSize: '28px', fontWeight: '600', color: '#171c42', marginBottom: '8px' }}>
              {activeReportDetails.report.title}
            </h2>

            <span style={{
              display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px',
              fontSize: '13px', fontWeight: '600', color: '#171c42', background: 'rgba(23, 28, 66, 0.08)',
              marginBottom: '24px'
            }}>
              {activeReportDetails.report.report_category}
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Side: Image Proof */}
              <div>
                {activeReportDetails.report.image_url ? (
                  <img 
                    src={activeReportDetails.report.image_url.startsWith('http') ? activeReportDetails.report.image_url : `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${activeReportDetails.report.image_url}`} 
                    alt="Evidence"
                    style={{ width: '100%', borderRadius: '16px', objectFit: 'cover', maxHeight: '250px', border: '1px solid rgba(23, 28, 66, 0.08)' }}
                  />
                ) : (
                  <div style={{ 
                    height: '180px', borderRadius: '16px', background: '#F8FAFC', 
                    border: '1px dashed rgba(23,28,66,0.12)', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '15px'
                  }}>
                    No image proof uploaded
                  </div>
                )}
                <div style={{ marginTop: '16px', fontSize: '13px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>Coordinates:</strong> {parseFloat(activeReportDetails.report.latitude).toFixed(6)}, {parseFloat(activeReportDetails.report.longitude).toFixed(6)}</div>
                  <div><strong>Location:</strong> {activeReportDetails.report.location_name || 'Coastal boundary'}</div>
                </div>
              </div>

              {/* Right Side: Details & Progress */}
              <div>
                <h4 style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Description</h4>
                <p style={{ 
                  fontSize: '15px', color: '#334155', background: '#F8FAFC', border: '1px solid rgba(23,28,66,0.06)',
                  padding: '16px', borderRadius: '12px', minHeight: '80px', marginBottom: '16px', lineHeight: '1.5'
                }}>
                  {activeReportDetails.report.description || 'No description provided.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#334155' }}>
                  <div><strong>Waste Type:</strong> {activeReportDetails.report.waste_type || 'General'}</div>
                  <div><strong>Severity:</strong> {activeReportDetails.report.severity || 'Medium'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>Status:</strong> 
                    <span style={{ 
                      display: 'inline-flex', padding: '2px 8px', borderRadius: '9999px',
                      fontSize: '12px', fontWeight: '600',
                      color: getStatusBadge(activeReportDetails.report.status, activeReportDetails.report.severity).color,
                      backgroundColor: getStatusBadge(activeReportDetails.report.status, activeReportDetails.report.severity).bg
                    }}>
                      {getStatusBadge(activeReportDetails.report.status, activeReportDetails.report.severity).text}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && activeReportDetails && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(23, 28, 66, 0.6)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            background: 'white', borderRadius: '24px', padding: '32px', position: 'relative',
            boxShadow: '0 20px 50px rgba(23, 28, 66, 0.15)'
          }}>
            <button 
              onClick={() => setShowDetailsModal(false)}
              style={{
                position: 'absolute', right: '24px', top: '24px', background: 'none',
                border: 'none', color: '#171c42', fontSize: '28px', cursor: 'pointer'
              }}
            >
              &times;
            </button>

            <h2 style={{ fontSize: '28px', fontWeight: '600', color: '#171c42', marginBottom: '8px' }}>
              {activeReportDetails.report.title}
            </h2>

            <span style={{
              display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px',
              fontSize: '13px', fontWeight: '600', color: '#171c42', background: 'rgba(23, 28, 66, 0.08)',
              marginBottom: '24px'
            }}>
              {activeReportDetails.report.report_category}
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Side: Image Proof */}
              <div>
                {activeReportDetails.report.image_url ? (
                  <img 
                    src={activeReportDetails.report.image_url.startsWith('http') ? activeReportDetails.report.image_url : `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${activeReportDetails.report.image_url}`} 
                    alt="Evidence"
                    style={{ width: '100%', borderRadius: '16px', objectFit: 'cover', maxHeight: '250px', border: '1px solid rgba(23, 28, 66, 0.08)' }}
                  />
                ) : (
                  <div style={{ 
                    height: '180px', borderRadius: '16px', background: '#F8FAFC', 
                    border: '1px dashed rgba(23,28,66,0.12)', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '15px'
                  }}>
                    No image proof uploaded
                  </div>
                )}
                <div style={{ marginTop: '16px', fontSize: '13px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>Coordinates:</strong> {parseFloat(activeReportDetails.report.latitude).toFixed(6)}, {parseFloat(activeReportDetails.report.longitude).toFixed(6)}</div>
                  <div><strong>Location:</strong> {activeReportDetails.report.location_name || 'Coastal boundary'}</div>
                </div>
              </div>

              {/* Right Side: Details & Progress */}
              <div>
                <h4 style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Description</h4>
                <p style={{ 
                  fontSize: '15px', color: '#334155', background: '#F8FAFC', border: '1px solid rgba(23,28,66,0.06)',
                  padding: '16px', borderRadius: '12px', minHeight: '80px', marginBottom: '16px', lineHeight: '1.5'
                }}>
                  {activeReportDetails.report.description || 'No description provided.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#334155' }}>
                  <div><strong>Waste Type:</strong> {activeReportDetails.report.waste_type || 'General'}</div>
                  <div><strong>Severity:</strong> {activeReportDetails.report.severity || 'Medium'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>Status:</strong> 
                    <span style={{ 
                      display: 'inline-flex', padding: '2px 8px', borderRadius: '9999px',
                      fontSize: '12px', fontWeight: '600',
                      color: getStatusBadge(activeReportDetails.report.status, activeReportDetails.report.severity).color,
                      backgroundColor: getStatusBadge(activeReportDetails.report.status, activeReportDetails.report.severity).bg
                    }}>
                      {getStatusBadge(activeReportDetails.report.status, activeReportDetails.report.severity).text}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
