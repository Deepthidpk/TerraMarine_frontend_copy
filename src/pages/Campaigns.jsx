import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, MapPin, Users, Award, Shield, Check, Info, 
  PlusCircle, X, Search, Filter, Clock, Sparkles, Compass, CheckCircle2, RotateCcw, AlertCircle
} from 'lucide-react';
import LeafletMap from '../components/LeafletMap';

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
  const [submitting, setSubmitting] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);

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
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleMapClick = (lat, lng) => {
    setSelectedCoords({ lat, lng });
    setLatitude(lat.toFixed(7));
    setLongitude(lng.toFixed(7));
  };

  const handleCreateCampaignSubmit = async (e) => {
    e.preventDefault();
    if (!campaignName || !campaignDate || !location) {
      return setError('Name, date, and location name are required.');
    }
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await authFetch('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          campaign_name: campaignName,
          description,
          campaign_date: campaignDate,
          start_time: startTime || null,
          end_time: endTime || null,
          location,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          maximum_volunteers: maxVolunteers ? parseInt(maxVolunteers) : null
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
      setShowFormModal(false);

      fetchCampaigns();
    } catch (err) {
      setError(err.message || 'Error occurred while saving campaign.');
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
        throw new Error(data.error || 'Could not join campaign.');
      }
      setSuccess('You have registered for the cleanup drive successfully!');
      fetchCampaigns();
    } catch (err) {
      setError(err.message || 'Failed to join campaign.');
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
      {/* Header Banner & Action Button */}
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', marginBottom: '6px', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Cleanup Campaigns</span>
            <Sparkles size={24} color="#0284c7" />
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Coordinate, schedule, and volunteer for beach and shoreline cleanup operations.
          </p>
        </div>

        {isOrganizeRole && (
          <button
            onClick={() => setShowFormModal(true)}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 22px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.4)',
              transition: 'transform 0.2s ease, boxShadow 0.2s ease'
            }}
          >
            <PlusCircle size={20} />
            Organize Cleanup Campaign
          </button>
        )}
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
      <div className="dashboard-grid" style={{ marginBottom: '28px' }}>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="stat-icon" style={{ color: '#0284c7', background: 'rgba(2, 132, 199, 0.1)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TOTAL CAMPAIGNS</span>
            <div className="stat-number">{totalDrives}</div>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>UPCOMING DRIVES</span>
            <div className="stat-number">{upcomingDrives}</div>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>VOLUNTEERS MOBILIZED</span>
            <div className="stat-number">{totalVolunteers}</div>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="stat-icon" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }}>
            <Compass size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>RESTORED SHORELINES</span>
            <div className="stat-number">{completedDrives}</div>
          </div>
        </div>
      </div>

      {/* Scheduled Campaigns Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {/* Toolbar: Title, Search, Status Filter */}
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '700' }}>Scheduled Campaigns</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Showing {filteredCampaigns.length} of {campaigns.length} cleanup drives
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search campaigns, beach, organizer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 30px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
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
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: '600'
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
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Campaign List Table */}
        {loading ? (
          <div style={{ color: 'var(--text-secondary)', padding: '30px', textAlign: 'center' }}>Loading campaign schedules...</div>
        ) : filteredCampaigns.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>No cleanup campaigns found.</p>
            {(searchQuery || statusFilter !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                style={{ marginTop: '12px', background: '#0284c7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Reset Search & Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Organizer</th>
                  <th>Location</th>
                  <th>Campaign Date</th>
                  <th>Timing</th>
                  <th>Volunteers Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((camp) => {
                  const volCount = parseInt(camp.volunteer_count) || 0;
                  const maxVol = camp.maximum_volunteers || null;
                  const percent = maxVol ? Math.min(100, Math.round((volCount / maxVol) * 100)) : null;

                  return (
                    <tr key={camp.campaign_id}>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{camp.campaign_name}</div>
                        {camp.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                            {camp.description}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: '600' }}>{camp.organization_name || camp.creator_name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                          <MapPin size={14} color="#0284c7" />
                          <span>{camp.location}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                        {new Date(camp.campaign_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {camp.start_time ? `${camp.start_time.slice(0,5)} - ${camp.end_time?.slice(0,5) || 'TBD'}` : 'All Day'}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '2px' }}>
                          {volCount} {maxVol ? `/ ${maxVol}` : 'Registered'}
                        </div>
                        {percent !== null && (
                          <div style={{ width: '80px', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: percent >= 100 ? '#ef4444' : '#10b981' }} />
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          camp.status === 'Completed' ? 'badge-completed' :
                          camp.status === 'Upcoming' ? 'badge-pending' :
                          camp.status === 'Ongoing' ? 'badge-verified' : 'badge-emergency'
                        }`}>
                          {camp.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleOpenDetails(camp.campaign_id)}
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            <Info size={14} />
                            Details
                          </button>

                          {['Citizen', 'Volunteer'].includes(user.role) && camp.status === 'Upcoming' && (
                            <button 
                              onClick={() => handleJoinCampaign(camp.campaign_id)}
                              className="btn btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              <Users size={14} />
                              Join Drive
                            </button>
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
      {/* MODAL: ORGANIZE CLEANUP CAMPAIGN (Form + Map Picker) */}
      {/* ========================================================================= */}
      {showFormModal && isOrganizeRole && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justify: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '980px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            position: 'relative',
            padding: '28px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--card-border)', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={22} color="#0284c7" />
                  Organize Cleanup Campaign
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Set campaign timing, shoreline assembly location, and target volunteer capacity.
                </p>
              </div>

              <button 
                onClick={() => setShowFormModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Split View: Left Form / Right Interactive Map */}
            <div className="grid-2col" style={{ gap: '24px' }}>
              {/* Form Column */}
              <div>
                <form onSubmit={handleCreateCampaignSubmit}>
                  <div className="form-group">
                    <label className="form-label">Campaign Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Fort Kochi Shoreline Cleanup Drive" 
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description & Objectives</label>
                    <textarea 
                      className="form-control" 
                      placeholder="Assembly details, target waste types, refreshment info..." 
                      rows="3"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Date *</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={campaignDate}
                        onChange={(e) => setCampaignDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Start Time</label>
                      <input 
                        type="time" 
                        className="form-control" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Time</label>
                      <input 
                        type="time" 
                        className="form-control" 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Beach / Location Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Fort Kochi Beach Promenade" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Latitude</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Click map right →" 
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Longitude</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Click map right →" 
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Volunteer Limit</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="e.g. 50" 
                        value={maxVolunteers}
                        onChange={(e) => setMaxVolunteers(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button 
                      type="button"
                      onClick={() => setShowFormModal(false)}
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '10px' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ flex: 2, padding: '10px' }}
                      disabled={submitting}
                    >
                      {submitting ? 'Scheduling Campaign...' : 'Confirm & Schedule Campaign'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Map Column */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="var(--accent-primary)" />
                  Select Shoreline Coordinates
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '12px' }}>
                  Click anywhere on the shoreline map below to automatically pin campaign coordinates into the form.
                </p>
                <div style={{ flex: 1, minHeight: '320px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
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
    </div>
  );
};

export default Campaigns;
