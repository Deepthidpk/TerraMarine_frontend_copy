import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { API_URL } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return setError('Please enter a new password.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (!token) return setError('Reset token is missing from the URL.');

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }

      setMessage(data.message || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'An error occurred during password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-logo">
          🌊 TerraMarine
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '1.4rem' }}>
          Choose New Password
        </h2>

        {error && (
          <div style={{ 
            padding: '12px', 
            background: 'rgba(239, 68, 68, 0.15)', 
            border: '1px solid var(--danger)', 
            borderRadius: '8px', 
            color: 'var(--danger)',
            fontSize: '0.9rem',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ 
            padding: '12px', 
            background: 'rgba(16, 185, 129, 0.15)', 
            border: '1px solid var(--success)', 
            borderRadius: '8px', 
            color: 'var(--success)',
            fontSize: '0.9rem',
            marginBottom: '20px'
          }}>
            {message}
          </div>
        )}

        {!token && (
          <div style={{ 
            padding: '12px', 
            background: 'rgba(239, 68, 68, 0.15)', 
            border: '1px solid var(--danger)', 
            borderRadius: '8px', 
            color: 'var(--danger)',
            fontSize: '0.9rem',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            Warning: Reset token is missing from link. Please request a new password reset email.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Enter new password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!token}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Confirm new password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={!token}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            disabled={loading || !token}
          >
            {loading ? 'Resetting password...' : 'Update Password'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Back to{' '}
          <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
