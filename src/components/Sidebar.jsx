import React, { useState, useEffect } from 'react';
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
  Bell,
  History,
  Compass,
  Layers,
  FolderOpen,
  Database,
  FileText,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, updateProfile, notifications, authFetch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  useEffect(() => {
    if (user && ['Authority', 'Admin'].includes(user.role)) {
      const checkPendingReports = async () => {
        try {
          const res = await authFetch('/reports');
          if (res.ok) {
            const data = await res.json();
            const pendingCount = (data.reports || []).filter(r => r.status === 'Pending').length;
            setPendingReportsCount(pendingCount);
          }
        } catch (e) {
          // Silent catch
        }
      };
      checkPendingReports();
      const interval = setInterval(checkPendingReports, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    district: '',
    state: '',
    profile_image: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const validateField = (name, value) => {
    let errorMsg = '';
    if (name === 'full_name') {
      if (!value || !value.trim()) {
        errorMsg = 'Full name is required.';
      } else if (value.trim().length < 3) {
        errorMsg = 'Full name must be at least 3 characters.';
      } else if (!/^[A-Za-z\s]+$/.test(value)) {
        errorMsg = 'Full name can only contain letters and spaces.';
      }
    } else if (name === 'phone') {
      if (value && !/^[6-9][0-9]{9}$/.test(value)) {
        errorMsg = 'Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.';
      }
    } else if (name === 'district') {
      if (value && !/^[A-Za-z0-9\s]+$/.test(value)) {
        errorMsg = 'District can only contain letters, digits, and spaces.';
      }
    } else if (name === 'state') {
      if (value && !/^[A-Za-z0-9\s]+$/.test(value)) {
        errorMsg = 'State can only contain letters, digits, and spaces.';
      }
    } else if (name === 'address') {
      if (value && value.trim().length < 5) {
        errorMsg = 'Address must be at least 5 characters.';
      } else if (value && !/^[A-Za-z0-9\s]+$/.test(value)) {
        errorMsg = 'Address can only contain letters, digits, and spaces.';
      }
    }
    setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
    return errorMsg;
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
    setFieldErrors({});
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
    
    // Validate all fields first
    const errFullName = validateField('full_name', profileForm.full_name);
    const errPhone = validateField('phone', profileForm.phone);
    const errDistrict = validateField('district', profileForm.district);
    const errState = validateField('state', profileForm.state);
    const errAddress = validateField('address', profileForm.address);
    
    if (errFullName || errPhone || errDistrict || errState || errAddress) {
      setProfileError('Please correct the highlighted validation errors before saving.');
      return;
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

  // Check if a sidebar item is active for System Admin & Researcher
  const isTabActive = (tabKey) => {
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab');
    if (!currentTab) {
      if (user.role === 'Admin') return tabKey === 'organizations';
      if (user.role === 'Researcher') return tabKey === 'dashboard';
      return false;
    }
    return currentTab === tabKey;
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

    // 2. RESEARCHER ROLE SIDEBAR (Coastal Research & Marine Intelligence Workspace)
    if (user.role === 'Researcher') {
      return [
        { to: '/dashboard?tab=dashboard', tabKey: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { to: '/dashboard?tab=ocean-intelligence', tabKey: 'ocean-intelligence', label: 'Ocean Intelligence', icon: <Map size={18} /> },
        { to: '/dashboard?tab=species-explorer', tabKey: 'species-explorer', label: 'Species Explorer', icon: <Compass size={18} /> },
        { to: '/dashboard?tab=biodiversity-hotspots', tabKey: 'biodiversity-hotspots', label: 'Biodiversity', icon: <Layers size={18} /> },
        { to: '/dashboard?tab=pollution-analysis', tabKey: 'pollution-analysis', label: 'Pollution Analysis', icon: <BarChart3 size={18} /> },
        { to: '/dashboard?tab=water-quality', tabKey: 'water-quality', label: 'Water Quality', icon: <Sliders size={18} /> },
        { to: '/dashboard?tab=research-projects', tabKey: 'research-projects', label: 'Research Projects', icon: <FolderOpen size={18} /> },
        { to: '/dashboard?tab=my-observations', tabKey: 'my-observations', label: 'My Observations', icon: <Camera size={18} /> },
        { to: '/dashboard?tab=datasets', tabKey: 'datasets', label: 'Datasets', icon: <Database size={18} /> },
        { to: '/dashboard?tab=research-reports', tabKey: 'research-reports', label: 'Research Reports', icon: <FileText size={18} /> },
        { to: '/dashboard?tab=research-assistant', tabKey: 'research-assistant', label: 'Research Assistant', icon: <MessageSquare size={18} /> },
        { to: '/dashboard?tab=research-alerts', tabKey: 'research-alerts', label: 'Research Alerts', icon: <AlertCircle size={18} /> }
      ];
    }

    // 3. WORKER ROLE SIDEBAR (Municipal Cleanup Task Worker)
    if (user.role === 'Worker') {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { to: '/participations', label: 'My Participations', icon: <History size={18} /> },
        { to: '/payments', label: 'Rewards & Earnings', icon: <Award size={18} /> },
        { to: '/notifications', isNotification: true, label: 'Notifications', icon: <Bell size={18} /> }
      ];
    }

    // 4. OPERATIONAL ROLES SIDEBAR (Municipal Authority, Volunteer, Citizen, NGO)
    const links = [];
    if (user.role !== 'Citizen') {
      links.push({ to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> });
    }
    links.push(
      { to: '/reports', label: 'Pollution Reports & Tracking', icon: <AlertTriangle size={18} /> }
    );
    if (user.role !== 'Volunteer') {
      links.push({ to: '/campaigns', label: 'Cleanup Campaigns', icon: <Calendar size={18} /> });
    }

    if (['Volunteer', 'Worker'].includes(user.role)) {
      links.push({ to: '/participations', label: 'My Participations', icon: <History size={18} /> });
    }

    if (['Authority', 'Worker'].includes(user.role)) {
      links.push({ to: '/tasks', label: 'Cleanup Tasks', icon: <CheckSquare size={18} /> });
    }

    if (['Authority', 'Worker'].includes(user.role)) {
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
          const active = ['Admin', 'Researcher'].includes(user.role) ? isTabActive(link.tabKey) : location.pathname === link.to;
          const unreadCount = link.isNotification && notifications ? notifications.filter(n => !n.is_read).length : 0;

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
              {link.to === '/reports' && pendingReportsCount > 0 && ['Authority', 'Admin'].includes(user?.role) && (
                <span 
                  title={`${pendingReportsCount} new complaint(s) awaiting approval`}
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0
                  }}
                >
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px #10b981'
                  }} />
                  {pendingReportsCount}
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
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, full_name: e.target.value });
                    validateField('full_name', e.target.value);
                  }}
                  style={{ 
                    color: '#ffffff', 
                    background: 'rgba(8, 20, 42, 0.8)', 
                    border: fieldErrors.full_name ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)' 
                  }}
                  required
                />
                {fieldErrors.full_name && (
                  <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.full_name}
                  </span>
                )}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Phone Number</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  value={profileForm.phone} 
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, phone: e.target.value });
                    validateField('phone', e.target.value);
                  }}
                  placeholder="e.g. 9876543210"
                  style={{ 
                    color: '#ffffff', 
                    background: 'rgba(8, 20, 42, 0.8)', 
                    border: fieldErrors.phone ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)' 
                  }}
                />
                {fieldErrors.phone && (
                  <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.phone}
                  </span>
                )}
              </div>

              {/* District & State Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>District</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={profileForm.district} 
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, district: e.target.value });
                      validateField('district', e.target.value);
                    }}
                    placeholder="e.g. Ernakulam"
                    style={{ 
                      color: '#ffffff', 
                      background: 'rgba(8, 20, 42, 0.8)', 
                      border: fieldErrors.district ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)' 
                    }}
                  />
                  {fieldErrors.district && (
                    <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.district}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>State</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={profileForm.state} 
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, state: e.target.value });
                      validateField('state', e.target.value);
                    }}
                    placeholder="e.g. Kerala"
                    style={{ 
                      color: '#ffffff', 
                      background: 'rgba(8, 20, 42, 0.8)', 
                      border: fieldErrors.state ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)' 
                    }}
                  />
                  {fieldErrors.state && (
                    <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.state}
                    </span>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Address</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  value={profileForm.address} 
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, address: e.target.value });
                    validateField('address', e.target.value);
                  }}
                  placeholder="Enter full address"
                  style={{ 
                    color: '#ffffff', 
                    background: 'rgba(8, 20, 42, 0.8)', 
                    border: fieldErrors.address ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)', 
                    resize: 'vertical' 
                  }}
                />
                {fieldErrors.address && (
                  <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.address}
                  </span>
                )}
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
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
};

export default Sidebar;
