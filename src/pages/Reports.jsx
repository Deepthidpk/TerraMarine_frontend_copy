import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LeafletMap from '../components/LeafletMap';
import { Camera, MapPin, CheckCircle, Info, ShieldAlert, Search, Filter, X, RotateCcw } from 'lucide-react';

const Reports = () => {
  const { user, authFetch, API_URL } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pollution');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationName, setLocationName] = useState('');
  const [wasteType, setWasteType] = useState('Plastic');
  const [severity, setSeverity] = useState('Medium');
  const [imageFile, setImageFile] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Selected location coordinate pick state
  const [selectedCoords, setSelectedCoords] = useState(null);

  // Selected report for Details modal
  const [activeReportDetails, setActiveReportDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [verificationSeverity, setVerificationSeverity] = useState('Medium');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [wasteTypeFilter, setWasteTypeFilter] = useState('All');

  // Filtered reports computation
  const filteredReports = reports.filter((rep) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = rep.title?.toLowerCase().includes(q);
      const locMatch = rep.location_name?.toLowerCase().includes(q);
      const reporterMatch = rep.reporter_name?.toLowerCase().includes(q);
      const descMatch = rep.description?.toLowerCase().includes(q);
      const wasteMatch = rep.waste_type?.toLowerCase().includes(q);

      if (!titleMatch && !locMatch && !reporterMatch && !descMatch && !wasteMatch) {
        return false;
      }
    }

    if (statusFilter !== 'All' && rep.status !== statusFilter) {
      return false;
    }

    if (categoryFilter !== 'All' && rep.report_category !== categoryFilter) {
      return false;
    }

    if (severityFilter !== 'All' && rep.severity !== severityFilter) {
      return false;
    }

    if (wasteTypeFilter !== 'All' && rep.waste_type !== wasteTypeFilter) {
      return false;
    }

    return true;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setSeverityFilter('All');
    setWasteTypeFilter('All');
  };

  const handleDetectGPSLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat.toFixed(7));
          setLongitude(lng.toFixed(7));
          setSelectedCoords({ lat, lng });
          setSuccess('GPS location auto-detected successfully!');
          setTimeout(() => setSuccess(''), 3000);
        },
        (err) => {
          setError('GPS location access denied or timed out. You can click on the map to pin location.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const validateField = (name, value) => {
    let errorMsg = '';
    if (name === 'title') {
      if (!value || value.trim().length === 0) {
        errorMsg = 'Title is required.';
      } else if (value.trim().length < 3) {
        errorMsg = 'Title must be at least 3 characters.';
      }
    } else if (name === 'locationName') {
      if (!value || value.trim().length === 0) {
        errorMsg = 'Beach / Location name is required.';
      }
    } else if (name === 'latitude') {
      const latNum = parseFloat(value);
      if (!value) {
        errorMsg = 'Latitude is required.';
      } else if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        errorMsg = 'Please enter a valid latitude between -90 and 90.';
      }
    } else if (name === 'longitude') {
      const lngNum = parseFloat(value);
      if (!value) {
        errorMsg = 'Longitude is required.';
      } else if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        errorMsg = 'Please enter a valid longitude between -180 and 180.';
      }
    }
    setFieldErrors((prev) => ({ ...prev, [name]: errorMsg }));
    return errorMsg;
  };

  const fetchReports = async () => {
    try {
      const res = await authFetch('/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleMapClick = (lat, lng) => {
    setSelectedCoords({ lat, lng });
    const latStr = lat.toFixed(7);
    const lngStr = lng.toFixed(7);
    setLatitude(latStr);
    setLongitude(lngStr);
    validateField('latitude', latStr);
    validateField('longitude', lngStr);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    let errorMsg = '';
    if (file) {
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        errorMsg = 'Only image files (JPG, JPEG, PNG, GIF, WEBP) are allowed.';
      } else if (file.size > 10 * 1024 * 1024) {
        errorMsg = 'Image size exceeds the 10MB limit.';
      }
      
      setFieldErrors((prev) => ({ ...prev, image: errorMsg }));
      if (!errorMsg) {
        setImageFile(file);
      } else {
        setImageFile(null);
        e.target.value = null;
      }
    } else {
      setFieldErrors((prev) => ({ ...prev, image: '' }));
      setImageFile(null);
    }
  };

  const handleCreateReportSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate all fields
    const errors = {};
    if (!title) {
      errors.title = 'Title is required.';
    } else if (title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters.';
    } else if (title.length > 100) {
      errors.title = 'Title must be 100 characters or less.';
    } else if (!/^[A-Za-z0-9][A-Za-z0-9\s.,'-]*$/.test(title)) {
      errors.title = 'Title can only contain letters, numbers, spaces, and basic punctuation (.,\'-).';
    }

    if (description) {
      if (description.trim().length < 10) {
        errors.description = 'Description must be at least 10 characters.';
      } else if (description.length > 1000) {
        errors.description = 'Description must be 1000 characters or less.';
      } else if (!/^[A-Za-z0-9\s.,!?'"()#&%+-]*$/.test(description)) {
        errors.description = 'Description contains invalid characters.';
      }
    }

    if (!locationName) {
      errors.locationName = 'Beach / Location name is required.';
    } else if (locationName.trim().length < 3) {
      errors.locationName = 'Location name must be at least 3 characters.';
    } else if (locationName.length > 150) {
      errors.locationName = 'Location name must be 150 characters or less.';
    } else if (!/^[A-Za-z0-9][A-Za-z0-9\s.,/-]*$/.test(locationName)) {
      errors.locationName = 'Location name can only contain letters, numbers, spaces, and basic punctuation (.,/-).';
    }

    const latNum = parseFloat(latitude);
    if (!latitude) {
      errors.latitude = 'Latitude is required.';
    } else if (!/^-?[0-9]+(?:\.[0-9]+)?$/.test(latitude)) {
      errors.latitude = 'Latitude must be a valid decimal number.';
    } else if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errors.latitude = 'Please enter a valid latitude between -90 and 90.';
    }

    const lngNum = parseFloat(longitude);
    if (!longitude) {
      errors.longitude = 'Longitude is required.';
    } else if (!/^-?[0-9]+(?:\.[0-9]+)?$/.test(longitude)) {
      errors.longitude = 'Longitude must be a valid decimal number.';
    } else if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      errors.longitude = 'Please enter a valid longitude between -180 and 180.';
    }

    const mergedErrors = { ...fieldErrors, ...errors };
    Object.keys(mergedErrors).forEach(key => {
      if (!mergedErrors[key]) delete mergedErrors[key];
    });

    if (Object.keys(mergedErrors).length > 0) {
      setFieldErrors(mergedErrors);
      setError('Please correct the validation errors in the form.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('report_category', category);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('location_name', locationName);
      formData.append('waste_type', wasteType);
      formData.append('severity', severity);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await authFetch('/reports', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report.');
      }

      setSuccess('Incident reported successfully!');
      // Reset form
      setTitle('');
      setDescription('');
      setLocationName('');
      setLatitude('');
      setLongitude('');
      setSelectedCoords(null);
      setImageFile(null);
      setFieldErrors({});
      if (document.getElementById('report-image-input')) {
        document.getElementById('report-image-input').value = '';
      }

      fetchReports();
    } catch (err) {
      setError(err.message || 'Error occurred while saving report.');
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
        setVerificationSeverity(data.report.severity || 'Medium');
        setShowDetailsModal(true);
      }
    } catch (err) {
      console.error('Error fetching report details:', err);
    }
  };

  const handleVerifyReport = async (reportId) => {
    try {
      const res = await authFetch(`/reports/${reportId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ severity: verificationSeverity })
      });
      if (res.ok) {
        setShowDetailsModal(false);
        setSuccess('Report verified successfully!');
        fetchReports();
      } else {
        const data = await res.json();
        setError(data.error || 'Verification failed.');
      }
    } catch (err) {
      console.error('Verify report error:', err);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Pollution & Incident Reports</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          View ongoing cleanup progress or report coastal anomalies like plastic piles or oil leaks.
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

      {/* Grid split: Form (left) / Map selector (right) for Citizens/Fishermen to submit */}
      {['Citizen', 'Fisherman', 'Admin'].includes(user.role) && (
        <div className="grid-2col" style={{ marginBottom: '40px' }}>
          {/* Form */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
              Report Pollution Incident
            </h3>
            <form onSubmit={handleCreateReportSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Bulk plastic bottles wash up" 
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); validateField('title', e.target.value); }}
                  style={{ borderColor: fieldErrors.title ? 'var(--danger)' : '' }}
                />
                {fieldErrors.title && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.title}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  placeholder="Provide brief details on trash volume, source, or hazard status" 
                  rows="3"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); validateField('description', e.target.value); }}
                  style={{ borderColor: fieldErrors.description ? 'var(--danger)' : '' }}
                />
                {fieldErrors.description && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.description}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-control" 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Pollution">Pollution (Plastic, glass, metal)</option>
                    <option value="Emergency">Emergency (Oil spill, toxic leaks)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Waste Type</label>
                  <select 
                    className="form-control" 
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                  >
                    <option value="Plastic">Plastic Bottles/Bags</option>
                    <option value="Glass">Glass Bottling</option>
                    <option value="Fishing Nets">Fishing Nets / Line</option>
                    <option value="Oil Spill">Oil Slick / Fuel Leak</option>
                    <option value="Dead Marine Life">Dead Marine Organisms</option>
                    <option value="General Litter">General Trash</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Beach / Location Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Fort Kochi Walkway" 
                  value={locationName}
                  onChange={(e) => { setLocationName(e.target.value); validateField('locationName', e.target.value); }}
                  style={{ borderColor: fieldErrors.locationName ? 'var(--danger)' : '' }}
                />
                {fieldErrors.locationName && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.locationName}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Location GPS Coordinates *</label>
                <button
                  type="button"
                  onClick={handleDetectGPSLocation}
                  style={{
                    background: '#0284c7',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <MapPin size={12} /> Use My Current GPS Location
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Latitude *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Click on the map right &rarr;" 
                    value={latitude}
                    onChange={(e) => { setLatitude(e.target.value); validateField('latitude', e.target.value); }}
                    style={{ borderColor: fieldErrors.latitude ? 'var(--danger)' : '' }}
                  />
                  {fieldErrors.latitude && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.latitude}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Longitude *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Click on the map right &rarr;" 
                    value={longitude}
                    onChange={(e) => { setLongitude(e.target.value); validateField('longitude', e.target.value); }}
                    style={{ borderColor: fieldErrors.longitude ? 'var(--danger)' : '' }}
                  />
                  {fieldErrors.longitude && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.longitude}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Upload Image proof</label>
                  <input 
                    type="file" 
                    id="report-image-input"
                    className="form-control" 
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ borderColor: fieldErrors.image ? 'var(--danger)' : '' }}
                  />
                  {fieldErrors.image && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.image}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Camera size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  GPS-enabled photos help cleanup teams pinpoint targets.
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', marginTop: '24px' }}
                disabled={submitting}
              >
                {submitting ? 'Submitting Report...' : 'Submit Report'}
              </button>
            </form>
          </div>

          {/* Interactive Picker Map */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={18} color="var(--accent-primary)" />
              Pick Coordinates on Map
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
              Click anywhere on the coastal line on the map below. Coordinates will fill into form automatically.
            </p>
            <div style={{ flex: 1, minHeight: '350px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
              <LeafletMap 
                onLocationSelect={handleMapClick} 
                selectedLocation={selectedCoords} 
                reports={reports}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reports Table List */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Active Reports Ledger</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Showing {filteredReports.length} of {reports.length} reports
            </span>
          </div>

          {(searchQuery || statusFilter !== 'All' || categoryFilter !== 'All' || severityFilter !== 'All' || wasteTypeFilter !== 'All') && (
            <button
              onClick={handleResetFilters}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--danger)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RotateCcw size={14} /> Clear Filters
            </button>
          )}
        </div>

        {/* Filter Controls Toolbar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.2fr 1fr 1fr 1fr 1fr',
          gap: '12px',
          alignItems: 'end',
          marginBottom: '20px',
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.02)',
          border: '1px solid var(--card-border)',
          borderRadius: '10px'
        }}>
          {/* Search Box */}
          <div style={{ minWidth: 0 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Search Reports
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by title, location, waste type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 32px 8px 36px',
                  borderRadius: '6px',
                  border: '1px solid var(--card-border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            >
              <option value="All">All Categories</option>
              <option value="Pollution">Pollution</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            >
              <option value="All">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Waste Type Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Waste Type
            </label>
            <select
              value={wasteTypeFilter}
              onChange={(e) => setWasteTypeFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            >
              <option value="All">All Waste Types</option>
              <option value="Plastic">Plastic</option>
              <option value="Glass">Glass</option>
              <option value="Fishing Nets">Fishing Nets</option>
              <option value="Oil Spill">Oil Spill</option>
              <option value="Dead Marine Life">Dead Marine Life</option>
              <option value="General Litter">General Litter</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Fetching reports...</div>
        ) : filteredReports.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>No pollution reports found.</p>
            {(searchQuery || statusFilter !== 'All' || categoryFilter !== 'All' || severityFilter !== 'All' || wasteTypeFilter !== 'All') && (
              <button
                onClick={handleResetFilters}
                style={{
                  marginTop: '12px',
                  background: '#0284c7',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Waste Type</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Reported Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((rep) => (
                  <tr key={rep.report_id}>
                    <td style={{ fontWeight: 600 }}>{rep.title}</td>
                    <td>{rep.location_name || `${parseFloat(rep.latitude).toFixed(4)}, ${parseFloat(rep.longitude).toFixed(4)}`}</td>
                    <td>{rep.waste_type || 'General'}</td>
                    <td>
                      <span className={`badge ${rep.report_category === 'Emergency' ? 'badge-emergency' : 'badge-pollution'}`}>
                        {rep.report_category}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        fontWeight: '600', 
                        color: rep.severity === 'High' ? 'var(--danger)' : rep.severity === 'Medium' ? 'var(--warning)' : 'var(--success)'
                      }}>
                        {rep.severity || 'Medium'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${rep.status.toLowerCase()}`}>{rep.status}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(rep.reported_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleOpenDetails(rep.report_id)}
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        <Info size={14} />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details & Verification Modal */}
      {showDetailsModal && activeReportDetails && (
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
            maxWidth: '700px',
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

            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              {activeReportDetails.report.title}
            </h2>

            <span className={`badge ${activeReportDetails.report.report_category === 'Emergency' ? 'badge-emergency' : 'badge-pollution'}`} style={{ marginBottom: '16px' }}>
              {activeReportDetails.report.report_category}
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '20px 0' }}>
              {/* Left Column: Image */}
              <div>
                {activeReportDetails.report.image_url ? (
                  <img 
                    src={activeReportDetails.report.image_url.startsWith('http') ? activeReportDetails.report.image_url : `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${activeReportDetails.report.image_url}`} 

                    alt="Report Evidence"
                    style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', maxHeight: '250px', border: '1px solid var(--card-border)' }}
                  />
                ) : (
                  <div style={{ 
                    height: '180px', 
                    borderRadius: '12px', 
                    background: 'rgba(15, 23, 42, 0.02)', 
                    border: '1px dotted var(--card-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem'
                  }}>
                    No image uploaded
                  </div>
                )}
                <div style={{ marginTop: '16px', fontSize: '0.85rem' }}>
                  <p><strong>Coordinates:</strong> {parseFloat(activeReportDetails.report.latitude).toFixed(6)}, {parseFloat(activeReportDetails.report.longitude).toFixed(6)}</p>
                  <p><strong>Location:</strong> {activeReportDetails.report.location_name || 'Coastal boundary'}</p>
                  <p><strong>Reporter:</strong> {activeReportDetails.report.reporter_name} ({activeReportDetails.report.reporter_phone || 'No phone'})</p>
                </div>
              </div>

              {/* Right Column: Description & Actions */}
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Description</h4>
                 <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', background: 'rgba(15, 23, 42, 0.03)', border: '1px solid var(--card-border)', padding: '12px', borderRadius: '8px', minHeight: '80px', marginBottom: '16px' }}>
                  {activeReportDetails.report.description || 'No description provided.'}
                </p>

                <p><strong>Waste Type:</strong> {activeReportDetails.report.waste_type || 'General'}</p>
                <p><strong>Severity:</strong> {activeReportDetails.report.severity || 'Medium'}</p>
                <p><strong>Current Status:</strong> <span className={`badge badge-${activeReportDetails.report.status.toLowerCase()}`} style={{ verticalAlign: 'middle' }}>{activeReportDetails.report.status}</span></p>
                
                {/* Authority verification controls */}
                {['Authority', 'Admin'].includes(user.role) && activeReportDetails.report.status === 'Pending' && (
                  <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0, 187, 249, 0.05)', border: '1px solid rgba(0, 187, 249, 0.2)', borderRadius: '8px' }}>
                    <h5 style={{ color: 'var(--accent-secondary)', marginBottom: '12px' }}>Authority Verification</h5>
                    <div className="form-group">
                      <label className="form-label">Verify Severity Level</label>
                      <select 
                        className="form-control" 
                        value={verificationSeverity}
                        onChange={(e) => setVerificationSeverity(e.target.value)}
                      >
                        <option value="Low">Low (Minor trash, localized)</option>
                        <option value="Medium">Medium (Moderate piles, beach level)</option>
                        <option value="High">High (Severe hazards, emergency oil)</option>
                      </select>
                    </div>
                    <button 
                      onClick={() => handleVerifyReport(activeReportDetails.report.report_id)}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '8px' }}
                    >
                      Verify and Approve Report
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Audit updates timeline */}
            {activeReportDetails.updates && activeReportDetails.updates.length > 0 && (
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Incident Updates & Audit Log</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeReportDetails.updates.map((update) => (
                    <div key={update.update_id} style={{ padding: '10px', background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.04)', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <span>Updated by: {update.updated_by_name}</span>
                        <span>{new Date(update.updated_at).toLocaleString()}</span>
                      </div>
                      <p>
                        Status changed from <strong>{update.old_status}</strong> to <strong>{update.new_status}</strong>.
                      </p>
                      {update.remarks && <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px' }}>Notes: {update.remarks}</p>}
                    </div>
                  ))}
                </div>
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

export default Reports;
