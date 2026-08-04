import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckSquare, User, Calendar, Image, Info, Camera, Send, FileText,
  PlusCircle, X, Search, Filter, RotateCcw, Clock, CheckCircle2, AlertCircle, ShieldCheck
} from 'lucide-react';

const Tasks = () => {
  const { user, authFetch } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]); // Verified reports list for task creation
  const [workers, setWorkers] = useState([]); // Volunteers list for task assignment
  const [campaigns, setCampaigns] = useState([]); // Campaigns list
  const [loading, setLoading] = useState(true);

  // Modal State for Assigning Task (Authority / Admin)
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Task Creation Form State (Authority only)
  const [selectedReportId, setSelectedReportId] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [deadline, setDeadline] = useState('');
  
  // Volunteer Update task form state
  const [activeTaskDetails, setActiveTaskDetails] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [afterImage, setAfterImage] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [taskFormErrors, setTaskFormErrors] = useState({});

  // Single field validation helper for Task Assignment
  const validateTaskField = (fieldName, value) => {
    const today = new Date().toISOString().slice(0, 10);
    const maxDateObj = new Date();
    maxDateObj.setFullYear(maxDateObj.getFullYear() + 1);
    const maxDate = maxDateObj.toISOString().slice(0, 10);

    switch (fieldName) {
      case 'selectedReportId':
        if (!value) return 'Verified incident report selection is required.';
        return null;

      case 'selectedWorkerId':
        if (!value) return 'Worker / volunteer selection is required.';
        return null;

      case 'deadline':
        if (!value) return 'Completion deadline is required.';
        if (value < today) return 'Completion deadline cannot be in the past.';
        if (value > maxDate) return 'Completion deadline must be within 1 year from today.';
        return null;

      default:
        return null;
    }
  };

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

  const fetchTasksData = async () => {
    try {
      // Fetch tasks
      const tasksRes = await authFetch('/tasks');
      if (tasksRes.ok) {
        const resTasksData = await tasksRes.json();
        setTasks(resTasksData.tasks);
      }

      // If Authority/Admin, fetch reports and workers for assignment form
      if (['Authority', 'Admin'].includes(user.role)) {
        const reportsRes = await authFetch('/reports');
        if (reportsRes.ok) {
          const repData = await reportsRes.json();
          setReports(repData.reports || []);
        }

        const campaignsRes = await authFetch('/campaigns');
        if (campaignsRes.ok) {
          const campData = await campaignsRes.json();
          setCampaigns(campData.campaigns || []);
        }

        try {
          const usersRes = await authFetch('/authority/users');
          if (usersRes.ok) {
            const uData = await usersRes.json();
            if (uData.users && uData.users.length > 0) {
              setWorkers(uData.users);
            } else {
              setWorkers([
                { user_id: '55555555-5555-5555-5555-555555555555', full_name: 'Alex Green (Volunteer)' },
                { user_id: '11111111-1111-1111-1111-111111111111', full_name: 'John Citizen (Volunteer)' }
              ]);
            }
          }
        } catch (uErr) {
          setWorkers([
            { user_id: '55555555-5555-5555-5555-555555555555', full_name: 'Alex Green (Volunteer)' },
            { user_id: '11111111-1111-1111-1111-111111111111', full_name: 'John Citizen (Volunteer)' }
          ]);
        }
      }
    } catch (err) {
      console.error('Error fetching tasks components:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate all task fields
    const errors = {
      selectedReportId: validateTaskField('selectedReportId', selectedReportId),
      selectedWorkerId: validateTaskField('selectedWorkerId', selectedWorkerId),
      deadline: validateTaskField('deadline', deadline)
    };

    const activeErrors = {};
    Object.keys(errors).forEach(k => {
      if (errors[k]) activeErrors[k] = errors[k];
    });

    if (Object.keys(activeErrors).length > 0) {
      setTaskFormErrors(activeErrors);
      return;
    }

    setSubmitting(true);

    try {
      const res = await authFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          report_id: selectedReportId,
          campaign_id: selectedCampaignId || null,
          assigned_worker: selectedWorkerId,
          deadline: deadline || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create task.');
      }

      setSuccess('Cleanup task assigned to volunteer successfully!');
      setSelectedReportId('');
      setSelectedCampaignId('');
      setSelectedWorkerId('');
      setDeadline('');
      setTaskFormErrors({});
      setShowAssignModal(false);

      fetchTasksData();
    } catch (err) {
      setError(err.message || 'Error occurred during task assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenUpdateModal = async (taskId) => {
    try {
      const res = await authFetch(`/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveTaskDetails(data.task);
        setCompletionNotes(data.task.completion_notes || '');
        setShowUpdateModal(true);
      }
    } catch (err) {
      console.error('Error getting task details:', err);
    }
  };

  const handleFileChange = (e) => {
    setAfterImage(e.target.files[0]);
  };

  const handleVolunteerSubmitProof = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('status', 'Completed');
      formData.append('completion_notes', completionNotes);
      if (afterImage) {
        formData.append('image', afterImage);
      }

      const res = await authFetch(`/tasks/${activeTaskDetails.task_id}/status`, {
        method: 'PUT',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit cleanup proof.');
      }

      setSuccess('Cleanup proof submitted successfully! Pending municipal verification.');
      setShowUpdateModal(false);
      setAfterImage(null);
      setCompletionNotes('');
      fetchTasksData();
    } catch (err) {
      setError(err.message || 'Error submitting task completion.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyTask = async (taskId) => {
    setError('');
    setSuccess('');
    try {
      const res = await authFetch(`/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Verified' })
      });
      if (res.ok) {
        setSuccess('Cleanup verified! Payment reward logged for the volunteer.');
        fetchTasksData();
      } else {
        const data = await res.json();
        setError(data.error || 'Verification failed.');
      }
    } catch (err) {
      console.error('Verify task error:', err);
    }
  };

  const handleAcceptTask = async (taskId) => {
    setError('');
    setSuccess('');
    try {
      const res = await authFetch(`/tasks/${taskId}/accept`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept task.');
      }
      setSuccess('Task accepted successfully! It is now listed under your active tasks.');
      fetchTasksData();
    } catch (err) {
      setError(err.message || 'Error accepting task.');
    }
  };

  // Filtered tasks computation
  const filteredTasks = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = t.report_title?.toLowerCase().includes(q);
      const locMatch = t.location_name?.toLowerCase().includes(q);
      const workerMatch = t.worker_name?.toLowerCase().includes(q);
      const campaignMatch = t.campaign_name?.toLowerCase().includes(q);
      if (!titleMatch && !locMatch && !workerMatch && !campaignMatch) return false;
    }

    if (statusFilter !== 'All' && t.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const isAssignRole = ['Authority', 'Admin'].includes(user.role);

  return (
    <div>
      {/* Page Header & Top Right Action Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', margin: 0, fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff' }}>
            <span>Cleanup Tasks Management</span>
            <CheckSquare size={26} color="#00e5ff" />
          </h1>
        </div>

        {isAssignRole && (
          <button
            onClick={() => { setTaskFormErrors({}); setShowAssignModal(true); }}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: 'white',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0, 229, 255, 0.25)',
              marginLeft: 'auto'
            }}
          >
            <PlusCircle size={20} />
            Assign Cleanup Task
          </button>
        )}
      </div>

      {/* Notifications */}
      {success && (
        <div style={{ padding: '14px 18px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--success)', borderRadius: '10px', color: 'var(--success)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={20} />
          <span style={{ fontWeight: '600' }}>{success}</span>
        </div>
      )}
      {error && (
        <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)', borderRadius: '10px', color: 'var(--danger)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: '600' }}>{error}</span>
        </div>
      )}

      {/* Overview Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
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
            <div className="stat-val">{tasks.length}</div>
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
            <div className="stat-val">{tasks.filter(t => t.status === 'Pending').length}</div>
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
            <div className="stat-val">{tasks.filter(t => t.status === 'Completed').length}</div>
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
            <div className="stat-val">{tasks.filter(t => t.status === 'Verified').length}</div>
          </div>
          <img 
            src="/images/purple_coral_card_bg.png" 
            alt="Verified Cleanups Artwork" 
            className="card-artwork-blend"
          />
        </div>
      </div>

      {/* Tasks Table Ledger */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {/* Toolbar Header: Title, Search, Status Filter */}
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '700' }}>Cleanup Tasks Ledger</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Showing {filteredTasks.length} of {tasks.length} assigned tasks
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search incident, location, worker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 30px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
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
                border: '1px solid var(--card-border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
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
                  color: 'var(--danger)',
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
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>No cleanup tasks found.</p>
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
                  <th>Assigned Worker</th>
                  <th>Campaign Link</th>
                  <th>Assigned Date</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.task_id}>
                    <td style={{ fontWeight: 600 }}>{task.report_title}</td>
                    <td>{task.location_name}</td>
                    <td style={{ fontWeight: '600' }}>{task.worker_name || 'Unassigned'}</td>
                    <td>{task.campaign_name || 'Direct Task'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(task.assigned_date).toLocaleDateString()}</td>
                    <td style={{ fontSize: '0.85rem' }}>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`badge ${
                        task.status === 'Verified' ? 'badge-completed' :
                        task.status === 'Completed' ? 'badge-verified' : 'badge-pending'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {['Volunteer', 'Citizen'].includes(user.role) && (!task.assigned_worker || task.assigned_worker !== user.user_id) && task.status === 'Pending' && (
                          <button 
                            onClick={() => handleAcceptTask(task.task_id)}
                            className="btn btn-primary" 
                            style={{ 
                              padding: '6px 12px', 
                              fontSize: '0.8rem',
                              background: 'linear-gradient(135deg, #0284c7 0%, #00e5ff 100%)',
                              color: '#041126',
                              fontWeight: '700',
                              boxShadow: '0 4px 12px rgba(0, 229, 255, 0.3)'
                            }}
                          >
                            <CheckSquare size={14} />
                            Accept Task
                          </button>
                        )}

                        {['Volunteer', 'Citizen'].includes(user.role) && task.assigned_worker === user.user_id && ['Pending', 'In Progress'].includes(task.status) && (
                          <button 
                            onClick={() => handleOpenUpdateModal(task.task_id)}
                            className="btn btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            <Camera size={14} />
                            Complete Task
                          </button>
                        )}

                        <button 
                          onClick={() => handleOpenUpdateModal(task.task_id)}
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          <Info size={14} />
                          Details
                        </button>

                        {isAssignRole && task.status === 'Completed' && (
                          <button 
                            onClick={() => handleVerifyTask(task.task_id)}
                            className="btn btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' }}
                          >
                            Verify Cleanup
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN NEW CLEANUP TASK (Shown only when button is clicked) */}
      {/* ========================================================================= */}
      {showAssignModal && isAssignRole && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(4, 12, 26, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '580px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(12, 28, 54, 0.98) 0%, rgba(8, 20, 40, 0.99) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            position: 'relative',
            padding: '26px',
            margin: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckSquare size={22} color="#00e5ff" />
                  Assign New Cleanup Task
                </h2>
              </div>

              <button 
                onClick={() => setShowAssignModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Select Verified Incident *</label>
                <select 
                  className="form-control" 
                  value={selectedReportId} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedReportId(val);
                    const err = validateTaskField('selectedReportId', val);
                    setTaskFormErrors(prev => ({ ...prev, selectedReportId: err }));
                  }}
                  onBlur={(e) => {
                    const err = validateTaskField('selectedReportId', e.target.value);
                    setTaskFormErrors(prev => ({ ...prev, selectedReportId: err }));
                  }}
                  style={{ color: selectedReportId ? '#cbd5e1' : 'rgba(148, 163, 184, 0.45)', border: taskFormErrors.selectedReportId ? '1px solid #ff4d4d' : '1px solid rgba(0, 229, 255, 0.2)', boxShadow: taskFormErrors.selectedReportId ? '0 0 8px rgba(255, 77, 77, 0.3)' : 'none' }}
                >
                  <option value="" style={{ color: 'rgba(148, 163, 184, 0.45)' }}>-- Choose Incident Report --</option>
                  {reports.map(rep => (
                    <option key={rep.report_id} value={rep.report_id} style={{ color: '#cbd5e1' }}>
                      {rep.title} ({rep.location_name})
                    </option>
                  ))}
                </select>
                {taskFormErrors.selectedReportId && (
                  <span style={{ color: '#ff4d4d', fontSize: '0.74rem', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                    ⚠️ {taskFormErrors.selectedReportId}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Link to Campaign (Optional)</label>
                <select 
                  className="form-control" 
                  value={selectedCampaignId} 
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  style={{ color: selectedCampaignId ? '#cbd5e1' : 'rgba(148, 163, 184, 0.45)' }}
                >
                  <option value="" style={{ color: 'rgba(148, 163, 184, 0.45)' }}>-- No Campaign --</option>
                  {campaigns.map(camp => (
                    <option key={camp.campaign_id} value={camp.campaign_id} style={{ color: '#cbd5e1' }}>
                      {camp.campaign_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Worker / Volunteer *</label>
                <select 
                  className="form-control" 
                  value={selectedWorkerId} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedWorkerId(val);
                    const err = validateTaskField('selectedWorkerId', val);
                    setTaskFormErrors(prev => ({ ...prev, selectedWorkerId: err }));
                  }}
                  onBlur={(e) => {
                    const err = validateTaskField('selectedWorkerId', e.target.value);
                    setTaskFormErrors(prev => ({ ...prev, selectedWorkerId: err }));
                  }}
                  style={{ color: selectedWorkerId ? '#cbd5e1' : 'rgba(148, 163, 184, 0.45)', border: taskFormErrors.selectedWorkerId ? '1px solid #ff4d4d' : '1px solid rgba(0, 229, 255, 0.2)', boxShadow: taskFormErrors.selectedWorkerId ? '0 0 8px rgba(255, 77, 77, 0.3)' : 'none' }}
                >
                  <option value="" style={{ color: 'rgba(148, 163, 184, 0.45)' }}>-- Select Volunteer --</option>
                  {workers.map(w => (
                    <option key={w.user_id} value={w.user_id} style={{ color: '#cbd5e1' }}>{w.full_name}</option>
                  ))}
                </select>
                {taskFormErrors.selectedWorkerId && (
                  <span style={{ color: '#ff4d4d', fontSize: '0.74rem', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                    ⚠️ {taskFormErrors.selectedWorkerId}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Completion Deadline *</label>
                <input 
                  type="date" 
                  className="form-control" 
                  min={new Date().toISOString().slice(0, 10)}
                  max={(() => {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() + 1);
                    return d.toISOString().slice(0, 10);
                  })()}
                  value={deadline}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDeadline(val);
                    const err = validateTaskField('deadline', val);
                    setTaskFormErrors(prev => ({ ...prev, deadline: err }));
                  }}
                  onBlur={(e) => {
                    const err = validateTaskField('deadline', e.target.value);
                    setTaskFormErrors(prev => ({ ...prev, deadline: err }));
                  }}
                  style={{ color: deadline ? '#cbd5e1' : 'rgba(148, 163, 184, 0.45)', border: taskFormErrors.deadline ? '1px solid #ff4d4d' : '1px solid rgba(0, 229, 255, 0.2)', boxShadow: taskFormErrors.deadline ? '0 0 8px rgba(255, 77, 77, 0.3)' : 'none' }}
                />
                {taskFormErrors.deadline && (
                  <span style={{ color: '#ff4d4d', fontSize: '0.74rem', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                    ⚠️ {taskFormErrors.deadline}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 2, padding: '10px' }}
                  disabled={submitting}
                >
                  {submitting ? 'Assigning Task...' : 'Confirm & Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW TASK DETAILS & SUBMIT PROOF */}
      {/* ========================================================================= */}
      {showUpdateModal && activeTaskDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(4, 12, 26, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(12, 28, 54, 0.98) 0%, rgba(8, 20, 40, 0.99) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            position: 'relative',
            padding: '28px',
            margin: 'auto'
          }}>
            <button 
              onClick={() => setShowUpdateModal(false)}
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={22} />
            </button>

            <h2 style={{ fontSize: '1.4rem', marginBottom: '8px', fontWeight: '800', color: '#ffffff' }}>
              Task details: {activeTaskDetails.report_title}
            </h2>
            <span className={`badge badge-${activeTaskDetails.status.toLowerCase()}`} style={{ marginBottom: '16px' }}>
              Status: {activeTaskDetails.status}
            </span>

            {/* Before / After Images comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '20px 0' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Before Cleanup</h4>
                {activeTaskDetails.before_image ? (
                  <img 
                    src={activeTaskDetails.before_image.startsWith('http') ? activeTaskDetails.before_image : `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${activeTaskDetails.before_image}`} 
                    alt="Before evidence"
                    style={{ width: '100%', borderRadius: '10px', objectFit: 'cover', height: '160px', border: '1px solid rgba(0, 229, 255, 0.2)' }}
                  />
                ) : (
                  <div style={{ height: '160px', borderRadius: '10px', background: 'rgba(8, 20, 42, 0.6)', border: '1px dotted rgba(0, 229, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                    No image uploaded
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>After Cleanup (Proof)</h4>
                {activeTaskDetails.after_image ? (
                  <img 
                    src={activeTaskDetails.after_image.startsWith('http') ? activeTaskDetails.after_image : `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${activeTaskDetails.after_image}`} 
                    alt="After evidence"
                    style={{ width: '100%', borderRadius: '10px', objectFit: 'cover', height: '160px', border: '1px solid rgba(0, 229, 255, 0.2)' }}
                  />
                ) : (
                  <div style={{ height: '160px', borderRadius: '10px', background: 'rgba(8, 20, 42, 0.6)', border: '1px dotted rgba(0, 229, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                    No proof submitted yet
                  </div>
                )}
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '20px' }}>
              <p style={{ margin: '6px 0' }}><strong style={{ color: '#94a3b8' }}>Location:</strong> {activeTaskDetails.location_name}</p>
              <p style={{ margin: '6px 0' }}><strong style={{ color: '#94a3b8' }}>Coordinates:</strong> {activeTaskDetails.latitude}, {activeTaskDetails.longitude}</p>
              <p style={{ margin: '6px 0' }}><strong style={{ color: '#94a3b8' }}>Description:</strong> {activeTaskDetails.report_description || 'No notes'}</p>
              {activeTaskDetails.completion_notes && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(8, 20, 42, 0.6)', border: '1px solid rgba(0, 229, 255, 0.2)', borderRadius: '10px', color: '#ffffff' }}>
                  <strong style={{ color: '#00e5ff' }}>Completion Notes:</strong> {activeTaskDetails.completion_notes}
                </div>
              )}
            </div>

            {/* Submit proof form for assigned volunteer */}
            {['Volunteer', 'Citizen'].includes(user.role) && ['Pending', 'In Progress'].includes(activeTaskDetails.status) && (
              <form onSubmit={handleVolunteerSubmitProof} style={{ borderTop: '1px solid rgba(0, 229, 255, 0.15)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '1rem', color: '#00e5ff', marginBottom: '12px' }}>Submit Cleanup Verification Proof</h4>
                
                <div className="form-group">
                  <label className="form-label">Completion Notes *</label>
                  <textarea 
                    className="form-control" 
                    placeholder="Enter observations on total bags cleaned, volunteers involved, or leftover tasks." 
                    rows="2"
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">After Image File *</label>
                  <input 
                    type="file" 
                    className="form-control" 
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '10px' }}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting proof...' : 'Submit Cleanup Proof'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
