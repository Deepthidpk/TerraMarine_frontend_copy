import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  AlertTriangle,
  Info,
  Check,
  X,
  Trash2,
  ChevronRight,
  Sparkles,
  Layers,
  FileText,
  User,
  Calendar,
  Compass,
  ArrowRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

const SpeciesManagement = () => {
  const { user, authFetch } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('Pending'); // 'All' | 'Pending' | 'Approved' | 'Rejected'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Active Selections
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Notifications
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Auto-dismiss alerts
  useEffect(() => {
    if (actionSuccess) {
      const t = setTimeout(() => setActionSuccess(''), 4000);
      return () => clearTimeout(t);
    }
  }, [actionSuccess]);

  useEffect(() => {
    if (actionError) {
      const t = setTimeout(() => setActionError(''), 5000);
      return () => clearTimeout(t);
    }
  }, [actionError]);

  // Fetch Submissions and Stats
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const [subsRes, catsRes] = await Promise.all([
        authFetch('/species/submissions'),
        authFetch('/species/categories')
      ]);

      if (subsRes.ok) {
        const data = await subsRes.json();
        setSubmissions(data.submissions || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        throw new Error('Failed to load researcher species submissions.');
      }

      if (catsRes.ok) {
        const cData = await catsRes.json();
        setCategoriesList(cData.categories || []);
      }
    } catch (err) {
      console.error('Fetch species submissions error:', err);
      setActionError(err.message || 'Error connecting to marine species registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Filtered Submissions List
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Status Filter
      const currentStatus = sub.approval_status || 'Approved';
      if (statusFilter !== 'All' && currentStatus !== statusFilter) {
        return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'All' && sub.category !== categoryFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (sub.name || '').toLowerCase().includes(q);
        const sciMatch = (sub.scientificName || sub.scientific_name || '').toLowerCase().includes(q);
        const authorMatch = (sub.author_name || sub.created_by_name || '').toLowerCase().includes(q);
        const notesMatch = (sub.notes || '').toLowerCase().includes(q);
        const habitatMatch = (sub.habitat || '').toLowerCase().includes(q);
        if (!nameMatch && !sciMatch && !authorMatch && !notesMatch && !habitatMatch) {
          return false;
        }
      }

      return true;
    });
  }, [submissions, statusFilter, categoryFilter, searchQuery]);

  // Actions: Approve
  const handleApprove = async (speciesId, speciesName) => {
    try {
      const res = await authFetch(`/species/${speciesId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve species submission.');
      }

      setActionSuccess(`"${speciesName}" has been approved and published to the Researcher Species Explorer!`);
      if (selectedSubmission && (selectedSubmission.id === speciesId || selectedSubmission.species_id === speciesId)) {
        setSelectedSubmission(null);
      }
      fetchSubmissions();
    } catch (err) {
      console.error('Approve error:', err);
      setActionError(err.message || 'Error approving species.');
    }
  };

  // Actions: Open Reject Modal
  const handleOpenReject = (item) => {
    setRejectingItem(item);
    setRejectionReason('');
  };

  // Actions: Submit Rejection
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingItem) return;

    if (!rejectionReason.trim()) {
      setActionError('Please specify a reason or guidance note for rejecting this submission.');
      return;
    }

    setRejectSubmitting(true);
    try {
      const sId = rejectingItem.id || rejectingItem.species_id;
      const res = await authFetch(`/species/${sId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject submission.');
      }

      setActionSuccess(`Submission for "${rejectingItem.name}" marked as rejected with feedback sent to the researcher.`);
      setRejectingItem(null);
      setRejectionReason('');
      if (selectedSubmission && (selectedSubmission.id === sId || selectedSubmission.species_id === sId)) {
        setSelectedSubmission(null);
      }
      fetchSubmissions();
    } catch (err) {
      console.error('Reject error:', err);
      setActionError(err.message || 'Error rejecting submission.');
    } finally {
      setRejectSubmitting(false);
    }
  };

  // Actions: Delete
  const handleDelete = async (speciesId, speciesName) => {
    if (!window.confirm(`Permanently remove the submission for "${speciesName}"?`)) {
      return;
    }

    try {
      const res = await authFetch(`/species/${speciesId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete species record.');
      }

      setActionSuccess(`Submission "${speciesName}" removed.`);
      if (selectedSubmission && (selectedSubmission.id === speciesId || selectedSubmission.species_id === speciesId)) {
        setSelectedSubmission(null);
      }
      fetchSubmissions();
    } catch (err) {
      console.error('Delete error:', err);
      setActionError(err.message || 'Error deleting species record.');
    }
  };

  // Resolve image URL
  const resolveSpecimenImage = (img) => {
    if (!img) return '/images/whale_shark.png';
    if (img.startsWith('http') || img.startsWith('/images/')) return img;
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    return `${serverUrl}${img}`;
  };

  // Preset rejection templates
  const presetReasons = [
    'Specimen photograph is unclear or lacks key morphological markers.',
    'Taxonomy or scientific classification appears inaccurate; please verify genus and species nomenclature.',
    'Insufficient typical habitat or ecological threat notes provided.',
    'Duplicate species record already cataloged in the live registry.'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Toast Alerts */}
      {actionSuccess && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          padding: '14px 22px',
          borderRadius: '12px',
          zIndex: 9999,
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <Check size={20} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#ffffff',
          padding: '14px 22px',
          borderRadius: '12px',
          zIndex: 9999,
          boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <AlertTriangle size={20} />
          <span>{actionError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HEADER SECTION */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{
        padding: '28px 32px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(8, 20, 42, 0.95) 0%, rgba(5, 15, 32, 0.98) 100%)',
        border: '1px solid rgba(0, 229, 255, 0.25)',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              color: '#00e5ff',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '10px'
            }}>
              <ShieldCheck size={14} />
              <span>Municipal Authority Ecological Verification</span>
            </div>

            <h1 style={{ margin: '0 0 8px 0', fontSize: '1.85rem', fontWeight: '800', color: '#ffffff' }}>
              Marine Species Review & Approvals
            </h1>

            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', maxWidth: '720px', lineHeight: '1.5' }}>
              Review, verify, and approve marine biodiversity profiles uploaded by research scientists. 
              Approved species are published immediately to the <strong style={{ color: '#00e5ff' }}>Researcher Species Explorer</strong>; 
              unapproved or rejected submissions remain hidden until resolved.
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={fetchSubmissions}
              disabled={loading}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                background: 'rgba(10, 25, 48, 0.7)',
                color: '#ffffff',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              title="Refresh submissions list"
            >
              <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STATS OVERVIEW CARDS */}
      {/* ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Pending Approvals */}
        <div 
          onClick={() => setStatusFilter('Pending')}
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: statusFilter === 'Pending' 
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)' 
              : 'rgba(8, 20, 42, 0.7)',
            border: statusFilter === 'Pending' ? '1px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: statusFilter === 'Pending' ? '0 0 20px rgba(245, 158, 11, 0.25)' : 'none'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24',
            flexShrink: 0
          }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Pending Review
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fbbf24', marginTop: '2px' }}>
              {stats.pending || 0}
            </div>
          </div>
        </div>

        {/* Card 2: Approved Species */}
        <div 
          onClick={() => setStatusFilter('Approved')}
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: statusFilter === 'Approved' 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)' 
              : 'rgba(8, 20, 42, 0.7)',
            border: statusFilter === 'Approved' ? '1px solid #10b981' : '1px solid rgba(16, 185, 129, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: statusFilter === 'Approved' ? '0 0 20px rgba(16, 185, 129, 0.25)' : 'none'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399',
            flexShrink: 0
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Approved (Live)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#34d399', marginTop: '2px' }}>
              {stats.approved || 0}
            </div>
          </div>
        </div>

        {/* Card 3: Rejected Submissions */}
        <div 
          onClick={() => setStatusFilter('Rejected')}
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: statusFilter === 'Rejected' 
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)' 
              : 'rgba(8, 20, 42, 0.7)',
            border: statusFilter === 'Rejected' ? '1px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: statusFilter === 'Rejected' ? '0 0 20px rgba(239, 68, 68, 0.25)' : 'none'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f87171',
            flexShrink: 0
          }}>
            <XCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Rejected / Revision
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f87171', marginTop: '2px' }}>
              {stats.rejected || 0}
            </div>
          </div>
        </div>

        {/* Card 4: Total Submissions */}
        <div 
          onClick={() => setStatusFilter('All')}
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: statusFilter === 'All' 
              ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(2, 132, 199, 0.1) 100%)' 
              : 'rgba(8, 20, 42, 0.7)',
            border: statusFilter === 'All' ? '1px solid #00e5ff' : '1px solid rgba(0, 229, 255, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: statusFilter === 'All' ? '0 0 20px rgba(0, 229, 255, 0.25)' : 'none'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(0, 229, 255, 0.15)',
            border: '1px solid rgba(0, 229, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00e5ff',
            flexShrink: 0
          }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Total Submissions
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#00e5ff', marginTop: '2px' }}>
              {stats.total || 0}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* FILTER & SEARCH CONTROLS BAR */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{
        padding: '18px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'rgba(8, 20, 42, 0.8)',
        borderRadius: '16px',
        border: '1px solid rgba(0, 229, 255, 0.2)'
      }}>
        {/* Top Filter Row: Search + Status Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          
          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(10, 25, 48, 0.9)',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            borderRadius: '12px',
            padding: '8px 14px',
            flex: '1 1 300px',
            minWidth: '240px'
          }}>
            <Search size={18} color="#00e5ff" />
            <input
              type="text"
              placeholder="Search by species name, scientific taxonomy, researcher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#ffffff',
                outline: 'none',
                width: '100%',
                fontSize: '0.88rem'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(10, 25, 48, 0.8)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { key: 'Pending', label: 'Pending Review', count: stats.pending, color: '#fbbf24' },
              { key: 'Approved', label: 'Approved', count: stats.approved, color: '#34d399' },
              { key: 'Rejected', label: 'Rejected', count: stats.rejected, color: '#f87171' },
              { key: 'All', label: 'All Submissions', count: stats.total, color: '#00e5ff' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: statusFilter === tab.key ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                  color: statusFilter === tab.key ? '#ffffff' : '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  background: statusFilter === tab.key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                  color: statusFilter === tab.key ? '#ffffff' : tab.color
                }}>
                  {tab.count || 0}
                </span>
              </button>
            ))}
          </div>

        </div>

        {/* Bottom Category Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} /> Category:
          </span>
          <button
            onClick={() => setCategoryFilter('All')}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '600',
              border: categoryFilter === 'All' ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
              background: categoryFilter === 'All' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(10, 25, 48, 0.5)',
              color: categoryFilter === 'All' ? '#00e5ff' : '#cbd5e1',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            All Categories
          </button>
          {categoriesList.map(cat => (
            <button
              key={cat.id || cat.category_id || cat.name}
              onClick={() => setCategoryFilter(cat.name)}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '600',
                border: categoryFilter === cat.name ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                background: categoryFilter === cat.name ? 'rgba(0, 229, 255, 0.15)' : 'rgba(10, 25, 48, 0.5)',
                color: categoryFilter === cat.name ? '#00e5ff' : '#cbd5e1',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBMISSIONS LIST / GRID */}
      {/* ========================================================================= */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#00e5ff' }}>
          <RefreshCw size={32} className="spin-icon" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>Loading species submissions...</div>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="glass-panel" style={{
          textAlign: 'center',
          padding: '60px 20px',
          borderRadius: '16px',
          background: 'rgba(8, 20, 42, 0.6)',
          border: '1px dashed rgba(0, 229, 255, 0.25)'
        }}>
          <Info size={44} color="#00e5ff" style={{ opacity: 0.6, marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: '#ffffff' }}>
            No Species Submissions Found
          </h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>
            {statusFilter === 'Pending' 
              ? 'Great job! There are currently no pending species submissions awaiting your review.' 
              : 'No species match the selected filters or search keyword.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {filteredSubmissions.map((sub) => {
            const currentStatus = sub.approval_status || 'Approved';
            const isPending = currentStatus === 'Pending';
            const isApproved = currentStatus === 'Approved';
            const isRejected = currentStatus === 'Rejected';

            return (
              <div
                key={sub.id || sub.species_id}
                className="glass-panel"
                style={{
                  padding: 0,
                  borderRadius: '18px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(12, 28, 56, 0.9) 0%, rgba(8, 20, 40, 0.95) 100%)',
                  border: isPending 
                    ? '1px solid rgba(245, 158, 11, 0.5)' 
                    : isApproved 
                    ? '1px solid rgba(16, 185, 129, 0.35)' 
                    : '1px solid rgba(239, 68, 68, 0.35)',
                  boxShadow: isPending 
                    ? '0 8px 24px rgba(245, 158, 11, 0.12)' 
                    : '0 8px 20px rgba(0,0,0,0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Specimen Image Header */}
                <div style={{ position: 'relative', height: '180px', overflow: 'hidden', background: '#051329' }}>
                  <img
                    src={resolveSpecimenImage(sub.image)}
                    alt={sub.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onClick={() => setPreviewImage(resolveSpecimenImage(sub.image))}
                    title="Click to view specimen photo"
                  />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, rgba(5, 19, 41, 0.2) 0%, rgba(5, 19, 41, 0.85) 100%)',
                    pointerEvents: 'none'
                  }} />

                  {/* Status Badge (Top Left) */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: isPending 
                      ? 'rgba(245, 158, 11, 0.9)' 
                      : isApproved 
                      ? 'rgba(16, 185, 129, 0.9)' 
                      : 'rgba(239, 68, 68, 0.9)',
                    color: isPending ? '#051329' : '#ffffff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                  }}>
                    {isPending && <Clock size={13} />}
                    {isApproved && <CheckCircle2 size={13} />}
                    {isRejected && <XCircle size={13} />}
                    <span>{isPending ? 'Pending Review' : isApproved ? 'Approved & Live' : 'Rejected'}</span>
                  </div>

                  {/* Conservation Status Badge (Top Right) */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    background: sub.status === 'Endangered' || sub.status === 'Critically Endangered' 
                      ? 'rgba(239, 68, 68, 0.85)' 
                      : 'rgba(0, 229, 255, 0.85)',
                    color: sub.status === 'Endangered' || sub.status === 'Critically Endangered' ? '#ffffff' : '#051329'
                  }}>
                    {sub.status || 'Least Concern'}
                  </div>

                  {/* Category Pill (Bottom Left on Image) */}
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '14px',
                    color: '#00e5ff',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}>
                    {sub.category}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                  
                  {/* Title & Scientific Name */}
                  <div>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>
                      {sub.name}
                    </h3>
                    <div style={{ fontSize: '0.82rem', fontStyle: 'italic', color: '#94a3b8' }}>
                      {sub.scientificName || sub.scientific_name}
                    </div>
                  </div>

                  {/* Researcher Attribution Card */}
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(10, 25, 48, 0.6)',
                    border: '1px solid rgba(0, 229, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.76rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        flexShrink: 0
                      }}>
                        {(sub.author_name || sub.created_by_name || 'R').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '700', color: '#e2e8f0' }}>
                          {sub.author_name || sub.created_by_name || 'Marine Researcher'}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                          {sub.author_email || 'Researcher Submission'}
                        </div>
                      </div>
                    </div>

                    <div style={{ color: '#64748b', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <Calendar size={12} />
                      <span>{new Date(sub.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Ecological Highlights */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                    {sub.habitat && (
                      <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#cbd5e1' }}>
                        <strong style={{ color: '#94a3b8' }}>Habitat: </strong>{sub.habitat}
                      </div>
                    )}
                    {sub.threats && (
                      <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#cbd5e1' }}>
                        <strong style={{ color: '#94a3b8' }}>Threats: </strong>{sub.threats}
                      </div>
                    )}
                  </div>

                  {/* If Rejected, display Rejection Feedback */}
                  {isRejected && sub.rejection_reason && (
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      fontSize: '0.76rem',
                      color: '#fca5a5'
                    }}>
                      <div style={{ fontWeight: '700', color: '#ef4444', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={12} /> Rejection Feedback:
                      </div>
                      <div>{sub.rejection_reason}</div>
                    </div>
                  )}

                  {/* If Approved, show reviewed by badge */}
                  {isApproved && sub.reviewed_by_name && (
                    <div style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} /> Approved by {sub.reviewed_by_name}
                    </div>
                  )}

                  {/* Card Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: 'auto',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    {/* View Full Details button */}
                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="btn btn-secondary"
                      style={{
                        flex: '1',
                        padding: '8px',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        borderRadius: '10px',
                        background: 'rgba(10, 25, 48, 0.7)',
                        border: '1px solid rgba(0, 229, 255, 0.25)',
                        color: '#00e5ff'
                      }}
                    >
                      <Eye size={14} />
                      <span>Inspect</span>
                    </button>

                    {/* Approve Action */}
                    {isPending && (
                      <button
                        onClick={() => handleApprove(sub.id || sub.species_id, sub.name)}
                        className="btn btn-primary"
                        style={{
                          flex: '1',
                          padding: '8px',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          color: '#ffffff',
                          fontWeight: '700'
                        }}
                      >
                        <Check size={14} />
                        <span>Approve</span>
                      </button>
                    )}

                    {/* Reject Action */}
                    {isPending && (
                      <button
                        onClick={() => handleOpenReject(sub)}
                        style={{
                          padding: '8px 12px',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          borderRadius: '10px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#f87171',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                        title="Reject submission with feedback"
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    )}

                    {/* Quick Re-Approve if previously rejected */}
                    {isRejected && (
                      <button
                        onClick={() => handleApprove(sub.id || sub.species_id, sub.name)}
                        className="btn btn-primary"
                        style={{
                          flex: '1',
                          padding: '8px',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          color: '#ffffff',
                          fontWeight: '700'
                        }}
                      >
                        <Check size={14} />
                        <span>Re-Approve</span>
                      </button>
                    )}

                    {/* Delete junk button */}
                    <button
                      onClick={() => handleDelete(sub.id || sub.species_id, sub.name)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Delete record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FULL SPECIES INSPECTION & VERIFICATION MODAL */}
      {/* ========================================================================= */}
      {selectedSubmission && (
        <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div
            className="modal-card glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '720px',
              width: '95%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(12, 28, 56, 0.98) 0%, rgba(8, 20, 40, 0.99) 100%)',
              border: '1px solid rgba(0, 229, 255, 0.35)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#00e5ff', letterSpacing: '0.08em' }}>
                  Specimen Profile Dossier
                </span>
                <h2 style={{ margin: '2px 0 0 0', fontSize: '1.45rem', color: '#ffffff' }}>
                  {selectedSubmission.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Specimen Hero Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              
              {/* Photo Preview */}
              <div 
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  height: '240px',
                  background: '#051329',
                  border: '1px solid rgba(0, 229, 255, 0.2)',
                  position: 'relative'
                }}
              >
                <img
                  src={resolveSpecimenImage(selectedSubmission.image)}
                  alt={selectedSubmission.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#ffffff',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Eye size={12} /> Specimen Photo
                </div>
              </div>

              {/* Taxonomy Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
                <div style={{ padding: '8px 12px', background: 'rgba(10, 25, 48, 0.6)', borderRadius: '10px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Scientific Taxonomy</div>
                  <div style={{ fontStyle: 'italic', fontWeight: '700', color: '#00e5ff', fontSize: '0.95rem' }}>
                    {selectedSubmission.scientificName || selectedSubmission.scientific_name}
                  </div>
                </div>

                <div style={{ padding: '8px 12px', background: 'rgba(10, 25, 48, 0.6)', borderRadius: '10px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Taxonomy Class</div>
                  <div style={{ fontWeight: '600', color: '#ffffff' }}>
                    {selectedSubmission.category}
                  </div>
                </div>

                <div style={{ padding: '8px 12px', background: 'rgba(10, 25, 48, 0.6)', borderRadius: '10px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Conservation Status</div>
                  <div style={{ fontWeight: '700', color: selectedSubmission.status === 'Endangered' || selectedSubmission.status === 'Critically Endangered' ? '#ef4444' : '#10b981' }}>
                    {selectedSubmission.status}
                  </div>
                </div>

                <div style={{ padding: '8px 12px', background: 'rgba(10, 25, 48, 0.6)', borderRadius: '10px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Pollution Sensitivity Index</div>
                  <div style={{ fontWeight: '700', color: '#38bdf8' }}>
                    {selectedSubmission.sensitivity || 'Medium'}
                  </div>
                </div>
              </div>

            </div>

            {/* Researcher Attribution Block */}
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(2, 132, 199, 0.1)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={18} color="#00e5ff" />
                <div>
                  <strong style={{ color: '#ffffff' }}>Submitted by: </strong>
                  <span>{selectedSubmission.author_name || selectedSubmission.created_by_name || 'Marine Researcher'}</span>
                  {selectedSubmission.author_email && (
                    <span style={{ color: '#94a3b8', marginLeft: '6px' }}>({selectedSubmission.author_email})</span>
                  )}
                </div>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                {new Date(selectedSubmission.created_at || Date.now()).toLocaleString()}
              </div>
            </div>

            {/* Detailed Ecological Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.86rem', lineHeight: '1.5' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(10, 25, 48, 0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ color: '#00e5ff' }}>Typical Habitat:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#cbd5e1' }}>
                  {selectedSubmission.habitat || 'No habitat details provided.'}
                </p>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(10, 25, 48, 0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ color: '#f87171' }}>Anthropogenic & Chemical Threats:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#cbd5e1' }}>
                  {selectedSubmission.threats || 'No specific threats documented.'}
                </p>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(10, 25, 48, 0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ color: '#fbbf24' }}>Research Field Notes:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                  {selectedSubmission.notes || 'No additional research field notes logged.'}
                </p>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px', borderRadius: '12px' }}
              >
                Close
              </button>

              {(selectedSubmission.approval_status === 'Pending' || selectedSubmission.approval_status === 'Rejected') && (
                <button
                  type="button"
                  onClick={() => handleApprove(selectedSubmission.id || selectedSubmission.species_id, selectedSubmission.name)}
                  className="btn btn-primary"
                  style={{
                    flex: 1.5,
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Check size={18} />
                  <span>Approve & Publish to Explorer</span>
                </button>
              )}

              {selectedSubmission.approval_status === 'Pending' && (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenReject(selectedSubmission);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#f87171',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <X size={18} />
                  <span>Reject with Notes</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REJECTION & FEEDBACK MODAL */}
      {/* ========================================================================= */}
      {rejectingItem && (
        <div className="modal-overlay" onClick={() => setRejectingItem(null)}>
          <div
            className="modal-card glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '540px',
              width: '95%',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(16, 20, 36, 0.98) 0%, rgba(10, 14, 28, 0.99) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
              padding: '26px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <XCircle size={24} color="#ef4444" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff' }}>
                  Reject Species Submission
                </h3>
              </div>
              <button onClick={() => setRejectingItem(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '0 0 16px 0', lineHeight: '1.5' }}>
              You are reviewing the submission for <strong style={{ color: '#ffffff' }}>"{rejectingItem.name}"</strong> by researcher <strong style={{ color: '#00e5ff' }}>{rejectingItem.author_name || rejectingItem.created_by_name || 'Researcher'}</strong>. 
              Please provide constructive feedback so the researcher can update and resubmit.
            </p>

            {/* Preset Templates */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Quick Feedback Presets:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {presetReasons.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: rejectionReason === preset ? 'rgba(239, 68, 68, 0.15)' : 'rgba(10, 25, 48, 0.5)',
                      color: rejectionReason === preset ? '#fca5a5' : '#cbd5e1',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    "{preset}"
                  </button>
                ))}
              </div>
            </div>

            {/* Custom feedback input */}
            <form onSubmit={handleConfirmReject}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: '600' }}>
                  Review Feedback / Reason for Rejection *
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter specific notes or guidance for the researcher..."
                  style={{
                    background: 'rgba(8, 20, 42, 0.8)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#ffffff',
                    fontSize: '0.84rem'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectSubmitting}
                  style={{
                    flex: 1.5,
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {rejectSubmitting ? 'Submitting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LIGHTBOX SPECIMEN PHOTO */}
      {/* ========================================================================= */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)} style={{ background: 'rgba(0,0,0,0.92)' }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="Full Specimen View"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '16px', border: '2px solid rgba(0, 229, 255, 0.4)' }}
            />
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SpeciesManagement;
