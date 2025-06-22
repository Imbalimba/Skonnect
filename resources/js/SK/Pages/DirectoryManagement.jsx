import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../Contexts/AuthContext';
import ConfirmationDialog from '../Components/ConfirmationDialog';
import Notification from '../Components/Notification';
import DirectoryAuditTrailModal from '../Components/DirectoryAuditTrailModal';
import axios from 'axios';
import { 
  FaPlus, FaSearch, FaFilter, FaNetworkWired, FaEye, FaUserTie, 
  FaUserFriends, FaBriefcase, FaChartBar, FaBuilding, FaHistory,
  FaChevronLeft, FaChevronRight, FaCheckSquare,
  FaSquare, FaCheck, FaBookmark, FaUsers, FaUsersCog, FaHandshake,
  FaUserTag, FaClock, FaInfoCircle
} from 'react-icons/fa';

import DirectoryTable from '../Components/DirectoryTable';
import DirectoryForm from '../Components/DirectoryForm';
import OrganizationChartModal from '../../Components/OrganizationChartModal';
import '../css/DirectoryManagement.css';

const DirectoryManagement = () => {
  const { skUser } = useContext(AuthContext);
  const [directories, setDirectories] = useState([]);
  const [filteredDirectories, setFilteredDirectories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStation, setFilterStation] = useState('all');
  
  // Added for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Added for bulk selection
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Added for audit trail
  const [showAuditModal, setShowAuditModal] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    archived: 0,
    categories: {
      executive: 0,
      committee: 0,
      barangay: 0,
      partner: 0
    },
    stations: {},
    topStation: null,
    recentUpdates: []
  });
  
  // Organization chart modal
  const [showOrgChart, setShowOrgChart] = useState(false);
  const [orgChartStation, setOrgChartStation] = useState('');
  
  // Define the bookmark types for directory entries
  const bookmarkTypes = [
    { id: 'new', name: 'New', color: '#10b981', description: 'Recently added entry' },
    { id: 'updated', name: 'Updated', color: '#f59e0b', description: 'Recently updated entry' },
    { id: 'important', name: 'Important', color: '#ef4444', description: 'Executive or high-level position' }
  ];
  
  // Load directories
  const fetchDirectories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/directories');
      
      // Process directories to add bookmark status if missing
      const processedDirectories = response.data.map(directory => {
        // Check if we need to calculate bookmark status
        if (typeof directory.bookmarkStatus === 'undefined') {
          const now = new Date();
          const createdDate = new Date(directory.created_at);
          const updatedDate = new Date(directory.updated_at);
          const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
          
          // Default bookmarkStatus is null (no bookmark)
          let bookmarkStatus = null;
          
          // First check for important directories (executives or high in the org chart)
          if (directory.category === 'executive' || directory.position_order <= 5) {
            bookmarkStatus = 'important';
          }
          // Next check if the entry has been updated
          else if (updatedDate > createdDate) {
            bookmarkStatus = 'updated';
          }
          // Finally check for new entries
          else if (daysSinceCreation < 7) {
            bookmarkStatus = 'new';
          }
          
          return {
            ...directory,
            bookmarkStatus
          };
        }
        
        return directory;
      });
      
      setDirectories(processedDirectories);
      
      // Fetch statistics
      fetchStats();
    } catch (error) {
      console.error('Failed to fetch directories:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load directories: ' + (error.response?.data?.error || 'Unknown error')
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch directory statistics
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get('/api/directories/statistics');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch directory statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDirectories();
  }, []);
  
  // Apply filters whenever directories or filter values change
  useEffect(() => {
    applyFilters();
  }, [directories, searchQuery, filterStatus, filterCategory, filterStation]);
  
  // Calculate pagination whenever filtered directories or items per page change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredDirectories.length / itemsPerPage));
    
    // If the current page is higher than the new total pages, reset to page 1
    if (currentPage > Math.ceil(filteredDirectories.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [filteredDirectories, itemsPerPage]);
  
  // Apply all filters to directories
  const applyFilters = () => {
    let filtered = [...directories];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(directory => 
        directory.name.toLowerCase().includes(query) || 
        directory.role.toLowerCase().includes(query) ||
        (directory.email && directory.email.toLowerCase().includes(query)) ||
        (directory.phone && directory.phone.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(directory => directory.status === filterStatus);
    }
    
    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(directory => directory.category === filterCategory);
    }
    
    // Apply station filter
    if (filterStation !== 'all') {
      filtered = filtered.filter(directory => directory.sk_station === filterStation);
    }
    
    setFilteredDirectories(filtered);
  };
  
  // Get unique stations with data for filter - FIXED to only show stations that have data
  const stationOptions = useMemo(() => {
    const stationSet = new Set(['all']);
    
    // Add stations from existing directories data
    directories.forEach(dir => {
      if (dir.sk_station) {
        stationSet.add(dir.sk_station);
      }
    });
    
    // Sort the stations
    return Array.from(stationSet).sort((a, b) => {
      if (a === 'all') return -1;
      if (b === 'all') return 1;
      if (a === 'Federation') return -1;
      if (b === 'Federation') return 1;
      return a.localeCompare(b);
    });
  }, [directories]);
  
  // Get stations that actually have data for the org chart viewer
  const stationsWithData = useMemo(() => {
    const stations = new Set();
    directories.forEach(dir => {
      if (dir.status === 'published') {
        stations.add(dir.sk_station);
      }
    });
    return Array.from(stations).sort();
  }, [directories]);
  
  // Get current page directories
  const getCurrentDirectories = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredDirectories.slice(indexOfFirstItem, indexOfLastItem);
  };
  
  // Handle pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };
  
  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxDisplayButtons = 5;
    
    // Always add first page button
    buttons.push(
      <button 
        key="first" 
        className={`sk-dir-pagination-btn ${currentPage === 1 ? 'active' : ''}`}
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
          className={`sk-dir-pagination-btn ${currentPage === i ? 'active' : ''}`}
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
    
    // Add last page button if more than one page
    if (totalPages > 1) {
      buttons.push(
        <button 
          key="last" 
          className={`sk-dir-pagination-btn ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          {totalPages}
        </button>
      );
    }
    
    return buttons;
  };
  
  // Handle bulk selection
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      // Select all items on current page only
      const currentItems = getCurrentDirectories();
      setSelectedItems(currentItems.map(dir => dir.id));
    }
    setSelectAll(!selectAll);
  };
  
  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
      setSelectAll(false);
    } else {
      setSelectedItems([...selectedItems, id]);
      
      // Check if all items on current page are now selected
      const currentItemIds = getCurrentDirectories().map(item => item.id);
      const allSelected = currentItemIds.every(itemId => 
        itemId === id || selectedItems.includes(itemId)
      );
      
      setSelectAll(allSelected);
    }
  };
  
  // Add directory
  const handleAddClick = () => {
    setEditItem(null);
    setShowForm(true);
  };
  
  // Edit directory
  const handleEditClick = (item) => {
    setEditItem(item);
    setShowForm(true);
  };
  
  // Show organization chart
  const handleViewOrgChart = (station) => {
    setOrgChartStation(station);
    setShowOrgChart(true);
  };

  // Open audit trail modal
  const openAuditModal = () => {
    setShowAuditModal(true);
  };
  
  // Archive directory
  const handleArchiveClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Archive Directory',
      message: 'Are you sure you want to archive this directory entry?',
      confirmText: 'Archive',
      confirmColor: 'warning',
      onConfirm: () => archiveDirectory(id)
    });
  };
  
  const archiveDirectory = async (id) => {
    try {
      await axios.put(`/api/directories/${id}/archive`);
      setNotification({
        type: 'success',
        message: 'Directory archived successfully'
      });
      fetchDirectories();
    } catch (error) {
      console.error('Failed to archive directory:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to archive directory'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Restore directory
  const handleRestoreClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Directory',
      message: 'Are you sure you want to restore this directory entry?',
      confirmText: 'Restore',
      confirmColor: 'success',
      onConfirm: () => restoreDirectory(id)
    });
  };
  
  const restoreDirectory = async (id) => {
    try {
      await axios.put(`/api/directories/${id}/restore`);
      setNotification({
        type: 'success',
        message: 'Directory restored successfully'
      });
      fetchDirectories();
    } catch (error) {
      console.error('Failed to restore directory:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to restore directory'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Delete directory
  const handleDeleteClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Directory',
      message: 'Are you sure you want to delete this directory entry? This action cannot be undone.',
      confirmText: 'Delete',
      confirmColor: 'danger',
      onConfirm: () => deleteDirectory(id)
    });
  };
  
  const deleteDirectory = async (id) => {
    try {
      await axios.delete(`/api/directories/${id}`);
      setNotification({
        type: 'success',
        message: 'Directory deleted successfully'
      });
      fetchDirectories();
    } catch (error) {
      console.error('Failed to delete directory:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to delete directory'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Get filtered selected items by status
  const getFilteredSelectedItems = (status) => {
    return selectedItems.filter(id => {
      const dir = directories.find(d => d.id === id);
      return dir && dir.status === status;
    });
  };
  
  // Bulk archive directories
  const handleBulkArchive = () => {
    const publishedItems = getFilteredSelectedItems('published');
    if (publishedItems.length === 0) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Archive Selected Directories',
      message: `Are you sure you want to archive ${publishedItems.length} selected directories?`,
      confirmText: 'Archive All',
      confirmColor: 'warning',
      onConfirm: () => bulkArchiveDirectories(publishedItems)
    });
  };
  
  const bulkArchiveDirectories = async (ids) => {
    try {
      await axios.post('/api/directories/bulk', {
        operation: 'archive',
        ids: ids
      });
      
      setNotification({
        type: 'success',
        message: `${ids.length} directories archived successfully`
      });
      
      setSelectedItems([]);
      setSelectAll(false);
      fetchDirectories();
    } catch (error) {
      console.error('Failed to archive directories:', error);
      setNotification({
        type: 'error',
        message: 'Failed to archive some or all directories: ' + (error.response?.data?.error || 'Unknown error')
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Bulk restore directories
  const handleBulkRestore = () => {
    const archivedItems = getFilteredSelectedItems('archived');
    if (archivedItems.length === 0) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Selected Directories',
      message: `Are you sure you want to restore ${archivedItems.length} selected directories?`,
      confirmText: 'Restore All',
      confirmColor: 'success',
      onConfirm: () => bulkRestoreDirectories(archivedItems)
    });
  };
  
  const bulkRestoreDirectories = async (ids) => {
    try {
      await axios.post('/api/directories/bulk', {
        operation: 'restore',
        ids: ids
      });
      
      setNotification({
        type: 'success',
        message: `${ids.length} directories restored successfully`
      });
      
      setSelectedItems([]);
      setSelectAll(false);
      fetchDirectories();
    } catch (error) {
      console.error('Failed to restore directories:', error);
      setNotification({
        type: 'error',
        message: 'Failed to restore some or all directories: ' + (error.response?.data?.error || 'Unknown error')
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Bulk delete directories
  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Selected Directories',
      message: `Are you sure you want to delete ${selectedItems.length} selected directories? This action cannot be undone.`,
      confirmText: 'Delete All',
      confirmColor: 'danger',
      onConfirm: () => bulkDeleteDirectories(selectedItems)
    });
  };
  
  const bulkDeleteDirectories = async (ids) => {
    try {
      await axios.post('/api/directories/bulk', {
        operation: 'delete',
        ids: ids
      });
      
      setNotification({
        type: 'success',
        message: `${ids.length} directories deleted successfully`
      });
      
      setSelectedItems([]);
      setSelectAll(false);
      fetchDirectories();
    } catch (error) {
      console.error('Failed to delete directories:', error);
      setNotification({
        type: 'error',
        message: 'Failed to delete some or all directories: ' + (error.response?.data?.error || 'Unknown error')
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Save directory (add or update)
  const handleSaveDirectory = async (formData) => {
    try {
      if (editItem) {
        await axios.put(`/api/directories/${editItem.id}`, formData);
        setNotification({
          type: 'success',
          message: 'Directory updated successfully'
        });
      } else {
        await axios.post('/api/directories', formData);
        setNotification({
          type: 'success',
          message: 'Directory added successfully'
        });
      }
      setShowForm(false);
      fetchDirectories();
    } catch (error) {
      console.error('Failed to save directory:', error);
      
      if (error.response?.data?.errors) {
        const errorsObj = error.response.data.errors;
        const errorMessages = Object.keys(errorsObj)
          .map(key => errorsObj[key].join(', '))
          .join('; ');
          
        setNotification({
          type: 'error',
          message: `Validation error: ${errorMessages}`
        });
      } else {
        setNotification({
          type: 'error',
          message: error.response?.data?.error || 'Failed to save directory'
        });
      }
    }
  };
  
  // Format date for recent updates
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  };
  
  // Calculate counts for bulk actions
  const publishedSelectedCount = getFilteredSelectedItems('published').length;
  const archivedSelectedCount = getFilteredSelectedItems('archived').length;
  
  // Find bookmark details from bookmarkStatus
  const getBookmarkDetails = (status) => {
    if (!status) return null;
    return bookmarkTypes.find(type => type.id === status);
  };
  
  return (
    <div className="sk-dir-mgmt-container">
      <div className="sk-dir-mgmt-header">
        <div className="sk-dir-mgmt-header-left">
          <h1 className="sk-dir-mgmt-title">Directory Management</h1>
          <p className="sk-dir-mgmt-description">
            Manage directory listings for the Youth Directory page and Organizational Structure
          </p>
        </div>
      </div>
      
      {/* Dashboard Layout with Sidebar */}
      <div className="sk-dir-mgmt-dashboard">
        <div className="sk-dir-mgmt-main">
          {/* Organization Charts Quickview */}
          {stationsWithData.length > 0 && (
            <div className="sk-dir-mgmt-org-charts">
              <div className="sk-dir-mgmt-org-charts-title">
                <FaNetworkWired /> Organization Charts
              </div>
              <div className="sk-dir-mgmt-org-charts-list">
                {stationsWithData.map(station => (
                  <button 
                    key={station}
                    className="sk-dir-mgmt-org-chart-btn" 
                    onClick={() => handleViewOrgChart(station)}
                  >
                    <FaEye /> {station} Org Chart
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Controls */}
          <div className="sk-dir-mgmt-controls">
            <div className="sk-dir-mgmt-search">
              <div className="sk-dir-mgmt-search-input">
                <FaSearch className="sk-dir-mgmt-search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, role, or contact info..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sk-dir-mgmt-input"
                />
              </div>
              
              <div className="sk-dir-mgmt-filters">
                <div className="sk-dir-mgmt-filter">
                  <label>Status:</label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="sk-dir-mgmt-select"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                
                <div className="sk-dir-mgmt-filter">
                  <label>Category:</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="sk-dir-mgmt-select"
                  >
                    <option value="all">All Categories</option>
                    <option value="executive">Executive Committee</option>
                    <option value="committee">Committees</option>
                    <option value="barangay">Barangay SK</option>
                    <option value="partner">Partner Agencies</option>
                  </select>
                </div>
                
                <div className="sk-dir-mgmt-filter">
                  <label>Station:</label>
                  <select
                    value={filterStation}
                    onChange={(e) => setFilterStation(e.target.value)}
                    className="sk-dir-mgmt-select"
                  >
                    {stationOptions.map(station => (
                      <option key={station} value={station}>
                        {station === 'all' ? 'All Stations' : station}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="sk-dir-mgmt-actions">
              {filteredDirectories.length > 0 && (
                <button 
                  className="sk-dir-mgmt-select-all-btn"
                  onClick={handleSelectAll}
                >
                  {selectAll ? 'Unselect All' : 'Select All'}
                </button>
              )}
              
              {/* Add Audit Trail Button */}
              <button 
                className="sk-dir-mgmt-audit-trail-btn"
                onClick={openAuditModal}
              >
                <FaHistory /> View Audit Trail
              </button>
              
              <button 
                className="sk-dir-mgmt-add-btn"
                onClick={handleAddClick}
              >
                <FaPlus /> Add Directory
              </button>
            </div>
          </div>
          
          {/* Bookmark Legend */}
          <div className="sk-dir-bookmark-legend">
            {bookmarkTypes.map(type => (
              <div key={type.id} className="sk-dir-bookmark-legend-pill">
                <div 
                  className="sk-dir-bookmark-sample" 
                  style={{ backgroundColor: type.color }}
                ></div>
                <span>{type.name}</span>
              </div>
            ))}
          </div>
          
          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="sk-dir-bulk-actions">
              <div className="sk-dir-bulk-info">
                <FaCheck className="sk-dir-bulk-info-icon" /> 
                <span>{selectedItems.length} items selected</span>
              </div>
              <div className="sk-dir-bulk-buttons">
                {publishedSelectedCount > 0 && (
                  <button 
                    className="sk-dir-bulk-btn sk-dir-bulk-archive"
                    onClick={handleBulkArchive}
                  >
                    Archive Selected ({publishedSelectedCount})
                  </button>
                )}
                
                {archivedSelectedCount > 0 && (
                  <button 
                    className="sk-dir-bulk-btn sk-dir-bulk-restore"
                    onClick={handleBulkRestore}
                  >
                    Restore Selected ({archivedSelectedCount})
                  </button>
                )}
                
                <button 
                  className="sk-dir-bulk-btn sk-dir-bulk-delete"
                  onClick={handleBulkDelete}
                >
                  Delete Selected ({selectedItems.length})
                </button>
                
                <button 
                  className="sk-dir-bulk-btn sk-dir-bulk-cancel"
                  onClick={() => {
                    setSelectedItems([]);
                    setSelectAll(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Directory Content - Table View */}
          {loading ? (
            <div className="sk-dir-loading">
              <div className="sk-dir-loading-spinner"></div>
              <p className="sk-dir-loading-text">Loading directories...</p>
            </div>
          ) : filteredDirectories.length === 0 ? (
            <div className="sk-dir-empty">
              <FaUserTie className="sk-dir-empty-icon" />
              <h3 className="sk-dir-empty-title">No directories found</h3>
              <p className="sk-dir-empty-text">
                {searchQuery || filterStatus !== 'all' || filterCategory !== 'all' || filterStation !== 'all' ? 
                  "Try adjusting your search criteria or filters." : 
                  "Click the 'Add Directory' button to get started."}
              </p>
            </div>
          ) : (
            <DirectoryTable
              directories={getCurrentDirectories()}
              loading={loading}
              skUser={skUser}
              onEdit={handleEditClick}
              onArchive={handleArchiveClick}
              onRestore={handleRestoreClick}
              onDelete={handleDeleteClick}
              onBulkArchive={handleBulkArchive}
              onBulkRestore={handleBulkRestore}
              onBulkDelete={handleBulkDelete}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onSelectAll={handleSelectAll}
              selectAll={selectAll}
              bookmarkTypes={bookmarkTypes}
            />
          )}
          
          {/* Pagination Controls */}
          {filteredDirectories.length > 0 && (
            <div className="sk-dir-pagination">
              <div className="sk-dir-pagination-info">
                Showing {Math.min(filteredDirectories.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredDirectories.length, currentPage * itemsPerPage)} of {filteredDirectories.length} directories
              </div>
              
              <button 
                className={`sk-dir-pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                title="Previous Page"
              >
                <FaChevronLeft />
              </button>
              
              {renderPaginationButtons()}
              
              <button 
                className={`sk-dir-pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="Next Page"
              >
                <FaChevronRight />
              </button>
              
              <div className="sk-dir-per-page">
                <span className="sk-dir-per-page-label">Show:</span>
                <select 
                  className="sk-dir-per-page-select"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Statistics Sidebar */}
        <div className="sk-dir-sidebar">
          {/* Directory Overview Stats */}
          <div className="sk-dir-stats-container">
            <div className="sk-dir-stats-header">
              <FaChartBar /> Directory Overview
            </div>
            <div className="sk-dir-stats-body">
              <div className="sk-dir-stat-item">
                <div className="sk-dir-stat-icon blue">
                  <FaUserTie />
                </div>
                <div className="sk-dir-stat-info">
                  <p className="sk-dir-stat-title">Total Entries</p>
                  <p className="sk-dir-stat-value">{statsLoading ? '-' : stats.total}</p>
                </div>
              </div>
              
              <div className="sk-dir-stat-item">
                <div className="sk-dir-stat-icon green">
                  <FaUsers />
                </div>
                <div className="sk-dir-stat-info">
                  <p className="sk-dir-stat-title">Published Entries</p>
                  <p className="sk-dir-stat-value">{statsLoading ? '-' : stats.published}</p>
                </div>
              </div>
              
              <div className="sk-dir-stat-item">
                <div className="sk-dir-stat-icon amber">
                  <FaUserTag />
                </div>
                <div className="sk-dir-stat-info">
                  <p className="sk-dir-stat-title">Archived Entries</p>
                  <p className="sk-dir-stat-value">{statsLoading ? '-' : stats.archived}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Categories Stats */}
          <div className="sk-dir-stats-container">
            <div className="sk-dir-stats-header">
              <FaFilter /> Directory Categories
            </div>
            <div className="sk-dir-stats-body">
              <div className="sk-dir-category-stats">
                <div className="sk-dir-category-stat">
                  <div className="sk-dir-category-stat-icon executive">
                    <FaUsersCog />
                  </div>
                  <div className="sk-dir-category-stat-info">
                    <span className="sk-dir-category-stat-name">Executive</span>
                    <span className="sk-dir-category-stat-value">
                      {statsLoading ? '-' : stats.categories.executive}
                    </span>
                  </div>
                </div>
                
                <div className="sk-dir-category-stat">
                  <div className="sk-dir-category-stat-icon committee">
                    <FaUserFriends />
                  </div>
                  <div className="sk-dir-category-stat-info">
                    <span className="sk-dir-category-stat-name">Committees</span>
                    <span className="sk-dir-category-stat-value">
                      {statsLoading ? '-' : stats.categories.committee}
                    </span>
                  </div>
                </div>
                
                <div className="sk-dir-category-stat">
                  <div className="sk-dir-category-stat-icon barangay">
                    <FaBuilding />
                  </div>
                  <div className="sk-dir-category-stat-info">
                    <span className="sk-dir-category-stat-name">Barangay SK</span>
                    <span className="sk-dir-category-stat-value">
                      {statsLoading ? '-' : stats.categories.barangay}
                    </span>
                  </div>
                </div>
                
                <div className="sk-dir-category-stat">
                  <div className="sk-dir-category-stat-icon partner">
                    <FaHandshake />
                  </div>
                  <div className="sk-dir-category-stat-info">
                    <span className="sk-dir-category-stat-name">Partners</span>
                    <span className="sk-dir-category-stat-value">
                      {statsLoading ? '-' : stats.categories.partner}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Progress bar showing published vs total */}
              <div className="sk-dir-progress-container">
                <div 
                  className="sk-dir-progress-bar" 
                  style={{ 
                    width: `${stats.total > 0 ? (stats.published / stats.total) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <div className="sk-dir-progress-label">
                <span>{statsLoading ? '-' : stats.published} Published</span>
                <span>{statsLoading ? '-' : stats.archived} Archived</span>
              </div>
            </div>
          </div>
          
          {/* Recent Updates */}
          <div className="sk-dir-stats-container">
            <div className="sk-dir-stats-header">
              <FaHistory /> Recently Updated
            </div>
            <div className="sk-dir-stats-body">
              {statsLoading ? (
                <div className="sk-dir-stats-loading">Loading latest updates...</div>
              ) : stats.recentUpdates && stats.recentUpdates.length > 0 ? (
                <div className="sk-dir-recent-updates">
                  {stats.recentUpdates.map(entry => (
                    <div key={entry.id} className="sk-dir-recent-item">
                      <div className="sk-dir-recent-info">
                        <h4 className="sk-dir-recent-name">{entry.name}</h4>
                        <div className="sk-dir-recent-meta">
                          <span className="sk-dir-recent-role">{entry.role}</span>
                          <span className="sk-dir-recent-station">{entry.sk_station}</span>
                        </div>
                      </div>
                      <div className="sk-dir-recent-time">
                        <FaClock /> {formatTimeAgo(entry.updated_at)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No recent updates found.</p>
              )}
            </div>
          </div>
          
          {/* Directory Tips */}
          <div className="sk-dir-stats-container">
            <div className="sk-dir-stats-header">
              <FaInfoCircle /> Directory Tips
            </div>
            <div className="sk-dir-stats-body">
              <div className="sk-dir-tips">
                <div className="sk-dir-tip">
                  <h4>Organization Chart</h4>
                  <p>Use the position order and reports to fields to create hierarchical relationships in the organization chart.</p>
                </div>
                <div className="sk-dir-tip">
                  <h4>Contact Information</h4>
                  <p>Adding complete contact information helps youth members reach out to the right person.</p>
                </div>
                <div className="sk-dir-tip">
                  <h4>Categories</h4>
                  <p>Properly categorizing directory entries ensures they appear in the right sections of the youth directory page.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Directory Form Modal */}
      {showForm && (
        <DirectoryForm
          show={showForm}
          onHide={() => setShowForm(false)}
          onSave={handleSaveDirectory}
          initialData={editItem}
          skUser={skUser}
        />
      )}
      
      {/* Organization Chart Modal */}
      {showOrgChart && (
        <OrganizationChartModal
          show={showOrgChart}
          onClose={() => setShowOrgChart(false)}
          stationName={orgChartStation}
        />
      )}
      
      {/* Audit Trail Modal */}
      <DirectoryAuditTrailModal 
        show={showAuditModal} 
        onClose={() => setShowAuditModal(false)} 
      />
      
      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
        confirmColor={confirmDialog.confirmColor}
        cancelColor="secondary"
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default DirectoryManagement;