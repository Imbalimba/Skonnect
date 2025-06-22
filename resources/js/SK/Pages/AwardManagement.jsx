import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../Contexts/AuthContext';
import ConfirmationDialog from '../Components/ConfirmationDialog';
import Notification from '../Components/Notification';
import axios from 'axios';
import { 
  FaPlus, FaSearch, FaFilter, FaChartBar, FaUsers, FaTrophy, 
  FaCalendarAlt, FaEye, FaCheck, FaCheckSquare, FaSquare, 
  FaEdit, FaArchive, FaTrash, FaUndoAlt, FaHistory, FaClock,
  FaTh, FaList, FaChevronLeft, FaChevronRight,
  FaBookmark, FaInfoCircle, FaMapMarkerAlt, FaUser, FaTimes
} from 'react-icons/fa';
import '../css/AwardManagement.css';
import AwardTable from '../Components/AwardTable';
import AwardGrid from '../Components/AwardGrid';
import AwardForm from '../Components/AwardForm';
import AwardDetail from '../Components/AwardDetail';

const AwardManagement = () => {
  const { skUser } = useContext(AuthContext);
  const [awards, setAwards] = useState([]);
  const [filteredAwards, setFilteredAwards] = useState([]);
  const [statistics, setStatistics] = useState({
    totalAwards: 0,
    publishedCount: 0,
    archivedCount: 0,
    categoryCounts: {},
    recentUpdates: []
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
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
  const [filterYear, setFilterYear] = useState('all');
  const [filterStation, setFilterStation] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [showLegend, setShowLegend] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Audit trail state
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTrail, setAuditTrail] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditFilters, setAuditFilters] = useState({
    award_id: '',
    action: '',
    user_id: '',
    date_from: '',
    date_to: ''
  });
  
  // Award categories
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'leadership', name: 'Leadership' },
    { id: 'innovation', name: 'Innovation' },
    { id: 'service', name: 'Community Service' },
    { id: 'environment', name: 'Environmental' },
    { id: 'education', name: 'Academic' },
    { id: 'arts', name: 'Arts & Culture' },
    { id: 'sports', name: 'Sports' },
    { id: 'technology', name: 'Technology' }
  ];
  
  // Bookmark status types - removed 'popular' type
  const bookmarkTypes = [
    { id: 'new', name: 'New', color: '#10b981', description: 'Recently added award' },
    { id: 'updated', name: 'Updated', color: '#f59e0b', description: 'Award was recently updated' }
  ];
  
  // Action type colors for audit trail
  const actionTypeColors = {
    create: '#10b981', // Green
    update: '#f59e0b', // Amber
    archive: '#8b5cf6', // Purple
    restore: '#3b82f6', // Blue
    delete: '#ef4444'  // Red
  };
  
  // Load awards with pagination
  const fetchAwards = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page: page,
        per_page: itemsPerPage
      };
      
      // Add filters if they're set
      if (searchQuery) params.search = searchQuery;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterCategory !== 'all') params.category = filterCategory;
      if (filterYear !== 'all') params.year = filterYear;
      if (filterStation !== 'all') params.sk_station = filterStation;
      
      const response = await axios.get('/api/awards', { params });
      
      const { awards, pagination } = response.data;
      
      setAwards(awards);
      setFilteredAwards(awards);
      setCurrentPage(pagination.current_page);
      setTotalPages(pagination.total_pages);
      setTotalItems(pagination.total_items);
      setSelectedItems([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Failed to fetch awards:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load awards'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get('/api/awards/statistics');
      if (response.data.success) {
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };
  
  // Fetch audit trail data
  const fetchAuditTrail = async (page = 1) => {
    try {
      setAuditLoading(true);
      
      const response = await axios.get('/api/awards/audit-trail', {
        params: {
          ...auditFilters,
          page: page,
          per_page: 10 // Adjust as needed
        }
      });
      
      if (response.data.success) {
        setAuditTrail(response.data.audit_trail.data);
        setAuditCurrentPage(response.data.audit_trail.current_page);
        setAuditTotalPages(response.data.audit_trail.last_page);
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to load audit trail'
        });
      }
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load audit trail'
      });
    } finally {
      setAuditLoading(false);
    }
  };
  
  // Initial data load
  useEffect(() => {
    fetchAwards();
    fetchStatistics();
  }, []);
  
  // Handle pagination
  useEffect(() => {
    fetchAwards(currentPage);
  }, [currentPage, itemsPerPage]);
  
  // Handle filter changes
  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
    fetchAwards(1);
  }, [searchQuery, filterStatus, filterCategory, filterYear, filterStation]);
  
  // Get unique years for filter
  const years = useMemo(() => {
    // Create a set with all years, then convert to array and sort
    const yearSet = new Set(awards.map(award => award.year.toString()));
    const sortedYears = ['all', ...Array.from(yearSet)].sort((a, b) => {
      if (a === 'all') return -1;
      if (b === 'all') return 1;
      return b - a; // Sort years in descending order
    });
    return sortedYears;
  }, [awards]);
  
  // Get unique stations for filter
  const stations = useMemo(() => {
    // Create a set with all stations, then convert to array and sort
    const stationSet = new Set(awards.map(award => award.sk_station));
    return ['all', ...Array.from(stationSet)].sort((a, b) => {
      if (a === 'all') return -1;
      return a.localeCompare(b);
    });
  }, [awards]);
  
  // Add award
  const handleAddClick = () => {
    setEditItem(null);
    setShowForm(true);
  };
  
  // View award details
  const handleViewClick = async (item) => {
    try {
      const response = await axios.get(`/api/awards/${item.id}/view`);
      setViewItem(response.data.award);
      setShowDetail(true);
    } catch (error) {
      console.error('Error viewing award:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load award details'
      });
    }
  };
  
  // Edit award
  const handleEditClick = (item) => {
    setEditItem(item);
    setShowForm(true);
  };
  
  // Archive award
  const handleArchiveClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Archive Award',
      message: 'Are you sure you want to archive this award?',
      confirmText: 'Archive',
      confirmColor: 'warning',
      onConfirm: () => archiveAward(id)
    });
  };
  
  const archiveAward = async (id) => {
    try {
      await axios.put(`/api/awards/${id}/archive`);
      setNotification({
        type: 'success',
        message: 'Award archived successfully'
      });
      fetchAwards(currentPage);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to archive award:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to archive award'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Restore award
  const handleRestoreClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Award',
      message: 'Are you sure you want to restore this award?',
      confirmText: 'Restore',
      confirmColor: 'success',
      onConfirm: () => restoreAward(id)
    });
  };
  
  const restoreAward = async (id) => {
    try {
      await axios.put(`/api/awards/${id}/restore`);
      setNotification({
        type: 'success',
        message: 'Award restored successfully'
      });
      fetchAwards(currentPage);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to restore award:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to restore award'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Delete award
  const handleDeleteClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Award',
      message: 'Are you sure you want to delete this award? This action cannot be undone.',
      confirmText: 'Delete',
      confirmColor: 'danger',
      onConfirm: () => deleteAward(id)
    });
  };
  
  const deleteAward = async (id) => {
    try {
      await axios.delete(`/api/awards/${id}`);
      setNotification({
        type: 'success',
        message: 'Award deleted successfully'
      });
      fetchAwards(currentPage);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to delete award:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to delete award'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Bulk archive awards
  const handleBulkArchive = (ids) => {
    if (!ids.length) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Archive Selected Awards',
      message: `Are you sure you want to archive ${ids.length} selected awards?`,
      confirmText: 'Archive All',
      confirmColor: 'warning',
      onConfirm: () => bulkArchiveAwards(ids)
    });
  };
  
  const bulkArchiveAwards = async (ids) => {
    try {
      await axios.post('/api/awards/bulk-archive', { ids });
      
      setNotification({
        type: 'success',
        message: `Awards archived successfully`
      });
      fetchAwards(currentPage);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to archive awards:', error);
      setNotification({
        type: 'error',
        message: 'Failed to archive some or all awards'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Bulk restore awards
  const handleBulkRestore = (ids) => {
    if (!ids.length) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Selected Awards',
      message: `Are you sure you want to restore ${ids.length} selected awards?`,
      confirmText: 'Restore All',
      confirmColor: 'success',
      onConfirm: () => bulkRestoreAwards(ids)
    });
  };
  
  const bulkRestoreAwards = async (ids) => {
    try {
      await axios.post('/api/awards/bulk-restore', { ids });
      
      setNotification({
        type: 'success',
        message: `Awards restored successfully`
      });
      fetchAwards(currentPage);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to restore awards:', error);
      setNotification({
        type: 'error',
        message: 'Failed to restore some or all awards'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Bulk delete awards
  const handleBulkDelete = (ids) => {
    if (!ids.length) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Selected Awards',
      message: `Are you sure you want to delete ${ids.length} selected awards? This action cannot be undone.`,
      confirmText: 'Delete All',
      confirmColor: 'danger',
      onConfirm: () => bulkDeleteAwards(ids)
    });
  };
  
  const bulkDeleteAwards = async (ids) => {
    try {
      await axios.post('/api/awards/bulk-delete', { ids });
      
      setNotification({
        type: 'success',
        message: `Awards deleted successfully`
      });
      fetchAwards(currentPage);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to delete awards:', error);
      setNotification({
        type: 'error',
        message: 'Failed to delete some or all awards'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };
  
  // Save award (add or update)
  const handleSaveAward = async (formData) => {
    try {
      console.log('Saving award data...');
      
      if (editItem) {
        console.log('Updating existing award ID:', editItem.id);
        
        // For Laravel, we need to use POST with _method=PUT for file uploads
        // This is because browsers don't support sending files with PUT requests properly
        const response = await axios.post(`/api/awards/${editItem.id}`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        });
        
        console.log('Update response:', response.data);
        
        setNotification({
          type: 'success',
          message: 'Award updated successfully'
        });
      } else {
        console.log('Creating new award');
        const response = await axios.post('/api/awards', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        });
        
        console.log('Create response:', response.data);
        
        setNotification({
          type: 'success',
          message: 'Award added successfully'
        });
      }
      
      setShowForm(false);
      fetchAwards(currentPage);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to save award:', error);
      
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
          message: error.response?.data?.error || 'Failed to save award'
        });
      }
    }
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      // Only select items the user can manage
      const manageable = filteredAwards.filter(award => canManageAward(award));
      setSelectedItems(manageable.map(award => award.id));
    }
    setSelectAll(!selectAll);
  };
  
  // Check if user has permission to edit/archive/delete
  const canManageAward = (award) => {
    // Federasyon can manage all awards
    if (skUser.sk_role === 'Federasyon') {
      return true;
    } 
    
    // Check if award was created by Federasyon (special protection)
    const createdByFederasyon = award.creator && award.creator.sk_role === 'Federasyon';
    if (createdByFederasyon && skUser.sk_role !== 'Federasyon') {
      return false;
    }
    
    // Chairman can manage their own awards and Kagawad awards in their station
    if (skUser.sk_role === 'Chairman') {
      return award.sk_station === skUser.sk_station && 
        (award.created_by === skUser.id || 
          (award.creator && award.creator.sk_role === 'Kagawad'));
    } 
    
    // Kagawad can only manage their own awards
    return award.created_by === skUser.id;
  };
  
  // Handle individual item selection
  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
      setSelectAll(false);
    } else {
      setSelectedItems([...selectedItems, id]);
      
      // If all items are now selected, set selectAll to true
      if (selectedItems.length + 1 === filteredAwards.length) {
        setSelectAll(true);
      }
    }
  };
  
  // Get filtered selected items by status
  const getFilteredSelectedItems = (status) => {
    return selectedItems.filter(id => {
      const award = filteredAwards.find(a => a.id === id);
      return award && award.status === status;
    });
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Format date with time
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
  
  // Format time ago
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
  
  // Toggle view mode between grid and table
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };
  
  // Toggle legend visibility
  const toggleLegend = () => {
    setShowLegend(!showLegend);
  };
  
  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxDisplayButtons = 5; // Maximum number of page buttons to display
    
    // Always add first page button
    buttons.push(
      <button 
        key="first" 
        className={`sk-award-pagination-btn ${currentPage === 1 ? 'active' : ''}`}
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
    
    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button 
          key={i} 
          className={`sk-award-pagination-btn ${currentPage === i ? 'active' : ''}`}
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
    
    // Always add last page button if there's more than one page
    if (totalPages > 1) {
      buttons.push(
        <button 
          key="last" 
          className={`sk-award-pagination-btn ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          {totalPages}
        </button>
      );
    }
    
    return buttons;
  };
  
  // Audit Trail Functions
  
  // Open audit trail modal
  const openAuditModal = () => {
    setShowAuditModal(true);
    fetchAuditTrail();
  };

  // Close audit trail modal
  const closeAuditModal = () => {
    setShowAuditModal(false);
    // Reset filters when closing
    setAuditFilters({
      award_id: '',
      action: '',
      user_id: '',
      date_from: '',
      date_to: ''
    });
  };

  // Handle audit filter changes
  const handleAuditFilterChange = (e) => {
    const { name, value } = e.target;
    setAuditFilters({
      ...auditFilters,
      [name]: value
    });
  };

  // Apply audit filters
  const applyAuditFilters = () => {
    setAuditCurrentPage(1);
    fetchAuditTrail(1);
  };

  // Reset audit filters
  const resetAuditFilters = () => {
    setAuditFilters({
      award_id: '',
      action: '',
      user_id: '',
      date_from: '',
      date_to: ''
    });
    
    // Fetch with reset filters
    fetchAuditTrail(1);
  };

  // Handle audit trail pagination
  const goToAuditPage = (page) => {
    if (page >= 1 && page <= auditTotalPages) {
      setAuditCurrentPage(page);
      fetchAuditTrail(page);
    }
  };

  // Generate audit pagination buttons
  const renderAuditPaginationButtons = () => {
    const buttons = [];
    const maxDisplayButtons = 5; // Maximum number of page buttons to display
    
    // Always add first page button
    buttons.push(
      <button 
        key="first" 
        className={`sk-cmn-sklcss-award-audit-pagination-btn ${auditCurrentPage === 1 ? 'active' : ''}`}
        onClick={() => goToAuditPage(1)}
        disabled={auditCurrentPage === 1}
      >
        1
      </button>
    );
    
    // Calculate start and end page
    let startPage = Math.max(2, auditCurrentPage - Math.floor(maxDisplayButtons / 2));
    let endPage = Math.min(auditTotalPages - 1, startPage + maxDisplayButtons - 3);
    
    if (endPage <= startPage) endPage = startPage;
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      buttons.push(<span key="ellipsis1">...</span>);
    }
    
    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button 
          key={i} 
          className={`sk-cmn-sklcss-award-audit-pagination-btn ${auditCurrentPage === i ? 'active' : ''}`}
          onClick={() => goToAuditPage(i)}
        >
          {i}
        </button>
      );
    }
    
    // Add ellipsis before last page if needed
    if (endPage < auditTotalPages - 1) {
      buttons.push(<span key="ellipsis2">...</span>);
    }
    
    // Always add last page button if there's more than one page
    if (auditTotalPages > 1) {
      buttons.push(
        <button 
          key="last" 
          className={`sk-cmn-sklcss-award-audit-pagination-btn ${auditCurrentPage === auditTotalPages ? 'active' : ''}`}
          onClick={() => goToAuditPage(auditTotalPages)}
          disabled={auditCurrentPage === auditTotalPages}
        >
          {auditTotalPages}
        </button>
      );
    }
    
    return buttons;
  };

  // Format action type for display
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

  // Get action color for audit trail
  const getActionColor = (action) => {
    return actionTypeColors[action] || '#6b7280';
  };
  
  // Calculate counts for bulk actions
  const publishedSelectedCount = getFilteredSelectedItems('published').length;
  const archivedSelectedCount = getFilteredSelectedItems('archived').length;
  
  return (
    <div className="sk-award-mgmt-container">
      <div className="sk-award-mgmt-header">
        <h1 className="sk-award-mgmt-title">Award Management</h1>
        <p className="sk-award-mgmt-description">
          Manage awards and recognitions for the Youth Awards page
        </p>
      </div>
      
      {/* Dashboard Layout with Sidebar - FIXED: Controls now inside the main content */}
      <div className="sk-award-mgmt-dashboard">
        <div className="sk-award-mgmt-main">
          {/* Controls */}
          <div className="sk-award-mgmt-controls">
            <div className="sk-award-mgmt-search">
              <div className="sk-award-mgmt-search-input">
                <FaSearch className="sk-award-mgmt-search-icon" />
                <input
                  type="text"
                  placeholder="Search by title, description, or recipients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sk-award-mgmt-input"
                />
              </div>
              
              <div className="sk-award-mgmt-filters">
                <div className="sk-award-mgmt-filter">
                  <label>Status:</label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="sk-award-mgmt-select"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                
                <div className="sk-award-mgmt-filter">
                  <label>Category:</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="sk-award-mgmt-select"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="sk-award-mgmt-filter">
                  <label>Year:</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="sk-award-mgmt-select"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year === 'all' ? 'All Years' : year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="sk-award-mgmt-filter">
                  <label>Station:</label>
                  <select
                    value={filterStation}
                    onChange={(e) => setFilterStation(e.target.value)}
                    className="sk-award-mgmt-select"
                  >
                    {stations.map(station => (
                      <option key={station} value={station}>
                        {station === 'all' ? 'All Stations' : station}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sk-award-mgmt-view-toggle">
                  <button 
                    className={`sk-award-mgmt-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => toggleViewMode('grid')}
                    title="Grid View"
                  >
                    <FaTh />
                  </button>
                  <button 
                    className={`sk-award-mgmt-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => toggleViewMode('table')}
                    title="Table View"
                  >
                    <FaList />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="sk-award-mgmt-action-buttons">
              {filteredAwards.length > 0 && (
                <button 
                  className="sk-award-mgmt-select-all-btn"
                  onClick={handleSelectAll}
                >
                  {selectAll ? 'Unselect All' : 'Select All'}
                </button>
              )}
              
              {/* Audit Trail Button */}
              <button 
                className="sk-cmn-sklcss-award-audit-trail-btn"
                onClick={openAuditModal}
              >
                <FaHistory /> View Audit Trail
              </button>
              
              <button 
                className="sk-award-mgmt-add-btn"
                onClick={handleAddClick}
              >
                <FaPlus /> Add Award
              </button>
            </div>
          </div>
          
          {/* Bookmark Legend */}
          <div className="sk-award-bookmark-simple-legend">
            {bookmarkTypes.map(type => (
              <div key={type.id} className="sk-award-bookmark-legend-pill">
                <div 
                  className="sk-award-bookmark-sample" 
                  style={{ backgroundColor: type.color }}
                ></div>
                <span>{type.name}</span>
              </div>
            ))}
          </div>
          
          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="sk-award-bulk-actions">
              <div className="sk-award-bulk-info">
                <FaCheck className="sk-award-bulk-info-icon" /> 
                <span>{selectedItems.length} awards selected</span>
              </div>
              <div className="sk-award-bulk-buttons">
                {publishedSelectedCount > 0 && (
                  <button 
                    className="sk-award-bulk-btn sk-award-bulk-archive"
                    onClick={() => handleBulkArchive(getFilteredSelectedItems('published'))}
                  >
                    <FaArchive /> Archive Selected ({publishedSelectedCount})
                  </button>
                )}
                
                {archivedSelectedCount > 0 && (
                  <button 
                    className="sk-award-bulk-btn sk-award-bulk-restore"
                    onClick={() => handleBulkRestore(getFilteredSelectedItems('archived'))}
                  >
                    <FaUndoAlt /> Restore Selected ({archivedSelectedCount})
                  </button>
                )}
                
                <button 
                  className="sk-award-bulk-btn sk-award-bulk-delete"
                  onClick={() => handleBulkDelete(selectedItems)}
                >
                  <FaTrash /> Delete Selected ({selectedItems.length})
                </button>
                
                <button 
                  className="sk-award-bulk-btn sk-award-bulk-cancel"
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
          
          {/* Main Content - Table or Grid View */}
          {loading ? (
            <div className="sk-award-loading">
              <div className="sk-award-loading-spinner"></div>
              <p className="sk-award-loading-text">Loading awards...</p>
            </div>
          ) : filteredAwards.length === 0 ? (
            <div className="sk-award-empty">
              <FaTrophy className="sk-award-empty-icon" />
              <h3 className="sk-award-empty-text">No awards found</h3>
              <p className="sk-award-empty-subtext">
                {searchQuery || filterCategory !== 'all' || filterStatus !== 'all' || 
                 filterYear !== 'all' || filterStation !== 'all' ? 
                  "Try adjusting your search criteria or filters." : 
                  "Click the 'Add Award' button to get started."}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <AwardGrid 
              awards={filteredAwards}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onView={handleViewClick}
              onEdit={handleEditClick}
              onArchive={handleArchiveClick}
              onRestore={handleRestoreClick}
              onDelete={handleDeleteClick}
              canManageAward={canManageAward}
              categories={categories}
              bookmarkTypes={bookmarkTypes}
            />
          ) : (
            <AwardTable
              awards={filteredAwards}
              loading={loading}
              skUser={skUser}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onView={handleViewClick}
              onEdit={handleEditClick}
              onArchive={handleArchiveClick}
              onRestore={handleRestoreClick}
              onDelete={handleDeleteClick}
              canManageAward={canManageAward}
              bookmarkTypes={bookmarkTypes}
            />
          )}
          
          {/* Pagination Controls */}
          {totalPages > 0 && (
            <div className="sk-award-pagination">
              <div className="sk-award-pagination-info">
                Showing {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(totalItems, currentPage * itemsPerPage)} of {totalItems} awards
              </div>
              
              <button 
                className={`sk-award-pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                title="Previous Page"
              >
                <FaChevronLeft />
              </button>
              
              {renderPaginationButtons()}
              
              <button 
                className={`sk-award-pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="Next Page"
              >
                <FaChevronRight />
              </button>
              
              <div className="sk-award-per-page">
                <span className="sk-award-per-page-label">Show:</span>
                <select 
                  className="sk-award-per-page-select"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={36}>36</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Statistics Sidebar */}
        <div className="sk-award-mgmt-sidebar">
          {/* Award Overview Stats */}
          <div className="sk-award-stats-container">
            <div className="sk-award-stats-header">
              <FaChartBar /> Award Overview
            </div>
            <div className="sk-award-stats-body">
              <div className="sk-award-stat-item">
                <div className="sk-award-stat-icon blue">
                  <FaTrophy />
                </div>
                <div className="sk-award-stat-info">
                  <p className="sk-award-stat-title">Total Awards</p>
                  <p className="sk-award-stat-value">
                    {statsLoading ? '...' : statistics.totalAwards}
                  </p>
                </div>
              </div>
              
              <div className="sk-award-stat-item">
                <div className="sk-award-stat-icon green">
                  <FaCheck />
                </div>
                <div className="sk-award-stat-info">
                  <p className="sk-award-stat-title">Published Awards</p>
                  <p className="sk-award-stat-value">
                    {statsLoading ? '...' : statistics.publishedCount}
                  </p>
                </div>
              </div>
              
              <div className="sk-award-stat-item">
                <div className="sk-award-stat-icon amber">
                  <FaArchive />
                </div>
                <div className="sk-award-stat-info">
                  <p className="sk-award-stat-title">Archived Awards</p>
                  <p className="sk-award-stat-value">
                    {statsLoading ? '...' : statistics.archivedCount}
                  </p>
                </div>
              </div>
              
              <div className="sk-award-stat-item">
                <div className="sk-award-stat-icon purple">
                  <FaMapMarkerAlt />
                </div>
                <div className="sk-award-stat-info">
                  <p className="sk-award-stat-title">SK Stations</p>
                  <p className="sk-award-stat-value">
                    {statsLoading ? '...' : stations.length > 0 ? stations.length - 1 : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Categories Stats */}
          <div className="sk-award-stats-container">
            <div className="sk-award-stats-header">
              <FaFilter /> Awards by Category
            </div>
            <div className="sk-award-stats-body">
              {statsLoading ? (
                <div className="sk-award-stats-loading">Loading category statistics...</div>
              ) : (
                <>
                  <div className="sk-award-category-stats">
                    {categories.filter(cat => cat.id !== 'all').map(category => (
                      <div key={category.id} className="sk-award-category-stat">
                        <span className="sk-award-category-stat-name">{category.name}</span>
                        <span className="sk-award-category-stat-value">
                          {statistics.categoryCounts[category.id] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="sk-award-progress-container">
                    <div 
                      className="sk-award-progress-bar" 
                      style={{ 
                        width: `${statistics.totalAwards > 0 ? 
                          (statistics.publishedCount / statistics.totalAwards) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Recent Updates */}
          <div className="sk-award-stats-container">
            <div className="sk-award-stats-header">
              <FaHistory /> Recently Updated
            </div>
            <div className="sk-award-stats-body">
              {statsLoading ? (
                <div className="sk-award-stats-loading">Loading recent updates...</div>
              ) : statistics.recentUpdates && statistics.recentUpdates.length > 0 ? (
                <div className="sk-award-top-viewed">
                  {statistics.recentUpdates.map(award => (
                    <div key={award.id} className="sk-award-top-viewed-item">
                      <img 
                        src={`/storage/${award.main_image}`} 
                        alt={award.title} 
                        className="sk-award-top-viewed-img"
                      />
                      <div className="sk-award-top-viewed-info">
                        <h4 className="sk-award-top-viewed-title">{award.title}</h4>
                        <div className="sk-award-top-viewed-meta">
                          <FaClock /> {formatTimeAgo(award.updated_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No recent updates.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Award Form Modal */}
      {showForm && (
        <AwardForm
          show={showForm}
          onHide={() => setShowForm(false)}
          onSave={handleSaveAward}
          initialData={editItem}
          skUser={skUser}
        />
      )}
      
      {/* Award Detail Modal */}
      {showDetail && viewItem && (
        <AwardDetail
          award={viewItem}
          onClose={() => setShowDetail(false)}
        />
      )}
      
      {/* Audit Trail Modal */}
      {showAuditModal && (
        <div className="sk-cmn-sklcss-award-audit-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAuditModal()}>
          <div 
            className="sk-cmn-sklcss-award-audit-modal-content" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sk-cmn-sklcss-award-audit-modal-header">
              <h2 className="sk-cmn-sklcss-award-audit-modal-title">
                <FaHistory /> Award Audit Trail
              </h2>
              <button 
                className="sk-cmn-sklcss-award-audit-modal-close" 
                onClick={closeAuditModal}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="sk-cmn-sklcss-award-audit-filters">
              <div className="sk-cmn-sklcss-award-audit-filter-row">
                <div className="sk-cmn-sklcss-award-audit-filter">
                  <label>Award:</label>
                  <select 
                    name="award_id" 
                    value={auditFilters.award_id} 
                    onChange={handleAuditFilterChange}
                  >
                    <option value="">All Awards</option>
                    {awards.map(award => (
                      <option key={award.id} value={award.id}>
                        {award.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="sk-cmn-sklcss-award-audit-filter">
                  <label>Action:</label>
                  <select 
                    name="action" 
                    value={auditFilters.action} 
                    onChange={handleAuditFilterChange}
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
              
              <div className="sk-cmn-sklcss-award-audit-filter-row">
                <div className="sk-cmn-sklcss-award-audit-filter">
                  <label>From Date:</label>
                  <input 
                    type="date" 
                    name="date_from" 
                    value={auditFilters.date_from} 
                    onChange={handleAuditFilterChange}
                  />
                </div>
                
                <div className="sk-cmn-sklcss-award-audit-filter">
                  <label>To Date:</label>
                  <input 
                    type="date" 
                    name="date_to" 
                    value={auditFilters.date_to} 
                    onChange={handleAuditFilterChange}
                  />
                </div>
              </div>
              
              <div className="sk-cmn-sklcss-award-audit-filter-buttons">
                <button 
                  className="sk-cmn-sklcss-award-audit-filter-apply" 
                  onClick={applyAuditFilters}
                >
                  Apply Filters
                </button>
                <button 
                  className="sk-cmn-sklcss-award-audit-filter-reset" 
                  onClick={resetAuditFilters}
                >
                  Reset Filters
                </button>
              </div>
            </div>
            
            <div className="sk-cmn-sklcss-award-audit-trail-content">
              {auditLoading ? (
                <div className="sk-cmn-sklcss-award-audit-loading">
                  <div className="sk-cmn-sklcss-award-loading-spinner"></div>
                  <p>Loading audit trail...</p>
                </div>
              ) : auditTrail.length === 0 ? (
                <div className="sk-cmn-sklcss-award-audit-empty">
                  <FaHistory className="sk-cmn-sklcss-award-audit-empty-icon" />
                  <p>No audit trail records found</p>
                  <span>Try adjusting your filters or check back later</span>
                </div>
              ) : (
                <div className="sk-cmn-sklcss-award-audit-list">
                  {auditTrail.map(entry => (
                    <div key={entry.id} className="sk-cmn-sklcss-award-audit-item">
                      <div className="sk-cmn-sklcss-award-audit-item-header">
                        <div 
                          className="sk-cmn-sklcss-award-audit-action" 
                          style={{ backgroundColor: getActionColor(entry.action) }}
                        >
                          {formatActionType(entry.action)}
                        </div>
                        <div className="sk-cmn-sklcss-award-audit-award-title">
                          {entry.award_title || 'Unknown Award'}
                        </div>
                        <div className="sk-cmn-sklcss-award-audit-timestamp">
                          {formatDateTime(entry.created_at)}
                        </div>
                      </div>
                      <div className="sk-cmn-sklcss-award-audit-item-content">
                        <div className="sk-cmn-sklcss-award-audit-user">
                          <FaUser className="sk-cmn-sklcss-award-audit-user-icon" />
                          <span>{entry.user_name || 'Unknown User'}</span>
                        </div>
                        <div className="sk-cmn-sklcss-award-audit-details">
                          {entry.action === 'create' && (
                            <p>Created a new award in the {JSON.parse(entry.details)?.category || 'Unknown'} category</p>
                          )}
                          {entry.action === 'update' && (
                            <div className="sk-cmn-sklcss-award-audit-update-details">
                              <p>Updated award properties:</p>
                              {JSON.parse(entry.details)?.media_updated && (
                                <span className="sk-cmn-sklcss-award-audit-detail-item">
                                  • Media was updated (images/videos)
                                </span>
                              )}
                              {JSON.parse(entry.details)?.before?.title !== JSON.parse(entry.details)?.after?.title && (
                                <span className="sk-cmn-sklcss-award-audit-detail-item">
                                  • Title changed from "{JSON.parse(entry.details)?.before?.title}" to "{JSON.parse(entry.details)?.after?.title}"
                                </span>
                              )}
                              {JSON.parse(entry.details)?.before?.category !== JSON.parse(entry.details)?.after?.category && (
                                <span className="sk-cmn-sklcss-award-audit-detail-item">
                                  • Category changed from "{JSON.parse(entry.details)?.before?.category}" to "{JSON.parse(entry.details)?.after?.category}"
                                </span>
                              )}
                              {JSON.parse(entry.details)?.before?.recipients !== JSON.parse(entry.details)?.after?.recipients && (
                                <span className="sk-cmn-sklcss-award-audit-detail-item">
                                  • Recipients changed from "{JSON.parse(entry.details)?.before?.recipients}" to "{JSON.parse(entry.details)?.after?.recipients}"
                                </span>
                              )}
                              {JSON.parse(entry.details)?.before?.year !== JSON.parse(entry.details)?.after?.year && (
                                <span className="sk-cmn-sklcss-award-audit-detail-item">
                                  • Year changed from "{JSON.parse(entry.details)?.before?.year}" to "{JSON.parse(entry.details)?.after?.year}"
                                </span>
                              )}
                              {JSON.parse(entry.details)?.before?.sk_station !== JSON.parse(entry.details)?.after?.sk_station && (
                                <span className="sk-cmn-sklcss-award-audit-detail-item">
                                  • Station changed from "{JSON.parse(entry.details)?.before?.sk_station}" to "{JSON.parse(entry.details)?.after?.sk_station}"
                                </span>
                              )}
                              {JSON.parse(entry.details)?.before?.description !== JSON.parse(entry.details)?.after?.description && (
                                <span className="sk-cmn-sklcss-award-audit-detail-item">
                                  • Description was updated
                                </span>
                              )}
                            </div>
                          )}
                          {entry.action === 'archive' && (
                            <p>Archived the award</p>
                          )}
                          {entry.action === 'restore' && (
                            <p>Restored the award from archived status</p>
                          )}
                          {entry.action === 'delete' && (
                            <div className="sk-cmn-sklcss-award-audit-delete-details">
                              <p>Deleted the award permanently</p>
                              <span className="sk-cmn-sklcss-award-audit-detail-item">
                                • Category: {JSON.parse(entry.details)?.category || 'Unknown'}
                              </span>
                              <span className="sk-cmn-sklcss-award-audit-detail-item">
                                • Year: {JSON.parse(entry.details)?.year || 'Unknown'}
                              </span>
                              <span className="sk-cmn-sklcss-award-audit-detail-item">
                                • Station: {JSON.parse(entry.details)?.sk_station || 'Unknown'}
                              </span>
                              <span className="sk-cmn-sklcss-award-audit-detail-item">
                                • Recipients: {JSON.parse(entry.details)?.recipients || 'Unknown'}
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
              {!auditLoading && auditTrail.length > 0 && (
                <div className="sk-cmn-sklcss-award-audit-pagination">
                  <button 
                    className={`sk-cmn-sklcss-award-audit-pagination-btn ${auditCurrentPage === 1 ? 'disabled' : ''}`}
                    onClick={() => goToAuditPage(auditCurrentPage - 1)}
                    disabled={auditCurrentPage === 1}
                  >
                    <FaChevronLeft />
                  </button>
                  
                  {renderAuditPaginationButtons()}
                  
                  <button 
                    className={`sk-cmn-sklcss-award-audit-pagination-btn ${auditCurrentPage === auditTotalPages ? 'disabled' : ''}`}
                    onClick={() => goToAuditPage(auditCurrentPage + 1)}
                    disabled={auditCurrentPage === auditTotalPages}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
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
        confirmColor={confirmDialog.confirmColor}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default AwardManagement;