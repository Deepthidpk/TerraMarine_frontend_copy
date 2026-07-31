import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, MapPin, List, Eye } from 'lucide-react';
import LeafletMap from '../components/LeafletMap';

const Biodiversity = () => {
  const { user, authFetch } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [speciesName, setSpeciesName] = useState('');
  const [observation, setObservation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);

  const fetchLogs = async () => {
    try {
      const res = await authFetch('/researcher/biodiversity');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.reports);
      }
    } catch (err) {
      console.error('Error fetching biodiversity reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleMapClick = (lat, lng) => {
    setSelectedCoords({ lat, lng });
    setLatitude(lat.toFixed(7));
    setLongitude(lng.toFixed(7));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!speciesName) {
      return setError('Species name is required.');
    }
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('species_name', speciesName);
      formData.append('observation', observation);
      if (latitude) formData.append('latitude', latitude);
      if (longitude) formData.append('longitude', longitude);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await authFetch('/researcher/biodiversity', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit biodiversity record.');
      }

      setSuccess('Biodiversity observation logged successfully!');
      setSpeciesName('');
      setObservation('');
      setLatitude('');
      setLongitude('');
      setSelectedCoords(null);
      setImageFile(null);
      if (document.getElementById('bio-image-input')) {
        document.getElementById('bio-image-input').value = '';
      }

      fetchLogs();
    } catch (err) {
      setError(err.message || 'Error occurred while saving biodiversity log.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Marine Biodiversity Logging</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Record logs of rare marine species, dolphin sightings, or negative biodiversity indicators caused by plastics.
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

      {/* Grid split: Form (left) / Map picker (right) for Researchers only */}
      {['Researcher', 'Admin'].includes(user.role) && (
        <div className="grid-2col" style={{ marginBottom: '40px' }}>
          {/* Form */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
              Log Species Observation
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Species Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Indian Humpback Dolphin, Olive Ridley Turtle" 
                  value={speciesName}
                  onChange={(e) => setSpeciesName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Observation Notes</label>
                <textarea 
                  className="form-control" 
                  placeholder="Describe behaviors, health conditions, or count numbers..." 
                  rows="3"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Species Photo</label>
                  <input 
                    type="file" 
                    id="bio-image-input"
                    className="form-control" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Camera size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Photographs help confirm identification details.
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', marginTop: '24px' }}
                disabled={submitting}
              >
                {submitting ? 'Submitting Log...' : 'Record Observation'}
              </button>
            </form>
          </div>

          {/* Interactive Picker Map */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={18} color="var(--accent-primary)" />
              Sighting Location Picker
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
              Click on the shoreline map below to capture the coordinates of the biodiversity log.
            </p>
            <div style={{ flex: 1, minHeight: '350px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
              <LeafletMap 
                onLocationSelect={handleMapClick} 
                selectedLocation={selectedCoords}
              />
            </div>
          </div>
        </div>
      )}

      {/* Logs Grid Listing */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <List size={20} color="var(--accent-secondary)" />
          Biodiversity Sighting Records
        </h3>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Retrieving logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>
            No biodiversity sighting logs found.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {logs.map((log) => (
              <div 
                key={log.record_id} 
                className="glass-panel" 
                style={{ 
                  padding: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  background: 'rgba(15, 23, 42, 0.02)'
                }}
              >
                {log.image ? (
                  <img 
                    src={log.image.startsWith('http') ? log.image : `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${log.image}`} 

                    alt={log.species_name} 
                    style={{ width: '100%', height: '160px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ 
                    height: '160px', 
                    borderRadius: '8px', 
                    background: 'rgba(15, 23, 42, 0.03)', 
                    border: '1px solid var(--card-border)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem'
                  }}>
                    No image available
                  </div>
                )}

                <div>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', marginBottom: '4px' }}>
                    {log.species_name}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Observed on {new Date(log.observed_date).toLocaleDateString()} by {log.researcher_name}
                  </p>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', flex: 1, minHeight: '60px' }}>
                  {log.observation || 'No details provided.'}
                </p>

                {log.latitude && log.longitude && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    borderTop: '1px solid rgba(15, 23, 42, 0.06)',
                    paddingTop: '10px'
                  }}>
                    <MapPin size={12} color="var(--accent-secondary)" />
                    Coordinates: {parseFloat(log.latitude).toFixed(5)}, {parseFloat(log.longitude).toFixed(5)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Biodiversity;
