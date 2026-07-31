import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Redefine leaflet marker icons to fix Vite asset path issues
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// Custom markers for severity/categories
const createCustomIcon = (color) => {
  return new L.DivIcon({
    html: `<span style="background-color: ${color}; width: 14px; height: 14px; display: block; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5)"></span>`,
    className: 'custom-leaflet-marker',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const icons = {
  Emergency: createCustomIcon('#ef4444'), // Red
  Pending: createCustomIcon('#f59e0b'),   // Yellow
  Verified: createCustomIcon('#00bbf9'),  // Blue
  Completed: createCustomIcon('#10b981'), // Green
  Campaign: createCustomIcon('#d946ef'),  // Purple
};

// Location picker subcomponent
const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
};

const LeafletMap = ({ 
  center = [9.9760000, 76.2750000], // Fort Kochi default
  zoom = 13, 
  reports = [], 
  campaigns = [],
  onLocationSelect = null,
  selectedLocation = null 
}) => {

  // Fix icon issue globally
  useEffect(() => {
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render Location Picker Pin */}
      {selectedLocation && (
        <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
          <Popup>Selected Location: {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}</Popup>
        </Marker>
      )}

      {/* Render Pollution Reports */}
      {reports.map((report) => {
        if (!report.latitude || !report.longitude) return null;
        
        let iconType = icons.Pending;
        if (report.report_category === 'Emergency') {
          iconType = icons.Emergency;
        } else if (report.status === 'Verified') {
          iconType = icons.Verified;
        } else if (report.status === 'Completed') {
          iconType = icons.Completed;
        }

        return (
          <Marker 
            key={report.report_id} 
            position={[parseFloat(report.latitude), parseFloat(report.longitude)]}
            icon={iconType}
          >
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <span className={`badge ${report.report_category === 'Emergency' ? 'badge-emergency' : 'badge-pollution'}`} style={{ marginBottom: '8px' }}>
                  {report.report_category}
                </span>
                <h4 style={{ margin: '4px 0', fontSize: '0.95rem' }}>{report.title}</h4>
                <p style={{ margin: '4px 0 8px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Location: {report.location_name || 'Coastal Line'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Severity: {report.severity || 'Medium'}</span>
                  <span className={`badge badge-${report.status.toLowerCase()}`}>{report.status}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Render Cleanup Campaigns */}
      {campaigns.map((camp) => {
        if (!camp.latitude || !camp.longitude) return null;

        return (
          <Marker 
            key={camp.campaign_id} 
            position={[parseFloat(camp.latitude), parseFloat(camp.longitude)]}
            icon={icons.Campaign}
          >
            <Popup>
              <div style={{ minWidth: '180px' }}>
                <span className="badge badge-verified" style={{ marginBottom: '8px', background: 'rgba(217, 70, 239, 0.15)', color: '#d946ef' }}>
                  Campaign
                </span>
                <h4 style={{ margin: '4px 0', fontSize: '0.95rem' }}>{camp.campaign_name}</h4>
                <p style={{ margin: '4px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Date: {new Date(camp.campaign_date).toLocaleDateString()}
                </p>
                <p style={{ margin: '2px 0 8px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Location: {camp.location}
                </p>
                <a href={`/campaigns`} style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                  View details &rarr;
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Enable Location Selection via Clicking */}
      {onLocationSelect && <LocationPicker onLocationSelect={onLocationSelect} />}
    </MapContainer>
  );
};

export default LeafletMap;
