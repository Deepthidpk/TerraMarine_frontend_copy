import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Users, Award, Shield, Check, Info } from 'lucide-react';
import LeafletMap from '../components/LeafletMap';

const Campaigns = () => {
  const { user, authFetch } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state (NGO / Authority only)
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

      setSuccess('Cleanup campaign created successfully!');
      // Reset form
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
        // Refresh detail view
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

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Cleanup Campaigns</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Coordinate, schedule, and volunteer for beach and shoreline cleanup operations.
        </p>
      </div>

      {success && (
        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', borderRadius: '8px', color: 'var(--success)', marginBottom: '20px' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Grid split: Form (left) / Map picker (right) for NGOs to organize drives */}
      {['NGO', 'Authority', 'Admin'].includes(user.role) && (
        <div className="grid-2col" style={{ marginBottom: '40px' }}>
          {/* Form */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
              Organize Cleanup Campaign
            </h3>
            <form onSubmit={handleCreateCampaignSubmit}>
              <div className="form-group">
                <label className="form-label">Campaign Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Fort Kochi Walkway Cleanup" 
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  placeholder="Provide information on assembly points, goals, refreshments, etc." 
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Campaign Date *</label>
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
                <label className="form-label">Location (Beach / Landmark) *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Fort Kochi Beach Walkway" 
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
                    placeholder="Click map right" 
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Click map right" 
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Volunteers Limit</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="e.g. 50" 
                    value={maxVolunteers}
                    onChange={(e) => setMaxVolunteers(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', marginTop: '12px' }}
                disabled={submitting}
              >
                {submitting ? 'Creating Campaign...' : 'Schedule Campaign'}
              </button>
            </form>
          </div>

          {/* Map Selector */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={18} color="var(--accent-primary)" />
              Select Campaign Coordinates
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
              Click on the shoreline map below to automatically fill campaign coordinates.
            </p>
            <div style={{ flex: 1, minHeight: '350px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
              <LeafletMap 
                onLocationSelect={handleMapClick} 
                selectedLocation={selectedCoords} 
                campaigns={campaigns}
              />
            </div>
          </div>
        </div>
      )}

      {/* Campaigns list display */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Scheduled Campaigns Ledger</h3>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>
            No upcoming cleanup campaigns found.
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
                  <th>Volunteers Count</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp) => (
                  <tr key={camp.campaign_id}>
                    <td style={{ fontWeight: 600 }}>{camp.campaign_name}</td>
                    <td>{camp.organization_name || camp.creator_name}</td>
                    <td>{camp.location}</td>
                    <td>{new Date(camp.campaign_date).toLocaleDateString()}</td>
                    <td>{camp.start_time ? `${camp.start_time.slice(0,5)} - ${camp.end_time?.slice(0,5) || 'TBD'}` : 'All Day'}</td>
                    <td>{camp.volunteer_count} / {camp.maximum_volunteers || 'No Limit'}</td>
                    <td>
                      <span className={`badge ${
                        camp.status === 'Completed' ? 'badge-completed' :
                        camp.status === 'Upcoming' ? 'badge-pending' :
                        camp.status === 'Ongoing' ? 'badge-verified' : 'badge-emergency'
                      }`}>{camp.status}</span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleOpenDetails(camp.campaign_id)}
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        <Info size={14} />
                        Details
                      </button>

                      {/* Join button for Citizens/Volunteers if not NGO owner and not completed */}
                      {['Citizen', 'Volunteer'].includes(user.role) && camp.status === 'Upcoming' && (
                        <button 
                          onClick={() => handleJoinCampaign(camp.campaign_id)}
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          <Users size={14} />
                          Join
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

      {/* Details & Volunteer Management Modal */}
      {showDetailsModal && activeCampaignDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            position: 'relative'
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
              &times;
            </button>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
              {activeCampaignDetails.campaign.campaign_name}
            </h2>
            <p style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Organized by: {activeCampaignDetails.campaign.organization_name || activeCampaignDetails.campaign.creator_name}
            </p>

            <div style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.03)', borderRadius: '8px', border: '1px solid var(--card-border)', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Campaign Description</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                {activeCampaignDetails.campaign.description || 'No description available for this campaign.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem', marginBottom: '24px' }}>
              <div>
                <p><strong>Scheduled Date:</strong> {new Date(activeCampaignDetails.campaign.campaign_date).toLocaleDateString()}</p>
                <p><strong>Timing:</strong> {activeCampaignDetails.campaign.start_time ? `${activeCampaignDetails.campaign.start_time} - ${activeCampaignDetails.campaign.end_time || 'TBD'}` : 'TBD'}</p>
                <p><strong>Status:</strong> <span className={`badge ${activeCampaignDetails.campaign.status === 'Completed' ? 'badge-completed' : 'badge-pending'}`}>{activeCampaignDetails.campaign.status}</span></p>
              </div>
              <div>
                <p><strong>Beach Location:</strong> {activeCampaignDetails.campaign.location}</p>
                <p><strong>Coordinates:</strong> {activeCampaignDetails.campaign.latitude || 'TBD'}, {activeCampaignDetails.campaign.longitude || 'TBD'}</p>
                <p><strong>Volunteers:</strong> {activeCampaignDetails.volunteers.length} registered</p>
              </div>
            </div>

            {/* Volunteer management list (NGO owners & Authority see and update) */}
            {['NGO', 'Authority', 'Admin'].includes(user.role) && (
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={18} color="var(--accent-primary)" />
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
                            <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <img src={vol.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                              {vol.full_name}
                            </td>
                            <td>{vol.email}</td>
                            <td>
                              {vol.attendance ? (
                                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Check size={14} /> Attended
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleUpdateAttendance(activeCampaignDetails.campaign.campaign_id, vol.user_id, true, vol.certificate_status)}
                                  disabled={attendanceLoading[`${vol.user_id}-att`]}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                >
                                  {attendanceLoading[`${vol.user_id}-att`] ? '...' : 'Mark Attended'}
                                </button>
                              )}
                            </td>
                            <td>
                              {vol.certificate_status ? (
                                <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Check size={14} /> Issued
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleUpdateAttendance(activeCampaignDetails.campaign.campaign_id, vol.user_id, vol.attendance, true)}
                                  disabled={!vol.attendance || attendanceLoading[`${vol.user_id}-cert`]}
                                  className="btn btn-primary"
                                  style={{ padding: '4px 8px', fontSize: '0.7rem' }}
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
              style={{ width: '100%', marginTop: '24px' }}
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
