import React, { useState, useEffect } from 'react';
import { FaUserTie, FaInfoCircle, FaNetworkWired, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import '../css/DirectoryForm.css';

const DirectoryForm = ({ show, onHide, onSave, initialData, skUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    location: '',
    category: 'executive',
    sk_station: skUser.sk_role === 'Federasyon' ? 'Federation' : skUser.sk_station,
    position_order: 999,
    reports_to: null,
  });
  
  const [errors, setErrors] = useState({});
  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Define station options based on the role
  const stationOptions = [
    { value: 'Federation', label: 'Federation' },
    { value: 'Dela Paz', label: 'Dela Paz' },
    { value: 'Manggahan', label: 'Manggahan' },
    { value: 'Maybunga', label: 'Maybunga' },
    { value: 'Pinagbuhatan', label: 'Pinagbuhatan' },
    { value: 'Rosario', label: 'Rosario' },
    { value: 'San Miguel', label: 'San Miguel' },
    { value: 'Santa Lucia', label: 'Santa Lucia' },
    { value: 'Santolan', label: 'Santolan' }
  ];
  
  // Get the user's station options based on their role
  const getUserStationOptions = () => {
    if (skUser.sk_role === 'Federasyon') {
      // Federasyon can select any station
      return stationOptions;
    } else {
      // Other roles can only use their own station
      return stationOptions.filter(station => station.value === skUser.sk_station);
    }
  };
  
  // Load form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        role: initialData.role || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        location: initialData.location || '',
        category: initialData.category || 'executive',
        sk_station: initialData.sk_station || (skUser.sk_role === 'Federasyon' ? 'Federation' : skUser.sk_station),
        position_order: initialData.position_order || 999,
        reports_to: initialData.reports_to || null,
      });
    } else {
      // Reset form for a new directory
      setFormData({
        name: '',
        role: '',
        email: '',
        phone: '',
        location: '',
        category: 'executive',
        sk_station: skUser.sk_role === 'Federasyon' ? 'Federation' : skUser.sk_station,
        position_order: 999,
        reports_to: null,
      });
    }
    
    // Reset errors
    setErrors({});
    
    // Set active tab to basic
    setActiveTab('basic');
    
    // Load available supervisors
    loadAvailableSupervisors();
  }, [initialData, skUser]);
  
  // Load available supervisors for the selected station
  const loadAvailableSupervisors = async () => {
    try {
      setLoading(true);
      const station = formData.sk_station || (skUser.sk_role === 'Federasyon' ? 'Federation' : skUser.sk_station);
      
      const response = await axios.get(`/api/directories/org-chart/${station}`);
      
      // Filter out the current directory (for edit mode)
      const filteredSupervisors = response.data.filter(dir => 
        !initialData || dir.id !== initialData.id
      );
      
      setAvailableSupervisors(filteredSupervisors);
    } catch (error) {
      console.error('Failed to load available supervisors:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle station change to reload supervisors
  useEffect(() => {
    loadAvailableSupervisors();
  }, [formData.sk_station]);
  
  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If changing the station, reset reports_to
    if (name === 'sk_station') {
      setFormData({
        ...formData,
        [name]: value,
        reports_to: null
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error for the field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.role.trim()) {
      newErrors.role = 'Position/Role is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.sk_station) {
      newErrors.sk_station = 'Station is required';
    }
    
    if (formData.position_order && (isNaN(formData.position_order) || formData.position_order < 1)) {
      newErrors.position_order = 'Position order must be a positive number';
    }
    
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Clean up data before submitting
      const dataToSubmit = {
        ...formData,
        position_order: parseInt(formData.position_order) || 999,
        reports_to: formData.reports_to || null
      };
      
      onSave(dataToSubmit);
    } else {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.getElementById(firstErrorField);
      
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
    }
  };
  
  // Format the form title
  const getFormTitle = () => {
    if (initialData) {
      return `Edit Directory: ${initialData.name}`;
    }
    
    return 'Add New Directory Entry';
  };

  // Return null if show is false
  if (!show) {
    return null;
  }

  return (
    <div className="sk-dir-form-overlay" onClick={onHide}>
      <div className="sk-dir-form-container" onClick={(e) => e.stopPropagation()}>
        <div className="sk-dir-form-header">
          <div className="sk-dir-form-title">
            <FaUserTie className="sk-dir-form-icon" />
            <h2>{getFormTitle()}</h2>
          </div>
          <button 
            className="sk-dir-form-close"
            onClick={onHide}
            title="Close"
          >
            <FaTimes />
          </button>
        </div>
        
        <form className="sk-dir-form" onSubmit={handleSubmit}>
          <div className="sk-dir-form-body">
            <div className="sk-dir-form-tabs">
              <div className="sk-dir-form-tab-header">
                <button 
                  type="button"
                  className={`sk-dir-form-tab ${activeTab === 'basic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('basic')}
                >
                  <FaUserTie /> Basic Information
                </button>
                <button 
                  type="button"
                  className={`sk-dir-form-tab ${activeTab === 'organization' ? 'active' : ''}`}
                  onClick={() => setActiveTab('organization')}
                >
                  <FaNetworkWired /> Organization
                </button>
              </div>
              
              <div className="sk-dir-form-tab-content">
                {/* Basic Information Tab */}
                <div className={`sk-dir-form-tab-pane ${activeTab === 'basic' ? 'active' : ''}`}>
                  <div className="sk-dir-form-row">
                    <div className="sk-dir-form-group">
                      <label htmlFor="name" className="sk-dir-form-label">
                        Name <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`sk-dir-form-input ${errors.name ? 'sk-dir-form-input-error' : ''}`}
                        placeholder="Enter full name"
                      />
                      {errors.name && <div className="sk-dir-form-error">{errors.name}</div>}
                    </div>
                    
                    <div className="sk-dir-form-group">
                      <label htmlFor="role" className="sk-dir-form-label">
                        Position/Role <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className={`sk-dir-form-input ${errors.role ? 'sk-dir-form-input-error' : ''}`}
                        placeholder="Enter position or role"
                      />
                      {errors.role && <div className="sk-dir-form-error">{errors.role}</div>}
                    </div>
                  </div>
                  
                  <div className="sk-dir-form-row">
                    <div className="sk-dir-form-group">
                      <label htmlFor="email" className="sk-dir-form-label">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`sk-dir-form-input ${errors.email ? 'sk-dir-form-input-error' : ''}`}
                        placeholder="Enter email address"
                      />
                      {errors.email && <div className="sk-dir-form-error">{errors.email}</div>}
                    </div>
                    
                    <div className="sk-dir-form-group">
                      <label htmlFor="phone" className="sk-dir-form-label">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`sk-dir-form-input ${errors.phone ? 'sk-dir-form-input-error' : ''}`}
                        placeholder="Enter phone number"
                      />
                      {errors.phone && <div className="sk-dir-form-error">{errors.phone}</div>}
                    </div>
                  </div>
                  
                  <div className="sk-dir-form-group">
                    <label htmlFor="location" className="sk-dir-form-label">
                      Office Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={`sk-dir-form-input ${errors.location ? 'sk-dir-form-input-error' : ''}`}
                      placeholder="Enter office location"
                    />
                    {errors.location && <div className="sk-dir-form-error">{errors.location}</div>}
                  </div>
                  
                  <div className="sk-dir-form-row">
                    <div className="sk-dir-form-group">
                      <label htmlFor="category" className="sk-dir-form-label">
                        Category <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className={`sk-dir-form-select ${errors.category ? 'sk-dir-form-input-error' : ''}`}
                      >
                        <option value="executive">Executive Committee</option>
                        <option value="committee">Committee</option>
                        <option value="barangay">Barangay SK</option>
                        <option value="partner">Partner Agency</option>
                      </select>
                      {errors.category && <div className="sk-dir-form-error">{errors.category}</div>}
                    </div>
                    
                    <div className="sk-dir-form-group">
                      <label htmlFor="sk_station" className="sk-dir-form-label">
                        Station <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        id="sk_station"
                        name="sk_station"
                        value={formData.sk_station}
                        onChange={handleChange}
                        className={`sk-dir-form-select ${errors.sk_station ? 'sk-dir-form-input-error' : ''}`}
                        disabled={skUser.sk_role !== 'Federasyon'}
                      >
                        {getUserStationOptions().map(station => (
                          <option key={station.value} value={station.value}>
                            {station.label}
                          </option>
                        ))}
                      </select>
                      {errors.sk_station && <div className="sk-dir-form-error">{errors.sk_station}</div>}
                      
                      {skUser.sk_role !== 'Federasyon' && (
                        <div className="sk-dir-form-help">
                          <FaInfoCircle /> 
                          Non-Federation users can only create directories for their own station.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Organization Tab */}
                <div className={`sk-dir-form-tab-pane ${activeTab === 'organization' ? 'active' : ''}`}>
                  <div className="sk-dir-form-organization-info">
                    <h3 className="sk-dir-form-section-title">Organization Structure</h3>
                    <p className="sk-dir-form-section-desc">
                      Define the position and reporting structure for the organizational chart.
                    </p>
                  </div>
                  
                  <div className="sk-dir-form-row">
                    <div className="sk-dir-form-group">
                      <label htmlFor="position_order" className="sk-dir-form-label">
                        Position Order
                      </label>
                      <input
                        type="number"
                        id="position_order"
                        name="position_order"
                        value={formData.position_order}
                        onChange={handleChange}
                        className={`sk-dir-form-input ${errors.position_order ? 'sk-dir-form-input-error' : ''}`}
                        placeholder="Enter position order (lower = higher rank)"
                      />
                      {errors.position_order && <div className="sk-dir-form-error">{errors.position_order}</div>}
                      
                      <div className="sk-dir-form-help">
                        <FaInfoCircle /> 
                        Lower numbers appear higher in the organization chart. Use 1 for the highest position.
                      </div>
                    </div>
                    
                    <div className="sk-dir-form-group">
                      <label htmlFor="reports_to" className="sk-dir-form-label">
                        Reports To
                      </label>
                      <select
                        id="reports_to"
                        name="reports_to"
                        value={formData.reports_to || ''}
                        onChange={handleChange}
                        className={`sk-dir-form-select ${errors.reports_to ? 'sk-dir-form-input-error' : ''}`}
                      >
                        <option value="">-- No Direct Supervisor --</option>
                        {availableSupervisors.map(supervisor => (
                          <option key={supervisor.id} value={supervisor.id}>
                            {supervisor.name} - {supervisor.role}
                          </option>
                        ))}
                      </select>
                      {errors.reports_to && <div className="sk-dir-form-error">{errors.reports_to}</div>}
                      
                      <div className="sk-dir-form-help">
                        <FaInfoCircle /> 
                        Set the direct supervisor for this position in the organization chart.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="sk-dir-form-footer">
            <button
              type="button"
              onClick={onHide}
              className="sk-dir-form-btn sk-dir-form-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="sk-dir-form-btn sk-dir-form-btn-save"
              disabled={loading}
            >
              {loading ? 'Saving...' : (initialData ? 'Update Directory' : 'Add Directory')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DirectoryForm;