import React from 'react';
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
  LayoutDashboard 
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
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
        { to: '/dashboard?tab=org_admins', tabKey: 'org_admins', label: 'Org Administrators', icon: <Users size={18} /> },
        { to: '/dashboard?tab=settings', tabKey: 'settings', label: 'Platform Settings', icon: <Sliders size={18} /> },
        { to: '/dashboard?tab=security', tabKey: 'security', label: 'Security Policies', icon: <Lock size={18} /> },
        { to: '/dashboard?tab=health', tabKey: 'health', label: 'Health & Diagnostics', icon: <Activity size={18} /> },
        { to: '/dashboard?tab=announcements', tabKey: 'announcements', label: 'Broadcast Notices', icon: <Megaphone size={18} /> },
        { to: '/dashboard?tab=audit', tabKey: 'audit', label: 'System Audit Logs', icon: <ShieldCheck size={18} /> },
        { to: '/dashboard?tab=backup', tabKey: 'backup', label: 'Backup & Recovery', icon: <HardDriveDownload size={18} /> },
        { to: '/dashboard?tab=reports', tabKey: 'reports', label: 'Platform Reports', icon: <BarChart3 size={18} /> },
        { to: '/dashboard?tab=support', tabKey: 'support', label: 'Technical Support', icon: <LifeBuoy size={18} /> }
      ];
    }

    // 2. OPERATIONAL ROLES SIDEBAR (Municipal Authority, Volunteer, Citizen, Researcher, NGO)
    const links = [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { to: '/reports', label: 'Pollution Reports', icon: <AlertTriangle size={18} /> },
      { to: '/campaigns', label: 'Cleanup Campaigns', icon: <Calendar size={18} /> }
    ];

    if (['Authority', 'Volunteer'].includes(user.role)) {
      links.push({ to: '/tasks', label: 'Cleanup Tasks', icon: <CheckSquare size={18} /> });
    }

    links.push({ to: '/biodiversity', label: 'Biodiversity', icon: <Map size={18} /> });

    if (['Authority', 'Volunteer'].includes(user.role)) {
      links.push({ to: '/payments', label: 'Rewards & Payments', icon: <Award size={18} /> });
    }

    if (user.role === 'Authority') {
      links.push({ to: '/user-approval', label: 'User Approvals', icon: <Shield size={18} /> });
    }

    return links;
  };

  const navLinks = getNavLinks();
  const isAdmin = user.role === 'Admin';

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '16px', boxSizing: 'border-box' }}>
      {/* Brand Logo Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '16px',
        paddingLeft: '4px',
        flexShrink: 0
      }}>
        <span style={{ fontSize: '1.6rem' }}>🌊</span>
        <div>
          <h1 className="brand-title" style={{ margin: 0, fontSize: '1.2rem' }}>TerraMarine</h1>
          <span className="brand-subtext" style={{ fontSize: '0.65rem' }}>
            {isAdmin ? 'System Admin Suite' : 'Coastal Support System'}
          </span>
        </div>
      </div>

      {/* User Info Card */}
      <div className="sidebar-user-card" style={{ flexShrink: 0, marginBottom: '16px', padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img 
          src={user.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'} 
          alt="User Avatar"
          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h4 className="sidebar-user-name" style={{ margin: 0, fontSize: '0.85rem' }}>
            {user.full_name}
          </h4>
          <span className="sidebar-role-badge" style={{ marginTop: '2px' }}>
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
          gap: '4px',
          paddingRight: '4px',
          marginBottom: '12px'
        }}
      >
        {navLinks.map((link) => {
          const active = isAdmin ? isTabActive(link.tabKey) : location.pathname === link.to;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`sidebar-nav-item ${active ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: active ? '600' : '500',
                color: active ? '#ffffff' : '#94a3b8',
                background: active ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {link.icon}
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Fixed Anchored Bottom Logout Button */}
      <div style={{ flexShrink: 0, paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <button 
          onClick={handleLogout} 
          className="sidebar-logout-btn"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '8px',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#fca5a5',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.85rem',
            transition: 'all 0.2s ease'
          }}
        >
          <LogOut size={16} />
          <span>Logout Account</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
