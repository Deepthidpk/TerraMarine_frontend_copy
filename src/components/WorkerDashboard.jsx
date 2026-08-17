import React, { useState, useEffect } from 'react';
import WorkerProfileSetupModal from './WorkerProfileSetupModal';
import { 
  CheckSquare, Clock, Camera, ShieldCheck, User, Calendar, MapPin, 
  Upload, CheckCircle2, AlertCircle, FileText, X, ArrowRight, Award,
  Search, RotateCcw, DollarSign, History, Layers, PlusCircle
} from 'lucide-react';

const WorkerDashboard = ({ user, authFetch, navigate }) => {
  const [myTasks, setMyTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab State: 'my_tasks' | 'available_tasks' | 'history' | 'payments'
  const [activeTab, setActiveTab] = useState('my_tasks');

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
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchWorkerData = async () => {
    setLoading(true);
    try {
      const [myRes, availRes, payRes] = await Promise.all([
        authFetch('/tasks?type=my_tasks'),
        authFetch('/tasks?type=available'),
        authFetch('/payments')
      ]);

      if (myRes.ok) {
        const myData = await myRes.json();
        setMyTasks(myData.tasks || []);
      }
      if (availRes.ok) {
        const availData = await availRes.json();
        setAvailableTasks(availData.tasks || []);
      }
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

  const handleAcceptTask = async (taskId) => {
    setFormError('');
    setSuccessMsg('');
    try {
      const res = await authFetch(`/tasks/${taskId}/accept`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept task.');
      }
      setSuccessMsg('Cleanup task accepted successfully! It is now listed under your active tasks.');
      fetchWorkerData();
      setActiveTab('my_tasks');
    } catch (err) {
      setFormError(err.message || 'Error accepting cleanup task.');
    }
  };

  const validateProofField = (fieldName, value, extraFile) => {
    switch (fieldName) {
      case 'completionNotes': {
        const val = (value !== undefined ? value : completionNotes || '').trim();
        if (!val) return 'Completion notes are required. Describe the cleanup work done.';
        if (!/[a-zA-Z0-9]/.test(val) || !/^[a-zA-Z0-9\s.,()'-]+$/.test(val)) {
          return 'Special characters are not allowed. Please enter letters and numbers only.';
        }
        if (val.length < 10) return 'Completion notes must be at least 10 characters long (e.g. Cleaned 5 bags of net waste).';
        if (val.length > 500) return 'Completion notes cannot exceed 500 characters.';
        return null;
      }
      case 'afterImage': {
        const file = extraFile !== undefined ? extraFile : afterImage;
        const existingImage = selectedTask?.after_image;
        if (!file && !existingImage) {
          return 'An after-cleanup proof photo is required to submit task completion.';
        }
        if (file) {
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
          if (!allowedTypes.includes(file.type.toLowerCase())) {
            return 'Invalid file format. Please upload a valid image file (JPG, PNG, WEBP).';
          }
          if (file.size > 5 * 1024 * 1024) {
            return 'Image file size is too large (maximum allowed size is 5 MB).';
          }
        }
        return null;
      }
      default:
        return null;
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        const err = 'Invalid file format. Please upload a valid image file (JPG, PNG, WEBP).';
        setFieldErrors(prev => ({ ...prev, afterImage: err }));
        setAfterImage(null);
        setPreviewUrl('');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        const err = 'Image file size is too large (maximum allowed size is 5 MB).';
        setFieldErrors(prev => ({ ...prev, afterImage: err }));
        setAfterImage(null);
        setPreviewUrl('');
        return;
      }

      setAfterImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFieldErrors(prev => ({ ...prev, afterImage: null }));
    } else {
      setAfterImage(null);
      setPreviewUrl(selectedTask?.after_image || '');
      const err = validateProofField('afterImage', null, null);
      setFieldErrors(prev => ({ ...prev, afterImage: err }));
    }
  };

  const handleOpenCompleteModal = (task) => {
    setSelectedTask(task);
    setCompletionNotes(task.completion_notes || '');
    setAfterImage(null);
    setPreviewUrl(task.after_image ? task.after_image : '');
    setFormError('');
    setFieldErrors({});
    setShowCompleteModal(true);
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    setFormError('');

    const notesErr = validateProofField('completionNotes', completionNotes);
    const imageErr = validateProofField('afterImage', null, afterImage);

    const activeErrors = {};
    if (notesErr) activeErrors.completionNotes = notesErr;
    if (imageErr) activeErrors.afterImage = imageErr;

    if (Object.keys(activeErrors).length > 0) {
      setFieldErrors(activeErrors);
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('status', 'Completed');
      formData.append('completion_notes', completionNotes.trim());
      if (afterImage) {
        formData.append('image', afterImage);
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
      setFieldErrors({});
      fetchWorkerData();
    } catch (err) {
      setFormError(err.message || 'Error submitting proof.');
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics computation
  const assignedTasksCount = myTasks.length;
  const pendingCount = myTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
  const completedCount = myTasks.filter(t => t.status === 'Completed').length;
  const verifiedCount = myTasks.filter(t => t.status === 'Verified').length;

  const totalRewardsEarned = payments
    .filter(p => p.payment_status === 'Paid')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const pendingRewards = payments
    .filter(p => p.payment_status === 'Pending')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  // Filtered assigned tasks computation
  const filteredMyTasks = myTasks.filter((t) => {
    if (activeTab === 'my_tasks' && (t.status === 'Completed' || t.status === 'Verified')) {
      return false;
    }

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

  // Check if profile is incomplete (mandatory setup required)
  const isProfileIncomplete = user?.role === 'Worker' && (
    !user?.address || !user?.address.trim() ||
    !user?.district || !user?.district.trim() ||
    !user?.state || !user?.state.trim()
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Mandatory Worker Profile Completion Modal */}
      {isProfileIncomplete && <WorkerProfileSetupModal />}
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

      {formError && (
        <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '12px', color: '#f87171', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} />
          <span>{formError}</span>
        </div>
      )}

      {/* 4 Metric Stats Cards Across Top */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '20px' }}>
        {/* Card 1: Total Tasks (RED THEME) */}
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
            <div className="stat-val">{pendingCount}</div>
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

      {/* SECTION 1: MY ASSIGNED & ACCEPTED TASKS */}
      {activeTab === 'my_tasks' && (
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
                Showing {filteredMyTasks.length} of {myTasks.length} assigned tasks
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
          ) : filteredMyTasks.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 20px', background: 'rgba(8, 20, 42, 0.4)', borderRadius: '12px', border: '1px dashed rgba(0, 229, 255, 0.2)' }}>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#ffffff' }}>No cleanup tasks found.</p>
              {availableTasks.length > 0 && (
                <button
                  onClick={() => setActiveTab('available_tasks')}
                  style={{ marginTop: '12px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Browse Available Tasks to Accept ({availableTasks.length}) →
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
                  {filteredMyTasks.map((t) => (
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
                            Upload Proof
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenCompleteModal(t)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            View Proof Details
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

      {/* SECTION 2: AVAILABLE CLEANUP TASKS TO ACCEPT */}
      {activeTab === 'available_tasks' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '800', color: '#ffffff' }}>
                Available Coastal Cleanup Tasks
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Browse open cleanup tasks created by Municipal Authorities and click Accept Task to claim them.
              </span>
            </div>

            <button
              onClick={fetchWorkerData}
              style={{
                background: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                color: '#00e5ff',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Refresh List
            </button>
          </div>

          {availableTasks.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 20px', background: 'rgba(8, 20, 42, 0.4)', borderRadius: '12px', border: '1px dashed rgba(0, 229, 255, 0.2)' }}>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#ffffff' }}>No open available tasks right now.</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>Check back soon or review your currently assigned tasks.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Incident Name</th>
                    <th>Location</th>
                    <th>Waste Type</th>
                    <th>Campaign Link</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableTasks.map((t) => (
                    <tr key={t.task_id}>
                      <td style={{ fontWeight: '700', color: '#ffffff' }}>{t.report_title}</td>
                      <td>{t.location_name}</td>
                      <td>
                        <span className="badge badge-pending">
                          {t.waste_type || 'General litter'}
                        </span>
                      </td>
                      <td>{t.campaign_name || 'Direct Authority Task'}</td>
                      <td>
                        <button
                          onClick={() => handleAcceptTask(t.task_id)}
                          className="btn btn-primary"
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            fontWeight: '700',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <CheckSquare size={14} />
                          Accept Task
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: PARTICIPATION HISTORY */}
      {activeTab === 'history' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '800', color: '#ffffff' }}>
              Worker Participation History & Proofs Log
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              All completed and verified coastal cleanup tasks carried out by you
            </span>
          </div>

          {historyTasks.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 20px', background: 'rgba(8, 20, 42, 0.4)', borderRadius: '12px', border: '1px dashed rgba(0, 229, 255, 0.2)' }}>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#ffffff' }}>No completed cleanup history yet.</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>Completed tasks and verified proof uploads will appear here in your history log.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {historyTasks.map((t) => (
                <div key={t.task_id} style={{ background: 'rgba(8, 20, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.25)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: '#ffffff', fontWeight: '700', fontSize: '1rem' }}>{t.report_title}</h4>
                    <span className={`badge ${t.status === 'Verified' ? 'badge-completed' : 'badge-verified'}`}>
                      {t.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>📍 <strong>Location:</strong> {t.location_name}</div>
                    <div>🗓️ <strong>Completed Date:</strong> {t.completed_date ? new Date(t.completed_date).toLocaleDateString() : 'Pending'}</div>
                    <div>💬 <strong>Notes:</strong> {t.completion_notes || 'No remarks added'}</div>
                  </div>

                  {t.after_image && (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#00e5ff', fontWeight: '700', display: 'block', marginBottom: '4px' }}>After-Cleanup Proof Photo:</span>
                      <img src={t.after_image} alt="After cleanup proof" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(0, 229, 255, 0.3)' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.82rem' }}>
                    <span style={{ color: '#10b981', fontWeight: '700' }}>Reward: ₹500.00</span>
                    <button onClick={() => handleOpenCompleteModal(t)} style={{ background: 'none', border: 'none', color: '#00e5ff', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

            <form onSubmit={handleSubmitProof} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: '600', margin: 0 }}>Completion Notes / Remarks *</label>
                  <span style={{ fontSize: '0.72rem', color: completionNotes.trim().length > 500 ? '#ff4d4d' : '#94a3b8', fontWeight: '600' }}>
                    {completionNotes.trim().length}/500
                  </span>
                </div>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Describe the waste collected, volume cleaned, and current site condition..."
                  value={completionNotes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCompletionNotes(val);
                    const err = validateProofField('completionNotes', val);
                    setFieldErrors(prev => ({ ...prev, completionNotes: err }));
                  }}
                  onBlur={(e) => {
                    const err = validateProofField('completionNotes', e.target.value);
                    setFieldErrors(prev => ({ ...prev, completionNotes: err }));
                  }}
                  style={{ 
                    color: '#ffffff', 
                    background: 'rgba(8, 20, 42, 0.8)', 
                    border: fieldErrors.completionNotes ? '1px solid #ff4d4d' : '1px solid rgba(0, 229, 255, 0.25)', 
                    boxShadow: fieldErrors.completionNotes ? '0 0 8px rgba(255, 77, 77, 0.3)' : 'none',
                    resize: 'vertical' 
                  }}
                />
                {fieldErrors.completionNotes && (
                  <span style={{ color: '#ff4d4d', fontSize: '0.74rem', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                    ⚠️ {fieldErrors.completionNotes}
                  </span>
                )}
              </div>

              <div>
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: '600' }}>Upload After-Cleanup Image * (JPG, PNG, max 5MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ 
                    display: 'block', 
                    margin: '8px 0', 
                    color: '#cbd5e1',
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'rgba(8, 20, 42, 0.8)',
                    border: fieldErrors.afterImage ? '1px solid #ff4d4d' : '1px solid rgba(0, 229, 255, 0.25)',
                    boxShadow: fieldErrors.afterImage ? '0 0 8px rgba(255, 77, 77, 0.3)' : 'none'
                  }}
                />
                {fieldErrors.afterImage && (
                  <span style={{ color: '#ff4d4d', fontSize: '0.74rem', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                    ⚠️ {fieldErrors.afterImage}
                  </span>
                )}
                {previewUrl && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <img
                      src={previewUrl}
                      alt="Proof Preview"
                      style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '12px', border: '2px solid #00e5ff', objectFit: 'cover' }}
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
