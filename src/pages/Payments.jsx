import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, Wallet, Send, CheckCircle, Clock } from 'lucide-react';

const Payments = () => {
  const { user, authFetch } = useAuth();
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Disbursement form state (Authority only)
  const [activePaymentId, setActivePaymentId] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPayments = async () => {
    try {
      const res = await authFetch('/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleOpenPayModal = (paymentId) => {
    setActivePaymentId(paymentId);
    setTransactionRef(`TXN${Math.floor(1000000000 + Math.random() * 9000000000)}`); // generate mock transaction reference
    setShowPayModal(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!paymentMethod || !transactionRef) {
      return setError('Method and reference are required.');
    }
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await authFetch(`/payments/${activePaymentId}/pay`, {
        method: 'PUT',
        body: JSON.stringify({
          payment_method: paymentMethod,
          transaction_ref: transactionRef
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Disbursement processing failed.');
      }

      setSuccess('Reward payment disbursed successfully!');
      setShowPayModal(false);
      fetchPayments();
    } catch (err) {
      setError(err.message || 'Error executing payment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate stats
  const totalPendingAmount = payments
    .filter(p => p.payment_status === 'Pending')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalPaidAmount = payments
    .filter(p => p.payment_status === 'Paid')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Rewards & Compensation Payouts</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage clean-up rewards and disbursements for coastal volunteers.
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

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {user.role === 'Volunteer' ? 'My Unpaid Earnings' : 'Total Pending Disbursements'}
            </span>
            <div className="stat-number" style={{ color: 'var(--warning)' }}>₹{totalPendingAmount.toFixed(2)}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <Wallet size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {user.role === 'Volunteer' ? 'My Received Rewards' : 'Total Disbursed Funds'}
            </span>
            <div className="stat-number" style={{ color: 'var(--success)' }}>₹{totalPaidAmount.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Ledger list */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Award size={20} color="var(--accent-primary)" />
          Compensation Ledger Log
        </h3>
        
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading ledger records...</div>
        ) : payments.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>
            No payment records found.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  {user.role !== 'Volunteer' && <th>Volunteer Name</th>}
                  <th>Cleanup Campaign</th>
                  <th>Compensation Amount</th>
                  <th>Payment Status</th>
                  <th>Disbursement Method</th>
                  <th>Transaction Reference</th>
                  <th>Disbursement Date</th>
                  {['Authority', 'Admin'].includes(user.role) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.payment_id}>
                    {user.role !== 'Volunteer' && (
                      <td style={{ fontWeight: 600 }}>{p.volunteer_name}</td>
                    )}
                    <td>
                      <div>
                        <strong>{p.campaign_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.campaign_location}</div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{parseFloat(p.amount).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.payment_status === 'Paid' ? 'badge-completed' : 'badge-pending'}`}>
                        {p.payment_status}
                      </span>
                    </td>
                    <td>{p.payment_method || '---'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.transaction_ref || '---'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {p.payment_date ? new Date(p.payment_date).toLocaleString() : '---'}
                    </td>
                    {['Authority', 'Admin'].includes(user.role) && (
                      <td>
                        {p.payment_status === 'Pending' ? (
                          <button
                            onClick={() => handleOpenPayModal(p.payment_id)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            <Wallet size={12} />
                            Pay Reward
                          </button>
                        ) : (
                          <span style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Completed
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay modal form (Authority only) */}
      {showPayModal && (
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
            maxWidth: '450px',
            width: '100%',
            background: 'var(--bg-secondary)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowPayModal(false)}
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

            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Wallet size={20} color="var(--accent-primary)" />
              Disburse Clean-Up Reward
            </h2>

            <form onSubmit={handleProcessPayment}>
              <div className="form-group">
                <label className="form-label">Payment Method *</label>
                <select 
                  className="form-control" 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Cash">Handover Cash</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Reference *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '10px', marginTop: '8px' }}
                disabled={submitting}
              >
                {submitting ? 'Processing payout...' : 'Confirm Reward Transfer'}
              </button>
            </form>

            <button 
              onClick={() => setShowPayModal(false)}
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '12px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
