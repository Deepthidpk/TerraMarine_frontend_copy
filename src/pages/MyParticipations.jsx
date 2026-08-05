import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckSquare, Clock, Camera, ShieldCheck, User, Calendar, MapPin, 
  Upload, CheckCircle2, AlertCircle, FileText, X, ArrowRight, Award,
  Search, RotateCcw, History, Filter, Eye
} from 'lucide-react';

const MyParticipations = () => {
  const { authFetch, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Detail Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchParticipations = async () => {
    setLoading(true);
    try {
      const [tasksRes, payRes] = await Promise.all([
        authFetch('/tasks?type=my_tasks'),
        authFetch('/payments')
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }

      if (payRes.ok) {
        const payData = await payRes.json();
        setPayments(payData.payments || []);
      }
    } catch (err) {
      console.error('Error fetching participations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipations();
  }, []);

  const totalParticipations = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'Completed' || t.status === 'Verified').length;
  const verifiedCount = tasks.filter(t => t.status === 'Verified').length;

  const totalRewardsEarned = payments
    .filter(p => p.payment_status === 'Paid')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  // Filter tasks by search query
  const filteredTasks = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = t.report_title?.toLowerCase().includes(q);
      const locMatch = t.location_name?.toLowerCase().includes(q);
      const campaignMatch = t.campaign_name?.toLowerCase().includes(q);
      const wasteMatch = t.waste_type?.toLowerCase().includes(q);
      if (!titleMatch && !locMatch && !campaignMatch && !wasteMatch) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', margin: 0, fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px', color: '#ffffff' }}>
            <span>My Cleanup Participations</span>
            <History size={26} color="#00e5ff" />
          </h1>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {/* Card 1: Total Participated (Red Theme) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(28, 20, 36, 0.85) 0%, rgba(14, 25, 48, 0.95) 100%)',
          border: '1px solid rgba(255, 77, 77, 0.35)',
          boxShadow: '0 8px 24px rgba(255, 77, 77, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 77, 77, 0.2)', border: '1px solid rgba(255, 77, 77, 0.4)' }}>
            <CheckSquare size={24} color="#ff4d4d" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Total Participations</span>
            <div className="stat-val">{totalParticipations}</div>
          </div>
          <img src="/images/red_coral_card_bg.png" alt="Artwork" className="card-artwork-blend" />
        </div>

        {/* Card 2: Completed Cleanups (Cyan Theme) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(10, 38, 64, 0.85) 0%, rgba(8, 25, 46, 0.95) 100%)',
          border: '1px solid rgba(0, 229, 255, 0.35)',
          boxShadow: '0 8px 24px rgba(0, 229, 255, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 229, 255, 0.2)', border: '1px solid rgba(0, 229, 255, 0.4)' }}>
            <Clock size={24} color="#00e5ff" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Completed Cleanups</span>
            <div className="stat-val">{completedCount}</div>
          </div>
          <img src="/images/cyan_cleanups_corner.png" alt="Artwork" className="card-artwork-blend" />
        </div>

        {/* Card 3: Verified Cleanups (Teal Theme) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(10, 42, 50, 0.85) 0%, rgba(6, 28, 38, 0.95) 100%)',
          border: '1px solid rgba(0, 245, 212, 0.35)',
          boxShadow: '0 8px 24px rgba(0, 245, 212, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 245, 212, 0.2)', border: '1px solid rgba(0, 245, 212, 0.4)' }}>
            <ShieldCheck size={24} color="#00f5d4" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Verified Cleanups</span>
            <div className="stat-val">{verifiedCount}</div>
          </div>
          <img src="/images/green_teal_campaigns_bg.png" alt="Artwork" className="card-artwork-blend" />
        </div>

        {/* Card 4: Rewards Earned (Purple Theme) */}
        <div className="stat-card-marine" style={{
          background: 'linear-gradient(135deg, rgba(28, 20, 56, 0.85) 0%, rgba(16, 14, 40, 0.95) 100%)',
          border: '1px solid rgba(157, 78, 221, 0.35)',
          boxShadow: '0 8px 24px rgba(157, 78, 221, 0.12)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(157, 78, 221, 0.2)', border: '1px solid rgba(157, 78, 221, 0.4)' }}>
            <Award size={24} color="#9d4edd" />
          </div>
          <div className="stat-content-wrapper">
            <span className="stat-lbl">Total Rewards Earned</span>
            <div className="stat-val">₹{totalRewardsEarned.toLocaleString('en-IN')}</div>
          </div>
          <img src="/images/purple_coral_card_bg.png" alt="Artwork" className="card-artwork-blend" />
        </div>
      </div>

      {/* Main Ledger Panel */}
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
              Participated Cleanup Tasks Ledger
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Showing {filteredTasks.length} of {tasks.length} participations
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

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
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
              onClick={fetchParticipations}
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
              Refresh Log
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Loading cleanup participations...</div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 20px', background: 'rgba(8, 20, 42, 0.4)', borderRadius: '12px', border: '1px dashed rgba(0, 229, 255, 0.2)' }}>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#ffffff' }}>No cleanup task participations found.</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ marginTop: '12px', background: '#0284c7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Reset Search
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
                  <th>Completed Date</th>
                  <th>Status</th>
                  <th>Reward</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => (
                  <tr key={t.task_id}>
                    <td style={{ fontWeight: '700', color: '#ffffff' }}>{t.report_title}</td>
                    <td>{t.location_name}</td>
                    <td>{t.campaign_name || 'Direct Municipal Cleanup'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(t.assigned_date).toLocaleDateString()}</td>
                    <td style={{ fontSize: '0.85rem' }}>{t.completed_date ? new Date(t.completed_date).toLocaleDateString() : 'In Progress'}</td>
                    <td>
                      <span className={`badge ${
                        t.status === 'Verified' ? 'badge-completed' :
                        t.status === 'Completed' ? 'badge-verified' : 'badge-pending'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: '#10b981', fontSize: '0.9rem' }}>
                      ₹500.00
                    </td>
                    <td>
                      <button
                        onClick={() => { setSelectedTask(t); setShowModal(true); }}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Eye size={14} />
                        View Proof
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Participation Details Modal */}
      {showModal && selectedTask && (
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
            maxWidth: '580px',
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
                <CheckSquare size={22} color="#00e5ff" />
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#ffffff', fontWeight: '800' }}>
                  {selectedTask.report_title}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#cbd5e1', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(8, 20, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.15)' }}>
                <div>📍 <strong>Location:</strong> {selectedTask.location_name}</div>
                <div>🏷️ <strong>Waste Type:</strong> {selectedTask.waste_type || 'General litter'}</div>
                <div>🗓️ <strong>Assigned:</strong> {new Date(selectedTask.assigned_date).toLocaleDateString()}</div>
                <div>✅ <strong>Status:</strong> <span style={{ color: '#00e5ff', fontWeight: '700' }}>{selectedTask.status}</span></div>
              </div>

              {selectedTask.completion_notes && (
                <div style={{ background: 'rgba(8, 20, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.15)' }}>
                  <strong style={{ color: '#ffffff', display: 'block', marginBottom: '4px' }}>💬 Worker Completion Notes:</strong>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>{selectedTask.completion_notes}</p>
                </div>
              )}

              {selectedTask.after_image ? (
                <div>
                  <strong style={{ color: '#00e5ff', display: 'block', marginBottom: '8px' }}>📷 After-Cleanup Proof Photo:</strong>
                  <img
                    src={selectedTask.after_image}
                    alt="Proof"
                    style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '14px', border: '2px solid rgba(0, 229, 255, 0.4)' }}
                  />
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No proof image uploaded yet for this task.</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: '#10b981' }}>Cleanup Reward: ₹500.00</span>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', borderRadius: '10px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyParticipations;
