import React, { useState, useEffect, useMemo, useContext } from 'react';
import { FaEdit, FaTrash, FaUser, FaArchive, FaUndo, FaChevronDown } from 'react-icons/fa';
import searchIcon from '../../assets/search.png';
import axios from 'axios';
import KatipunanKabataanForm from '../Components/KatipunanKabataanForm';
import Notification from '../Components/Notification';
import ConfirmationDialog from '../Components/ConfirmationDialog';
import Demographics from '../Components/Demographics'; 
import YouthProfilePdfExport from '../Components/YouthProfilePdfExport';
import '../css/KKProfile.css';
import Forecast from '../Components/Forecast';
import { AuthContext } from '../../Contexts/AuthContext';
import Participation from '../Components/Participation';
import ProfileActivityLogs from '../Components/ProfileActivityLogs';


const KKProfiling = () => {
  const [showForm, setShowForm] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [editProfileData, setEditProfileData] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [profileDetailsPage, setProfileDetailsPage] = useState(1);
  const [editFormPage, setEditFormPage] = useState(1);
  const [selectedBarangay, setSelectedBarangay] = useState('All');
  const [viewArchived, setViewArchived] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [profileToArchive, setProfileToArchive] = useState(null);
  const [activeTab, setActiveTab] = useState('Profiles');
  const { skUser } = useContext(AuthContext);
  const rowsPerPage = 10;

  // Notification state
  const [notification, setNotification] = useState(null);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmProfileId, setConfirmProfileId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: '',
    confirmColor: ''
  });
  
  // Determine if user is federation admin (can see all barangays)
  const isFederationAdmin = skUser?.sk_role === 'Federasyon';
  
  // Set available barangay options based on user role
  const barangayOptions = useMemo(() => {
    // If user is federation admin, show all barangays
    if (isFederationAdmin) {
      return ['All', 'Dela Paz', 'Manggahan', 'Maybunga', 'Pinagbuhatan', 'Rosario', 'San Miguel', 'Santa Lucia', 'Santolan'];
    }
    // If regular SK user, only show their assigned barangay
    return skUser ? ['All', skUser.sk_station] : ['All'];
  }, [skUser, isFederationAdmin]);

  useEffect(() => {
    if (skUser && !isFederationAdmin) {
      setSelectedBarangay(skUser.sk_station);
    } else {
      setSelectedBarangay('All');
    }
  }, [skUser, isFederationAdmin]);

  // Key event listener for closing modals with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showForm) setShowForm(false);
        if (selectedProfile) handleCloseProfileDetails();
        if (showEditForm) handleCloseEditForm();
        if (showArchiveModal) {
          setShowArchiveModal(false);
          setArchiveReason('');
          setProfileToArchive(null);
        }
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
  
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showForm, selectedProfile, showEditForm, showArchiveModal]);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000); // Auto-close after 3 seconds
  };

  // Fetch profiles on component mount and when viewArchived changes
  useEffect(() => {
    fetchProfiles();
  }, [viewArchived]);

  // Fetch profiles from API
  const fetchProfiles = async () => {
    try {
      // Build query parameters
      let params = new URLSearchParams();
      
      // Add archived status param
      params.append('archived', viewArchived ? '1' : '0');
      
      // If not federation admin, filter by user's barangay
      if (skUser && !isFederationAdmin) {
        params.append('barangay', skUser.sk_station);
      }
      
      // Make the API call with the params
      const response = await axios.get(`/api/profiles?${params.toString()}`);
      setProfiles(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setLoading(false);
    }
  };

  // Filter profiles by selected barangay
  useEffect(() => {
    if (selectedBarangay === 'All') {
      setFilteredProfiles(profiles);
    } else {
      setFilteredProfiles(profiles.filter(profile => profile.barangay === selectedBarangay));
    }
  }, [selectedBarangay, profiles]);

  const handleConfirmAction = (action, profileId, config) => {
    setConfirmAction(() => action);
    setConfirmProfileId(profileId);
    setConfirmConfig(config);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    try {
      await confirmAction(confirmProfileId);
      showNotification(confirmConfig.successMessage, 'success');
    } catch (error) {
      console.error('Error:', error);
      showNotification(confirmConfig.errorMessage || 'An error occurred', 'error');
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
  };

  const handleNewProfileClick = () => {
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    fetchProfiles(); // Refresh the profiles list after form is closed
  };

  const handleCloseProfileDetails = () => {
    setSelectedProfile(null);
    setProfileDetailsPage(1);
  };

  const handleDelete = (id) => {
    const deleteAction = async (id) => {
      await axios.delete(`/api/profiles/${id}`);
      setProfiles(profiles.filter(profile => profile.id !== id));
    };
  
    handleConfirmAction(
      deleteAction,
      id,
      {
        title: 'Delete Profile',
        message: 'Are you sure you want to permanently delete this profile?',
        confirmText: 'Delete',
        confirmColor: 'danger',
        successMessage: 'Profile deleted successfully!',
        errorMessage: 'Error deleting profile. Please try again.'
      }
    );
  };

  const handleArchiveClick = (profile) => {
    setProfileToArchive(profile);
    setShowArchiveModal(true);
  };

  const handleArchiveSubmit = async () => {
    try {
      await axios.put(`/api/profiles/${profileToArchive.id}/archive`, {
        archive_reason: archiveReason
      });
      
      // If we're viewing active profiles, remove this profile from the list
      if (!viewArchived) {
        setProfiles(profiles.filter(profile => profile.id !== profileToArchive.id));
      } else {
        // If we're already viewing archived profiles, refresh the list
        fetchProfiles();
      }
      
      // Close the modal and reset values
      setShowArchiveModal(false);
      setArchiveReason('');
      setProfileToArchive(null);
      
      showNotification('Profile archived successfully!', 'success');
      
      // If the profile being archived is currently selected for viewing, close the detail view
      if (selectedProfile && selectedProfile.id === profileToArchive.id) {
        setSelectedProfile(null);
      }
    } catch (error) {
      console.error('Error archiving profile:', error);
      showNotification('Error archiving profile. Please try again.', 'error');
    }
  };

  const handleRestore = (id) => {
    const restoreAction = async (id) => {
      await axios.put(`/api/profiles/${id}/restore`);
      if (viewArchived) {
        setProfiles(profiles.filter(profile => profile.id !== id));
      } else {
        fetchProfiles();
      }
    };

    handleConfirmAction(
      restoreAction,
      id,
      {
        title: 'Restore Profile',
        message: 'Are you sure you want to restore this profile?',
        confirmText: 'Restore',
        confirmColor: 'success',
        successMessage: 'Profile restored successfully!',
        errorMessage: 'Error restoring profile. Please try again.'
      }
    );
  };

  const handleEdit = (profile) => {
    let barangayValue = profile.barangay;
    if (skUser && !isFederationAdmin) {
      barangayValue = skUser.sk_station;
    }
    
    // Set all the profile data for editing
    setEditProfileData({
      id: profile.id,
      first_name: profile.first_name,
      middle_name: profile.middle_name,
      last_name: profile.last_name,
      address: profile.address,
      barangay: barangayValue,
      gender: profile.gender,
      birthdate: profile.birthdate,
      age: profile.age,
      email: profile.email,
      phone_number: profile.phone_number,
      civil_status: profile.civil_status,
      youth_classification: profile.youth_classification,
      youth_age_group: profile.youth_age_group,
      educational_background: profile.educational_background,
      work_status: profile.work_status,
      sk_voter: profile.sk_voter,
      national_voter: profile.national_voter,
      kk_assembly_attendance: profile.kk_assembly_attendance,
      did_vote_last_election: profile.did_vote_last_election,
      kk_assembly_attendance_times: profile.kk_assembly_attendance_times,
      reason_for_not_attending: profile.reason_for_not_attending,
      soloparent: profile.soloparent,
      num_of_children: profile.num_of_children,
      pwd: profile.pwd,
      pwd_years: profile.pwd_years,
      athlete: profile.athlete,
      sport_name: profile.sport_name,
      scholar: profile.scholar,
      pasigscholar: profile.pasigscholar,
      scholarship_name: profile.scholarship_name,
      studying_level: profile.studying_level,
      yearlevel: profile.yearlevel,
      school_name: profile.school_name,
      working_status: profile.working_status,
      company_name: profile.company_name,
      position_name: profile.position_name,
      licensed_professional: profile.licensed_professional,
      employment_yrs: profile.employment_yrs,
      monthly_income: profile.monthly_income,
      youth_org: profile.youth_org,
      org_name: profile.org_name,
      org_position: profile.org_position,
      lgbtqia_member: profile.lgbtqia_member,
      osyranking: profile.osyranking
    });
    
    setShowEditForm(true);
    setEditFormPage(1);
  };
  
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

  const calculateYouthAgeGroup = (age) => {
    if (age >= 15 && age <= 17) return "Child Youth(15-17 yrs old)";
    if (age >= 18 && age <= 24) return "Core Youth(18-24 yrs old)";
    if (age >= 25 && age <= 30) return "Young Adult(25-30 yrs old)";
    return "Not Applicable";
  };

  const handleEditInputChange = (field, value) => {
    // Skip changes to barangay field if user is not federation admin
    if (field === 'barangay' && !isFederationAdmin && skUser) {
      return;
    }
  
    setEditProfileData((prev) => {
      const updatedData = { ...prev, [field]: value };
  
      // Handle kk_assembly_attendance field
      if (field === 'kk_assembly_attendance') {
        if (value === 'Yes') {
          updatedData.reason_for_not_attending_previous = prev.reason_for_not_attending;
          updatedData.reason_for_not_attending = 'N/A';
        } else if (value === 'No') {
          updatedData.kk_assembly_attendance_times_previous = prev.kk_assembly_attendance_times;
          updatedData.kk_assembly_attendance_times = 'N/A';
        }
  
        if (value === 'No' && prev.reason_for_not_attending_previous) {
          updatedData.reason_for_not_attending = prev.reason_for_not_attending_previous;
        } else if (value === 'Yes' && prev.kk_assembly_attendance_times_previous) {
          updatedData.kk_assembly_attendance_times = prev.kk_assembly_attendance_times_previous;
        }
      }
      
      // Handle birthdate field
      if (field === 'birthdate') {
        const calculatedAge = calculateAge(value);
        const youthAgeGroup = calculateYouthAgeGroup(calculatedAge);
        updatedData.age = calculatedAge;
        updatedData.youth_age_group = youthAgeGroup;
      }
  
      // Handle soloparent field
      if (field === 'soloparent' && value === 'No') {
        updatedData.num_of_children = '';
      }
  
      // Handle pwd field
      if (field === 'pwd' && value === 'No') {
        updatedData.pwd_years = '';
      }
  
      // Handle athlete field
      if (field === 'athlete' && value === 'No') {
        updatedData.sport_name = '';
      }
  
      // Handle scholar field
      if (field === 'scholar') {
        if (value === 'No') {
          updatedData.pasigscholar = '';
          updatedData.scholarship_name = '';
        }
      }
  
      // Handle pasigscholar field
      if (field === 'pasigscholar' && value === 'Yes') {
        updatedData.scholarship_name = '';
      }
  
      // Handle studying_level field
      if (field === 'studying_level') {
        if (value === 'Not Studying') {
          updatedData.yearlevel = '';
          updatedData.school_name = '';
        }
      }
  
      // Handle working_status field
      if (field === 'working_status' && value === 'No') {
        updatedData.company_name = '';
        updatedData.position_name = '';
        updatedData.licensed_professional = '';
        updatedData.employment_yrs = '';
        updatedData.monthly_income = '';
      }
  
      // Handle youth_org field
      if (field === 'youth_org' && value === 'No') {
        updatedData.org_name = '';
        updatedData.org_position = '';
      }
  
      // Auto-set working_status when youth classification is Working Youth
      if (field === 'youth_classification' && value === 'Working Youth') {
        updatedData.working_status = 'Yes';
      }
  
      // Auto-set working_status when work status is Employed or Self Employed
      if (field === 'work_status' && (value === 'Employed' || value === 'Self Employed')) {
        updatedData.working_status = 'Yes';
      }
  
      // Handle youth_classification change to "Out of School Youth"
      if (field === 'youth_classification' && value === 'Out of School Youth') {
        updatedData.studying_level = 'Not Studying';
        updatedData.yearlevel = '';
        updatedData.school_name = '';
      }
  
      // Auto-set PWD to "Yes" when youth classification is "Youth with Specific Needs: Person w/ Disability"
      if (field === 'youth_classification' && value === 'Youth with Specific Needs: Person w/ Disability') {
        updatedData.pwd = 'Yes';
      }

      if (field === 'sk_voter' && value === 'No') {
        updatedData.did_vote_last_election = 'No';
      }
  
      return updatedData;
    });
  };
  
  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare the data to be sent
      const submitData = { ...editProfileData };
      
      // Convert empty strings to null for conditional fields
      const fieldsToNullify = [
        'num_of_children', 'pwd_years', 'sport_name', 'pasigscholar', 
        'scholarship_name', 'yearlevel', 'school_name', 'company_name',
        'position_name', 'licensed_professional', 'employment_yrs',
        'monthly_income', 'org_name', 'org_position'
      ];
      
      fieldsToNullify.forEach(field => {
        if (submitData[field] === '') {
          submitData[field] = null;
        }
      });
  
      // Special handling for studying_level if youth_classification is "Out of School Youth"
      if (submitData.youth_classification === 'Out of School Youth') {
        submitData.studying_level = 'Not Studying';
        submitData.yearlevel = null;
        submitData.school_name = null;
      }
  
      await axios.put(`/api/profiles/${submitData.id}`, submitData);
      setProfiles(profiles.map(profile => 
        profile.id === submitData.id ? submitData : profile
      ));
      showNotification('Profile updated successfully!', 'success');
      setShowEditForm(false);
      setEditProfileData(null);
      setEditFormPage(1);
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Error updating profile. Please try again.', 'error');
    }
  };
  
  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setEditProfileData(null);
    setEditFormPage(1);
  };

 const sortedProfiles = useMemo(() => {
  return [...filteredProfiles].sort((a, b) => {
    // Create a composite search key by combining names
    const getSearchKey = (profile) => {
      const firstName = profile.first_name ? profile.first_name.toLowerCase() : '';
      const middleName = profile.middle_name ? profile.middle_name.toLowerCase() : '';
      const lastName = profile.last_name ? profile.last_name.toLowerCase() : '';
      return `${firstName} ${middleName} ${lastName}`.trim();
    };

    return getSearchKey(a).localeCompare(getSearchKey(b));
  });
}, [filteredProfiles]);

// Binary search function for profiles
const binarySearchProfiles = (query) => {
  if (!query.trim()) return filteredProfiles;

  const lowercaseQuery = query.toLowerCase().trim();
  const results = [];

  const isMatch = (profile) => {
    const firstName = profile.first_name ? profile.first_name.toLowerCase() : '';
    const middleName = profile.middle_name ? profile.middle_name.toLowerCase() : '';
    const lastName = profile.last_name ? profile.last_name.toLowerCase() : '';
    const fullName = `${firstName} ${middleName} ${lastName}`.trim();

    return fullName.includes(lowercaseQuery);
  };

  // Perform binary search to find the first matching profile
  let left = 0;
  let right = sortedProfiles.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const profile = sortedProfiles[mid];
    const fullName = `${profile.first_name || ''} ${profile.middle_name || ''} ${profile.last_name || ''}`.toLowerCase().trim();

    if (fullName.includes(lowercaseQuery)) {
      // Find the leftmost matching profile
      let start = mid;
      while (start > 0 && `${sortedProfiles[start-1].first_name || ''} ${sortedProfiles[start-1].middle_name || ''} ${sortedProfiles[start-1].last_name || ''}`.toLowerCase().trim().includes(lowercaseQuery)) {
        start--;
      }

      // Find the rightmost matching profile
      let end = mid;
      while (end < sortedProfiles.length - 1 && `${sortedProfiles[end+1].first_name || ''} ${sortedProfiles[end+1].middle_name || ''} ${sortedProfiles[end+1].last_name || ''}`.toLowerCase().trim().includes(lowercaseQuery)) {
        end++;
      }

      // Collect all matching profiles
      for (let i = start; i <= end; i++) {
        const currentProfile = sortedProfiles[i];
        if (isMatch(currentProfile)) {
          results.push(currentProfile);
        }
      }
      break;
    } else if (fullName < lowercaseQuery) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return results;
};

  // Get profiles to display based on binary search and filters
 const displayProfiles = useMemo(() => {
  return searchQuery ? binarySearchProfiles(searchQuery) : filteredProfiles;
}, [searchQuery, filteredProfiles, sortedProfiles]);

  // Pagination
  const totalPages = Math.ceil(displayProfiles.length / rowsPerPage);
  const currentProfiles = displayProfiles.slice(
    (currentPage - 1) * rowsPerPage, 
    currentPage * rowsPerPage
  );

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleViewProfile = (profile) => {
    setSelectedProfile(profile);
    setProfileDetailsPage(1);
  };

  const toggleArchivedView = () => {
    setViewArchived(!viewArchived);
    setCurrentPage(1); // Reset to first page when switching views
  };

  return (
    <div className="container profile-section" style={{ marginTop: "100px" }}>
      {/* Notification component */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        confirmColor={confirmConfig.confirmColor}
      />

      {/* Page Header */}
      <div className="row">
        <div className="col-md-6 left-side">
          <div className="user-info">
          <div className="user-avatar">
              {skUser?.first_name?.charAt(0) || 'S'}
            </div>
            <div className="user-name">
              {skUser?.first_name} {skUser?.last_name}
            </div>
          </div>
          <div className="tabs">
      <button 
        className={`tab ${activeTab === 'Profiles' ? 'active' : ''}`}
        onClick={() => setActiveTab('Profiles')}
      >
        Profiles
      </button>
      <button 
        className={`tab ${activeTab === 'Demographics' ? 'active' : ''}`}
        onClick={() => setActiveTab('Demographics')}
      >
        Demographics
      </button>
      <button 
        className={`tab ${activeTab === 'Forecast' ? 'active' : ''}`}
        onClick={() => setActiveTab('Forecast')}
      >
        Forecast
      </button>
      <button 
        className={`tab ${activeTab === 'Participation' ? 'active' : ''}`}
        onClick={() => setActiveTab('Participation')}
      >
        Participation
      </button>
      {['Federasyon', 'SK Chairman', 'SK Secretary'].includes(skUser?.sk_role) && (
        <button 
          className={`tab ${activeTab === 'Audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('Audit')}
        >
          Audit Trail
        </button>
      )}
    </div>
          {!viewArchived && activeTab === 'Profiles' && (
            <div className="new-profile-button" onClick={handleNewProfileClick}>
              <div className="icon">
                <div className="plus">+</div>
              </div>
              <span>New Profile</span>
            </div>
          )}
        </div>

        <div className="col-md-6 right-side d-flex flex-column align-items-end">
          {activeTab === 'Profiles' && (
            <>
              <div className="search-wrapper mb-2 d-flex align-items-center w-100">
                <div className="search-input-wrapper flex-grow-1">
                  <input
                    type="text"
                    className="form-control search-input"
                    placeholder="Search profile..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <img src={searchIcon} alt="Search" className="search-icon" />
                </div>
              </div>
              <div className="d-flex align-items-center">
                {/* Only show barangay dropdown for federation admins */}
                {isFederationAdmin && (
                  <div className="barangay-dropdown-wrapper position-relative ms-3">
                    <select
                      className="form-control barangay-dropdown appearance-none pr-4"
                      value={selectedBarangay}
                      onChange={(e) => {
                        setSelectedBarangay(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      {barangayOptions.map((barangay, index) => (
                        <option key={index} value={barangay}>
                          {barangay}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="dropdown-icon" />
                  </div>
                )}
    
                {/* For non-federation users, show a static indicator of their barangay */}
                {!isFederationAdmin && skUser && (
                  <div className="barangay-indicator ms-3">
                    <span className="badge bg-primary">Barangay: {skUser.sk_station}</span>
                  </div>
                )}
              </div>
              <div className="mt-3"></div>
              <button 
                className={`archive-toggle-btn ${viewArchived ? 'viewing-archived' : ''}`}
                onClick={toggleArchivedView}
              >
                {viewArchived ? (
                  <>
                    <FaUser className="me-2" /> View Active Profiles
                  </>
                ) : (
                  <>
                    <FaArchive className="me-2" /> View Archived Profiles
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Main Content Area */}
      {activeTab === 'Profiles' ? (
        <>
          {/* Archive banner - only shown in Profiles tab */}
          {viewArchived && (
            <div className="archive-banner">
              <FaArchive className="me-2" /> 
              You are viewing archived profiles. These profiles are not active.
            </div>
          )}
          
          {/* Profiles Table */}
          {loading ? (
            <div>Loading profiles...</div>
          ) : (
            <div className="table-scroll-wrapper">
            <div className="table-container">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Middle Name</th>
                    <th>Last Name</th>
                    <th>Gender</th>
                    <th>Birthdate</th>
                    <th>Age</th>
                    <th>Barangay</th>
                    <th>Email Address</th>
                    {viewArchived && <th>Archive Date</th>}
                    {viewArchived && <th>Archive Reason</th>}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProfiles.length > 0 ? (
                    currentProfiles.map(profile => (
                      <tr key={profile.id} className={viewArchived ? 'archived-row' : ''}>
                        <td>{profile.first_name}</td>
                        <td>{profile.middle_name}</td>
                        <td>{profile.last_name}</td>
                        <td>{profile.gender}</td>
                        <td>{profile.birthdate ? profile.birthdate.split('T')[0] : ''}</td>
                        <td>{profile.age}</td>
                        <td>{profile.barangay}</td>
                        <td 
                          className="tooltip-text" 
                          data-tooltip={profile.email}
                        >
                          {profile.email}
                        </td>
                        {viewArchived && <td>{profile.archive_date}</td>}
                        {viewArchived && <td>{profile.archive_reason}</td>} 
                        <td>
                        <div className="action-buttons-wrap">
                        <button className="btn btn-success btn-sm" onClick={() => handleViewProfile(profile)}>
                          <FaUser />
                        </button>

                        {!viewArchived ? (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleEdit(profile)}>
                              <FaEdit />
                            </button>
                            <button className="btn btn-warning btn-sm" onClick={() => handleArchiveClick(profile)}>
                              <FaArchive />
                            </button>
                            <YouthProfilePdfExport profile={profile} buttonType="table-action" />
                          </>
                        ) : (
                          <>
                            <button className="btn btn-primary btn-sm mx-1" onClick={() => handleRestore(profile.id)}>
                              <FaUndo />
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(profile.id)}>
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={viewArchived ? 11 : 9}>
                        {viewArchived ? "No archived profiles found." : "No active profiles found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {/* Pagination */}
          <div className="pagination-container">
            <button 
              className="pagination-btn" 
              onClick={handlePrevious} 
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <div className="page-number">{currentPage}</div>
            <button 
              className="pagination-btn" 
              onClick={handleNext} 
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
        </>
    ) : activeTab === 'Demographics' ? (
      <Demographics />
    ) : activeTab === 'Forecast' ? (
      <Forecast />
    ) : activeTab === 'Participation' ? (
      <Participation />
    ) : activeTab === 'Audit' ? (
      <ProfileActivityLogs />
    ) : null}


      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Archive Profile</h3>
              <button className="close-modal-btn" onClick={() => {
                setShowArchiveModal(false);
                setArchiveReason('');
                setProfileToArchive(null);
              }}>×</button>
            </div>
            <div className="modal-body">
              <p>
                You are about to archive the profile for: 
                <strong> {profileToArchive?.first_name} {profileToArchive?.last_name}</strong>
              </p>
              <p>Archived profiles will no longer appear in the active profiles list but can be restored later.</p>
              
              <div className="form-group mt-3">
                <label htmlFor="archiveReason">Reason for archiving (optional):</label>
                <textarea
                  id="archiveReason"
                  className="form-control"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  rows="3"
                  placeholder="Enter reason for archiving this profile..."
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowArchiveModal(false);
                  setArchiveReason('');
                  setProfileToArchive(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-warning"
                onClick={handleArchiveSubmit}
              >
                Archive Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Profile Form */}
      {showForm && <KatipunanKabataanForm onClose={handleCloseForm} />}

      {/* Profile Details View */}
      {selectedProfile && (
        <div className="form-overlay">
          <div className="outer-box">
            <button className="close-btn" onClick={handleCloseProfileDetails}>&times;</button>
            <h2 className="form-title">Katipunan ng Kabataan Profile</h2>
            <div className="inner-box">
              {profileDetailsPage === 1 && (
                <div>
                  <div className="form-section">
                    <h3 className="section-title">Basic Information</h3>
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">First Name</label>
                        <div className="form-input">{selectedProfile.first_name}</div>
                      </div>
                      <div className="input-container">
                        <label className="input-label">Middle Name</label>
                        <div className="form-input">{selectedProfile.middle_name}</div>
                      </div>
                      <div className="input-container">
                        <label className="input-label">Last Name</label>
                        <div className="form-input">{selectedProfile.last_name}</div>
                      </div>
                      <div className="input-container" style={{ flexBasis: '100%', maxWidth: '100%' }}>
                        <label className="input-label">Address</label>
                        <div className="form-input">{selectedProfile.address}</div>
                      </div>
                      <div className="input-container">
                        <label className="input-label">Barangay</label>
                        <div className="form-input">{selectedProfile.barangay}</div>
                      </div>
                      <div className="input-container">
                        <label className="input-label">Sex Assigned at Birth</label>
                        <div className="form-input">{selectedProfile.gender}</div>
                      </div>
                      <div className="input-container">
                        <label className="input-label">Age</label>
                        <div className="form-input">{selectedProfile.age}</div>
                      </div>
                      <div className="input-container">
                      <label className="input-label">Date of Birth</label>
                      <div className="form-input">
                        {selectedProfile.birthdate ? new Date(selectedProfile.birthdate).toLocaleDateString('en-US') : ''}
                      </div>
                    </div>
                      <div className="input-container">
                        <label className="input-label">Phone Number</label>
                        <div className="form-input">{selectedProfile.phone_number}</div>
                      </div>
                      <div className="input-container">
                        <label className="input-label">Email Address</label>
                        <div className="form-input">{selectedProfile.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="form-section">
                    <h3 className="section-title">Demographics</h3>
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">Civil Status</label>
                        <div className="form-input">{selectedProfile.civil_status}</div>
                      </div>
                      <div className="input-container">
                        <label className="input-label">Youth Classification</label>
                        <div className="form-input">{selectedProfile.youth_classification}</div>
                      </div>
                      <div className="input-container">
                        <label className="input-label">Youth Age Group</label>
                        <div className="form-input">{selectedProfile.youth_age_group}</div>
                      </div>
                      <div className="input-container">
                        <label className="input-label">Educational Background</label>
                        <div className="form-input">{selectedProfile.educational_background}</div>
                      </div>
                      <div className="input-container">
                        <label className="input-label">Work Status</label>
                        <div className="form-input">{selectedProfile.work_status}</div>
                      </div>
                      <div className="input-container">
                        <label className="input-label">SK Voter</label>
                        <div className="form-input">{selectedProfile.sk_voter}</div>
                      </div>
                      <div className="input-container">
                        <label className="input-label">National Voter</label>
                        <div className="form-input">{selectedProfile.national_voter}</div>
                      </div>
                      <div className="input-container">
                        <label className="input-label">Voted Last SK Election</label>
                        <div className="form-input">{selectedProfile.did_vote_last_election}</div>
                      </div>
                      <div className="input-container">
                        <label className="input-label">KK Assembly Attendance</label>
                        <div className="form-input">{selectedProfile.kk_assembly_attendance}</div>
                      </div>
                      {selectedProfile.kk_assembly_attendance === 'Yes' && (
                        <div className="input-container">
                          <label className="input-label">How Many Times Did You Attend?</label>
                          <div className="form-input">{selectedProfile.kk_assembly_attendance_times}</div>
                        </div>
                      )}
                      {selectedProfile.kk_assembly_attendance === 'No' && (
                        <div className="input-container">
                          <label className="input-label">Reason for Not Attending</label>
                          <div className="form-input">{selectedProfile.reason_for_not_attending}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="button-container">
                    <button className="next-btn" onClick={() => setProfileDetailsPage(2)}>Next Page</button>
                  </div>
                </div>
              )}

              {profileDetailsPage === 2 && (
                <div>
                  <div className="form-section">
                    <h3 className="section-title">Additional Questions</h3>
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">Are you a solo parent?</label>
                        <div className="form-input">{selectedProfile.soloparent || 'Not Provided'}</div>
                      </div>
                      {selectedProfile.soloparent === 'Yes' && (
                        <div className="input-container">
                          <label className="input-label">Number of Children</label>
                          <div className="form-input">{selectedProfile.num_of_children || 'Not Provided'}</div>
                        </div>
                      )}
                      <div className="input-container">
                        <label className="input-label">Are you a PWD?</label>
                        <div className="form-input">{selectedProfile.pwd || 'Not Provided'}</div>
                      </div>
                      {selectedProfile.pwd === 'Yes' && (
                        <div className="input-container">
                          <label className="input-label">If yes, for how long? (years)</label>
                          <div className="form-input">{selectedProfile.pwd_years || 'Not Provided'}</div>
                        </div>
                      )}
                      <div className="input-container">
                        <label className="input-label">Are you an athlete?</label>
                        <div className="form-input">{selectedProfile.athlete || 'Not Provided'}</div>
                      </div>
                      {selectedProfile.athlete === 'Yes' && (
                        <div className="input-container">
                          <label className="input-label">If yes, indicate sports</label>
                          <div className="form-input">{selectedProfile.sport_name || 'Not Provided'}</div>
                        </div>
                      )}
                      <div className="input-container">
                        <label className="input-label">Are you a scholar?</label>
                        <div className="form-input">{selectedProfile.scholar || 'Not Provided'}</div>
                      </div>
                      {selectedProfile.scholar === 'Yes' && (
                        <div className="input-container">
                          <label className="input-label">Are you a pasig scholar?</label>
                          <div className="form-input">{selectedProfile.pasigscholar || 'Not Provided'}</div>
                        </div>
                      )}
                      {selectedProfile.scholar === 'Yes' && selectedProfile.pasigscholar === 'No' && (
                        <div className="input-container">
                          <label className="input-label">Scholarship program name</label>
                          <div className="form-input">{selectedProfile.scholarship_name || 'Not Provided'}</div>
                        </div>
                      )}
                      <div className="input-container">
                        <label className="input-label">Study level</label>
                        <div className="form-input">{selectedProfile.studying_level || 'Not Provided'}</div>
                      </div>
                      {selectedProfile.studying_level && selectedProfile.studying_level !== 'Not Studying' && (
                        <>
                          <div className="input-container">
                            <label className="input-label">Year Level</label>
                            <div className="form-input">{selectedProfile.yearlevel || 'Not Provided'}</div>
                          </div>
                          <div className="input-container">
                            <label className="input-label">School</label>
                            <div className="form-input">{selectedProfile.school_name || 'Not Provided'}</div>
                          </div>
                        </>
                      )}
                      <div className="input-container">
                        <label className="input-label">Currently working?</label>
                        <div className="form-input">{selectedProfile.working_status || 'Not Provided'}</div>
                      </div>
                      {selectedProfile.working_status === 'Yes' && (
                        <>
                          <div className="input-container">
                            <label className="input-label">Name of company</label>
                            <div className="form-input">{selectedProfile.company_name || 'Not Provided'}</div>
                          </div>
                          <div className="input-container">
                            <label className="input-label">Position</label>
                            <div className="form-input">{selectedProfile.position_name || 'Not Provided'}</div>
                          </div>
                          <div className="input-container">
                            <label className="input-label">Are you a licensed professional?</label>
                            <div className="form-input">{selectedProfile.licensed_professional || 'Not Provided'}</div>
                          </div>
                          <div className="input-container">
                            <label className="input-label">Years of employment</label>
                            <div className="form-input">{selectedProfile.employment_yrs || 'Not Provided'}</div>
                          </div>
                          <div className="input-container">
                            <label className="input-label">Monthly income range</label>
                            <div className="form-input">{selectedProfile.monthly_income || 'Not Provided'}</div>
                          </div>
                        </>
                      )}
                      <div className="input-container">
                        <label className="input-label">Member of youth organization?</label>
                        <div className="form-input">{selectedProfile.youth_org || 'Not Provided'}</div>
                      </div>
                      {selectedProfile.youth_org === 'Yes' && (
                        <>
                          <div className="input-container">
                            <label className="input-label">Name of organization</label>
                            <div className="form-input">{selectedProfile.org_name || 'Not Provided'}</div>
                          </div>
                          <div className="input-container">
                            <label className="input-label">Position in organization</label>
                            <div className="form-input">{selectedProfile.org_position || 'Not Provided'}</div>
                          </div>
                        </>
                      )}
                      <div className="input-container">
                        <label className="input-label">LGBTQIA+ community member?</label>
                        <div className="form-input">{selectedProfile.lgbtqia_member || 'Not Provided'}</div>
                      </div>
                      {selectedProfile.youth_classification === 'Out of School Youth' && (
                        <div className="input-container">
                          <label className="input-label">OSY Priority Ranking</label>
                          <div className="form-input">
                            {selectedProfile.osyranking 
                              ? (() => {
                                  try {
                                    const ranking = JSON.parse(selectedProfile.osyranking);
                                    return Object.entries(ranking)
                                      .sort((a, b) => a[1] - b[1])
                                      .map(([key, value]) => `${key} (#${value})`)
                                      .join(', ');
                                  } catch (e) {
                                    return selectedProfile.osyranking;
                                  }
                                })()
                              : 'Not Provided'
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="button-container">
                    <button className="prev-btn" onClick={() => setProfileDetailsPage(1)}>Previous</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Form */}
      {showEditForm && (
        <div className="form-overlay">
          <div className="outer-box">
            <button className="close-btn" onClick={handleCloseEditForm}>&times;</button>
            <h2 className="form-title">Edit Profile</h2>
            <div className="inner-box">
              {editFormPage === 1 && (
                <form>
                  <div className="form-section">
                    <h3 className="section-title">Basic Information</h3>
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">First Name</label>
                        <input
                          type="text"
                          className="form-input"
                          name="first_name"
                          value={editProfileData.first_name || ''}
                          onChange={(e) => handleEditInputChange('first_name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="input-container">
                        <label className="input-label">Middle Name</label>
                        <input
                          type="text"
                          className="form-input"
                          name="middle_name"
                          value={editProfileData.middle_name || ''}
                          onChange={(e) => handleEditInputChange('middle_name', e.target.value)}
                        />
                      </div>
                      <div className="input-container">
                        <label className="input-label">Last Name</label>
                        <input
                          type="text"
                          className="form-input"
                          name="last_name"
                          value={editProfileData.last_name || ''}
                          onChange={(e) => handleEditInputChange('last_name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="input-container" style={{ flexBasis: '100%', maxWidth: '100%' }}>
                        <label className="input-label">Address</label>
                        <input
                          type="text"
                          className="form-input"
                          name="address"
                          value={editProfileData.address || ''}
                          onChange={(e) => handleEditInputChange('address', e.target.value)}
                          required
                        />
                      </div>
                      <div className="input-container">
                        <label className="input-label">Barangay {!isFederationAdmin && '(Locked)'}</label>
                        {isFederationAdmin ? (
                          <select
                            className="form-input"
                            name="barangay"
                            value={editProfileData.barangay || ''}
                            onChange={(e) => handleEditInputChange('barangay', e.target.value)}
                            required
                          >
                            <option value="">Select</option>
                            {barangayOptions.filter(b => b !== 'All').map(barangay => (
                              <option key={barangay} value={barangay}>{barangay}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="form-input"
                            name="barangay"
                            value={editProfileData.barangay || ''}
                            disabled
                          />
                        )}
                      </div>
                      <div className="input-container">
                        <label className="input-label">Sex Assigned at Birth</label>
                        <select
                          className="form-input"
                          name="gender"
                          value={editProfileData.gender || ''}
                          onChange={(e) => handleEditInputChange('gender', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="input-container">
                        <label className="input-label">Age (Auto-calculated)</label>
                        <input
                          type="number"
                          className="form-input"
                          name="age"
                          value={editProfileData.age || ''}
                          disabled
                        />
                      </div>
                      <div className="input-container">
                        <label className="input-label">Date of Birth</label>
                        <input
                          type="date"
                          className="form-input"
                          name="birthdate"
                          value={editProfileData.birthdate ? editProfileData.birthdate.split('T')[0] : ''}
                          onChange={(e) => handleEditInputChange('birthdate', e.target.value)}
                          required
                        />
                      </div>
                      <div className="input-container">
                        <label className="input-label">Phone Number</label>
                        <input
                          type="tel"
                          className="form-input"
                          name="phone_number"
                          value={editProfileData.phone_number || ''}
                          onChange={(e) => handleEditInputChange('phone_number', e.target.value)}
                          required
                        />
                      </div>
                      <div className="input-container">
                        <label className="input-label">Email Address</label>
                        <input
                          type="email"
                          className="form-input"
                          name="email"
                          value={editProfileData.email || ''}
                          onChange={(e) => handleEditInputChange('email', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Demographics</h3>
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">Civil Status</label>
                        <select
                          className="form-input"
                          name="civil_status"
                          value={editProfileData.civil_status || ''}
                          onChange={(e) => handleEditInputChange('civil_status', e.target.value)}
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
                        <label className="input-label">Youth Classification</label>
                        <select
                          className="form-input"
                          name="youth_classification"
                          value={editProfileData.youth_classification || ''}
                          onChange={(e) => handleEditInputChange('youth_classification', e.target.value)}
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
                      
                      <div className="input-container">
                        <label className="input-label">Youth Age Group (Auto-calculated)</label>
                        <input 
                          type="text"
                          className="form-input"
                          name="youth_age_group"
                          value={editProfileData.youth_age_group || ''}
                          disabled
                        />
                      </div>
                      
                      <div className="input-container">
                        <label className="input-label">Educational Background</label>
                        <select
                          className="form-input"
                          name="educational_background"
                          value={editProfileData.educational_background || ''}
                          onChange={(e) => handleEditInputChange('educational_background', e.target.value)}
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
                        <label className="input-label">Work Status</label>
                        <select
                          className="form-input"
                          name="work_status"
                          value={editProfileData.work_status || ''}
                          onChange={(e) => handleEditInputChange('work_status', e.target.value)}
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
                      
                      <div className="input-container">
                        <label className="input-label">SK Voter</label>
                        <select
                          className="form-input"
                          name="sk_voter"
                          value={editProfileData.sk_voter || ''}
                          onChange={(e) => handleEditInputChange('sk_voter', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      
                      <div className="input-container">
                        <label className="input-label">National Voter</label>
                        <select
                          className="form-input"
                          name="national_voter"
                          value={editProfileData.national_voter || ''}
                          onChange={(e) => handleEditInputChange('national_voter', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      
                      <div className="input-container">
                        <label className="input-label">Did you vote last SK election?</label>
                        <select
                          className="form-input"
                          name="did_vote_last_election"
                          value={editProfileData.did_vote_last_election || ''}
                          onChange={(e) => handleEditInputChange('did_vote_last_election', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      
                      <div className="input-container">
                        <label className="input-label">KK Assembly Attendance</label>
                        <select
                          className="form-input"
                          name="kk_assembly_attendance"
                          value={editProfileData.kk_assembly_attendance || ''}
                          onChange={(e) => handleEditInputChange('kk_assembly_attendance', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {editProfileData.kk_assembly_attendance === 'Yes' && (
                        <div className="input-container">
                          <label className="input-label">How many times did you attend the assembly?</label>
                          <select
                            className="form-input"
                            name="kk_assembly_attendance_times"
                            value={editProfileData.kk_assembly_attendance_times || ''}
                            onChange={(e) => handleEditInputChange('kk_assembly_attendance_times', e.target.value)}
                            required
                          >
                            <option value="">Select</option>
                            <option value="1-2 Times">1-2 Times</option>
                            <option value="3-4 Times">3-4 Times</option>
                            <option value="5 and above">5 and above</option>
                          </select>
                        </div>
                      )}

                      {editProfileData.kk_assembly_attendance === 'No' && (
                        <div className="input-container">
                          <label className="input-label">Why didn't you attend?</label>
                          <select
                            className="form-input"
                            name="reason_for_not_attending"
                            value={editProfileData.reason_for_not_attending || ''}
                            onChange={(e) => handleEditInputChange('reason_for_not_attending', e.target.value)}
                            required
                          >
                            <option value="">Select</option>
                            <option value="There was no KK Assembly Meeting">There was no KK Assembly Meeting</option>
                            <option value="Not Interested to Attend">Not Interested to Attend</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="button-container">
                    <button type="button" className="next-btn" onClick={() => setEditFormPage(2)}>Next Page</button>
                  </div>
                </form>
              )}

              {editFormPage === 2 && (
                <form onSubmit={handleEditFormSubmit}>
                  <div className="form-section">
                    <h3 className="section-title">Additional Questions</h3>
                    <div className="form-group">
                      <div className="input-container">
                        <label className="input-label">Are you a solo parent?</label>
                        <select
                          className="form-input"
                          name="soloparent"
                          value={editProfileData.soloparent || ''}
                          onChange={(e) => handleEditInputChange('soloparent', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {editProfileData.soloparent === 'Yes' && (
                        <div className="input-container">
                          <label className="input-label">If yes, indicate no. of children</label>
                          <input
                            type="number"
                            className="form-input"
                            name="num_of_children"
                            value={editProfileData.num_of_children || ''}
                            onChange={(e) => handleEditInputChange('num_of_children', e.target.value)}
                            required
                            min="1"
                          />
                        </div>
                      )}

                      <div className="input-container">
                        <label className="input-label">Are you a PWD?</label>
                        <select
                          className="form-input"
                          name="pwd"
                          value={editProfileData.pwd || ''}
                          onChange={(e) => handleEditInputChange('pwd', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {editProfileData.pwd === 'Yes' && (
                        <div className="input-container">
                          <label className="input-label">If yes, for how long? Indicate no. of yrs</label>
                          <input
                            type="number"
                            className="form-input"
                            name="pwd_years"
                            value={editProfileData.pwd_years || ''}
                            onChange={(e) => handleEditInputChange('pwd_years', e.target.value)}
                            required
                            min="1"
                          />
                        </div>
                      )}

                      <div className="input-container">
                        <label className="input-label">Are you an athlete?</label>
                        <select
                          className="form-input"
                          name="athlete"
                          value={editProfileData.athlete || ''}
                          onChange={(e) => handleEditInputChange('athlete', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {editProfileData.athlete === 'Yes' && (
                        <div className="input-container">
                          <label className="input-label">If yes, indicate sports</label>
                          <input
                            type="text"
                            className="form-input"
                            name="sport_name"
                            value={editProfileData.sport_name || ''}
                            onChange={(e) => handleEditInputChange('sport_name', e.target.value)}
                            required
                          />
                        </div>
                      )}

                      <div className="input-container">
                        <label className="input-label">Are you a scholar?</label>
                        <select
                          className="form-input"
                          name="scholar"
                          value={editProfileData.scholar || ''}
                          onChange={(e) => handleEditInputChange('scholar', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {editProfileData.scholar === 'Yes' && (
                        <div className="input-container">
                          <label className="input-label">Are you a pasig scholar?</label>
                          <select
                            className="form-input"
                            name="pasigscholar"
                            value={editProfileData.pasigscholar || ''}
                            onChange={(e) => handleEditInputChange('pasigscholar', e.target.value)}
                            required
                          >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                      )}

                      {editProfileData.scholar === 'Yes' && editProfileData.pasigscholar === 'No' && (
                        <div className="input-container">
                          <label className="input-label">If scholar other than pcs, indicate name of scholarship program</label>
                          <input
                            type="text"
                            className="form-input"
                            name="scholarship_name"
                            value={editProfileData.scholarship_name || ''}
                            onChange={(e) => handleEditInputChange('scholarship_name', e.target.value)}
                            required
                          />
                        </div>
                      )}

                      <div className="input-container">
                        <label className="input-label">If currently studying, indicate level</label>
                        <select
                          className="form-input"
                          name="studying_level"
                          value={editProfileData.studying_level || ''}
                          onChange={(e) => handleEditInputChange('studying_level', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Secondary">Secondary</option>
                          <option value="Tertiary">Tertiary</option>
                          <option value="Graduate Level">Graduate Level</option>
                          <option value="Not Studying">Not Studying</option>
                        </select>
                      </div>

                      {editProfileData.studying_level && editProfileData.studying_level !== 'Not Studying' && (
                        <>
                          <div className="input-container">
                          <label className="input-label">Year Level</label>
                          <input
                            type="number"
                            className="form-input"
                            name="yearlevel"
                            value={editProfileData.yearlevel || ''}
                            onChange={(e) => handleEditInputChange('yearlevel', e.target.value)}
                            required
                            min="1"
                          />
                        </div>
                          <div className="input-container">
                            <label className="input-label">School</label>
                            <input
                              type="text"
                              className="form-input"
                              name="school_name"
                              value={editProfileData.school_name || ''}
                              onChange={(e) => handleEditInputChange('school_name', e.target.value)}
                              required
                            />
                          </div>
                        </>
                      )}

                      <div className="input-container">
                        <label className="input-label">Currently working?</label>
                        <select
                          className="form-input"
                          name="working_status"
                          value={editProfileData.working_status || ''}
                          onChange={(e) => handleEditInputChange('working_status', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {editProfileData.working_status === 'Yes' && (
                        <>
                          <div className="input-container">
                            <label className="input-label">Name of company</label>
                            <input
                              type="text"
                              className="form-input"
                              name="company_name"
                              value={editProfileData.company_name || ''}
                              onChange={(e) => handleEditInputChange('company_name', e.target.value)}
                              required
                            />
                          </div>
                          <div className="input-container">
                            <label className="input-label">Position</label>
                            <input
                              type="text"
                              className="form-input"
                              name="position_name"
                              value={editProfileData.position_name || ''}
                              onChange={(e) => handleEditInputChange('position_name', e.target.value)}
                              required
                            />
                          </div>
                          <div className="input-container">
                            <label className="input-label">Are you a licensed professional?</label>
                            <select
                              className="form-input"
                              name="licensed_professional"
                              value={editProfileData.licensed_professional || ''}
                              onChange={(e) => handleEditInputChange('licensed_professional', e.target.value)}
                              required
                            >
                              <option value="">Select</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                          <div className="input-container">
                            <label className="input-label">Years of employment</label>
                            <input
                              type="number"
                              className="form-input"
                              name="employment_yrs"
                              value={editProfileData.employment_yrs || ''}
                              onChange={(e) => handleEditInputChange('employment_yrs', e.target.value)}
                              required
                              min="1"
                            />
                          </div>
                          <div className="input-container">
                            <label className="input-label">Monthly income range</label>
                            <select
                              className="form-input"
                              name="monthly_income"
                              value={editProfileData.monthly_income || ''}
                              onChange={(e) => handleEditInputChange('monthly_income', e.target.value)}
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
                        </>
                      )}

                      <div className="input-container">
                        <label className="input-label">Are you a member of youth organization in our barangay?</label>
                        <select
                          className="form-input"
                          name="youth_org"
                          value={editProfileData.youth_org || ''}
                          onChange={(e) => handleEditInputChange('youth_org', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {editProfileData.youth_org === 'Yes' && (
                        <>
                          <div className="input-container">
                            <label className="input-label">Indicate the name of the organization</label>
                            <input
                              type="text"
                              className="form-input"
                              name="org_name"
                              value={editProfileData.org_name || ''}
                              onChange={(e) => handleEditInputChange('org_name', e.target.value)}
                              required
                            />
                          </div>
                          <div className="input-container">
                            <label className="input-label">Indicate the position in the organization</label>
                            <input
                              type="text"
                              className="form-input"
                              name="org_position"
                              value={editProfileData.org_position || ''}
                              onChange={(e) => handleEditInputChange('org_position', e.target.value)}
                              required
                            />
                          </div>
                        </>
                      )}

                      <div className="input-container">
                        <label className="input-label">Are you a member/part of the LGBTQIA+ community?</label>
                        <select
                          className="form-input"
                          name="lgbtqia_member"
                          value={editProfileData.lgbtqia_member || ''}
                          onChange={(e) => handleEditInputChange('lgbtqia_member', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {editProfileData.youth_classification === 'Out of School Youth' && (
                        <div className="input-container">
                          <label className="input-label">If an out of school youth, rank from 1 to 3: Employment, Schooling and Business</label>
                          <select
                            className="form-input"
                            name="osyranking"
                            value={editProfileData.osyranking || ''}
                            onChange={(e) => handleEditInputChange('osyranking', e.target.value)}
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
                      )}
                    </div>
                  </div>

                  <div className="button-container">
                    <button type="button" className="prev-btn" onClick={() => setEditFormPage(1)}>Previous</button>
                    <button type="submit" className="submit-btn">Submit</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KKProfiling;