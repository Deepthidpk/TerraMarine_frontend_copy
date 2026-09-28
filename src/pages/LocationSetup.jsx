import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  COASTAL_LOCATIONS, 
  getDistrictsByState, 
  getMunicipalitiesByDistrict, 
  getCoastalAreasByMunicipality 
} from '../data/coastalLocations';
import { MapPin, Navigation, Anchor, ShieldAlert, CheckCircle2, ArrowRight, Compass, RefreshCw } from 'lucide-react';

const LocationSetup = () => {
  const { user, updateFishermanLocation } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const [state, setState] = useState(user?.location_state || 'Kerala');
  const [district, setDistrict] = useState(user?.location_district || '');
  const [municipality, setMunicipality] = useState(user?.location_municipality || '');
  const [coastalArea, setCoastalArea] = useState(user?.location_coastal_area || '');

  const [customCoastalArea, setCustomCoastalArea] = useState('');
  const [isCustomArea, setIsCustomArea] = useState(false);

  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState([]);
  const [availableCoastalAreas, setAvailableCoastalAreas] = useState([]);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Update districts when state changes
  useEffect(() => {
    if (state) {
      const dists = getDistrictsByState(state);
      setAvailableDistricts(dists);
      
      // Auto pre-select first district if current district is invalid for new state
      if (!dists.some(d => d.district.toLowerCase() === district.toLowerCase())) {
        if (dists.length > 0) {
          setDistrict(dists[0].district);
        } else {
          setDistrict('');
        }
      }
    } else {
      setAvailableDistricts([]);
      setDistrict('');
    }
  }, [state]);

  // 2. Update municipalities when district changes
  useEffect(() => {
    if (state && district) {
      const munis = getMunicipalitiesByDistrict(state, district);
      setAvailableMunicipalities(munis);

      if (!munis.some(m => m.name.toLowerCase() === municipality.toLowerCase())) {
        if (munis.length > 0) {
          setMunicipality(munis[0].name);
        } else {
          setMunicipality('');
        }
      }
    } else {
      setAvailableMunicipalities([]);
      setMunicipality('');
    }
  }, [state, district]);

  // 3. Update coastal areas when municipality changes
  useEffect(() => {
    if (state && district && municipality) {
      const areas = getCoastalAreasByMunicipality(state, district, municipality);
      setAvailableCoastalAreas(areas);

      if (coastalArea && !areas.includes(coastalArea) && coastalArea !== 'CUSTOM') {
        setIsCustomArea(true);
        setCustomCoastalArea(coastalArea);
      } else if (!coastalArea && areas.length > 0) {
        setCoastalArea(areas[0]);
        setIsCustomArea(false);
      }
    } else {
      setAvailableCoastalAreas([]);
    }
  }, [state, district, municipality]);

  const handleStateChange = (e) => {
    const selected = e.target.value;
    setState(selected);
    setDistrict('');
    setMunicipality('');
    setCoastalArea('');
    setIsCustomArea(false);
    setError('');
  };

  const handleDistrictChange = (e) => {
    const selected = e.target.value;
    setDistrict(selected);
    setMunicipality('');
    setCoastalArea('');
    setIsCustomArea(false);
    setError('');
  };

  const handleMunicipalityChange = (e) => {
    const selected = e.target.value;
    setMunicipality(selected);
    setCoastalArea('');
    setIsCustomArea(false);
    setError('');
  };

  const handleCoastalAreaChange = (e) => {
    const selected = e.target.value;
    if (selected === 'CUSTOM') {
      setIsCustomArea(true);
      setCoastalArea('');
    } else {
      setIsCustomArea(false);
      setCoastalArea(selected);
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalArea = isCustomArea ? customCoastalArea.trim() : coastalArea.trim();

    if (!state) {
      setError('Please select your state.');
      return;
    }
    if (!district) {
      setError('Please select your district.');
      return;
    }
    if (!municipality) {
      setError('Please select your municipality/local body.');
      return;
    }
    if (!finalArea) {
      setError('Please select or specify your exact coastal area.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      await updateFishermanLocation({
        state,
        district,
        municipality,
        coastalArea: finalArea
      });

      setSuccessMsg('📍 Coastal location saved successfully! Redirecting to Fisherman Dashboard...');

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to save location details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const finalDisplayArea = isCustomArea ? (customCoastalArea || 'Custom Coastal Spot') : (coastalArea || 'Selected Area');

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, #071e3d 0%, #020b18 100%)',
      padding: '30px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Graphic Accents */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(0, 229, 255, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }}></div>

      <div style={{
        maxWidth: '680px',
        width: '100%',
        background: 'linear-gradient(135deg, rgba(8, 24, 48, 0.96) 0%, rgba(4, 15, 32, 0.98) 100%)',
        border: '1px solid rgba(0, 229, 255, 0.3)',
        borderRadius: '24px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(16px)',
        padding: '40px 36px',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Brand & Step Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 229, 255, 0.1)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            padding: '6px 16px',
            borderRadius: '20px',
            color: '#00e5ff',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginBottom: '14px'
          }}>
            <Anchor size={16} /> FISHERMAN LOCATION SETUP MODULE
          </div>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '1.85rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-display)'
          }}>
            {isEditMode ? 'Update Coastal Operating Area' : 'Mandatory Coastal Location Setup'}
          </h1>
          <p style={{
            margin: 0,
            color: '#94a3b8',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            maxWidth: '540px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Select your exact fishing zone so TerraMarine can surface site-specific IMD weather warnings, wave height forecasts, and high-seas safety alerts directly to your dashboard.
          </p>
        </div>

        {/* Alert Banners */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            color: '#ef4444',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginBottom: '24px'
          }}>
            <ShieldAlert size={18} shrink={0} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            background: 'rgba(0, 245, 212, 0.15)',
            border: '1px solid rgba(0, 245, 212, 0.4)',
            borderRadius: '12px',
            color: '#00f5d4',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginBottom: '24px'
          }}>
            <CheckCircle2 size={18} shrink={0} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Controls */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Grid for State and District */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            
            {/* Step 1: State */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#00e5ff',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                STEP 1: SELECT COASTAL STATE *
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={state}
                  onChange={handleStateChange}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(8, 20, 42, 0.9)',
                    border: '1px solid rgba(0, 229, 255, 0.25)',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">-- Select State --</option>
                  {COASTAL_LOCATIONS.map((loc) => (
                    <option key={loc.state} value={loc.state}>
                      {loc.state}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: District */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#00e5ff',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                STEP 2: SELECT DISTRICT *
              </label>
              <select
                value={district}
                onChange={handleDistrictChange}
                disabled={!state || availableDistricts.length === 0}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(8, 20, 42, 0.9)',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  outline: 'none',
                  opacity: !state ? 0.5 : 1,
                  cursor: !state ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">-- Select District --</option>
                {availableDistricts.map((d) => (
                  <option key={d.district} value={d.district}>
                    {d.district}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid for Municipality and Coastal Area */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            
            {/* Step 3: Municipality / Local Body */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#00e5ff',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                STEP 3: MUNICIPALITY / LOCAL BODY *
              </label>
              <select
                value={municipality}
                onChange={handleMunicipalityChange}
                disabled={!district || availableMunicipalities.length === 0}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(8, 20, 42, 0.9)',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  outline: 'none',
                  opacity: !district ? 0.5 : 1,
                  cursor: !district ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">-- Select Municipality / Corporation --</option>
                {availableMunicipalities.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 4: Exact Coastal Area */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#00e5ff',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                STEP 4: EXACT COASTAL AREA / HARBOUR *
              </label>
              <select
                value={isCustomArea ? 'CUSTOM' : coastalArea}
                onChange={handleCoastalAreaChange}
                disabled={!municipality || availableCoastalAreas.length === 0}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(8, 20, 42, 0.9)',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  outline: 'none',
                  opacity: !municipality ? 0.5 : 1,
                  cursor: !municipality ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">-- Select Coastal Area --</option>
                {availableCoastalAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
                <option value="CUSTOM">➕ Other / Specify Custom Coastal Area...</option>
              </select>
            </div>
          </div>

          {/* Custom Coastal Area Input if selected */}
          {isCustomArea && (
            <div style={{
              background: 'rgba(0, 229, 255, 0.05)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '6px'
              }}>
                ENTER CUSTOM COASTAL AREA / FISHING LANDING CENTER *
              </label>
              <input
                type="text"
                placeholder="e.g. Munambam Harbour, Cherai North, Chettuva Coast"
                value={customCoastalArea}
                onChange={(e) => setCustomCoastalArea(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(8, 20, 42, 0.9)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  color: '#ffffff',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          )}

          {/* Summary Preview Box */}
          {state && district && municipality && (finalDisplayArea) && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(2, 132, 199, 0.15) 100%)',
              border: '1px dashed rgba(0, 229, 255, 0.4)',
              borderRadius: '16px',
              padding: '18px 20px',
              marginTop: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00e5ff', fontSize: '0.82rem', fontWeight: 800, marginBottom: '6px' }}>
                <Compass size={16} /> CONFIGURATION PREVIEW
              </div>
              <div style={{ fontSize: '1.05rem', color: '#ffffff', fontWeight: 700 }}>
                📍 {finalDisplayArea}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                {municipality}, {district} District, {state} State
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
            {isEditMode && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.92rem'
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                flex: isEditMode ? 2 : 1,
                padding: '14px',
                borderRadius: '12px',
                fontSize: '0.98rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: '1px solid rgba(0, 229, 255, 0.4)',
                boxShadow: '0 4px 20px rgba(0, 229, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {submitting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Saving Coastal Profile...
                </>
              ) : (
                <>
                  Save Location & Access Dashboard <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        {!isEditMode && (
          <p style={{
            textAlign: 'center',
            fontSize: '0.78rem',
            color: '#64748b',
            marginTop: '24px',
            marginBottom: 0
          }}>
            🔒 Mandatory step for Fisherman access. You can update your location at any time from your dashboard header.
          </p>
        )}
      </div>
    </div>
  );
};

export default LocationSetup;
