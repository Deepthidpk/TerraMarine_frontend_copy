import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, MapPin, Users, Award, Shield, Check, Info, 
  PlusCircle, X, Search, Filter, Clock, Sparkles, Compass, CheckCircle2, RotateCcw, AlertCircle
} from 'lucide-react';
import LeafletMap from '../components/LeafletMap';
import CustomTimePicker from '../components/CustomTimePicker';
import CustomDatePicker from '../components/CustomDatePicker';
import CertificateModal from '../components/CertificateModal';

const Campaigns = () => {
  const { user, authFetch } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Organize Form
  const [showFormModal, setShowFormModal] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form state (NGO / Authority / Admin)
  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [campaignDate, setCampaignDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [maxVolunteers, setMaxVolunteers] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Volunteer History & Certificates State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [myHistory, setMyHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [joinedCampaignIds, setJoinedCampaignIds] = useState(new Set());

  const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const parts = timeStr.split(' ');
      const [h, m] = parts[0].split(':').map(Number);
      let hour24 = h;
      if (parts[1] === 'PM' && h < 12) hour24 += 12;
      if (parts[1] === 'AM' && h === 12) hour24 = 0;
      return hour24 * 60 + m;
    }
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Live real-time single field validator
  const validateField = (fieldName, value) => {
    const today = new Date().toISOString().slice(0, 10);
    const maxDateObj = new Date();
    maxDateObj.setFullYear(maxDateObj.getFullYear() + 1);
    const maxDate = maxDateObj.toISOString().slice(0, 10);

    const alphaRegex = /[a-zA-Z]/;
    const symbolOnlyRegex = /^[^a-zA-Z0-9]+$/;

    switch (fieldName) {
      case 'campaignName':
        if (!value || !value.trim()) return 'Campaign name is required.';
        if (symbolOnlyRegex.test(value.trim()) || !alphaRegex.test(value)) return 'Must contain valid words (e.g. Fort Kochi Drive).';
        if (value.trim().length < 5) return 'Must be at least 5 characters.';
        if (value.trim().length > 100) return 'Cannot exceed 100 characters.';
        return null;

      case 'description':
        if (value && value.trim()) {
          if (symbolOnlyRegex.test(value.trim()) || !alphaRegex.test(value)) return 'Must contain valid sentences/words.';
          if (value.trim().length < 10) return 'Must be at least 10 characters if provided.';
        }
        return null;

      case 'campaignDate':
        if (!value) return 'Campaign date is required.';
        if (value < today) return 'Date cannot be in the past.';
        if (value > maxDate) return 'Campaign date must be within 1 year from today.';
        return null;

      case 'startTime': {
        if (!value) return 'Start time is required.';
        const mins = toMinutes(value);
        if (campaignDate === today) {
          const now = new Date();
          const currentMins = now.getHours() * 60 + now.getMinutes();
          if (mins < currentMins) return 'Start time cannot be in the past for today.';
        }
        if (mins < 360 || mins > 1080) return 'Must be between 6:00 AM & 6:00 PM.';
        return null;
      }

      case 'endTime': {
        if (!value) return 'End time is required.';
        const mins = toMinutes(value);
        const startMins = toMinutes(startTime);
        if (campaignDate === today) {
          const now = new Date();
          const currentMins = now.getHours() * 60 + now.getMinutes();
          if (mins < currentMins) return 'End time cannot be in the past for today.';
        }
        if (mins < 360 || mins > 1080) return 'Must be between 6:00 AM & 6:00 PM.';
        if (startTime && mins <= startMins) return 'End time must be after start time.';
        return null;
      }

      case 'location':
        if (!value || !value.trim()) return 'Location name is required.';
        if (symbolOnlyRegex.test(value.trim()) || !alphaRegex.test(value)) return 'Must contain valid location name.';
        if (value.trim().length < 3) return 'Must be at least 3 characters.';
        return null;

      case 'latitude':
        if (!value) return 'Latitude is required (click map).';
        const lat = parseFloat(value);
        if (isNaN(lat) || lat < -90 || lat > 90) return 'Lat must be -90 to 90.';
        return null;

      case 'longitude':
        if (!value) return 'Longitude is required (click map).';
        const lng = parseFloat(value);
        if (isNaN(lng) || lng < -180 || lng > 180) return 'Lng must be -180 to 180.';
        return null;

      case 'maxVolunteers':
        if (!value) return 'Volunteer limit is required.';
        const limit = parseInt(value, 10);
        if (isNaN(limit) || limit < 1) return 'Must be at least 1 volunteer.';
        if (limit > 100) return 'Limit cannot exceed 100 volunteers.';
        return null;

      default:
        return null;
    }
  };

  // Auto-dismiss notifications after 2 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Details Modal State
  const [activeCampaignDetails, setActiveCampaignDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState({});

  const fetchCampaigns = async () => {
    try {
      const res = await authFetch('/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
      }

      try {
        const historyRes = await authFetch('/campaigns/my-history');
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          const joinedIds = new Set((historyData.history || []).map(h => h.campaign_id));
          setJoinedCampaignIds(joinedIds);
        }
      } catch (hErr) {
        console.error('History fetch warning:', hErr);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  const handleMapClick = (lat, lng) => {
    const latStr = lat.toFixed(6);
    const lngStr = lng.toFixed(6);
    setLatitude(latStr);
    setLongitude(lngStr);
    setSelectedCoords({ lat, lng });

    const latErr = validateField('latitude', latStr);
    const lngErr = validateField('longitude', lngStr);
    setFormErrors(prev => ({
      ...prev,
      latitude: latErr,
      longitude: lngErr
    }));
  };

  const handleCreateCampaignSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSuccess('');

    // Validate all fields
    const errors = {
      campaignName: validateField('campaignName', campaignName),
      description: validateField('description', description),
      campaignDate: validateField('campaignDate', campaignDate),
      startTime: validateField('startTime', startTime),
      endTime: validateField('endTime', endTime),
      location: validateField('location', location),
      latitude: validateField('latitude', latitude),
      longitude: validateField('longitude', longitude),
      maxVolunteers: validateField('maxVolunteers', maxVolunteers)
    };

    const activeErrors = {};
    Object.keys(errors).forEach(k => {
      if (errors[k]) activeErrors[k] = errors[k];
    });

    if (Object.keys(activeErrors).length > 0) {
      setFormErrors(activeErrors);
      setModalError('Please fix validation errors before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await authFetch('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          campaign_name: campaignName.trim(),
          description: description.trim(),
          campaign_date: campaignDate,
          start_time: startTime || null,
          end_time: endTime || null,
          location: location.trim(),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          maximum_volunteers: parseInt(maxVolunteers)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create campaign.');
      }

      setSuccess('Cleanup campaign organized successfully!');
      // Reset form & close modal
      setCampaignName('');
      setDescription('');
      setCampaignDate('');
      setStartTime('');
      setEndTime('');
      setLocation('');
      setLatitude('');
      setLongitude('');
      setSelectedCoords(null);
      setMaxVolunteers('');
      setFormErrors({});
      setModalError('');
      setShowFormModal(false);

      fetchCampaigns();
    } catch (err) {
      setModalError(err.message || 'Error occurred while saving campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinCampaign = async (campaignId) => {
    setError('');
    setSuccess('');
    try {
      const res = await authFetch(`/campaigns/${campaignId}/join`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        if (data.error && data.error.includes('already registered')) {
          setJoinedCampaignIds(prev => new Set([...prev, campaignId]));
          setCampaigns(prev => prev.map(c => c.campaign_id === campaignId ? { ...c, is_joined: true } : c));
          setError('You have already registered for this campaign.');
        } else {
          throw new Error(data.error || 'Could not join campaign.');
        }
      } else {
        setJoinedCampaignIds(prev => new Set([...prev, campaignId]));
        setCampaigns(prev => prev.map(c => c.campaign_id === campaignId ? { ...c, is_joined: true, volunteer_count: (parseInt(c.volunteer_count) || 0) + 1 } : c));
        setSuccess('You have registered for the cleanup drive successfully!');
      }

      fetchCampaigns();
    } catch (err) {
      if (err.message && err.message.includes('already registered')) {
        setJoinedCampaignIds(prev => new Set([...prev, campaignId]));
        setCampaigns(prev => prev.map(c => c.campaign_id === campaignId ? { ...c, is_joined: true } : c));
        setError('You have already registered for this campaign.');
      } else {
        setError(err.message || 'Failed to join campaign.');
      }
    }
  };

  const handleOpenHistory = async () => {
    setHistoryLoading(true);
    setShowHistoryModal(true);
    try {
      const res = await authFetch('/campaigns/my-history');
      if (res.ok) {
        const data = await res.json();
        setMyHistory(data.history || []);
      }
    } catch (err) {
      console.error('Error fetching my history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenDetails = async (campaignId) => {
    try {
      const res = await authFetch(`/campaigns/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveCampaignDetails(data);
        setShowDetailsModal(true);
      }
    } catch (err) {
      console.error('Error fetching campaign details:', err);
    }
  };

  const handleUpdateAttendance = async (campaignId, volunteerId, attendanceVal, certVal) => {
    const key = `${volunteerId}-${attendanceVal ? 'att' : 'cert'}`;
    setAttendanceLoading(prev => ({ ...prev, [key]: true }));
    setError('');

    try {
      const res = await authFetch(`/campaigns/${campaignId}/attendance`, {
        method: 'PUT',
        body: JSON.stringify({
          volunteer_id: volunteerId,
          attendance: attendanceVal,
          certificate_status: certVal
        })
      });

      if (res.ok) {
        const detailRes = await authFetch(`/campaigns/${campaignId}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          setActiveCampaignDetails(detailData);
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update volunteer records.');
      }
    } catch (err) {
      console.error('Update volunteer attendance error:', err);
    } finally {
      setAttendanceLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((camp) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = camp.campaign_name?.toLowerCase().includes(q);
      const locMatch = camp.location?.toLowerCase().includes(q);
      const orgMatch = (camp.organization_name || camp.creator_name)?.toLowerCase().includes(q);
      if (!nameMatch && !locMatch && !orgMatch) return false;
    }

    if (statusFilter !== 'All' && camp.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Calculate Summary Statistics
  const totalDrives = campaigns.length;
  const upcomingDrives = campaigns.filter(c => c.status === 'Upcoming').length;
  const totalVolunteers = campaigns.reduce((sum, c) => sum + (parseInt(c.volunteer_count) || 0), 0);
  const completedDrives = campaigns.filter(c => c.status === 'Completed').length;

  const isOrganizeRole = ['NGO', 'Authority', 'Admin'].includes(user.role);

  return (
    <div>
      {/* Header Banner & Action Button at Top Right Corner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', margin: 0, fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff' }}>
            <span>Cleanup Campaigns</span>
            <Sparkles size={24} color="#00e5ff" />
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginLeft: 'auto' }}>
          {['Volunteer', 'Citizen'].includes(user.role) && (
            <button
              onClick={handleOpenHistory}
              style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                color: 'white',
                border: '1px solid rgba(0, 245, 212, 0.4)',
                padding: '12px 20px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0, 245, 212, 0.25)'
              }}
            >
              <Award size={18} />
              My Participation & Certificates
            </button>
          )}

          {isOrganizeRole && (
            <button
              onClick={() => setShowFormModal(true)}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: 'white',
                border: '1px solid rgba(0, 229, 255, 0.4)',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0, 229, 255, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <PlusCircle size={20} />
              Organize Cleanup Campaign
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div style={{ padding: '14px 18px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--success)', borderRadius: '10px', color: 'var(--success)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={20} />
          <span style={{ fontWeight: '600' }}>{success}</span>
        </div>
      )}
      {error && (
        <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)', borderRadius: '10px', color: 'var(--danger)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: '600' }}>{error}</span>
        </div>
      )}

      {/* Overview Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Card 1: Total Campaigns (RED THEME) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(28, 20, 36, 0.85) 0%, rgba(14, 25, 48, 0.95) 100%)',
          border: '1px solid rgba(255, 77, 77, 0.35)',
          boxShadow: '0 8px 24px rgba(255, 77, 77, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 77, 77, 0.2)', border: '1px solid rgba(255, 77, 77, 0.4)' }}>
            <Calendar size={24} color="#ff4d4d" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Total Campaigns</span>
            <div className="stat-val">{totalDrives}</div>
          </div>
          <img 
            src="/images/red_coral_card_bg.png" 
            alt="Red Coral Artwork" 
            className="card-artwork-blend"
          />
        </div>

        {/* Card 2: Upcoming Drives (CYAN BLUE THEME) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(10, 38, 64, 0.85) 0%, rgba(8, 25, 46, 0.95) 100%)',
          border: '1px solid rgba(0, 229, 255, 0.35)',
          boxShadow: '0 8px 24px rgba(0, 229, 255, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 229, 255, 0.2)', border: '1px solid rgba(0, 229, 255, 0.4)' }}>
            <Clock size={24} color="#00e5ff" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Upcoming Drives</span>
            <div className="stat-val">{upcomingDrives}</div>
          </div>
          <img 
            src="/images/cyan_cleanups_corner.png" 
            alt="Cyan Coral Artwork" 
            className="card-artwork-blend"
          />
        </div>

        {/* Card 3: Volunteers Mobilized (EMERALD TEAL THEME) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(10, 42, 50, 0.85) 0%, rgba(6, 28, 38, 0.95) 100%)',
          border: '1px solid rgba(0, 245, 212, 0.35)',
          boxShadow: '0 8px 24px rgba(0, 245, 212, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 245, 212, 0.2)', border: '1px solid rgba(0, 245, 212, 0.4)' }}>
            <Users size={24} color="#00f5d4" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Volunteers Mobilized</span>
            <div className="stat-val">{totalVolunteers}</div>
          </div>
          <img 
            src="/images/green_teal_campaigns_bg.png" 
            alt="Volunteers Mobilized Artwork" 
            className="card-artwork-blend"
          />
        </div>

        {/* Card 4: Restored Shorelines (PURPLE THEME) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(28, 20, 56, 0.85) 0%, rgba(16, 14, 40, 0.95) 100%)',
          border: '1px solid rgba(157, 78, 221, 0.35)',
          boxShadow: '0 8px 24px rgba(157, 78, 221, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(157, 78, 221, 0.2)', border: '1px solid rgba(157, 78, 221, 0.4)' }}>
            <Compass size={24} color="#9d4edd" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Restored Shorelines</span>
            <div className="stat-val">{completedDrives}</div>
          </div>
          <img 
            src="/images/purple_coral_card_bg.png" 
            alt="Restored Shorelines Artwork" 
            className="card-artwork-blend"
          />
        </div>
      </div>

      {/* Scheduled Campaigns Section */}
      <div className="glass-panel" style={{ 
        padding: '24px 28px', 
        borderRadius: '20px',
        border: '1px solid rgba(0, 229, 255, 0.25)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
        background: 'linear-gradient(180deg, rgba(12, 28, 54, 0.85) 0%, rgba(8, 20, 42, 0.95) 100%)'
      }}>
        {/* Toolbar: Title, Search, Status Filter */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '700', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>Scheduled Campaigns</span>
              <span style={{ 
                fontSize: '0.72rem', 
                fontWeight: '700', 
                background: 'rgba(0, 229, 255, 0.14)', 
                color: '#00e5ff', 
                border: '1px solid rgba(0, 229, 255, 0.35)', 
                padding: '2px 9px', 
                borderRadius: '20px' 
              }}>
                {filteredCampaigns.length} Active
              </span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
              Showing {filteredCampaigns.length} of {campaigns.length} total cleanup drives
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#00e5ff' }} />
              <input
                type="text"
                placeholder="Search campaigns, beach, organizer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 30px 8px 36px',
                  borderRadius: '10px',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  background: 'rgba(5, 19, 41, 0.85)',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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

            {(searchQuery || statusFilter !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
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
          <div style={{ color: 'var(--text-secondary)', padding: '30px', textAlign: 'center', fontSize: '0.9rem' }}>Loading campaign schedules...</div>
        ) : filteredCampaigns.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ margin: 0, fontSize: '0.98rem', fontWeight: '600', color: '#ffffff' }}>No cleanup campaigns found.</p>
            {(searchQuery || statusFilter !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                style={{ marginTop: '12px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Reset Search & Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-container" style={{ 
            width: '100%', 
            borderRadius: '14px', 
            border: '1px solid rgba(0, 229, 255, 0.2)', 
            background: 'rgba(6, 18, 38, 0.75)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            marginTop: '16px'
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
                            onClick={() => handleOpenDetails(camp.campaign_id)}
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
                            ['Citizen', 'Volunteer'].includes(user.role) && camp.status === 'Upcoming' && (
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

      {/* ========================================================================= */}
      {/* MODAL: ORGANIZE CLEANUP CAMPAIGN FORM */}
      {/* ========================================================================= */}
      {showFormModal && (
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
          justify: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '960px',
            width: '100%',
            maxHeight: '94vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(12, 28, 54, 0.98) 0%, rgba(8, 20, 40, 0.99) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            position: 'relative',
            padding: '20px 24px',
            margin: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} color="#00e5ff" />
                  Organize Cleanup Campaign
                </h2>
              </div>

              <button 
                onClick={() => setShowFormModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Split View: Left Form / Right Interactive Map */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
              {/* Form Column */}
              <div>
                <form onSubmit={handleCreateCampaignSubmit}>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Campaign Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Fort Kochi Shoreline Cleanup Drive" 
                      value={campaignName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCampaignName(val);
                        const err = validateField('campaignName', val);
                        setFormErrors(prev => ({ ...prev, campaignName: err }));
                      }}
                      style={{ padding: '8px 12px', border: formErrors.campaignName ? '1px solid #ff4d4d' : '1px solid rgba(0, 229, 255, 0.2)', boxShadow: formErrors.campaignName ? '0 0 8px rgba(255, 77, 77, 0.3)' : 'none' }}
                    />
                    {formErrors.campaignName && (
                      <span style={{ color: '#ff4d4d', fontSize: '0.74rem', marginTop: '3px', display: 'block', fontWeight: '600' }}>
                        ⚠️ {formErrors.campaignName}
                      </span>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Description & Objectives</label>
                    <textarea 
                      className="form-control" 
                      placeholder="Assembly details, target waste types, refreshment info..." 
                      rows="2"
                      value={description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDescription(val);
                        const err = validateField('description', val);
                        setFormErrors(prev => ({ ...prev, description: err }));
                      }}
                      style={{ padding: '8px 12px', border: formErrors.description ? '1px solid #ff4d4d' : '1px solid rgba(0, 229, 255, 0.2)', boxShadow: formErrors.description ? '0 0 8px rgba(255, 77, 77, 0.3)' : 'none' }}
                    />
                    {formErrors.description && (
                      <span style={{ color: '#ff4d4d', fontSize: '0.74rem', marginTop: '3px', display: 'block', fontWeight: '600' }}>
                        ⚠️ {formErrors.description}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Date *</label>
                      <CustomDatePicker 
                        value={campaignDate}
                        onChange={(val) => {
                          setCampaignDate(val);
                          const err = validateField('campaignDate',val);
                          setFormErrors(prev => ({ ...prev, campaignDate: err }));
                        }}
                        error={formErrors.campaignDate}
                      />
                      {formErrors.campaignDate && (
                        <span style={{ color: '#ff4d4d', fontSize: '0.72rem', marginTop: '3px', display: 'block', fontWeight: '600' }}>
                          ⚠️ {formErrors.campaignDate}
                        </span>
                      )}
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Start Time *</label>
                      <CustomTimePicker 
                        value={startTime}
                        onChange={(val) => {
                          setStartTime(val);
                          const err = validateField('startTime', val);
                          setFormErrors(prev => ({ ...prev, startTime: err }));
                        }}
                        error={formErrors.startTime}
                        selectedDate={campaignDate}
                      />
                      {formErrors.startTime && (
                        <span style={{ color: '#ff4d4d', fontSize: '0.72rem', marginTop: '3px', display: 'block', fontWeight: '600' }}>
                          ⚠️ {formErrors.startTime}
                        </span>
                      )}
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">End Time *</label>
                      <CustomTimePicker 
                        value={endTime}
                        onChange={(val) => {
                          setEndTime(val);
                          const err = validateField('endTime', val);
                          setFormErrors(prev => ({ ...prev, endTime: err }));
                        }}
                        error={formErrors.endTime}
                        selectedDate={campaignDate}
                      />
                      {formErrors.endTime && (
                        <span style={{ color: '#ff4d4d', fontSize: '0.72rem', marginTop: '3px', display: 'block', fontWeight: '600' }}>
                          ⚠️ {formErrors.endTime}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Beach / Location Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Fort Kochi Beach Promenade" 
                      value={location}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocation(val);
                        const err = validateField('location', val);
                        setFormErrors(prev => ({ ...prev, location: err }));
                      }}
                      style={{ padding: '8px 12px', border: formErrors.location ? '1px solid #ff4d4d' : '1px solid rgba(0, 229, 255, 0.2)', boxShadow: formErrors.location ? '0 0 8px rgba(255, 77, 77, 0.3)' : 'none' }}
                    />
                    {formErrors.location && (
                      <span style={{ color: '#ff4d4d', fontSize: '0.74rem', marginTop: '3px', display: 'block', fontWeight: '600' }}>
                        ⚠️ {formErrors.location}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Latitude *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Click map →" 
                        value={latitude}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLatitude(val);
                          const err = validateField('latitude', val);
                          setFormErrors(prev => ({ ...prev, latitude: err, coordinates: null }));
                        }}
                        style={{ padding: '8px 10px', border: (formErrors.latitude || formErrors.coordinates) ? '1px solid #ff4d4d' : '1px solid rgba(0, 229, 255, 0.2)', boxShadow: (formErrors.latitude || formErrors.coordinates) ? '0 0 8px rgba(255, 77, 77, 0.3)' : 'none' }}
                      />
                      {formErrors.latitude && (
                        <span style={{ color: '#ff4d4d', fontSize: '0.72rem', marginTop: '3px', display: 'block', fontWeight: '600' }}>
                          ⚠️ {formErrors.latitude}
                        </span>
                      )}
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Longitude *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Click map →" 
                        value={longitude}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLongitude(val);
                          const err = validateField('longitude', val);
                          setFormErrors(prev => ({ ...prev, longitude: err, coordinates: null }));
                        }}
                        style={{ padding: '8px 10px', border: (formErrors.longitude || formErrors.coordinates) ? '1px solid #ff4d4d' : '1px solid rgba(0, 229, 255, 0.2)', boxShadow: (formErrors.longitude || formErrors.coordinates) ? '0 0 8px rgba(255, 77, 77, 0.3)' : 'none' }}
                      />
                      {formErrors.longitude && (
                        <span style={{ color: '#ff4d4d', fontSize: '0.72rem', marginTop: '3px', display: 'block', fontWeight: '600' }}>
                          ⚠️ {formErrors.longitude}
                        </span>
                      )}
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Volunteer Limit (Max 100) *</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        className="form-control" 
                        placeholder="e.g. 50" 
                        value={maxVolunteers}
                        maxLength={3}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setMaxVolunteers(val);
                          const err = validateField('maxVolunteers', val);
                          setFormErrors(prev => ({ ...prev, maxVolunteers: err }));
                        }}
                        style={{ padding: '8px 10px', border: formErrors.maxVolunteers ? '1px solid #ff4d4d' : '1px solid rgba(0, 229, 255, 0.2)', boxShadow: formErrors.maxVolunteers ? '0 0 8px rgba(255, 77, 77, 0.3)' : 'none' }}
                      />
                      {formErrors.maxVolunteers && (
                        <span style={{ color: '#ff4d4d', fontSize: '0.72rem', marginTop: '3px', display: 'block', fontWeight: '600' }}>
                          ⚠️ {formErrors.maxVolunteers}
                        </span>
                      )}
                    </div>
                  </div>

                  {formErrors.coordinates && (
                    <div style={{ color: '#ff4d4d', fontSize: '0.75rem', marginBottom: '10px', fontWeight: '600' }}>
                      ⚠️ {formErrors.coordinates}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button 
                      type="button"
                      onClick={() => setShowFormModal(false)}
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '9px 14px', fontSize: '0.88rem' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ flex: 2, padding: '9px 14px', fontSize: '0.88rem' }}
                      disabled={submitting}
                    >
                      {submitting ? 'Scheduling...' : 'Confirm & Schedule Campaign'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Map Column */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>
                  <MapPin size={15} color="#00e5ff" />
                  Select Shoreline Coordinates
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '8px' }}>
                  Click anywhere on the map to pin campaign coordinates automatically.
                </p>
                <div style={{ width: '100%', height: '280px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                  <LeafletMap 
                    onLocationSelect={handleMapClick} 
                    selectedLocation={selectedCoords} 
                    campaigns={campaigns}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CAMPAIGN DETAILS & VOLUNTEER ATTENDANCE */}
      {/* ========================================================================= */}
      {showDetailsModal && activeCampaignDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justify: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '780px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            position: 'relative',
            padding: '28px'
          }}>
            <button 
              onClick={() => setShowDetailsModal(false)}
              style={{
                position: 'absolute',
                right: '20px',
                top: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '4px', fontWeight: '800' }}>
              {activeCampaignDetails.campaign.campaign_name}
            </h2>
            <p style={{ color: '#0284c7', fontSize: '0.9rem', marginBottom: '18px', fontWeight: '600' }}>
              Organized by: {activeCampaignDetails.campaign.organization_name || activeCampaignDetails.campaign.creator_name}
            </p>

            <div style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.03)', borderRadius: '10px', border: '1px solid var(--card-border)', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign Description</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0 }}>
                {activeCampaignDetails.campaign.description || 'No description available for this campaign.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem', marginBottom: '24px' }}>
              <div>
                <p style={{ margin: '4px 0' }}><strong>Scheduled Date:</strong> {new Date(activeCampaignDetails.campaign.campaign_date).toLocaleDateString()}</p>
                <p style={{ margin: '4px 0' }}><strong>Timing:</strong> {activeCampaignDetails.campaign.start_time ? `${activeCampaignDetails.campaign.start_time} - ${activeCampaignDetails.campaign.end_time || 'TBD'}` : 'All Day'}</p>
                <p style={{ margin: '4px 0' }}><strong>Status:</strong> <span className={`badge ${activeCampaignDetails.campaign.status === 'Completed' ? 'badge-completed' : 'badge-pending'}`}>{activeCampaignDetails.campaign.status}</span></p>
              </div>
              <div>
                <p style={{ margin: '4px 0' }}><strong>Beach Location:</strong> {activeCampaignDetails.campaign.location}</p>
                <p style={{ margin: '4px 0' }}><strong>Coordinates:</strong> {activeCampaignDetails.campaign.latitude || 'TBD'}, {activeCampaignDetails.campaign.longitude || 'TBD'}</p>
                <p style={{ margin: '4px 0' }}><strong>Registered Volunteers:</strong> {activeCampaignDetails.volunteers.length} members</p>
              </div>
            </div>

            {/* Volunteer Attendance & Certification */}
            {isOrganizeRole && (
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--card-border)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                  <Award size={20} color="#0284c7" />
                  Registered Volunteers Attendance & Certificates
                </h4>
                {activeCampaignDetails.volunteers.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No volunteers have signed up for this campaign yet.</p>
                ) : (
                  <div className="table-container">
                    <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Volunteer Name</th>
                          <th>Email</th>
                          <th>Attendance</th>
                          <th>Certificate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeCampaignDetails.volunteers.map((vol) => (
                          <tr key={vol.user_id}>
                            <td style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                              <img src={vol.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'} alt="" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
                              {vol.full_name}
                            </td>
                            <td>{vol.email}</td>
                            <td>
                              {vol.attendance ? (
                                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                                  <Check size={14} /> Attended
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleUpdateAttendance(activeCampaignDetails.campaign.campaign_id, vol.user_id, true, vol.certificate_status)}
                                  disabled={attendanceLoading[`${vol.user_id}-att`]}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                  {attendanceLoading[`${vol.user_id}-att`] ? '...' : 'Mark Attended'}
                                </button>
                              )}
                            </td>
                            <td>
                              {vol.certificate_status ? (
                                <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                                  <Check size={14} /> Issued
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleUpdateAttendance(activeCampaignDetails.campaign.campaign_id, vol.user_id, vol.attendance, true)}
                                  disabled={!vol.attendance || attendanceLoading[`${vol.user_id}-cert`]}
                                  className="btn btn-primary"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                  {attendanceLoading[`${vol.user_id}-cert`] ? '...' : 'Issue Certificate'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={() => setShowDetailsModal(false)}
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '24px', padding: '10px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MY PARTICIPATION HISTORY & CERTIFICATES (VOLUNTEER) */}
      {/* ========================================================================= */}
      {showHistoryModal && (
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
            maxWidth: '850px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(12, 28, 54, 0.98) 0%, rgba(8, 20, 40, 0.99) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(0, 245, 212, 0.3)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
            padding: '28px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award size={24} color="#00f5d4" />
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#ffffff' }}>
                  My Participation History & Certificates
                </h3>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {historyLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading history...</div>
            ) : myHistory.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Award size={48} color="#64748b" style={{ marginBottom: '12px', opacity: 0.5 }} />
                <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem' }}>No Campaign History Found</h4>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.88rem' }}>You haven't registered for any cleanup drives yet. Join an upcoming campaign to earn certificates!</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Campaign Title</th>
                      <th>Location</th>
                      <th>Date</th>
                      <th>Attendance</th>
                      <th>Certificate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myHistory.map((item) => (
                      <tr key={item.registration_id}>
                        <td style={{ fontWeight: '600' }}>{item.campaign_name}</td>
                        <td>{item.location}</td>
                        <td>{new Date(item.campaign_date).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${item.attendance ? 'badge-verified' : 'badge-pending'}`}>
                            {item.attendance ? 'Attended' : 'Registered'}
                          </span>
                        </td>
                        <td>
                          {item.certificate_status ? (
                            <button
                              onClick={() => setSelectedCert({
                                certificate_id: item.certificate_id,
                                volunteer_name: user.full_name,
                                campaign_name: item.campaign_name,
                                location: item.location,
                                campaign_date: item.campaign_date,
                                issued_date: item.issued_date,
                                organization_name: item.organization_name || item.creator_name
                              })}
                              className="btn btn-primary"
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.75rem',
                                background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                                color: '#ffffff',
                                border: '1px solid rgba(0, 245, 212, 0.4)'
                              }}
                            >
                              <Award size={14} /> View Certificate
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Pending Verification</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Render Certificate Print / Download Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
};

export default Campaigns;
