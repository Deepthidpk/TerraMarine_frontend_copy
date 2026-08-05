import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Clock, Camera, ShieldCheck, User, Calendar, MapPin, 
  Upload, CheckCircle2, AlertCircle, FileText, X, ArrowRight, Award,
  Search, RotateCcw
} from 'lucide-react';

const WorkerDashboard = ({ user, authFetch, navigate }) => {
  const [tasks, setTasks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Task Completion Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [afterImage, setAfterImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchWorkerData = async () => {
    setLoading(true);
    try {
      // Fetch tasks assigned to worker
      const tasksRes = await authFetch('/tasks?type=my_tasks');
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }

      // Fetch payments for worker
      const payRes = await authFetch('/payments');
      if (payRes.ok) {
        const payData = await payRes.json();
        setPayments(payData.payments || []);
      }
    } catch (err) {
      console.error('Error fetching worker dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormError('Image file size must be less than 10MB.');
        return;
      }
      setAfterImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormError('');
    }
  };

  const handleOpenCompleteModal = (task) => {
    setSelectedTask(task);
    setCompletionNotes(task.completion_notes || '');
    setAfterImage(null);
    setPreviewUrl(task.after_image ? task.after_image : '');
    setFormError('');
    setShowCompleteModal(true);
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!afterImage && !selectedTask?.after_image) {
      setFormError('Please upload an after-cleanup proof photo.');
      return;
    }
    if (!completionNotes.trim()) {
      setFormError('Please provide completion notes describing the cleanup work done.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('status', 'Completed');
      formData.append('completion_notes', completionNotes.trim());
      if (afterImage) {
        formData.append('after_image', afterImage);
      }

      const res = await authFetch(`/tasks/${selectedTask.task_id}/status`, {
        method: 'PUT',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit task completion proof.');
      }

      setSuccessMsg('Cleanup task completed! Proof submitted for Municipal Authority verification.');
      setShowCompleteModal(false);
      fetchWorkerData();
    } catch (err) {
      setFormError(err.message || 'Error submitting proof.');
    } finally {
      setSubmitting(false);
    }
  };

  const assignedTasksCount = tasks.length;
  const inProgressCount = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const verifiedCount = tasks.filter(t => t.status === 'Verified').length;

  const totalRewardsEarned = payments
    .filter(p => p.payment_status === 'Paid')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  // Filtered tasks computation
  const filteredTasks = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = t.report_title?.toLowerCase().includes(q);
      const locMatch = t.location_name?.toLowerCase().includes(q);
      const campaignMatch = t.campaign_name?.toLowerCase().includes(q);
      const wasteMatch = t.waste_type?.toLowerCase().includes(q);
      if (!titleMatch && !locMatch && !campaignMatch && !wasteMatch) return false;
    }

    if (statusFilter !== 'All' && t.status !== statusFilter) {
      return false;
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header welcome text */}
      <div style={{ marginBottom: '4px' }}>
        <h1 style={{ fontSize: '1.85rem', color: '#ffffff', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
          Welcome back, <span style={{ color: '#00e5ff' }}>{user.full_name}</span>!
        </h1>
      </div>

      {successMsg && (
        <div style={{ padding: '14px 18px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '12px', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 4 Metric Stats Cards Across Top (Authority Dashboard / Tasks Page Design) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Card 1: Total Tasks / Assigned Tasks (RED THEME) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(28, 20, 36, 0.85) 0%, rgba(14, 25, 48, 0.95) 100%)',
          border: '1px solid rgba(255, 77, 77, 0.35)',
          boxShadow: '0 8px 24px rgba(255, 77, 77, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 77, 77, 0.2)', border: '1px solid rgba(255, 77, 77, 0.4)' }}>
            <CheckSquare size={24} color="#ff4d4d" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Total Tasks</span>
            <div className="stat-val">{assignedTasksCount}</div>
          </div>
          <img 
            src="/images/red_coral_card_bg.png" 
            alt="Red Coral Artwork" 
            className="card-artwork-blend"
          />
        </div>

        {/* Card 2: Pending Tasks (CYAN BLUE THEME) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(10, 38, 64, 0.85) 0%, rgba(8, 25, 46, 0.95) 100%)',
          border: '1px solid rgba(0, 229, 255, 0.35)',
          boxShadow: '0 8px 24px rgba(0, 229, 255, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 229, 255, 0.2)', border: '1px solid rgba(0, 229, 255, 0.4)' }}>
            <Clock size={24} color="#00e5ff" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Pending Tasks</span>
            <div className="stat-val">{inProgressCount}</div>
          </div>
          <img 
            src="/images/cyan_cleanups_corner.png" 
            alt="Cyan Coral Artwork" 
            className="card-artwork-blend"
          />
        </div>

        {/* Card 3: Submitted Proofs (EMERALD TEAL THEME) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(10, 42, 50, 0.85) 0%, rgba(6, 28, 38, 0.95) 100%)',
          border: '1px solid rgba(0, 245, 212, 0.35)',
          boxShadow: '0 8px 24px rgba(0, 245, 212, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 245, 212, 0.2)', border: '1px solid rgba(0, 245, 212, 0.4)' }}>
            <Camera size={24} color="#00f5d4" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Submitted Proofs</span>
            <div className="stat-val">{completedCount}</div>
          </div>
          <img 
            src="/images/green_teal_campaigns_bg.png" 
            alt="Submitted Proofs Artwork" 
            className="card-artwork-blend"
          />
        </div>

        {/* Card 4: Verified Cleanups (PURPLE THEME) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(28, 20, 56, 0.85) 0%, rgba(16, 14, 40, 0.95) 100%)',
          border: '1px solid rgba(157, 78, 221, 0.35)',
          boxShadow: '0 8px 24px rgba(157, 78, 221, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(157, 78, 221, 0.2)', border: '1px solid rgba(157, 78, 221, 0.4)' }}>
            <ShieldCheck size={24} color="#9d4edd" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Verified Cleanups</span>
            <div className="stat-val">{verifiedCount}</div>
          </div>
          <img 
            src="/images/purple_coral_card_bg.png" 
            alt="Verified Cleanups Artwork" 
            className="card-artwork-blend"
          />
        </div>
      </div>

      {/* Main Assigned Cleanup Tasks Ledger */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '800', color: '#ffffff' }}>
              My Assigned Cleanup Tasks
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Showing {filteredTasks.length} of {tasks.length} assigned tasks
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search incident, location, waste..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 30px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  background: 'rgba(8, 20, 42, 0.8)',
                  color: '#ffffff',
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                background: 'rgba(8, 20, 42, 0.8)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed (Proof Uploaded)</option>
              <option value="Verified">Verified</option>
            </select>

            {(searchQuery || statusFilter !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
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

            <button
              onClick={fetchWorkerData}
              style={{
                background: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                color: '#00e5ff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Refresh Tasks
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Loading worker tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 20px', background: 'rgba(8, 20, 42, 0.4)', borderRadius: '12px', border: '1px dashed rgba(0, 229, 255, 0.2)' }}>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#ffffff' }}>No cleanup tasks found.</p>
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
                  <th>Incident Name</th>
                  <th>Location</th>
                  <th>Campaign / Link</th>
                  <th>Assigned Date</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => (
                  <tr key={t.task_id}>
                    <td style={{ fontWeight: '700', color: '#ffffff' }}>{t.report_title}</td>
                    <td>{t.location_name}</td>
                    <td>{t.campaign_name || 'Direct Authority Task'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(t.assigned_date).toLocaleDateString()}</td>
                    <td style={{ fontSize: '0.85rem' }}>{t.deadline ? new Date(t.deadline).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`badge ${
                        t.status === 'Verified' ? 'badge-completed' :
                        t.status === 'Completed' ? 'badge-verified' : 'badge-pending'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      {['Pending', 'In Progress'].includes(t.status) ? (
                        <button
                          onClick={() => handleOpenCompleteModal(t)}
                          className="btn btn-primary"
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            background: 'linear-gradient(135deg, #0284c7 0%, #00e5ff 100%)',
                            color: '#041126',
                            fontWeight: '700',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Camera size={14} />
                          Complete Task
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenCompleteModal(t)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          View Proof
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

      {/* Modal for Submitting Cleanup Proof */}
      {showCompleteModal && selectedTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(4, 12, 26, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(12, 28, 54, 0.98) 0%, rgba(8, 20, 40, 0.99) 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            padding: '28px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Camera size={22} color="#00e5ff" />
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#ffffff', fontWeight: '800' }}>
                  Cleanup Proof: {selectedTask.report_title}
                </h3>
              </div>
              <button
                onClick={() => setShowCompleteModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', marginBottom: '16px', fontSize: '0.85rem' }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmitProof} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: '600' }}>Completion Notes / Remarks *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Describe the waste collected, volume cleaned, and current site condition..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  style={{ color: '#ffffff', background: 'rgba(8, 20, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.25)', resize: 'vertical' }}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: '600' }}>Upload After-Cleanup Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'block', margin: '8px 0', color: '#cbd5e1' }}
                />
                {previewUrl && (
                  <div style={{ marginTop: '10px', textCenter: 'center' }}>
                    <img
                      src={previewUrl}
                      alt="Proof Preview"
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '12px', border: '2px solid #00e5ff', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Cleanup Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
