import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../css/SkStyles.css'; // Using our centralized CSS
import bgImage from '../images/background.png';
import skLogo from '../images/profile.png';
import { AuthContext } from '../../Contexts/AuthContext';
import { FaInfoCircle, FaCalendarAlt, FaIdCard, FaUsers } from 'react-icons/fa';

const SkSignup = () => {
  const { skUser, skRegister, pendingVerification } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (skUser) {
      navigate('/sk-welcome');
    }
    
    // Redirect to verification page if there's a pending verification
    if (pendingVerification.waiting && pendingVerification.type === 'sk') {
      navigate('/sk-verify-email', { state: { email: pendingVerification.email } });
    }
  }, [skUser, pendingVerification, navigate]);
  
  // Initialize form data with fields matching the updated skaccounts table schema
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'male',
    birthdate: '',
    age: '',
    email: '',
    phone_number: '',
    house_number: '',
    street: '',
    subdivision: '',
    city: 'Pasig',
    province: 'Metro Manila',
    sk_station: 'Dela Paz',
    sk_role: 'Kagawad',
    term_start: '',
    term_end: '',
    terms_served: 1,
    password: '',
    password_confirmation: '',
    valid_id: null
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Barangay options
  const barangayOptions = [
    'Dela Paz',
    'Manggahan',
    'Maybunga',
    'Pinagbuhatan',
    'Rosario',
    'San Miguel',
    'Santa Lucia',
    'Santolan'
  ];

  // SK role options
  const roleOptions = [
    'Federasyon', 
    'Chairman', 
    'Kagawad'
  ];

  // Calculate age when birthdate changes
  useEffect(() => {
    if (formData.birthdate) {
      const birthDate = new Date(formData.birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // If birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setFormData(prev => ({ ...prev, age: age }));
    }
  }, [formData.birthdate]);

  // Set default term dates
  useEffect(() => {
    if (!formData.term_start || !formData.term_end) {
      const today = new Date();
      const termStartDate = new Date(today);
      const termEndDate = new Date(today);
      termEndDate.setFullYear(termEndDate.getFullYear() + 3);
      
      // Format dates as YYYY-MM-DD
      const formatDate = (date) => {
        return date.toISOString().split('T')[0];
      };
      
      setFormData(prev => ({
        ...prev,
        term_start: formatDate(termStartDate),
        term_end: formatDate(termEndDate)
      }));
    }
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Create form data for file upload
      const submitData = new FormData();
      
      // Add all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (key === 'valid_id' && formData[key]) {
          submitData.append(key, formData[key]);
        } else if (key !== 'valid_id') {
          submitData.append(key, formData[key]);
        }
      });
      
      // Ensure password_confirmation is explicitly appended
      submitData.append('password_confirmation', formData.password_confirmation);
      
      // Use skRegister function from AuthContext
      const { success, errors, needsVerification } = await skRegister(submitData);
      
      if (success) {
        if (needsVerification) {
          // Navigate to verification page
          navigate('/sk-verify-email', { state: { email: formData.email } });
        } else {
          // Navigate to login on successful registration
          navigate('/sk-login');
        }
      } else {
        // Show error messages
        if (errors) {
          const errorMessages = [];
          for (const field in errors) {
            if (Array.isArray(errors[field])) {
              errorMessages.push(errors[field][0]);
            } else {
              errorMessages.push(`${field}: ${errors[field]}`);
            }
          }
          setError(errorMessages.join(', '));
        } else {
          setError('Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again later.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // If already logged in, don't render the form (will redirect via useEffect)
  if (skUser) {
    return <div className="sk-cmn-sklcss-loading">Redirecting...</div>;
  }

  // Render field hint
  const FieldHint = ({ message }) => (
    <small className="text-muted d-block mt-1">
      <FaInfoCircle className="me-1" /> {message}
    </small>
  );

  return (
    <div className="sk-cmn-sklcss-container">      
      <div className="sk-cmn-sklcss-content">
        <img src={bgImage} alt="Background" className="sk-cmn-sklcss-background" />
        
        <div className="sk-cmn-sklcss-card sk-cmn-sklcss-card-wide">
          <div className="sk-cmn-sklcss-card-header">
            <img src={skLogo} alt="SK Logo" className="sk-cmn-sklcss-profile-icon" />
            <h2>Sangguniang Kabataan Registration</h2>
          </div>
          
          <div className="sk-cmn-sklcss-card-body">
            <form className="sk-cmn-sklcss-form" onSubmit={handleSubmit}>
              <h4 className="mb-3">Personal Information</h4>
              
              {/* Name Fields */}
              <div className="sk-cmn-sklcss-form-row">
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    className="sk-cmn-sklcss-input"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <FieldHint message="Your given name" />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="text"
                    name="middle_name"
                    placeholder="Middle Name (optional)"
                    className="sk-cmn-sklcss-input"
                    value={formData.middle_name}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <FieldHint message="Your middle name if applicable" />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    className="sk-cmn-sklcss-input"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <FieldHint message="Your family name" />
                </div>
              </div>

              {/* Birthdate, Age, Gender */}
              <div className="sk-cmn-sklcss-form-row">
                <div className="sk-cmn-sklcss-form-group">
                  <label htmlFor="birthdate">Birth Date <span style={{color:'red'}}>*</span></label>
                  <input
                    type="date"
                    id="birthdate"
                    name="birthdate"
                    className="sk-cmn-sklcss-input"
                    value={formData.birthdate}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <FieldHint message="Must be 15-24 years old to be eligible" />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <label htmlFor="age">Age</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    placeholder="Age (auto-calculated)"
                    className="sk-cmn-sklcss-input"
                    value={formData.age}
                    readOnly
                    disabled={isLoading}
                    required
                  />
                  <FieldHint message="Automatically calculated from birth date" />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <label htmlFor="gender">Gender <span style={{color:'red'}}>*</span></label>
                  <select
                    id="gender"
                    name="gender"
                    className="sk-cmn-sklcss-select"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              
              <h4 className="mb-3 mt-4">Contact Information</h4>

              {/* Email and Phone */}
              <div className="sk-cmn-sklcss-form-row">
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    className="sk-cmn-sklcss-input"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <FieldHint message="You'll use this to log in and receive notifications" />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="text"
                    name="phone_number"
                    placeholder="Phone Number"
                    className="sk-cmn-sklcss-input"
                    value={formData.phone_number}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <FieldHint message="Your active contact number" />
                </div>
              </div>
              
              <h4 className="mb-3 mt-4">Address Information</h4>

              {/* Address Fields */}
              <div className="sk-cmn-sklcss-form-row">
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="text"
                    name="house_number"
                    placeholder="House/Building No."
                    className="sk-cmn-sklcss-input"
                    value={formData.house_number}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <FieldHint message="Your house or building number" />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="text"
                    name="street"
                    placeholder="Street Name"
                    className="sk-cmn-sklcss-input"
                    value={formData.street}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <FieldHint message="The street where you reside" />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="text"
                    name="subdivision"
                    placeholder="Subdivision/Village (optional)"
                    className="sk-cmn-sklcss-input"
                    value={formData.subdivision}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <FieldHint message="If applicable" />
                </div>
              </div>
              
              <div className="sk-cmn-sklcss-form-row">
                <div className="sk-cmn-sklcss-form-group">
                  <select
                    name="sk_station"
                    className="sk-cmn-sklcss-select"
                    value={formData.sk_station}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  >
                    {barangayOptions.map(barangay => (
                      <option key={barangay} value={barangay}>{barangay}</option>
                    ))}
                  </select>
                  <FieldHint message="Your barangay - required for SK designation" />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    className="sk-cmn-sklcss-input"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <FieldHint message="Default: Pasig City" />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="text"
                    name="province"
                    placeholder="Province"
                    className="sk-cmn-sklcss-input"
                    value={formData.province}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <FieldHint message="Default: Metro Manila" />
                </div>
              </div>

              <h4 className="mb-3 mt-4">SK Information</h4>

              {/* SK Role and Term */}
              <div className="sk-cmn-sklcss-form-row">
                <div className="sk-cmn-sklcss-form-group">
                  <label htmlFor="sk_role" className="d-flex align-items-center">
                    SK Role <span style={{color:'red'}}>*</span>
                    <button 
                      type="button" 
                      className="btn btn-link p-0 ms-2"
                      onClick={() => setShowHelp(!showHelp)}
                      title="Show role information"
                    >
                      <FaInfoCircle />
                    </button>
                  </label>
                  <select
                    id="sk_role"
                    name="sk_role"
                    className="sk-cmn-sklcss-select"
                    value={formData.sk_role}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  >
                    {roleOptions.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  {showHelp && (
                    <div className="mt-2 p-2 border rounded bg-light">
                      <div><strong>Federasyon:</strong> Overall SK head for the city</div>
                      <div><strong>Chairman:</strong> SK head for a specific barangay</div>
                      <div><strong>Kagawad:</strong> SK council member in a barangay</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Term Information */}
              <div className="sk-cmn-sklcss-form-row">
                <div className="sk-cmn-sklcss-form-group">
                  <label htmlFor="term_start" className="d-flex align-items-center">
                    <FaCalendarAlt className="me-1" /> Term Start Date <span style={{color:'red'}}>*</span>
                  </label>
                  <input
                    type="date"
                    id="term_start"
                    name="term_start"
                    className="sk-cmn-sklcss-input"
                    value={formData.term_start}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <FieldHint message="When your SK term officially begins" />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <label htmlFor="term_end" className="d-flex align-items-center">
                    <FaCalendarAlt className="me-1" /> Term End Date <span style={{color:'red'}}>*</span>
                  </label>
                  <input
                    type="date"
                    id="term_end"
                    name="term_end"
                    className="sk-cmn-sklcss-input"
                    value={formData.term_end}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <FieldHint message="Maximum term length is 3 years" />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <label htmlFor="terms_served" className="d-flex align-items-center">
                    <FaUsers className="me-1" /> Terms Served <span style={{color:'red'}}>*</span>
                  </label>
                  <select
                    id="terms_served"
                    name="terms_served"
                    className="sk-cmn-sklcss-select"
                    value={formData.terms_served}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  >
                    <option value="1">First Term</option>
                    <option value="2">Second Term</option>
                    <option value="3">Third Term</option>
                  </select>
                  <FieldHint message="Maximum of 3 consecutive terms allowed" />
                </div>
              </div>

              <h4 className="mb-3 mt-4">Account Security</h4>

              {/* Password */}
              <div className="sk-cmn-sklcss-form-row">
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="sk-cmn-sklcss-input"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <FieldHint message="At least 8 characters with letters and numbers" />
                </div>
                <div className="sk-cmn-sklcss-form-group">
                  <input
                    type="password"
                    name="password_confirmation"
                    placeholder="Confirm Password"
                    className="sk-cmn-sklcss-input"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <FieldHint message="Re-enter your password to confirm" />
                </div>
              </div>

              {/* Valid ID Upload */}
              <div className="sk-cmn-sklcss-form-row">
                <div className="sk-cmn-sklcss-form-group">
                  <label htmlFor="valid_id" className="d-flex align-items-center">
                    <FaIdCard className="me-1" /> Upload Oath Document <span style={{color:'red'}}>*</span>
                  </label>
                  <input
                    type="file"
                    id="valid_id"
                    name="valid_id"
                    className="sk-cmn-sklcss-input sk-cmn-sklcss-file-input"
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  <FieldHint message="Upload your SK oath or appointment document (PDF, JPG, PNG formats, max 2MB)" />
                </div>
              </div>

              {/* Error and Submit Button */}
              {error && (
                <div className="sk-cmn-sklcss-alert sk-cmn-sklcss-alert-danger">
                  {error}
                </div>
              )}
              
              <button 
                type="submit" 
                className="sk-cmn-sklcss-button sk-cmn-sklcss-button-primary sk-cmn-sklcss-button-full"
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </form>

            <p className="sk-cmn-sklcss-text-center sk-cmn-sklcss-mt-3">
              Have an account already?
              <NavLink to="/sk-login" className="sk-cmn-sklcss-link"> Login here</NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkSignup;