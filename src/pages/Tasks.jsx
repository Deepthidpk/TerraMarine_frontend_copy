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
    if (!selectedReportId || !selectedWorkerId) {
      return setError('Please select a verified report and assign a worker.');
    }
    setError('');
    setSuccess('');
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
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', marginBottom: '6px', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Cleanup Tasks Management</span>
            <CheckSquare size={24} color="#0284c7" />
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Assign cleanup workers, submit completion photos, and verify completed beach actions.
          </p>
        </div>

        {isAssignRole && (
          <button
            onClick={() => setShowAssignModal(true)}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 22px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.4)',
              transition: 'transform 0.2s ease, boxShadow 0.2s ease'
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
      <div className="dashboard-grid" style={{ marginBottom: '28px' }}>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="stat-icon" style={{ color: '#0284c7', background: 'rgba(2, 132, 199, 0.1)' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TOTAL TASKS</span>
            <div className="stat-number">{tasks.length}</div>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PENDING TASKS</span>
            <div className="stat-number">{tasks.filter(t => t.status === 'Pending').length}</div>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
            <Camera size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>SUBMITTED PROOFS</span>
            <div className="stat-number">{tasks.filter(t => t.status === 'Completed').length}</div>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="stat-icon" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>VERIFIED CLEANUPS</span>
            <div className="stat-number">{tasks.filter(t => t.status === 'Verified').length}</div>
          </div>
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
                        {user.role === 'Volunteer' && task.status === 'Pending' && (
                          <button 
                            onClick={() => handleOpenUpdateModal(task.task_id)}
                            className="btn btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            <Camera size={14} />
                            Complete
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
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justify: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '620px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            position: 'relative',
            padding: '28px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--card-border)', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckSquare size={22} color="#0284c7" />
                  Assign New Cleanup Task
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Assign verified incident reports to volunteer teams and set completion deadlines.
                </p>
              </div>

              <button 
                onClick={() => setShowAssignModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
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
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Incident Report --</option>
                  {reports.map(rep => (
                    <option key={rep.report_id} value={rep.report_id}>
                      {rep.title} ({rep.location_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Link to Campaign (Optional)</label>
                <select 
                  className="form-control" 
                  value={selectedCampaignId} 
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                >
                  <option value="">-- No Campaign --</option>
                  {campaigns.map(camp => (
                    <option key={camp.campaign_id} value={camp.campaign_id}>
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
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  required
                >
                  <option value="">-- Select Volunteer --</option>
                  {workers.map(w => (
                    <option key={w.user_id} value={w.user_id}>{w.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Completion Deadline</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
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
      {/* MODAL: TASK DETAILS & VOLUNTEER PROOF SUBMISSION */}
      {/* ========================================================================= */}
      {showUpdateModal && activeTaskDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justify: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            position: 'relative',
            padding: '28px'
          }}>
            <button 
              onClick={() => setShowUpdateModal(false)}
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.4rem', marginBottom: '8px', fontWeight: '800' }}>
              Task details: {activeTaskDetails.report_title}
            </h2>
            <span className={`badge badge-${activeTaskDetails.status.toLowerCase()}`} style={{ marginBottom: '16px' }}>
              Status: {activeTaskDetails.status}
            </span>

            {/* Before / After Images comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '20px 0' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Before Cleanup</h4>
                {activeTaskDetails.before_image ? (
                  <img 
                    src={activeTaskDetails.before_image.startsWith('http') ? activeTaskDetails.before_image : `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${activeTaskDetails.before_image}`} 
                    alt="Before evidence"
                    style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', height: '150px' }}
                  />
                ) : (
                  <div style={{ height: '150px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.03)', border: '1px dotted var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    No image uploaded
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>After Cleanup (Proof)</h4>
                {activeTaskDetails.after_image ? (
                  <img 
                    src={activeTaskDetails.after_image.startsWith('http') ? activeTaskDetails.after_image : `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${activeTaskDetails.after_image}`} 
                    alt="After evidence"
                    style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', height: '150px' }}
                  />
                ) : (
                  <div style={{ height: '150px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.03)', border: '1px dotted var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    No proof submitted yet
                  </div>
                )}
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              <p style={{ margin: '4px 0' }}><strong>Location:</strong> {activeTaskDetails.location_name}</p>
              <p style={{ margin: '4px 0' }}><strong>Coordinates:</strong> {activeTaskDetails.latitude}, {activeTaskDetails.longitude}</p>
              <p style={{ margin: '4px 0' }}><strong>Description:</strong> {activeTaskDetails.report_description || 'No notes'}</p>
              {activeTaskDetails.completion_notes && (
                <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(15, 23, 42, 0.03)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                  <strong>Completion Notes:</strong> {activeTaskDetails.completion_notes}
                </div>
              )}
            </div>

            {/* Submit proof form for assigned volunteer */}
            {user.role === 'Volunteer' && activeTaskDetails.status === 'Pending' && (
              <form onSubmit={handleVolunteerSubmitProof} style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '12px' }}>Submit Cleanup Verification Proof</h4>
                
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

            <button 
              onClick={() => setShowUpdateModal(false)}
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '16px', padding: '10px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
