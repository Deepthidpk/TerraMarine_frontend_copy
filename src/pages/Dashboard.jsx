import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LeafletMap from '../components/LeafletMap';
import UserApproval from './UserApproval';
import FishermanDashboard from '../components/FishermanDashboard';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  AlertOctagon, Calendar, Users, Award, ShieldAlert, CheckCircle, Bell,
  AlertTriangle, Camera, MapPin, Clipboard, Map, Trash2, CheckCircle2, ChevronRight, X
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
    fetchDashboardData();
  }, []);

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
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
            <LeafletMap reports={reports} campaigns={campaigns} />

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



      {/* Bottom Split Row: Pollution Metrics & Notifications */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column: Pollution Metrics & Trends */}
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

        {/* Right Column: Notifications */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', position: 'relative', minHeight: '320px', overflow: 'hidden' }}>
          {/* Seamless Pale Background Octopus Artwork */}
          <img 
            src="/images/cute_octopus_marine.png" 
            alt="Underwater Octopus Background" 
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.22,
              mixBlendMode: 'screen',
              filter: 'brightness(1.1) contrast(0.95)',
              pointerEvents: 'none',
              zIndex: 1,
              WebkitMaskImage: 'radial-gradient(circle at 50% 55%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.5) 60%, transparent 95%)',
              maskImage: 'radial-gradient(circle at 50% 55%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.5) 60%, transparent 95%)'
            }} 
          />

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: '1px solid rgba(0, 229, 255, 0.15)', 
            paddingBottom: '12px',
            marginBottom: '16px',
            position: 'relative',
            zIndex: 10
          }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#ffffff', fontWeight: '700' }}>
              <Bell size={18} color="#00e5ff" />
              Notifications
            </h3>
            {notifications.length > 0 && (
              <button 
                onClick={handleClearAllNotifications} 
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Clear all
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '250px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 10 }}>
            {notifications.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '210px', 
              }}>
                <span style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: '600', textShadow: '0 2px 8px rgba(0, 0, 0, 0.85)' }}>
                  No new notifications
                </span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.notification_id} 
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(8, 20, 42, 0.75)',
                    border: '1px solid rgba(0, 229, 255, 0.2)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>{notif.title}</h5>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px', margin: '4px 0 0 0' }}>
                      {notif.message}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDismissNotification(notif.notification_id)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
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
};

export default Dashboard;
