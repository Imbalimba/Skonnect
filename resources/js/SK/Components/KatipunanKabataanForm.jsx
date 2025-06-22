import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import Notification from './Notification'; 
import '../css/KatipunanKabataanForm.css';
import { AuthContext } from '../../Contexts/AuthContext';

const KatipunanKabataanForm = ({ onClose }) => {
  const { skUser } = useContext(AuthContext);
  const isFederationAdmin = skUser?.sk_role === 'Federasyon';
  
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    address: '',
    barangay: '', // This will be set in useEffect based on user role
    gender: '',
    birthdate: '',
    phone_number: '',
    email: '',
    civil_status: '',
    youth_classification: '',
    youth_age_group: '',
    educational_background: '',
    work_status: '',
    sk_voter: '',
    national_voter: '',
    kk_assembly_attendance: '',
    did_vote_last_election: '',
    kk_assembly_attendance_times: 'N/A',
    reason_for_not_attending: 'N/A',
    soloparent: '',                  
    num_of_children: '',
    pwd: '',
    pwd_years: '',
    athlete: '',
    sport_name: '',
    scholar: '',
    pasigscholar: '',
    scholarship_name: '',
    studying_level: '',
    yearlevel: '',
    school_name: '',
    working_status: '',
    company_name: '',
    position_name: '',
    licensed_professional: '',
    employment_yrs: '',
    monthly_income: '',
    youth_org: '',
    org_name: '',
    org_position: '',
    lgbtqia_member: '',
    osyranking: ''
  });
  
  // Set the initial barangay value based on user role
  useEffect(() => {
    // If user is a regular SK user (not federation admin), lock the barangay to their assigned barangay
    if (skUser && !isFederationAdmin) {
      setFormData(prev => ({
        ...prev,
        barangay: skUser.sk_station
      }));
    }
  }, [skUser, isFederationAdmin]);
  
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [birthdateError, setBirthdateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null); 

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Calculate minimum and maximum birthdate based on eligible age range (15-30)
  const calculateMinMaxDates = () => {
    const today = new Date();
    
    // Max date: Youth must be at least 15 years old
    // So maximum birthdate is today minus 15 years
    const maxDate = new Date(today);
    maxDate.setFullYear(today.getFullYear() - 15);
    
    // Min date: Youth must be at most 30 years old
    // So minimum birthdate is today minus 30 years
    const minDate = new Date(today);
    minDate.setFullYear(today.getFullYear() - 30);
    
    return {
      minDate: minDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      maxDate: maxDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
    };
  };
  
  const { minDate, maxDate } = calculateMinMaxDates();

  // Function to calculate age based on birthdate
  const calculateAge = (birthdate) => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
  };

  // Function to determine the youth age group based on age
  const determineYouthAgeGroup = (age) => {
    if (age >= 15 && age <= 17) {
        return 'Child Youth(15-17 yrs old)';
    } else if (age >= 18 && age <= 24) {
        return 'Core Youth(18-24 yrs old)';
    } else if (age >= 25 && age <= 30) {
        return 'Young Adult(25-30 yrs old)';
    } else {
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Skip changes to barangay field if user is not federation admin
    if (name === 'barangay' && !isFederationAdmin) {
      return;
    }
  
    // Phone number validation for exact digits
    if (name === 'phone_number') {
      const isValidPhoneNumber = /^[0-9]{0,11}$/.test(value);
      if (!isValidPhoneNumber) {
        setPhoneError('Phone number must contain only digits');
        return; // Prevent invalid phone numbers
      } else if (value.length > 0 && value.length !== 11) {
        setPhoneError('Phone number must be exactly 11 digits');
      } else {
        setPhoneError('');
      }
    }
  
    // Email validation
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }
  
    // Birthdate validation
    if (name === 'birthdate') {
      // Check if date is in the future
      const today = new Date().toISOString().split('T')[0];
      if (value > today) {
        setBirthdateError('Future dates are not allowed');
        return; // Prevent setting future dates
      }
      
      const age = calculateAge(value);
      const youthAgeGroup = determineYouthAgeGroup(age);
      
      if (age < 15 || age > 30) {
        setBirthdateError('Age must be between 15 and 30 years for youth profiling');
      } else {
        setBirthdateError('');
      }
      
      setFormData({ ...formData, [name]: value, age, youth_age_group: youthAgeGroup });
    } else if (name === 'youth_classification') {
      // Handle youth classification changes
      const newFormData = { 
        ...formData, 
        [name]: value 
      };
      
      // If youth classification is "Out of School Youth", set studying level to "Not Studying"
      if (value === 'Out of School Youth') {
        newFormData.studying_level = 'Not Studying';
        newFormData.yearlevel = '';
        newFormData.school_name = '';
      }
      
      // Additional logic for "Working Youth"
      if (value === 'Working Youth') {
        newFormData.working_status = 'Yes';
      }
      
      setFormData(newFormData);
    } else if (name === 'work_status' && (value === 'Employed' || value === 'Self Employed')) {
      // Auto-set working status when "Employed" or "Self Employed" is selected
      setFormData({ 
        ...formData, 
        [name]: value,
        working_status: 'Yes' 
      });
    } else if (name === 'kk_assembly_attendance') {
      setFormData({
        ...formData,
        [name]: value,
        reason_for_not_voting: value === 'Yes' ? 'N/A' : '',
        kk_assembly_attendance_times: value === 'No' ? 'N/A' : ''
      });
    } else if (name === 'scholar') {
      // If scholar changes to "No", clear pasig scholar and scholarship name fields
      if (value === 'No') {
        setFormData({ 
          ...formData, 
          [name]: value,
          pasigscholar: 'No',
          scholarship_name: '' 
        });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    } else if (name === 'pasigscholar') {
      // If pasig scholar changes to "Yes", clear the scholarship name
      if (value === 'Yes') {
        setFormData({ 
          ...formData, 
          [name]: value,
          scholarship_name: '' 
        });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    } else if (name === 'studying_level') {
      // If studying level changes to "Not Studying", clear year level and school name
      if (value === 'Not Studying') {
        setFormData({
          ...formData,
          [name]: value,
          yearlevel: '',
          school_name: ''
        });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleNextPage = (e) => {
    e.preventDefault();

    // Check for validation errors before proceeding to next page
    if (phoneError || emailError || birthdateError) {
      showNotification('Please fix the following errors before proceeding:\n' + 
        (phoneError ? '- ' + phoneError + '\n' : '') +
        (emailError ? '- ' + emailError + '\n' : '') +
        (birthdateError ? '- ' + birthdateError : ''),'error'
      );
      return;
    }

    // Phone number exact length check
    if (formData.phone_number && formData.phone_number.length !== 11) {
      setPhoneError('Phone number must be exactly 11 digits');
      return;
    }
    
    window.scrollTo(0, 0);
    setCurrentPage(2);
  };

  const handlePrevPage = () => {
    window.scrollTo(0, 0);
    setCurrentPage(1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for validation errors
    if (phoneError || emailError || birthdateError) {
      alert('Please fix the following errors before submitting:\n' + 
        (phoneError ? '- ' + phoneError + '\n' : '') +
        (emailError ? '- ' + emailError + '\n' : '') +
        (birthdateError ? '- ' + birthdateError : ''));
      return;
    }

    if (formData.phone_number.length !== 11) {
      setPhoneError('Phone number must be exactly 11 digits');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/profiles', formData);
      showNotification('Profile successfully created!', 'success');
      setTimeout(() => onClose(), 1500); 
    } catch (error) {
      console.error('Error creating profile:', error);
      
      // Handle server-side errors 
      if (error.response && error.response.data) {
        let errorMessage = 'Error creating profile. Please try again.';
        
        if (error.response.data.errors) {
          // Format validation errors for display
          const errorList = Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n');
          
            showNotification(`Please correct these errors:\n${errorList}`, 'error');
          } else if (error.response.data.message) {
          // Check for specific errors like duplicate email or phone
          if (error.response.data.message.includes('email')) {
            errorMessage = 'This email address is already registered.';
            setEmailError(errorMessage);
            setCurrentPage(1); // Go back to first page to fix email error
          } else if (error.response.data.message.includes('phone')) {
            errorMessage = 'This phone number is already registered.';
            setPhoneError(errorMessage);
            setCurrentPage(1); // Go back to first page to fix phone error
          } else {
            errorMessage = error.response.data.message;
          }
          
          showNotification(errorMessage, 'error');
        }
      } else {
        showNotification('Error connecting to the server. Please check your internet connection.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define barangay options for the dropdown (for federation admins)
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="form-overlay">
       {/* Render the notification if it exists */}
       {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="outer-box">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2 className="form-title">Katipunan ng Kabataan</h2>
        
         {/* Form Progress Indicator */}
         <div className="form-progress">
          <div className="progress-step">
            <div className={`step-number ${currentPage === 1 ? 'active' : ''}`}>1</div>
            <div className="step-label">Basic Information</div>
          </div>
          <div className="progress-connector"></div>
          <div className="progress-step">
            <div className={`step-number ${currentPage === 2 ? 'active' : ''}`}>2</div>
            <div className="step-label">Additional Information</div>
          </div>
        </div>
        
        <div className="form-note">
          <p>Fields marked with <span className="required-field">*</span> are required.</p>
        </div>
        
        <div className="inner-box">
          {currentPage === 1 && (
            <form onSubmit={handleNextPage}>
              <div className="form-section">
                <h3 className="section-title">Basic Information</h3>
                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">First Name <span className="required-field">*</span></label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="first_name" 
                      value={formData.first_name} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  <div className="input-container">
                    <label className="input-label">Middle Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="middle_name" 
                      value={formData.middle_name} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="input-container">
                    <label className="input-label">Last Name <span className="required-field">*</span></label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="last_name" 
                      value={formData.last_name} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="input-container full-width">
                    <label className="input-label">Address <span className="required-field">*</span></label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="address" 
                      value={formData.address} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">Barangay <span className="required-field">*</span>{!isFederationAdmin && ' (Locked)'}</label>
                    {isFederationAdmin ? (
                      <select 
                        className="form-input" 
                        name="barangay" 
                        value={formData.barangay} 
                        onChange={handleChange} 
                        required
                      >
                        <option value="">Select</option>
                        {barangayOptions.map((barangay, index) => (
                          <option key={index} value={barangay}>{barangay}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        className="form-input" 
                        name="barangay" 
                        value={formData.barangay} 
                        onChange={handleChange} 
                        required 
                        disabled
                      />
                    )}
                  </div>
                  <div className="input-container">
                    <label className="input-label">Sex Assigned at Birth <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="gender" 
                      value={formData.gender} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                <div className="input-container">
                    <label className="input-label">Birthdate <span className="required-mark">*</span> (Age 15-30 only)</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      name="birthdate" 
                      value={formData.birthdate} 
                      onChange={handleChange}
                      min={minDate}
                      max={maxDate}
                      required 
                    />
                    {birthdateError && <div className="error-message">{birthdateError}</div>}
                  </div>
                  
                  <div className="input-container">
                    <label className="input-label">Age (Auto-calculated)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      name="age" 
                      value={formData.age} 
                      disabled 
                    />
                  </div>
                </div>
                
                <div className="form-group">
                <div className="input-container">
                    <label className="input-label">Phone Number <span className="required-mark">*</span></label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      name="phone_number" 
                      value={formData.phone_number} 
                      onChange={handleChange} 
                      required 
                      maxLength="11"
                      placeholder="09XXXXXXXXX"
                    />
                    {phoneError && <div className="error-message">{phoneError}</div>}
                  </div>
                  
                  <div className="input-container">
                    <label className="input-label">Email Address <span className="required-mark">*</span></label>
                    <input 
                      type="email" 
                      className="form-input" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      required 
                    />
                    {emailError && <div className="error-message">{emailError}</div>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Demographics</h3>
                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">Civil Status <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="civil_status" 
                      value={formData.civil_status} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Separated">Separated</option>
                      <option value="Annulled">Annulled</option>
                      <option value="Unknown">Unknown</option>
                      <option value="Live-in">Live-in</option>
                    </select>
                  </div>
                  
                  <div className="input-container">
                    <label className="input-label">Youth Classification <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="youth_classification" 
                      value={formData.youth_classification} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="In School Youth">In School Youth</option>
                      <option value="Out of School Youth">Out of School Youth</option>
                      <option value="Working Youth">Working Youth</option>
                      <option value="Youth with Specific Needs: Person w/ Disability">Youth with Specific Needs: Person w/ Disability</option>
                      <option value="Youth with Specific Needs: Children in Conflic w/ Law">Youth with Specific Needs: Children in Conflic w/ Law</option>
                      <option value="Youth with Specific Needs: Indigenous People">Youth with Specific Needs: Indigenous People</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">Youth Age Group (Auto-calculated)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="youth_age_group" 
                      value={formData.youth_age_group} 
                      disabled 
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">Educational Background <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="educational_background" 
                      value={formData.educational_background} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Elementary Level">Elementary Level</option>
                      <option value="Elementary Grad">Elementary Grad</option>
                      <option value="High School Level">High School Level</option>
                      <option value="High School Grad">High School Grad</option>
                      <option value="Vocational Grad">Vocational Grad</option>
                      <option value="College Level">College Level</option>
                      <option value="College Grad">College Grad</option>
                      <option value="Masters Level">Masters Level</option>
                      <option value="Masters Grad">Masters Grad</option>
                      <option value="Doctorate Level">Doctorate Level</option>
                      <option value="Doctorate Grad">Doctorate Grad</option>
                    </select>
                  </div>
                  
                  <div className="input-container">
                    <label className="input-label">Work Status <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="work_status" 
                      value={formData.work_status} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Employed">Employed</option>
                      <option value="Unemployed">Unemployed</option>
                      <option value="Self Employed">Self Employed</option>
                      <option value="Currently Looking For a Job">Currently Looking For a Job</option>
                      <option value="Not Interested Looking For a Job">Not Interested Looking For a Job</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">SK Voter <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="sk_voter" 
                      value={formData.sk_voter} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  
                  <div className="input-container">
                    <label className="input-label">National Voter <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="national_voter" 
                      value={formData.national_voter} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">Did you vote last SK election? <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="did_vote_last_election" 
                      value={formData.did_vote_last_election} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  
                  <div className="input-container">
                    <label className="input-label">KK Assembly Attendance <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="kk_assembly_attendance" 
                      value={formData.kk_assembly_attendance} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {formData.kk_assembly_attendance === 'Yes' && (
                  <div className="conditional-field">
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">How many times did you attend the assembly? <span className="required-field">*</span></label>
                        <select
                          className="form-input"
                          name="kk_assembly_attendance_times"
                          value={formData.kk_assembly_attendance_times}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select</option>
                          <option value="1-2 Times">1-2 Times</option>
                          <option value="3-4 Times">3-4 Times</option>
                          <option value="5 and above">5 and above</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {formData.kk_assembly_attendance === 'No' && (
                  <div className="conditional-field">
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">Why didn't you attend? <span className="required-field">*</span></label>
                        <select
                          className="form-input"
                          name="reason_for_not_attending"
                          value={formData.reason_for_not_attending}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select</option>
                          <option value="There was no KK Assembly Meeting">There was no KK Assembly Meeting</option>
                          <option value="Not Interested to Attend">Not Interested to Attend</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="button-container">
                <button type="submit" className="next-btn">
                  Next Page
                  <span className="btn-icon">→</span>
                </button>
              </div>
            </form>
          )}

          {currentPage === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3 className="section-title">Additional Questions</h3>
                
                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">Are you a solo parent? <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="soloparent" 
                      value={formData.soloparent} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {formData.soloparent === 'Yes' && (
                  <div className="conditional-field">
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">If yes, indicate no. of children <span className="required-field">*</span></label>
                        <input 
                          type="number" 
                          className="form-input" 
                          name="num_of_children" 
                          value={formData.num_of_children || ""} 
                          onChange={handleChange} 
                          required 
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">Are you a PWD? <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="pwd" 
                      value={formData.pwd} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {formData.pwd === 'Yes' && (
                  <div className="conditional-field">
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">If yes, for how long? Indicate no. of yrs <span className="required-field">*</span></label>
                        <input 
                          type="number" 
                          className="form-input" 
                          name="pwd_years" 
                          value={formData.pwd_years || ""} 
                          onChange={handleChange} 
                          required 
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">Are you an athlete? <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="athlete" 
                      value={formData.athlete} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {formData.athlete === 'Yes' && (
                  <div className="conditional-field">
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">If yes, indicate sports <span className="required-field">*</span></label>
                        <input 
                          type="text" 
                          className="form-input" 
                          name="sport_name" 
                          value={formData.sport_name || ""} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">Are you a scholar? <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="scholar" 
                      value={formData.scholar} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {formData.scholar === 'Yes' && (
                  <div className="conditional-field">
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">Are you a pasig scholar? <span className="required-field">*</span></label>
                        <select 
                          className="form-input" 
                          name="pasigscholar" 
                          value={formData.pasigscholar} 
                          onChange={handleChange} 
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>

                    {formData.pasigscholar === 'No' && (
                      <div className="form-group">
                        <div className="input-container">
                          <label className="input-label">If scholar other than pcs, indicate name of scholarship program <span className="required-field">*</span></label>
                          <input 
                            type="text" 
                            className="form-input" 
                            name="scholarship_name" 
                            value={formData.scholarship_name} 
                            onChange={handleChange} 
                            required 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">If currently studying, indicate level <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="studying_level" 
                      value={formData.studying_level} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Secondary">Secondary</option>
                      <option value="Tertiary">Tertiary</option>
                      <option value="Graduate Level">Graduate Level</option>
                      <option value="Not Studying">Not Studying</option>
                    </select>
                  </div>
                </div>

                {formData.studying_level !== 'Not Studying' && formData.studying_level !== '' && (
                  <div className="conditional-field">
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">Year Level <span className="required-field">*</span></label>
                        <input 
                          type="text" 
                          className="form-input" 
                          name="yearlevel" 
                          value={formData.yearlevel} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>

                      <div className="input-container">
                        <label className="input-label">School <span className="required-field">*</span></label>
                        <input 
                          type="text" 
                          className="form-input" 
                          name="school_name" 
                          value={formData.school_name} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">Currently working? <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="working_status" 
                      value={formData.working_status} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {formData.working_status === 'Yes' && (
                  <div className="conditional-field">
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">Name of company <span className="required-field">*</span></label>
                        <input 
                          type="text" 
                          className="form-input" 
                          name="company_name" 
                          value={formData.company_name} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>

                      <div className="input-container">
                        <label className="input-label">Position <span className="required-field">*</span></label>
                        <input 
                          type="text" 
                          className="form-input" 
                          name="position_name" 
                          value={formData.position_name} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">Are you a licensed professional? <span className="required-field">*</span></label>
                        <select 
                          className="form-input" 
                          name="licensed_professional" 
                          value={formData.licensed_professional} 
                          onChange={handleChange} 
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div className="input-container">
                        <label className="input-label">Years of employment <span className="required-field">*</span></label>
                        <input 
                          type="number" 
                          className="form-input" 
                          name="employment_yrs" 
                          value={formData.employment_yrs || ""} 
                          onChange={handleChange} 
                          required 
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">Monthly income range <span className="required-field">*</span></label>
                        <select 
                          className="form-input" 
                          name="monthly_income" 
                          value={formData.monthly_income} 
                          onChange={handleChange} 
                          required
                        >
                          <option value="">Select</option>
                          <option value="Below ₱50,000">Below ₱50,000</option>
                          <option value="₱50,001 to ₱100,000">₱50,001 to ₱100,000</option>
                          <option value="₱100,001 to ₱150,000">₱100,001 to ₱150,000</option>
                          <option value="₱150,001 to ₱200,000">₱150,001 to ₱200,000</option>
                          <option value="₱200,001 to ₱250,000">₱200,001 to ₱250,000</option>
                          <option value="Above ₱250,000">Above ₱250,000</option>
                          <option value="Prefer to not disclose">Prefer to not disclose</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">Are you a member of youth organization in our barangay? <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="youth_org" 
                      value={formData.youth_org} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {formData.youth_org === 'Yes' && (
                  <div className="conditional-field">
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">Indicate the name of the organization <span className="required-field">*</span></label>
                        <input 
                          type="text" 
                          className="form-input" 
                          name="org_name" 
                          value={formData.org_name} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>

                      <div className="input-container">
                        <label className="input-label">Indicate the position in the organization <span className="required-field">*</span></label>
                        <input 
                          type="text" 
                          className="form-input" 
                          name="org_position" 
                          value={formData.org_position} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <div className="input-container">
                    <label className="input-label">Are you a member/part of the LGBTQIA+ community? <span className="required-field">*</span></label>
                    <select 
                      className="form-input" 
                      name="lgbtqia_member" 
                      value={formData.lgbtqia_member} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
                
                {formData.youth_classification === 'Out of School Youth' && (
                  <div className="form-group">
                    <div className="input-container">
                      <label className="input-label">If an out of school youth, rank from 1 to 3: Employment, Schooling and Business <span className="required-field">*</span></label>
                      <select 
                        className="form-input" 
                        name="osyranking" 
                        value={formData.osyranking} 
                        onChange={handleChange} 
                        required
                      >
                        <option value="">Select</option>
                        <option value='{"Employment":1,"Business":2,"Schooling":3}'>Employment (#1), Business (#2), Schooling (#3)</option>
                        <option value='{"Employment":1,"Schooling":2,"Business":3}'>Employment (#1), Schooling (#2), Business (#3)</option>
                        <option value='{"Business":1,"Employment":2,"Schooling":3}'>Business (#1), Employment (#2), Schooling (#3)</option>
                        <option value='{"Business":1,"Schooling":2,"Employment":3}'>Business (#1), Schooling (#2), Employment (#3)</option>
                        <option value='{"Schooling":1,"Employment":2,"Business":3}'>Schooling (#1), Employment (#2), Business (#3)</option>
                        <option value='{"Schooling":1,"Business":2,"Employment":3}'>Schooling (#1), Business (#2), Employment (#3)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="button-container">
                <button type="button" className="prev-btn" onClick={handlePrevPage}>
                  <span className="btn-icon">←</span>
                  Previous
                </button>
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                  {!isSubmitting && <span className="btn-icon">✓</span>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default KatipunanKabataanForm;