import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);
  const [workerAvailabilityFilter, setWorkerAvailabilityFilter] = useState('free_only'); // 'free_only' | 'all'
  const [deadline, setDeadline] = useState('');
  
  // Add Worker Modal State (Authority / Admin)
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerFormErrors, setWorkerFormErrors] = useState({});
  const [addingWorker, setAddingWorker] = useState(false);
  const [workerError, setWorkerError] = useState('');

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

      case 'selectedWorkerIds':
        if (!value || value.length === 0) return 'At least one municipal worker must be selected.';
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
      if (user && ['Authority', 'Admin'].includes(user.role)) {
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
          const usersRes = await authFetch('/authority/users?role=Worker');
          if (usersRes.ok) {
            const uData = await usersRes.json();
            const workerList = (uData.users || []).filter(u => u.role === 'Worker');
            setWorkers(workerList);
          } else {
            setWorkers([]);
          }
        } catch (uErr) {
          setWorkers([]);
        }
      }
    } catch (err) {
      console.error('Error fetching tasks components:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasksData();
    }
  }, [user]);

  useEffect(() => {
    if (deadline && selectedWorkerIds.length > 0) {
      const validWorkerIds = selectedWorkerIds.filter(wId => {
        const worker = workers.find(w => w.user_id === wId);
        if (!worker) return false;
        const busyDateList = (worker.busy_dates || '').split(',').map(d => d.trim()).filter(Boolean);
        const isBusyOnDate = Boolean(busyDateList.includes(deadline));
        return !isBusyOnDate;
      });
      if (validWorkerIds.length !== selectedWorkerIds.length) {
        setSelectedWorkerIds(validWorkerIds);
        setTaskFormErrors(p => ({
          ...p,
          selectedWorkerIds: 'Workers assigned on the selected date are locked and cannot be chosen.'
        }));
      }
    }
  }, [deadline]);

  const handleToggleWorker = (wId) => {
    if (!deadline) {
      setTaskFormErrors(p => ({ 
        ...p, 
        selectedWorkerIds: 'Please select a Completion Deadline date above first before selecting workers.' 
      }));
      return;
    }

    const worker = workers.find(w => w.user_id === wId);
    if (worker) {
      const busyDateList = (worker.busy_dates || '').split(',').map(d => d.trim()).filter(Boolean);
      const isBusyOnDate = Boolean(busyDateList.includes(deadline));
      if (isBusyOnDate && !selectedWorkerIds.includes(wId)) {
        setTaskFormErrors(p => ({ 
          ...p, 
          selectedWorkerIds: `Cannot select ${worker.full_name}: Worker is locked and already assigned to a task on ${deadline}.` 
        }));
        return;
      }
    }

    setSelectedWorkerIds(prev => {
      const next = prev.includes(wId) ? prev.filter(id => id !== wId) : [...prev, wId];
      const err = validateTaskField('selectedWorkerIds', next);
      setTaskFormErrors(p => ({ ...p, selectedWorkerIds: err }));
      return next;
    });
  };

  const handleToggleSelectAllWorkers = () => {
    if (!deadline) {
      setTaskFormErrors(p => ({ 
        ...p, 
        selectedWorkerIds: 'Please select a Completion Deadline date above first before selecting workers.' 
      }));
      return;
    }

    const freeWorkers = workers.filter(w => {
      const busyDateList = (w.busy_dates || '').split(',').map(d => d.trim()).filter(Boolean);
      const isBusyDate = Boolean(busyDateList.includes(deadline));
      return !isBusyDate;
    });

    if (selectedWorkerIds.length >= freeWorkers.length && freeWorkers.length > 0) {
      setSelectedWorkerIds([]);
      setTaskFormErrors(p => ({ ...p, selectedWorkerIds: 'At least one municipal worker must be selected.' }));
    } else {
      const freeIds = freeWorkers.map(w => w.user_id);
      setSelectedWorkerIds(freeIds);
      setTaskFormErrors(p => ({ ...p, selectedWorkerIds: null }));
    }
  };

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate all task fields
    const errors = {
      selectedReportId: validateTaskField('selectedReportId', selectedReportId),
      selectedWorkerIds: validateTaskField('selectedWorkerIds', selectedWorkerIds),
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
          assigned_workers: selectedWorkerIds,
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
      setSelectedWorkerIds([]);
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

  const validateWorkerField = (fieldName, value) => {
    const val = (value || '').trim();
    switch (fieldName) {
      case 'workerName':
        if (!val) return 'Worker full name is required.';
        if (val.length < 3) return 'Full name must be at least 3 characters long.';
        if (val.length > 50) return 'Full name cannot exceed 50 characters.';
        if (!/^[a-zA-Z\s.'-]+$/.test(val)) return 'Full name can only contain letters, spaces, dots, and hyphens (no numbers or special characters).';
        return null;

      case 'workerEmail':
        if (!val) return 'Email address is required.';
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) return 'Please enter a valid email address (e.g. worker@example.com).';
        return null;

      case 'workerPhone': {
        if (!val) return 'Phone number is required.';
        const digitsOnly = val.replace(/\D/g, '');
        if (digitsOnly.length < 10 || digitsOnly.length > 13) {
          return 'Phone number must contain a valid 10-digit mobile number.';
        }
        if (!/^\+?[0-9\s-]{10,15}$/.test(val)) {
          return 'Please enter a valid phone number format (e.g. +91 9876543210 or 9876543210).';
        }
        return null;
      }

      default:
        return null;
    }
  };

  const handleAddWorkerSubmit = async (e) => {
    e.preventDefault();
    setWorkerError('');
    setError('');
    setSuccess('');

    const errors = {
      name: validateWorkerField('workerName', workerName),
      email: validateWorkerField('workerEmail', workerEmail),
      phone: validateWorkerField('workerPhone', workerPhone)
    };

    const activeErrors = {};
    if (errors.name) activeErrors.name = errors.name;
    if (errors.email) activeErrors.email = errors.email;
    if (errors.phone) activeErrors.phone = errors.phone;

    if (Object.keys(activeErrors).length > 0) {
      setWorkerFormErrors(activeErrors);
      return;
    }

    setAddingWorker(true);
    try {
      const res = await authFetch('/authority/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: workerName.trim(),
          email: workerEmail.trim(),
          phone: workerPhone.trim()
        })
      });

      let data = {};
      try { data = await res.json(); } catch (e) {}

      if (!res.ok) {
        setWorkerError(data.error || 'Failed to add worker.');
      } else {
        setSuccess(`Worker "${workerName.trim()}" registered successfully! Login details sent to ${workerEmail.trim()}.`);
        setWorkerName('');
        setWorkerEmail('');
        setWorkerPhone('');
        setWorkerFormErrors({});
        setShowAddWorkerModal(false);
        fetchTasksData();
      }
    } catch (err) {
      setWorkerError('Network error while adding worker: ' + (err.message || 'Server error'));
    } finally {
      setAddingWorker(false);
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

  const isAssignRole = ['Authority', 'Admin'].includes(user?.role);

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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={() => { setWorkerFormErrors({}); setWorkerError(''); setShowAddWorkerModal(true); }}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(2, 132, 199, 0.25) 100%)',
                color: '#00e5ff',
                border: '1px solid rgba(0, 229, 255, 0.4)',
                padding: '12px 20px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0, 229, 255, 0.15)'
              }}
            >
              <User size={18} />
              + Add Worker
            </button>

            <button
              type="button"
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
                boxShadow: '0 8px 24px rgba(0, 229, 255, 0.25)'
              }}
            >
              <PlusCircle size={20} />
              Assign Cleanup Task
            </button>
          </div>
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
                        {['Volunteer', 'Citizen'].includes(user?.role) && (!task.assigned_worker || task.assigned_worker !== user?.user_id) && task.status === 'Pending' && (
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

                        {['Volunteer', 'Citizen'].includes(user?.role) && task.assigned_worker === user?.user_id && ['Pending', 'In Progress'].includes(task.status) && (
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
                  {reports.filter(rep => rep.status !== 'Completed').map(rep => {
                    const workerSuffix = rep.assigned_workers ? ` - ${rep.assigned_workers}` : '';
                    return (
                      <option key={rep.report_id} value={rep.report_id} style={{ color: '#cbd5e1' }}>
                        {rep.title} ({rep.location_name}){workerSuffix}
                      </option>
                    );
                  })}
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

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Assign Workers * (Check availability)</label>
                  {workers.length > 0 && (
                    <span 
                      onClick={handleToggleSelectAllWorkers}
                      style={{ fontSize: '0.75rem', color: '#00e5ff', cursor: 'pointer', fontWeight: '700' }}
                    >
                      {selectedWorkerIds.length > 0 ? 'Deselect All' : 'Select All'}
                    </span>
                  )}
                </div>

                {/* Worker Availability Filter Bar (Only shown AFTER selecting deadline) */}
                {workers.length > 0 && deadline ? (() => {
                  const freeCount = workers.filter(w => {
                    const busyDateList = (w.busy_dates || '').split(',').map(d => d.trim()).filter(Boolean);
                    const isBusyDate = Boolean(deadline && busyDateList.includes(deadline));
                    return !isBusyDate;
                  }).length;

                  return (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setWorkerAvailabilityFilter('free_only')}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.74rem',
                          borderRadius: '6px',
                          fontWeight: '700',
                          border: workerAvailabilityFilter === 'free_only' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
                          background: workerAvailabilityFilter === 'free_only' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                          color: workerAvailabilityFilter === 'free_only' ? '#10b981' : '#94a3b8',
                          cursor: 'pointer'
                        }}
                      >
                        🟢 Free Workers Only ({freeCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkerAvailabilityFilter('all')}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.74rem',
                          borderRadius: '6px',
                          fontWeight: '700',
                          border: workerAvailabilityFilter === 'all' ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.15)',
                          background: workerAvailabilityFilter === 'all' ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.05)',
                          color: workerAvailabilityFilter === 'all' ? '#00e5ff' : '#94a3b8',
                          cursor: 'pointer'
                        }}
                      >
                        All Workers ({workers.length})
                      </button>
                    </div>
                  );
                })() : workers.length > 0 ? (
                  <div style={{ padding: '8px 12px', background: 'rgba(0, 229, 255, 0.08)', borderRadius: '8px', border: '1px solid rgba(0, 229, 255, 0.25)', fontSize: '0.78rem', color: '#00e5ff', marginBottom: '10px', fontWeight: '600' }}>
                    📅 Please select a Completion Deadline above first to check worker availability for that date.
                  </div>
                ) : null}

                {workers.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: '0.84rem', fontStyle: 'italic', padding: '8px' }}>
                    No municipal workers registered yet. Click "+ Add New Worker" to register worker accounts.
                  </div>
                ) : (
                  <div style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    background: 'rgba(8, 20, 42, 0.8)',
                    borderRadius: '10px',
                    border: taskFormErrors.selectedWorkerIds ? '1px solid #ff4d4d' : '1px solid rgba(0, 229, 255, 0.25)',
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: taskFormErrors.selectedWorkerIds ? '0 0 8px rgba(255, 77, 77, 0.3)' : 'none'
                  }}>
                    {(() => {
                      if (!deadline) {
                        return workers.map(w => (
                          <label key={w.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ffffff', cursor: 'pointer', userSelect: 'none', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input
                                type="checkbox"
                                checked={selectedWorkerIds.includes(w.user_id)}
                                onChange={() => handleToggleWorker(w.user_id)}
                                style={{ width: '16px', height: '16px', accentColor: '#00e5ff', cursor: 'pointer' }}
                              />
                              <div>
                                <span style={{ fontWeight: '600' }}>{w.full_name}</span>
                                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: '6px' }}>({w.email})</span>
                              </div>
                            </div>
                          </label>
                        ));
                      }

                      const visibleWorkers = workers.filter(w => {
                        const busyDateList = (w.busy_dates || '').split(',').map(d => d.trim()).filter(Boolean);
                        const isBusyDate = Boolean(deadline && busyDateList.includes(deadline));
                        if (workerAvailabilityFilter === 'free_only') {
                          return !isBusyDate;
                        }
                        return true;
                      });

                      if (visibleWorkers.length === 0) {
                        return (
                          <div style={{ color: '#ffb703', fontSize: '0.82rem', padding: '6px', textAlign: 'center', fontWeight: '600' }}>
                            ⚠️ No free workers available on {deadline}. Click "All Workers" to view worker status.
                          </div>
                        );
                      }

                      return visibleWorkers.map(w => {
                        const busyDateList = (w.busy_dates || '').split(',').map(d => d.trim()).filter(Boolean);
                        const isBusyOnDate = Boolean(deadline && busyDateList.includes(deadline));

                        return (
                          <label 
                            key={w.user_id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              fontSize: '0.85rem', 
                              color: isBusyOnDate ? '#94a3b8' : '#ffffff', 
                              cursor: isBusyOnDate ? 'not-allowed' : 'pointer', 
                              userSelect: 'none', 
                              gap: '10px',
                              opacity: isBusyOnDate ? 0.55 : 1
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input
                                type="checkbox"
                                checked={selectedWorkerIds.includes(w.user_id)}
                                disabled={isBusyOnDate}
                                onChange={() => handleToggleWorker(w.user_id)}
                                style={{ width: '16px', height: '16px', accentColor: '#00e5ff', cursor: isBusyOnDate ? 'not-allowed' : 'pointer' }}
                              />
                              <div>
                                <span style={{ fontWeight: '600' }}>{w.full_name}</span>
                                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: '6px' }}>({w.email})</span>
                              </div>
                            </div>

                            {/* Availability Badge ONLY shown after selecting deadline */}
                            {isBusyOnDate ? (
                              <span 
                                title={w.active_task_names ? `Assigned on ${deadline}: ${w.active_task_names}` : `Already assigned to a task on ${deadline}`}
                                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ff4d4d', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap' }}
                              >
                                🔒 🔴 Busy on {deadline}
                              </span>
                            ) : (
                              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                🟢 Free
                              </span>
                            )}
                          </label>
                        );
                      });
                    })()}
                  </div>
                )}

                {/* Worker Busy Notice */}
                {selectedWorkerIds.some(id => {
                  const w = workers.find(item => item.user_id === id);
                  return w && (parseInt(w.active_tasks_count) || 0) > 0;
                }) && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '8px', fontSize: '0.76rem', color: '#ff4d4d', fontWeight: '600' }}>
                    ⚠️ Availability Warning: Selected worker is currently busy with an active task.
                  </div>
                )}

                {taskFormErrors.selectedWorkerIds && (
                  <span style={{ color: '#ff4d4d', fontSize: '0.74rem', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                    ⚠️ {taskFormErrors.selectedWorkerIds}
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

      {/* ========================================================================= */}
      {/* MODAL: REGISTER NEW CLEANUP WORKER */}
      {/* ========================================================================= */}
      {showAddWorkerModal && createPortal(
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
            maxWidth: '540px',
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
                <User size={24} color="#00e5ff" />
                <h2 style={{ fontSize: '1.3rem', margin: 0, color: '#ffffff', fontWeight: '800' }}>
                  Register New Cleanup Worker
                </h2>
              </div>
              <button 
                onClick={() => setShowAddWorkerModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
              >
                <X size={24} />
              </button>
            </div>

            {workerError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', borderRadius: '8px', color: '#f87171', marginBottom: '16px', fontSize: '0.85rem' }}>
                ⚠️ {workerError}
              </div>
            )}

            <form onSubmit={handleAddWorkerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Worker Full Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Rahul Kumar" 
                  value={workerName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWorkerName(val);
                    const err = validateWorkerField('workerName', val);
                    setWorkerFormErrors(prev => ({ ...prev, name: err }));
                  }}
                  onBlur={(e) => {
                    const err = validateWorkerField('workerName', e.target.value);
                    setWorkerFormErrors(prev => ({ ...prev, name: err }));
                  }}
                  style={{
                    color: '#ffffff',
                    background: 'rgba(8, 20, 42, 0.8)',
                    border: workerFormErrors.name ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)',
                    boxShadow: workerFormErrors.name ? '0 0 8px rgba(239, 68, 68, 0.3)' : 'none'
                  }}
                />
                {workerFormErrors.name && (
                  <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                    ⚠️ {workerFormErrors.name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Email Address *</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="e.g. worker@example.com" 
                  value={workerEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWorkerEmail(val);
                    const err = validateWorkerField('workerEmail', val);
                    setWorkerFormErrors(prev => ({ ...prev, email: err }));
                  }}
                  onBlur={(e) => {
                    const err = validateWorkerField('workerEmail', e.target.value);
                    setWorkerFormErrors(prev => ({ ...prev, email: err }));
                  }}
                  style={{
                    color: '#ffffff',
                    background: 'rgba(8, 20, 42, 0.8)',
                    border: workerFormErrors.email ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)',
                    boxShadow: workerFormErrors.email ? '0 0 8px rgba(239, 68, 68, 0.3)' : 'none'
                  }}
                />
                {workerFormErrors.email && (
                  <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                    ⚠️ {workerFormErrors.email}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Phone Number *</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  placeholder="e.g. +91 9876543210" 
                  value={workerPhone}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWorkerPhone(val);
                    const err = validateWorkerField('workerPhone', val);
                    setWorkerFormErrors(prev => ({ ...prev, phone: err }));
                  }}
                  onBlur={(e) => {
                    const err = validateWorkerField('workerPhone', e.target.value);
                    setWorkerFormErrors(prev => ({ ...prev, phone: err }));
                  }}
                  style={{
                    color: '#ffffff',
                    background: 'rgba(8, 20, 42, 0.8)',
                    border: workerFormErrors.phone ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.25)',
                    boxShadow: workerFormErrors.phone ? '0 0 8px rgba(239, 68, 68, 0.3)' : 'none'
                  }}
                />
                {workerFormErrors.phone && (
                  <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                    ⚠️ {workerFormErrors.phone}
                  </span>
                )}
              </div>

              <div style={{ background: 'rgba(0, 229, 255, 0.05)', border: '1px solid rgba(0, 229, 255, 0.2)', padding: '12px', borderRadius: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>
                <p style={{ margin: 0 }}>
                  💡 An automated welcome email containing their login details and portal link will be dispatched upon registration.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingWorker}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
                >
                  {addingWorker ? 'Registering...' : 'Add Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Tasks;
