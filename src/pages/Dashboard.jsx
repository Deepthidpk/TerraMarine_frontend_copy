import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LeafletMap from '../components/LeafletMap';
import UserApproval from './UserApproval';
import FishermanDashboard from '../components/FishermanDashboard';
import WorkerDashboard from '../components/WorkerDashboard';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  AlertOctagon, Calendar, Users, Award, ShieldAlert, CheckCircle, Bell,
  AlertTriangle, Camera, MapPin, Clipboard, Map, Trash2, CheckCircle2, ChevronRight, X,
  Search, RotateCcw, Info, Check, PlusCircle
} from 'lucide-react';

const COLORS = ['#00e5ff', '#00f5d4', '#9d4edd', '#0284c7', '#ffb703', '#ef4444'];

const Dashboard = () => {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Volunteer Scheduled Campaigns State
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('All');
  const [joinedCampaignIds, setJoinedCampaignIds] = useState(new Set());
  const [activeCampaignDetails, setActiveCampaignDetails] = useState(null);
  const [showCampaignDetailsModal, setShowCampaignDetailsModal] = useState(false);

  // Modal details state
  const [activeReportDetails, setActiveReportDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
        setReports(reportsData.reports || []);
      }

      // Fetch campaigns
      const campaignsRes = await authFetch('/campaigns');
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData.campaigns || []);
      }

      // Fetch weather alerts
      const alertsRes = await authFetch('/alerts');
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }

      // Fetch notifications
      const notifRes = await authFetch('/notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Citizen') {
      navigate('/reports', { replace: true });
      return;
    }
    fetchDashboardData();
  }, [user]);

  const handleClearAllNotifications = async () => {
    try {
      await authFetch('/notifications', { method: 'DELETE' });
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const handleDismissNotification = async (id) => {
    try {
      await authFetch(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.notification_id !== id));
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  const handleJoinCampaign = async (campaignId) => {
    try {
      const res = await authFetch(`/campaigns/${campaignId}/join`, {
        method: 'POST'
      });
      if (res.ok) {
        setJoinedCampaignIds(prev => new Set([...prev, campaignId]));
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error joining campaign:', err);
    }
  };

  const handleOpenCampaignDetails = async (campaignId) => {
    try {
      const res = await authFetch(`/campaigns/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveCampaignDetails(data);
        setShowCampaignDetailsModal(true);
      }
    } catch (err) {
      console.error('Error fetching campaign details:', err);
    }
  };

  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
  const filteredCampaigns = safeCampaigns.filter(camp => {
    if (!camp) return false;
    if (campaignSearchQuery && campaignSearchQuery.trim()) {
      const q = campaignSearchQuery.toLowerCase().trim();
      const nameMatch = camp.campaign_name?.toLowerCase().includes(q);
      const locMatch = camp.location?.toLowerCase().includes(q);
      const orgMatch = (camp.organization_name || camp.creator_name)?.toLowerCase().includes(q);
      const descMatch = camp.description?.toLowerCase().includes(q);
      if (!nameMatch && !locMatch && !orgMatch && !descMatch) return false;
    }
    if (campaignStatusFilter !== 'All' && camp.status !== campaignStatusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#00e5ff', fontSize: '1.1rem', fontWeight: 600 }}>
        🌊 Loading TerraMarine Dashboard...
      </div>
    );
  }

  // System Administrator Control Center
  if (user?.role === 'Admin') {
    return <UserApproval />;
  }

  // Fisherman Coastal Observer Control Center
  if (user?.role === 'Fisherman') {
    return (
      <FishermanDashboard 
        user={user} 
        reports={reports} 
        campaigns={campaigns} 
        alerts={alerts} 
        notifications={notifications} 
        authFetch={authFetch}
        navigate={navigate}
        fetchDashboardData={fetchDashboardData}
        handleClearAllNotifications={handleClearAllNotifications}
        handleDismissNotification={handleDismissNotification}
      />
    );
  }

  // Worker Municipal Cleanup Control Center
  if (user?.role === 'Worker') {
    return <WorkerDashboard user={user} authFetch={authFetch} navigate={navigate} />;
  }

  const summary = stats?.summary || {
    totalReports: reports.length || 7,
    verifiedReports: reports.filter(r => r.status === 'Verified').length || 3,
    completedReports: reports.filter(r => r.status === 'Completed').length || 1,
    activeCampaigns: campaigns.filter(c => c.status === 'Upcoming' || c.status === 'Ongoing').length || 2,
    registeredVolunteers: stats?.summary?.registeredVolunteers || 2
  };

  const activeComplaintsCount = Math.max(0, summary.totalReports - summary.completedReports);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header welcome banner */}
      <div style={{ marginBottom: '4px' }}>
        <h1 style={{ fontSize: '1.85rem', color: '#ffffff', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
          Welcome back, <span style={{ color: '#00e5ff' }}>{user.full_name}</span>!
        </h1>
      </div>

      {/* Weather & Coastal Warnings Alert Banner */}
      {alerts.length > 0 && (
        <div className="glass-panel" style={{ 
          background: 'rgba(239, 68, 68, 0.12)', 
          borderColor: 'rgba(239, 68, 68, 0.4)', 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center' 
        }}>
          <ShieldAlert size={32} color="#ff4d4d" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ color: '#ff4d4d', marginBottom: '4px', fontSize: '1rem', fontWeight: '700' }}>
              ACTIVE COASTAL WARNING: {alerts[0].title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#fca5a5', margin: 0 }}>
              {alerts[0].description} (Radius: {alerts[0].radius_km} km around {alerts[0].latitude}, {alerts[0].longitude})
            </p>
          </div>
        </div>
      )}

      {/* 4 Metric Stats Cards Across Top */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
        {/* Card 1: Active Complaints (RED THEME) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(28, 20, 36, 0.85) 0%, rgba(14, 25, 48, 0.95) 100%)',
          border: '1px solid rgba(255, 77, 77, 0.35)',
          boxShadow: '0 8px 24px rgba(255, 77, 77, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 77, 77, 0.2)', border: '1px solid rgba(255, 77, 77, 0.4)' }}>
            <AlertOctagon size={24} color="#ff4d4d" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Active Complaints</span>
            <div className="stat-val">{activeComplaintsCount}</div>
          </div>
          <img 
            src="/images/red_coral_card_bg.png" 
            alt="Red Coral" 
            className="card-artwork-blend"
          />
        </div>

        {/* Card 2: Completed Cleanups (CYAN BLUE THEME) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(10, 38, 64, 0.85) 0%, rgba(8, 25, 46, 0.95) 100%)',
          border: '1px solid rgba(0, 229, 255, 0.35)',
          boxShadow: '0 8px 24px rgba(0, 229, 255, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 229, 255, 0.2)', border: '1px solid rgba(0, 229, 255, 0.4)' }}>
            <CheckCircle size={24} color="#00e5ff" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Completed Cleanups</span>
            <div className="stat-val">{summary.completedReports}</div>
          </div>
          <img 
            src="/images/cyan_cleanups_corner.png" 
            alt="Cyan Cleanups Coral" 
            className="card-artwork-blend"
          />
        </div>

        {/* Card 3: Active Campaigns (EMERALD TEAL THEME) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(10, 42, 50, 0.85) 0%, rgba(6, 28, 38, 0.95) 100%)',
          border: '1px solid rgba(0, 245, 212, 0.35)',
          boxShadow: '0 8px 24px rgba(0, 245, 212, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 245, 212, 0.2)', border: '1px solid rgba(0, 245, 212, 0.4)' }}>
            <Calendar size={24} color="#00f5d4" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Active Campaigns</span>
            <div className="stat-val">{summary.activeCampaigns}</div>
          </div>
          <img 
            src="/images/green_teal_campaigns_bg.png" 
            alt="Emerald Sea Kelp" 
            className="card-artwork-blend"
          />
        </div>

        {/* Card 4: Registered Volunteers (PURPLE VIOLET THEME) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(28, 20, 56, 0.85) 0%, rgba(16, 14, 40, 0.95) 100%)',
          border: '1px solid rgba(157, 78, 221, 0.35)',
          boxShadow: '0 8px 24px rgba(157, 78, 221, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(157, 78, 221, 0.2)', border: '1px solid rgba(157, 78, 221, 0.4)' }}>
            <Users size={24} color="#9d4edd" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Registered Volunteers</span>
            <div className="stat-val">{summary.registeredVolunteers}</div>
          </div>
          <img 
            src="/images/purple_coral_card_bg.png" 
            alt="Purple Coral" 
            className="card-artwork-blend"
          />
        </div>
      </div>

      {/* GIS Incident Hotspots & Campaigns Container - RESTRICTED TO MUNICIPAL AUTHORITY ONLY */}
      {user?.role === 'Authority' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <span style={{ fontSize: '1.2rem' }}>🌊</span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff', fontWeight: '700' }}>
              GIS Incident Hotspots & Campaigns
            </h3>
          </div>

          <div style={{ height: '420px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0, 229, 255, 0.2)', position: 'relative' }}>
            <LeafletMap reports={reports.filter(r => r.status !== 'Completed')} campaigns={campaigns} />

            {/* Bottom Legend Bar inside Map Container */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              zIndex: 500,
              background: 'rgba(8, 21, 42, 0.88)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: '9999px',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '0.8rem',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }}></span> Oil Spill
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00f5d4' }}></span> Plastic
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9d4edd' }}></span> Fishing Nets
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffb703' }}></span> Campaign
              </span>
            </div>
          </div>
        </div>
      )}



      {/* Bottom Row: Pollution Metrics & Trends (HIDDEN FOR VOLUNTEER ROLE) */}
      {user?.role !== 'Volunteer' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', paddingBottom: '12px' }}>
            <span style={{ color: '#00e5ff' }}>📈</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', fontWeight: '700' }}>Pollution Metrics & Trends</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', minHeight: '250px' }}>
            {/* Waste Types Doughnut Chart */}
            <div style={{ background: 'rgba(8, 20, 40, 0.5)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(0, 229, 255, 0.1)' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '12px', textAlign: 'center', fontWeight: '600' }}>
                Waste Types Distribution
              </h4>
              <div style={{ width: '100%', height: '160px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.wasteTypes?.length > 0 ? stats.wasteTypes : [
                        { name: 'Oil Spill', value: 51 },
                        { name: 'Plastic', value: 32 },
                        { name: 'Fishing Nets', value: 17 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(stats?.wasteTypes?.length > 0 ? stats.wasteTypes : [
                        { name: 'Oil Spill', value: 51 },
                        { name: 'Plastic', value: 32 },
                        { name: 'Fishing Nets', value: 17 }
                      ]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', fontSize: '0.72rem', marginTop: '8px', color: '#cbd5e1' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e5ff' }}></span> Oil Spill (51%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5d4' }}></span> Plastic (32%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9d4edd' }}></span> Fishing Nets (17%)
                </span>
              </div>
            </div>

            {/* Severity Bar Chart */}
            <div style={{ background: 'rgba(8, 20, 40, 0.5)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(0, 229, 255, 0.1)' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '12px', textAlign: 'center', fontWeight: '600' }}>
                Reports Severity Level
              </h4>
              <div style={{ width: '100%', height: '170px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.severity?.length > 0 ? stats.severity : [
                    { name: 'High', value: 3 },
                    { name: 'Medium', value: 7 }
                  ]}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} width={20} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#00e5ff" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Campaigns Table (VOLUNTEER DASHBOARD ONLY) */}
      {user?.role === 'Volunteer' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#ffffff', fontWeight: '800' }}>Scheduled Campaigns</h3>
                <span style={{ fontSize: '0.78rem', background: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.3)', fontWeight: '700' }}>
                  {safeCampaigns.filter(c => c.status === 'Upcoming' || c.status === 'Ongoing').length} Active
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                Showing {filteredCampaigns.length} of {safeCampaigns.length} total cleanup drives
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search campaigns, beach, org..."
                  value={campaignSearchQuery}
                  onChange={(e) => setCampaignSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '10px',
                    border: '1px solid rgba(0, 229, 255, 0.25)',
                    background: 'rgba(5, 19, 41, 0.85)',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />
              </div>

              <select
                value={campaignStatusFilter}
                onChange={(e) => setCampaignStatusFilter(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  background: 'rgba(5, 19, 41, 0.85)',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>

              {(campaignSearchQuery || campaignStatusFilter !== 'All') && (
                <button
                  onClick={() => { setCampaignSearchQuery(''); setCampaignStatusFilter('All'); }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#ff4d4d',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <RotateCcw size={13} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Campaign List Table */}
          {loading ? (
            <div style={{ color: '#94a3b8', padding: '30px', textAlign: 'center', fontSize: '0.9rem' }}>Loading campaign schedules...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ margin: 0, fontSize: '0.98rem', fontWeight: '600', color: '#ffffff' }}>No cleanup campaigns found.</p>
            </div>
          ) : (
            <div className="table-container" style={{ 
              width: '100%', 
              borderRadius: '14px', 
              border: '1px solid rgba(0, 229, 255, 0.2)', 
              background: 'rgba(6, 18, 38, 0.75)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden'
            }}>
              <table className="custom-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(4, 14, 30, 0.9)' }}>
                    <th style={{ width: '23%', padding: '8px 10px', fontSize: '0.72rem', letterSpacing: '0.05em' }}>CAMPAIGN NAME</th>
                    <th style={{ width: '15%', padding: '8px 8px', fontSize: '0.72rem', letterSpacing: '0.05em' }}>ORGANIZER</th>
                    <th style={{ width: '15%', padding: '8px 8px', fontSize: '0.72rem', letterSpacing: '0.05em' }}>LOCATION</th>
                    <th style={{ width: '10%', padding: '8px 8px', fontSize: '0.72rem', letterSpacing: '0.05em' }}>DATE</th>
                    <th style={{ width: '8%', padding: '8px 8px', fontSize: '0.72rem', letterSpacing: '0.05em', textAlign: 'center' }}>TIMING</th>
                    <th style={{ width: '11%', padding: '8px 8px', fontSize: '0.72rem', letterSpacing: '0.05em', textAlign: 'center' }}>VOLUNTEERS</th>
                    <th style={{ width: '10%', padding: '8px 8px', fontSize: '0.72rem', letterSpacing: '0.05em', textAlign: 'center' }}>STATUS</th>
                    <th style={{ width: '8%', padding: '8px 8px', fontSize: '0.72rem', letterSpacing: '0.05em', textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((camp) => {
                    const volCount = parseInt(camp.volunteer_count) || 0;
                    const maxVol = camp.maximum_volunteers || null;
                    const isJoined = Boolean(camp.is_joined) || camp.is_joined === 'true' || camp.is_joined === 't' || camp.is_joined === 1 || joinedCampaignIds.has(camp.campaign_id);

                    return (
                      <tr key={camp.campaign_id} style={{ transition: 'background 0.2s ease' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.8rem', lineHeight: '1.3' }}>{camp.campaign_name}</div>
                          {camp.description && (
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px', lineHeight: '1.25', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {camp.description}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px 8px', fontWeight: '600', fontSize: '0.78rem', color: '#e2e8f0', lineHeight: '1.3' }}>
                          {camp.organization_name || camp.creator_name}
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.3' }}>
                            <MapPin size={13} color="#00e5ff" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{camp.location}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 8px', fontSize: '0.78rem', fontWeight: '600', color: '#ffffff', whiteSpace: 'nowrap' }}>
                          {new Date(camp.campaign_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '8px 8px', fontSize: '0.78rem', whiteSpace: 'nowrap', textAlign: 'center' }}>
                          {camp.start_time ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', lineHeight: '1.2' }}>
                              <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.78rem' }}>{camp.start_time.slice(0,5)}</span>
                              <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.7rem' }}>to</span>
                              <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.78rem' }}>{camp.end_time?.slice(0,5) || 'TBD'}</span>
                            </div>
                          ) : (
                            <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.78rem' }}>All Day</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 10px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#00e5ff', background: 'rgba(0, 229, 255, 0.1)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(0, 229, 255, 0.25)' }}>
                            {volCount} {maxVol ? `/ ${maxVol}` : ''}
                          </span>
                        </td>
                        <td style={{ padding: '14px 10px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <span className={`badge ${
                            camp.status === 'Completed' ? 'badge-completed' :
                            camp.status === 'Upcoming' ? 'badge-pending' :
                            camp.status === 'Ongoing' ? 'badge-verified' : 'badge-emergency'
                          }`} style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '20px', fontWeight: '600' }}>
                            {camp.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            <button 
                              onClick={() => handleOpenCampaignDetails(camp.campaign_id)}
                              className="btn btn-secondary" 
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '0.72rem', 
                                borderRadius: '6px', 
                                gap: '4px',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                background: 'rgba(255, 255, 255, 0.08)',
                                width: '100%',
                                maxWidth: '75px',
                                justifyContent: 'center'
                              }}
                            >
                              <Info size={12} />
                              Details
                            </button>

                            {isJoined ? (
                              <button 
                                disabled
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.72rem',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'rgba(16, 185, 129, 0.2)',
                                  color: '#00f5d4',
                                  border: '1px solid rgba(0, 245, 212, 0.4)',
                                  fontWeight: '700',
                                  cursor: 'default',
                                  width: '100%',
                                  maxWidth: '75px',
                                  justifyContent: 'center'
                                }}
                              >
                                <Check size={12} /> Joined
                              </button>
                            ) : (
                              camp.status === 'Upcoming' && (
                                <button 
                                  onClick={() => handleJoinCampaign(camp.campaign_id)}
                                  className="btn btn-primary" 
                                  style={{ 
                                    padding: '4px 8px', 
                                    fontSize: '0.72rem', 
                                    borderRadius: '6px', 
                                    gap: '4px',
                                    background: 'linear-gradient(135deg, #0284c7 0%, #00e5ff 100%)',
                                    color: '#041126',
                                    fontWeight: '700',
                                    boxShadow: '0 3px 10px rgba(0, 229, 255, 0.35)',
                                    width: '100%',
                                    maxWidth: '75px',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Users size={12} />
                                  Join
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CAMPAIGN DETAILS MODAL */}
      {showCampaignDetailsModal && activeCampaignDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '740px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: '#08142a',
            borderRadius: '16px',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            position: 'relative',
            padding: '28px'
          }}>
            <button 
              onClick={() => setShowCampaignDetailsModal(false)}
              style={{
                position: 'absolute',
                right: '20px',
                top: '20px',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.4rem', marginBottom: '4px', fontWeight: '800', color: '#ffffff' }}>
              {activeCampaignDetails.campaign.campaign_name}
            </h2>
            <p style={{ color: '#00e5ff', fontSize: '0.88rem', marginBottom: '18px', fontWeight: '600' }}>
              Organized by: {activeCampaignDetails.campaign.organization_name || activeCampaignDetails.campaign.creator_name}
            </p>

            <div style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', border: '1px solid rgba(0, 229, 255, 0.15)', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign Description</h4>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                {activeCampaignDetails.campaign.description || 'No description available for this campaign.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem', marginBottom: '24px', color: '#cbd5e1' }}>
              <div>
                <p style={{ margin: '4px 0' }}><strong style={{ color: '#ffffff' }}>Scheduled Date:</strong> {new Date(activeCampaignDetails.campaign.campaign_date).toLocaleDateString()}</p>
                <p style={{ margin: '4px 0' }}><strong style={{ color: '#ffffff' }}>Timing:</strong> {activeCampaignDetails.campaign.start_time ? `${activeCampaignDetails.campaign.start_time} - ${activeCampaignDetails.campaign.end_time || 'TBD'}` : 'All Day'}</p>
                <p style={{ margin: '4px 0' }}><strong style={{ color: '#ffffff' }}>Status:</strong> <span className={`badge ${activeCampaignDetails.campaign.status === 'Completed' ? 'badge-completed' : 'badge-pending'}`}>{activeCampaignDetails.campaign.status}</span></p>
              </div>
              <div>
                <p style={{ margin: '4px 0' }}><strong style={{ color: '#ffffff' }}>Beach Location:</strong> {activeCampaignDetails.campaign.location}</p>
                <p style={{ margin: '4px 0' }}><strong style={{ color: '#ffffff' }}>Coordinates:</strong> {activeCampaignDetails.campaign.latitude || 'TBD'}, {activeCampaignDetails.campaign.longitude || 'TBD'}</p>
                <p style={{ margin: '4px 0' }}><strong style={{ color: '#ffffff' }}>Registered Volunteers:</strong> {activeCampaignDetails.volunteers?.length || 0} members</p>
              </div>
            </div>

            <button 
              onClick={() => setShowCampaignDetailsModal(false)}
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '16px', padding: '10px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
