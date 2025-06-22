import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaHistory, FaTimes, FaChevronLeft, FaChevronRight, 
  FaUser, FaCalendarAlt, FaFilter, FaSearch
} from 'react-icons/fa';
import '../css/DirectoryAuditTrail.css';

const DirectoryAuditTrailModal = ({ show, onClose }) => {
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    directory_id: '',
    action: '',
    user_id: '',
    date_from: '',
    date_to: ''
  });
  const [directories, setDirectories] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (show) {
      fetchAuditTrail();
      fetchDirectories();
    }
  }, [show]);

  const fetchDirectories = async () => {
    try {
      const response = await axios.get('/api/directories');
      setDirectories(response.data);
    } catch (error) {
      console.error('Error fetching directories:', error);
    }
  };

  const fetchAuditTrail = async (page = 1) => {
    try {
      setLoading(true);
      
      const response = await axios.get('/api/directories/audit-trail', {
        params: {
          ...filters,
          page: page,
          per_page: 10
        }
      });
      
      if (response.data.success) {
        setAuditTrail(response.data.audit_trail.data);
        setCurrentPage(response.data.audit_trail.current_page);
        setTotalPages(response.data.audit_trail.last_page);
      }
    } catch (error) {
      console.error('Error fetching audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchAuditTrail(1);
  };

  const resetFilters = () => {
    setFilters({
      directory_id: '',
      action: '',
      user_id: '',
      date_from: '',
      date_to: ''
    });
    
    // Fetch with reset filters
    setCurrentPage(1);
    fetchAuditTrail(1);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchAuditTrail(page);
    }
  };

  const formatActionType = (action) => {
    switch (action) {
      case 'create':
        return 'Created';
      case 'update':
        return 'Updated';
      case 'archive':
        return 'Archived';
      case 'restore':
        return 'Restored';
      case 'delete':
        return 'Deleted';
      default:
        return action.charAt(0).toUpperCase() + action.slice(1);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      'create': '#10b981', // Green
      'update': '#f59e0b', // Amber
      'archive': '#8b5cf6', // Purple
      'restore': '#3b82f6', // Blue
      'delete': '#ef4444'  // Red
    };
    
    return colors[action] || '#6b7280';
  };

  const formatDateTime = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxDisplayButtons = 5;
    
    // Always add first page button
    buttons.push(
      <button 
        key="first" 
        className={`sk-cmn-sklcss-dir-audit-pagination-btn ${currentPage === 1 ? 'active' : ''}`}
        onClick={() => goToPage(1)}
        disabled={currentPage === 1}
      >
        1
      </button>
    );
    
    // Calculate start and end page
    let startPage = Math.max(2, currentPage - Math.floor(maxDisplayButtons / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxDisplayButtons - 3);
    
    if (endPage <= startPage) endPage = startPage;
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      buttons.push(<span key="ellipsis1">...</span>);
    }
    
    // Add middle page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button 
          key={i} 
          className={`sk-cmn-sklcss-dir-audit-pagination-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => goToPage(i)}
        >
          {i}
        </button>
      );
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      buttons.push(<span key="ellipsis2">...</span>);
    }
    
    // Always add last page button if more than one page
    if (totalPages > 1) {
      buttons.push(
        <button 
          key="last" 
          className={`sk-cmn-sklcss-dir-audit-pagination-btn ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          {totalPages}
        </button>
      );
    }
    
    return buttons;
  };

  if (!show) return null;

  return (
    <div className="sk-cmn-sklcss-dir-audit-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div 
        className="sk-cmn-sklcss-dir-audit-modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sk-cmn-sklcss-dir-audit-modal-header">
          <h2 className="sk-cmn-sklcss-dir-audit-modal-title">
            <FaHistory /> Directory Audit Trail
          </h2>
          <button 
            className="sk-cmn-sklcss-dir-audit-modal-close" 
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="sk-cmn-sklcss-dir-audit-filters">
          <div className="sk-cmn-sklcss-dir-audit-filter-row">
            <div className="sk-cmn-sklcss-dir-audit-filter">
              <label>Directory:</label>
              <select 
                name="directory_id" 
                value={filters.directory_id} 
                onChange={handleFilterChange}
              >
                <option value="">All Directories</option>
                {directories.map(directory => (
                  <option key={directory.id} value={directory.id}>
                    {directory.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="sk-cmn-sklcss-dir-audit-filter">
              <label>Action:</label>
              <select 
                name="action" 
                value={filters.action} 
                onChange={handleFilterChange}
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="archive">Archive</option>
                <option value="restore">Restore</option>
                <option value="delete">Delete</option>
              </select>
            </div>
          </div>
          
          <div className="sk-cmn-sklcss-dir-audit-filter-row">
            <div className="sk-cmn-sklcss-dir-audit-filter">
              <label>From Date:</label>
              <input 
                type="date" 
                name="date_from" 
                value={filters.date_from} 
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="sk-cmn-sklcss-dir-audit-filter">
              <label>To Date:</label>
              <input 
                type="date" 
                name="date_to" 
                value={filters.date_to} 
                onChange={handleFilterChange}
              />
            </div>
          </div>
          
          <div className="sk-cmn-sklcss-dir-audit-filter-buttons">
            <button 
              className="sk-cmn-sklcss-dir-audit-filter-apply" 
              onClick={applyFilters}
            >
              Apply Filters
            </button>
            <button 
              className="sk-cmn-sklcss-dir-audit-filter-reset" 
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
        </div>
        
        <div className="sk-cmn-sklcss-dir-audit-trail-content">
          {loading ? (
            <div className="sk-cmn-sklcss-dir-audit-loading">
              <div className="sk-cmn-sklcss-dir-audit-loading-spinner"></div>
              <p>Loading audit trail...</p>
            </div>
          ) : auditTrail.length === 0 ? (
            <div className="sk-cmn-sklcss-dir-audit-empty">
              <FaHistory className="sk-cmn-sklcss-dir-audit-empty-icon" />
              <p>No audit trail records found</p>
              <span>Try adjusting your filters or check back later</span>
            </div>
          ) : (
            <div className="sk-cmn-sklcss-dir-audit-list">
              {auditTrail.map(entry => (
                <div key={entry.id} className="sk-cmn-sklcss-dir-audit-item">
                  <div className="sk-cmn-sklcss-dir-audit-item-header">
                    <div 
                      className="sk-cmn-sklcss-dir-audit-action" 
                      style={{ backgroundColor: getActionColor(entry.action) }}
                    >
                      {formatActionType(entry.action)}
                    </div>
                    <div className="sk-cmn-sklcss-dir-audit-directory-name">
                      {entry.directory_name || 'Unknown Directory'}
                    </div>
                    <div className="sk-cmn-sklcss-dir-audit-timestamp">
                      {formatDateTime(entry.created_at)}
                    </div>
                  </div>
                  <div className="sk-cmn-sklcss-dir-audit-item-content">
                    <div className="sk-cmn-sklcss-dir-audit-user">
                      <FaUser className="sk-cmn-sklcss-dir-audit-user-icon" />
                      <span>{entry.user_name || 'Unknown User'}</span>
                    </div>
                    <div className="sk-cmn-sklcss-dir-audit-details">
                      {entry.action === 'create' && (
                        <p>Created a new directory entry in the {JSON.parse(entry.details)?.category || 'Unknown'} category</p>
                      )}
                      {entry.action === 'update' && (
                        <div className="sk-cmn-sklcss-dir-audit-update-details">
                          <p>Updated directory properties:</p>
                          {JSON.parse(entry.details)?.before?.name !== JSON.parse(entry.details)?.after?.name && (
                            <span className="sk-cmn-sklcss-dir-audit-detail-item">
                              • Name changed from "{JSON.parse(entry.details)?.before?.name}" to "{JSON.parse(entry.details)?.after?.name}"
                            </span>
                          )}
                          {JSON.parse(entry.details)?.before?.role !== JSON.parse(entry.details)?.after?.role && (
                            <span className="sk-cmn-sklcss-dir-audit-detail-item">
                              • Role changed from "{JSON.parse(entry.details)?.before?.role}" to "{JSON.parse(entry.details)?.after?.role}"
                            </span>
                          )}
                          {JSON.parse(entry.details)?.before?.category !== JSON.parse(entry.details)?.after?.category && (
                            <span className="sk-cmn-sklcss-dir-audit-detail-item">
                              • Category changed from "{JSON.parse(entry.details)?.before?.category}" to "{JSON.parse(entry.details)?.after?.category}"
                            </span>
                          )}
                          {JSON.parse(entry.details)?.before?.sk_station !== JSON.parse(entry.details)?.after?.sk_station && (
                            <span className="sk-cmn-sklcss-dir-audit-detail-item">
                              • Station changed from "{JSON.parse(entry.details)?.before?.sk_station}" to "{JSON.parse(entry.details)?.after?.sk_station}"
                            </span>
                          )}
                          {JSON.parse(entry.details)?.before?.position_order !== JSON.parse(entry.details)?.after?.position_order && (
                            <span className="sk-cmn-sklcss-dir-audit-detail-item">
                              • Position order changed from {JSON.parse(entry.details)?.before?.position_order} to {JSON.parse(entry.details)?.after?.position_order}
                            </span>
                          )}
                          {JSON.parse(entry.details)?.before?.email !== JSON.parse(entry.details)?.after?.email && (
                            <span className="sk-cmn-sklcss-dir-audit-detail-item">
                              • Email was updated
                            </span>
                          )}
                          {JSON.parse(entry.details)?.before?.phone !== JSON.parse(entry.details)?.after?.phone && (
                            <span className="sk-cmn-sklcss-dir-audit-detail-item">
                              • Phone number was updated
                            </span>
                          )}
                          {JSON.parse(entry.details)?.before?.location !== JSON.parse(entry.details)?.after?.location && (
                            <span className="sk-cmn-sklcss-dir-audit-detail-item">
                              • Location was updated
                            </span>
                          )}
                        </div>
                      )}
                      {entry.action === 'archive' && (
                        <p>Archived the directory entry</p>
                      )}
                      {entry.action === 'restore' && (
                        <p>Restored the directory entry from archived status</p>
                      )}
                      {entry.action === 'delete' && (
                        <div className="sk-cmn-sklcss-dir-audit-delete-details">
                          <p>Deleted the directory entry permanently</p>
                          <span className="sk-cmn-sklcss-dir-audit-detail-item">
                            • Category: {JSON.parse(entry.details)?.category || 'Unknown'}
                          </span>
                          <span className="sk-cmn-sklcss-dir-audit-detail-item">
                            • Role: {JSON.parse(entry.details)?.role || 'Unknown'}
                          </span>
                          <span className="sk-cmn-sklcss-dir-audit-detail-item">
                            • Station: {JSON.parse(entry.details)?.sk_station || 'Unknown'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Audit Trail Pagination */}
          {!loading && auditTrail.length > 0 && (
            <div className="sk-cmn-sklcss-dir-audit-pagination">
              <button 
                className={`sk-cmn-sklcss-dir-audit-pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </button>
              
              {renderPaginationButtons()}
              
              <button 
                className={`sk-cmn-sklcss-dir-audit-pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <FaChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectoryAuditTrailModal;