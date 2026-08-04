import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Google Registration Modal states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState(null);
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // New Google user registration fields
  const [regForm, setRegForm] = useState({
    role: 'Citizen',
    phone: '',
    address: '',
    district: '',
    state: '',
    organization_name: '',
    registration_number: '',
    organization_address: '',
    institution_name: '',
    department: '',
    research_area: '',
    government_id_type: 'Aadhaar',
    government_id_number: '',
    fishing_license_number: '',
    boat_registration_number: ''
  });

  const [regFiles, setRegFiles] = useState({
    registration_certificate: null,
    institution_id: null,
    government_id: null
  });

  const { login, googleLogin, completeGoogleRegistration, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('suspended') === 'true') {
      setError('⛔ Access Denied: Your account or organization has been suspended by a System Administrator.');
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateField = (name, value) => {
    let errorMsg = '';
    if (name === 'email') {
      if (!value) {
        errorMsg = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errorMsg = 'Please enter a valid email address.';
      }
    } else if (name === 'password') {
      if (!value) {
        errorMsg = 'Password is required.';
      } else if (value.length < 6) {
        errorMsg = 'Password must be at least 6 characters.';
      }
    }
    setFieldErrors((prev) => ({
      ...prev,
      [name]: errorMsg
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let hasErrors = false;
    const errors = {};
    if (!email) {
      errors.email = 'Email address is required.';
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
      hasErrors = true;
    }
    
    if (!password) {
      errors.password = 'Password is required.';
      hasErrors = true;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
      hasErrors = true;
    }
    
    if (hasErrors) {
      setFieldErrors(errors);
      setError('Please correct the validation errors in the form.');
      return;
    }

    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser?.role === 'Citizen') {
        navigate('/reports');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In Popup Handler via @react-oauth/google
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const tokenValue = tokenResponse.access_token || tokenResponse.credential;
        const res = await googleLogin(tokenValue);
        
        if (res.isNewUser) {
          // Email is NOT registered yet -> Open Role & Verification Modal
          setGoogleUserData(res.googleData);
          setShowRoleModal(true);
        } else {
          // Existing user -> Navigate directly to dashboard
          navigate(res?.redirect || '/dashboard');
        }
      } catch (err) {
        setError(err.message || 'Google authentication failed.');
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error('Google Sign-In Error:', errorResponse);
      setError('Google Sign-In was cancelled or failed.');
    }
  });

  const handleRegFormChange = (e) => {
    const { name, value } = e.target;
    setRegForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setRegFiles((prev) => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    if (!regForm.address || !regForm.district || !regForm.state) {
      setError('Please provide Address, District, and State.');
      return;
    }

    // Role-specific validation
    if (regForm.role === 'NGO') {
      if (!regForm.organization_name || !regForm.registration_number || !regForm.organization_address) {
        setError('Please fill in all NGO organization details.');
        return;
      }
      if (!regFiles.registration_certificate) {
        setError('Please upload the NGO Registration Certificate document.');
        return;
      }
    } else if (regForm.role === 'Researcher') {
      if (!regForm.institution_name || !regForm.department || !regForm.research_area) {
        setError('Please fill in all Researcher details.');
        return;
      }
      if (!regFiles.institution_id) {
        setError('Please upload your Institution ID Card document.');
        return;
      }
    } else if (regForm.role === 'Volunteer') {
      if (!regForm.government_id_type || !regForm.government_id_number) {
        setError('Please provide Government ID details.');
        return;
      }
      if (!regFiles.government_id) {
        setError('Please upload your Government ID document.');
        return;
      }
    } else if (regForm.role === 'Fisherman') {
      if (!regForm.fishing_license_number || !regForm.boat_registration_number) {
        setError('Please provide Fishing License and Boat Registration numbers.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('full_name', googleUserData.full_name);
      formData.append('email', googleUserData.email);
      formData.append('google_id', googleUserData.google_id);
      formData.append('profile_image', googleUserData.picture || '');
      formData.append('role', regForm.role);
      formData.append('phone', regForm.phone);
      formData.append('address', regForm.address);
      formData.append('district', regForm.district);
      formData.append('state', regForm.state);

      if (regForm.role === 'NGO') {
        formData.append('organization_name', regForm.organization_name);
        formData.append('registration_number', regForm.registration_number);
        formData.append('organization_address', regForm.organization_address);
        if (regFiles.registration_certificate) {
          formData.append('registration_certificate', regFiles.registration_certificate);
        }
      } else if (regForm.role === 'Researcher') {
        formData.append('institution_name', regForm.institution_name);
        formData.append('department', regForm.department);
        formData.append('research_area', regForm.research_area);
        if (regFiles.institution_id) {
          formData.append('institution_id', regFiles.institution_id);
        }
      } else if (regForm.role === 'Volunteer') {
        formData.append('government_id_type', regForm.government_id_type);
        formData.append('government_id_number', regForm.government_id_number);
        if (regFiles.government_id) {
          formData.append('government_id', regFiles.government_id);
        }
      } else if (regForm.role === 'Fisherman') {
        formData.append('fishing_license_number', regForm.fishing_license_number);
        formData.append('boat_registration_number', regForm.boat_registration_number);
      }

      const res = await completeGoogleRegistration(formData);

      if (res.status === 'Pending') {
        setRegSuccessMsg(res.message || 'Registration submitted successfully and is awaiting administrator approval.');
      } else {
        navigate(res.redirect || '/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ 
      minHeight: '100vh', 
      width: '100vw',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 40%, #071e3d 0%, #020b18 100%)',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px'
    }}>
      {/* Main Wide Auth Card with Blended Octopus Background */}
      <div className="auth-card glass-panel" style={{ 
        maxWidth: '540px',
        width: '100%',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        border: '1px solid rgba(0, 229, 255, 0.25)',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(8, 24, 48, 0.95) 0%, rgba(4, 15, 32, 0.98) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'relative',
        zIndex: 2,
        margin: 'auto',
        overflow: 'hidden',
        padding: '42px 40px'
      }}>
        {/* Soft Blended Octopus Image inside Login Box (Matches Reference) */}
        <img 
          src="/images/cute_octopus_marine.png" 
          alt="Marine Octopus Background" 
          style={{
            position: 'absolute',
            top: '56%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '320px',
            height: 'auto',
            opacity: 0.16,
            pointerEvents: 'none',
            zIndex: 0,
            filter: 'brightness(0.95) contrast(1.1)'
          }}
        />

        {/* Card Content Container */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <img 
              src="/images/whale_logo_icon.png" 
              alt="TerraMarine Logo" 
              style={{ width: '58px', height: '58px', objectFit: 'contain', background: 'transparent', filter: 'drop-shadow(0 0 14px rgba(0, 229, 255, 0.7))', marginBottom: '8px' }} 
            />
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.85rem', 
              fontWeight: 800, 
              color: '#ffffff', 
              letterSpacing: '-0.02em', 
              fontFamily: 'var(--font-display)' 
            }}>
              TerraMarine
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.86rem', marginTop: '6px', margin: 0 }}>
              Enter your credentials to access your coastal monitoring portal
            </p>
          </div>

          {error && (
            <div style={{ 
              padding: '12px 14px', 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: '1px solid rgba(239, 68, 68, 0.4)', 
              borderRadius: '10px', 
              color: '#ef4444',
              fontSize: '0.85rem',
              marginBottom: '20px',
              fontWeight: '600'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                EMAIL ADDRESS
              </label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="e.g. user@terramarine.org" 
                value={email}
                onChange={(e) => { setEmail(e.target.value); validateField('email', e.target.value); }}
                style={{ 
                  padding: '11px 14px', 
                  fontSize: '0.9rem', 
                  borderColor: fieldErrors.email ? '#ef4444' : 'rgba(0, 229, 255, 0.25)',
                  background: 'rgba(8, 20, 42, 0.75)',
                  color: '#ffffff'
                }}
              />
              {fieldErrors.email && (
                <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ marginBottom: 0, color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                  PASSWORD
                </label>
                <Link to="/forgot-password" style={{ color: '#00e5ff', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
                  Forgot Password?
                </Link>
              </div>
              <input 
                type="password" 
                className="form-control" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => { setPassword(e.target.value); validateField('password', e.target.value); }}
                style={{ 
                  padding: '11px 14px', 
                  fontSize: '0.9rem', 
                  borderColor: fieldErrors.password ? '#ef4444' : 'rgba(0, 229, 255, 0.25)',
                  background: 'rgba(8, 20, 42, 0.75)',
                  color: '#ffffff'
                }}
              />
              {fieldErrors.password && (
                <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '0.95rem', 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: '1px solid rgba(0, 229, 255, 0.4)',
                boxShadow: '0 4px 18px rgba(0, 229, 255, 0.25)'
              }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div style={{ margin: '22px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(0, 229, 255, 0.18)' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(0, 229, 255, 0.18)' }}></div>
          </div>

          {/* Google Login Button */}
          <div>
            <button 
              onClick={() => triggerGoogleLogin()} 
              className="btn btn-secondary" 
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px', 
                background: 'rgba(255, 255, 255, 0.08)', 
                color: '#ffffff', 
                fontWeight: 600, 
                width: '100%', 
                padding: '11px',
                fontSize: '0.9rem',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.2s ease'
              }}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              {loading ? 'Connecting...' : 'Continue with Google'}
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: '#94a3b8' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#00e5ff', textDecoration: 'underline', fontWeight: 600 }}>
              Register Now
            </Link>
          </p>
        </div>
      </div>

      {/* Role Selection & Verification Modal for New Google Users */}
      {showRoleModal && googleUserData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 15, 29, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            background: '#ffffff',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid rgba(23, 28, 66, 0.15)'
          }}>
            {regSuccessMsg ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
                <h3 style={{ fontSize: '1.4rem', color: '#171c42', marginBottom: '12px', fontWeight: 700 }}>
                  Registration Submitted
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
                  {regSuccessMsg}
                </p>
                <button 
                  onClick={() => setShowRoleModal(false)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleCompleteRegistration}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(23, 28, 66, 0.1)' }}>
                  <img 
                    src={googleUserData.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'} 
                    alt="Google Profile" 
                    style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: '#171c42', margin: 0, fontWeight: 700 }}>
                      Complete Registration
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {googleUserData.full_name} ({googleUserData.email})
                    </p>
                  </div>
                </div>

                {error && (
                  <div style={{ 
                    padding: '10px 14px', 
                    background: 'rgba(239, 68, 68, 0.08)', 
                    border: '1px solid var(--danger)', 
                    borderRadius: '8px', 
                    color: 'var(--danger)',
                    fontSize: '0.85rem',
                    marginBottom: '16px'
                  }}>
                    {error}
                  </div>
                )}

                {/* Role Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#171c42', display: 'block', marginBottom: '8px' }}>
                    Select Your Role *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {[
                      { id: 'Citizen', label: '🌊 Citizen' },
                      { id: 'Fisherman', label: '🎣 Fisherman' },
                      { id: 'Volunteer', label: '🤝 Volunteer' },
                      { id: 'NGO', label: '🏢 NGO' },
                      { id: 'Researcher', label: '🔬 Researcher' }
                    ].map((roleItem) => (
                      <button
                        key={roleItem.id}
                        type="button"
                        onClick={() => setRegForm(prev => ({ ...prev, role: roleItem.id }))}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: regForm.role === roleItem.id ? '2px solid var(--accent-secondary)' : '1px solid rgba(23, 28, 66, 0.15)',
                          background: regForm.role === roleItem.id ? 'rgba(0, 187, 249, 0.1)' : '#ffffff',
                          color: regForm.role === roleItem.id ? 'var(--accent-secondary)' : '#171c42',
                          fontWeight: 600,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {roleItem.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#171c42' }}>District *</label>
                    <input 
                      type="text"
                      name="district"
                      placeholder="e.g. Ernakulam"
                      value={regForm.district}
                      onChange={handleRegFormChange}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(23, 28, 66, 0.15)', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#171c42' }}>State *</label>
                    <input 
                      type="text"
                      name="state"
                      placeholder="e.g. Kerala"
                      value={regForm.state}
                      onChange={handleRegFormChange}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(23, 28, 66, 0.15)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#171c42' }}>Address *</label>
                  <input 
                    type="text"
                    name="address"
                    placeholder="Enter full address"
                    value={regForm.address}
                    onChange={handleRegFormChange}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(23, 28, 66, 0.15)', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Role Specific Document & Field Requirements */}
                {regForm.role === 'NGO' && (
                  <div style={{ background: 'rgba(0, 187, 249, 0.05)', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(0, 187, 249, 0.2)' }}>
                    <h5 style={{ fontSize: '0.9rem', color: '#171c42', marginBottom: '12px', fontWeight: 700 }}>NGO Credentials & Certificate</h5>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Organization Name *</label>
                      <input type="text" name="organization_name" value={regForm.organization_name} onChange={handleRegFormChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Registration Number *</label>
                      <input type="text" name="registration_number" value={regForm.registration_number} onChange={handleRegFormChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Organization Address *</label>
                      <input type="text" name="organization_address" value={regForm.organization_address} onChange={handleRegFormChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Upload Registration Certificate (PDF/JPG/PNG) *</label>
                      <input type="file" name="registration_certificate" accept=".pdf,.jpg,.jpeg,.png" onChange={handleRegFileChange} style={{ width: '100%', marginTop: '4px', fontSize: '0.8rem' }} />
                    </div>
                  </div>
                )}

                {regForm.role === 'Researcher' && (
                  <div style={{ background: 'rgba(0, 187, 249, 0.05)', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(0, 187, 249, 0.2)' }}>
                    <h5 style={{ fontSize: '0.9rem', color: '#171c42', marginBottom: '12px', fontWeight: 700 }}>Researcher Credentials & ID</h5>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Institution Name *</label>
                      <input type="text" name="institution_name" value={regForm.institution_name} onChange={handleRegFormChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Department *</label>
                      <input type="text" name="department" value={regForm.department} onChange={handleRegFormChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Research Area *</label>
                      <input type="text" name="research_area" value={regForm.research_area} onChange={handleRegFormChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Upload Institution ID Card (PDF/JPG/PNG) *</label>
                      <input type="file" name="institution_id" accept=".pdf,.jpg,.jpeg,.png" onChange={handleRegFileChange} style={{ width: '100%', marginTop: '4px', fontSize: '0.8rem' }} />
                    </div>
                  </div>
                )}

                {regForm.role === 'Volunteer' && (
                  <div style={{ background: 'rgba(0, 187, 249, 0.05)', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(0, 187, 249, 0.2)' }}>
                    <h5 style={{ fontSize: '0.9rem', color: '#171c42', marginBottom: '12px', fontWeight: 700 }}>Volunteer Government Verification</h5>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Government ID Type *</label>
                      <select name="government_id_type" value={regForm.government_id_type} onChange={handleRegFormChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }}>
                        <option value="Aadhaar">Aadhaar</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Passport">Passport</option>
                        <option value="Voter ID">Voter ID</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Government ID Number *</label>
                      <input type="text" name="government_id_number" value={regForm.government_id_number} onChange={handleRegFormChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Upload Government ID Document (PDF/JPG/PNG) *</label>
                      <input type="file" name="government_id" accept=".pdf,.jpg,.jpeg,.png" onChange={handleRegFileChange} style={{ width: '100%', marginTop: '4px', fontSize: '0.8rem' }} />
                    </div>
                  </div>
                )}

                {regForm.role === 'Fisherman' && (
                  <div style={{ background: 'rgba(0, 187, 249, 0.05)', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(0, 187, 249, 0.2)' }}>
                    <h5 style={{ fontSize: '0.9rem', color: '#171c42', marginBottom: '12px', fontWeight: 700 }}>Fisherman License Details</h5>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Fishing License Number *</label>
                      <input type="text" name="fishing_license_number" value={regForm.fishing_license_number} onChange={handleRegFormChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Boat Registration Number *</label>
                      <input type="text" name="boat_registration_number" value={regForm.boat_registration_number} onChange={handleRegFormChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowRoleModal(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ flex: 2, padding: '10px', fontWeight: 600 }}
                    disabled={loading}
                  >
                    {loading ? 'Submitting Details...' : 'Complete Registration'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
