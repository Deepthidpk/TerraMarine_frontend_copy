import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Trash2, RefreshCw, X, CheckCircle2, ShieldAlert, Calendar, CheckSquare, Info } from 'lucide-react';

const Notifications = () => {
  const { notifications, handleClearAllNotifications, handleDismissNotification, fetchNotifications } = useAuth();
  const [filter, setFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredNotifications = (notifications || []).filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'campaigns') return notif.title?.toLowerCase().includes('campaign') || notif.message?.toLowerCase().includes('campaign');
    if (filter === 'tasks') return notif.title?.toLowerCase().includes('task') || notif.message?.toLowerCase().includes('task');
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Page Header Bar */}
      <div className="glass-panel" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '24px 30px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Artwork */}
        <img 
          src="/images/cute_octopus_marine.png" 
          alt="Octopus Artwork"
          style={{
            position: 'absolute',
            right: '-40px',
            top: '-30px',
            width: '260px',
            height: '260px',
            objectFit: 'contain',
            opacity: 0.18,
            pointerEvents: 'none',
            mixBlendMode: 'screen'
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(0, 245, 212, 0.2) 100%)',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              padding: '10px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bell size={26} color="#00e5ff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>
                Notifications Center
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.92rem' }}>
                View and manage your real-time alerts, cleanup campaign updates, and task assignments
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 2 }}>
          <button
            onClick={handleRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'rgba(8, 20, 42, 0.75)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              color: '#00e5ff',
              fontWeight: '600',
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Refresh Notifications"
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>

          {notifications && notifications.length > 0 && (
            <button
              onClick={handleClearAllNotifications}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.25) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                fontWeight: '600',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Trash2 size={16} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            border: filter === 'all' ? '1px solid #00e5ff' : '1px solid rgba(0, 229, 255, 0.15)',
            background: filter === 'all' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(8, 20, 42, 0.5)',
            color: filter === 'all' ? '#00e5ff' : '#94a3b8',
            fontWeight: '600',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>All Notifications</span>
          <span style={{ 
            background: 'rgba(0, 229, 255, 0.2)', 
            padding: '2px 8px', 
            borderRadius: '12px', 
            fontSize: '0.78rem',
            color: '#00f5d4'
          }}>
            {notifications ? notifications.length : 0}
          </span>
        </button>

        <button
          onClick={() => setFilter('campaigns')}
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            border: filter === 'campaigns' ? '1px solid #00e5ff' : '1px solid rgba(0, 229, 255, 0.15)',
            background: filter === 'campaigns' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(8, 20, 42, 0.5)',
            color: filter === 'campaigns' ? '#00e5ff' : '#94a3b8',
            fontWeight: '600',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Calendar size={15} />
          <span>Campaigns</span>
        </button>

        <button
          onClick={() => setFilter('tasks')}
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            border: filter === 'tasks' ? '1px solid #00e5ff' : '1px solid rgba(0, 229, 255, 0.15)',
            background: filter === 'tasks' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(8, 20, 42, 0.5)',
            color: filter === 'tasks' ? '#00e5ff' : '#94a3b8',
            fontWeight: '600',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckSquare size={15} />
          <span>Cleanup Tasks</span>
        </button>
      </div>

      {/* Notifications Grid / List */}
      {filteredNotifications.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '60px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 229, 255, 0.1)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bell size={32} color="#00e5ff" style={{ opacity: 0.8 }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff', fontWeight: '700' }}>
              No Notifications Found
            </h3>
            <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.9rem', maxWidth: '400px' }}>
              {filter === 'all' 
                ? 'You are all caught up! There are currently no new notifications in your inbox.' 
                : `No notifications matching the "${filter}" filter.`}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          {filteredNotifications.map((notif) => (
            <div 
              key={notif.notification_id}
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '20px 24px',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(8, 22, 46, 0.85) 0%, rgba(5, 17, 36, 0.9) 100%)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                borderRadius: '16px',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Cute Octopus Overlay on Card */}
              <img 
                src="/images/cute_octopus_marine.png" 
                alt="Octopus Artwork" 
                style={{
                  position: 'absolute',
                  right: '60px',
                  top: '-20px',
                  width: '180px',
                  height: '180px',
                  objectFit: 'contain',
                  opacity: 0.12,
                  pointerEvents: 'none',
                  mixBlendMode: 'screen'
                }}
              />

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, position: 'relative', zIndex: 2 }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(0, 229, 255, 0.15)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bell size={20} color="#00e5ff" />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#ffffff' }}>
                      {notif.title}
                    </h4>
                    {notif.created_at && (
                      <span style={{ fontSize: '0.78rem', color: '#64748b', background: 'rgba(15, 23, 42, 0.6)', padding: '2px 8px', borderRadius: '6px' }}>
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '8px 0 0 0', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.5' }}>
                    {notif.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDismissNotification(notif.notification_id)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#94a3b8',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '16px',
                  position: 'relative',
                  zIndex: 2,
                  transition: 'all 0.2s ease'
                }}
                title="Dismiss Notification"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
