import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { API_URL } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email address.');
    
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Request failed.');
      }
      
      setMessage(data.message || `Password reset link sent to ${email}! Please check your inbox and spam folder.`);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-card glass-panel" style={{ 
        boxShadow: '0 20px 40px -15px rgba(23, 28, 66, 0.35)',
        border: '1px solid rgba(23, 28, 66, 0.12)',
        padding: '36px 32px',
        maxWidth: '440px',
        width: '100%'
      }}>
        <div className="auth-logo" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, textAlign: 'center', marginBottom: '16px' }}>
          🌊 TerraMarine
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '12px', fontSize: '1.5rem', color: '#171c42', fontWeight: 700 }}>
          Reset Password
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.5 }}>
          Enter your registered email address below to receive a secure password reset link.
        </p>

        {error && (
          <div style={{ 
            padding: '12px', 
            background: 'rgba(239, 68, 68, 0.08)', 
            border: '1px solid var(--danger)', 
            borderRadius: '8px', 
            color: 'var(--danger)',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ 
            padding: '14px', 
            background: 'rgba(16, 185, 129, 0.08)', 
            border: '1px solid var(--success)', 
            borderRadius: '10px', 
            color: '#065f46',
            fontSize: '0.88rem',
            marginBottom: '20px',
            lineHeight: 1.5
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="Enter your registered email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ fontSize: '0.9rem' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 600 }}
            disabled={loading}
          >
            {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Remember your password?{' '}
          <Link to="/login" style={{ color: 'var(--accent-secondary)', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
