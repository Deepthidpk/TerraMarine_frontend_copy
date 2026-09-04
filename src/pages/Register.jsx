import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    district: '',
    state: '',
    role: 'Citizen',
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

  const [files, setFiles] = useState({
    registration_certificate: null,
    institution_id: null,
    government_id: null
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let errorMsg = '';
    if (name === 'full_name') {
      if (!value) {
        errorMsg = 'Full name is required.';
      } else if (value.trim().length < 3) {
        errorMsg = 'Full name must be at least 3 characters.';
      } else if (!/^[A-Za-z\s]+$/.test(value)) {
        errorMsg = 'Full name can only contain letters and spaces.';
      }
    } else if (name === 'email') {
      if (!value) {
        errorMsg = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errorMsg = 'Please enter a valid email address.';
      }
    } else if (name === 'phone') {
      if (!value) {
        errorMsg = 'Phone number is required.';
      } else if (!/^[6-9][0-9]{9}$/.test(value)) {
        errorMsg = 'Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.';
      }
    } else if (name === 'password') {
      if (!value) {
        errorMsg = 'Password is required.';
      } else if (value.length < 6) {
        errorMsg = 'Password must be at least 6 characters.';
      } else if (!/[A-Za-z]/.test(value) || !/\d/.test(value) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(value)) {
        errorMsg = 'Password must contain letters, digits, and special characters.';
      }
    } else if (name === 'confirmPassword') {
      if (!value) {
        errorMsg = 'Please confirm your password.';
      } else if (value !== formData.password) {
        errorMsg = 'Passwords do not match.';
      }
    } else if (name === 'address') {
      if (!value) {
        errorMsg = 'Address is required.';
      } else if (value.trim().length < 5) {
        errorMsg = 'Address must be at least 5 characters.';
      } else if (!/^[A-Za-z0-9\s]+$/.test(value)) {
        errorMsg = 'Address can only contain letters, digits, and spaces.';
      }
    } else if (name === 'district') {
      if (!value) {
        errorMsg = 'District is required.';
      } else if (!/^[A-Za-z0-9\s]+$/.test(value)) {
        errorMsg = 'District can only contain letters, digits, and spaces.';
      }
    } else if (name === 'state') {
      if (!value) {
        errorMsg = 'State is required.';
      } else if (!/^[A-Za-z0-9\s]+$/.test(value)) {
        errorMsg = 'State can only contain letters, digits, and spaces.';
      }
    } else if (name === 'organization_name') {
      if (!value) {
        errorMsg = 'Organization name is required.';
      } else if (value.trim().length < 3) {
        errorMsg = 'Organization name must be at least 3 characters.';
      } else if (!/^[A-Za-z0-9\s]+$/.test(value)) {
        errorMsg = 'Organization name can only contain letters, digits, and spaces.';
      }
    } else if (name === 'registration_number') {
      if (!value) {
        errorMsg = 'Registration number is required.';
      } else if (value.trim().length < 5) {
        errorMsg = 'Registration number must be at least 5 characters.';
      } else if (!/^[A-Za-z0-9]+$/.test(value)) {
        errorMsg = 'Registration number can only contain letters and digits.';
      }
    } else if (name === 'organization_address') {
      if (!value) {
        errorMsg = 'Organization address is required.';
      } else if (value.trim().length < 10) {
        errorMsg = 'Organization address must be at least 10 characters.';
      } else if (!/^[A-Za-z0-9\s]+$/.test(value)) {
        errorMsg = 'Organization address can only contain letters, digits, and spaces.';
      }
    } else if (name === 'institution_name') {
      if (!value) {
        errorMsg = 'Institution name is required.';
      } else if (value.trim().length < 3) {
        errorMsg = 'Institution name must be at least 3 characters.';
      } else if (!/^[A-Za-z0-9\s]+$/.test(value)) {
        errorMsg = 'Institution name can only contain letters, digits, and spaces.';
      }
    } else if (name === 'department') {
      if (!value) {
        errorMsg = 'Department is required.';
      } else if (value.trim().length < 2) {
        errorMsg = 'Department must be at least 2 characters.';
      } else if (!/^[A-Za-z0-9\s]+$/.test(value)) {
        errorMsg = 'Department name can only contain letters, digits, and spaces.';
      }
    } else if (name === 'research_area') {
      if (!value) {
        errorMsg = 'Research area is required.';
      } else if (value.trim().length < 5) {
        errorMsg = 'Research area must be at least 5 characters.';
      } else if (!/^[A-Za-z0-9\s]+$/.test(value)) {
        errorMsg = 'Research area can only contain letters, digits, and spaces.';
      }
    } else if (name === 'government_id_number') {
      if (!value) {
        errorMsg = 'Government ID number is required.';
      } else if (formData.government_id_type === 'Aadhaar') {
        if (!/^[0-9]{12}$/.test(value)) {
          errorMsg = 'Aadhaar number must be exactly 12 digits.';
        }
      } else if (!/^[A-Za-z0-9]+$/.test(value)) {
        errorMsg = 'Government ID number can only contain letters and digits.';
      } else if (value.trim().length < 5) {
        errorMsg = 'ID number must be at least 5 characters.';
      }
    } else if (name === 'fishing_license_number') {
      if (!value) {
        errorMsg = 'Fishing license number is required.';
      } else if (value.trim().length < 5) {
        errorMsg = 'Fishing license number must be at least 5 characters.';
      } else if (!/^[A-Za-z0-9]+$/.test(value)) {
        errorMsg = 'Fishing license number can only contain letters and digits.';
      }
    } else if (name === 'boat_registration_number') {
      if (!value) {
        errorMsg = 'Boat registration number is required.';
      } else if (value.trim().length < 5) {
        errorMsg = 'Boat registration number must be at least 5 characters.';
      } else if (!/^[A-Za-z0-9]+$/.test(value)) {
        errorMsg = 'Boat registration number can only contain letters and digits.';
      }
    }

    setFieldErrors((prev) => ({
      ...prev,
      [name]: errorMsg
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    validateField(name, value);
    if (name === 'password' && formData.confirmPassword) {
      if (formData.confirmPassword !== value) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
      } else {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
    }
    if (name === 'government_id_type' && formData.government_id_number) {
      // Re-validate ID number whenever type is switched
      setTimeout(() => {
        validateField('government_id_number', formData.government_id_number);
      }, 0);
    }
    if (name === 'role') {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.organization_name;
        delete copy.registration_number;
        delete copy.organization_address;
        delete copy.registration_certificate;
        delete copy.institution_name;
        delete copy.department;
        delete copy.research_area;
        delete copy.institution_id;
        delete copy.government_id_type;
        delete copy.government_id_number;
        delete copy.government_id;
        delete copy.fishing_license_number;
        delete copy.boat_registration_number;
        return copy;
      });
    }
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    let errorMsg = '';
    if (selectedFiles && selectedFiles[0]) {
      const file = selectedFiles[0];
      const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        errorMsg = 'Only PDF, JPG, JPEG, and PNG files are allowed.';
      } else if (file.size > 5 * 1024 * 1024) {
        errorMsg = 'File size exceeds the 5MB limit.';
      }

      setFieldErrors((prev) => ({
        ...prev,
        [name]: errorMsg
      }));

      if (!errorMsg) {
        setFiles((prev) => ({
          ...prev,
          [name]: file
        }));
      } else {
        e.target.value = null;
        setFiles((prev) => ({
          ...prev,
          [name]: null
        }));
      }
    } else {
      errorMsg = 'File upload is required.';
      setFieldErrors((prev) => ({
        ...prev,
        [name]: errorMsg
      }));
    }
  };

  const isFormValid = () => {
    if (!formData.full_name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword || !formData.address || !formData.district || !formData.state) return false;
    if (fieldErrors.full_name || fieldErrors.email || fieldErrors.phone || fieldErrors.password || fieldErrors.confirmPassword || fieldErrors.address || fieldErrors.district || fieldErrors.state) return false;

    if (formData.role === 'NGO') {
      if (!formData.organization_name || !formData.registration_number || !formData.organization_address || !files.registration_certificate) return false;
      if (fieldErrors.organization_name || fieldErrors.registration_number || fieldErrors.organization_address || fieldErrors.registration_certificate) return false;
    } else if (formData.role === 'Researcher') {
      if (!formData.institution_name || !formData.department || !formData.research_area || !files.institution_id) return false;
      if (fieldErrors.institution_name || fieldErrors.department || fieldErrors.research_area || fieldErrors.institution_id) return false;
    } else if (formData.role === 'Volunteer') {
      if (!formData.government_id_number || !files.government_id) return false;
      if (fieldErrors.government_id_number || fieldErrors.government_id) return false;
    } else if (formData.role === 'Fisherman') {
      if (!formData.fishing_license_number || !formData.boat_registration_number) return false;
      if (fieldErrors.fishing_license_number || fieldErrors.boat_registration_number) return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Perform manual validation on all fields
    const errors = {};
    
    // full_name
    if (!formData.full_name) {
      errors.full_name = 'Full name is required.';
    } else if (formData.full_name.trim().length < 3) {
      errors.full_name = 'Full name must be at least 3 characters.';
    } else if (!/^[A-Za-z\s]+$/.test(formData.full_name)) {
      errors.full_name = 'Full name can only contain letters and spaces.';
    }

    // email
    if (!formData.email) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address.';
    }

    // phone
    if (!formData.phone) {
      errors.phone = 'Phone number is required.';
    } else if (!/^[6-9][0-9]{9}$/.test(formData.phone)) {
      errors.phone = 'Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.';
    }

    // password
    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    } else if (!/[A-Za-z]/.test(formData.password) || !/\d/.test(formData.password) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(formData.password)) {
      errors.password = 'Password must contain letters, digits, and special characters.';
    }

    // confirmPassword
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    // address
    if (!formData.address) {
      errors.address = 'Address is required.';
    } else if (formData.address.trim().length < 5) {
      errors.address = 'Address must be at least 5 characters.';
    } else if (!/^[A-Za-z0-9\s]+$/.test(formData.address)) {
      errors.address = 'Address can only contain letters, digits, and spaces.';
    }

    // district
    if (!formData.district) {
      errors.district = 'District is required.';
    } else if (!/^[A-Za-z0-9\s]+$/.test(formData.district)) {
      errors.district = 'District can only contain letters, digits, and spaces.';
    }

    // state
    if (!formData.state) {
      errors.state = 'State is required.';
    } else if (!/^[A-Za-z0-9\s]+$/.test(formData.state)) {
      errors.state = 'State can only contain letters, digits, and spaces.';
    }

    // dynamic fields
    if (formData.role === 'NGO') {
      if (!formData.organization_name) {
        errors.organization_name = 'Organization name is required.';
      } else if (formData.organization_name.trim().length < 3) {
        errors.organization_name = 'Organization name must be at least 3 characters.';
      } else if (!/^[A-Za-z0-9\s]+$/.test(formData.organization_name)) {
        errors.organization_name = 'Organization name can only contain letters, digits, and spaces.';
      }
      
      if (!formData.registration_number) {
        errors.registration_number = 'Registration number is required.';
      } else if (formData.registration_number.trim().length < 5) {
        errors.registration_number = 'Registration number must be at least 5 characters.';
      } else if (!/^[A-Za-z0-9]+$/.test(formData.registration_number)) {
        errors.registration_number = 'Registration number can only contain letters and digits.';
      }
      
      if (!formData.organization_address) {
        errors.organization_address = 'Organization address is required.';
      } else if (formData.organization_address.trim().length < 10) {
        errors.organization_address = 'Organization address must be at least 10 characters.';
      } else if (!/^[A-Za-z0-9\s]+$/.test(formData.organization_address)) {
        errors.organization_address = 'Organization address can only contain letters, digits, and spaces.';
      }
      
      if (!files.registration_certificate) {
        errors.registration_certificate = 'Registration certificate is required.';
      }
    } else if (formData.role === 'Researcher') {
      if (!formData.institution_name) {
        errors.institution_name = 'Institution name is required.';
      } else if (formData.institution_name.trim().length < 3) {
        errors.institution_name = 'Institution name must be at least 3 characters.';
      } else if (!/^[A-Za-z0-9\s]+$/.test(formData.institution_name)) {
        errors.institution_name = 'Institution name can only contain letters, digits, and spaces.';
      }
      
      if (!formData.department) {
        errors.department = 'Department is required.';
      } else if (formData.department.trim().length < 2) {
        errors.department = 'Department must be at least 2 characters.';
      } else if (!/^[A-Za-z0-9\s]+$/.test(formData.department)) {
        errors.department = 'Department name can only contain letters, digits, and spaces.';
      }
      
      if (!formData.research_area) {
        errors.research_area = 'Research area is required.';
      } else if (formData.research_area.trim().length < 5) {
        errors.research_area = 'Research area must be at least 5 characters.';
      } else if (!/^[A-Za-z0-9\s]+$/.test(formData.research_area)) {
        errors.research_area = 'Research area can only contain letters, digits, and spaces.';
      }
      
      if (!files.institution_id) {
        errors.institution_id = 'Institution ID card is required.';
      }
    } else if (formData.role === 'Volunteer') {
      if (!formData.government_id_number) {
        errors.government_id_number = 'Government ID number is required.';
      } else if (formData.government_id_type === 'Aadhaar') {
        if (!/^[0-9]{12}$/.test(formData.government_id_number)) {
          errors.government_id_number = 'Aadhaar number must be exactly 12 digits.';
        }
      } else if (formData.government_id_number.trim().length < 5) {
        errors.government_id_number = 'ID number must be at least 5 characters.';
      } else if (!/^[A-Za-z0-9]+$/.test(formData.government_id_number)) {
        errors.government_id_number = 'Government ID number can only contain letters and digits.';
      }
      
      if (!files.government_id) {
        errors.government_id = 'Government ID document is required.';
      }
    } else if (formData.role === 'Fisherman') {
      if (!formData.fishing_license_number) {
        errors.fishing_license_number = 'Fishing license number is required.';
      } else if (formData.fishing_license_number.trim().length < 5) {
        errors.fishing_license_number = 'Fishing license number must be at least 5 characters.';
      } else if (!/^[A-Za-z0-9]+$/.test(formData.fishing_license_number)) {
        errors.fishing_license_number = 'Fishing license number can only contain letters and digits.';
      }
      
      if (!formData.boat_registration_number) {
        errors.boat_registration_number = 'Boat registration number is required.';
      } else if (formData.boat_registration_number.trim().length < 5) {
        errors.boat_registration_number = 'Boat registration number must be at least 5 characters.';
      } else if (!/^[A-Za-z0-9]+$/.test(formData.boat_registration_number)) {
        errors.boat_registration_number = 'Boat registration number can only contain letters and digits.';
      }
    }

    // Check for any field errors
    const mergedErrors = { ...fieldErrors, ...errors };
    Object.keys(mergedErrors).forEach(key => {
      if (!mergedErrors[key]) delete mergedErrors[key];
    });

    if (Object.keys(mergedErrors).length > 0) {
      setFieldErrors(mergedErrors);
      setError('Please correct the validation errors in the form.');
      // Scroll to the first field error if possible
      const firstErrorKey = Object.keys(mergedErrors)[0];
      const errorElement = document.getElementsByName(firstErrorKey)[0];
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('full_name', formData.full_name);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('password', formData.password);
    data.append('role', formData.role);
    data.append('address', formData.address);
    data.append('district', formData.district);
    data.append('state', formData.state);

    if (formData.role === 'NGO') {
      data.append('organization_name', formData.organization_name);
      data.append('registration_number', formData.registration_number);
      data.append('organization_address', formData.organization_address);
      data.append('registration_certificate', files.registration_certificate);
    } else if (formData.role === 'Researcher') {
      data.append('institution_name', formData.institution_name);
      data.append('department', formData.department);
      data.append('research_area', formData.research_area);
      data.append('institution_id', files.institution_id);
    } else if (formData.role === 'Volunteer') {
      data.append('government_id_type', formData.government_id_type);
      data.append('government_id_number', formData.government_id_number);
      data.append('government_id', files.government_id);
    } else if (formData.role === 'Fisherman') {
      if (formData.fishing_license_number) {
        data.append('fishing_license_number', formData.fishing_license_number);
      }
      if (formData.boat_registration_number) {
        data.append('boat_registration_number', formData.boat_registration_number);
      }
    }

    try {
      const response = await register(data);
      if (response.status === 'Pending') {
        setSuccessMessage('Your registration has been submitted successfully and is awaiting administrator approval.');
      } else {
        setSuccessMessage('Your account has been created successfully! You can now log in to the platform.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Check inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className="auth-container" style={{ 
        minHeight: '100vh', 
        width: '100vw',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '24px',
        background: 'radial-gradient(circle at 50% 40%, #071e3d 0%, #020b18 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="auth-card glass-panel" style={{ 
          maxWidth: '550px', 
          width: '100%', 
          textAlign: 'center', 
          padding: '44px 36px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(8, 24, 48, 0.95) 0%, rgba(4, 15, 32, 0.98) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Soft Blended Octopus Image */}
          <img 
            src="/images/cute_octopus_marine.png" 
            alt="Marine Octopus Background" 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '320px',
              height: 'auto',
              opacity: 0.16,
              pointerEvents: 'none',
              zIndex: 0
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
              ✅
            </div>
            <h2 style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 800, 
              marginBottom: '16px', 
              color: '#ffffff', 
              fontSize: '1.6rem' 
            }}>
              Account Created Successfully
            </h2>
            <p style={{ 
              color: '#94a3b8', 
              lineHeight: '1.6', 
              marginBottom: '28px',
              fontSize: '0.95rem'
            }}>
              {successMessage}
            </p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 32px', fontWeight: 700 }}>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container" style={{ 
      minHeight: '100vh', 
      width: '100vw',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '24px',
      background: 'radial-gradient(circle at 50% 40%, #071e3d 0%, #020b18 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="auth-card glass-panel" style={{ 
        maxWidth: '720px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        border: '1px solid rgba(0, 229, 255, 0.25)',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(8, 24, 48, 0.95) 0%, rgba(4, 15, 32, 0.98) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'relative',
        zIndex: 2,
        margin: 'auto',
        padding: '42px 40px'
      }}>
        {/* Soft Blended Octopus Image inside Register Box (Matches Reference) */}
        <img 
          src="/images/cute_octopus_marine.png" 
          alt="Marine Octopus Background" 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '380px',
            height: 'auto',
            opacity: 0.16,
            pointerEvents: 'none',
            zIndex: 0,
            filter: 'brightness(0.95) contrast(1.1)'
          }}
        />

        {/* Content Wrapper */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="auth-logo" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>
            <img 
              src="/images/whale_logo_icon.png" 
              alt="TerraMarine Logo" 
              style={{ width: '56px', height: '56px', objectFit: 'contain', background: 'transparent', filter: 'drop-shadow(0 0 14px rgba(0, 229, 255, 0.7))', marginBottom: '4px' }} 
            />
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              TerraMarine
            </h1>
          </div>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontWeight: 800, 
            textAlign: 'center', 
            marginBottom: '24px', 
            fontSize: '1.5rem',
            color: '#ffffff'
          }}>
            Create Account
          </h2>

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
            {/* General Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Full Name *</label>
              <input 
                type="text" 
                name="full_name" 
                className="form-control" 
                placeholder="John Doe" 
                value={formData.full_name}
                onChange={handleChange}
                required
                style={{ fontSize: '0.9rem', borderColor: fieldErrors.full_name ? 'var(--danger)' : '' }}
              />
              {fieldErrors.full_name && (
                <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                  {fieldErrors.full_name}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Email Address *</label>
              <input 
                type="email" 
                name="email" 
                className="form-control" 
                placeholder="john@example.com" 
                value={formData.email}
                onChange={handleChange}
                required
                style={{ fontSize: '0.9rem', borderColor: fieldErrors.email ? 'var(--danger)' : '' }}
              />
              {fieldErrors.email && (
                <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                  {fieldErrors.email}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Phone Number *</label>
              <input 
                type="text" 
                name="phone" 
                className="form-control" 
                placeholder="e.g. 9876543210" 
                value={formData.phone}
                onChange={handleChange}
                required
                style={{ fontSize: '0.9rem', borderColor: fieldErrors.phone ? 'var(--danger)' : '' }}
              />
              {fieldErrors.phone && (
                <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                  {fieldErrors.phone}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Role *</label>
              <select 
                name="role" 
                className="form-control" 
                value={formData.role}
                onChange={handleChange}
                required
                style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}
              >
                <option value="Citizen" style={{ backgroundColor: '#0a1930', color: '#ffffff' }}>Citizen</option>
                <option value="Fisherman" style={{ backgroundColor: '#0a1930', color: '#ffffff' }}>Fisherman</option>
                <option value="Volunteer" style={{ backgroundColor: '#0a1930', color: '#ffffff' }}>Volunteer</option>
                <option value="NGO" style={{ backgroundColor: '#0a1930', color: '#ffffff' }}>NGO</option>
                <option value="Researcher" style={{ backgroundColor: '#0a1930', color: '#ffffff' }}>Researcher</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Password *</label>
              <input 
                type="password" 
                name="password" 
                className="form-control" 
                placeholder="Min 6 characters" 
                value={formData.password}
                onChange={handleChange}
                required
                style={{ fontSize: '0.9rem', borderColor: fieldErrors.password ? 'var(--danger)' : '' }}
              />
              {fieldErrors.password && (
                <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Confirm Password *</label>
              <input 
                type="password" 
                name="confirmPassword" 
                className="form-control" 
                placeholder="Confirm password" 
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={{ fontSize: '0.9rem', borderColor: fieldErrors.confirmPassword ? 'var(--danger)' : '' }}
              />
              {fieldErrors.confirmPassword && (
                <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Address *</label>
            <textarea 
              name="address" 
              className="form-control" 
              placeholder="Enter your address" 
              rows="2"
              value={formData.address}
              onChange={handleChange}
              required
              style={{ fontSize: '0.9rem', borderColor: fieldErrors.address ? 'var(--danger)' : '' }}
            />
            {fieldErrors.address && (
              <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                {fieldErrors.address}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>District *</label>
              <input 
                type="text" 
                name="district" 
                className="form-control" 
                placeholder="e.g. Ernakulam" 
                value={formData.district}
                onChange={handleChange}
                required
                style={{ fontSize: '0.9rem', borderColor: fieldErrors.district ? 'var(--danger)' : '' }}
              />
              {fieldErrors.district && (
                <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                  {fieldErrors.district}
                </span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>State *</label>
              <input 
                type="text" 
                name="state" 
                className="form-control" 
                placeholder="e.g. Kerala" 
                value={formData.state}
                onChange={handleChange}
                required
                style={{ fontSize: '0.9rem', borderColor: fieldErrors.state ? 'var(--danger)' : '' }}
              />
              {fieldErrors.state && (
                <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                  {fieldErrors.state}
                </span>
              )}
            </div>
          </div>

          {/* DYNAMIC FIELD SECTIONS BY ROLE */}

          {/* NGO FIELDS */}
          {formData.role === 'NGO' && (
            <div style={{ 
              border: '1px dashed var(--accent-primary)', 
              borderRadius: '12px', 
              padding: '20px', 
              background: 'rgba(23, 28, 66, 0.02)',
              marginBottom: '24px' 
            }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '16px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                NGO Verification Details
              </h3>
              
              <div className="form-group">
                <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Organization Name *</label>
                <input 
                  type="text" 
                  name="organization_name" 
                  className="form-control" 
                  placeholder="e.g. Eco Waves Foundation" 
                  value={formData.organization_name}
                  onChange={handleChange}
                  required
                  style={{ fontSize: '0.9rem', borderColor: fieldErrors.organization_name ? 'var(--danger)' : '' }}
                />
                {fieldErrors.organization_name && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                    {fieldErrors.organization_name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Registration Number *</label>
                <input 
                  type="text" 
                  name="registration_number" 
                  className="form-control" 
                  placeholder="e.g. NGO-IND-998822" 
                  value={formData.registration_number}
                  onChange={handleChange}
                  required
                  style={{ fontSize: '0.9rem', borderColor: fieldErrors.registration_number ? 'var(--danger)' : '' }}
                />
                {fieldErrors.registration_number && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                    {fieldErrors.registration_number}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Organization Address *</label>
                <textarea 
                  name="organization_address" 
                  className="form-control" 
                  placeholder="Enter organization headquarters address" 
                  rows="2"
                  value={formData.organization_address}
                  onChange={handleChange}
                  required
                  style={{ fontSize: '0.9rem', borderColor: fieldErrors.organization_address ? 'var(--danger)' : '' }}
                />
                {fieldErrors.organization_address && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                    {fieldErrors.organization_address}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Registration Certificate (PDF/JPG/PNG) *</label>
                <input 
                  type="file" 
                  name="registration_certificate"
                  className="form-control"
                  accept=".pdf, .jpg, .jpeg, .png"
                  onChange={handleFileChange}
                  required
                  style={{ fontSize: '0.9rem', borderColor: fieldErrors.registration_certificate ? 'var(--danger)' : '' }}
                />
                {fieldErrors.registration_certificate && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                    {fieldErrors.registration_certificate}
                  </span>
                )}
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px', fontFamily: 'var(--font-body)', fontSize: '0.75rem' }}>
                  Max size: 5MB. Formats: PDF, JPG, JPEG, PNG
                </small>
              </div>
            </div>
          )}

          {/* RESEARCHER FIELDS */}
          {formData.role === 'Researcher' && (
            <div style={{ 
              border: '1px dashed var(--accent-secondary)', 
              borderRadius: '12px', 
              padding: '20px', 
              background: 'rgba(23, 28, 66, 0.02)',
              marginBottom: '24px' 
            }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--accent-secondary)', marginBottom: '16px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                Researcher Academic Details
              </h3>

              <div className="form-group">
                <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Institution Name *</label>
                <input 
                  type="text" 
                  name="institution_name" 
                  className="form-control" 
                  placeholder="e.g. Cochin University of Science and Technology" 
                  value={formData.institution_name}
                  onChange={handleChange}
                  required
                  style={{ fontSize: '0.9rem', borderColor: fieldErrors.institution_name ? 'var(--danger)' : '' }}
                />
                {fieldErrors.institution_name && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                    {fieldErrors.institution_name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Department *</label>
                <input 
                  type="text" 
                  name="department" 
                  className="form-control" 
                  placeholder="e.g. Department of Marine Biology" 
                  value={formData.department}
                  onChange={handleChange}
                  required
                  style={{ fontSize: '0.9rem', borderColor: fieldErrors.department ? 'var(--danger)' : '' }}
                />
                {fieldErrors.department && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                    {fieldErrors.department}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Research Area *</label>
                <input 
                  type="text" 
                  name="research_area" 
                  className="form-control" 
                  placeholder="e.g. Microplastics Bio-accumulation" 
                  value={formData.research_area}
                  onChange={handleChange}
                  required
                  style={{ fontSize: '0.9rem', borderColor: fieldErrors.research_area ? 'var(--danger)' : '' }}
                />
                {fieldErrors.research_area && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                    {fieldErrors.research_area}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Institution ID Upload (PDF/JPG/PNG) *</label>
                <input 
                  type="file" 
                  name="institution_id"
                  className="form-control"
                  accept=".pdf, .jpg, .jpeg, .png"
                  onChange={handleFileChange}
                  required
                  style={{ fontSize: '0.9rem', borderColor: fieldErrors.institution_id ? 'var(--danger)' : '' }}
                />
                {fieldErrors.institution_id && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                    {fieldErrors.institution_id}
                  </span>
                )}
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px', fontFamily: 'var(--font-body)', fontSize: '0.75rem' }}>
                  Max size: 5MB. Formats: PDF, JPG, JPEG, PNG
                </small>
              </div>
            </div>
          )}

          {/* VOLUNTEER FIELDS */}
          {formData.role === 'Volunteer' && (
            <div style={{ 
              border: '1px dashed #d946ef', 
              borderRadius: '12px', 
              padding: '20px', 
              background: 'rgba(23, 28, 66, 0.02)',
              marginBottom: '24px' 
            }}>
              <h3 style={{ fontSize: '1rem', color: '#d946ef', marginBottom: '16px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                Volunteer Verification Details
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Government ID Type *</label>
                  <select 
                    name="government_id_type" 
                    className="form-control" 
                    value={formData.government_id_type}
                    onChange={handleChange}
                    required
                    style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}
                  >
                    <option value="Aadhaar" style={{ backgroundColor: '#0a1930', color: '#ffffff' }}>Aadhaar</option>
                    <option value="Driving License" style={{ backgroundColor: '#0a1930', color: '#ffffff' }}>Driving License</option>
                    <option value="Passport" style={{ backgroundColor: '#0a1930', color: '#ffffff' }}>Passport</option>
                    <option value="Voter ID" style={{ backgroundColor: '#0a1930', color: '#ffffff' }}>Voter ID</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Government ID Number *</label>
                  <input 
                    type="text" 
                    name="government_id_number" 
                    className="form-control" 
                    placeholder="Enter ID number" 
                    value={formData.government_id_number}
                    onChange={handleChange}
                    required
                    style={{ fontSize: '0.9rem', borderColor: fieldErrors.government_id_number ? 'var(--danger)' : '' }}
                  />
                  {fieldErrors.government_id_number && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                      {fieldErrors.government_id_number}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Government ID Document Upload (PDF/JPG/PNG) *</label>
                <input 
                  type="file" 
                  name="government_id"
                  className="form-control"
                  accept=".pdf, .jpg, .jpeg, .png"
                  onChange={handleFileChange}
                  required
                  style={{ fontSize: '0.9rem', borderColor: fieldErrors.government_id ? 'var(--danger)' : '' }}
                />
                {fieldErrors.government_id && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                    {fieldErrors.government_id}
                  </span>
                )}
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px', fontFamily: 'var(--font-body)', fontSize: '0.75rem' }}>
                  Max size: 5MB. Formats: PDF, JPG, JPEG, PNG
                </small>
              </div>
            </div>
          )}

          {/* FISHERMAN FIELDS */}
          {formData.role === 'Fisherman' && (
            <div style={{ 
              border: '1px dashed var(--warning)', 
              borderRadius: '12px', 
              padding: '20px', 
              background: 'rgba(23, 28, 66, 0.02)',
              marginBottom: '24px' 
            }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--warning)', marginBottom: '16px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                Fisherman Verification Details
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Fishing License Number *</label>
                  <input 
                    type="text" 
                    name="fishing_license_number" 
                    className="form-control" 
                    placeholder="e.g. LIC-12345" 
                    value={formData.fishing_license_number}
                    onChange={handleChange}
                    required
                    style={{ fontSize: '0.9rem', borderColor: fieldErrors.fishing_license_number ? 'var(--danger)' : '' }}
                  />
                  {fieldErrors.fishing_license_number && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                      {fieldErrors.fishing_license_number}
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>Boat Registration Number *</label>
                  <input 
                    type="text" 
                    name="boat_registration_number" 
                    className="form-control" 
                    placeholder="e.g. BOAT-9988" 
                    value={formData.boat_registration_number}
                    onChange={handleChange}
                    required
                    style={{ fontSize: '0.9rem', borderColor: fieldErrors.boat_registration_number ? 'var(--danger)' : '' }}
                  />
                  {fieldErrors.boat_registration_number && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontFamily: 'var(--font-body)' }}>
                      {fieldErrors.boat_registration_number}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginTop: '20px', fontSize: '0.95rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

          <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.88rem', color: '#94a3b8' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#00e5ff', textDecoration: 'underline', fontWeight: 600 }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
