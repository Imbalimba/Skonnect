import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import moment from 'moment';
import { AuthContext } from '../../Contexts/AuthContext';
import { FaEdit, FaTrash, FaFile, FaArchive, FaUndo, FaChevronDown, FaPlus, FaDownload, FaEye } from 'react-icons/fa';
import Notification from '../Components/Notification';
import ConfirmationDialog from '../Components/ConfirmationDialog';
import searchIcon from '../../assets/search.png';
import BarangayPolicies from '../Components/BarangayPolicyManagement';
import PolicyActivityLogs from '../Components/PolicyActivityLogs';
import '../css/PolicyManagement.css';
import '../css/PolicyActivityLogs.css';

const PolicyManagement = () => {
  const { skUser } = useContext(AuthContext);
  
  // Check if the user is a federation admin
  const isFederationAdmin = skUser?.sk_role === 'Federasyon';
  
  // Set the default active tab based on the user's role
  const [activeTab, setActiveTab] = useState(isFederationAdmin ? 'CityPolicies' : 'BarangayPolicies');
  
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [viewArchived, setViewArchived] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'City Ordinance',
    file: null,
    year: new Date().getFullYear()
  });
  
  // UI state management
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const rowsPerPage = 10;
  
  // Form and modal states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [policyToArchive, setPolicyToArchive] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmPolicyId, setConfirmPolicyId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: '',
    confirmColor: ''
  });
  
  // Notification state
  const [notification, setNotification] = useState(null);

  // Categories for filtering
  const categoryOptions = ['All', 'City Ordinance', 'City Resolution'];

  // Update the tabs array to its original state
  const tabs = [
    { id: 'CityPolicies', label: 'City Policies' },
    { id: 'BarangayPolicies', label: 'Barangay Policies' },
    { id: 'AuditTrail', label: 'Audit Trail' }
  ];

  useEffect(() => {
    // Only fetch policies if the user has access to city policies
    if (activeTab === 'CityPolicies' && isFederationAdmin) {
      fetchPolicies();
    }
  }, [viewArchived, activeTab, isFederationAdmin]);
  
  // Handle Escape key press for all modals and forms
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showForm) resetForm();
        if (showArchiveModal) closeArchiveModal();
        if (showPdfPreview) setShowPdfPreview(false);
        if (showConfirmDialog) setShowConfirmDialog(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showForm, showArchiveModal, showPdfPreview, showConfirmDialog]);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/policies?archived=${viewArchived ? 'true' : 'false'}`);
      setPolicies(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching policies:', error);
      showNotification('Failed to load policies. Please try again.', 'error');
      setLoading(false);
    }
  };

  // Filter policies based on search query and category
  useEffect(() => {
    let filtered = [...policies];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(policy => 
        policy.title.toLowerCase().includes(query) || 
        policy.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(policy => policy.category === selectedCategory);
    }
    
    setFilteredPolicies(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [policies, searchQuery, selectedCategory]);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000); // Auto-close after 3 seconds
  };

  const handleConfirmAction = (action, policyId, config) => {
    setConfirmAction(() => action);
    setConfirmPolicyId(policyId);
    setConfirmConfig(config);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    try {
      await confirmAction(confirmPolicyId);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadError(''); // Reset previous errors
    
    if (!file) {
      setFormData({ ...formData, file: null });
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed');
      e.target.value = ''; // Clear the file input
      return;
    }

    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    if (file.size > maxSize) {
      setUploadError('File size exceeds 20MB limit');
      e.target.value = ''; // Clear the file input
      return;
    }

    setFormData({ ...formData, file });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('year', formData.year);
      
      // Only include file if it exists (for updates) or is required (for creates)
      if (formData.file || !editingId) {
        if (!formData.file && !editingId) {
          showNotification('Please select a PDF file', 'error');
          return;
        }
        if (formData.file) {
          data.append('file', formData.file);
        }
      }
  
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Requested-With': 'XMLHttpRequest'
        }
      };
  
      let response;
      if (editingId) {
        response = await axios.post(`/api/policies/${editingId}?_method=PUT`, data, config);
        showNotification('Policy updated successfully!', 'success');
      } else {
        response = await axios.post('/api/policies', data, config);
        showNotification('Policy created successfully!', 'success');
      }
  
      resetForm();
      fetchPolicies();
    } catch (error) {
      console.error('Operation failed:', error);
      if (error.response) {
        showNotification(`Error: ${error.response.data.message || 'Operation failed'}`, 'error');
      } else {
        showNotification('Network error during operation', 'error');
      }
    }
  };

  const handleEdit = (policy) => {
    setFormData({
      title: policy.title,
      description: policy.description,
      category: policy.category,
      file: null, // Keep as null to allow new file selection
      year: policy.year,
      existingFileName: policy.file_path ? policy.file_path.split('/').pop() : null // Store existing filename
    });
    setEditingId(policy.id);
    setShowForm(true);
  };

  const openArchiveModal = (policy) => {
    setPolicyToArchive(policy);
    setShowArchiveModal(true);
  };

  const closeArchiveModal = () => {
    setPolicyToArchive(null);
    setArchiveReason('');
    setShowArchiveModal(false);
  };

  const handleArchive = async () => {
    try {
      await axios.put(`/api/policies/${policyToArchive.id}/archive`, {
        archive_reason: archiveReason
      });
      closeArchiveModal();
      showNotification('Policy archived successfully!', 'success');
      fetchPolicies();
    } catch (error) {
      console.error('Error archiving policy:', error);
      showNotification('Failed to archive policy. Please try again.', 'error');
    }
  };

  const handleRestore = (id) => {
    const restoreAction = async (id) => {
      await axios.put(`/api/policies/${id}/restore`);
      fetchPolicies();
    };
  
    handleConfirmAction(
      restoreAction,
      id,
      {
        title: 'Restore Policy',
        message: 'Are you sure you want to restore this policy?',
        confirmText: 'Restore',
        confirmColor: 'success',
        successMessage: 'Policy restored successfully!',
        errorMessage: 'Error restoring policy. Please try again.'
      }
    );
  };

  const handleDelete = (id) => {
    const deleteAction = async (id) => {
      await axios.delete(`/api/policies/${id}`);
      fetchPolicies();
    };
  
    handleConfirmAction(
      deleteAction,
      id,
      {
        title: 'Delete Policy',
        message: 'Are you sure you want to permanently delete this policy?',
        confirmText: 'Delete',
        confirmColor: 'danger',
        successMessage: 'Policy deleted successfully!',
        errorMessage: 'Error deleting policy. Please try again.'
      }
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'City Ordinance',
      file: null,
      year: new Date().getFullYear()
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('MMMM D, YYYY');
  };
  
  // Pagination
  const totalPages = Math.ceil(filteredPolicies.length / rowsPerPage);
  const currentPolicies = filteredPolicies.slice(
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
  
  const handleNewPolicyClick = () => {
    setShowForm(true);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      category: 'City Ordinance',
      file: null,
      year: new Date().getFullYear()
    });
  };

  const toggleArchivedView = () => {
    setViewArchived(!viewArchived);
    setCurrentPage(1); // Reset to first page when switching views
  };
  
  const openPdfPreview = (policy) => {
    setPreviewUrl(policy.file_url);
    setPreviewTitle(policy.title);
    setShowPdfPreview(true);
  };

  // Function to handle tab switching with permission check
  const handleTabChange = (tab) => {
    // Only allow switching to CityPolicies if user is a federation admin
    if (tab === 'CityPolicies' && !isFederationAdmin) {
      showNotification('You do not have permission to access City Policies', 'error');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="container policy-section" style={{ marginTop: "100px" }}>
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
          
          {activeTab === 'CityPolicies' && !viewArchived && isFederationAdmin && (
            <div className="new-profile-button" onClick={handleNewPolicyClick}>
              <div className="icon">
                <div className="plus">+</div>
              </div>
              <span>New City Policy</span>
            </div>
          )}
        </div>
        
        {activeTab === 'CityPolicies' && isFederationAdmin && (
          <div className="col-md-6 right-side d-flex flex-column align-items-end">
            <div className="search-wrapper mb-2 d-flex align-items-center w-100">
              <div className="search-input-wrapper flex-grow-1">
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Search city policy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <img src={searchIcon} alt="Search" className="search-icon" />
              </div>
            </div>
            <div className="d-flex align-items-center">
              <div className="category-dropdown-wrapper position-relative ms-3">
                <select
                  className="form-control category-dropdown appearance-none pr-4"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  {categoryOptions.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
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
                  <FaFile className="me-2" /> View Active City Policies
                </>
              ) : (
                <>
                  <FaArchive className="me-2" /> View Archived City Policies
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {activeTab === 'CityPolicies' && isFederationAdmin && (
        <>
          {viewArchived && (
            <div className="archive-banner">
              <FaArchive className="me-2" /> 
              You are viewing archived policies. These policies are not active.
            </div>
          )}
          
          {loading ? (
            <div>Loading policies...</div>
          ) : (
            <div className="table-container">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Year</th>
                    <th>Date {viewArchived ? 'Archived' : 'Created'}</th>
                    {viewArchived && <th>Archive Reason</th>}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPolicies.length > 0 ? (
                    currentPolicies.map(policy => (
                      <tr key={policy.id} className={viewArchived ? 'archived-row' : ''}>
                        <td>{policy.title}</td>
                        <td className="description-cell">{policy.description}</td>
                        <td>{policy.category}</td>
                        <td>{policy.year}</td>
                        <td>{formatDate(viewArchived ? policy.archived_at : policy.created_at)}</td>
                        {viewArchived && <td>{policy.archive_reason}</td>}
                        <td>
                          {/* PDF Viewing Button */}
                          {policy.file_url && (
                            <button 
                              className="btn btn-info btn-sm me-1" 
                              title="View PDF"
                              onClick={() => openPdfPreview(policy)}
                            >
                              <FaEye />
                            </button>
                          )}
                          
                          {/* PDF Download Button */}
                          {policy.file_url && (
                            <a 
                              href={policy.file_url} 
                              className="btn btn-success btn-sm me-1" 
                              download
                              title="Download PDF"
                            >
                              <FaDownload />
                            </a>
                          )}
                
                          {!viewArchived ? (
                            // Edit and Archive buttons for active policies
                            <>
                              <button 
                                className="btn btn-primary btn-sm mx-1" 
                                onClick={() => handleEdit(policy)}
                                title="Edit Policy"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className="btn btn-warning btn-sm" 
                                onClick={() => openArchiveModal(policy)}
                                title="Archive Policy"
                              >
                                <FaArchive />
                              </button>
                            </>
                          ) : (
                            // Restore and Delete buttons for archived policies
                            <>
                              <button 
                                className="btn btn-primary btn-sm mx-1" 
                                onClick={() => handleRestore(policy.id)}
                                title="Restore Policy"
                              >
                                <FaUndo />
                              </button>
                              <button 
                                className="btn btn-danger btn-sm" 
                                onClick={() => handleDelete(policy.id)}
                                title="Delete Policy"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={viewArchived ? 7 : 6}>
                        {viewArchived ? "No archived policies found." : "No active policies found."}
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
      
      {activeTab === 'BarangayPolicies' && <BarangayPolicies />}
      
      {activeTab === 'AuditTrail' && (
        <div className="audit-trail-section">
          <PolicyActivityLogs />
        </div>
      )}
      
      {/* Policy Form Modal */}
      {showForm && (
        <div className="form-overlay">
          <div className="outer-box">
            <button className="close-btn" onClick={resetForm}>&times;</button>
            <h2 className="form-title">
              {editingId ? 'Edit Policy' : 'Add New Policy'}
            </h2>
            <div className="inner-box">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3 className="section-title">Policy Information</h3>
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
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        required
                      />
                      <label className="input-label">Description</label>
                    </div>
                    
                    <div className="input-container">
                      <select
                        className="form-input"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                      >
                        <option value="City Ordinance">City Ordinance</option>
                        <option value="City Resolution">City Resolution</option>
                      </select>
                      <label className="input-label">Category</label>
                    </div>
                    
                    <div className="input-container">
                      <input
                        type="number"
                        className="form-input"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        required
                      />
                      <label className="input-label">Year</label>
                    </div>
                    
                    <div className="input-container" style={{ flexBasis: '100%', maxWidth: '100%' }}>
                      <input
                        type="file"
                        className="form-input file-input"
                        accept=".pdf"
                        onChange={handleFileChange}
                        required={!editingId}
                        id="policyFileInput"
                      />
                      <label className="input-label" htmlFor="policyFileInput">
                        PDF File {!editingId && '(Required)'}
                      </label>
                      
                      {uploadError && (
                        <div className="error-message mt-2">{uploadError}</div>
                      )}
                      
                      {editingId && formData.existingFileName && (
                        <div className="file-info">
                          <span className="current-file">
                            Current file: {formData.existingFileName}
                          </span>
                          <span className="file-note">
                            (Select a new file only if you want to replace it)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="button-container">
                  <button type="button" className="prev-btn" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    {editingId ? 'Update Policy' : 'Save Policy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Archive Policy</h3>
              <button className="close-modal-btn" onClick={closeArchiveModal}>×</button>
            </div>
            <div className="modal-body">
              <p>
                You are about to archive the policy: 
                <strong> {policyToArchive?.title}</strong>
              </p>
              <p>Archived policies will no longer appear in the active policies list but can be restored later.</p>
              
              <div className="form-group mt-3">
                <label htmlFor="archiveReason">Reason for archiving:</label>
                <textarea
                  id="archiveReason"
                  className="form-control"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  rows="3"
                  placeholder="Enter reason for archiving this policy..."
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
                Archive Policy
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* PDF Preview Modal */}
      {showPdfPreview && (
        <div className="modal-overlay" onClick={() => setShowPdfPreview(false)}>
          <div className="modal-container pdf-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Preview: {previewTitle}</h3>
              <button className="close-modal-btn" onClick={() => setShowPdfPreview(false)}>×</button>
            </div>
            <div className="modal-body pdf-preview-body">
              <iframe
                src={`${previewUrl}#toolbar=0`}
                title={`Preview of ${previewTitle}`}
                className="pdf-preview-frame"
                width="100%"
                height="500px"
              ></iframe>
            </div>
            <div className="modal-footer">
              <a 
                href={previewUrl} 
                download
                className="btn btn-success"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaDownload className="me-2" /> Download PDF
              </a>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowPdfPreview(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyManagement;