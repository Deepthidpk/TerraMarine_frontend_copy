import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import LeafletMap from '../components/LeafletMap';
import { Camera, MapPin, CheckCircle, Info, ShieldAlert, Search, Filter, X, RotateCcw, Clock, Layers, FileText, CheckCircle2 } from 'lucide-react';

const Reports = () => {
  const { user, authFetch, API_URL } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationName, setLocationName] = useState('');
  const [wasteType, setWasteType] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [imageFile, setImageFile] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Dynamic Categories & Waste Types State
  const [categoriesList, setCategoriesList] = useState(['Pollution', 'Emergency']);
  const [wasteTypesList, setWasteTypesList] = useState(['Plastic', 'Glass', 'Fishing Nets', 'Oil Spill', 'Dead Marine Life', 'General Litter']);
  const [categoriesFull, setCategoriesFull] = useState([]);
  const [wasteTypesFull, setWasteTypesFull] = useState([]);
  
  // Category & Waste Type Management Modal (Authority Only)
  const [showCategoryMgmtModal, setShowCategoryMgmtModal] = useState(false);
  const [mgmtTab, setMgmtTab] = useState('categories'); // 'categories' | 'waste_types'
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newWasteName, setNewWasteName] = useState('');
  const [newWasteDesc, setNewWasteDesc] = useState('');
  const [mgmtError, setMgmtError] = useState('');
  const [mgmtSuccess, setMgmtSuccess] = useState('');
  const [mgmtSubmitting, setMgmtSubmitting] = useState(false);

  // Auto-dismiss notifications after 2 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Selected location coordinate pick state
  const [selectedCoords, setSelectedCoords] = useState(null);

  // Selected report for Details modal
  const [activeReportDetails, setActiveReportDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [verificationSeverity, setVerificationSeverity] = useState('Medium');

  // Search & Filter & Tracking Tab State
  const [reportTab, setReportTab] = useState('all'); // 'all' | 'my_complaints'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [wasteTypeFilter, setWasteTypeFilter] = useState('All');

  // Filtered reports computation
  const safeReports = Array.isArray(reports) ? reports : [];
  const myComplaintsCount = safeReports.filter(r => r && r.reported_by === user?.user_id).length;

  const filteredReports = safeReports.filter((rep) => {
    if (!rep) return false;
    if (reportTab === 'my_complaints' && rep.reported_by !== user?.user_id) {
      return false;
    }
    if (searchQuery && searchQuery.trim()) {
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

  const getFieldError = (name, value) => {
    if (name === 'title') {
      const val = (value || '').trim();
      if (!val) return 'Title is required.';
      if (!/^[A-Za-z0-9]/.test(val)) return 'Title must start with a letter or number.';
      if (val.length < 3) return 'Title must be at least 3 characters.';
      if (val.length > 100) return 'Title must not exceed 100 characters.';
      if (!/^[A-Za-z0-9][A-Za-z0-9\s.,'-]*$/.test(val)) return 'Title can only contain letters, numbers, spaces, and basic punctuation (.,\'-).';
    } else if (name === 'description') {
      const val = (value || '').trim();
      if (!val) return 'Description is required.';
      if (!/^[A-Za-z0-9]/.test(val)) return 'Description must start with a letter or number.';
      if (val.length < 5) return 'Description must be at least 5 characters.';
      if (val.length > 1000) return 'Description must not exceed 1000 characters.';
      if (!/^[A-Za-z0-9\s.,!?'"()#&%+-]*$/.test(val)) return 'Description contains invalid characters.';
    } else if (name === 'category') {
      if (!value || value === '') return 'Category selection is required.';
    } else if (name === 'wasteType') {
      if (!value || value === '') return 'Waste type selection is required.';
    } else if (name === 'image') {
      if (!imageFile) return 'Upload image proof is required.';
    } else if (name === 'locationName') {
      const val = (value || '').trim();
      if (!val) return 'Beach / Location name is required.';
      if (!/^[A-Za-z0-9]/.test(val)) return 'Location name must start with a letter or number.';
      if (val.length < 3) return 'Location name must be at least 3 characters.';
      if (val.length > 150) return 'Location name must not exceed 150 characters.';
      if (!/^[A-Za-z0-9][A-Za-z0-9\s.,/-]*$/.test(val)) return 'Location name can only contain letters, numbers, spaces, and basic punctuation (.,/-).';
    } else if (name === 'latitude') {
      const val = (value || '').toString().trim();
      const latNum = parseFloat(val);
      if (!val) return 'Latitude is required. Drop a pin on the map or use GPS.';
      if (!/^-?[0-9]+(?:\.[0-9]+)?$/.test(val)) return 'Latitude must be a valid decimal number.';
      if (isNaN(latNum) || latNum < -90 || latNum > 90) return 'Latitude must be between -90 and 90 degrees.';
    } else if (name === 'longitude') {
      const val = (value || '').toString().trim();
      const lngNum = parseFloat(val);
      if (!val) return 'Longitude is required. Drop a pin on the map or use GPS.';
      if (!/^-?[0-9]+(?:\.[0-9]+)?$/.test(val)) return 'Longitude must be a valid decimal number.';
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) return 'Longitude must be between -180 and 180 degrees.';
    }
    return '';
  };

  const validateField = (name, value) => {
    const errorMsg = getFieldError(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: errorMsg }));
    return errorMsg;
  };

  const fetchReports = async () => {
    try {
      const res = await authFetch('/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data.reports) ? data.reports : []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await authFetch('/categories');
      if (res.ok) {
        const data = await res.json();
        if (data.categories && data.categories.length > 0) {
          setCategoriesFull(data.categories);
          setCategoriesList(data.categories.map(c => c.name));
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchWasteTypes = async () => {
    try {
      const res = await authFetch('/waste-types');
      if (res.ok) {
        const data = await res.json();
        if (data.wasteTypes && data.wasteTypes.length > 0) {
          setWasteTypesFull(data.wasteTypes);
          setWasteTypesList(data.wasteTypes.map(w => w.name));
        }
      }
    } catch (err) {
      console.error('Error fetching waste types:', err);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchCategories();
    fetchWasteTypes();
  }, []);

  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    setMgmtError('');
    setMgmtSuccess('');

    if (!newCatName.trim()) {
      setMgmtError('Category name is required.');
      return;
    }

    setMgmtSubmitting(true);
    try {
      const res = await authFetch('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() })
      });
      let data = {};
      try { data = await res.json(); } catch (e) {}

      if (!res.ok) {
        setMgmtError(data.error || 'Failed to add category.');
      } else {
        setMgmtSuccess(`Category "${data.category?.name || newCatName}" added successfully!`);
        setNewCatName('');
        setNewCatDesc('');
        fetchCategories();
      }
    } catch (err) {
      setMgmtError('Network error while adding category: ' + (err.message || 'Server unavailable'));
    } finally {
      setMgmtSubmitting(false);
    }
  };

  const handleAddWasteTypeSubmit = async (e) => {
    e.preventDefault();
    setMgmtError('');
    setMgmtSuccess('');

    if (!newWasteName.trim()) {
      setMgmtError('Waste type name is required.');
      return;
    }

    setMgmtSubmitting(true);
    try {
      const res = await authFetch('/waste-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWasteName.trim(), description: newWasteDesc.trim() })
      });
      let data = {};
      try { data = await res.json(); } catch (e) {}

      if (!res.ok) {
        setMgmtError(data.error || 'Failed to add waste type.');
      } else {
        setMgmtSuccess(`Waste type "${data.wasteType?.name || newWasteName}" added successfully!`);
        setNewWasteName('');
        setNewWasteDesc('');
        fetchWasteTypes();
      }
    } catch (err) {
      setMgmtError('Network error while adding waste type: ' + (err.message || 'Server unavailable'));
    } finally {
      setMgmtSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catItem) => {
    const catName = typeof catItem === 'string' ? catItem : catItem.name;
    const catId = typeof catItem === 'object' && catItem.category_id ? catItem.category_id : catName;

    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) return;

    setMgmtError('');
    setMgmtSuccess('');
    try {
      const res = await authFetch(`/categories/${encodeURIComponent(catId)}`, {
        method: 'DELETE'
      });
      let data = {};
      try { data = await res.json(); } catch (e) {}

      if (!res.ok) {
        setMgmtError(data.error || `Failed to delete category "${catName}".`);
      } else {
        setMgmtSuccess(`Category "${catName}" deleted successfully!`);
        fetchCategories();
      }
    } catch (err) {
      setMgmtError(`Network error deleting category: ${err.message || 'Server error'}`);
    }
  };

  const handleDeleteWasteType = async (wasteItem) => {
    const wasteName = typeof wasteItem === 'string' ? wasteItem : wasteItem.name;
    const wasteId = typeof wasteItem === 'object' && wasteItem.waste_type_id ? wasteItem.waste_type_id : wasteName;

    if (!window.confirm(`Are you sure you want to delete waste type "${wasteName}"?`)) return;

    setMgmtError('');
    setMgmtSuccess('');
    try {
      const res = await authFetch(`/waste-types/${encodeURIComponent(wasteId)}`, {
        method: 'DELETE'
      });
      let data = {};
      try { data = await res.json(); } catch (e) {}

      if (!res.ok) {
        setMgmtError(data.error || `Failed to delete waste type "${wasteName}".`);
      } else {
        setMgmtSuccess(`Waste type "${wasteName}" deleted successfully!`);
        fetchWasteTypes();
      }
    } catch (err) {
      setMgmtError(`Network error deleting waste type: ${err.message || 'Server error'}`);
    }
  };

  const handleMapClick = async (lat, lng) => {
    setSelectedCoords({ lat, lng });
    const latStr = lat.toFixed(7);
    const lngStr = lng.toFixed(7);
    setLatitude(latStr);
    setLongitude(lngStr);
    validateField('latitude', latStr);
    validateField('longitude', lngStr);

    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData.display_name) {
          const simpleName = geoData.address?.amenity || geoData.address?.beach || geoData.address?.suburb || geoData.address?.road || geoData.address?.city || geoData.display_name.split(',')[0];
          setLocationName(simpleName);
          validateField('locationName', simpleName);
        }
      }
    } catch (e) {
      // Ignore geocode errors if offline
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    let errorMsg = '';
    if (!file) {
      errorMsg = 'Upload image proof is required.';
      setImageFile(null);
    } else {
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        errorMsg = 'Only image files (JPG, JPEG, PNG, GIF, WEBP) are allowed.';
      } else if (file.size > 10 * 1024 * 1024) {
        errorMsg = 'Image size exceeds the 10MB limit.';
      }
      
      if (!errorMsg) {
        setImageFile(file);
      } else {
        setImageFile(null);
        e.target.value = null;
      }
    }
    setFieldErrors((prev) => ({ ...prev, image: errorMsg }));
  };

  const handleCreateReportSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate all fields strictly
    const errors = {};
    const titleErr = getFieldError('title', title);
    if (titleErr) errors.title = titleErr;

    const descErr = getFieldError('description', description);
    if (descErr) errors.description = descErr;

    const catErr = getFieldError('category', category);
    if (catErr) errors.category = catErr;

    const wasteErr = getFieldError('wasteType', wasteType);
    if (wasteErr) errors.wasteType = wasteErr;

    const locErr = getFieldError('locationName', locationName);
    if (locErr) errors.locationName = locErr;

    const latErr = getFieldError('latitude', latitude);
    if (latErr) errors.latitude = latErr;

    const lngErr = getFieldError('longitude', longitude);
    if (lngErr) errors.longitude = lngErr;

    const imgErr = getFieldError('image', imageFile);
    if (imgErr) errors.image = imgErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
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
      setShowCreateModal(false);
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setWasteType('');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: '#ffffff', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
            Pollution & Incident Reports
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Track My Complaints Button */}
          {['Citizen', 'Fisherman', 'Volunteer'].includes(user?.role) && (
            <button
              onClick={() => setReportTab(prev => prev === 'my_complaints' ? 'all' : 'my_complaints')}
              className="btn btn-secondary"
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                border: reportTab === 'my_complaints' ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.2)',
                background: reportTab === 'my_complaints' ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.9) 0%, rgba(0, 229, 255, 0.9) 100%)' : 'rgba(12, 28, 54, 0.7)',
                color: reportTab === 'my_complaints' ? '#041126' : '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: reportTab === 'my_complaints' ? '0 4px 16px rgba(0, 229, 255, 0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Clock size={16} />
              <span>{reportTab === 'my_complaints' ? 'Showing My Complaints' : 'Track my Complaints'}</span>
              <span style={{ 
                background: reportTab === 'my_complaints' ? 'rgba(4, 17, 38, 0.25)' : 'rgba(0, 229, 255, 0.2)', 
                color: reportTab === 'my_complaints' ? '#041126' : '#00e5ff', 
                padding: '2px 8px', 
                borderRadius: '10px', 
                fontSize: '0.75rem', 
                fontWeight: '800' 
              }}>
                {myComplaintsCount}
              </span>
            </button>
          )}

          {(user?.role === 'Authority' || user?.role === 'Admin') && (
            <button 
              onClick={() => setShowCategoryMgmtModal(true)} 
              className="btn btn-secondary"
              style={{ 
                padding: '12px 20px', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(2, 132, 199, 0.25) 100%)', 
                color: '#00e5ff', 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                boxShadow: '0 4px 15px rgba(0, 229, 255, 0.15)',
                cursor: 'pointer',
                border: '1px solid rgba(0, 229, 255, 0.4)'
              }}
            >
              <Layers size={18} />
              <span>+ Manage Categories & Waste Types</span>
            </button>
          )}

          {user?.role !== 'Authority' && (
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="btn btn-primary"
              style={{ 
                padding: '12px 20px', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
                color: '#ffffff', 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                boxShadow: '0 4px 20px rgba(0, 229, 255, 0.3)',
                cursor: 'pointer',
                border: '1px solid rgba(0, 229, 255, 0.4)'
              }}
            >
              <Camera size={18} />
              <span>+ Report Pollution Incident</span>
            </button>
          )}
        </div>
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

      {/* ========================================================================= */}
      {/* MODAL: REPORT POLLUTION INCIDENT */}
      {/* ========================================================================= */}
      {showCreateModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(4, 12, 26, 0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '1080px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(12, 28, 54, 0.98) 0%, rgba(8, 20, 40, 0.99) 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            position: 'relative',
            padding: '28px',
            margin: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Camera size={24} color="#00e5ff" />
                <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#ffffff', fontWeight: '800' }}>
                  Report Pollution Incident
                </h2>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Split 2 Column Layout: Form (Left) & Interactive Map Location Picker (Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
              {/* Form */}
              <div>
                <form onSubmit={handleCreateReportSubmit}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Title *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Bulk plastic bottles wash up" 
                      value={title}
                      onChange={(e) => { setTitle(e.target.value); validateField('title', e.target.value); }}
                      onBlur={(e) => validateField('title', e.target.value)}
                      style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: fieldErrors.title ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)' }}
                    />
                    {fieldErrors.title && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                        {fieldErrors.title}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Description *</label>
                    <textarea 
                      className="form-control" 
                      placeholder="Provide brief details on trash volume, source, or hazard status" 
                      rows="3"
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); validateField('description', e.target.value); }}
                      onBlur={(e) => validateField('description', e.target.value)}
                      style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: fieldErrors.description ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)' }}
                    />
                    {fieldErrors.description && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                        {fieldErrors.description}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Category *</label>
                      <select 
                        className="form-control" 
                        value={category}
                        onChange={(e) => { setCategory(e.target.value); validateField('category', e.target.value); }}
                        onBlur={(e) => validateField('category', e.target.value)}
                        style={{ color: category ? '#ffffff' : '#94a3b8', background: 'rgba(8, 20, 42, 0.8)', border: fieldErrors.category ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)' }}
                      >
                        <option value="" style={{ color: '#94a3b8', background: '#08142a' }}>-- Select Category * --</option>
                        {categoriesList.map((cat) => (
                          <option key={cat} value={cat} style={{ color: '#ffffff', background: '#08142a' }}>{cat}</option>
                        ))}
                      </select>
                      {fieldErrors.category && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                          {fieldErrors.category}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Waste Type *</label>
                      <select 
                        className="form-control" 
                        value={wasteType}
                        onChange={(e) => { setWasteType(e.target.value); validateField('wasteType', e.target.value); }}
                        onBlur={(e) => validateField('wasteType', e.target.value)}
                        style={{ color: wasteType ? '#ffffff' : '#94a3b8', background: 'rgba(8, 20, 42, 0.8)', border: fieldErrors.wasteType ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)' }}
                      >
                        <option value="" style={{ color: '#94a3b8', background: '#08142a' }}>-- Select Waste Type * --</option>
                        {wasteTypesList.map((wt) => (
                          <option key={wt} value={wt} style={{ color: '#ffffff', background: '#08142a' }}>{wt}</option>
                        ))}
                      </select>
                      {fieldErrors.wasteType && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                          {fieldErrors.wasteType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Beach / Location Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Fort Kochi Walkway" 
                      value={locationName}
                      onChange={(e) => { setLocationName(e.target.value); validateField('locationName', e.target.value); }}
                      onBlur={(e) => validateField('locationName', e.target.value)}
                      style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: fieldErrors.locationName ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)' }}
                    />
                    {fieldErrors.locationName && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                        {fieldErrors.locationName}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600, marginBottom: 0 }}>Location GPS Coordinates *</label>
                    <button
                      type="button"
                      onClick={handleDetectGPSLocation}
                      style={{
                        background: '#0284c7',
                        color: 'white',
                        border: 'none',
                        padding: '4px 10px',
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Latitude *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Click on the map right →" 
                        value={latitude}
                        onChange={(e) => { setLatitude(e.target.value); validateField('latitude', e.target.value); }}
                        onBlur={(e) => validateField('latitude', e.target.value)}
                        style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: fieldErrors.latitude ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)' }}
                      />
                      {fieldErrors.latitude && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                          {fieldErrors.latitude}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Longitude *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Click on the map right →" 
                        value={longitude}
                        onChange={(e) => { setLongitude(e.target.value); validateField('longitude', e.target.value); }}
                        onBlur={(e) => validateField('longitude', e.target.value)}
                        style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: fieldErrors.longitude ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)' }}
                      />
                      {fieldErrors.longitude && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                          {fieldErrors.longitude}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '4px' }}>
                    <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Upload Image Proof *</label>
                    <input 
                      type="file" 
                      id="report-image-input"
                      className="form-control" 
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: fieldErrors.image ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)' }}
                    />
                    {fieldErrors.image && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                        {fieldErrors.image}
                      </span>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '12px', marginTop: '16px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting Report...' : 'Submit Report'}
                  </button>
                </form>
              </div>

              {/* Right Column Interactive Map Location Picker */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <MapPin size={18} color="#00e5ff" />
                  <h4 style={{ margin: 0, color: '#ffffff', fontSize: '0.95rem', fontWeight: 700 }}>
                    Pick Coordinates on Map
                  </h4>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 12px 0' }}>
                  📍 Click anywhere on the coastal line on the map below to drop a pin. Coordinates & location name fill automatically.
                </p>
                <div style={{ height: '420px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0, 229, 255, 0.25)', position: 'relative' }}>
                  <LeafletMap 
                    onLocationSelect={handleMapClick} 
                    selectedLocation={selectedCoords} 
                    reports={reports}
                  />
                </div>
                {selectedCoords && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.3)', borderRadius: '8px', fontSize: '0.78rem', color: '#00e5ff', fontWeight: '600' }}>
                    🎯 Selected Coordinates: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
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
          gridTemplateColumns: ['Authority', 'Admin'].includes(user?.role) ? '2.5fr 1fr 1fr 1fr' : '2.5fr 1.5fr 1.5fr',
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
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter (Authority / Admin Only) */}
          {['Authority', 'Admin'].includes(user?.role) && (
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
          )}

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
              {wasteTypesList.map((wt) => (
                <option key={wt} value={wt}>{wt}</option>
              ))}
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
          <div className="table-container" style={{ borderRadius: '14px', border: '1px solid rgba(0, 229, 255, 0.2)', background: 'rgba(6, 18, 38, 0.75)', overflowX: 'auto' }}>
            <table className="custom-table" style={{ width: '100%', tableLayout: 'auto', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(4, 14, 30, 0.95)', borderBottom: '1px solid rgba(0, 229, 255, 0.2)' }}>
                  <th style={{ padding: '8px 12px', fontSize: '0.72rem', letterSpacing: '0.06em', textAlign: 'left', color: '#94a3b8', fontWeight: '700' }}>TITLE</th>
                  <th style={{ padding: '8px 12px', fontSize: '0.72rem', letterSpacing: '0.06em', textAlign: 'left', color: '#94a3b8', fontWeight: '700' }}>LOCATION</th>
                  <th style={{ padding: '8px 12px', fontSize: '0.72rem', letterSpacing: '0.06em', textAlign: 'left', color: '#94a3b8', fontWeight: '700' }}>WASTE TYPE</th>
                  <th style={{ padding: '8px 12px', fontSize: '0.72rem', letterSpacing: '0.06em', textAlign: 'left', color: '#94a3b8', fontWeight: '700' }}>CATEGORY</th>
                  {['Authority', 'Admin'].includes(user?.role) && (
                    <th style={{ padding: '8px 12px', fontSize: '0.72rem', letterSpacing: '0.06em', textAlign: 'center', color: '#94a3b8', fontWeight: '700' }}>SEVERITY</th>
                  )}
                  <th style={{ padding: '8px 12px', fontSize: '0.72rem', letterSpacing: '0.06em', textAlign: 'center', color: '#94a3b8', fontWeight: '700', whiteSpace: 'nowrap' }}>REPORTED DATE</th>
                  <th style={{ padding: '8px 12px', fontSize: '0.72rem', letterSpacing: '0.06em', textAlign: 'center', color: '#94a3b8', fontWeight: '700', whiteSpace: 'nowrap' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((rep) => (
                  <tr key={rep.report_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s ease' }}>
                    <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                      <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.8rem', lineHeight: '1.3', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {rep.status === 'Pending' && ['Authority', 'Admin'].includes(user?.role) && (
                          <span 
                            title="New complaint requiring approval"
                            style={{
                              width: '9px',
                              height: '9px',
                              borderRadius: '50%',
                              background: '#10b981',
                              boxShadow: '0 0 10px #10b981',
                              flexShrink: 0,
                              display: 'inline-block'
                            }} 
                          />
                        )}
                        <span>{rep.title}</span>
                        {rep.status === 'Pending' && ['Authority', 'Admin'].includes(user?.role) && (
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            color: '#10b981',
                            fontSize: '0.68rem',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontWeight: '700',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            Requires Approval
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                        <MapPin size={13} color="#00e5ff" style={{ flexShrink: 0 }} />
                        <span>{rep.location_name || `${parseFloat(rep.latitude).toFixed(4)}, ${parseFloat(rep.longitude).toFixed(4)}`}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.78rem', color: '#e2e8f0', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {rep.waste_type || 'General'}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      <span className={`badge ${rep.report_category === 'Emergency' ? 'badge-emergency' : 'badge-pollution'}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                        {rep.report_category}
                      </span>
                    </td>
                    {['Authority', 'Admin'].includes(user?.role) && (
                      <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          fontWeight: '700', 
                          fontSize: '0.78rem',
                          color: rep.severity === 'High' ? '#ff4d4d' : rep.severity === 'Medium' ? '#ffb703' : '#00f5d4'
                        }}>
                          {rep.severity || 'Medium'}
                        </span>
                      </td>
                    )}
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: '0.78rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                      {new Date(rep.reported_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button 
                        onClick={() => handleOpenDetails(rep.report_id)}
                        className="btn btn-secondary" 
                        style={{ 
                          padding: '4px 10px', 
                          fontSize: '0.75rem', 
                          borderRadius: '6px', 
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        <Info size={13} />
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
            maxWidth: '740px',
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

            {/* Live Complaint Progress Stepper */}
            <div style={{
              margin: '18px 0 22px 0',
              padding: '18px 20px',
              background: 'rgba(5, 18, 38, 0.85)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} />
                  Live Complaint Tracking Timeline
                </h4>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Tracking Ref: <strong style={{ color: '#ffffff' }}>#REP-{activeReportDetails.report.report_id}</strong>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', textAlign: 'center' }}>
                {/* Step 1: Submitted */}
                <div style={{ padding: '10px 8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', fontWeight: '700', fontSize: '0.8rem' }}>✓</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#ffffff' }}>1. Complaint Filed</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>{new Date(activeReportDetails.report.reported_at).toLocaleDateString()}</div>
                </div>

                {/* Step 2: Under Review */}
                <div style={{ padding: '10px 8px', background: ['Verified', 'InProgress', 'Resolved', 'Completed'].includes(activeReportDetails.report.status) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 229, 255, 0.08)', border: ['Verified', 'InProgress', 'Resolved', 'Completed'].includes(activeReportDetails.report.status) ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(0, 229, 255, 0.3)', borderRadius: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: ['Verified', 'InProgress', 'Resolved', 'Completed'].includes(activeReportDetails.report.status) ? '#10b981' : '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', fontWeight: '700', fontSize: '0.8rem' }}>
                    {['Verified', 'InProgress', 'Resolved', 'Completed'].includes(activeReportDetails.report.status) ? '✓' : '2'}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#ffffff' }}>2. Authority Review</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>{activeReportDetails.report.status === 'Pending' ? 'In Review' : 'Verified'}</div>
                </div>

                {/* Step 3: Action Scheduled */}
                <div style={{ padding: '10px 8px', background: ['InProgress', 'Resolved', 'Completed'].includes(activeReportDetails.report.status) ? 'rgba(16, 185, 129, 0.1)' : activeReportDetails.report.status === 'Verified' ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255,255,255,0.03)', border: ['InProgress', 'Resolved', 'Completed'].includes(activeReportDetails.report.status) ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: ['InProgress', 'Resolved', 'Completed'].includes(activeReportDetails.report.status) ? '#10b981' : activeReportDetails.report.status === 'Verified' ? '#0284c7' : 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', fontWeight: '700', fontSize: '0.8rem' }}>
                    {['InProgress', 'Resolved', 'Completed'].includes(activeReportDetails.report.status) ? '✓' : '3'}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: ['InProgress', 'Resolved', 'Completed', 'Verified'].includes(activeReportDetails.report.status) ? '#ffffff' : '#64748b' }}>3. Cleanup Action</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>{activeReportDetails.report.status === 'InProgress' ? 'Drive Active' : ['Resolved', 'Completed'].includes(activeReportDetails.report.status) ? 'Completed' : 'Pending'}</div>
                </div>

                {/* Step 4: Resolved */}
                <div style={{ padding: '10px 8px', background: ['Resolved', 'Completed'].includes(activeReportDetails.report.status) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)', border: ['Resolved', 'Completed'].includes(activeReportDetails.report.status) ? '1px solid #00f5d4' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: ['Resolved', 'Completed'].includes(activeReportDetails.report.status) ? '#00f5d4' : 'rgba(255,255,255,0.2)', color: ['Resolved', 'Completed'].includes(activeReportDetails.report.status) ? '#041126' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', fontWeight: '700', fontSize: '0.8rem' }}>
                    {['Resolved', 'Completed'].includes(activeReportDetails.report.status) ? '✓' : '4'}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: ['Resolved', 'Completed'].includes(activeReportDetails.report.status) ? '#00f5d4' : '#64748b' }}>4. Resolved</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>{['Resolved', 'Completed'].includes(activeReportDetails.report.status) ? 'Restored' : 'Awaiting'}</div>
                </div>
              </div>
            </div>

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
                {['Authority', 'Admin'].includes(user?.role) && (
                  <p><strong>Severity:</strong> {activeReportDetails.report.severity || 'Medium'}</p>
                )}
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

      {/* ========================================================================= */}
      {/* MODAL: AUTHORITY CATEGORY & WASTE TYPE MANAGEMENT */}
      {/* ========================================================================= */}
      {showCategoryMgmtModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(4, 12, 26, 0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
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
            background: 'linear-gradient(135deg, rgba(12, 28, 54, 0.98) 0%, rgba(8, 20, 40, 0.99) 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            position: 'relative',
            padding: '28px',
            margin: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={24} color="#00e5ff" />
                <h2 style={{ fontSize: '1.3rem', margin: 0, color: '#ffffff', fontWeight: '800' }}>
                  Manage Categories & Waste Types
                </h2>
              </div>
              <button 
                onClick={() => { setShowCategoryMgmtModal(false); setMgmtError(''); setMgmtSuccess(''); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Tab selector */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
              <button
                type="button"
                onClick={() => { setMgmtTab('categories'); setMgmtError(''); setMgmtSuccess(''); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: mgmtTab === 'categories' ? '#0284c7' : 'rgba(255,255,255,0.05)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Categories ({categoriesList.length})
              </button>
              <button
                type="button"
                onClick={() => { setMgmtTab('waste_types'); setMgmtError(''); setMgmtSuccess(''); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: mgmtTab === 'waste_types' ? '#0284c7' : 'rgba(255,255,255,0.05)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Waste Types ({wasteTypesList.length})
              </button>
            </div>

            {mgmtSuccess && (
              <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', borderRadius: '8px', color: '#34d399', marginBottom: '16px', fontSize: '0.85rem' }}>
                {mgmtSuccess}
              </div>
            )}
            {mgmtError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', borderRadius: '8px', color: '#f87171', marginBottom: '16px', fontSize: '0.85rem' }}>
                {mgmtError}
              </div>
            )}

            {mgmtTab === 'categories' ? (
              <div>
                {/* Form to add category */}
                <form onSubmit={handleAddCategorySubmit} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.15)', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#00e5ff', fontSize: '0.95rem' }}>+ Add New Category</h4>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Category Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Chemical Hazard" 
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.25)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Description (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Brief description of this report category..." 
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.25)' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={mgmtSubmitting}
                    style={{
                      padding: '8px 18px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {mgmtSubmitting ? 'Adding...' : 'Add Category'}
                  </button>
                </form>

                {/* List of categories */}
                <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '10px' }}>Active Categories</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {categoriesList.map((catName) => {
                    const catObj = categoriesFull.find(c => c.name === catName) || { name: catName };
                    return (
                      <span key={catName} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.25)', borderRadius: '20px', color: '#00e5ff', fontSize: '0.82rem', fontWeight: '600' }}>
                        <span>{catName}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(catObj)}
                          title={`Delete category ${catName}`}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                {/* Form to add waste type */}
                <form onSubmit={handleAddWasteTypeSubmit} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.15)', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#00e5ff', fontSize: '0.95rem' }}>+ Add New Waste Type</h4>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Waste Type Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Industrial Sludge" 
                      value={newWasteName}
                      onChange={(e) => setNewWasteName(e.target.value)}
                      style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.25)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Description (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Brief description of this waste type..." 
                      value={newWasteDesc}
                      onChange={(e) => setNewWasteDesc(e.target.value)}
                      style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.25)' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={mgmtSubmitting}
                    style={{
                      padding: '8px 18px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {mgmtSubmitting ? 'Adding...' : 'Add Waste Type'}
                  </button>
                </form>

                {/* List of waste types */}
                <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '10px' }}>Active Waste Types</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {wasteTypesList.map((wtName) => {
                    const wtObj = wasteTypesFull.find(w => w.name === wtName) || { name: wtName };
                    return (
                      <span key={wtName} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '20px', color: '#34d399', fontSize: '0.82rem', fontWeight: '600' }}>
                        <span>{wtName}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteWasteType(wtObj)}
                          title={`Delete waste type ${wtName}`}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Reports;
