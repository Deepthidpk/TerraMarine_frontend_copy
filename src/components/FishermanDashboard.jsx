import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Anchor, ShieldAlert, AlertOctagon, Camera, MapPin, Calendar, 
  Wind, Compass, Bell, CheckCircle, Clock, Info, X, Radio, Navigation, Eye, CheckCircle2, ChevronRight,
  RefreshCw, Send, AlertTriangle, Layers, Droplet, Fish, AlertCircle, FileText, Check
} from 'lucide-react';

const FishermanDashboard = ({ 
  user, 
  reports, 
  campaigns, 
  alerts, 
  notifications, 
  authFetch, 
  navigate, 
  fetchDashboardData,
  handleClearAllNotifications,
  handleDismissNotification
}) => {
  // 1. REPORT CREATION MODAL STATE (Floating Waste & Emergencies)
  const [showReportModal, setShowReportModal] = useState(false);
  const [modalCategory, setModalCategory] = useState('Pollution');
  const [modalWasteType, setModalWasteType] = useState('Plastic');
  const [modalSeverity, setModalSeverity] = useState('Medium');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Dynamic categories & waste types
  const [categoriesList, setCategoriesList] = useState(['Pollution', 'Emergency']);
  const [wasteTypesList, setWasteTypesList] = useState(['Plastic', 'Glass', 'Fishing Nets', 'Oil Spill', 'Dead Marine Life', 'General Litter']);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await authFetch('/categories');
        if (res.ok) {
          const data = await res.json();
          if (data.categories && data.categories.length > 0) setCategoriesList(data.categories.map(c => c.name));
        }
      } catch (err) {}
    };
    const fetchWastes = async () => {
      try {
        const res = await authFetch('/waste-types');
        if (res.ok) {
          const data = await res.json();
          if (data.wasteTypes && data.wasteTypes.length > 0) setWasteTypesList(data.wasteTypes.map(w => w.name));
        }
      } catch (err) {}
    };
    fetchCats();
    fetchWastes();
  }, []);

  // 2. REPORT DETAILS & TRACKING STEPPER MODAL STATE
  const [activeReportDetails, setActiveReportDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // 3. WEATHER ALERT DETAIL MODAL STATE
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);

  // 4. CAMPAIGN DETAIL MODAL STATE
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  // 5. JOINED CAMPAIGNS TRACKING STATE
  const [joinedCampaignIds, setJoinedCampaignIds] = useState(new Set());
  const [joiningCampaignId, setJoiningCampaignId] = useState(null);

  // Auto-detect GPS coordinates
  const handleDetectGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
          setFormSuccess('GPS coordinates auto-detected!');
          setTimeout(() => setFormSuccess(''), 2500);
        },
        () => setFormError('GPS access denied or unavailable. Enter manually.'),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Quick Preset Selector for Floating Waste / Emergency
  const handleApplyPreset = (presetType) => {
    if (presetType === 'plastic') {
      setModalCategory('Pollution');
      setModalWasteType('Plastic');
      setModalSeverity('Medium');
      setReportTitle('Floating Plastic Debris Sighting');
      setReportDesc('Sighting of floating plastic bottles, bags, and synthetic trash at sea.');
    } else if (presetType === 'nets') {
      setModalCategory('Pollution');
      setModalWasteType('Fishing Nets');
      setModalSeverity('Medium');
      setReportTitle('Abandoned Ghost Fishing Net Encounter');
      setReportDesc('Derelict ghost fishing net adrift in coastal waters creating marine entanglement hazard.');
    } else if (presetType === 'oil') {
      setModalCategory('Emergency');
      setModalWasteType('Oil Spill');
      setModalSeverity('High');
      setReportTitle('Emergency Oil Spill / Fuel Slick Sighting');
      setReportDesc('Spotted large dark oil slick / fuel sheen spreading over surface water.');
    } else if (presetType === 'dead_life') {
      setModalCategory('Emergency');
      setModalWasteType('Dead Marine Life');
      setModalSeverity('High');
      setReportTitle('Mass Dead Marine Life Encountered');
      setReportDesc('Unusual concentration of deceased fish / marine organisms spotted drifting.');
    } else if (presetType === 'hazardous') {
      setModalCategory('Emergency');
      setModalWasteType('General Litter');
      setModalSeverity('High');
      setReportTitle('Hazardous Chemical Barrel / Drum Floating');
      setReportDesc('Unidentified chemical container or toxic waste drum floating in sea route.');
    }
  };

  const handleOpenReportModal = (category, wasteType = 'Plastic', severity = 'Medium', preset = null) => {
    setModalCategory(category);
    setModalWasteType(wasteType);
    setModalSeverity(severity);
    setReportTitle(category === 'Emergency' ? 'Emergency Incident at Sea' : 'Floating Marine Waste Sighting');
    setReportDesc('');
    setLocationName('Offshore Fishing Route');
    setLatitude('');
    setLongitude('');
    setImageFile(null);
    setFormError('');
    setFormSuccess('');
    setShowReportModal(true);
    handleDetectGPS();
    if (preset) handleApplyPreset(preset);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportTitle.trim() || reportTitle.length < 3) {
      return setFormError('Title must be at least 3 characters.');
    }
    if (!locationName.trim()) {
      return setFormError('Location name or fishing zone is required.');
    }
    if (!latitude || !longitude) {
      return setFormError('Latitude & Longitude GPS coordinates are required.');
    }

    setSubmitting(true);
    setFormError('');
    try {
      const formData = new FormData();
      formData.append('title', reportTitle.trim());
      formData.append('description', reportDesc.trim());
      formData.append('report_category', modalCategory);
      formData.append('waste_type', modalWasteType);
      formData.append('severity', modalSeverity);
      formData.append('location_name', locationName.trim());
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await authFetch('/reports', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setFormSuccess('Observer report logged successfully! Transmitted to coastal authorities.');
        setTimeout(() => {
          setShowReportModal(false);
          fetchDashboardData();
        }, 1500);
      } else {
        const errData = await res.json();
        setFormError(errData.error || 'Failed to submit report.');
      }
    } catch (err) {
      setFormError('Error submitting observer report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetails = async (reportId) => {
    try {
      const res = await authFetch(`/reports/${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveReportDetails(data);
        setShowDetailsModal(true);
      }
    } catch (err) {
      console.error('Error fetching report details:', err);
    }
  };

  const handleJoinCampaign = async (campaignId) => {
    setJoiningCampaignId(campaignId);
    try {
      const res = await authFetch(`/campaigns/${campaignId}/join`, { method: 'POST' });
      if (res.ok) {
        setJoinedCampaignIds(prev => new Set([...prev, campaignId]));
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || 'Could not join campaign.');
      }
    } catch (err) {
      console.error('Error joining campaign:', err);
    } finally {
      setJoiningCampaignId(null);
    }
  };

  // Fisherman's own reported items
  const myReports = reports.filter(r => r.reported_by === user?.user_id);
  const activeAlerts = alerts.length > 0 ? alerts : [
    { 
      alert_id: 101, 
      title: 'Coastal High Wave & Wind Advisory', 
      description: 'Monsoon sea surge expected along Kerala coast. Wind speeds 18-24 knots NW. Exercise caution.', 
      severity: 'High', 
      radius_km: 25, 
      latitude: 9.9312, 
      longitude: 76.2673,
      issued_time: new Date().toISOString(),
      issuer_name: 'Municipal Maritime Authority'
    },
    { 
      alert_id: 102, 
      title: 'Floating Debris Safety Watch', 
      description: 'Reports of loose fishing gear drifting 4 NM offshore. Navigation advisory active.', 
      severity: 'Medium', 
      radius_km: 15, 
      latitude: 9.9650, 
      longitude: 76.2420,
      issued_time: new Date().toISOString(),
      issuer_name: 'Coast Guard Station'
    }
  ];

  const activeComplaintsCount = Math.max(0, (reports.length || 7) - (reports.filter(r => r.status === 'Completed' || r.status === 'Resolved').length || 1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. HEADER WELCOME BANNER WITH QUICK REPORT ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '4px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: '#ffffff', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
            Welcome back, <span style={{ color: '#00e5ff' }}>{user.full_name}</span>!
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Anchor size={14} color="#00e5ff" /> Coastal Observer Station | License: <strong style={{ color: '#ffffff' }}>{user?.fisherman_license_no || 'Verified Observer'}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => handleOpenReportModal('Pollution', 'Plastic', 'Medium')}
            className="btn btn-primary"
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #00e5ff 100%)',
              color: '#041126',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(0, 229, 255, 0.3)',
              border: 'none'
            }}
          >
            <Camera size={16} />
            <span>+ Report Floating Waste</span>
          </button>
          
          <button 
            onClick={() => handleOpenReportModal('Emergency', 'Oil Spill', 'High')}
            className="btn btn-primary"
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #dc2626 0%, #ff4d4d 100%)',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.35)',
              border: 'none'
            }}
          >
            <ShieldAlert size={16} />
            <span>+ Report Emergency</span>
          </button>
        </div>
      </div>

      {/* 2. 4 METRIC STAT CARDS ACROSS TOP (EXACT STAT-CARD-MARINE DESIGN) */}
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
            <div className="stat-val">{reports.filter(r => r.status === 'Completed' || r.status === 'Resolved').length || 1}</div>
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
            <div className="stat-val">{campaigns.length || 2}</div>
          </div>
          <img 
            src="/images/green_teal_campaigns_bg.png" 
            alt="Emerald Sea Kelp" 
            className="card-artwork-blend"
          />
        </div>

        {/* Card 4: Weather Advisories (PURPLE VIOLET THEME) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(28, 20, 56, 0.85) 0%, rgba(16, 14, 40, 0.95) 100%)',
          border: '1px solid rgba(157, 78, 221, 0.35)',
          boxShadow: '0 8px 24px rgba(157, 78, 221, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(157, 78, 221, 0.2)', border: '1px solid rgba(157, 78, 221, 0.4)' }}>
            <Wind size={24} color="#9d4edd" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Sea Weather Advisories</span>
            <div className="stat-val">{activeAlerts.length}</div>
          </div>
          <img 
            src="/images/purple_coral_card_bg.png" 
            alt="Purple Coral" 
            className="card-artwork-blend"
          />
        </div>

      </div>

      {/* 3. MAIN SPLIT CONTENT ROW (2 COLS : 1 COL) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* LEFT COLUMN: WEATHER ALERTS + NEARBY CAMPAIGNS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* FUNCTIONALITY 1: WEATHER & MARINE ALERTS PANEL */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Wind size={20} color="#ffb703" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', fontWeight: '700' }}>
                  Live Marine Weather & Safety Advisories
                </h3>
              </div>
              <button 
                onClick={fetchDashboardData}
                style={{ background: 'none', border: 'none', color: '#ffb703', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={13} /> Refresh Feed
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeAlerts.map((alt) => (
                <div 
                  key={alt.alert_id} 
                  onClick={() => { setSelectedAlert(alt); setShowAlertModal(true); }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: alt.severity === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 183, 3, 0.1)',
                    border: alt.severity === 'High' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 183, 3, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <ShieldAlert size={16} color={alt.severity === 'High' ? '#ff4d4d' : '#ffb703'} />
                      <h5 style={{ margin: 0, fontSize: '0.92rem', color: '#ffffff', fontWeight: '700' }}>{alt.title}</h5>
                      <span className={`badge ${alt.severity === 'High' ? 'badge-emergency' : 'badge-pollution'}`} style={{ fontSize: '0.7rem' }}>
                        {alt.severity || 'Medium'} Severity
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1' }}>{alt.description}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {alt.radius_km && (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        📍 Radius: <strong style={{ color: '#00e5ff' }}>{alt.radius_km} km</strong>
                      </span>
                    )}
                    <ChevronRight size={16} color="#94a3b8" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FUNCTIONALITY 5: NEARBY CLEANUP CAMPAIGNS */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={20} color="#00f5d4" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', fontWeight: '700' }}>
                  Nearby Coastal Cleanup Drives
                </h3>
              </div>
              <button 
                onClick={() => navigate('/campaigns')}
                style={{ background: 'none', border: 'none', color: '#00f5d4', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                View All ({campaigns.length}) →
              </button>
            </div>

            {campaigns.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>No active cleanup drives scheduled right now.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {campaigns.slice(0, 4).map((cmp) => {
                  const isJoined = joinedCampaignIds.has(cmp.campaign_id);
                  const isJoining = joiningCampaignId === cmp.campaign_id;
                  return (
                    <div key={cmp.campaign_id} style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(8, 20, 42, 0.75)',
                      border: '1px solid rgba(0, 245, 212, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.94rem', color: '#ffffff', fontWeight: '700' }}>{cmp.title}</h4>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} color="#00e5ff" /> {cmp.location_name}
                        </p>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', gap: '10px' }}>
                          <span>📅 {new Date(cmp.date).toLocaleDateString()}</span>
                          <span>👥 {cmp.volunteer_count || 0} Volunteers</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <button 
                          onClick={() => handleJoinCampaign(cmp.campaign_id)}
                          className="btn btn-primary"
                          disabled={isJoined || isJoining}
                          style={{
                            flex: 1,
                            padding: '6px',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            background: isJoined ? '#10b981' : 'linear-gradient(135deg, #0284c7 0%, #00f5d4 100%)',
                            color: isJoined ? '#ffffff' : '#041126',
                            border: 'none',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          {isJoined ? <><Check size={13} /> Joined</> : isJoining ? 'Joining...' : 'Join Cleanup Drive'}
                        </button>
                        <button
                          onClick={() => { setSelectedCampaign(cmp); setShowCampaignModal(true); }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem', borderRadius: '6px' }}
                        >
                          <Info size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: MY OBSERVER REPORTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* MY FILED OBSERVER REPORTS & TRACKING */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', paddingBottom: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#00e5ff" />
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#ffffff', fontWeight: '700' }}>
                  My Observer Sightings & Tracking
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#00e5ff', fontWeight: '700' }}>
                {myReports.length} Logged
              </span>
            </div>

            {myReports.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', padding: '20px 10px' }}>
                No floating waste or emergency reports logged yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myReports.slice(0, 5).map((rep) => (
                  <div key={rep.report_id} style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(8, 20, 42, 0.8)',
                    border: '1px solid rgba(0, 229, 255, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.84rem', color: '#ffffff', fontWeight: '700' }}>{rep.title}</h5>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{rep.location_name}</span>
                    </div>
                    <button
                      onClick={() => handleOpenDetails(rep.report_id)}
                      className="btn btn-primary"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #0284c7 0%, #00e5ff 100%)',
                        color: '#041126',
                        borderRadius: '6px'
                      }}
                    >
                      Track
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 4. QUICK REPORT CREATION MODAL WITH PRESETS */}
      {showReportModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(4, 12, 26, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '640px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(12, 28, 54, 0.98) 0%, rgba(8, 20, 40, 0.99) 100%)',
            borderRadius: '20px',
            border: modalCategory === 'Emergency' ? '1px solid rgba(255, 77, 77, 0.4)' : '1px solid rgba(0, 229, 255, 0.3)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            position: 'relative',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {modalCategory === 'Emergency' ? <ShieldAlert size={22} color="#ff4d4d" /> : <Camera size={22} color="#00e5ff" />}
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff', fontWeight: '800' }}>
                  {modalCategory === 'Emergency' ? 'Report Emergency Incident at Sea' : 'Report Floating Marine Waste'}
                </h3>
              </div>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Quick Sighting Presets */}
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(0, 229, 255, 0.06)', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
              <span style={{ fontSize: '0.76rem', color: '#00e5ff', fontWeight: '700', display: 'block', marginBottom: '8px' }}>⚡ Quick Sighting Presets (1-Click Fill)</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => handleApplyPreset('plastic')} style={{ padding: '5px 10px', fontSize: '0.74rem', borderRadius: '6px', border: '1px solid rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.1)', color: '#ffffff', cursor: 'pointer' }}>🍾 Floating Plastics</button>
                <button type="button" onClick={() => handleApplyPreset('nets')} style={{ padding: '5px 10px', fontSize: '0.74rem', borderRadius: '6px', border: '1px solid rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.1)', color: '#ffffff', cursor: 'pointer' }}>🕸️ Ghost Nets</button>
                <button type="button" onClick={() => handleApplyPreset('oil')} style={{ padding: '5px 10px', fontSize: '0.74rem', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.15)', color: '#ff4d4d', cursor: 'pointer' }}>⛽ Oil Spill</button>
                <button type="button" onClick={() => handleApplyPreset('dead_life')} style={{ padding: '5px 10px', fontSize: '0.74rem', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.15)', color: '#ff4d4d', cursor: 'pointer' }}>🐋 Dead Marine Life</button>
              </div>
            </div>

            {formSuccess && <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '8px', fontSize: '0.84rem', marginBottom: '14px' }}>{formSuccess}</div>}
            {formError && <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '8px', fontSize: '0.84rem', marginBottom: '14px' }}>{formError}</div>}

            <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Incident / Sighting Title *</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="e.g. Floating Plastic Oil Drum / Oil Slick Sighting"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Category *</label>
                  <select 
                    className="form-control"
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value)}
                    style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)' }}
                  >
                    {categoriesList.map(c => (
                      <option key={c} value={c} style={{ background: '#08142a' }}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Waste / Hazard Type *</label>
                  <select 
                    className="form-control"
                    value={modalWasteType}
                    onChange={(e) => setModalWasteType(e.target.value)}
                    style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)' }}
                  >
                    {wasteTypesList.map(w => (
                      <option key={w} value={w} style={{ background: '#08142a' }}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Coastal Location Name / Fishing Route *</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="e.g. 5 NM off Kochi Harbour"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Latitude *</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="Auto-detected or enter"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Longitude *</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="Auto-detected or enter"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)' }}
                    required
                  />
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleDetectGPS} 
                style={{ background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.3)', padding: '6px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <MapPin size={14} /> Detect GPS Location Now
              </button>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Description Notes</label>
                <textarea 
                  className="form-control"
                  rows={3}
                  placeholder="Describe quantity, direction of flow, or marine hazards..."
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Photo Evidence</label>
                <input 
                  type="file" 
                  className="form-control" 
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', marginTop: '10px', background: modalCategory === 'Emergency' ? 'linear-gradient(135deg, #dc2626 0%, #ff4d4d 100%)' : 'linear-gradient(135deg, #0284c7 0%, #00e5ff 100%)', color: modalCategory === 'Emergency' ? '#ffffff' : '#041126', fontWeight: '700' }}
                disabled={submitting}
              >
                {submitting ? 'Submitting Report...' : modalCategory === 'Emergency' ? '🚨 Submit Emergency Report' : '🎣 Submit Debris Sighting'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 5. WEATHER ALERT DETAIL MODAL */}
      {showAlertModal && selectedAlert && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '580px',
            width: '100%',
            background: 'linear-gradient(135deg, rgba(12, 28, 54, 0.98) 0%, rgba(8, 20, 40, 0.99) 100%)',
            borderRadius: '20px',
            border: selectedAlert.severity === 'High' ? '1px solid rgba(255, 77, 77, 0.4)' : '1px solid rgba(255, 183, 3, 0.4)',
            padding: '24px',
            position: 'relative'
          }}>
            <button onClick={() => setShowAlertModal(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <ShieldAlert size={24} color={selectedAlert.severity === 'High' ? '#ff4d4d' : '#ffb703'} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff', fontWeight: '800' }}>{selectedAlert.title}</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>{selectedAlert.description}</p>
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0, 229, 255, 0.08)', borderRadius: '10px', fontSize: '0.82rem', color: '#00e5ff' }}>
              <p style={{ margin: '0 0 4px 0' }}>📍 <strong>Safety Radius:</strong> {selectedAlert.radius_km || 20} km</p>
              <p style={{ margin: 0 }}>🏛️ <strong>Issued By:</strong> {selectedAlert.issuer_name || 'Coast Guard Maritime Station'}</p>
            </div>
            <button onClick={() => setShowAlertModal(false)} className="btn btn-secondary" style={{ width: '100%', marginTop: '20px' }}>
              Close Safety Advisory
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 6. CAMPAIGN DETAIL MODAL */}
      {showCampaignModal && selectedCampaign && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '580px',
            width: '100%',
            background: 'linear-gradient(135deg, rgba(12, 28, 54, 0.98) 0%, rgba(8, 20, 40, 0.99) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(0, 245, 212, 0.4)',
            padding: '24px',
            position: 'relative'
          }}>
            <button onClick={() => setShowCampaignModal(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', color: '#ffffff', fontWeight: '800' }}>{selectedCampaign.title}</h3>
            <p style={{ fontSize: '0.86rem', color: '#00f5d4', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
              <MapPin size={14} /> {selectedCampaign.location_name}
            </p>
            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.5' }}>{selectedCampaign.description || 'Join local volunteers and fishermen in restoring our coastal shoreline.'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '16px 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              <div>📅 <strong>Date:</strong> {new Date(selectedCampaign.date).toLocaleDateString()}</div>
              <div>👥 <strong>Volunteers:</strong> {selectedCampaign.volunteer_count || 0} Registered</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={() => { handleJoinCampaign(selectedCampaign.campaign_id); setShowCampaignModal(false); }}
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #0284c7 0%, #00f5d4 100%)', color: '#041126', fontWeight: '700' }}
              >
                Confirm & Join Drive
              </button>
              <button onClick={() => setShowCampaignModal(false)} className="btn btn-secondary" style={{ padding: '10px 16px' }}>
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 7. DETAILS & LIVE STATUS TRACKING STEPPER MODAL */}
      {showDetailsModal && activeReportDetails && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            position: 'relative',
            padding: '24px'
          }}>
            <button 
              onClick={() => setShowDetailsModal(false)}
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              &times;
            </button>

            <h2 style={{ fontSize: '1.4rem', marginBottom: '8px', color: '#ffffff', fontWeight: '800' }}>
              {activeReportDetails.report.title}
            </h2>

            <span className={`badge ${activeReportDetails.report.report_category === 'Emergency' ? 'badge-emergency' : 'badge-pollution'}`} style={{ marginBottom: '14px' }}>
              {activeReportDetails.report.report_category}
            </span>

            {/* Stepper Timeline */}
            <div style={{ margin: '16px 0', padding: '16px', background: 'rgba(5, 18, 38, 0.85)', border: '1px solid rgba(0, 229, 255, 0.25)', borderRadius: '14px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} /> Live Observer Report Stepper
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981' }}>1. Filed</div>
                </div>
                <div style={{ padding: '8px', background: ['Verified', 'InProgress', 'Resolved', 'Completed'].includes(activeReportDetails.report.status) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 229, 255, 0.08)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#ffffff' }}>2. Review</div>
                </div>
                <div style={{ padding: '8px', background: ['InProgress', 'Resolved', 'Completed'].includes(activeReportDetails.report.status) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#ffffff' }}>3. Action</div>
                </div>
                <div style={{ padding: '8px', background: ['Resolved', 'Completed'].includes(activeReportDetails.report.status) ? 'rgba(0, 245, 212, 0.2)' : 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: ['Resolved', 'Completed'].includes(activeReportDetails.report.status) ? '#00f5d4' : '#64748b' }}>4. Resolved</div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', color: '#cbd5e1', margin: '14px 0' }}>
              <p><strong>Location:</strong> {activeReportDetails.report.location_name}</p>
              <p><strong>GPS:</strong> {parseFloat(activeReportDetails.report.latitude).toFixed(4)}, {parseFloat(activeReportDetails.report.longitude).toFixed(4)}</p>
              <p><strong>Waste Type:</strong> {activeReportDetails.report.waste_type}</p>
              <p><strong>Current Status:</strong> <span className={`badge badge-${activeReportDetails.report.status.toLowerCase()}`}>{activeReportDetails.report.status}</span></p>
            </div>

            <button onClick={() => setShowDetailsModal(false)} className="btn btn-secondary" style={{ width: '100%', marginTop: '16px' }}>
              Close
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default FishermanDashboard;
