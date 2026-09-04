import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, X, Activity } from 'lucide-react';

const Navbar = () => {
  const { user, notifications, handleClearAllNotifications, handleDismissNotification } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 20px',
      marginBottom: '24px',
      background: 'rgba(6, 18, 38, 0.65)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: '16px',
      border: '1px solid rgba(0, 229, 255, 0.2)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
      position: 'relative',
      zIndex: 1000
    }}>
      {/* Left Side: System Protocol Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          background: '#00f5d4', 
          boxShadow: '0 0 10px #00f5d4' 
        }}></span>
        <span style={{ 
          fontSize: '0.82rem', 
          fontWeight: '700', 
          color: '#e2e8f0', 
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Activity size={15} color="#00e5ff" />
          TerraMarine Coastal Network
        </span>
      </div>

      {/* Right Side: Notification Bell & User Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }} ref={popoverRef}>
        
        {/* Notification Bell Button */}
        <button
          onClick={() => setShowNotifications(prev => !prev)}
          style={{
            position: 'relative',
            background: showNotifications ? 'rgba(0, 229, 255, 0.2)' : 'rgba(8, 20, 42, 0.75)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            padding: '9px 12px',
            borderRadius: '12px',
            cursor: 'pointer',
            color: '#00e5ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: showNotifications ? '0 0 16px rgba(0, 229, 255, 0.4)' : 'none'
          }}
          title="Notifications"
        >
          <Bell size={20} color="#00e5ff" />
          {notifications && notifications.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: '800',
              padding: '1px 6px',
              borderRadius: '10px',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
              minWidth: '18px',
              textAlign: 'center'
            }}>
              {notifications.length}
            </span>
          )}
        </button>

        {/* User Role Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: 'rgba(8, 20, 42, 0.6)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: '12px'
        }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284c7 0%, #00e5ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#041126',
            fontWeight: '800',
            fontSize: '0.75rem'
          }}>
            {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#ffffff', lineHeight: '1.2' }}>
              {user.full_name}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#00f5d4', fontWeight: '600', lineHeight: '1.2' }}>
              {user.role}
            </span>
          </div>
        </div>

        {/* FLOATING NOTIFICATION POPOVER BOX */}
        {showNotifications && (
          <div style={{
            position: 'absolute',
            top: '52px',
            right: 0,
            width: '380px',
            maxHeight: '450px',
            borderRadius: '20px',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            background: 'linear-gradient(135deg, rgba(8, 22, 46, 0.98) 0%, rgba(5, 17, 36, 0.99) 100%)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85), 0 0 20px rgba(0, 229, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10000
          }}>
            {/* Cute Octopus Artwork Overlay */}
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

            {/* Popover Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid rgba(0, 229, 255, 0.2)', 
              padding: '16px 20px',
              position: 'relative',
              zIndex: 10
            }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#ffffff', fontWeight: '700' }}>
                <Bell size={18} color="#00e5ff" />
                Notifications
              </h3>
              {notifications && notifications.length > 0 && (
                <button 
                  onClick={handleClearAllNotifications} 
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '600' }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Notification Card List */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              maxHeight: '350px', 
              padding: '16px 20px',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              position: 'relative', 
              zIndex: 10 
            }}>
              {!notifications || notifications.length === 0 ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '36px 12px',
                  gap: '8px'
                }}>
                  <Bell size={32} color="#64748b" style={{ opacity: 0.6 }} />
                  <span style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: '600', textShadow: '0 2px 8px rgba(0, 0, 0, 0.85)' }}>
                    No new notifications
                  </span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.notification_id} 
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: 'rgba(8, 20, 42, 0.85)',
                      border: '1px solid rgba(0, 229, 255, 0.25)',
                      backdropFilter: 'blur(12px)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <h5 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#ffffff', margin: 0, lineHeight: '1.3' }}>
                        {notif.title}
                      </h5>
                      <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                        {notif.message}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDismissNotification(notif.notification_id)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                      title="Dismiss"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
