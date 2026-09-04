import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Phone, Mail, User, Lock, AlertCircle, Save, CheckCircle2 } from 'lucide-react';

const KERALA_DISTRICTS = [
  'Alappuzha',
  'Ernakulam',
  'Kozhikode',
  'Thiruvananthapuram',
  'Thrissur',
  'Kollam',
  'Malappuram',
  'Kannur',
  'Kasaragod',
  'Wayanad',
  'Palakkad',
  'Idukki',
  'Pathanamthitta',
  'Kottayam'
];

const WorkerProfileSetupModal = () => {
  const { user, updateProfile } = useAuth();

  // Editable fields
  const [district, setDistrict] = useState(user?.district || '');
  const [state, setState] = useState(user?.state || 'Kerala');
  const [address, setAddress] = useState(user?.address || '');

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  // Validation function for editable fields
  const validateField = (name, value) => {
    let errorMsg = '';

    switch (name) {
      case 'district':
        if (!value || !value.trim()) {
          errorMsg = 'Please select your primary operational district.';
        }
        break;

      case 'state':
        if (!value || !value.trim()) {
          errorMsg = 'State name is required.';
        } else if (value.trim().length < 2) {
          errorMsg = 'State must be at least 2 characters long.';
        } else if (!/^[A-Za-z\s]+$/.test(value.trim())) {
          errorMsg = 'State name must contain only letters and spaces.';
        }
        break;

      case 'address':
        const trimmedAddr = value ? value.trim() : '';
        const isAddrValid = trimmedAddr.length >= 10 &&
                            /[A-Za-z]/.test(trimmedAddr) &&
                            /^[A-Za-z0-9\s,.\/#()\-]+$/.test(trimmedAddr);
        if (!isAddrValid) {
          errorMsg = 'Address must be valid and contain letters, numbers, and street/ward details.';
        }
        break;

      default:
        break;
    }

    setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
    return !errorMsg;
  };

  const validateForm = () => {
    const isDistrictValid = validateField('district', district);
    const isStateValid = validateField('state', state);
    const isAddressValid = validateField('address', address);

    return isDistrictValid && isStateValid && isAddressValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');

    if (!validateForm()) {
      setFormError('Please correct the highlighted validation errors before saving.');
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile({
        full_name: user?.full_name,
        phone: user?.phone,
        district: district.trim(),
        state: state.trim(),
        address: address.trim()
      });
      setSuccess('Profile setup completed successfully!');
    } catch (err) {
      console.error('Worker Profile Setup Error:', err);
      setFormError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(4, 12, 26, 0.95)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999999,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '580px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: 'linear-gradient(135deg, rgba(12, 28, 54, 0.98) 0%, rgba(8, 20, 42, 0.99) 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(0, 229, 255, 0.35)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 229, 255, 0.15)',
        padding: '32px'
      }}>
        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(2, 132, 199, 0.3) 100%)',
            border: '2px solid rgba(0, 229, 255, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)'
          }}>
            <UserCheck size={32} color="#00e5ff" />
          </div>
          <h2 style={{ fontSize: '1.65rem', margin: 0, fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>
            Complete Worker Profile Setup
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.45' }}>
            Welcome to TerraMarine! Please complete your operational district, state, and address details to activate your worker dashboard.
          </p>
        </div>

        {formError && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '10px',
            color: '#f87171',
            fontSize: '0.85rem',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span>{formError}</span>
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '10px',
            color: '#10b981',
            fontSize: '0.85rem',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Section 1: Locked Account Credentials */}
          <div style={{
            background: 'rgba(8, 20, 42, 0.6)',
            border: '1px solid rgba(0, 229, 255, 0.15)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <Lock size={15} color="#00e5ff" />
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#00e5ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Account Credentials (Locked)
              </span>
            </div>

            {/* Full Name (Locked) */}
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={user?.full_name || ''}
                  disabled
                  readOnly
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: '#94a3b8',
                    fontSize: '0.88rem',
                    cursor: 'not-allowed'
                  }}
                />
                <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <Lock size={13} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              </div>
            </div>

            {/* Email & Phone Grid (Locked) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    readOnly
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                      cursor: 'not-allowed'
                    }}
                  />
                  <Mail size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <Lock size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>
                  Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={user?.phone || 'Not provided'}
                    disabled
                    readOnly
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                      cursor: 'not-allowed'
                    }}
                  />
                  <Phone size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <Lock size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Editable Operational Profile Fields */}

          {/* District & State */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px' }}>
                Operational District *
              </label>
              <select
                value={district}
                onChange={(e) => {
                  const val = e.target.value;
                  setDistrict(val);
                  validateField('district', val);
                }}
                onBlur={(e) => validateField('district', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: fieldErrors.district ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.3)',
                  background: '#08142a',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                <option value="">-- Select District --</option>
                {KERALA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {fieldErrors.district && (
                <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={13} /> {fieldErrors.district}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px' }}>
                State *
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => {
                  const val = e.target.value;
                  setState(val);
                  validateField('state', val);
                }}
                onBlur={(e) => validateField('state', e.target.value)}
                placeholder="e.g. Kerala"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: fieldErrors.state ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.3)',
                  background: 'rgba(8, 20, 42, 0.85)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              {fieldErrors.state && (
                <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={13} /> {fieldErrors.state}
                </span>
              )}
            </div>
          </div>

          {/* Residential Address */}
          <div>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px' }}>
              Residential / Operational Address *
            </label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => {
                const val = e.target.value;
                setAddress(val);
                validateField('address', val);
              }}
              onBlur={(e) => validateField('address', e.target.value)}
              placeholder="Enter your street name, city/village, house number, or municipal ward..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: fieldErrors.address ? '1px solid #ef4444' : '1px solid rgba(0, 229, 255, 0.3)',
                background: 'rgba(8, 20, 42, 0.85)',
                color: '#ffffff',
                fontSize: '0.9rem',
                resize: 'vertical',
                outline: 'none'
              }}
            />
            {fieldErrors.address && (
              <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={13} /> {fieldErrors.address}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '10px',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #00e5ff 100%)',
              color: '#041126',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 20px rgba(0, 229, 255, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <Save size={18} />
            <span>{submitting ? 'Saving Profile...' : 'Save Profile & Enter Dashboard'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default WorkerProfileSetupModal;
