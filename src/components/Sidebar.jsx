import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Users, 
  Sliders, 
  Lock, 
  Activity, 
  Megaphone, 
  ShieldCheck, 
  HardDriveDownload, 
  BarChart3, 
  LifeBuoy, 
  LogOut, 
  AlertTriangle, 
  Calendar, 
  CheckSquare, 
  Award, 
  Map, 
  Shield, 
  LayoutDashboard,
  Edit3,
  Camera,
  User,
  X,
  Bell
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, updateProfile, notifications, handleClearAllNotifications, handleDismissNotification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    district: '',
    state: '',
    profile_image: ''
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenEditModal = () => {
    setProfileForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      address: user.address || '',
      district: user.district || '',
      state: user.state || '',
      profile_image: user.profile_image || ''
    });
    setProfileError('');
    setProfileSuccess('');
    setShowEditModal(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        return setProfileError('Image file is too large (maximum 10MB).');
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 300;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setProfileForm(prev => ({ ...prev, profile_image: compressedDataUrl }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.full_name || profileForm.full_name.trim().length < 2) {
      return setProfileError('Full name must be at least 2 characters.');
    }
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await updateProfile(profileForm);
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => {
        setShowEditModal(false);
      }, 1200);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Check if a sidebar item is active for System Admin
  const isTabActive = (targetTab) => {
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab') || 'organizations';
    return location.pathname === '/dashboard' && currentTab === targetTab;
  };

  // Define sidebar links based on role
  const getNavLinks = () => {
    // 1. SYSTEM ADMINISTRATOR SIDEBAR (TerraMarine Company Product Provider)
    if (user.role === 'Admin') {
      return [
        { to: '/dashboard?tab=organizations', tabKey: 'organizations', label: 'Client Organizations', icon: <Building2 size={18} /> },
        { to: '/dashboard?tab=settings', tabKey: 'settings', label: 'Platform Settings', icon: <Sliders size={18} /> },
        { to: '/dashboard?tab=security', tabKey: 'security', label: 'Security Policies', icon: <Lock size={18} /> },
        { to: '/dashboard?tab=health', tabKey: 'health', label: 'Health & Diagnostics', icon: <Activity size={18} /> },
        { to: '/dashboard?tab=announcements', tabKey: 'announcements', label: 'Broadcast Notices', icon: <Megaphone size={18} /> },
        { to: '/dashboard?tab=audit', tabKey: 'audit', label: 'System Audit Logs', icon: <ShieldCheck size={18} /> },
        { to: '/dashboard?tab=backup', tabKey: 'backup', label: 'Backup & Recovery', icon: <HardDriveDownload size={18} /> },
        { to: '/dashboard?tab=reports', tabKey: 'reports', label: 'Platform Reports', icon: <BarChart3 size={18} /> },
        { to: '/notifications', isNotification: true, label: 'Notifications', icon: <Bell size={18} /> },
        { to: '/dashboard?tab=support', tabKey: 'support', label: 'Technical Support', icon: <LifeBuoy size={18} /> }
      ];
    }

    // 2. OPERATIONAL ROLES SIDEBAR (Municipal Authority, Volunteer, Citizen, Researcher, NGO)
    const links = [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { to: '/reports', label: 'Pollution Reports & Tracking', icon: <AlertTriangle size={18} /> },
      { to: '/campaigns', label: 'Cleanup Campaigns', icon: <Calendar size={18} /> }
    ];

    if (['Authority', 'Volunteer'].includes(user.role)) {
      links.push({ to: '/tasks', label: 'Cleanup Tasks', icon: <CheckSquare size={18} /> });
    }

    if (!['Volunteer', 'Citizen'].includes(user.role)) {
      links.push({ to: '/biodiversity', label: 'Biodiversity', icon: <Map size={18} /> });
    }

    if (['Authority', 'Volunteer'].includes(user.role)) {
      links.push({ to: '/payments', label: 'Rewards & Payments', icon: <Award size={18} /> });
    }

    if (user.role === 'Authority') {
      links.push({ to: '/user-approval', label: 'User Approvals', icon: <Shield size={18} /> });
    }

    links.push({ to: '/notifications', isNotification: true, label: 'Notifications', icon: <Bell size={18} /> });

    return links;
  };

  const navLinks = getNavLinks();
  const isAdmin = user.role === 'Admin';

  return (
    <aside className="sidebar">
      {/* Brand Logo Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '20px',
        paddingLeft: '4px',
        flexShrink: 0
      }}>
        <img 
          src="/images/whale_logo_icon.png" 
          alt="TerraMarine Logo"
          style={{
            width: '42px',
            height: '42px',
            objectFit: 'contain',
            background: 'transparent',
            filter: 'drop-shadow(0 0 12px rgba(0, 229, 255, 0.75))'
          }}
        />
        <div>
          <h1 className="brand-title" style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>TerraMarine</h1>
        </div>
      </div>

      {/* User Info Card */}
      <div 
        className="sidebar-user-card" 
        onClick={handleOpenEditModal}
        title="Click to edit profile"
        style={{ 
          flexShrink: 0, 
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
      >
        <img 
          src={user.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'} 
          alt="User Avatar"
          style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(0, 229, 255, 0.4)' }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h4 className="sidebar-user-name" style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</span>
            <Edit3 size={13} color="#00e5ff" style={{ opacity: 0.8 }} />
          </h4>
          <span className="sidebar-role-badge">
            {user.role}
          </span>
        </div>
      </div>

      {/* Scrollable Navigation Menu */}
      <nav 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px',
          paddingRight: '4px',
          marginBottom: '16px'
        }}
      >
        {navLinks.map((link) => {
          const active = isAdmin ? isTabActive(link.tabKey) : location.pathname === link.to;
          const unreadCount = link.isNotification && notifications ? notifications.length : 0;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`sidebar-nav-item ${active ? 'active' : ''}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                {link.icon}
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.label}</span>
              </div>
              {link.isNotification && unreadCount > 0 && (
                <span style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
                  flexShrink: 0
                }}>
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Fixed Anchored Bottom Logout Button */}
      <div style={{ flexShrink: 0, paddingTop: '12px', borderTop: '1px solid rgba(0, 229, 255, 0.15)' }}>
        <button 
          onClick={handleLogout} 
          className="sidebar-logout-btn"
        >
          <LogOut size={16} />
          <span>Logout Account</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EDIT PROFILE */}
      {/* ========================================================================= */}
      {showEditModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(4, 12, 26, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(12, 28, 54, 0.98) 0%, rgba(8, 20, 40, 0.99) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
            position: 'relative',
            padding: '28px',
            margin: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={22} color="#00e5ff" />
                <h2 style={{ fontSize: '1.3rem', margin: 0, color: '#ffffff', fontWeight: '800' }}>
                  Edit Profile
                </h2>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
              >
                <X size={22} />
              </button>
            </div>

            {profileError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '10px', color: '#ef4444', fontSize: '0.84rem', marginBottom: '16px', fontWeight: '600' }}>
                ⚠️ {profileError}
              </div>
            )}

            {profileSuccess && (
              <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '10px', color: '#10b981', fontSize: '0.84rem', marginBottom: '16px', fontWeight: '600' }}>
                ✅ {profileSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Profile Photo Upload Section */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <img 
                    src={profileForm.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'} 
                    alt="Profile Preview"
                    style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00e5ff', boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)' }}
                  />
                  <label 
                    htmlFor="avatar-upload"
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: '2px solid #0c1c36',
                      borderRadius: '50%',
                      padding: '7px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                    }}
                    title="Upload new profile photo"
                  >
                    <Camera size={15} />
                  </label>
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </div>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Click camera icon to change profile photo</span>
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Full Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={profileForm.full_name} 
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.25)' }}
                  required
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Phone Number</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  value={profileForm.phone} 
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                  style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.25)' }}
                />
              </div>

              {/* District & State Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>District</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={profileForm.district} 
                    onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                    placeholder="e.g. Ernakulam"
                    style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.25)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>State</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={profileForm.state} 
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    placeholder="e.g. Kerala"
                    style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.25)' }}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Address</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  value={profileForm.address} 
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Enter full address"
                  style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.25)', resize: 'vertical' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={savingProfile}
                  style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </