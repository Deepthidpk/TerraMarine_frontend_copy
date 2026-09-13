import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Anchor, ShieldAlert, AlertOctagon, Camera, MapPin, Calendar, 
  Wind, Compass, Bell, CheckCircle, Clock, Info, X, Radio, Navigation, Eye, CheckCircle2, ChevronRight,
  RefreshCw, Send, AlertTriangle, Layers, Droplet, Fish, AlertCircle, FileText, Check, Filter, ExternalLink
} from 'lucide-react';
import {
  calculateMarineAlert,
  calculateWeatherAlert,
  calculateOverallSafety,
  parseBulletinValidity
} from '../utils/marineSafetyEvaluator';

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

  // 3. ENVIRONMENTAL ALERT DETAIL MODAL STATE (TerraMarine Alerts)
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);

  // 4. CAMPAIGN DETAIL MODAL STATE
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  // 5. JOINED CAMPAIGNS TRACKING STATE
  const [joinedCampaignIds, setJoinedCampaignIds] = useState(new Set());
  const [joiningCampaignId, setJoiningCampaignId] = useState(null);

  // 6. REAL-DATA IMD MARINE & COASTAL SAFETY STATE (STRICTLY LOCATION FILTERED)
  const [relevantData, setRelevantData] = useState(null);
  const [marineLoading, setMarineLoading] = useState(true);
  const [marineError, setMarineError] = useState('');
  const [selectedBulletin, setSelectedBulletin] = useState(null);
  const [showBulletinModal, setShowBulletinModal] = useState(false);

  const fetchMarineData = async (forceRefresh = false) => {
    setMarineLoading(true);
    setMarineError('');
    try {
      const url = forceRefresh ? '/fisherman/marine/relevant-alerts?refresh=true' : '/fisherman/marine/relevant-alerts';
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setRelevantData(data);
      } else {
        setMarineError('Location-specific marine information is currently unavailable.');
      }
    } catch (err) {
      console.error('Error fetching relevant IMD marine data:', err);
      setMarineError('Unable to retrieve location-specific IMD warnings.');
    } finally {
      setMarineLoading(false);
    }
  };

  useEffect(() => {
    fetchMarineData();
  }, [user?.location_coastal_area, user?.location_district]);

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

  // Fisherman's own active reported items
  const myReports = reports.filter(r => r.reported_by === user?.user_id && r.status === 'Pending');
  // TerraMarine environmental alerts (user/system submitted)
  const envAlerts = alerts || [];

  const getSimplifiedDisplay = (text, type) => {
    if (!text || text === 'N/A' || text === 'NIL') return <span style={{color: '#94a3b8'}}>N/A</span>;
    const str = String(text).toLowerCase();
    
    let icon = '';
    let simpleText = text;
    let color = '#cbd5e1';

    if (type === 'wind') {
      icon = '💨';
      const match = str.match(/(\d+)\s*(to|-)\s*(\d+)\s*knots?/i);
      const gustMatch = str.match(/gusting\s*to\s*(\d+)\s*knots?/i);
      if (match) {
        simpleText = `${match[1]}-${match[3]} Knots`;
        if (gustMatch) simpleText += ` (Gusts ${gustMatch[1]})`;
        
        const speed = parseInt(match[3]);
        if (speed > 25) color = '#ef4444';
        else if (speed > 15) color = '#f59e0b';
        else color = '#10b981';
      } else {
        simpleText = text.length > 40 ? text.substring(0, 37) + '...' : text;
      }
    } else if (type === 'sea') {
      icon = '🌊';
      if (str.includes('rough') || str.includes('high') || str.includes('very')) {
        simpleText = 'Rough (Dangerous)';
        color = '#ef4444';
      } else if (str.includes('moderate')) {
        simpleText = 'Moderate (Caution)';
        color = '#f59e0b';
      } else if (str.includes('slight') || str.includes('smooth')) {
        simpleText = 'Calm / Slight (Safe)';
        color = '#10b981';
      } else {
        simpleText = text.length > 30 ? text.substring(0, 27) + '...' : text;
      }
    } else if (type === 'weather') {
      icon = '🌧️';
      if (str.includes('thunder') || str.includes('squall')) {
        simpleText = 'Thunderstorms / Squall';
        color = '#ef4444';
        icon = '⛈️';
      } else if (str.includes('rain') || str.includes('shower')) {
        simpleText = 'Rain / Showers';
        color = '#3b82f6';
      } else if (str.includes('cloud')) {
        simpleText = 'Cloudy';
        color = '#94a3b8';
        icon = '☁️';
      } else if (str.includes('clear') || str.includes('fair')) {
        simpleText = 'Clear Skies';
        color = '#10b981';
        icon = '☀️';
      } else {
        simpleText = text.length > 30 ? text.substring(0, 27) + '...' : text;
      }
    } else if (type === 'visibility') {
      icon = '👁️';
      if (str.includes('very poor')) {
        simpleText = 'Very Poor';
        color = '#ef4444';
      } else if (str.includes('poor')) {
        simpleText = 'Poor Visibility';
        color = '#f59e0b';
      } else if (str.includes('moderate')) {
        simpleText = 'Moderate';
        color = '#fbbf24';
      } else if (str.includes('good')) {
        simpleText = 'Good Visibility';
        color = '#10b981';
      } else {
         simpleText = text.length > 30 ? text.substring(0, 27) + '...' : text;
      }
    } else if (type === 'portSignal') {
       icon = '🚩';
       if (str.includes('nil') || str === 'n/a') {
         simpleText = 'No Signal (Safe)';
         color = '#10b981';
       } else {
         simpleText = `Signal: ${text}`;
         color = '#ef4444';
       }
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span style={{ color: color, fontWeight: '700', fontSize: '0.85rem' }}>{simpleText}</span>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. HEADER WELCOME BANNER WITH QUICK REPORT ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '4px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: '#ffffff', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
            Welcome back, <span style={{ color: '#00e5ff' }}>{user.full_name}</span>!
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: '#94a3b8' }}>
            Real-time Coastal Safety & Floating Marine Pollution Monitoring Workspace
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
              boxShadow: '0 4px 16px rgba(255, 77, 77, 0.3)',
              border: 'none'
            }}
          >
            <AlertOctagon size={16} />
            <span>+ Report Emergency Sighting</span>
          </button>
        </div>
      </div>

      {/* REGISTERED COASTAL LOCATION BADGE & IMD COVERAGE ACTION */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(2, 132, 199, 0.15) 100%)',
        border: '1px solid rgba(0, 229, 255, 0.35)',
        borderRadius: '16px',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(0, 229, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00e5ff'
            }}>
              <MapPin size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#00e5ff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                YOUR REGISTERED FISHING ZONE
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                📍 {user?.location_coastal_area || relevantData?.location?.coastalArea || 'Ponnani Light House & Harbour'}
                <span style={{ fontSize: '0.86rem', fontWeight: 500, color: '#cbd5e1', marginLeft: '8px' }}>
                  ({user?.location_municipality || relevantData?.location?.municipality || 'Ponnani Municipality'}, {user?.location_district || relevantData?.location?.district || 'Malappuram'}, {user?.location_state || relevantData?.location?.state || 'Kerala'})
                </span>
              </div>
            </div>
          </div>

          <div style={{
            padding: '8px 16px',
            borderRadius: '12px',
            background: 'rgba(0, 229, 255, 0.12)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Compass size={18} color="#00e5ff" />
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IMD COVERAGE REGION</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#00e5ff' }}>
                🌊 {relevantData?.imdCoverage?.region || 'North Kerala Coast'}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/fisherman/location-setup?edit=true')}
          style={{
            padding: '9px 18px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(0, 229, 255, 0.4)',
            color: '#00e5ff',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <Navigation size={14} /> Edit Coastal Location
        </button>
      </div>

      {/* 2. REAL-DATA IMD MARINE & COASTAL SAFETY MODULE (PROMINENT SECTION) */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(8, 24, 48, 0.95) 0%, rgba(5, 18, 38, 0.98) 100%)', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
        
        {/* Module Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'rgba(0, 229, 255, 0.12)', borderRadius: '10px' }}>
                <Compass size={22} color="#00e5ff" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#ffffff', fontWeight: '800', letterSpacing: '-0.01em' }}>
                  🌊 Marine & Coastal Safety Module
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span>Source: <strong>India Meteorological Department (IMD)</strong></span>
                  <span>•</span>
                  <span>Govt. of India Official Forecast</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.8)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(0, 229, 255, 0.25)' }}>
              <Filter size={14} color="#00e5ff" />
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600' }}>IMD Coverage:</span>
              <span style={{ fontSize: '0.85rem', color: '#00e5ff', fontWeight: '800' }}>
                🌊 {relevantData?.imdCoverage?.region || 'North Kerala Coast'}
              </span>
            </div>

            <button
              onClick={() => fetchMarineData(true)}
              disabled={marineLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                color: '#00e5ff',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={13} className={marineLoading ? 'spin' : ''} />
              <span>{marineLoading ? 'Refreshing...' : 'Refresh IMD Data'}</span>
            </button>
          </div>
        </div>

        {/* 2.1 DETERMINISTIC DUAL LIGHT INDICATOR SYSTEM: MARINE ALERT & WEATHER ALERT */}
        {(() => {
          const renderTrafficLight = (level, size = 18) => {
            let color = '#22c55e';
            let glow = '0 0 16px rgba(34, 197, 94, 0.85)';
            if (level === 'RED') {
              color = '#ef4444';
              glow = '0 0 18px rgba(239, 68, 68, 0.95)';
            } else if (level === 'YELLOW') {
              color = '#f59e0b';
              glow = '0 0 16px rgba(245, 158, 11, 0.85)';
            } else if (level === 'UNAVAILABLE') {
              color = '#94a3b8';
              glow = '0 0 10px rgba(148, 163, 184, 0.4)';
            }

            return (
              <div
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  backgroundColor: color,
                  boxShadow: glow,
                  flexShrink: 0,
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              />
            );
          };

          // 1. Check if server already evaluated alerts
          let marineAlert = relevantData?.marineAlert;
          let weatherAlert = relevantData?.weatherAlert;
          let overallStatus = relevantData?.overallStatus;
          let validity = relevantData?.validity;

          // 2. Client-side deterministic evaluation fallback if backend payload was from cache or missing fields
          if (!marineAlert && (relevantData?.relevantSeaBulletin || relevantData?.relevantCoastalBulletin)) {
            const locObj = {
              state: user?.location_state || relevantData?.location?.state || 'Kerala',
              district: user?.location_district || relevantData?.location?.district || 'Malappuram',
              municipality: user?.location_municipality || relevantData?.location?.municipality || 'Ponnani Municipality',
              coastalArea: user?.location_coastal_area || relevantData?.location?.coastalArea || 'Ponnani Light House & Harbour'
            };
            const covObj = relevantData?.imdCoverage || { region: 'North Kerala Coast', state: 'Kerala' };
            
            marineAlert = calculateMarineAlert({
              coastalBulletin: relevantData?.relevantCoastalBulletin,
              seaBulletin: relevantData?.relevantSeaBulletin,
              portWarning: relevantData?.relevantPortWarning,
              location: locObj,
              coverage: covObj
            });

            weatherAlert = calculateWeatherAlert({
              coastalBulletin: relevantData?.relevantCoastalBulletin,
              seaBulletin: relevantData?.relevantSeaBulletin,
              location: locObj,
              coverage: covObj
            });

            overallStatus = calculateOverallSafety(marineAlert, weatherAlert);

            const coastalValidity = relevantData?.relevantCoastalBulletin ? parseBulletinValidity(relevantData?.relevantCoastalBulletin) : null;
            const seaValidity = relevantData?.relevantSeaBulletin ? parseBulletinValidity(relevantData?.relevantSeaBulletin) : null;
            validity = coastalValidity || seaValidity;
          }

          const mLevel = marineError ? 'UNAVAILABLE' : (marineAlert?.level || 'UNAVAILABLE');
          const wLevel = marineError ? 'UNAVAILABLE' : (weatherAlert?.level || 'UNAVAILABLE');
          const oLevel = marineError ? 'UNAVAILABLE' : (overallStatus?.level || 'UNAVAILABLE');

          return (
            <>
              {/* Dual Alert Indicators Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                
                {/* 🌊 MARINE ALERT CARD */}
                <div style={{
                  padding: '20px',
                  borderRadius: '16px',
                  background: mLevel === 'RED' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)' :
                              mLevel === 'YELLOW' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)' :
                              mLevel === 'GREEN' ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)' :
                              'linear-gradient(135deg, rgba(148, 163, 184, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  border: `1px solid ${mLevel === 'RED' ? '#ef4444' : mLevel === 'YELLOW' ? '#f59e0b' : mLevel === 'GREEN' ? '#22c55e' : '#94a3b8'}60`,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.3rem' }}>🌊</span>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: '800', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                          Marine Alert
                        </h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {renderTrafficLight(mLevel, 16)}
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          background: `${mLevel === 'RED' ? '#ef4444' : mLevel === 'YELLOW' ? '#f59e0b' : mLevel === 'GREEN' ? '#22c55e' : '#94a3b8'}25`,
                          color: mLevel === 'RED' ? '#ef4444' : mLevel === 'YELLOW' ? '#f59e0b' : mLevel === 'GREEN' ? '#22c55e' : '#94a3b8',
                          border: `1px solid ${mLevel === 'RED' ? '#ef4444' : mLevel === 'YELLOW' ? '#f59e0b' : mLevel === 'GREEN' ? '#22c55e' : '#94a3b8'}50`
                        }}>
                          {mLevel === 'RED' ? '🔴 RED' : mLevel === 'YELLOW' ? '🟡 YELLOW' : mLevel === 'GREEN' ? '🟢 GREEN' : '⚪ DATA UNAVAILABLE'}
                        </span>
                      </div>
                    </div>

                    {/* Status & Reason */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '900',
                        color: mLevel === 'RED' ? '#ef4444' : mLevel === 'YELLOW' ? '#f59e0b' : mLevel === 'GREEN' ? '#22c55e' : '#cbd5e1',
                        letterSpacing: '-0.01em',
                        marginBottom: '6px'
                      }}>
                        {marineError ? 'DATA UNAVAILABLE' : marineAlert?.label || (mLevel === 'GREEN' ? 'SAFE TO GO TO SEA' : mLevel === 'YELLOW' ? 'CAUTION' : mLevel === 'RED' ? 'DO NOT GO TO SEA' : 'DATA UNAVAILABLE')}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                        {marineError ? 'Unable to retrieve current official IMD conditions.' : (marineAlert?.reason || (mLevel === 'GREEN' ? 'No significant official marine hazard detected for your registered area.' : 'Current official marine information could not be verified.'))}
                      </p>
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '14px', fontSize: '0.74rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span>Source: <strong style={{ color: '#cbd5e1' }}>IMD</strong></span>
                    <span>Valid Until: <strong style={{ color: '#00e5ff' }}>{marineAlert?.formattedValidUntil || validity?.formattedValidUntil || 'Current Cycle'}</strong></span>
                  </div>
                </div>

                {/* ☁️ WEATHER ALERT CARD */}
                <div style={{
                  padding: '20px',
                  borderRadius: '16px',
                  background: wLevel === 'RED' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)' :
                              wLevel === 'YELLOW' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)' :
                              wLevel === 'GREEN' ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)' :
                              'linear-gradient(135deg, rgba(148, 163, 184, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  border: `1px solid ${wLevel === 'RED' ? '#ef4444' : wLevel === 'YELLOW' ? '#f59e0b' : wLevel === 'GREEN' ? '#22c55e' : '#94a3b8'}60`,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.3rem' }}>☁️</span>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: '800', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                          Weather Alert
                        </h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {renderTrafficLight(wLevel, 16)}
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          background: `${wLevel === 'RED' ? '#ef4444' : wLevel === 'YELLOW' ? '#f59e0b' : wLevel === 'GREEN' ? '#22c55e' : '#94a3b8'}25`,
                          color: wLevel === 'RED' ? '#ef4444' : wLevel === 'YELLOW' ? '#f59e0b' : wLevel === 'GREEN' ? '#22c55e' : '#94a3b8',
                          border: `1px solid ${wLevel === 'RED' ? '#ef4444' : wLevel === 'YELLOW' ? '#f59e0b' : wLevel === 'GREEN' ? '#22c55e' : '#94a3b8'}50`
                        }}>
                          {wLevel === 'RED' ? '🔴 RED' : wLevel === 'YELLOW' ? '🟡 YELLOW' : wLevel === 'GREEN' ? '🟢 GREEN' : '⚪ DATA UNAVAILABLE'}
                        </span>
                      </div>
                    </div>

                    {/* Status & Reason */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '900',
                        color: wLevel === 'RED' ? '#ef4444' : wLevel === 'YELLOW' ? '#f59e0b' : wLevel === 'GREEN' ? '#22c55e' : '#cbd5e1',
                        letterSpacing: '-0.01em',
                        marginBottom: '6px'
                      }}>
                        {marineError ? 'DATA UNAVAILABLE' : weatherAlert?.label || (wLevel === 'GREEN' ? 'SAFE TO GO TO SEA' : wLevel === 'YELLOW' ? 'CAUTION' : wLevel === 'RED' ? 'DO NOT GO TO SEA' : 'DATA UNAVAILABLE')}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                        {marineError ? 'Unable to retrieve current official IMD conditions.' : (weatherAlert?.reason || (wLevel === 'GREEN' ? 'No significant official weather hazard detected for your registered area.' : 'Current official weather information could not be verified.'))}
                      </p>
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '14px', fontSize: '0.74rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span>Source: <strong style={{ color: '#cbd5e1' }}>IMD</strong></span>
                    <span>Valid Until: <strong style={{ color: '#00e5ff' }}>{weatherAlert?.formattedValidUntil || validity?.formattedValidUntil || 'Current Cycle'}</strong></span>
                  </div>
                </div>

              </div>

              {/* OVERALL SAFETY STATUS BANNER */}
              <div style={{
                padding: '16px 20px',
                borderRadius: '14px',
                background: oLevel === 'RED' ? 'rgba(239, 68, 68, 0.15)' :
                            oLevel === 'YELLOW' ? 'rgba(245, 158, 11, 0.15)' :
                            oLevel === 'GREEN' ? 'rgba(34, 197, 94, 0.15)' :
                            'rgba(148, 163, 184, 0.12)',
                border: `1px solid ${oLevel === 'RED' ? '#ef4444' : oLevel === 'YELLOW' ? '#f59e0b' : oLevel === 'GREEN' ? '#22c55e' : '#94a3b8'}60`,
                marginBottom: '22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {renderTrafficLight(oLevel, 18)}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        OVERALL STATUS:
                      </span>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', color: oLevel === 'RED' ? '#ef4444' : oLevel === 'YELLOW' ? '#f59e0b' : oLevel === 'GREEN' ? '#22c55e' : '#cbd5e1', fontWeight: '900' }}>
                        {oLevel === 'RED' ? '🔴 DO NOT GO TO SEA' : oLevel === 'YELLOW' ? '🟡 PROCEED WITH CAUTION' : oLevel === 'GREEN' ? '🟢 NO SIGNIFICANT OFFICIAL HAZARD' : '⚪ INFORMATION UNAVAILABLE'}
                      </h4>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#cbd5e1' }}>
                      {marineError ? 'Unable to verify current official IMD conditions. Check official VHF/coastal broadcasts.' : (overallStatus?.message || (oLevel === 'GREEN' ? 'No significant official hazards detected. Safe to venture to sea.' : 'Proceed with caution.'))}
                    </p>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>
                  <div>Source: <strong style={{ color: '#00e5ff' }}>India Meteorological Department (IMD)</strong></div>
                  <div>Updated: <strong style={{ color: '#ffffff' }}>{relevantData?.retrievedAt ? new Date(relevantData.retrievedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</strong></div>
                  <div>Valid Until: <strong style={{ color: '#00e5ff' }}>{validity?.formattedValidUntil || 'Current cycle'}</strong></div>
                </div>
              </div>
            </>
          );
        })()}

        {/* Bulletins Section: Strictly Filtered Relevant Coastal & Sea Area Bulletins */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* Relevant Coastal Bulletin Card */}
          <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(8, 20, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', paddingBottom: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Navigation size={18} color="#00f5d4" />
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#ffffff', fontWeight: '700' }}>
                  Applicable Coastal Bulletin ({relevantData?.counts?.coastal || 0})
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#00f5d4', fontWeight: '700' }}>IMD Official</span>
            </div>

            {!relevantData?.relevantCoastalBulletin ? (
              <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                  No active coastal bulletin found specifically for <strong>{relevantData?.imdCoverage?.region || 'your area'}</strong>.
                </p>
              </div>
            ) : (
              <div 
                onClick={() => { setSelectedBulletin(relevantData.relevantCoastalBulletin); setShowBulletinModal(true); }}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(0, 245, 212, 0.3)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#00f5d4' }}>
                    ⚓ {relevantData.relevantCoastalBulletin.layer}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    {relevantData.relevantCoastalBulletin.issuedBy}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem', marginBottom: '10px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Wind</div>
                    {getSimplifiedDisplay(relevantData.relevantCoastalBulletin.wind, 'wind')}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Sea Condition</div>
                    {getSimplifiedDisplay(relevantData.relevantCoastalBulletin.seaCondition, 'sea')}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Weather</div>
                    {getSimplifiedDisplay(relevantData.relevantCoastalBulletin.weather, 'weather')}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Port Signal</div>
                    {getSimplifiedDisplay(relevantData.relevantCoastalBulletin.portSignal, 'portSignal')}
                  </div>
                </div>

                {relevantData.relevantCoastalBulletin.warning && relevantData.relevantCoastalBulletin.warning !== 'NIL' && (
                  <div style={{ fontSize: '0.78rem', color: '#ffb703', background: 'rgba(255, 183, 3, 0.12)', padding: '8px 10px', borderRadius: '8px', marginTop: '6px' }}>
                    ⚠️ <strong>Official Warning:</strong> {relevantData.relevantCoastalBulletin.warning}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.74rem', color: '#64748b' }}>
                  <span>Source: India Meteorological Department</span>
                  <span style={{ color: '#00f5d4', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>View Full Details <ChevronRight size={13} /></span>
                </div>
              </div>
            )}
          </div>

          {/* Relevant Sea Area Bulletin Card */}
          <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(8, 20, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', paddingBottom: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wind size={18} color="#00e5ff" />
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#ffffff', fontWeight: '700' }}>
                  Applicable Sea Area Bulletin ({relevantData?.counts?.seaArea || 0})
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#00e5ff', fontWeight: '700' }}>IMD Official</span>
            </div>

            {!relevantData?.relevantSeaBulletin ? (
              <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                  No active sea-area bulletin match for your coverage region.
                </p>
              </div>
            ) : (
              <div 
                onClick={() => { setSelectedBulletin(relevantData.relevantSeaBulletin); setShowBulletinModal(true); }}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#00e5ff' }}>
                    📍 {relevantData.relevantSeaBulletin.layer}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    {relevantData.relevantSeaBulletin.issuedBy}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem', marginBottom: '10px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Wind</div>
                    {getSimplifiedDisplay(relevantData.relevantSeaBulletin.wind, 'wind')}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Sea Condition</div>
                    {getSimplifiedDisplay(relevantData.relevantSeaBulletin.seaCondition, 'sea')}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Weather</div>
                    {getSimplifiedDisplay(relevantData.relevantSeaBulletin.weather, 'weather')}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Visibility</div>
                    {getSimplifiedDisplay(relevantData.relevantSeaBulletin.visibility, 'visibility')}
                  </div>
                </div>

                {relevantData.relevantSeaBulletin.warning && relevantData.relevantSeaBulletin.warning !== 'NIL' && (
                  <div style={{ fontSize: '0.78rem', color: '#ffb703', background: 'rgba(255, 183, 3, 0.12)', padding: '8px 10px', borderRadius: '8px', marginTop: '6px' }}>
                    ⚠️ <strong>Official Warning:</strong> {relevantData.relevantSeaBulletin.warning}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.74rem', color: '#64748b' }}>
                  <span>Source: India Meteorological Department</span>
                  <span style={{ color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>View Full Details <ChevronRight size={13} /></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. MAIN SPLIT CONTENT ROW: TERRAMARINE ENVIRONMENTAL ALERTS & NEARBY CAMPAIGNS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* LEFT COLUMN: TERRAMARINE USER ENVIRONMENTAL ALERTS + NEARBY CAMPAIGNS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TERRAMARINE PLATFORM ENVIRONMENTAL ALERTS (SEPARATE FROM GOVT IMD ALERTS) */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={20} color="#00e5ff" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff', fontWeight: '700' }}>
                    TerraMarine User & Platform Incident Alerts
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Source: TerraMarine Observers & Coastal Reports</span>
                </div>
              </div>
              <button 
                onClick={fetchDashboardData}
                style={{ background: 'none', border: 'none', color: '#00e5ff', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {envAlerts.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                No active environmental hazards or debris warnings reported on TerraMarine platform.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {envAlerts.map((alt) => (
                  <div 
                    key={alt.alert_id} 
                    onClick={() => { setSelectedAlert(alt); setShowAlertModal(true); }}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: alt.severity === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 229, 255, 0.08)',
                      border: alt.severity === 'High' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(0, 229, 255, 0.3)',
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
                        <AlertTriangle size={16} color={alt.severity === 'High' ? '#ff4d4d' : '#00e5ff'} />
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
            )}
          </div>

          {/* NEARBY CLEANUP CAMPAIGNS */}
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

        {/* RIGHT COLUMN: MY OBSERVER REPORTS & NOTIFICATIONS */}
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

          {/* MARITIME NOTIFICATIONS */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', paddingBottom: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="#00e5ff" />
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#ffffff', fontWeight: '700' }}>
                  Safety & IMD Broadcasts
                </h3>
              </div>
              {notifications.length > 0 && (
                <button 
                  onClick={handleClearAllNotifications}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  Clear All
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', padding: '20px 10px' }}>
                No active notifications right now.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.slice(0, 5).map((notif) => (
                  <div key={notif.notification_id} style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: notif.reference_type === 'IMD_Marine_Bulletin' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(8, 20, 42, 0.8)',
                    border: notif.reference_type === 'IMD_Marine_Bulletin' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(0, 229, 255, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.82rem', color: '#ffffff', fontWeight: '700' }}>{notif.title}</h5>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#cbd5e1' }}>{notif.message}</p>
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <button
                      onClick={() => handleDismissNotification(notif.notification_id)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* --- PORTAL MODALS --- */}

      {/* 4. OBSERVER REPORT LOGGING MODAL */}
      {showReportModal && createPortal(
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
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(12, 28, 54, 0.98) 0%, rgba(8, 20, 40, 0.99) 100%)',
            borderRadius: '20px',
            border: modalCategory === 'Emergency' ? '1px solid rgba(255, 77, 77, 0.4)' : '1px solid rgba(0, 229, 255, 0.4)',
            padding: '24px',
            position: 'relative'
          }}>
            <button onClick={() => setShowReportModal(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              {modalCategory === 'Emergency' ? <AlertOctagon size={24} color="#ff4d4d" /> : <Camera size={24} color="#00e5ff" />}
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff', fontWeight: '800' }}>
                {modalCategory === 'Emergency' ? 'Log Marine Emergency Encounter' : 'Log Floating Waste Sighting'}
              </h3>
            </div>

            {formError && <div className="alert alert-danger" style={{ fontSize: '0.8rem', padding: '8px 12px', marginBottom: '12px' }}>{formError}</div>}
            {formSuccess && <div className="alert alert-success" style={{ fontSize: '0.8rem', padding: '8px 12px', marginBottom: '12px' }}>{formSuccess}</div>}

            <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={reportTitle} 
                  onChange={(e) => setReportTitle(e.target.value)} 
                  style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Category</label>
                  <select 
                    className="form-control" 
                    value={modalCategory} 
                    onChange={(e) => setModalCategory(e.target.value)}
                    style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)' }}
                  >
                    {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Incident Type</label>
                  <select 
                    className="form-control" 
                    value={modalWasteType} 
                    onChange={(e) => setModalWasteType(e.target.value)}
                    style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)' }}
                  >
                    {wasteTypesList.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Location / Coastal Zone</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={locationName} 
                  onChange={(e) => setLocationName(e.target.value)} 
                  style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Latitude</label>
                  <input type="text" className="form-control" value={latitude} onChange={(e) => setLatitude(e.target.value)} style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Longitude</label>
                  <input type="text" className="form-control" value={longitude} onChange={(e) => setLongitude(e.target.value)} style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)' }} />
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

      {/* 5. TERRAMARINE ENVIRONMENTAL ALERT DETAIL MODAL */}
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
            border: selectedAlert.severity === 'High' ? '1px solid rgba(255, 77, 77, 0.4)' : '1px solid rgba(0, 229, 255, 0.4)',
            padding: '24px',
            position: 'relative'
          }}>
            <button onClick={() => setShowAlertModal(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <ShieldAlert size={24} color={selectedAlert.severity === 'High' ? '#ff4d4d' : '#00e5ff'} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff', fontWeight: '800' }}>{selectedAlert.title}</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>{selectedAlert.description}</p>
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0, 229, 255, 0.08)', borderRadius: '10px', fontSize: '0.82rem', color: '#00e5ff' }}>
              <p style={{ margin: '0 0 4px 0' }}>📍 <strong>Safety Radius:</strong> {selectedAlert.radius_km || 20} km</p>
              <p style={{ margin: 0 }}>🏛️ <strong>Issuer:</strong> {selectedAlert.issuer_name || 'TerraMarine Observer Network'}</p>
            </div>
            <button onClick={() => setShowAlertModal(false)} className="btn btn-secondary" style={{ width: '100%', marginTop: '20px' }}>
              Close Alert
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 6. IMD BULLETIN DETAILED INSPECTION MODAL */}
      {showBulletinModal && selectedBulletin && createPortal(
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
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(8, 24, 48, 0.98) 0%, rgba(5, 18, 38, 0.99) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(0, 229, 255, 0.4)',
            padding: '24px',
            position: 'relative'
          }}>
            <button onClick={() => setShowBulletinModal(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Compass size={24} color="#00e5ff" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff', fontWeight: '800' }}>
                  {selectedBulletin.bulletinType === 'SEA_AREA' ? 'Sea Area Bulletin' : 'Coastal Bulletin'} — {selectedBulletin.layer}
                </h3>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  Issued By: {selectedBulletin.issuedBy} | Source: India Meteorological Department (IMD)
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '12px', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '16px' }}>
              <div>💨 <strong>Wind:</strong> {selectedBulletin.wind || 'N/A'}</div>
              <div>🌊 <strong>Sea Condition:</strong> {selectedBulletin.seaCondition || 'N/A'}</div>
              <div>🌧️ <strong>Weather:</strong> {selectedBulletin.weather || 'N/A'}</div>
              <div>👁️ <strong>Visibility:</strong> {selectedBulletin.visibility || 'N/A'}</div>
              {selectedBulletin.portSignal && <div>🚩 <strong>Port Signal:</strong> {selectedBulletin.portSignal}</div>}
              {selectedBulletin.validFrom && <div style={{ gridColumn: 'span 2' }}>📅 <strong>Validity:</strong> {selectedBulletin.validFrom}</div>}
            </div>

            {selectedBulletin.warning && selectedBulletin.warning !== 'NIL' && (
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', marginBottom: '16px' }}>
                <h5 style={{ margin: '0 0 4px 0', fontSize: '0.88rem', color: '#ff4d4d', fontWeight: '800' }}>⚠️ Official Warning Details</h5>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#fca5a5' }}>{selectedBulletin.warning}</p>
              </div>
            )}

            {selectedBulletin.synopticSituation && selectedBulletin.synopticSituation !== 'NIL' && (
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0, 229, 255, 0.08)', border: '1px solid rgba(0, 229, 255, 0.2)', marginBottom: '16px' }}>
                <h5 style={{ margin: '0 0 4px 0', fontSize: '0.88rem', color: '#00e5ff', fontWeight: '800' }}>🌀 Synoptic Situation</h5>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.4' }}>{selectedBulletin.synopticSituation}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>
              <span>Updated: {selectedBulletin.updateTime || 'Latest Broadcast'}</span>
              <a href="https://mausam.imd.gov.in/responsive/marine_forecast.php" target="_blank" rel="noopener noreferrer" style={{ color: '#00e5ff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View on IMD Portal <ExternalLink size={12} />
              </a>
            </div>

            <button onClick={() => setShowBulletinModal(false)} className="btn btn-secondary" style={{ width: '100%', marginTop: '20px' }}>
              Close Bulletin Details
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 7. CAMPAIGN DETAIL MODAL */}
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

      {/* 8. DETAILS & LIVE STATUS TRACKING STEPPER MODAL */}
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
