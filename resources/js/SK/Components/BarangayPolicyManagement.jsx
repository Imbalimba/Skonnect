import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import moment from 'moment';
import { AuthContext } from '../../Contexts/AuthContext';
import { FaEdit, FaTrash, FaFile, FaArchive, FaUndo,FaChevronDown, FaDownload, FaEye, FaFilter } from 'react-icons/fa';
import Notification from './Notification';
import ConfirmationDialog from './ConfirmationDialog';
import searchIcon from '../../assets/search.png';
import '../css/PolicyManagement.css'; 

const BarangayPolicyManagement = () => {
  const { skUser } = useContext(AuthContext);
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [viewArchived, setViewArchived] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null,
    year: new Date().getFullYear(),
    category: 'Barangay Resolution',
    
  });

  
  
  const isFederationAdmin = skUser?.sk_role === 'Federasyon';

  // Define barangay options
  const barangayOptions = ['All', 'Dela Paz', 'Manggahan', 'Maybunga', 'Pinagbuhatan', 'Rosario', 'San Miguel', 'Santa Lucia', 'Santolan'];
  
  // UI state management
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBarangay, setSelectedBarangay] = useState(isFederationAdmin ? 'All' : skUser?.sk_station || '');
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

  useEffect(() => {
    fetchPolicies();
  }, [viewArchived]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showForm) {
          resetForm();
        } else if (showArchiveModal) {
          closeArchiveModal();
        } else if (showConfirmDialog) {
          handleCancel();
        } else if (showPdfPreview) {
          setShowPdfPreview(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showForm, showArchiveModal, showConfirmDialog, showPdfPreview]);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/barangay-policies?archived=${viewArchived ? '1' : '0'}`);
      if (response.data && Array.isArray(response.data)) {
      setPolicies(response.data);
        setFilteredPolicies(response.data);
      } else {
        console.error('Invalid response format:', response.data);
        showNotification('Invalid response format from server', 'error');
        setPolicies([]);
        setFilteredPolicies([]);
      }
    } catch (error) {
      console.error('Error fetching barangay policies:', error);
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.message || error.response.data.error || 'Failed to load barangay policies';
        showNotification(errorMessage, 'error');
      } else if (error.message) {
        showNotification(`Error: ${error.message}`, 'error');
      } else {
      showNotification('Failed to load barangay policies. Please try again.', 'error');
      }
      setPolicies([]);
      setFilteredPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter policies based on search query and selected barangay
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
    
    // Filter by barangay
    if (selectedBarangay && selectedBarangay !== 'All') {
      filtered = filtered.filter(policy => policy.barangay === selectedBarangay);
    }
    
    setFilteredPolicies(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [policies, searchQuery, selectedBarangay]);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
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
      fetchPolicies();
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
    setUploadError('');
    
    if (!file) {
      setFormData({ ...formData, file: null });
      return;
    }

    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed');
      e.target.value = '';
      return;
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size exceeds 20MB limit');
      e.target.value = '';
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
      data.append('year', formData.year);
      
      // Ensure barangay is always set to a non-null value
      let barangayValue = formData.barangay;
      if (!barangayValue || barangayValue === 'All') {
        // If user is an SK official, use their station
        if (skUser && skUser.sk_station) {
          barangayValue = skUser.sk_station;
        } else {
          // If no barangay is selected and user doesn't have a station
          showNotification('Please select a barangay', 'error');
          return;
        }
      }
      
      data.append('barangay', barangayValue);
      data.append('category', formData.category);
      
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
        response = await axios.post(`/api/barangay-policies/${editingId}?_method=PUT`, data, config);
      } else {
        response = await axios.post('/api/barangay-policies', data, config);
      }

      // Check if the response contains a success message
      if (response.data && response.data.message) {
        showNotification(response.data.message, 'success');
        resetForm();
        await fetchPolicies();
      } else {
        // If no specific message, show a generic success message
        showNotification(
          editingId ? 'Barangay policy updated successfully!' : 'Barangay policy created successfully!',
          'success'
        );
      resetForm();
        await fetchPolicies();
      }
    } catch (error) {
      console.error('Operation failed:', error);
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.message || error.response.data.error || 'Operation failed';
        showNotification(`Error: ${errorMessage}`, 'error');
      } else if (error.message) {
        showNotification(`Error: ${error.message}`, 'error');
      } else {
        showNotification('Network error during operation', 'error');
      }
    }
  };

  const handleEdit = (policy) => {
    setFormData({
      title: policy.title,
      description: policy.description,
      file: null,
      year: policy.year,
      category: policy.category || 'Barangay Resolution',
      existingFileName: policy.file_path ? policy.file_path.split('/').pop() : null,
      barangay: policy.barangay
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
      await axios.put(`/api/barangay-policies/${policyToArchive.id}/archive`, {
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
      await axios.put(`/api/barangay-policies/${id}/restore`);
    };
  
    handleConfirmAction(
      restoreAction,
      id,
      {
        title: 'Restore Policy',
        message: 'Are you sure you want to restore this barangay policy?',
        confirmText: 'Restore',
        confirmColor: 'success',
        successMessage: 'Barangay policy restored successfully!',
        errorMessage: 'Error restoring barangay policy. Please try again.'
      }
    );
  };

  const handleDelete = (id) => {
    const deleteAction = async (id) => {
      await axios.delete(`/api/barangay-policies/${id}`);
    };
  
    handleConfirmAction(
      deleteAction,
      id,
      {
        title: 'Delete Policy',
        message: 'Are you sure you want to permanently delete this barangay policy?',
        confirmText: 'Delete',
        confirmColor: 'danger',
        successMessage: 'Barangay policy deleted successfully!',
        errorMessage: 'Error deleting barangay policy. Please try again.'
      }
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
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
    
    // Make sure we have a valid barangay value for new policies
    let defaultBarangay = '';
    
    // If user is a federation admin, they will choose the barangay
    // Otherwise, use the SK station of the current user
    if (isFederationAdmin) {
      defaultBarangay = 'Dela Paz'; // Set a default barangay instead of 'All'
    } else if (skUser && skUser.sk_station) {
      defaultBarangay = skUser.sk_station;
    } else {
      // Fallback to first barangay if somehow user has no station
      defaultBarangay = 'Dela Paz';
    }
    
    setFormData({
      title: '',
      description: '',
      file: null,
      year: new Date().getFullYear(),
      category: 'Barangay Resolution',
      barangay: defaultBarangay
    });
  };

  const toggleArchivedView = () => {
    setViewArchived(!viewArchived);
    setCurrentPage(1);
  };
  
  const getFileUrl = (policy) => {
    if (!policy.file_path) return null;
    return `/storage/${policy.file_path}`;
  };
  
  const openPdfPreview = (policy) => {
    setPreviewUrl(policy.file_url);
    setPreviewTitle(policy.title);
    setShowPdfPreview(true);
  };

  return (
    <div className="container">
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
          {!viewArchived && (
            <div className="new-profile-button" onClick={handleNewPolicyClick}>
              <div className="icon">
                <div className="plus">+</div>
              </div>
              <span>New Barangay Policy</span>
            </div>
          )}
        </div>
        <div className="col-md-6 right-side d-flex flex-column align-items-end">
          <div className="search-wrapper mb-2 d-flex align-items-center w-100">
            <div className="search-input-wrapper flex-grow-1">
              <input
                type="text"
                className="form-control search-input"
                placeholder="Search barangay policy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <img src={searchIcon} alt="Search" className="search-icon" />
            </div>
          </div>
          

        {/* Barangay Filter Dropdown */}
        <div className="filter-wrapper mb-2 d-flex align-items-center">
        {isFederationAdmin ? (
            <div className="category-dropdown-wrapper position-relative">
            <select
                className="form-control category-dropdown appearance-none pr-4"
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
        ) : (
            <div className="barangay-indicator">
            <span className="badge bg-primary">Barangay: {skUser.sk_station}</span>
            </div>
        )}
        </div>

          <button 
            className={`archive-toggle-btn ${viewArchived ? 'viewing-archived' : ''}`}
            onClick={toggleArchivedView}
          >
            {viewArchived ? (
              <>
                <FaFile className="me-2" /> View Active Barangay Policies
              </>
            ) : (
              <>
                <FaArchive className="me-2" /> View Archived Barangay Policies
              </>
            )}
          </button>
        </div>
      </div>
      
      {viewArchived && (
        <div className="archive-banner">
          <FaArchive className="me-2" /> 
          You are viewing archived barangay policies. These policies are not active.
        </div>
      )}
      
      {loading ? (
        <div>Loading barangay policies...</div>
      ) : (
        <div className="table-container">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Barangay</th>
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
                    <td>{policy.barangay}</td>
                    <td>{policy.year}</td>
                    <td>{formatDate(viewArchived ? policy.archived_at : policy.created_at)}</td>
                    {viewArchived && <td>{policy.archive_reason}</td>}
                    <td>
                      {getFileUrl(policy) && (
                        <>
                        <button 
                          className="btn btn-info btn-sm me-1" 
                          title="View PDF"
                            onClick={() => openPdfPreview({ ...policy, file_url: getFileUrl(policy) })}
                        >
                          <FaEye />
                        </button>
                        <a 
                            href={getFileUrl(policy)} 
                          className="btn btn-success btn-sm me-1" 
                          download
                          title="Download PDF"
                        >
                          <FaDownload />
                        </a>
                        </>
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
                    {viewArchived ? "No archived barangay policies found." : "No active barangay policies found."}
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
      
      {/* Policy Form Modal */}
      {showForm && (
        <div className="form-overlay">
          <div className="outer-box">
            <button className="close-btn" onClick={resetForm}>&times;</button>
            <h2 className="form-title">
              {editingId ? 'Edit Barangay Policy' : 'Add New Barangay Policy'}
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
                    <input
                        type="text"
                        className="form-input"
                        name="category"
                        value="Barangay Resolution"
                        readOnly
                    />
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

                    <div className="input-container">
                    {isFederationAdmin ? (
                        <select
                        className="form-input"
                        name="barangay"
                        value={formData.barangay}
                        onChange={handleChange}
                        required
                        >
                        {barangayOptions.filter(b => b !== 'All').map((barangay, index) => (
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
                        disabled
                        required
                        />
                    )}
                    <label className="input-label">Barangay <span className="required-field">*</span></label>
                    </div>
                                        
                    <div className="input-container" style={{ flexBasis: '100%', maxWidth: '100%' }}>
                      <input
                        type="file"
                        className="form-input file-input"
                        accept=".pdf"
                        onChange={handleFileChange}
                        required={!editingId}
                        id="barangayPolicyFileInput"
                      />
                      <label className="input-label" htmlFor="barangayPolicyFileInput">
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
              <h3>Archive Barangay Policy</h3>
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

export default BarangayPolicyManagement;