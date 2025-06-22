import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../Contexts/AuthContext';
import axios from 'axios';
import { 
  FaPlus, FaEdit, FaTrash, FaArchive, FaUndo, FaSearch, 
  FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, 
  FaDownload, FaEye, FaCheck, FaCheckSquare, FaSquare, FaTimes,
  FaCalendarAlt, FaSave, FaFilter, FaChartBar, FaTrophy, FaClock,
  FaFolderOpen, FaUserEdit, FaHistory, FaTh, FaList, FaSortAmountDown,
  FaBookmark, FaInfoCircle, FaQuestionCircle, FaChevronLeft, FaChevronRight,
  FaClipboardList, FaUser
} from 'react-icons/fa';
import '../css/TemplateManagement.css';
import Notification from '../Components/Notification';
import ConfirmationDialog from '../Components/ConfirmationDialog';

const TemplateManagement = () => {
  const { skUser } = useContext(AuthContext);
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', or 'archived'
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showLegend, setShowLegend] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'reports',
    file: null
  });
  const [formErrors, setFormErrors] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  // Audit trail state
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTrail, setAuditTrail] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditFilters, setAuditFilters] = useState({
    template_id: '',
    action: '',
    user_id: '',
    date_from: '',
    date_to: ''
  });

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'reports', name: 'Reports & Documentation' },
    { id: 'forms', name: 'Forms & Applications' },
    { id: 'letters', name: 'Official Letters' },
    { id: 'budget', name: 'Budget & Finance' },
    { id: 'events', name: 'Event Planning' }
  ];

  // Bookmark status types - Removed 'featured' as it has no relevance
  const bookmarkTypes = [
    { id: 'new', name: 'New', color: '#10b981', description: 'Recently added template' },
    { id: 'updated', name: 'Updated', color: '#f59e0b', description: 'Template was recently updated' },
    { id: 'popular', name: 'Popular', color: '#ef4444', description: 'Frequently downloaded template' }
  ];

  // Action type colors for audit trail
  const actionTypeColors = {
    create: '#10b981', // Green
    update: '#f59e0b', // Amber
    archive: '#8b5cf6', // Purple
    restore: '#3b82f6', // Blue
    delete: '#ef4444'  // Red
  };

  // Fetch templates from API
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/templates', {
        params: {
          include_archived: true // Always fetch all templates to properly manage filters
        }
      });
      
      // Add bookmark status based on actual template data
      const templatesWithBookmarks = response.data.map(template => {
        // Get dates for calculations
        const createdDate = new Date(template.created_at);
        const updatedDate = new Date(template.updated_at);
        const now = new Date();
        const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        
        // Default bookmarkStatus is null (no bookmark)
        let bookmarkStatus = null;
        
        // First check for popular templates - highest priority
        if (template.download_count >= 10) {
          bookmarkStatus = 'popular';
        } 
        // Next check if the template has been updated at all (updated_at is different from created_at)
        // Convert to timestamps for more accurate comparison
        else if (updatedDate.getTime() > createdDate.getTime()) {
          bookmarkStatus = 'updated';
        }
        // Finally check for new templates if they haven't been updated
        else if (daysSinceCreation < 7) {
          bookmarkStatus = 'new';
        }
        
        return {
          ...template,
          bookmarkStatus
        };
      });
      
      setTemplates(templatesWithBookmarks);
      applyFilters(templatesWithBookmarks);
      setSelectedItems([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Error fetching templates:', error);
      showNotification('Failed to load templates', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Fetch audit trail data
  const fetchAuditTrail = async (page = 1) => {
    try {
      setAuditLoading(true);
      
      const response = await axios.get('/api/templates/audit-trail', {
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
        showNotification('Failed to load audit trail', 'error');
      }
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      showNotification('Failed to load audit trail', 'error');
    } finally {
      setAuditLoading(false);
    }
  };

  // Apply all filters to templates
  const applyFilters = (templatesArray) => {
    let filtered = [...templatesArray];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(template => template.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(query) || 
        template.description.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }
    
    setFilteredTemplates(filtered);
  };

  // Update filters when any filter changes
  useEffect(() => {
    applyFilters(templates);
  }, [searchQuery, selectedCategory, statusFilter, templates]);

  // Calculate pagination
  useEffect(() => {
    setTotalPages(Math.ceil(filteredTemplates.length / itemsPerPage));
    // If current page is greater than total pages, set it to last page
    if (currentPage > Math.ceil(filteredTemplates.length / itemsPerPage) && filteredTemplates.length > 0) {
      setCurrentPage(Math.ceil(filteredTemplates.length / itemsPerPage));
    }
  }, [filteredTemplates, itemsPerPage]);

  // Get current templates for the current page
  const getCurrentTemplates = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredTemplates.slice(indexOfFirstItem, indexOfLastItem);
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

  // Handle audit trail pagination
  const goToAuditPage = (page) => {
    if (page >= 1 && page <= auditTotalPages) {
      setAuditCurrentPage(page);
      fetchAuditTrail(page);
    }
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
      template_id: '',
      action: '',
      user_id: '',
      date_from: '',
      date_to: ''
    });
    
    // Fetch with reset filters
    fetchAuditTrail(1);
  };

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxDisplayButtons = 5; // Maximum number of page buttons to display
    
    // Always add first page button
    buttons.push(
      <button 
        key="first" 
        className={`sk-cmn-sklcss-template-pagination-btn ${currentPage === 1 ? 'active' : ''}`}
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
          className={`sk-cmn-sklcss-template-pagination-btn ${currentPage === i ? 'active' : ''}`}
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
          className={`sk-cmn-sklcss-template-pagination-btn ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          {totalPages}
        </button>
      );
    }
    
    return buttons;
  };

  // Generate audit pagination buttons
  const renderAuditPaginationButtons = () => {
    const buttons = [];
    const maxDisplayButtons = 5; // Maximum number of page buttons to display
    
    // Always add first page button
    buttons.push(
      <button 
        key="first" 
        className={`sk-cmn-sklcss-template-pagination-btn ${auditCurrentPage === 1 ? 'active' : ''}`}
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
          className={`sk-cmn-sklcss-template-pagination-btn ${auditCurrentPage === i ? 'active' : ''}`}
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
          className={`sk-cmn-sklcss-template-pagination-btn ${auditCurrentPage === auditTotalPages ? 'active' : ''}`}
          onClick={() => goToAuditPage(auditTotalPages)}
          disabled={auditCurrentPage === auditTotalPages}
        >
          {auditTotalPages}
        </button>
      );
    }
    
    return buttons;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const categoryCounts = {};
    let totalActive = 0;
    let totalArchived = 0;
    let totalDownloads = 0;
    
    // Initialize category counts
    categories.forEach(category => {
      if (category.id !== 'all') {
        categoryCounts[category.id] = 0;
      }
    });
    
    // Calculate statistics
    templates.forEach(template => {
      if (template.status === 'active') {
        totalActive++;
        if (categories.some(cat => cat.id === template.category)) {
          categoryCounts[template.category]++;
        }
      } else {
        totalArchived++;
      }
      totalDownloads += template.download_count;
    });
    
    // Sort templates by download count to get top downloads
    const topDownloads = [...templates]
      .sort((a, b) => b.download_count - a.download_count)
      .slice(0, 5);
    
    // Get recently updated templates
    const recentUpdates = [...templates]
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5);
    
    return {
      totalTemplates: templates.length,
      totalActive,
      totalArchived,
      totalDownloads,
      categoryCounts,
      topDownloads,
      recentUpdates
    };
  }, [templates]);

  // Get file type icon
  const getFileIcon = (type) => {
    switch(type) {
      case 'docx':
      case 'doc':
        return <FaFileWord className="sk-cmn-sklcss-template-file-icon docx" />;
      case 'xlsx':
      case 'xls':
        return <FaFileExcel className="sk-cmn-sklcss-template-file-icon xlsx" />;
      case 'pptx':
      case 'ppt':
        return <FaFilePowerpoint className="sk-cmn-sklcss-template-file-icon pptx" />;
      case 'pdf':
        return <FaFilePdf className="sk-cmn-sklcss-template-file-icon pdf" />;
      default:
        return <FaFileAlt className="sk-cmn-sklcss-template-file-icon" />;
    }
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

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  // Toggle view mode between grid and list
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  // Toggle legend visibility
  const toggleLegend = () => {
    setShowLegend(!showLegend);
  };

  // Handle modal open/close
  const openModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        title: template.title,
        description: template.description,
        category: template.category,
        file: null
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        title: '',
        description: '',
        category: 'reports',
        file: null
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({
      title: '',
      description: '',
      category: 'reports',
      file: null
    });
    setFormErrors({});
  };

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
      template_id: '',
      action: '',
      user_id: '',
      date_from: '',
      date_to: ''
    });
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!editingTemplate && !formData.file) errors.file = 'File is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      
      if (formData.file) {
        data.append('file', formData.file);
      }
      
      let response;
      if (editingTemplate) {
        response = await axios.post(`/api/templates/${editingTemplate.id}`, data, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'X-HTTP-Method-Override': 'PUT'
          }
        });
      } else {
        response = await axios.post('/api/templates', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      if (response.data.success) {
        showNotification(editingTemplate ? 'Template updated successfully' : 'Template created successfully');
        closeModal();
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error saving template:', error);
      
      // Check for duplicate template error
      if (error.response?.data?.duplicate) {
        showNotification(error.response.data.message, 'error');
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        setFormErrors(error.response.data.errors);
        showNotification('Please correct the errors in the form', 'error');
      } else {
        showNotification('Failed to save template', 'error');
      }
    }
  };

  // Handle delete
  const handleDelete = (template) => {
    setConfirmDialog({
      title: 'Delete Template',
      message: `Are you sure you want to delete "${template.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const response = await axios.delete(`/api/templates/${template.id}`);
          if (response.data.success) {
            showNotification('Template deleted successfully');
            fetchTemplates();
          }
        } catch (error) {
          console.error('Error deleting template:', error);
          showNotification('Failed to delete template', 'error');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  // Handle archive/restore
  const handleArchiveRestore = async (template) => {
    const isArchived = template.status === 'archived';
    const action = isArchived ? 'restore' : 'archive';
    
    try {
      const response = await axios.put(`/api/templates/${template.id}/${action}`);
      if (response.data.success) {
        showNotification(`Template ${isArchived ? 'restored' : 'archived'} successfully`);
        fetchTemplates();
      }
    } catch (error) {
      console.error(`Error ${action}ing template:`, error);
      showNotification(`Failed to ${action} template`, 'error');
    }
  };

  // Handle preview
  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewTemplate(null);
  };
  
  // Handle bulk selection
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      // Select all items on the current page only
      const currentItems = getCurrentTemplates();
      const newSelectedItems = [...selectedItems];
      
      currentItems.forEach(template => {
        if (!newSelectedItems.includes(template.id)) {
          newSelectedItems.push(template.id);
        }
      });
      
      setSelectedItems(newSelectedItems);
    }
    
    // Update selectAll state based on whether all current page items are selected
    const currentItemIds = getCurrentTemplates().map(item => item.id);
    const allCurrentSelected = currentItemIds.every(id => selectedItems.includes(id));
    setSelectAll(!allCurrentSelected);
  };
  
  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
      setSelectAll(false);
    } else {
      setSelectedItems([...selectedItems, id]);
      // Check if all items on current page are now selected
      const currentItemIds = getCurrentTemplates().map(item => item.id);
      const allSelected = currentItemIds.every(itemId => 
        itemId === id || selectedItems.includes(itemId)
      );
      setSelectAll(allSelected);
    }
  };
  
  // Get filtered selected items by status
  const getFilteredSelectedItems = (status) => {
    return selectedItems.filter(id => {
      const template = templates.find(t => t.id === id);
      return template && template.status === status;
    });
  };
  
  // Handle bulk archive
  const handleBulkArchive = () => {
    const itemsToArchive = getFilteredSelectedItems('active');
    if (itemsToArchive.length === 0) return;
    
    setConfirmDialog({
      title: 'Archive Templates',
      message: `Are you sure you want to archive ${itemsToArchive.length} selected templates?`,
      onConfirm: async () => {
        try {
          const response = await axios.post('/api/templates/bulk-archive', { ids: itemsToArchive });
          if (response.data.success) {
            showNotification(response.data.message);
            fetchTemplates();
          }
        } catch (error) {
          console.error('Error archiving templates:', error);
          showNotification('Failed to archive templates', 'error');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };
  
  // Handle bulk restore
  const handleBulkRestore = () => {
    const itemsToRestore = getFilteredSelectedItems('archived');
    if (itemsToRestore.length === 0) return;
    
    setConfirmDialog({
      title: 'Restore Templates',
      message: `Are you sure you want to restore ${itemsToRestore.length} selected templates?`,
      onConfirm: async () => {
        try {
          const response = await axios.post('/api/templates/bulk-restore', { ids: itemsToRestore });
          if (response.data.success) {
            showNotification(response.data.message);
            fetchTemplates();
          }
        } catch (error) {
          console.error('Error restoring templates:', error);
          showNotification('Failed to restore templates', 'error');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };
  
  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    
    setConfirmDialog({
      title: 'Delete Templates',
      message: `Are you sure you want to delete ${selectedItems.length} selected templates? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const response = await axios.post('/api/templates/bulk-delete', { ids: selectedItems });
          if (response.data.success) {
            showNotification(response.data.message);
            fetchTemplates();
          }
        } catch (error) {
          console.error('Error deleting templates:', error);
          showNotification('Failed to delete templates', 'error');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  // Calculate counts for bulk actions
  const activeSelectedCount = getFilteredSelectedItems('active').length;
  const archivedSelectedCount = getFilteredSelectedItems('archived').length;

  // Find bookmark details from bookmarkStatus
  const getBookmarkDetails = (status) => {
    if (!status) return null;
    return bookmarkTypes.find(type => type.id === status);
  };

  return (
    <div className="sk-cmn-sklcss-template-management">
      {/* Header */}
      <div className="sk-cmn-sklcss-template-header">
        <h1 className="sk-cmn-sklcss-template-title">Template Management</h1>
        <p className="sk-cmn-sklcss-template-description">
          Manage official document templates for Sangguniang Kabataan operations. Add, edit, and organize templates for youth members to download.
        </p>
      </div>

      {/* Dashboard Layout with Sidebar - FIXED STRUCTURE */}
      <div className="sk-cmn-sklcss-template-dashboard">
        <div className="sk-cmn-sklcss-template-main">
          {/* Controls - Now INSIDE the main content area */}
          <div className="sk-cmn-sklcss-template-controls">
            <div className="sk-cmn-sklcss-template-search">
              <FaSearch className="sk-cmn-sklcss-template-search-icon" />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sk-cmn-sklcss-template-search-input"
              />
            </div>

            <div className="sk-cmn-sklcss-template-filter-group">
              <div className="sk-cmn-sklcss-template-filter">
                <span className="sk-cmn-sklcss-template-filter-label">Category:</span>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="sk-cmn-sklcss-template-filter-select"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sk-cmn-sklcss-template-filter">
                <span className="sk-cmn-sklcss-template-filter-label">Status:</span>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="sk-cmn-sklcss-template-filter-select"
                >
                  <option value="all">All Templates</option>
                  <option value="active">Active (Published)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="sk-cmn-sklcss-template-view-toggle">
                <button 
                  className={`sk-cmn-sklcss-template-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => toggleViewMode('grid')}
                  title="Grid View"
                >
                  <FaTh />
                </button>
                <button 
                  className={`sk-cmn-sklcss-template-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => toggleViewMode('list')}
                  title="List View"
                >
                  <FaList />
                </button>
              </div>
            </div>

            <div className="sk-cmn-sklcss-template-action-group">
              {filteredTemplates.length > 0 && (
                <button 
                  className="sk-cmn-sklcss-template-select-all-btn"
                  onClick={handleSelectAll}
                >
                  {selectAll ? 'Unselect All' : 'Select All'}
                </button>
              )}

              {/* Audit Trail Button */}
              <button 
                className="sk-cmn-sklcss-template-audit-trail-btn"
                onClick={openAuditModal}
              >
                <FaHistory /> View Audit Trail
              </button>

              <button 
                className="sk-cmn-sklcss-template-add-btn"
                onClick={() => openModal()}
              >
                <FaPlus /> Add New Template
              </button>
            </div>
          </div>

          {/* Bookmark Legend - Still inside main content */}
          <div className="sk-cmn-sklcss-bookmark-simple-legend">
            {bookmarkTypes.map(type => (
              <div key={type.id} className="sk-cmn-sklcss-bookmark-legend-pill">
                <div 
                  className="sk-cmn-sklcss-bookmark-sample" 
                  style={{ backgroundColor: type.color }}
                ></div>
                <span>{type.name}</span>
              </div>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="sk-cmn-sklcss-template-bulk-actions">
              <div className="sk-cmn-sklcss-template-bulk-info">
                <FaCheck className="sk-cmn-sklcss-template-bulk-info-icon" /> 
                <span>{selectedItems.length} templates selected</span>
              </div>
              <div className="sk-cmn-sklcss-template-bulk-buttons">
                {activeSelectedCount > 0 && (
                  <button 
                    className="sk-cmn-sklcss-template-bulk-btn sk-cmn-sklcss-template-bulk-archive"
                    onClick={handleBulkArchive}
                  >
                    <FaArchive /> Archive Selected ({activeSelectedCount})
                  </button>
                )}
                
                {archivedSelectedCount > 0 && (
                  <button 
                    className="sk-cmn-sklcss-template-bulk-btn sk-cmn-sklcss-template-bulk-restore"
                    onClick={handleBulkRestore}
                  >
                    <FaUndo /> Restore Selected ({archivedSelectedCount})
                  </button>
                )}
                
                <button 
                  className="sk-cmn-sklcss-template-bulk-btn sk-cmn-sklcss-template-bulk-delete"
                  onClick={handleBulkDelete}
                >
                  <FaTrash /> Delete Selected ({selectedItems.length})
                </button>
                
                <button 
                  className="sk-cmn-sklcss-template-bulk-btn sk-cmn-sklcss-template-bulk-cancel"
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

          {/* Templates Grid/List/Loading/Empty States */}
          {isLoading ? (
            <div className="sk-cmn-sklcss-template-loading">
              <div className="sk-cmn-sklcss-template-loading-spinner"></div>
              <p className="sk-cmn-sklcss-template-loading-text">Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="sk-cmn-sklcss-template-empty">
              <FaFileAlt className="sk-cmn-sklcss-template-empty-icon" />
              <h3 className="sk-cmn-sklcss-template-empty-text">No templates found</h3>
              <p className="sk-cmn-sklcss-template-empty-subtext">
                {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all' ? 
                  "Try adjusting your search criteria or filters." : 
                  "Click the 'Add New Template' button to get started."}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="sk-cmn-sklcss-template-grid">
              {getCurrentTemplates().map((template) => (
                <div 
                  key={template.id} 
                  className={`sk-cmn-sklcss-template-card ${template.status === 'archived' ? 'archived' : ''}`}
                >
                  {/* Bookmark if applicable */}
                  {template.bookmarkStatus && (
                    <div 
                      className="sk-cmn-sklcss-template-bookmark"
                      style={{ backgroundColor: getBookmarkDetails(template.bookmarkStatus)?.color }}
                      title={getBookmarkDetails(template.bookmarkStatus)?.name}
                    >
                      <FaBookmark />
                    </div>
                  )}
                  
                  {/* Checkbox for selection */}
                  <div 
                    className="sk-cmn-sklcss-template-card-checkbox"
                    onClick={() => handleSelectItem(template.id)}
                  >
                    {selectedItems.includes(template.id) ? 
                      <FaCheckSquare className="sk-cmn-sklcss-template-card-checkbox-icon checked" /> : 
                      <FaSquare className="sk-cmn-sklcss-template-card-checkbox-icon" />
                    }
                  </div>
                  
                  <div className="sk-cmn-sklcss-template-card-header">
                    {getFileIcon(template.file_type)}
                    <span className="sk-cmn-sklcss-template-file-type">{template.file_type.toUpperCase()}</span>
                  </div>
                  
                  <div className="sk-cmn-sklcss-template-card-body">
                    <h3 className="sk-cmn-sklcss-template-card-title">{template.title}</h3>
                    <p className="sk-cmn-sklcss-template-card-description">{template.description}</p>
                    
                    <div className="sk-cmn-sklcss-template-card-meta">
                      <div className="sk-cmn-sklcss-template-card-meta-item">
                        <FaCalendarAlt className="sk-cmn-sklcss-template-card-meta-icon" />
                        <span>{formatDate(template.updated_at)}</span>
                      </div>
                      <div className="sk-cmn-sklcss-template-card-meta-item">
                        <FaFileAlt className="sk-cmn-sklcss-template-card-meta-icon" />
                        <span>{template.file_size}</span>
                      </div>
                      <div className="sk-cmn-sklcss-template-card-meta-item">
                        <FaDownload className="sk-cmn-sklcss-template-card-meta-icon" />
                        <span>{template.download_count} downloads</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="sk-cmn-sklcss-template-card-footer">
                    <button 
                      className="sk-cmn-sklcss-template-card-btn preview" 
                      title="Preview"
                      onClick={() => handlePreview(template)}
                    >
                      <FaEye />
                    </button>
                    <button 
                      className="sk-cmn-sklcss-template-card-btn edit" 
                      title="Edit"
                      onClick={() => openModal(template)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="sk-cmn-sklcss-template-card-btn archive" 
                      title={template.status === 'archived' ? 'Restore' : 'Archive'}
                      onClick={() => handleArchiveRestore(template)}
                    >
                      {template.status === 'archived' ? <FaUndo /> : <FaArchive />}
                    </button>
                    <button 
                      className="sk-cmn-sklcss-template-card-btn delete" 
                      title="Delete"
                      onClick={() => handleDelete(template)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sk-cmn-sklcss-template-list">
              {getCurrentTemplates().map((template) => (
                <div 
                  key={template.id} 
                  className={`sk-cmn-sklcss-template-list-item ${template.status === 'archived' ? 'archived' : ''}`}
                >
                  {/* Bookmark if applicable */}
                  {template.bookmarkStatus && (
                    <div 
                      className="sk-cmn-sklcss-template-list-bookmark"
                      style={{ backgroundColor: getBookmarkDetails(template.bookmarkStatus)?.color }}
                      title={getBookmarkDetails(template.bookmarkStatus)?.name}
                    >
                      <FaBookmark />
                    </div>
                  )}
                  
                  {/* Checkbox for selection */}
                  <div 
                    className="sk-cmn-sklcss-template-list-checkbox"
                    onClick={() => handleSelectItem(template.id)}
                  >
                    {selectedItems.includes(template.id) ? 
                      <FaCheckSquare className="sk-cmn-sklcss-template-list-checkbox-icon checked" /> : 
                      <FaSquare className="sk-cmn-sklcss-template-list-checkbox-icon" />
                    }
                  </div>
                  
                  <div className="sk-cmn-sklcss-template-list-info">
                    <div className="sk-cmn-sklcss-template-list-icon">
                      {getFileIcon(template.file_type)}
                      <span className="sk-cmn-sklcss-template-list-filetype">{template.file_type.toUpperCase()}</span>
                    </div>
                    
                    <div className="sk-cmn-sklcss-template-list-details">
                      <h3 className="sk-cmn-sklcss-template-list-title">{template.title}</h3>
                      <p className="sk-cmn-sklcss-template-list-description">{template.description}</p>
                      
                      <div className="sk-cmn-sklcss-template-list-meta">
                        <div className="sk-cmn-sklcss-template-list-meta-item">
                          <FaCalendarAlt className="sk-cmn-sklcss-template-list-meta-icon" />
                          <span>Updated: {formatDate(template.updated_at)}</span>
                        </div>
                        <div className="sk-cmn-sklcss-template-list-meta-item">
                          <FaFileAlt className="sk-cmn-sklcss-template-list-meta-icon" />
                          <span>{template.file_size}</span>
                        </div>
                        <div className="sk-cmn-sklcss-template-list-meta-item">
                          <FaDownload className="sk-cmn-sklcss-template-list-meta-icon" />
                          <span>{template.download_count} downloads</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="sk-cmn-sklcss-template-list-actions">
                    <button 
                      className="sk-cmn-sklcss-template-list-btn preview" 
                      title="Preview"
                      onClick={() => handlePreview(template)}
                    >
                      <FaEye />
                    </button>
                    <button 
                      className="sk-cmn-sklcss-template-list-btn edit" 
                      title="Edit"
                      onClick={() => openModal(template)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="sk-cmn-sklcss-template-list-btn archive" 
                      title={template.status === 'archived' ? 'Restore' : 'Archive'}
                      onClick={() => handleArchiveRestore(template)}
                    >
                      {template.status === 'archived' ? <FaUndo /> : <FaArchive />}
                    </button>
                    <button 
                      className="sk-cmn-sklcss-template-list-btn delete" 
                      title="Delete"
                      onClick={() => handleDelete(template)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredTemplates.length > 0 && (
            <div className="sk-cmn-sklcss-template-pagination">
              <div className="sk-cmn-sklcss-template-pagination-info">
                Showing {Math.min(filteredTemplates.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredTemplates.length, currentPage * itemsPerPage)} of {filteredTemplates.length} templates
              </div>
              
              <button 
                className={`sk-cmn-sklcss-template-pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                title="Previous Page"
              >
                <FaChevronLeft />
              </button>
              
              {renderPaginationButtons()}
              
              <button 
                className={`sk-cmn-sklcss-template-pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="Next Page"
              >
                <FaChevronRight />
              </button>
              
              <div className="sk-cmn-sklcss-template-per-page">
                <span className="sk-cmn-sklcss-template-per-page-label">Show:</span>
                <select 
                  className="sk-cmn-sklcss-template-per-page-select"
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
        <div className="sk-cmn-sklcss-template-sidebar">
          {/* Template Overview Stats */}
          <div className="sk-cmn-sklcss-stats-container">
            <div className="sk-cmn-sklcss-stats-header">
              <FaChartBar /> Template Overview
            </div>
            <div className="sk-cmn-sklcss-stats-body">
              <div className="sk-cmn-sklcss-stat-item">
                <div className="sk-cmn-sklcss-stat-icon blue">
                  <FaFileAlt />
                </div>
                <div className="sk-cmn-sklcss-stat-info">
                  <p className="sk-cmn-sklcss-stat-title">Total Templates</p>
                  <p className="sk-cmn-sklcss-stat-value">{stats.totalTemplates}</p>
                </div>
              </div>
              
              <div className="sk-cmn-sklcss-stat-item">
                <div className="sk-cmn-sklcss-stat-icon green">
                  <FaFolderOpen />
                </div>
                <div className="sk-cmn-sklcss-stat-info">
                  <p className="sk-cmn-sklcss-stat-title">Active Templates</p>
                  <p className="sk-cmn-sklcss-stat-value">{stats.totalActive}</p>
                </div>
              </div>
              
              <div className="sk-cmn-sklcss-stat-item">
                <div className="sk-cmn-sklcss-stat-icon amber">
                  <FaArchive />
                </div>
                <div className="sk-cmn-sklcss-stat-info">
                  <p className="sk-cmn-sklcss-stat-title">Archived Templates</p>
                  <p className="sk-cmn-sklcss-stat-value">{stats.totalArchived}</p>
                </div>
              </div>
              
              <div className="sk-cmn-sklcss-stat-item">
                <div className="sk-cmn-sklcss-stat-icon purple">
                  <FaDownload />
                </div>
                <div className="sk-cmn-sklcss-stat-info">
                  <p className="sk-cmn-sklcss-stat-title">Total Downloads</p>
                  <p className="sk-cmn-sklcss-stat-value">{stats.totalDownloads}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Categories Stats */}
          <div className="sk-cmn-sklcss-stats-container">
            <div className="sk-cmn-sklcss-stats-header">
              <FaFilter /> Templates by Category
            </div>
            <div className="sk-cmn-sklcss-stats-body">
              <div className="sk-cmn-sklcss-category-stats">
                {categories.filter(cat => cat.id !== 'all').map(category => (
                  <div key={category.id} className="sk-cmn-sklcss-category-stat">
                    <span className="sk-cmn-sklcss-category-stat-name">{category.name}</span>
                    <span className="sk-cmn-sklcss-category-stat-value">{stats.categoryCounts[category.id]}</span>
                  </div>
                ))}
              </div>
              
              <div className="sk-cmn-sklcss-progress-container">
                <div 
                  className="sk-cmn-sklcss-progress-bar" 
                  style={{ 
                    width: `${stats.totalActive > 0 ? (stats.totalActive / stats.totalTemplates) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Top Downloads */}
          <div className="sk-cmn-sklcss-stats-container">
            <div className="sk-cmn-sklcss-stats-header">
              <FaTrophy /> Most Downloaded Templates
            </div>
            <div className="sk-cmn-sklcss-stats-body">
              {stats.topDownloads.length > 0 ? (
                <div className="sk-cmn-sklcss-top-downloads">
                  {stats.topDownloads.map(template => (
                    <div key={template.id} className="sk-cmn-sklcss-top-download-item">
                      {getFileIcon(template.file_type)}
                      <div className="sk-cmn-sklcss-top-download-info">
                        <h4 className="sk-cmn-sklcss-top-download-title">{template.title}</h4>
                        <div className="sk-cmn-sklcss-top-download-meta">
                          <span>{categories.find(c => c.id === template.category)?.name}</span>
                          <span className="sk-cmn-sklcss-download-count">
                            <FaDownload /> {template.download_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No downloads recorded yet.</p>
              )}
            </div>
          </div>
          
          {/* Recent Updates */}
          <div className="sk-cmn-sklcss-stats-container">
            <div className="sk-cmn-sklcss-stats-header">
              <FaHistory /> Recently Updated
            </div>
            <div className="sk-cmn-sklcss-stats-body">
              {stats.recentUpdates.length > 0 ? (
                <div className="sk-cmn-sklcss-top-downloads">
                  {stats.recentUpdates.map(template => (
                    <div key={template.id} className="sk-cmn-sklcss-top-download-item">
                      {getFileIcon(template.file_type)}
                      <div className="sk-cmn-sklcss-top-download-info">
                        <h4 className="sk-cmn-sklcss-top-download-title">{template.title}</h4>
                        <div className="sk-cmn-sklcss-top-download-meta">
                          <FaClock /> {formatTimeAgo(template.updated_at)}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="sk-cmn-sklcss-template-modal-overlay">
          <div className="sk-cmn-sklcss-template-modal-content">
            <div className="sk-cmn-sklcss-template-modal-header">
              <h2 className="sk-cmn-sklcss-template-modal-title">
                {editingTemplate ? 'Edit Template' : 'Add New Template'}
              </h2>
              <button 
                className="sk-cmn-sklcss-template-modal-close"
                onClick={closeModal}
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="sk-cmn-sklcss-template-form">
              <div className="sk-cmn-sklcss-template-form-group">
                <label className="sk-cmn-sklcss-template-form-label">Template Title*</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`sk-cmn-sklcss-template-form-input ${formErrors.title ? 'error' : ''}`}
                  placeholder="Enter a descriptive title for the template"
                />
                {formErrors.title && <div className="sk-cmn-sklcss-template-form-error">{formErrors.title}</div>}
              </div>
              
              <div className="sk-cmn-sklcss-template-form-group">
                <label className="sk-cmn-sklcss-template-form-label">Description*</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`sk-cmn-sklcss-template-form-textarea ${formErrors.description ? 'error' : ''}`}
                  placeholder="Provide a clear description of what the template is used for"
                />
                {formErrors.description && <div className="sk-cmn-sklcss-template-form-error">{formErrors.description}</div>}
              </div>
              
              <div className="sk-cmn-sklcss-template-form-group">
                <label className="sk-cmn-sklcss-template-form-label">Category*</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="sk-cmn-sklcss-template-form-select"
                >
                  {categories.filter(c => c.id !== 'all').map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="sk-cmn-sklcss-template-form-group">
                <label className="sk-cmn-sklcss-template-form-label">
                  Template File* {editingTemplate && '(Leave blank to keep current file)'}
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                  className={`sk-cmn-sklcss-template-form-input ${formErrors.file ? 'error' : ''}`}
                />
                {formErrors.file && <div className="sk-cmn-sklcss-template-form-error">{formErrors.file}</div>}
              </div>
              
              <div className="sk-cmn-sklcss-template-modal-footer">
                <button 
                  type="button" 
                  className="sk-cmn-sklcss-template-modal-btn sk-cmn-sklcss-template-modal-btn-cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="sk-cmn-sklcss-template-modal-btn sk-cmn-sklcss-template-modal-btn-save"
                >
                  <FaSave /> {editingTemplate ? 'Update' : 'Save'} Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div className="sk-cmn-sklcss-template-modal-overlay" onClick={closePreviewModal}>
          <div 
            className="sk-cmn-sklcss-template-modal-content sk-cmn-sklcss-template-preview-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sk-cmn-sklcss-template-modal-header">
              <h2 className="sk-cmn-sklcss-template-modal-title">
                Preview: {previewTemplate.title}
              </h2>
              <button 
                className="sk-cmn-sklcss-template-modal-close" 
                onClick={closePreviewModal}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="sk-cmn-sklcss-template-preview-container">
              {previewTemplate.file_type === 'pdf' ? (
                <iframe
                  src={`/api/templates/${previewTemplate.id}/preview`}
                  title={previewTemplate.title}
                  className="sk-cmn-sklcss-template-preview-iframe"
                />
              ) : (
                <div className="sk-cmn-sklcss-template-preview-unavailable">
                  <FaFileAlt className="sk-cmn-sklcss-template-preview-icon" />
                  <p className="sk-cmn-sklcss-template-preview-message">
                    Preview not available for {previewTemplate.file_type.toUpperCase()} files
                  </p>
                  <p className="sk-cmn-sklcss-template-preview-subtext">
                    Please download the file to view its contents
                  </p>
                  <a 
                    href={`/api/templates/${previewTemplate.id}/download`} 
                    className="sk-cmn-sklcss-template-preview-download-btn"
                    download
                  >
                    <FaDownload /> Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {showAuditModal && (
        <div className="sk-cmn-sklcss-template-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAuditModal()}>
          <div 
            className="sk-cmn-sklcss-template-modal-content sk-cmn-sklcss-template-audit-trail-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sk-cmn-sklcss-template-modal-header">
              <h2 className="sk-cmn-sklcss-template-modal-title">
                <FaHistory /> Template Audit Trail
              </h2>
              <button 
                className="sk-cmn-sklcss-template-modal-close" 
                onClick={closeAuditModal}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="sk-cmn-sklcss-template-audit-filters">
              <div className="sk-cmn-sklcss-template-audit-filter-row">
                <div className="sk-cmn-sklcss-template-audit-filter">
                  <label>Template:</label>
                  <select 
                    name="template_id" 
                    value={auditFilters.template_id} 
                    onChange={handleAuditFilterChange}
                  >
                    <option value="">All Templates</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="sk-cmn-sklcss-template-audit-filter">
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
              
              <div className="sk-cmn-sklcss-template-audit-filter-row">
                <div className="sk-cmn-sklcss-template-audit-filter">
                  <label>From Date:</label>
                  <input 
                    type="date" 
                    name="date_from" 
                    value={auditFilters.date_from} 
                    onChange={handleAuditFilterChange}
                  />
                </div>
                
                <div className="sk-cmn-sklcss-template-audit-filter">
                  <label>To Date:</label>
                  <input 
                    type="date" 
                    name="date_to" 
                    value={auditFilters.date_to} 
                    onChange={handleAuditFilterChange}
                  />
                </div>
              </div>
              
              <div className="sk-cmn-sklcss-template-audit-filter-buttons">
                <button 
                  className="sk-cmn-sklcss-template-audit-filter-apply" 
                  onClick={applyAuditFilters}
                >
                  Apply Filters
                </button>
                <button 
                  className="sk-cmn-sklcss-template-audit-filter-reset" 
                  onClick={resetAuditFilters}
                >
                  Reset Filters
                </button>
              </div>
            </div>
            
            <div className="sk-cmn-sklcss-template-audit-trail-content">
              {auditLoading ? (
                <div className="sk-cmn-sklcss-template-audit-loading">
                  <div className="sk-cmn-sklcss-template-loading-spinner"></div>
                  <p>Loading audit trail...</p>
                </div>
              ) : auditTrail.length === 0 ? (
                <div className="sk-cmn-sklcss-template-audit-empty">
                  <FaHistory className="sk-cmn-sklcss-template-audit-empty-icon" />
                  <p>No audit trail records found</p>
                  <span>Try adjusting your filters or check back later</span>
                </div>
              ) : (
                <div className="sk-cmn-sklcss-template-audit-list">
                  {auditTrail.map(entry => (
                    <div key={entry.id} className="sk-cmn-sklcss-template-audit-item">
                      <div className="sk-cmn-sklcss-template-audit-item-header">
                        <div 
                          className="sk-cmn-sklcss-template-audit-action" 
                          style={{ backgroundColor: getActionColor(entry.action) }}
                        >
                          {formatActionType(entry.action)}
                        </div>
                        <div className="sk-cmn-sklcss-template-audit-template-title">
                          {entry.template_title || 'Unknown Template'}
                        </div>
                        <div className="sk-cmn-sklcss-template-audit-timestamp">
                          {formatDateTime(entry.created_at)}
                        </div>
                      </div>
                      <div className="sk-cmn-sklcss-template-audit-item-content">
                        <div className="sk-cmn-sklcss-template-audit-user">
                          <FaUser className="sk-cmn-sklcss-template-audit-user-icon" />
                          <span>{entry.user_name || 'Unknown User'}</span>
                        </div>
                        <div className="sk-cmn-sklcss-template-audit-details">
                          {entry.action === 'create' && (
                            <p>Created a new template in the {JSON.parse(entry.details)?.category || 'Unknown'} category</p>
                          )}
                          {entry.action === 'update' && (
                            <div className="sk-cmn-sklcss-template-audit-update-details">
                              <p>Updated template properties:</p>
                              {JSON.parse(entry.details)?.file_updated && (
                                <span className="sk-cmn-sklcss-template-audit-detail-item">
                                  • File was replaced
                                </span>
                              )}
                              {JSON.parse(entry.details)?.before?.title !== JSON.parse(entry.details)?.after?.title && (
                                <span className="sk-cmn-sklcss-template-audit-detail-item">
                                  • Title changed from "{JSON.parse(entry.details)?.before?.title}" to "{JSON.parse(entry.details)?.after?.title}"
                                </span>
                              )}
                              {JSON.parse(entry.details)?.before?.category !== JSON.parse(entry.details)?.after?.category && (
                                <span className="sk-cmn-sklcss-template-audit-detail-item">
                                  • Category changed from "{JSON.parse(entry.details)?.before?.category}" to "{JSON.parse(entry.details)?.after?.category}"
                                </span>
                              )}
                              {JSON.parse(entry.details)?.before?.description !== JSON.parse(entry.details)?.after?.description && (
                                <span className="sk-cmn-sklcss-template-audit-detail-item">
                                  • Description was updated
                                </span>
                              )}
                            </div>
                          )}
                          {entry.action === 'archive' && (
                            <p>Archived the template</p>
                          )}
                          {entry.action === 'restore' && (
                            <p>Restored the template from archived status</p>
                          )}
                          {entry.action === 'delete' && (
                            <div className="sk-cmn-sklcss-template-audit-delete-details">
                              <p>Deleted the template permanently</p>
                              <span className="sk-cmn-sklcss-template-audit-detail-item">
                                • Category: {JSON.parse(entry.details)?.template_category || 'Unknown'}
                              </span>
                              <span className="sk-cmn-sklcss-template-audit-detail-item">
                                • File type: {JSON.parse(entry.details)?.template_file_type || 'Unknown'}
                              </span>
                              {JSON.parse(entry.details)?.template_file_size && (
                                <span className="sk-cmn-sklcss-template-audit-detail-item">
                                  • Size: {JSON.parse(entry.details)?.template_file_size}
                                </span>
                              )}
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
                <div className="sk-cmn-sklcss-template-audit-pagination">
                  <button 
                    className={`sk-cmn-sklcss-template-pagination-btn ${auditCurrentPage === 1 ? 'disabled' : ''}`}
                    onClick={() => goToAuditPage(auditCurrentPage - 1)}
                    disabled={auditCurrentPage === 1}
                  >
                    <FaChevronLeft />
                  </button>
                  
                  {renderAuditPaginationButtons()}
                  
                  <button 
                    className={`sk-cmn-sklcss-template-pagination-btn ${auditCurrentPage === auditTotalPages ? 'disabled' : ''}`}
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
      {confirmDialog && (
        <ConfirmationDialog
          isOpen={true}
          onClose={confirmDialog.onCancel}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
        />
      )}
    </div>
  );
};

export default TemplateManagement;