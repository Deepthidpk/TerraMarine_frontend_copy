import React, { useState } from 'react';
import { 
  Calendar, Users, Award, ShieldAlert, CheckCircle, Bell,
  AlertTriangle, MapPin, Search, PlusCircle, Info, ChevronRight, X, Clock, FileText, Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';

const NGODashboard = ({ 
  user, 
  reports, 
  campaigns, 
  alerts, 
  notifications, 
  navigate 
}) => {
  // Statistics specific to the NGO
  const safeReports = Array.isArray(reports) ? reports : [];
  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
  
  const myCampaigns = safeCampaigns.filter(c => c.creator_id === user.user_id || c.organization_name === user.organization_name);
  const activeMyCampaigns = myCampaigns.filter(c => c.status === 'Upcoming' || c.status === 'Ongoing');
  const completedMyCampaigns = myCampaigns.filter(c => c.status === 'Completed');
  
  const totalVolunteersMobilized = myCampaigns.reduce((acc, curr) => acc + (parseInt(curr.volunteer_count) || 0), 0);

  // Unresolved pollution reports (can be viewed by NGO to plan campaigns)
  const pendingReports = safeReports.filter(r => r.status === 'Pending' || r.status === 'Verified').slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header welcome banner */}
      <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: '#ffffff', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
            NGO Control Center
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            {user.organization_name || user.full_name}
          </p>
        </div>

      </div>

      {/* Weather & Coastal Warnings Alert Banner */}
      {alerts && alerts.length > 0 && (
        <div className="glass-panel" style={{ 
          background: 'rgba(239, 68, 68, 0.12)', 
          borderColor: 'rgba(239, 68, 68, 0.4)', 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          padding: '16px'
        }}>
          <ShieldAlert size={28} color="#ff4d4d" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ color: '#ff4d4d', marginBottom: '4px', fontSize: '0.95rem', fontWeight: '700' }}>
              ACTIVE COASTAL WARNING: {alerts[0].title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#fca5a5', margin: 0 }}>
              {alerts[0].description} (Radius: {alerts[0].radius_km} km around {alerts[0].latitude}, {alerts[0].longitude})
            </p>
          </div>
        </div>
      )}

      {/* 4 Metric Stats Cards Across Top (NGO Specific) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Card 1: Total Campaigns */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(28, 20, 36, 0.85) 0%, rgba(14, 25, 48, 0.95) 100%)',
          border: '1px solid rgba(255, 77, 77, 0.35)',
          boxShadow: '0 8px 24px rgba(255, 77, 77, 0.12)',
          position: 'relative', overflow: 'hidden', padding: '20px', borderRadius: '16px'
        }}>
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'rgba(255, 77, 77, 0.2)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 77, 77, 0.4)' }}>
              <Calendar size={24} color="#ff4d4d" />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Campaigns</span>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' }}>{myCampaigns.length}</div>
            </div>
          </div>
        </div>

        {/* Card 2: Active Cleanups */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(10, 38, 64, 0.85) 0%, rgba(8, 25, 46, 0.95) 100%)',
          border: '1px solid rgba(0, 229, 255, 0.35)',
          boxShadow: '0 8px 24px rgba(0, 229, 255, 0.12)',
          position: 'relative', overflow: 'hidden', padding: '20px', borderRadius: '16px'
        }}>
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'rgba(0, 229, 255, 0.2)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.4)' }}>
              <Clock size={24} color="#00e5ff" />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Cleanups</span>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' }}>{activeMyCampaigns.length}</div>
            </div>
          </div>
        </div>

        {/* Card 3: Volunteers Mobilized */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(10, 42, 50, 0.85) 0%, rgba(6, 28, 38, 0.95) 100%)',
          border: '1px solid rgba(0, 245, 212, 0.35)',
          boxShadow: '0 8px 24px rgba(0, 245, 212, 0.12)',
          position: 'relative', overflow: 'hidden', padding: '20px', borderRadius: '16px'
        }}>
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'rgba(0, 245, 212, 0.2)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0, 245, 212, 0.4)' }}>
              <Users size={24} color="#00f5d4" />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Volunteers Mobilized</span>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' }}>{totalVolunteersMobilized}</div>
            </div>
          </div>
        </div>

        {/* Card 4: Completed Campaigns */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(28, 20, 56, 0.85) 0%, rgba(16, 14, 40, 0.95) 100%)',
          border: '1px solid rgba(157, 78, 221, 0.35)',
          boxShadow: '0 8px 24px rgba(157, 78, 221, 0.12)',
          position: 'relative', overflow: 'hidden', padding: '20px', borderRadius: '16px'
        }}>
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'rgba(157, 78, 221, 0.2)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(157, 78, 221, 0.4)' }}>
              <Globe size={24} color="#9d4edd" />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Drives</span>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' }}>{completedMyCampaigns.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* NGO's Ongoing Campaigns List */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#00e5ff" />
              Your Active Campaigns
            </h3>
            <button 
              onClick={() => navigate('/campaigns')}
              style={{ background: 'none', border: 'none', color: '#00e5ff', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}
            >
              View All
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {activeMyCampaigns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8', background: 'rgba(8, 20, 42, 0.4)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <Calendar size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No active campaigns currently.</p>
                <button 
                  onClick={() => navigate('/campaigns')}
                  style={{ marginTop: '10px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.2)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Create one now
                </button>
              </div>
            ) : (
              activeMyCampaigns.slice(0, 4).map(camp => (
                <div key={camp.campaign_id} style={{ padding: '14px', background: 'rgba(8, 20, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.95rem' }}>{camp.campaign_name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} color="#00e5ff" /> {camp.location}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} color="#00f5d4" /> {camp.volunteer_count || 0} Vols</span>
                    </div>
                  </div>
                  <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>{camp.status}</span>
                </div>
              ))
            )}
          </div>
        </div>



      </div>
    </div>
  );
};

export default NGODashboard;
