import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, Wallet, Send, CheckCircle, Clock } from 'lucide-react';

const Payments = () => {
  const { user, authFetch } = useAuth();
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handlePayReward = async (paymentId) => {
    try {
      // 1. Create order
      const orderRes = await authFetch(`/payments/${paymentId}/create-order`, {
        method: 'POST'
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');

      // 2. Initialize Razorpay
      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "TerraMarine",
        description: "Cleanup Reward Payout",
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            const payRes = await authFetch(`/payments/${paymentId}/pay`, {
              method: 'PUT',
              body: JSON.stringify({
                payment_method: 'Razorpay',
                transaction_ref: response.razorpay_payment_id
              })
            });
            const payData = await payRes.json();
            if (!payRes.ok) throw new Error(payData.error || 'Disbursement processing failed.');
            setSuccess('Reward payment disbursed successfully!');
            fetchPayments();
          } catch (err) {
            setError(err.message || 'Error executing payment.');
          }
        },
        prefill: {
          name: user.full_name,
          email: user.email,
        },
        theme: {
          color: "#00e5ff"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
         setError('Payment failed: ' + response.error.description);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || 'Error initiating payment');
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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Rewards & Compensation Payouts</h1>
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
                            onClick={() => handlePayReward(p.payment_id)}
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
    </div>
  );
};

export default Payments;
