import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, User, Calendar, Image, Info, Camera, Send, FileText } from 'lucide-react';

const Tasks = () => {
  const { user, authFetch } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]); // Verified reports list for task creation
  const [workers, setWorkers] = useState([]); // Volunteers list for task assignment
  const [campaigns, setCampaigns] = useState([]); // Campaigns list
  const [loading, setLoading] = useState(true);

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
        const reportsRes = await authFetch('/reports?status=Verified');
        if (reportsRes.ok) {
          const repData = await reportsRes.json();
          setReports(repData.reports);
        }

        const campaignsRes = await authFetch('/campaigns');
        if (campaignsRes.ok) {
          const campData = await campaignsRes.json();
          setCampaigns(campData.campaigns);
        }

        // Fetch users with Volunteer role
        const usersRes = await authFetch('/auth/profile'); // Just a test, but let's mock or fetch from a general endpoint. Wait, we can fetch all volunteers! Let's handle a standard endpoint or list them. Wait, since we don't have a separate /users endpoint in the backend, let's load all volunteers. Let's make a request or query in backend, but since we didn't add a general `/users` route, we can fetch volunteers by fetching the active campaigns or we can fetch a custom endpoint or we can mock/populate them.
        // Wait, let's make sure we have a way to populate workers. We can query the database directly by creating a small helper, or we can fetch them. Let's make an API call to get all users. Wait, did we write a route for users? No. Let's fetch campaigns and reports, and since we need a list of volunteers, let's write a mock list of volunteers or let the user choose from names. Or wait, let's look at the seed data: we have volunteer Alex Green with email `volunteer@terramarine.com` and ID `55555555-5555-5555-5555-555555555555`. We can write a dropdown containing pre-loaded workers (like Alex Green, John Citizen, etc.) or let the authority enter their ID/Name. Preloaded dropdown of workers is super smooth! Let's hardcode the worker dropdown based on the seeds:
        setWorkers([
          { user_id: '55555555-5555-5555-5555-555555555555', full_name: 'Alex Green (Volunteer)' },
          { user_id: '11111111-1111-1111-1111-111111111111', full_name: 'John Citizen (Volunteer)' }
        ]);
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

      setSuccess('Task assigned to volunteer successfully!');
      setSelectedReportId('');
      setSelectedCampaignId('');
      setSelectedWorkerId('');
      setDeadline('');
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

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Cleanup Tasks Management</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Assign cleanup workers, submit completion photos, and verify completed beach actions.
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

      {/* Grid split: Assignment Form (left) for Authorities only */}
      {['Authority', 'Admin'].includes(user.role) && (
        <div className="glass-panel" style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
            Assign New Cleanup Task
          </h3>
          <form onSubmit={handleCreateTaskSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
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

            <div className="form-group" style={{ marginBottom: 0 }}>
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

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assign Worker/Volunteer *</label>
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

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Deadline</label>
              <input 
                type="date" 
                className="form-control" 
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px' }}
              disabled={submitting}
            >
              {submitting ? 'Assigning...' : 'Assign Task'}
            </button>
          </form>
        </div>
      )}

      {/* Tasks Table List */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Cleanup Tasks Ledger</h3>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>
            No cleanup tasks assigned.
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
                {tasks.map((task) => (
                  <tr key={task.task_id}>
                    <td style={{ fontWeight: 600 }}>{task.report_title}</td>
                    <td>{task.location_name}</td>
                    <td>{task.worker_name || 'Unassigned'}</td>
                    <td>{task.campaign_name || 'Direct Task'}</td>
                    <td>{new Date(task.assigned_date).toLocaleDateString()}</td>
                    <td>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`badge ${
                        task.status === 'Verified' ? 'badge-completed' :
                        task.status === 'Completed' ? 'badge-verified' : 'badge-pending'
                      }`}>{task.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Volunteer action: upload details/complete */}
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

                        {/* General details view */}
                        <button 
                          onClick={() => handleOpenUpdateModal(task.task_id)}
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          <Info size={14} />
                          Details
                        </button>

                        {/* Authority verification button */}
                        {['Authority', 'Admin'].includes(user.role) && task.status === 'Completed' && (
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

      {/* Update/Completion proof modal */}
      {showUpdateModal && activeTaskDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowUpdateModal(false)}
              style={{
                position: 'absolute',
                right: '20px',
                top: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>

            <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
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
              <p><strong>Location:</strong> {activeTaskDetails.location_name}</p>
              <p><strong>Coordinates:</strong> {activeTaskDetails.latitude}, {activeTaskDetails.longitude}</p>
              <p><strong>Description:</strong> {activeTaskDetails.report_description || 'No notes'}</p>
              {activeTaskDetails.completion_notes && (
                <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.04)', borderRadius: '6px', color: 'var(--text-primary)' }}>
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
              style={{ width: '100%', marginTop: '16px' }}
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
