import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/YouthProfileForm.css'; 
import { AuthContext } from '../../Contexts/AuthContext';
import axios from 'axios';

const YouthProfileForm = () => {
  const navigate = useNavigate();
  const { user, checkAuthStatus } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    birthdate: '',
    age: '',
    address: '',
    barangay: '',
    email: '',
    phone_number: '',
    civil_status: '',
    youth_classification: '',
    youth_age_group: '',
    educational_background: '',
    work_status: '',
    sk_voter: '',
    national_voter: '',
    kk_assembly_attendance: '',
    did_vote_last_election: '',
    kk_assembly_attendance_times: '',
    reason_for_not_attending: '',
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

  useEffect(() => {
    if (user) {
      const userBirthdate = user.dob || ''; 
      
      setFormData(prevState => ({
        ...prevState,
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        barangay: user.baranggay || '',
        address: user.address || '',
        phone_number: user.phone_number || '',
        gender: user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : '',
        birthdate: userBirthdate,
        age: userBirthdate ? calculateAge(userBirthdate) : '',
        youth_age_group: userBirthdate ? calculateYouthAgeGroup(calculateAge(userBirthdate)) : ''
      }));
    }
  }, [user]);

  // Calculate age from birthdate
  const calculateAge = (birthdate) => {
    const birthDateObj = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate youth age group based on age
  const calculateYouthAgeGroup = (age) => {
    if (age >= 15 && age <= 17) return "Child Youth(15-17 yrs old)";
    if (age >= 18 && age <= 24) return "Core Youth(18-24 yrs old)";
    if (age >= 25 && age <= 30) return "Young Adult(25-30 yrs old)";
    return "Not Applicable";
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updatedData = { ...prev, [field]: value };
  
      // Handle birthdate field
      if (field === 'birthdate') {
        const calculatedAge = calculateAge(value);
        const youthAgeGroup = calculateYouthAgeGroup(calculatedAge);
        updatedData.age = calculatedAge;
        updatedData.youth_age_group = youthAgeGroup;
      }

      
    // Handle SK Voter field
    if (field === 'sk_voter') {
      if (value === 'No') {
        updatedData.did_vote_last_election = 'No';
      }
    }

  
      // Handle youth classification specific rules
      if (field === 'youth_classification') {
        // If "Out of School Youth", set studying_level to "Not Studying"
        if (value === 'Out of School Youth') {
          updatedData.studying_level = 'Not Studying';
          updatedData.yearlevel = '';
          updatedData.school_name = '';
        }
        
        // If "Youth with Specific Needs: Person w/ Disability", set PWD to "Yes"
        if (value === 'Youth with Specific Needs: Person w/ Disability') {
          updatedData.pwd = 'Yes';
        } else if (prev.pwd === 'Yes' && value !== 'Youth with Specific Needs: Person w/ Disability') {
          // Reset PWD if changing from disability classification
          updatedData.pwd = '';
          updatedData.pwd_years = '';
        }
        
        // Handle working_status for "Working Youth"
        if (value === 'Working Youth') {
          updatedData.working_status = 'Yes';
        } else if (!['Employed', 'Self Employed'].includes(updatedData.work_status)) {
          updatedData.working_status = 'No';
        }
      }
  
      // Handle work_status changes
      if (field === 'work_status') {
        if (value === 'Employed' || value === 'Self Employed') {
          updatedData.working_status = 'Yes';
        } else if (updatedData.youth_classification !== 'Working Youth') {
          updatedData.working_status = 'No';
          updatedData.company_name = '';
          updatedData.position_name = '';
          updatedData.licensed_professional = '';
          updatedData.employment_yrs = '';
          updatedData.monthly_income = '';
        }
      }
  
      // Handle conditional fields
      if (field === 'kk_assembly_attendance') {
        if (value === 'Yes') {
          updatedData.reason_for_not_attending = 'N/A';
        } else if (value === 'No') {
          updatedData.kk_assembly_attendance_times = 'N/A';
        }
      }
  
      if (field === 'soloparent' && value === 'No') {
        updatedData.num_of_children = '';
      }
  
      if (field === 'pwd' && value === 'No') {
        updatedData.pwd_years = '';
      }
  
      if (field === 'athlete' && value === 'No') {
        updatedData.sport_name = '';
      }
  
      if (field === 'scholar') {
        if (value === 'No') {
          updatedData.pasigscholar = '';
          updatedData.scholarship_name = '';
        }
      }
  
      if (field === 'pasigscholar' && value === 'Yes') {
        updatedData.scholarship_name = '';
      }
  
      if (field === 'studying_level') {
        if (value === 'Not Studying') {
          updatedData.yearlevel = '';
          updatedData.school_name = '';
        }
      }
  
      if (field === 'working_status' && value === 'No') {
        updatedData.company_name = '';
        updatedData.position_name = '';
        updatedData.licensed_professional = '';
        updatedData.employment_yrs = '';
        updatedData.monthly_income = '';
      }
  
      if (field === 'youth_org' && value === 'No') {
        updatedData.org_name = '';
        updatedData.org_position = '';
      }
  
      // Handle educational background for in-school youth
      if (field === 'youth_classification' && value === 'In School Youth' && !updatedData.studying_level) {
        updatedData.studying_level = 'Secondary'; // Default value for in-school youth
      }
  
      return updatedData;
    });
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // Update handleSubmit in your YouthProfileForm.jsx
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Add CSRF token for web routes
      await axios.get('/sanctum/csrf-cookie');
      
      // Make API call to store profile
      const response = await axios.post('/user/profile', formData);
      
      if (response.data.success) {
        setFormSubmitted(true);
        showNotification('Profile created successfully!', 'success');
        
        // Update user auth context to reflect profiled status
        await checkAuthStatus();
        
        // Redirect to home page after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      showNotification(error.response?.data?.message || 'Error creating profile. Please try again.', 'error');
    }
  };

  return (
    <div className="youth-ypf-container">
      {notification.show && (
        <div className={`youth-ypf-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="youth-ypf-form-wrapper">
        <div className="youth-ypf-header">
          <h1>Youth Profile Form</h1>
          <p>Complete your profile to fully access all features</p>
        </div>
        
        <div className="youth-ypf-progress">
          <div className={`youth-ypf-progress-step ${currentPage >= 1 ? 'active' : ''}`}>Basic Info</div>
          <div className={`youth-ypf-progress-step ${currentPage >= 2 ? 'active' : ''}`}>Demographics</div>
          <div className={`youth-ypf-progress-step ${currentPage >= 3 ? 'active' : ''}`}>Additional Info</div>
        </div>
        
        <div className="youth-ypf-form-content">
          {currentPage === 1 && (
            <div className="youth-ypf-form-page">
              <h2>Basic Information</h2>
              
              <div className="youth-ypf-form-row">
                <div className="youth-ypf-form-group">
                  <label>First Name</label>
                  <input 
                    type="text" 
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    required
                  />
                </div>
                
                <div className="youth-ypf-form-group">
                  <label>Middle Name (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.middle_name}
                    onChange={(e) => handleInputChange('middle_name', e.target.value)}
                  />
                </div>
                
                <div className="youth-ypf-form-group">
                  <label>Last Name</label>
                  <input 
                    type="text" 
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="youth-ypf-form-row">
                <div className="youth-ypf-form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div className="youth-ypf-form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="youth-ypf-form-row">
                <div className="youth-ypf-form-group full-width">
                  <label>Address</label>
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="youth-ypf-form-row">
                <div className="youth-ypf-form-group">
                  <label>Barangay</label>
                  <select
                    value={formData.barangay}
                    onChange={(e) => handleInputChange('barangay', e.target.value)}
                    required
                    disabled={user && user.baranggay}
                  >
                    <option value="">Select Barangay</option>
                    <option value="Dela Paz">Dela Paz</option>
                    <option value="Manggahan">Manggahan</option>
                    <option value="Maybunga">Maybunga</option>
                    <option value="Pinagbuhatan">Pinagbuhatan</option>
                    <option value="Rosario">Rosario</option>
                    <option value="San Miguel">San Miguel</option>
                    <option value="Santa Lucia">Santa Lucia</option>
                    <option value="Santolan">Santolan</option>
                  </select>
                </div>
                
                <div className="youth-ypf-form-group">
                  <label>Sex Assigned at Birth</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    required 
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                
                <div className="youth-ypf-form-group">
                  <label>Date of Birth</label>
                  <input 
                    type="date" 
                    value={formData.birthdate}
                    onChange={(e) => handleInputChange('birthdate', e.target.value)}
                    required
                  />
                </div>
                
                <div className="youth-ypf-form-group">
                  <label>Age (Auto-calculated)</label>
                  <input 
                    type="number" 
                    value={formData.age}
                    readOnly
                  />
                </div>
              </div>
              
              <div className="youth-ypf-form-actions">
                <button 
                  type="button" 
                  className="youth-ypf-btn-next"
                  onClick={() => setCurrentPage(2)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {currentPage === 2 && (
            <div className="youth-ypf-form-page">
              <h2>Demographics</h2>
              
              <div className="youth-ypf-form-row">
                <div className="youth-ypf-form-group">
                  <label>Civil Status</label>
                  <select
                    value={formData.civil_status}
                    onChange={(e) => handleInputChange('civil_status', e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Seperated">Seperated</option>
                    <option value="Annulled">Annulled</option>
                    <option value="Unknown">Unknown</option>
                    <option value="Live-in">Live-in</option>
                  </select>
                </div>
                
                <div className="youth-ypf-form-group">
                  <label>Youth Classification</label>
                  <select
                    value={formData.youth_classification}
                    onChange={(e) => handleInputChange('youth_classification', e.target.value)}
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
                
                <div className="youth-ypf-form-group">
                  <label>Youth Age Group (Auto-calculated)</label>
                  <input 
                    type="text" 
                    value={formData.youth_age_group}
                    readOnly
                  />
                </div>
              </div>
              
              <div className="youth-ypf-form-row">
                <div className="youth-ypf-form-group">
                  <label>Educational Background</label>
                  <select
                    value={formData.educational_background}
                    onChange={(e) => handleInputChange('educational_background', e.target.value)}
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
                
                <div className="youth-ypf-form-group">
                  <label>Work Status</label>
                  <select
                    value={formData.work_status}
                    onChange={(e) => handleInputChange('work_status', e.target.value)}
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
              
              <div className="youth-ypf-form-row">
                <div className="youth-ypf-form-group">
                  <label>SK Voter</label>
                  <select
                    value={formData.sk_voter}
                    onChange={(e) => handleInputChange('sk_voter', e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                
                <div className="youth-ypf-form-group">
                  <label>National Voter</label>
                  <select
                    value={formData.national_voter}
                    onChange={(e) => handleInputChange('national_voter', e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              
              <div className="youth-ypf-form-row">
                <div className="youth-ypf-form-group">
                  <label>Did you vote last SK election?</label>
                  <select
                    value={formData.did_vote_last_election}
                    onChange={(e) => handleInputChange('did_vote_last_election', e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                
                <div className="youth-ypf-form-group">
                  <label>KK Assembly Attendance</label>
                  <select
                    value={formData.kk_assembly_attendance}
                    onChange={(e) => handleInputChange('kk_assembly_attendance', e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              
              {formData.kk_assembly_attendance === 'Yes' && (
                <div className="youth-ypf-form-row">
                  <div className="youth-ypf-form-group">
                    <label>How many times did you attend the assembly?</label>
                    <select
                      value={formData.kk_assembly_attendance_times}
                      onChange={(e) => handleInputChange('kk_assembly_attendance_times', e.target.value)}
                      required
                    >
                      <option value="">Select</option>
                      <option value="1-2 Times">1-2 Times</option>
                      <option value="3-4 Times">3-4 Times</option>
                      <option value="5 and above">5 and above</option>
                    </select>
                  </div>
                </div>
              )}
              
              {formData.kk_assembly_attendance === 'No' && (
                <div className="youth-ypf-form-row">
                  <div className="youth-ypf-form-group">
                    <label>Why didn't you attend?</label>
                    <select
                      value={formData.reason_for_not_attending}
                      onChange={(e) => handleInputChange('reason_for_not_attending', e.target.value)}
                      required
                    >
                      <option value="">Select</option>
                      <option value="There was no KK Assembly Meeting">There was no KK Assembly Meeting</option>
                      <option value="Not Interested to Attend">Not Interested to Attend</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="youth-ypf-form-actions">
                <button 
                  type="button" 
                  className="youth-ypf-btn-prev"
                  onClick={() => setCurrentPage(1)}
                >
                  Previous
                </button>
                <button 
                  type="button" 
                  className="youth-ypf-btn-next"
                  onClick={() => setCurrentPage(3)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {currentPage === 3 && (
            <div className="youth-ypf-form-page">
              <h2>Additional Information</h2>
              
              <div className="youth-ypf-form-row">
                <div className="youth-ypf-form-group">
                  <label>Are you a solo parent?</label>
                  <select
                    value={formData.soloparent}
                    onChange={(e) => handleInputChange('soloparent', e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                
                {formData.soloparent === 'Yes' && (
                  <div className="youth-ypf-form-group">
                    <label>If yes, indicate no. of children</label>
                    <input
                      type="number"
                      value={formData.num_of_children}
                      onChange={(e) => handleInputChange('num_of_children', e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                )}
              </div>
              
              <div className="youth-ypf-form-row">
                <div className="youth-ypf-form-group">
                  <label>Are you a PWD?</label>
                  <select
                    value={formData.pwd}
                    onChange={(e) => handleInputChange('pwd', e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                
                {formData.pwd === 'Yes' && (
                  <div className="youth-ypf-form-group">
                    <label>If yes, for how long? Indicate no. of yrs</label>
                    <input
                      type="number"
                      value={formData.pwd_years}
                      onChange={(e) => handleInputChange('pwd_years', e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                )}
              </div>
              
              <div className="youth-ypf-form-row">
                <div className="youth-ypf-form-group">
                  <label>Are you an athlete?</label>
                  <select
                    value={formData.athlete}
                    onChange={(e) => handleInputChange('athlete', e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                
                {formData.athlete === 'Yes' && (
                  <div className="youth-ypf-form-group">
                    <label>If yes, indicate sports</label>
                    <input
                      type="text"
                      value={formData.sport_name}
                      onChange={(e) => handleInputChange('sport_name', e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
              
              {/* Add more sections based on your needs... */}
              
              <div className="youth-ypf-form-section">
                <h3>Education & Scholarship</h3>
                
                <div className="youth-ypf-form-row">
                  <div className="youth-ypf-form-group">
                    <label>Are you a scholar?</label>
                    <select
                      value={formData.scholar}
                      onChange={(e) => handleInputChange('scholar', e.target.value)}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  
                  {formData.scholar === 'Yes' && (
                    <div className="youth-ypf-form-group">
                      <label>Are you a Pasig Scholar?</label>
                      <select
                        value={formData.pasigscholar}
                        onChange={(e) => handleInputChange('pasigscholar', e.target.value)}
                        required
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  )}
                </div>
                
                {formData.scholar === 'Yes' && formData.pasigscholar === 'No' && (
                  <div className="youth-ypf-form-row">
                    <div className="youth-ypf-form-group">
                      <label>Name of scholarship program</label>
                      <input
                        type="text"
                        value={formData.scholarship_name}
                        onChange={(e) => handleInputChange('scholarship_name', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
                
                <div className="youth-ypf-form-row">
                  <div className="youth-ypf-form-group">
                    <label>If currently studying, indicate level</label>
                    <select
                      value={formData.studying_level}
                      onChange={(e) => handleInputChange('studying_level', e.target.value)}
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
                
                {formData.studying_level && formData.studying_level !== 'Not Studying' && (
                  <div className="youth-ypf-form-row">
                    <div className="youth-ypf-form-group">
                      <label>Year Level</label>
                      <input
                        type="text"
                        value={formData.yearlevel}
                        onChange={(e) => handleInputChange('yearlevel', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="youth-ypf-form-group">
                      <label>School</label>
                      <input
                        type="text"
                        value={formData.school_name}
                        onChange={(e) => handleInputChange('school_name', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="youth-ypf-form-section">
                <h3>Employment</h3>
                
                <div className="youth-ypf-form-row">
                  <div className="youth-ypf-form-group">
                    <label>Currently working?</label>
                    <select
                      value={formData.working_status}
                      onChange={(e) => handleInputChange('working_status', e.target.value)}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
                
                {formData.working_status === 'Yes' && (
                  <>
                    <div className="youth-ypf-form-row">
                      <div className="youth-ypf-form-group">
                        <label>Name of company</label>
                        <input
                          type="text"
                          value={formData.company_name}
                          onChange={(e) => handleInputChange('company_name', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="youth-ypf-form-group">
                        <label>Position</label>
                        <input
                          type="text"
                          value={formData.position_name}
                          onChange={(e) => handleInputChange('position_name', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="youth-ypf-form-row">
                      <div className="youth-ypf-form-group">
                        <label>Are you a licensed professional?</label>
                        <select
                          value={formData.licensed_professional}
                          onChange={(e) => handleInputChange('licensed_professional', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      
                      <div className="youth-ypf-form-group">
                        <label>Years of employment</label>
                        <input
                          type="number"
                          value={formData.employment_yrs}
                          onChange={(e) => handleInputChange('employment_yrs', e.target.value)}
                          min="1"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="youth-ypf-form-row">
                      <div className="youth-ypf-form-group">
                        <label>Monthly income range</label>
                        <select
                          value={formData.monthly_income}
                          onChange={(e) => handleInputChange('monthly_income', e.target.value)}
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
                  </>
                )}
              </div>
              
              <div className="youth-ypf-form-section">
                <h3>Community Involvement</h3>
                
                <div className="youth-ypf-form-row">
                  <div className="youth-ypf-form-group">
                    <label>Are you a member of youth organization in your barangay?</label>
                    <select
                      value={formData.youth_org}
                      onChange={(e) => handleInputChange('youth_org', e.target.value)}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
                
                {formData.youth_org === 'Yes' && (
                  <div className="youth-ypf-form-row">
                    <div className="youth-ypf-form-group">
                      <label>Name of the organization</label>
                      <input
                        type="text"
                        value={formData.org_name}
                        onChange={(e) => handleInputChange('org_name', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="youth-ypf-form-group">
                      <label>Position in the organization</label>
                      <input
                        type="text"
                        value={formData.org_position}
                        onChange={(e) => handleInputChange('org_position', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
                
                <div className="youth-ypf-form-row">
                  <div className="youth-ypf-form-group">
                    <label>Are you a member/part of the LGBTQIA+ community?</label>
                    <select
                      value={formData.lgbtqia_member}
                      onChange={(e) => handleInputChange('lgbtqia_member', e.target.value)}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
                
                {formData.youth_classification === 'Out of School Youth' && (
                  <div className="youth-ypf-form-row">
                    <div className="youth-ypf-form-group">
                      <label>If an out of school youth, rank from 1 to 3: Employment, Schooling and Business</label>
                      <select
                        value={formData.osyranking}
                        onChange={(e) => handleInputChange('osyranking', e.target.value)}
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
              
              <div className="youth-ypf-form-actions">
                <button 
                  type="button" 
                  className="youth-ypf-btn-prev"
                  onClick={() => setCurrentPage(2)}
                >
                  Previous
                </button>
                <button 
                  type="submit" 
                  className="youth-ypf-btn-submit"
                  onClick={handleSubmit}
                  disabled={formSubmitted}
                >
                  {formSubmitted ? 'Submitted!' : 'Submit Profile'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YouthProfileForm;