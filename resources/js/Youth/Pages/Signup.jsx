import React, { useState, useEffect, useContext, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import background from '../../assets/home-banner.png';
import '../css/AuthStyles.css'; 
import { FaUser, FaIdCard, FaMapMarkerAlt, FaEnvelope, FaExclamationTriangle, FaEye, FaEyeSlash, FaCheck, FaTimes, FaFileUpload } from 'react-icons/fa';
import AuthLayout from '../Components/AuthLayout';
import { AuthContext } from '../../Contexts/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { user, register, pendingVerification } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
    
    // Redirect to verification page if there's a pending verification
    if (pendingVerification.waiting && pendingVerification.type === 'youth') {
      navigate('/verify-email', { state: { email: pendingVerification.email } });
    }
  }, [user, pendingVerification, navigate]);
  
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    dob: '',
    age: '',
    email: '',
    house_number: '',
    street: '',
    subdivision: '',
    baranggay: '',
    city: 'Pasig',
    province: 'Metro Manila',
    is_pasig_resident: '1', // Use string '1' for true, '0' for false
    proof_of_address: null,
    phone_number: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  
  const [errors, setErrors] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    dob: '',
    age: '',
    email: '',
    house_number: '',
    street: '',
    subdivision: '',
    baranggay: '',
    city: '',
    province: '',
    is_pasig_resident: '',
    proof_of_address: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    agreeTerms: ''
  });

  // File upload tracking
  const [fileName, setFileName] = useState('');
  
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasLower: false,
    hasUpper: false,
    hasSpecial: false,
    hasNumber: false
  });
  
  // Track if password field has been interacted with
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [shouldShowRequirements, setShouldShowRequirements] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessages, setAlertMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Philippines Provinces data
  const provinces = [
    'Metro Manila',
    'Abra',
    'Agusan del Norte',
    'Agusan del Sur',
    'Aklan',
    'Albay',
    'Antique',
    'Apayao',
    'Aurora',
    'Basilan',
    'Bataan',
    'Batanes',
    'Batangas',
    'Benguet',
    'Biliran',
    'Bohol',
    'Bukidnon',
    'Bulacan',
    'Cagayan',
    'Camarines Norte',
    'Camarines Sur',
    'Camiguin',
    'Capiz',
    'Catanduanes',
    'Cavite',
    'Cebu',
    'Cotabato',
    'Davao de Oro',
    'Davao del Norte',
    'Davao del Sur',
    'Davao Occidental',
    'Davao Oriental',
    'Dinagat Islands',
    'Eastern Samar',
    'Guimaras',
    'Ifugao',
    'Ilocos Norte',
    'Ilocos Sur',
    'Iloilo',
    'Isabela',
    'Kalinga',
    'La Union',
    'Laguna',
    'Lanao del Norte',
    'Lanao del Sur',
    'Leyte',
    'Maguindanao',
    'Marinduque',
    'Masbate',
    'Misamis Occidental',
    'Misamis Oriental',
    'Mountain Province',
    'Negros Occidental',
    'Negros Oriental',
    'Northern Samar',
    'Nueva Ecija',
    'Nueva Vizcaya',
    'Occidental Mindoro',
    'Oriental Mindoro',
    'Palawan',
    'Pampanga',
    'Pangasinan',
    'Quezon',
    'Quirino',
    'Rizal',
    'Romblon',
    'Samar',
    'Sarangani',
    'Siquijor',
    'Sorsogon',
    'South Cotabato',
    'Southern Leyte',
    'Sultan Kudarat',
    'Sulu',
    'Surigao del Norte',
    'Surigao del Sur',
    'Tarlac',
    'Tawi-Tawi',
    'Zambales',
    'Zamboanga del Norte',
    'Zamboanga del Sur',
    'Zamboanga Sibugay'
  ];

  // Cities by province data - including most major cities and municipalities
  const citiesByProvince = {
    'Metro Manila': [
      'Caloocan',
      'Las Piñas',
      'Makati',
      'Malabon',
      'Mandaluyong',
      'Manila',
      'Marikina',
      'Muntinlupa',
      'Navotas',
      'Parañaque',
      'Pasay',
      'Pasig',
      'Pateros',
      'Quezon City',
      'San Juan',
      'Taguig',
      'Valenzuela'
    ],
    'Batangas': [
      'Agoncillo',
      'Alitagtag',
      'Balayan',
      'Balete',
      'Batangas City',
      'Bauan',
      'Calaca',
      'Calatagan',
      'Cuenca',
      'Ibaan',
      'Laurel',
      'Lemery',
      'Lian',
      'Lipa',
      'Lobo',
      'Mabini',
      'Malvar',
      'Mataasnakahoy',
      'Nasugbu',
      'Padre Garcia',
      'Rosario',
      'San Jose',
      'San Juan',
      'San Luis',
      'San Nicolas',
      'San Pascual',
      'Santa Teresita',
      'Santo Tomas',
      'Taal',
      'Talisay',
      'Tanauan',
      'Taysan',
      'Tingloy',
      'Tuy'
    ],
    'Bulacan': [
      'Angat',
      'Balagtas',
      'Baliuag',
      'Bocaue',
      'Bulakan',
      'Bustos',
      'Calumpit',
      'Doña Remedios Trinidad',
      'Guiguinto',
      'Hagonoy',
      'Malolos',
      'Marilao',
      'Meycauayan',
      'Norzagaray',
      'Obando',
      'Pandi',
      'Paombong',
      'Plaridel',
      'Pulilan',
      'San Ildefonso',
      'San Jose del Monte',
      'San Miguel',
      'San Rafael',
      'Santa Maria'
    ],
    'Cavite': [
      'Alfonso',
      'Amadeo',
      'Bacoor',
      'Carmona',
      'Cavite City',
      'Dasmariñas',
      'General Emilio Aguinaldo',
      'General Mariano Alvarez',
      'General Trias',
      'Imus',
      'Indang',
      'Kawit',
      'Magallanes',
      'Maragondon',
      'Mendez',
      'Naic',
      'Noveleta',
      'Rosario',
      'Silang',
      'Tagaytay',
      'Tanza',
      'Ternate',
      'Trece Martires'
    ],
    'Laguna': [
      'Alaminos',
      'Bay',
      'Biñan',
      'Cabuyao',
      'Calamba',
      'Calauan',
      'Cavinti',
      'Famy',
      'Kalayaan',
      'Liliw',
      'Los Baños',
      'Luisiana',
      'Lumban',
      'Mabitac',
      'Magdalena',
      'Majayjay',
      'Nagcarlan',
      'Paete',
      'Pagsanjan',
      'Pakil',
      'Pangil',
      'Pila',
      'Rizal',
      'San Pablo',
      'San Pedro',
      'Santa Cruz',
      'Santa Maria',
      'Santa Rosa',
      'Siniloan',
      'Victoria'
    ],
    'Pampanga': [
      'Angeles',
      'Apalit',
      'Arayat',
      'Bacolor',
      'Candaba',
      'Floridablanca',
      'Guagua',
      'Lubao',
      'Mabalacat',
      'Macabebe',
      'Magalang',
      'Masantol',
      'Mexico',
      'Minalin',
      'Porac',
      'San Fernando',
      'San Luis',
      'San Simon',
      'Santa Ana',
      'Santa Rita',
      'Santo Tomas',
      'Sasmuan'
    ],
    'Rizal': [
      'Angono',
      'Antipolo',
      'Baras',
      'Binangonan',
      'Cainta',
      'Cardona',
      'Jala-Jala',
      'Morong',
      'Pililla',
      'Rodriguez',
      'San Mateo',
      'Tanay',
      'Taytay',
      'Teresa'
    ],
    // Add more provinces and their cities as needed
  };

  // Barangay data for major cities - now includes barangays for multiple cities
  const barangaysByCity = {
    'Pasig': [
      'Dela Paz',
      'Manggahan',
      'Maybunga',
      'Pinagbuhatan',
      'Rosario',
      'San Miguel',
      'Santa Lucia',
      'Santolan'
    ],
    'Quezon City': [
      'Alicia',
      'Bagong Lipunan ng Crame',
      'Bagong Pag-asa',
      'Bagumbayan',
      'Bahay Toro',
      'Batasan Hills',
      'Bayanihan',
      'Blue Ridge A',
      'Blue Ridge B',
      'Botocan',
      'BS Aquino',
      'Capri',
      'Commonwealth',
      'Culiat',
      'Damar',
      'Damayan',
      'Damayang Lagi',
      'Del Monte',
      'Dioquino Zobel',
      'Doña Aurora',
      'Doña Imelda',
      'Doña Josefa',
      'East Kamias',
      'Escopa I',
      'Escopa II',
      'Escopa III',
      'Escopa IV',
      'Fairview'
      // Add more as needed
    ],
    'Makati': [
      'Bangkal',
      'Bel-Air',
      'Carmona',
      'Cembo',
      'Comembo',
      'Dasmariñas',
      'East Rembo',
      'Forbes Park',
      'Guadalupe Nuevo',
      'Guadalupe Viejo',
      'Kasilawan',
      'La Paz',
      'Magallanes',
      'Olympia',
      'Palanan',
      'Pembo',
      'Pinagkaisahan',
      'Pio del Pilar',
      'Pitogo',
      'Poblacion',
      'Post Proper Northside',
      'Post Proper Southside',
      'Rizal',
      'San Antonio',
      'San Isidro',
      'San Lorenzo',
      'Santa Cruz',
      'Singkamas',
      'South Cembo',
      'Tejeros',
      'Urdaneta',
      'Valenzuela',
      'West Rembo'
    ],
    'Antipolo': [
      'Bagong Nayon',
      'Beverly Hills',
      'Calawis',
      'Cupang',
      'Dalig',
      'Dela Paz',
      'Inarawan',
      'Mambugan',
      'Mayamot',
      'Muntindilao',
      'San Isidro',
      'San Jose',
      'San Juan',
      'San Luis',
      'San Roque',
      'Santa Cruz'
    ],
    'Cainta': [
      'San Andres',
      'San Isidro',
      'San Juan',
      'San Roque',
      'Santa Rosa',
      'Santo Domingo',
      'Santo Niño'
    ],
    'Taytay': [
      'Dolores',
      'Muzon',
      'San Isidro',
      'San Juan',
      'Santa Ana'
    ],
    'Manila': [
      'Barangay 1',
      'Barangay 2',
      'Barangay 3',
      'Barangay 4',
      'Barangay 5',
      'Barangay 6',
      'Binondo',
      'Ermita',
      'Intramuros',
      'Malate',
      'Paco',
      'Pandacan',
      'Port Area',
      'Quiapo',
      'Sampaloc',
      'San Andres',
      'San Miguel',
      'San Nicolas',
      'Santa Ana',
      'Santa Cruz',
      'Santa Mesa',
      'Tondo'
    ]
    // Add more cities with their barangays as needed
  };
  
  // Gender options from the database schema
  const genderOptions = [
    'male',
    'female',
    'rather not say'
  ];
  
  // Validate email format
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };
  
  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  };
  
  // Check password requirements
  useEffect(() => {
    const { password } = formData;
    
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasNumber: /[0-9]/.test(password)
    });
    
    // Only show requirements if there's actual content in the password field
    setShouldShowRequirements(password.length > 0 || passwordFocused);
  }, [formData.password, passwordFocused]);
  
  // Handle DOB change and automatically calculate age
  useEffect(() => {
    if (formData.dob) {
      const calculatedAge = calculateAge(formData.dob);
      setFormData(prev => ({
        ...prev,
        age: calculatedAge
      }));
    }
  }, [formData.dob]);
  
  // Check if the form is valid
  useEffect(() => {
    // Check if all required fields are filled and all error messages are empty
    const requiredFields = [
      'first_name', 'last_name', 'gender', 'dob', 'age',
      'email', 'baranggay', 'city', 'province', 'phone_number', 'password', 'confirmPassword'
    ];
    
    // Add proof_of_address as required for non-Pasig residents
    if (formData.is_pasig_resident === '0') {
      requiredFields.push('proof_of_address');
    }
    
    const allFieldsFilled = requiredFields.every(field => {
      if (field === 'proof_of_address') {
        return formData.is_pasig_resident === '1' || formData[field] !== null;
      }
      return formData[field].toString().trim() !== '';
    });
    
    // Check if age is at least 15 years old
    const isOldEnough = parseInt(formData.age, 10) >= 15;
    
    const allErrorsFree = Object.values(errors).every(error => error === '');
    const termsAgreed = formData.agreeTerms;
    const passwordValid = Object.values(passwordRequirements).every(req => req);
    
    setIsFormValid(allFieldsFilled && allErrorsFree && termsAgreed && passwordValid && isOldEnough);
  }, [formData, errors, passwordRequirements]);
  
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    let newValue;
    
    if (type === 'checkbox') {
      newValue = checked;
    } else if (type === 'file') {
      newValue = files[0];
      if (files.length > 0) {
        setFileName(files[0].name);
      } else {
        setFileName('');
      }
    } else {
      newValue = value;
    }
    
    setFormData({
      ...formData,
      [name]: newValue
    });
    
    // Validate on change
    validateField(name, newValue);
  };
  
  // Handle province change
  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
    
    // Set Metro Manila as default if Pasig resident
    if (formData.is_pasig_resident === '1') {
      setFormData(prev => ({
        ...prev,
        province: 'Metro Manila',
        city: 'Pasig',
        baranggay: '' // Reset barangay
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        province: selectedProvince,
        city: '', // Reset city when province changes
        baranggay: '' // Reset barangay when province changes
      }));
    }
    
    validateField('province', selectedProvince);
  };
  
  // Handle city change
  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    const isPasig = selectedCity === 'Pasig';
    
    setFormData(prev => ({
      ...prev,
      city: selectedCity,
      is_pasig_resident: isPasig ? '1' : '0',
      baranggay: '', // Reset barangay when city changes
    }));
    
    validateField('city', selectedCity);
  };
  
  // Handle Pasig residency change
  const handlePasigResidencyChange = (e) => {
    const isPasigResident = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      is_pasig_resident: isPasigResident,
      // If Pasig resident, set default values for Pasig
      city: isPasigResident === '1' ? 'Pasig' : '',
      province: isPasigResident === '1' ? 'Metro Manila' : '',
      baranggay: '', // Reset barangay
    }));
    
    validateField('is_pasig_resident', isPasigResident);
  };
  
  const validateField = (name, value) => {
    let errorMessage = '';
    
    switch (name) {
      case 'first_name':
      case 'last_name':
        if (value.trim() === '') {
          errorMessage = `${name === 'first_name' ? 'First name' : 'Last name'} is required`;
        }
        break;
      case 'gender':
        if (value === '') {
          errorMessage = 'Gender selection is required';
        }
        break;
      case 'dob':
        if (value === '') {
          errorMessage = 'Date of birth is required';
        } else {
          // Check if the calculated age is at least 15
          const calculatedAge = calculateAge(value);
          if (parseInt(calculatedAge, 10) < 15) {
            errorMessage = 'You must be at least 15 years old to register';
          }
        }
        break;
      case 'age':
        if (value === '') {
          errorMessage = 'Age is required';
        } else if (parseInt(value, 10) < 15) {
          errorMessage = 'You must be at least 15 years old to register';
        }
        break;
      case 'phone_number':
        if (value.trim() === '') {
          errorMessage = 'Phone number is required';
        } else if (!/^[0-9+\-\s]+$/.test(value)) {
          errorMessage = 'Phone number should contain valid characters';
        }
        break;
      case 'house_number':
        // Optional field, no validation required
        break;
      case 'street':
        // Optional field, no validation required
        break;
      case 'subdivision':
        // Optional field, no validation required
        break;
      case 'baranggay':
        if (value.trim() === '') {
          errorMessage = 'Barangay is required';
        }
        break;
      case 'city':
        if (value.trim() === '') {
          errorMessage = 'City is required';
        }
        break;
      case 'province':
        if (value.trim() === '') {
          errorMessage = 'Province is required';
        }
        break;
      case 'is_pasig_resident':
        if (value !== '0' && value !== '1') {
          errorMessage = 'Please select your residency status';
        }
        break;
      case 'proof_of_address':
        if (formData.is_pasig_resident === '0' && !value) {
          errorMessage = 'Proof of address is required for non-Pasig residents';
        } else if (value) {
          const fileSize = value.size / 1024 / 1024; // in MB
          const fileType = value.type;
          const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
          
          if (fileSize > 2) {
            errorMessage = 'File size must be less than 2MB';
          } else if (!validTypes.includes(fileType)) {
            errorMessage = 'Only PDF, JPG, and PNG files are allowed';
          }
        }
        break;
      case 'email':
        if (value.trim() === '') {
          errorMessage = 'Email is required';
        } else if (!validateEmail(value)) {
          errorMessage = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (value.trim() === '') {
          errorMessage = 'Password is required';
        }
        // Password requirements are handled by the requirements display
        break;
      case 'confirmPassword':
        if (value.trim() === '') {
          errorMessage = 'Please confirm your password';
        } else if (value !== formData.password) {
          errorMessage = 'Passwords do not match!';
        }
        break;
      case 'agreeTerms':
        if (!value) {
          errorMessage = 'You must agree to the Terms of Service and Privacy Policy';
        }
        break;
      default:
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if the form is valid
    if (!isFormValid) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create FormData object for multipart/form-data (file upload)
      const submitData = new FormData();
      
      // Add all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (key !== 'confirmPassword' && key !== 'agreeTerms') {
          // Special handling for the file
          if (key === 'proof_of_address') {
            if (formData[key]) {
              submitData.append(key, formData[key]);
            }
          } else {
            submitData.append(key, formData[key]);
          }
        }
      });
      
      // Add password_confirmation field for Laravel validation
      submitData.append('password_confirmation', formData.confirmPassword);
      
      // Use the context's register function
      const { success, errors, needsVerification } = await register(submitData);
      
      // Handle successful registration
      if (success) {
        if (needsVerification) {
          // Redirect to the verification page
          navigate('/verify-email', { state: { email: formData.email } });
        } else {
          // Redirect to login page
          navigate('/login');
        }
      } else {
        // Handle registration error
        setShowAlert(true);
        
        if (errors) {
          const errorMessages = [];
          
          // Collect all error messages
          Object.keys(errors).forEach(field => {
            errorMessages.push(errors[field][0]);
          });
          
          setAlertMessages(errorMessages);
        } else {
          setAlertMessages(['Registration failed. Please try again.']);
        }
      }
    } catch (error) {
      setShowAlert(true);
      setAlertMessages(['An unexpected error occurred. Please try again.']);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };
  
  // Handle password field focus
  const handlePasswordFocus = () => {
    setPasswordFocused(true);
  };

  // Handle password field blur
  const handlePasswordBlur = (e) => {
    setPasswordFocused(false);
    validateField('password', e.target.value);
    
    // If the password field is empty when the user leaves, hide requirements
    if (e.target.value.trim() === '') {
      setShouldShowRequirements(false);
    }
  };

  // Handle file selection button click
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // If already logged in, don't render the form (will redirect via useEffect)
  if (user) {
    return <div className="youth-auth-loading">Redirecting...</div>;
  }

  return (
    <AuthLayout>
      <div className="youth-auth-container">
        <div className="youth-auth-background">
          <img src={background} alt="Background" className="youth-auth-bg-image" />
          <div className="youth-auth-bg-overlay"></div>
        </div>
        
        <div className="youth-auth-card youth-auth-signup-card">
          <div className="youth-auth-header">
            <div className="youth-auth-logo">
              <div className="youth-auth-logo-circle">
                <FaUser />
              </div>
            </div>
            <h1 className="youth-auth-title">Create an Account</h1>
            <p className="youth-auth-subtitle">Join the community</p>
          </div>
          
          {showAlert && (
            <div className="youth-auth-alert youth-auth-alert-danger">
              <div className="youth-auth-alert-icon">
                <FaExclamationTriangle />
              </div>
              <div className="youth-auth-alert-content">
                <strong>The following errors occurred:</strong>
                <ul>
                  {alertMessages.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <form className="youth-auth-form" onSubmit={handleSubmit}>
            {/* Personal Information Form Section */}
            <div className="youth-auth-form-section">
              <div className="youth-auth-section-title">
                <FaIdCard />
                <span>Personal Information</span>
              </div>
              
              {/* Name fields */}
              <div className="youth-auth-form-row">
                <div className="youth-auth-form-group">
                  <label htmlFor="first_name" className="youth-auth-form-label">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    className={`youth-auth-form-input ${errors.first_name ? 'error' : ''}`}
                    value={formData.first_name}
                    onChange={handleChange}
                    onBlur={(e) => validateField('first_name', e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  {errors.first_name && <span className="youth-auth-input-error">{errors.first_name}</span>}
                </div>
                
                <div className="youth-auth-form-group">
                  <label htmlFor="middle_name" className="youth-auth-form-label">Middle Name (Optional)</label>
                  <input
                    type="text"
                    id="middle_name"
                    name="middle_name"
                    className={`youth-auth-form-input ${errors.middle_name ? 'error' : ''}`}
                    value={formData.middle_name}
                    onChange={handleChange}
                    onBlur={(e) => validateField('middle_name', e.target.value)}
                  />
                  {errors.middle_name && <span className="youth-auth-input-error">{errors.middle_name}</span>}
                </div>
                
                <div className="youth-auth-form-group">
                  <label htmlFor="last_name" className="youth-auth-form-label">Last Name</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    className={`youth-auth-form-input ${errors.last_name ? 'error' : ''}`}
                    value={formData.last_name}
                    onChange={handleChange}
                    onBlur={(e) => validateField('last_name', e.target.value)}
                    required
                  />
                  {errors.last_name && <span className="youth-auth-input-error">{errors.last_name}</span>}
                </div>
              </div>
              
              <div className="youth-auth-form-row">
                <div className="youth-auth-form-group">
                  <label htmlFor="gender" className="youth-auth-form-label">Sex Assigned At Birth</label>
                  <select
                    id="gender"
                    name="gender"
                    className={`youth-auth-form-input ${errors.gender ? 'error' : ''}`}
                    value={formData.gender}
                    onChange={handleChange}
                    onBlur={(e) => validateField('gender', e.target.value)}
                    required
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.gender && <span className="youth-auth-input-error">{errors.gender}</span>}
                </div>
                
                <div className="youth-auth-form-group">
                  <label htmlFor="dob" className="youth-auth-form-label">Date of Birth</label>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    className={`youth-auth-form-input ${errors.dob ? 'error' : ''}`}
                    value={formData.dob}
                    onChange={handleChange}
                    onBlur={(e) => validateField('dob', e.target.value)}
                    required
                  />
                  {errors.dob && <span className="youth-auth-input-error">{errors.dob}</span>}
                </div>
                
                <div className="youth-auth-form-group">
                  <label htmlFor="age" className="youth-auth-form-label">Age</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    className={`youth-auth-form-input ${errors.age ? 'error' : ''}`}
                    value={formData.age}
                    readOnly
                    required
                  />
                  {errors.age && <span className="youth-auth-input-error">{errors.age}</span>}
                </div>
              </div>
              
              <div className="youth-auth-form-row">
                <div className="youth-auth-form-group">
                  <label htmlFor="phone_number" className="youth-auth-form-label">Phone Number</label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    className={`youth-auth-form-input ${errors.phone_number ? 'error' : ''}`}
                    value={formData.phone_number}
                    onChange={handleChange}
                    onBlur={(e) => validateField('phone_number', e.target.value)}
                    required
                  />
                  {errors.phone_number && <span className="youth-auth-input-error">{errors.phone_number}</span>}
                  <small className="youth-auth-form-hint">Enter a valid phone number (e.g., 09XX-XXX-XXXX)</small>
                </div>
                
                <div className="youth-auth-form-group">
                  <label htmlFor="email" className="youth-auth-form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`youth-auth-form-input ${errors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={(e) => validateField('email', e.target.value)}
                    required
                  />
                  {errors.email && <span className="youth-auth-input-error">{errors.email}</span>}
                  <small className="youth-auth-form-hint">We'll send a verification code to this email</small>
                </div>
              </div>
            </div>
            
            {/* Address Information Section */}
            <div className="youth-auth-form-section">
              <div className="youth-auth-section-title">
                <FaMapMarkerAlt />
                <span>Address Information</span>
              </div>
              
              <div className="youth-auth-form-group">
                <label htmlFor="is_pasig_resident" className="youth-auth-form-label">Residency</label>
                <select
                  id="is_pasig_resident"
                  name="is_pasig_resident"
                  className={`youth-auth-form-input ${errors.is_pasig_resident ? 'error' : ''}`}
                  value={formData.is_pasig_resident}
                  onChange={handlePasigResidencyChange}
                  required
                >
                  <option value="1">Pasig City Resident</option>
                  <option value="0">Non-Pasig Resident</option>
                </select>
                {errors.is_pasig_resident && <span className="youth-auth-input-error">{errors.is_pasig_resident}</span>}
                {formData.is_pasig_resident === '0' && (
                  <small className="youth-auth-form-hint youth-auth-form-hint-highlight">
                    Note: Non-Pasig residents will need additional verification
                  </small>
                )}
              </div>
              
              <div className="youth-auth-form-row">
                <div className="youth-auth-form-group">
                  <label htmlFor="house_number" className="youth-auth-form-label">House No./Unit</label>
                  <input
                    type="text"
                    id="house_number"
                    name="house_number"
                    className={`youth-auth-form-input ${errors.house_number ? 'error' : ''}`}
                    value={formData.house_number}
                    onChange={handleChange}
                    onBlur={(e) => validateField('house_number', e.target.value)}
                  />
                  {errors.house_number && <span className="youth-auth-input-error">{errors.house_number}</span>}
                  <small className="youth-auth-form-hint">Building name, house number, or unit number</small>
                </div>
                
                <div className="youth-auth-form-group">
                  <label htmlFor="street" className="youth-auth-form-label">Street</label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    className={`youth-auth-form-input ${errors.street ? 'error' : ''}`}
                    value={formData.street}
                    onChange={handleChange}
                    onBlur={(e) => validateField('street', e.target.value)}
                  />
                  {errors.street && <span className="youth-auth-input-error">{errors.street}</span>}
                  <small className="youth-auth-form-hint">Street name</small>
                </div>
              </div>
              
              <div className="youth-auth-form-row">
                <div className="youth-auth-form-group">
                  <label htmlFor="subdivision" className="youth-auth-form-label">Subdivision/Village (Optional)</label>
                  <input
                    type="text"
                    id="subdivision"
                    name="subdivision"
                    className={`youth-auth-form-input ${errors.subdivision ? 'error' : ''}`}
                    value={formData.subdivision}
                    onChange={handleChange}
                    onBlur={(e) => validateField('subdivision', e.target.value)}
                  />
                  {errors.subdivision && <span className="youth-auth-input-error">{errors.subdivision}</span>}
                  <small className="youth-auth-form-hint">Leave blank if not applicable</small>
                </div>
              </div>
              
              {/* Conditional fields based on residency */}
              {formData.is_pasig_resident === '0' ? (
                <div className="youth-auth-form-row">
                  <div className="youth-auth-form-group">
                    <label htmlFor="province" className="youth-auth-form-label">Province</label>
                    <select
                      id="province"
                      name="province"
                      className={`youth-auth-form-input ${errors.province ? 'error' : ''}`}
                      value={formData.province}
                      onChange={handleProvinceChange}
                      required
                    >
                      <option value="">Select province</option>
                      {provinces.map((province) => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                    {errors.province && <span className="youth-auth-input-error">{errors.province}</span>}
                  </div>
                  
                  <div className="youth-auth-form-group">
                    <label htmlFor="city" className="youth-auth-form-label">City/Municipality</label>
                    <select
                      id="city"
                      name="city"
                      className={`youth-auth-form-input ${errors.city ? 'error' : ''}`}
                      value={formData.city}
                      onChange={handleCityChange}
                      required
                      disabled={!formData.province}
                    >
                      <option value="">Select city</option>
                      {formData.province && citiesByProvince[formData.province] ? 
                        citiesByProvince[formData.province].map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))
                        :
                        // For provinces without predefined cities, allow text input
                        <option value="">No predefined cities available</option>
                      }
                    </select>
                    {errors.city && <span className="youth-auth-input-error">{errors.city}</span>}
                    {!formData.province && (
                      <small className="youth-auth-form-hint">Please select a province first</small>
                    )}
                    {formData.province && !citiesByProvince[formData.province] && (
                      <div className="youth-auth-custom-city-input">
                        <input
                          type="text"
                          name="city"
                          placeholder="Enter your city/municipality"
                          className="youth-auth-form-input"
                          value={formData.city}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="youth-auth-form-row">
                  <div className="youth-auth-form-group">
                    <label htmlFor="province" className="youth-auth-form-label">Province</label>
                    <input
                      type="text"
                      id="province"
                      name="province"
                      className="youth-auth-form-input"
                      value={formData.province}
                      readOnly
                      disabled
                    />
                    <small className="youth-auth-form-hint">Auto-filled for Pasig residents</small>
                  </div>
                  
                  <div className="youth-auth-form-group">
                    <label htmlFor="city" className="youth-auth-form-label">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      className="youth-auth-form-input"
                      value={formData.city}
                      readOnly
                      disabled
                    />
                    <small className="youth-auth-form-hint">Auto-filled for Pasig residents</small>
                  </div>
                </div>
              )}
              
              <div className="youth-auth-form-group">
                <label htmlFor="baranggay" className="youth-auth-form-label">Barangay</label>
                {/* For cities with predefined barangays, show a dropdown */}
                {formData.city && barangaysByCity[formData.city] ? (
                  <select
                    id="baranggay"
                    name="baranggay"
                    className={`youth-auth-form-input ${errors.baranggay ? 'error' : ''}`}
                    value={formData.baranggay}
                    onChange={handleChange}
                    onBlur={(e) => validateField('baranggay', e.target.value)}
                    required
                  >
                    <option value="">Select barangay</option>
                    {barangaysByCity[formData.city].map((barangay) => (
                      <option key={barangay} value={barangay}>{barangay}</option>
                    ))}
                  </select>
                ) : (
                  // For cities without predefined barangays, allow text input
                  <input
                    type="text"
                    id="baranggay"
                    name="baranggay"
                    className={`youth-auth-form-input ${errors.baranggay ? 'error' : ''}`}
                    value={formData.baranggay}
                    onChange={handleChange}
                    onBlur={(e) => validateField('baranggay', e.target.value)}
                    placeholder="Enter your barangay name"
                    required
                  />
                )}
                {errors.baranggay && <span className="youth-auth-input-error">{errors.baranggay}</span>}
                {!formData.city && (
                  <small className="youth-auth-form-hint">Please select a city first</small>
                )}
              </div>
              
              <div className="youth-auth-form-group">
                <label htmlFor="proof_of_address" className="youth-auth-form-label">
                  Proof of Address {formData.is_pasig_resident === '1' ? '(Optional)' : '(Required)'}
                </label>
                <div className="youth-auth-file-input-wrapper">
                  <input
                    type="file"
                    id="proof_of_address"
                    name="proof_of_address"
                    ref={fileInputRef}
                    className="youth-auth-file-input"
                    onChange={handleChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required={formData.is_pasig_resident === '0'}
                    style={{ display: 'none' }}
                  />
                  <div className="youth-auth-file-input-display">
                    <input
                      type="text"
                      className="youth-auth-form-input"
                      value={fileName || 'No file selected'}
                      readOnly
                      onClick={handleFileButtonClick}
                    />
                    <button
                      type="button"
                      className="youth-auth-file-button"
                      onClick={handleFileButtonClick}
                    >
                      <FaFileUpload /> Browse
                    </button>
                  </div>
                </div>
                {errors.proof_of_address && <span className="youth-auth-input-error">{errors.proof_of_address}</span>}
                <small className="youth-auth-form-hint">
                  Upload a valid ID, utility bill, or proof of residence. Max 2MB (PDF, JPG, PNG)
                  {formData.is_pasig_resident === '0' && <span className="youth-auth-form-hint-required"> - Required for non-Pasig residents</span>}
                </small>
              </div>
            </div>
            
            <div className="youth-auth-form-section">
              <div className="youth-auth-section-title">
                <FaEnvelope />
                <span>Account Security</span>
              </div>
              
              <div className="youth-auth-form-row">
                <div className="youth-auth-form-group">
                  <label htmlFor="password" className="youth-auth-form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      className={`youth-auth-form-input ${errors.password ? 'error' : ''}`}
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={handlePasswordFocus}
                      onBlur={handlePasswordBlur}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('password')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && <span className="youth-auth-input-error">{errors.password}</span>}
                  
                  {/* Only show password requirements when appropriate */}
                  {shouldShowRequirements && (
                    <div className="youth-auth-password-requirements">
                      <div className={`youth-auth-password-requirement ${passwordRequirements.minLength ? 'valid' : 'invalid'}`}>
                        {passwordRequirements.minLength ? <FaCheck /> : <FaTimes />}
                        <span>Use at least 8 characters</span>
                      </div>
                      <div className={`youth-auth-password-requirement ${passwordRequirements.hasLower ? 'valid' : 'invalid'}`}>
                        {passwordRequirements.hasLower ? <FaCheck /> : <FaTimes />}
                        <span>Use a lowercase letter</span>
                      </div>
                      <div className={`youth-auth-password-requirement ${passwordRequirements.hasUpper ? 'valid' : 'invalid'}`}>
                        {passwordRequirements.hasUpper ? <FaCheck /> : <FaTimes />}
                        <span>Use an uppercase letter</span>
                      </div>
                      <div className={`youth-auth-password-requirement ${passwordRequirements.hasSpecial ? 'valid' : 'invalid'}`}>
                        {passwordRequirements.hasSpecial ? <FaCheck /> : <FaTimes />}
                        <span>Use at least 1 special character (!@#$...)</span>
                      </div>
                      <div className={`youth-auth-password-requirement ${passwordRequirements.hasNumber ? 'valid' : 'invalid'}`}>
                        {passwordRequirements.hasNumber ? <FaCheck /> : <FaTimes />}
                        <span>Use at least 1 number</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="youth-auth-form-group">
                  <label htmlFor="confirmPassword" className="youth-auth-form-label">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      className={`youth-auth-form-input ${errors.confirmPassword ? 'error' : ''}`}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={(e) => validateField('confirmPassword', e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="youth-auth-input-error">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="youth-auth-form-options">
              <label className="youth-auth-form-check">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  required
                />
                <span>I agree to the <NavLink to="/terms" className="youth-auth-form-link">Terms of Service</NavLink> and <NavLink to="/privacy" className="youth-auth-form-link">Privacy Policy</NavLink></span>
              </label>
              {errors.agreeTerms && <span className="youth-auth-input-error">{errors.agreeTerms}</span>}
            </div>
            
            <button 
              type="submit" 
              className="youth-auth-button"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="youth-auth-footer">
            <p>Already have an account? <NavLink to="/login">Sign In</NavLink></p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Signup;