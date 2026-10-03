import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckSquare, Clock, Camera, ShieldCheck, User, Calendar, MapPin, 
  Upload, CheckCircle2, AlertCircle, FileText, X, ArrowRight, Award,
  Search, RotateCcw, History, Filter, Eye, Check
} from 'lucide-react';
import CertificateModal from '../components/CertificateModal';

const MyParticipations = () => {
  const { authFetch, user } = useAuth();
  const [campaignHistory, setCampaignHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab State: 'campaigns' | 'tasks'
  const [activeTab, setActiveTab] = useState('campaigns');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const fetchParticipations = async () => {
    setLoading(true);
    try {
      const [historyRes, tasksRes, payRes] = await Promise.all([
        authFetch('/campaigns/my-history'),
        authFetch('/tasks?type=my_tasks'),
        authFetch('/payments')
      ]);

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setCampaignHistory(historyData.history || []);
      }

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

  const totalCampaignsJoined = campaignHistory.length;
  const attendedCount = campaignHistory.filter(c => c.attendance).length;
  const certificatesCount = campaignHistory.filter(c => c.certificate_status).length;
  const totalRewardsEarned = payments
    .filter(p => p.payment_status === 'Paid')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  // Filtered Campaigns
  const filteredCampaigns = campaignHistory.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = c.campaign_name?.toLowerCase().includes(q);
      const locMatch = c.location?.toLowerCase().includes(q);
      const orgMatch = (c.organization_name || c.creator_name)?.toLowerCase().includes(q);
      if (!nameMatch && !locMatch && !orgMatch) return false;
    }
    return true;
  });

  // Filtered Tasks
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
      <div>
        <h1 style={{ fontSize: '2.1rem', margin: 0, fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px', color: '#ffffff' }}>
          <span>My Participations & History</span>
          <History size={26} color="#00e5ff" />
        </h1>
      </div>

      {/* PARTICIPATED CLEANUP CAMPAIGNS */}
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
                Participated Cleanup Campaigns
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Showing {filteredCampaigns.length} of {campaignHistory.length} joined drives
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search campaign, location, org..."
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
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Loading campaign participations...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 20px', background: 'rgba(8, 20, 42, 0.4)', borderRadius: '12px', border: '1px dashed rgba(0, 229, 255, 0.2)' }}>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#ffffff' }}>No participated campaigns found.</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>Join upcoming coastal drives from your Dashboard!</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Organizer</th>
                    <th>Location</th>
                    <th>Date & Timing</th>
                    <th>Attendance</th>
                    <th>Certificate Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((item) => (
                    <tr key={item.registration_id}>
                      <td style={{ fontWeight: '700', color: '#ffffff' }}>
                        <div>{item.campaign_name}</div>
                        {item.description && (
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px', fontWeight: 'normal' }}>
                            {item.description.slice(0, 60)}...
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#e2e8f0' }}>{item.organization_name || item.creator_name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#cbd5e1' }}>
                          <MapPin size={13} color="#00e5ff" />
                          <span>{item.location}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.84rem', color: '#ffffff' }}>
                        <div>{new Date(item.campaign_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        {item.start_time && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {item.start_time.slice(0, 5)} - {item.end_time?.slice(0, 5) || 'TBD'}
                          </div>
                        )}
                      </td>
                      <td>
                        {item.attendance ? (
                          <span style={{ background: 'rgba(0, 245, 212, 0.15)', color: '#00f5d4', border: '1px solid rgba(0, 245, 212, 0.3)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={13} /> Attended
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(255, 183, 3, 0.15)', color: '#ffb703', border: '1px solid rgba(255, 183, 3, 0.3)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '600' }}>
                            Registered
                          </span>
                        )}
                      </td>
                      <td>
                        {item.certificate_status ? (
                          <span style={{ background: 'rgba(2, 132, 199, 0.2)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.35)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Award size={13} /> Certificate Issued
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            Pending Issue
                          </span>
                        )}
                      </td>
                      <td>
                        {item.certificate_status ? (
                          <button
                            onClick={() => setSelectedCert({
                              ...item,
                              volunteer_name: item.volunteer_name || user?.full_name || 'Valued Coastal Volunteer'
                            })}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #0284c7 0%, #00e5ff 100%)', color: '#041126', fontWeight: '700' }}
                          >
                            <Award size={14} />
                            View Certificate
                          </button>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>No Actions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Task Proof Details Modal */}
      {showTaskModal && selectedTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(4, 12, 26, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justify: 'center',
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
                onClick={() => setShowTaskModal(false)}
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
                  onClick={() => setShowTaskModal(false)}
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

      {/* Official Certificate Viewing Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
};

export default MyParticipations;
