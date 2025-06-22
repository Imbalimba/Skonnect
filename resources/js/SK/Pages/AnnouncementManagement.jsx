import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import moment from 'moment';
import { AuthContext } from '../../Contexts/AuthContext';
import { FaEdit, FaTrash, FaFile, FaArchive, FaUndo, FaChevronDown, FaPlus, FaEye } from 'react-icons/fa';
import Notification from '../Components/Notification';
import ConfirmationDialog from '../Components/ConfirmationDialog';
import searchIcon from '../../assets/search.png';
import '../css/AnnouncementManagement.css';
import ViewAllAnnouncements from '../Components/ViewAllAnnouncements';
import '../css/ViewAllAnnouncements.css';
import { useLocation } from 'react-router-dom';
import AnnouncementActivityLogs from '../Components/AnnouncementActivityLogs';
import '../css/AnnouncementActivityLogs.css';



const AnnouncementManagement = () => {
  const { skUser } = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState([]);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'ManageAnnouncements';
  const [activeTab, setActiveTab] = useState('ManageAnnouncements');
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [viewArchived, setViewArchived] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    visibility: 'public',
    barangay: skUser?.sk_role === 'Federasyon' ? 'all' : (skUser?.sk_station || ''),
    start_date: moment().format('YYYY-MM-DD'),
    end_date: ''
  });
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Add barangay filter state
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  
  // UI state management
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVisibility, setSelectedVisibility] = useState('All');
  const rowsPerPage = 10;
  
  // Form and modal states
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [announcementToArchive, setAnnouncementToArchive] = useState(null);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmAnnouncementId, setConfirmAnnouncementId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: '',
    confirmColor: ''
  });
  
  // Notification state
  const [notification, setNotification] = useState(null);

  // Visibility options for filtering
  const visibilityOptions = ['All', 'public', 'sk_only'];
  
  // Define barangay options
  const barangayOptions = [
    'all',
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
    const tab = queryParams.get('tab') || 'ManageAnnouncements';
    setActiveTab(tab);
  }, [location.search]);


  // Check if user is federation
  const isFederation = skUser?.sk_role === 'Federasyon';

  useEffect(() => {
    if (activeTab === 'ManageAnnouncements') {
      fetchAnnouncements();
    }
  }, [viewArchived, selectedBarangay, activeTab]);
  
  // Handle Escape key press for all modals and forms
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showForm) resetForm();
        if (showViewModal) setShowViewModal(false);
        if (showArchiveModal) closeArchiveModal();
        if (showConfirmDialog) setShowConfirmDialog(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showForm, showViewModal, showArchiveModal, showConfirmDialog]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      let url = `/api/announcements?archived=${viewArchived ? '1' : '0'}`;
      
      // Add barangay filter for non-federation users
      if (!isFederation) {
        url += `&barangay=${skUser?.sk_station}`;
      } else if (selectedBarangay !== 'all') {
        url += `&barangay=${selectedBarangay}`;
      }
      
      const response = await axios.get(url);
      setAnnouncements(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      showNotification('Failed to load announcements. Please try again.', 'error');
      setLoading(false);
    }
  };

  // Filter announcements based on search query and visibility
  useEffect(() => {
    let filtered = [...announcements];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(announcement => 
        announcement.title.toLowerCase().includes(query) || 
        announcement.content.toLowerCase().includes(query)
      );
    }
    
    // Filter by visibility
    if (selectedVisibility !== 'All') {
      filtered = filtered.filter(announcement => announcement.visibility === selectedVisibility);
    }
    
    setFilteredAnnouncements(filtered);
    setCurrentPage(1);
  }, [announcements, searchQuery, selectedVisibility]);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleConfirmAction = (action, announcementId, config) => {
    setConfirmAction(() => action);
    setConfirmAnnouncementId(announcementId);
    setConfirmConfig(config);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    try {
      await confirmAction(confirmAnnouncementId);
      showNotification(confirmConfig.successMessage, 'success');
    } catch (error) {
      console.error('Error:', error);
      showNotification(confirmConfig.errorMessage || 'An error occurred', 'error');
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare submission data
      const submitData = { ...formData };
      
      // For non-federation users, always use their barangay
      if (!isFederation) {
        submitData.barangay = skUser.sk_station;
      }
      
      if (editingId) {
        await axios.put(`/api/announcements/${editingId}`, submitData);
        showNotification('Announcement updated successfully!', 'success');
      } else {
        await axios.post('/api/announcements', submitData);
        showNotification('Announcement created successfully!', 'success');
      }
      
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      showNotification(error.response?.data?.message || 'Error saving announcement', 'error');
    }
  };

  const handleView = (announcement) => {
    setViewingAnnouncement(announcement);
    setShowViewModal(true);
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      visibility: announcement.visibility,
      barangay: announcement.barangay,
      start_date: moment(announcement.start_date).format('YYYY-MM-DD'),
      end_date: announcement.end_date ? moment(announcement.end_date).format('YYYY-MM-DD') : ''
    });
    setEditingId(announcement.id);
    setShowForm(true);
  };

  const openArchiveModal = (announcement) => {
    setAnnouncementToArchive(announcement);
    setShowArchiveModal(true);
  };

  const closeArchiveModal = () => {
    setAnnouncementToArchive(null);
    setArchiveReason('');
    setShowArchiveModal(false);
  };

  const handleArchive = async () => {
    try {
      await axios.put(`/api/announcements/${announcementToArchive.id}/archive`, {
        archive_reason: archiveReason
      });
      closeArchiveModal();
      showNotification('Announcement archived successfully!', 'success');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error archiving announcement:', error);
      showNotification('Failed to archive announcement. Please try again.', 'error');
    }
  };

  const handleRestore = (id) => {
    const restoreAction = async (id) => {
      await axios.put(`/api/announcements/${id}/restore`);
      fetchAnnouncements();
    };
  
    handleConfirmAction(
      restoreAction,
      id,
      {
        title: 'Restore Announcement',
        message: 'Are you sure you want to restore this announcement?',
        confirmText: 'Restore',
        confirmColor: 'success',
        successMessage: 'Announcement restored successfully!',
        errorMessage: 'Error restoring announcement. Please try again.'
      }
    );
  };

  const handleDelete = (id) => {
    const deleteAction = async (id) => {
      await axios.delete(`/api/announcements/${id}`);
      fetchAnnouncements();
    };
  
    handleConfirmAction(
      deleteAction,
      id,
      {
        title: 'Delete Announcement',
        message: 'Are you sure you want to permanently delete this announcement?',
        confirmText: 'Delete',
        confirmColor: 'danger',
        successMessage: 'Announcement deleted successfully!',
        errorMessage: 'Error deleting announcement. Please try again.'
      }
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      visibility: 'public',
      barangay: isFederation ? 'all' : skUser?.sk_station,
      start_date: moment().format('YYYY-MM-DD'),
      end_date: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('MMMM D, YYYY');
  };
  
  // Pagination
  const totalPages = Math.ceil(filteredAnnouncements.length / rowsPerPage);
  const currentAnnouncements = filteredAnnouncements.slice(
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
  
  const handleNewAnnouncementClick = () => {
    setShowForm(true);
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      visibility: 'public',
      barangay: isFederation ? 'all' : skUser?.sk_station,
      start_date: moment().format('YYYY-MM-DD'),
      end_date: ''
    });
  };

  const toggleArchivedView = () => {
    setViewArchived(!viewArchived);
    setCurrentPage(1);
  };

  // Update the tabs array to include Audit Trail
  const tabs = [
    { id: 'ManageAnnouncements', label: 'Manage Announcements' },
    { id: 'ViewAllAnnouncements', label: 'View All Announcements' },
    { id: 'AuditTrail', label: 'Audit Trail' }
  ];

  return (
    <div className="container announcement-section" style={{ marginTop: "100px" }}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        confirmColor={confirmConfig.confirmColor}
      />
      
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
            {tabs.map(tab => (
              <button 
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {activeTab === 'ManageAnnouncements' && !viewArchived && (
            <div className="new-profile-button" onClick={handleNewAnnouncementClick}>
              <div className="icon">
                <div className="plus">+</div>
              </div>
              <span>New Announcement</span>
            </div>
          )}
        </div>
        
        {activeTab === 'ManageAnnouncements' && (
          <div className="col-md-6 right-side d-flex flex-column align-items-end">
            <div className="search-wrapper mb-2 d-flex align-items-center w-100">
              <div className="search-input-wrapper flex-grow-1">
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <img src={searchIcon} alt="Search" className="search-icon" />
              </div>
            </div>
            <div className="d-flex align-items-center">
              {/* Add barangay filter for federation users */}
              {isFederation && (
                <div className="barangay-dropdown-wrapper position-relative me-3">
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
                        {barangay === 'all' ? 'All Barangays' : barangay}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="dropdown-icon" />
                </div>
              )}
              
              <div className="visibility-dropdown-wrapper position-relative ms-3">
                <select
                  className="form-control visibility-dropdown appearance-none pr-4"
                  value={selectedVisibility}
                  onChange={(e) => {
                    setSelectedVisibility(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  {visibilityOptions.map((visibility, index) => (
                    <option key={index} value={visibility}>
                      {visibility === 'All' ? 'All Visibilities' : visibility.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="dropdown-icon" />
              </div>
            </div>
            <button 
              className={`archive-toggle-btn mt-3 ${viewArchived ? 'viewing-archived' : ''}`}
              onClick={toggleArchivedView}
            >
              {viewArchived ? (
                <>
                  <FaFile className="me-2" /> View Active Announcements
                </>
              ) : (
                <>
                  <FaArchive className="me-2" /> View Archived Announcements
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {activeTab === 'ManageAnnouncements' && (
        <>
          {viewArchived && (
            <div className="archive-banner">
              <FaArchive className="me-2" /> 
              You are viewing archived announcements. These announcements are not active.
            </div>
          )}
          
          {loading ? (
            <div>Loading announcements...</div>
          ) : (
            <div className="table-container">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Content</th>
                    <th>Visibility</th>
                    <th>Barangay</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    {viewArchived && <th>Archive Reason</th>}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAnnouncements.length > 0 ? (
                    currentAnnouncements.map(announcement => {
                      // Hide "All Barangays" announcements from non-Federation users
                      if (!isFederation && announcement.barangay === 'all') {
                        return null;
                      }
                      
                      return (
                        <tr key={announcement.id} className={viewArchived ? 'archived-row' : ''}>
                          <td>{announcement.title}</td>
                          <td className="content-cell">{announcement.content}</td>
                          <td>
                            <span className={`visibility-badge ${announcement.visibility}`}>
                              {announcement.visibility.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className="barangay-badge">
                              {announcement.barangay === 'all' ? 'All Barangays' : announcement.barangay}
                            </span>
                          </td>
                          <td>{formatDate(announcement.start_date)}</td>
                          <td>{announcement.end_date ? formatDate(announcement.end_date) : '-'}</td>
                          {viewArchived && <td>{announcement.archive_reason}</td>}
                          <td>
                            <div className="d-flex">
                              <button 
                                className="btn btn-info btn-sm mx-1" 
                                onClick={() => handleView(announcement)}
                                title="View Announcement"
                              >
                                <FaEye />
                              </button>
                              {!viewArchived ? (
                                <>
                                  {/* Disable edit/archive for non-Federation users on "All Barangays" announcements */}
                                  <button 
                                    className={`btn btn-primary btn-sm mx-1 ${(!isFederation && announcement.barangay === 'all') ? 'disabled' : ''}`} 
                                    onClick={() => handleEdit(announcement)}
                                    title={(!isFederation && announcement.barangay === 'all') ? 
                                      "Only Federation can edit All Barangays announcements" : 
                                      "Edit Announcement"}
                                    disabled={!isFederation && announcement.barangay === 'all'}
                                  >
                                    <FaEdit />
                                  </button>
                                  <button 
                                    className={`btn btn-warning btn-sm ${(!isFederation && announcement.barangay === 'all') ? 'disabled' : ''}`} 
                                    onClick={() => openArchiveModal(announcement)}
                                    title={(!isFederation && announcement.barangay === 'all') ? 
                                      "Only Federation can archive All Barangays announcements" : 
                                      "Archive Announcement"}
                                    disabled={!isFederation && announcement.barangay === 'all'}
                                  >
                                    <FaArchive />
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Disable restore/delete for non-Federation users on "All Barangays" announcements */}
                                  <button 
                                    className={`btn btn-primary btn-sm mx-1 ${(!isFederation && announcement.barangay === 'all') ? 'disabled' : ''}`} 
                                    onClick={() => handleRestore(announcement.id)}
                                    title={(!isFederation && announcement.barangay === 'all') ? 
                                      "Only Federation can restore All Barangays announcements" : 
                                      "Restore Announcement"}
                                    disabled={!isFederation && announcement.barangay === 'all'}
                                  >
                                    <FaUndo />
                                  </button>
                                  <button 
                                    className={`btn btn-danger btn-sm ${(!isFederation && announcement.barangay === 'all') ? 'disabled' : ''}`} 
                                    onClick={() => handleDelete(announcement.id)}
                                    title={(!isFederation && announcement.barangay === 'all') ? 
                                      "Only Federation can delete All Barangays announcements" : 
                                      "Delete Announcement"}
                                    disabled={!isFederation && announcement.barangay === 'all'}
                                  >
                                    <FaTrash />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={viewArchived ? 8 : 7}>
                        {viewArchived ? "No archived announcements found." : "No active announcements found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
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
      )}
      
      {activeTab === 'ViewAllAnnouncements' && (
        <ViewAllAnnouncements isArchiveMode={false} />
      )}

      {activeTab === 'AuditTrail' && (
        <div className="audit-trail-section">
          <AnnouncementActivityLogs />
        </div>
      )}
      
      {/* Announcement Form Modal */}
      {showForm && (
        <div className="form-overlay">
          <div className="outer-box">
            <button className="close-btn" onClick={resetForm}>&times;</button>
            <h2 className="form-title">
              {editingId ? 'Edit Announcement' : 'Add New Announcement'}
            </h2>
            <div className="inner-box">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3 className="section-title">Announcement Information</h3>
                  <div className="form-group">
                    <div className="input-container">
                      <input
                        type="text"
                        className="form-input"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                      <label className="input-label">Title</label>
                    </div>
                    
                    <div className="input-container" style={{ flexBasis: '100%', maxWidth: '100%' }}>
                      <textarea
                        className="form-input"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        rows="5"
                        required
                      />
                      <label className="input-label">Content</label>
                    </div>
                    
                    <div className="input-container">
                      <select
                        className="form-input"
                        name="visibility"
                        value={formData.visibility}
                        onChange={handleChange}
                        required
                      >
                        <option value="public">Public</option>
                        <option value="sk_only">SK Only</option>
                      </select>
                      <label className="input-label">Visibility</label>
                    </div>
                    
                    {/* Barangay selector - only for federation users */}
                    {isFederation ? (
                      <div className="input-container">
                        <select
                          className="form-input"
                          name="barangay"
                          value={formData.barangay}
                          onChange={handleChange}
                          required
                        >
                          {barangayOptions.map((barangay, index) => (
                            <option key={index} value={barangay}>
                              {barangay === 'all' ? 'All Barangays' : barangay}
                            </option>
                          ))}
                        </select>
                        <label className="input-label">Barangay</label>
                      </div>
                    ) : (
                      <div className="input-container">
                        <input
                          type="text"
                          className="form-input"
                          value={skUser?.sk_station || ''}
                          disabled
                        />
                        <label className="input-label">Barangay (Fixed)</label>
                      </div>
                    )}
                    
                    <div className="input-container">
                      <input
                        type="date"
                        className="form-input"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                      />
                      <label className="input-label">Start Date</label>
                    </div>
                    
                    <div className="input-container">
                      <input
                        type="date"
                        className="form-input"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        min={formData.start_date}
                      />
                      <label className="input-label">End Date (Optional)</label>
                    </div>
                  </div>
                </div>
                
                <div className="button-container">
                  <button type="button" className="prev-btn" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    {editingId ? 'Update Announcement' : 'Save Announcement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* View Announcement Modal */}
      {showViewModal && viewingAnnouncement && (
        <div className="form-overlay">
          <div className="outer-box">
            <button className="close-btn" onClick={() => setShowViewModal(false)}>&times;</button>
            <h2 className="form-title">View Announcement</h2>
            <div className="inner-box">
              <div className="form-section">
                <h3 className="section-title">Announcement Details</h3>
                <div className="form-group">
                  <div className="input-container">
                    <input
                      type="text"
                      className="form-input"
                      value={viewingAnnouncement.title}
                      readOnly
                    />
                    <label className="input-label">Title</label>
                  </div>
                  
                  <div className="input-container" style={{ flexBasis: '100%', maxWidth: '100%' }}>
                    <textarea
                      className="form-input"
                      value={viewingAnnouncement.content}
                      rows="5"
                      readOnly
                    />
                    <label className="input-label">Content</label>
                  </div>
                  
                  <div className="input-container">
                    <input
                      type="text"
                      className="form-input"
                      value={viewingAnnouncement.visibility.replace('_', ' ').toUpperCase()}
                      readOnly
                    />
                    <label className="input-label">Visibility</label>
                  </div>
                  
                  <div className="input-container">
                    <input
                      type="text"
                      className="form-input"
                      value={viewingAnnouncement.barangay === 'all' ? 'All Barangays' : viewingAnnouncement.barangay}
                      readOnly
                    />
                    <label className="input-label">Barangay</label>
                  </div>
                  
                  <div className="input-container">
                    <input
                      type="text"
                      className="form-input"
                      value={formatDate(viewingAnnouncement.start_date)}
                      readOnly
                    />
                    <label className="input-label">Start Date</label>
                  </div>
                  
                  <div className="input-container">
                    <input
                      type="text"
                      className="form-input"
                      value={viewingAnnouncement.end_date ? formatDate(viewingAnnouncement.end_date) : '-'}
                      readOnly
                    />
                    <label className="input-label">End Date</label>
                  </div>
                  
                  <div className="input-container">
                    <input
                      type="text"
                      className="form-input"
                      value={`${viewingAnnouncement.skaccount?.first_name} ${viewingAnnouncement.skaccount?.last_name}`}
                      readOnly
                    />
                    <label className="input-label">Created By</label>
                  </div>
                  
                  {viewArchived && (
                    <div className="input-container">
                      <input
                        type="text"
                        className="form-input"
                        value={viewingAnnouncement.archive_reason || '-'}
                        readOnly
                      />
                      <label className="input-label">Archive Reason</label>
                      </div>
                  )}
                </div>
              </div>
              
              <div className="button-container">
                <button 
                  type="button" 
                  className="prev-btn" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Archive Announcement</h3>
              <button className="close-modal-btn" onClick={closeArchiveModal}>×</button>
            </div>
            <div className="modal-body">
              <p>
                You are about to archive the announcement: 
                <strong> {announcementToArchive?.title}</strong>
              </p>
              <p>Archived announcements will no longer appear in the active announcements list but can be restored later.</p>
              
              <div className="form-group mt-3">
                <label htmlFor="archiveReason">Reason for archiving:</label>
                <textarea
                  id="archiveReason"
                  className="form-control"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  rows="3"
                  placeholder="Enter reason for archiving this announcement..."
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={closeArchiveModal}
              >
                Cancel
              </button>
              <button 
                className="btn btn-warning"
                onClick={handleArchive}
              >
                Archive Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManagement;