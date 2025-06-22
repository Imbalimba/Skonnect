import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import moment from 'moment';
import { AuthContext } from '../../Contexts/AuthContext';
import { 
  FaCheck, FaTimes, FaEye, FaSearch, FaFilter, FaChevronDown, 
  FaCalendarAlt, FaUserShield, FaHistory, FaListAlt, FaSort,
  FaUserCheck, FaUserTimes, FaInfoCircle, FaClock, FaBuilding,
  FaEnvelope, FaPhone, FaIdCard, FaUserCog, FaCommentDots, FaStickyNote,
  FaFilePdf, FaFileImage, FaLock, FaUnlock, FaUser, FaExternalLinkAlt, 
  FaDownload, FaSquare, FaCheckSquare, FaHome, FaAddressCard,
  FaTh, FaList, FaChevronLeft, FaChevronRight, FaUserEdit, FaSync,
  FaCalendarCheck, FaExclamationTriangle, FaMapMarkerAlt,
  FaBirthdayCake, FaCertificate, FaUserClock, FaBan, FaRedo, FaCalendar, FaChartBar 
} from 'react-icons/fa';
import Notification from '../Components/Notification';
import ConfirmationDialog from '../Components/ConfirmationDialog';
import '../css/SkUserAuthentication.css';

// Term Renewal Dialog Component
const TermRenewalDialog = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    term_start: new Date().toISOString().split('T')[0],
    term_end: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split('T')[0],
    terms_served: Math.min(user.terms_served + 1, 3),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate term count
      if (formData.terms_served > 3) {
        setError('Maximum of 3 consecutive terms allowed.');
        setIsLoading(false);
        return;
      }

      // Validate term dates
      const termStart = new Date(formData.term_start);
      const termEnd = new Date(formData.term_end);
      
      if (termEnd <= termStart) {
        setError('Term end date must be after term start date.');
        setIsLoading(false);
        return;
      }

      const diffYears = (termEnd.getFullYear() - termStart.getFullYear());
      if (diffYears > 3) {
        setError('Term length cannot exceed 3 years.');
        setIsLoading(false);
        return;
      }

      // Process the renewal
      const response = await axios.post(`/api/sk-renew-term/${user.id}`, formData);
      
      if (response.data.success) {
        onSuccess(response.data.user);
      } else {
        setError(response.data.message || 'Failed to renew term. Please try again.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred while processing your request.');
      console.error('Term renewal error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FaSync className="me-2" /> Renew SK Term</h3>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="user-detail-section mb-3">
            <h4 className="user-detail-heading">
              <FaListAlt className="me-2" />
              Current User Information
            </h4>
            <div className="user-detail-item">
              <span className="user-detail-label">Name:</span>
              <span className="user-detail-value">{user.first_name} {user.last_name}</span>
            </div>
            <div className="user-detail-item">
              <span className="user-detail-label">Role:</span>
              <span className="user-detail-value">{user.sk_role}</span>
            </div>
            <div className="user-detail-item">
              <span className="user-detail-label">Current Term:</span>
              <span className="user-detail-value">
                {new Date(user.term_start).toLocaleDateString()} - {new Date(user.term_end).toLocaleDateString()}
              </span>
            </div>
            <div className="user-detail-item">
              <span className="user-detail-label">Terms Served:</span>
              <span className="user-detail-value">{user.terms_served}</span>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="term_start" className="form-label">
                <FaCalendar className="me-1" /> New Term Start Date
              </label>
              <input
                type="date"
                className="form-control"
                id="term_start"
                name="term_start"
                value={formData.term_start}
                onChange={handleChange}
                required
              />
              <small className="text-muted">When the new term begins</small>
            </div>

            <div className="mb-3">
              <label htmlFor="term_end" className="form-label">
                <FaCalendarCheck className="me-1" /> New Term End Date
              </label>
              <input
                type="date"
                className="form-control"
                id="term_end"
                name="term_end"
                value={formData.term_end}
                onChange={handleChange}
                required
              />
              <small className="text-muted">When the new term expires (max 3 years from start)</small>
            </div>

            <div className="mb-3">
              <label htmlFor="terms_served" className="form-label">
                <FaSync className="me-1" /> Terms Served (including this renewal)
              </label>
              <select
                className="form-control"
                id="terms_served"
                name="terms_served"
                value={formData.terms_served}
                onChange={handleChange}
                required
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
              <small className="text-muted">Maximum of 3 consecutive terms allowed</small>
            </div>

            <div className="alert alert-info">
              <strong>Note:</strong> Renewing a term will reset the authentication status. The user will need to be re-authenticated after renewal.
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Renew Term'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main SK User Authentication Component
const SkUserAuthentication = () => {
  const { skUser } = useContext(AuthContext);
  
  // State for users and filtering
  const [pendingUsers, setPendingUsers] = useState([]);
  const [authenticatedUsers, setAuthenticatedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedTermStatus, setSelectedTermStatus] = useState('All');
  const [selectedAgeStatus, setSelectedAgeStatus] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // State for tabs and views
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'youthUsers', 'statistics', 'logs'
  const [currentView, setCurrentView] = useState('pending'); // 'pending' or 'authenticated'
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userNotes, setUserNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  
  // State for youth authentication
  const [youthUsers, setYouthUsers] = useState([]);
  const [filteredYouthUsers, setFilteredYouthUsers] = useState([]);
  const [youthSearchQuery, setYouthSearchQuery] = useState('');
  const [selectedYouthUsers, setSelectedYouthUsers] = useState([]);
  const [selectedYouthBarangay, setSelectedYouthBarangay] = useState('All');
  const [selectedYouthResidency, setSelectedYouthResidency] = useState('All');
  const [youthCurrentPage, setYouthCurrentPage] = useState(1);
  const [youthTotalPages, setYouthTotalPages] = useState(1);
  const [youthSelectAll, setYouthSelectAll] = useState(false);
  
  // State for statistics
  const [stats, setStats] = useState({
    pending: 0,
    authenticated: 0,
    recent_authentications: 0,
    expired_terms: 0,
    nearing_expiration: 0, 
    over_age: 0,
    nearing_max_age: 0,
    barangay_breakdown: {}
  });
  
  // State for logs
  const [authLogs, setAuthLogs] = useState([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPerPage, setLogsPerPage] = useState(10);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [youthLoading, setYouthLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [youthViewMode, setYouthViewMode] = useState('grid'); // 'grid' or 'list'
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewData, setPreviewData] = useState({ url: '', name: '', type: '' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false);
  const [showYouthBulkActionDialog, setShowYouthBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [youthBulkAction, setYouthBulkAction] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [youthBulkReason, setYouthBulkReason] = useState('');
  const [bulkNotify, setBulkNotify] = useState(false);
  const [youthBulkNotify, setYouthBulkNotify] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmUserId, setConfirmUserId] = useState(null);
  const [confirmReason, setConfirmReason] = useState('');
  const [confirmNotify, setConfirmNotify] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: '',
    confirmColor: ''
  });
  const [notification, setNotification] = useState(null);
  const [selectAll, setSelectAll] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Term renewal state
  const [showTermRenewalDialog, setShowTermRenewalDialog] = useState(false);
  const [userForRenewal, setUserForRenewal] = useState(null);
  
  const barangayOptions = ['All', 'Dela Paz', 'Manggahan', 'Maybunga', 'Pinagbuhatan', 'Rosario', 'San Miguel', 'Santa Lucia', 'Santolan'];
  const roleOptions = skUser?.sk_role === 'Chairman' ? ['Kagawad'] : 
                      skUser?.sk_role === 'Federasyon' ? ['All', 'Chairman', 'Kagawad'] : 
                      ['All', 'Federasyon', 'Chairman', 'Kagawad', 'Admin'];

  // Term status options
  const termStatusOptions = [
    { value: 'All', label: 'All Terms' },
    { value: 'active', label: 'Active Terms' },
    { value: 'expired', label: 'Expired Terms' },
    { value: 'expiring_soon', label: 'Expiring Soon (30 days)' }
  ];

  // Age status options
  const ageStatusOptions = [
    { value: 'All', label: 'All Ages' },
    { value: 'eligible', label: 'Eligible (15-24)' },
    { value: 'ineligible', label: 'Ineligible' },
    { value: 'nearing_max', label: 'Nearing Max Age (24)' }
  ];

  // Residency status options for youth
  const residencyOptions = [
    { value: 'All', label: 'All Residency Statuses' },
    { value: 'pasig', label: 'Pasig Resident' },
    { value: 'non_pasig', label: 'Non-Pasig Resident' },
    { value: 'authenticated', label: 'Authenticated' },
    { value: 'not_authenticated', label: 'Not Authenticated' }
  ];

  // Status types with colors (without using bookmarks)
  const statusTypes = [
    { id: 'new', name: 'New', color: '#10b981', description: 'Recently added user' },
    { id: 'updated', name: 'Recently Updated', color: '#f59e0b', description: 'Authentication status changed' },
    { id: 'term_expired', name: 'Term Expired', color: '#ef4444', description: 'User term has expired' },
    { id: 'over_age', name: 'Over Age', color: '#8b5cf6', description: 'User exceeds age limit' },
    { id: 'expiring_soon', name: 'Term Expiring Soon', color: '#f97316', description: 'Term expiring in 30 days' }
  ];

  // Youth status types with colors
  const youthStatusTypes = [
    { id: 'new', name: 'New', color: '#10b981', description: 'Recently registered user' },
    { id: 'updated', name: 'Status Changed', color: '#f59e0b', description: 'Authentication status changed' },
    { id: 'pasig', name: 'Pasig Resident', color: '#3b82f6', description: 'Verified Pasig resident' },
    { id: 'non_pasig', name: 'Non-Pasig Resident', color: '#8b5cf6', description: 'Non-Pasig resident' },
    { id: 'authenticated', name: 'Authenticated', color: '#22c55e', description: 'Authenticated user' },
    { id: 'not_authenticated', name: 'Not Authenticated', color: '#ef4444', description: 'User not authenticated' }
  ];

  // Check if user has permission (Federasyon, Chairman, or Admin)
  const hasAuthPermission = skUser && (skUser.sk_role === 'Federasyon' || skUser.sk_role === 'Chairman' || skUser.sk_role === 'Admin');

  // Initial data loading
  useEffect(() => {
    if (hasAuthPermission) {
      fetchUsers();
      fetchAuthStats();
    }
  }, [hasAuthPermission, currentView]);

  // Load youth users when on youth tab
  useEffect(() => {
    if (activeTab === 'youthUsers' && hasAuthPermission) {
      fetchYouthUsers();
    }
  }, [activeTab, hasAuthPermission]);

  // Load logs when on logs tab
  useEffect(() => {
    if (activeTab === 'logs' && hasAuthPermission) {
      fetchAuthLogs();
    }
  }, [activeTab, logsPage, logsPerPage]);

  // Filter users based on search and filters
  useEffect(() => {
    const usersList = currentView === 'pending' ? pendingUsers : authenticatedUsers;
    if (!usersList) return;
    
    let filtered = [...usersList];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.first_name?.toLowerCase().includes(query) || 
        user.last_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        (user.house_number && user.house_number.toLowerCase().includes(query)) ||
        (user.street && user.street.toLowerCase().includes(query))
      );
    }
    
    // Filter by barangay
    if (selectedBarangay !== 'All') {
      filtered = filtered.filter(user => user.sk_station === selectedBarangay);
    }
    
    // Filter by role
    if (selectedRole !== 'All') {
      filtered = filtered.filter(user => user.sk_role === selectedRole);
    }
    
    // Filter by term status
    if (selectedTermStatus !== 'All') {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      
      if (selectedTermStatus === 'active') {
        filtered = filtered.filter(user => !user.term_expired);
      } else if (selectedTermStatus === 'expired') {
        filtered = filtered.filter(user => user.term_expired);
      } else if (selectedTermStatus === 'expiring_soon') {
        filtered = filtered.filter(user => {
          const termEnd = new Date(user.term_end);
          return termEnd > now && termEnd <= thirtyDaysFromNow;
        });
      }
    }
    
    // Filter by age status
    if (selectedAgeStatus !== 'All') {
      if (selectedAgeStatus === 'eligible') {
        filtered = filtered.filter(user => !user.over_age && user.age >= 15 && user.age < 25);
      } else if (selectedAgeStatus === 'ineligible') {
        filtered = filtered.filter(user => user.over_age || user.age < 15);
      } else if (selectedAgeStatus === 'nearing_max') {
        filtered = filtered.filter(user => user.age === 24);
      }
    }
    
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [pendingUsers, authenticatedUsers, currentView, searchQuery, selectedBarangay, selectedRole, selectedTermStatus, selectedAgeStatus]);

  // Filter youth users based on search and filters
  useEffect(() => {
    if (!youthUsers.length) return;
    
    let filtered = [...youthUsers];
    
    // Filter by search query
    if (youthSearchQuery) {
      const query = youthSearchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.first_name?.toLowerCase().includes(query) || 
        user.last_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        (user.house_number && user.house_number.toLowerCase().includes(query)) ||
        (user.street && user.street.toLowerCase().includes(query)) ||
        (user.baranggay && user.baranggay.toLowerCase().includes(query))
      );
    }
    
    // Filter by barangay
    if (selectedYouthBarangay !== 'All') {
      filtered = filtered.filter(user => user.baranggay === selectedYouthBarangay);
    }
    
    // Filter by residency status
    if (selectedYouthResidency !== 'All') {
      if (selectedYouthResidency === 'pasig') {
        filtered = filtered.filter(user => user.is_pasig_resident === true);
      } else if (selectedYouthResidency === 'non_pasig') {
        filtered = filtered.filter(user => user.is_pasig_resident === false);
      } else if (selectedYouthResidency === 'authenticated') {
        filtered = filtered.filter(user => user.is_authenticated === true);
      } else if (selectedYouthResidency === 'not_authenticated') {
        filtered = filtered.filter(user => user.is_authenticated === false);
      }
    }
    
    setFilteredYouthUsers(filtered);
    setYouthCurrentPage(1); // Reset to first page when filters change
  }, [youthUsers, youthSearchQuery, selectedYouthBarangay, selectedYouthResidency]);

  // Update pagination when filtered users change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredUsers.length / itemsPerPage));
    // If current page is greater than total pages, set it to last page
    if (currentPage > Math.ceil(filteredUsers.length / itemsPerPage) && filteredUsers.length > 0) {
      setCurrentPage(Math.ceil(filteredUsers.length / itemsPerPage));
    }
  }, [filteredUsers, itemsPerPage]);

  // Update youth pagination when filtered youth users change
  useEffect(() => {
    setYouthTotalPages(Math.ceil(filteredYouthUsers.length / itemsPerPage));
    // If current page is greater than total pages, set it to last page
    if (youthCurrentPage > Math.ceil(filteredYouthUsers.length / itemsPerPage) && filteredYouthUsers.length > 0) {
      setYouthCurrentPage(Math.ceil(filteredYouthUsers.length / itemsPerPage));
    }
  }, [filteredYouthUsers, itemsPerPage]);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      let params = {
        sort_by: sortBy,
        sort_direction: sortDirection,
        view: currentView
      };
      
      const response = await axios.get('/api/sk-pending-users', { params });
      
      // Add status to users (replacing bookmark)
      const usersWithStatus = response.data.map(user => {
        // Get dates for calculations
        const createdDate = new Date(user.created_at);
        const updatedDate = new Date(user.updated_at || user.created_at);
        const authDate = new Date(user.authenticated_at || null);
        const now = new Date();
        const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        
        // Default statusType is null (no status)
        let statusType = null;
        
        // Check for expired term
        if (user.term_expired) {
          statusType = 'term_expired';
        }
        // Check for over age
        else if (user.over_age) {
          statusType = 'over_age';
        }
        // Check if term is expiring soon (within 30 days)
        else if (user.term_end) {
          const termEnd = new Date(user.term_end);
          const daysUntilExpiration = Math.floor((termEnd - now) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiration > 0 && daysUntilExpiration <= 30) {
            statusType = 'expiring_soon';
          }
        }
        // Check for authentication status change - this is the updated condition
        else if (authDate && updatedDate && 
                Math.abs(authDate.getTime() - updatedDate.getTime()) < 24 * 60 * 60 * 1000 &&
                now - updatedDate < 7 * 24 * 60 * 60 * 1000) { // If auth date is close to update date and within last 7 days
          statusType = 'updated';
        }
        // Check for new users
        else if (daysSinceCreation < 7) {
          statusType = 'new';
        }
        
        return {
          ...user,
          statusType
        };
      });
      
      if (currentView === 'pending') {
        setPendingUsers(usersWithStatus);
      } else {
        setAuthenticatedUsers(usersWithStatus);
      }
      
      setFilteredUsers(usersWithStatus);
      setLoading(false);
      setSelectedUsers([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('Failed to load users. Please try again.', 'error');
      setLoading(false);
    }
  };

  // Fetch youth users
  const fetchYouthUsers = async () => {
    setYouthLoading(true);
    try {
      // Using the user endpoint with a special query parameter for admin view
      const response = await axios.get('/api/youth-users');
      
      // Add status to youth users
      const youthWithStatus = response.data.map(user => {
        // Get dates for calculations
        const createdDate = new Date(user.created_at);
        const updatedDate = new Date(user.updated_at || user.created_at);
        const now = new Date();
        const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        const daysSinceUpdate = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));
        
        // Default statusType is null (no status)
        let statusType = null;
        
        // Check if user was updated by SK recently (within last 7 days)
        // This takes priority over everything else
        if (user.updated_by_sk && daysSinceUpdate <= 7) {
          statusType = 'updated';
        }
        // Check for new users (created within last 7 days and not updated by SK)
        else if (daysSinceCreation <= 7 && !user.updated_by_sk) {
          statusType = 'new';
        }
        // Set status based on authentication and residency for older users
        else {
          if (user.is_authenticated) {
            statusType = 'authenticated';
          } else {
            statusType = 'not_authenticated';
          }
        }
        
        return {
          ...user,
          statusType,
          // Add additional properties for rendering
          residencyStatus: user.is_pasig_resident ? 'pasig' : 'non_pasig',
          authStatus: user.is_authenticated ? 'authenticated' : 'not_authenticated'
        };
      });
      
      setYouthUsers(youthWithStatus);
      setFilteredYouthUsers(youthWithStatus);
      setYouthLoading(false);
      setSelectedYouthUsers([]);
      setYouthSelectAll(false);
    } catch (error) {
      console.error('Error fetching youth users:', error);
      showNotification('Failed to load youth users. Please try again.', 'error');
      setYouthLoading(false);
    }
  };

  // Fetch authentication statistics
  const fetchAuthStats = async () => {
    try {
      const response = await axios.get('/api/sk-auth-stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching auth stats:', error);
      showNotification('Failed to load statistics. Please try again.', 'error');
    }
  };

  // Fetch authentication logs
  const fetchAuthLogs = async () => {
    try {
      const response = await axios.get('/api/sk-auth-logs', {
        params: {
          page: logsPage,
          per_page: logsPerPage
        }
      });
      
      if (response.data.success) {
        setAuthLogs(response.data.logs.data);
        setLogsTotal(response.data.logs.total);
      }
    } catch (error) {
      console.error('Error fetching auth logs:', error);
      showNotification('Failed to load authentication logs. Please try again.', 'error');
    }
  };

  // Fetch user detail
  const fetchUserDetail = async (userId) => {
    try {
      const response = await axios.get(`/api/sk-user-profile/${userId}`);
      
      if (response.data.success) {
        setSelectedUser(response.data.user);
        setUserNotes(response.data.notes || []);
      }
    } catch (error) {
      console.error('Error fetching user detail:', error);
      showNotification('Failed to load user details. Please try again.', 'error');
    }
  };

  // Fetch youth user detail
  const fetchYouthUserDetail = async (userId) => {
    try {
      const response = await axios.get(`/api/youth-user-detail/${userId}`);
      
      if (response.data.success) {
        setSelectedUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching youth user detail:', error);
      showNotification('Failed to load user details. Please try again.', 'error');
    }
  };

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle confirm action
  const handleConfirmAction = (action, userId, config, reason = '', notify = false) => {
    setConfirmAction(() => action);
    setConfirmUserId(userId);
    setConfirmReason(reason);
    setConfirmNotify(notify);
    setConfirmConfig(config);
    setShowConfirmDialog(true);
  };

  // Handle confirm
  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    try {
      await confirmAction(confirmUserId, confirmReason, confirmNotify);
      showNotification(confirmConfig.successMessage, 'success');
      
      // Refresh data
      if (activeTab === 'users') {
        fetchUsers();
        fetchAuthStats();
      } else if (activeTab === 'youthUsers') {
        fetchYouthUsers();
      }
      
      if (activeTab === 'logs') {
        fetchAuthLogs();
      }
      
      // Close user detail if open
      if (showUserDetail && selectedUser && selectedUser.id === confirmUserId) {
        setShowUserDetail(false);
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification(confirmConfig.errorMessage || 'An error occurred', 'error');
    }
  };

  // Handle bulk action dialog confirm
  const handleBulkConfirm = async () => {
    setShowBulkActionDialog(false);
    
    if (selectedUsers.length === 0) {
      showNotification('No users selected for bulk action.', 'error');
      return;
    }
    
    try {
      const response = await axios.post('/api/sk-bulk-authenticate', {
        user_ids: selectedUsers,
        status: bulkAction,
        reason: bulkReason,
        notify_users: bulkNotify
      });
      
      if (response.data.success) {
        showNotification(response.data.message, 'success');
        
        // Reset selection
        setSelectedUsers([]);
        
        // Refresh data
        fetchUsers();
        fetchAuthStats();
        if (activeTab === 'logs') {
          fetchAuthLogs();
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      showNotification('Failed to process users. Please try again.', 'error');
    }
  };

  // Handle youth bulk action dialog confirm
  const handleYouthBulkConfirm = async () => {
    setShowYouthBulkActionDialog(false);
    
    if (selectedYouthUsers.length === 0) {
      showNotification('No users selected for bulk action.', 'error');
      return;
    }
    
    try {
      const response = await axios.post('/api/youth-bulk-authenticate', {
        user_ids: selectedYouthUsers,
        is_authenticated: youthBulkAction === 'authenticate',
        reason: youthBulkReason,
        notify_users: youthBulkNotify
      });
      
      if (response.data.success) {
        showNotification(response.data.message, 'success');
        
        // Reset selection
        setSelectedYouthUsers([]);
        
        // Refresh data
        fetchYouthUsers();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      showNotification('Failed to process users. Please try again.', 'error');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setShowConfirmDialog(false);
    setConfirmReason('');
    setConfirmNotify(false);
  };

  // Handle authenticate
  const handleAuthenticate = (userId) => {
    const authenticateAction = async (id, reason, notify) => {
      await axios.put(`/api/sk-authenticate/${id}`, { 
        status: 'active',
        reason: reason,
        notify_user: notify
      });
    };
  
    handleConfirmAction(
      authenticateAction,
      userId,
      {
        title: 'Authenticate User',
        message: 'Are you sure you want to authenticate this user? They will be granted access to the SK portal.',
        confirmText: 'Authenticate',
        confirmColor: 'success',
        successMessage: 'User has been authenticated successfully!',
        errorMessage: 'Error authenticating user. Please try again.'
      },
      '',
      false
    );
  };

  // Handle de-authenticate
  const handleDeauthenticate = (userId) => {
    const deauthenticateAction = async (id, reason, notify) => {
      await axios.put(`/api/sk-authenticate/${id}`, { 
        status: 'not_active',
        reason: reason,
        notify_user: notify
      });
    };
  
    handleConfirmAction(
      deauthenticateAction,
      userId,
      {
        title: 'De-authenticate User',
        message: 'Are you sure you want to remove authentication for this user? They will lose access to the SK portal.',
        confirmText: 'De-authenticate',
        confirmColor: 'danger',
        successMessage: 'User has been de-authenticated successfully!',
        errorMessage: 'Error de-authenticating user. Please try again.'
      },
      '',
      false
    );
  };

  // Handle authenticate youth
  const handleAuthenticateYouth = (userId) => {
    const authenticateAction = async (id, reason, notify) => {
      await axios.put(`/api/youth-authenticate/${id}`, { 
        is_authenticated: true,
        reason: reason,
        notify_user: notify
      });
    };
  
    handleConfirmAction(
      authenticateAction,
      userId,
      {
        title: 'Authenticate Youth User',
        message: 'Are you sure you want to authenticate this user? They will be granted access to program and event registration.',
        confirmText: 'Authenticate',
        confirmColor: 'success',
        successMessage: 'Youth user has been authenticated successfully!',
        errorMessage: 'Error authenticating youth user. Please try again.'
      },
      '',
      false
    );
  };

  // Handle de-authenticate youth
  const handleDeauthenticateYouth = (userId) => {
    const deauthenticateAction = async (id, reason, notify) => {
      await axios.put(`/api/youth-authenticate/${id}`, { 
        is_authenticated: false,
        reason: reason,
        notify_user: notify
      });
    };
  
    handleConfirmAction(
      deauthenticateAction,
      userId,
      {
        title: 'De-authenticate Youth User',
        message: 'Are you sure you want to remove authentication for this user? They will lose access to program and event registration.',
        confirmText: 'De-authenticate',
        confirmColor: 'danger',
        successMessage: 'Youth user has been de-authenticated successfully!',
        errorMessage: 'Error de-authenticating youth user. Please try again.'
      },
      '',
      false
    );
  };

  // Handle update residency status
  const handleUpdateResidency = (userId, isPasigResident) => {
    const updateResidencyAction = async (id, reason, notify) => {
      await axios.put(`/api/youth-update-residency/${id}`, { 
        is_pasig_resident: isPasigResident,
        reason: reason,
        notify_user: notify
      });
    };
  
    handleConfirmAction(
      updateResidencyAction,
      userId,
      {
        title: isPasigResident ? 'Confirm Pasig Residency' : 'Update to Non-Pasig Resident',
        message: isPasigResident ? 
          'Are you sure you want to confirm this user as a Pasig resident? This will update their status in the system.' :
          'Are you sure you want to mark this user as a non-Pasig resident? This will update their status in the system.',
        confirmText: isPasigResident ? 'Confirm Residency' : 'Update Residency',
        confirmColor: isPasigResident ? 'success' : 'warning',
        successMessage: isPasigResident ? 
          'User has been confirmed as a Pasig resident successfully!' : 
          'User has been updated to non-Pasig resident successfully!',
        errorMessage: 'Error updating residency status. Please try again.'
      },
      '',
      true
    );
  };

  // Handle term renewal
  const handleRenewTerm = (user) => {
    setUserForRenewal(user);
    setShowTermRenewalDialog(true);
  };

  // Handle successful term renewal
  const handleTermRenewalSuccess = (updatedUser) => {
    // Update user in the list
    if (currentView === 'pending') {
      setPendingUsers(prevUsers => 
        prevUsers.map(user => user.id === updatedUser.id ? updatedUser : user)
      );
    } else {
      setAuthenticatedUsers(prevUsers => 
        prevUsers.map(user => user.id === updatedUser.id ? updatedUser : user)
      );
    }
    
    // Close the dialog
    setShowTermRenewalDialog(false);
    
    // Show success notification
    showNotification('Term renewed successfully! User needs to be re-authenticated.', 'success');
    
    // Refresh data
    fetchUsers();
    fetchAuthStats();
    
    // Close user detail if open
    if (showUserDetail && selectedUser && selectedUser.id === updatedUser.id) {
      setSelectedUser(updatedUser);
    }
  };

  // Handle view ID
  const handleViewID = (user) => {
    if (!user.valid_id_url && !user.valid_id_exists && !user.proof_of_address) {
      showNotification('No documents available to preview.', 'error');
      return;
    }
    
    // Determine the type of document and URL based on user type
    let documentUrl, documentType, documentName;
    
    if (activeTab === 'users' && user.valid_id) {
      documentUrl = user.valid_id_url;
      documentName = `${user.first_name} ${user.last_name}'s Oath Document`;
      const fileExtension = user.valid_id_extension?.toLowerCase() || '';
      documentType = ['jpg', 'jpeg', 'png'].includes(fileExtension) ? 'image' : 'pdf';
    } else if (activeTab === 'youthUsers' && user.proof_of_address) {
      documentUrl = `/storage/${user.proof_of_address}`;
      documentName = `${user.first_name} ${user.last_name}'s Proof of Address`;
      const fileExtension = user.proof_of_address.split('.').pop().toLowerCase();
      documentType = ['jpg', 'jpeg', 'png'].includes(fileExtension) ? 'image' : 'pdf';
    } else {
      showNotification('Document not found or not accessible.', 'error');
      return;
    }
    
    setPreviewData({
      url: documentUrl,
      name: documentName,
      type: documentType
    });
    setShowImagePreview(true);
  };

  // Handle select all users for current page
  const handleSelectAll = () => {
    // Get current page items
    const currentItems = getCurrentUsers();
    const currentItemIds = currentItems.map(item => item.id);
    
    // Check if all current items are already selected
    const allCurrentSelected = currentItemIds.length > 0 && 
      currentItemIds.every(id => selectedUsers.includes(id));
    
    if (allCurrentSelected) {
      // If all are selected, unselect them
      const newSelectedItems = selectedUsers.filter(id => !currentItemIds.includes(id));
      setSelectedUsers(newSelectedItems);
      setSelectAll(false);
    } else {
      // If not all selected, select all current items
      const newSelectedItems = [...selectedUsers];
      
      currentItems.forEach(user => {
        if (!newSelectedItems.includes(user.id)) {
          newSelectedItems.push(user.id);
        }
      });
      
      setSelectedUsers(newSelectedItems);
      setSelectAll(true);
    }
  };

  // Handle select all youth users for current page
  const handleYouthSelectAll = () => {
    // Get current page items
    const currentItems = getCurrentYouthUsers();
    const currentItemIds = currentItems.map(item => item.id);
    
    // Check if all current items are already selected
    const allCurrentSelected = currentItemIds.length > 0 && 
      currentItemIds.every(id => selectedYouthUsers.includes(id));
    
    if (allCurrentSelected) {
      // If all are selected, unselect them
      const newSelectedItems = selectedYouthUsers.filter(id => !currentItemIds.includes(id));
      setSelectedYouthUsers(newSelectedItems);
      setYouthSelectAll(false);
    } else {
      // If not all selected, select all current items
      const newSelectedItems = [...selectedYouthUsers];
      
      currentItems.forEach(user => {
        if (!newSelectedItems.includes(user.id)) {
          newSelectedItems.push(user.id);
        }
      });
      
      setSelectedYouthUsers(newSelectedItems);
      setYouthSelectAll(true);
    }
  };

  // Handle user selection for bulk actions
  const handleSelectItem = (userId) => {
    const newSelectedUsers = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    
    setSelectedUsers(newSelectedUsers);
    
    // Check if all items on current page are selected
    const currentItemIds = getCurrentUsers().map(item => item.id);
    const allSelected = currentItemIds.length > 0 && 
      currentItemIds.every(id => newSelectedUsers.includes(id));
    
    setSelectAll(allSelected);
  };

  // Handle youth user selection for bulk actions
  const handleSelectYouthItem = (userId) => {
    const newSelectedUsers = selectedYouthUsers.includes(userId)
      ? selectedYouthUsers.filter(id => id !== userId)
      : [...selectedYouthUsers, userId];
    
    setSelectedYouthUsers(newSelectedUsers);
    
    // Check if all items on current page are selected
    const currentItemIds = getCurrentYouthUsers().map(item => item.id);
    const allSelected = currentItemIds.length > 0 && 
      currentItemIds.every(id => newSelectedUsers.includes(id));
    
    setYouthSelectAll(allSelected);
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
    
    // Refetch with new sort
    setTimeout(() => {
      fetchUsers();
    }, 100);
  };

  // Handle add note to user
  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedUser) {
      return;
    }
    
    try {
      const response = await axios.post(`/api/sk-user-note/${selectedUser.id}`, {
        note: newNote
      });
      
      if (response.data.success) {
        showNotification('Note added successfully!', 'success');
        setUserNotes([response.data.note, ...userNotes]);
        setNewNote('');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      showNotification('Failed to add note. Please try again.', 'error');
    }
  };

  // Get current users for the current page
  const getCurrentUsers = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Get current youth users for the current page
  const getCurrentYouthUsers = () => {
    const indexOfLastItem = youthCurrentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredYouthUsers.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Youth pagination handlers
  const goToYouthPage = (page) => {
    if (page >= 1 && page <= youthTotalPages) {
      setYouthCurrentPage(page);
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
        className={`sk-cmn-sklcss-auth-pagination-btn ${currentPage === 1 ? 'active' : ''}`}
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
          className={`sk-cmn-sklcss-auth-pagination-btn ${currentPage === i ? 'active' : ''}`}
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
          className={`sk-cmn-sklcss-auth-pagination-btn ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          {totalPages}
        </button>
      );
    }
    
    return buttons;
  };

  // Generate youth pagination buttons
  const renderYouthPaginationButtons = () => {
    const buttons = [];
    const maxDisplayButtons = 5; // Maximum number of page buttons to display
    
    // Always add first page button
    buttons.push(
      <button 
        key="first" 
        className={`sk-cmn-sklcss-auth-pagination-btn ${youthCurrentPage === 1 ? 'active' : ''}`}
        onClick={() => goToYouthPage(1)}
        disabled={youthCurrentPage === 1}
      >
        1
      </button>
    );
    
    // Calculate start and end page
    let startPage = Math.max(2, youthCurrentPage - Math.floor(maxDisplayButtons / 2));
    let endPage = Math.min(youthTotalPages - 1, startPage + maxDisplayButtons - 3);
    
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
          className={`sk-cmn-sklcss-auth-pagination-btn ${youthCurrentPage === i ? 'active' : ''}`}
          onClick={() => goToYouthPage(i)}
        >
          {i}
        </button>
      );
    }
    
    // Add ellipsis before last page if needed
    if (endPage < youthTotalPages - 1) {
      buttons.push(<span key="ellipsis2">...</span>);
    }
    
    // Always add last page button if there's more than one page
    if (youthTotalPages > 1) {
      buttons.push(
        <button 
          key="last" 
          className={`sk-cmn-sklcss-auth-pagination-btn ${youthCurrentPage === youthTotalPages ? 'active' : ''}`}
          onClick={() => goToYouthPage(youthTotalPages)}
          disabled={youthCurrentPage === youthTotalPages}
        >
          {youthTotalPages}
        </button>
      );
    }
    
    return buttons;
  };

  // Format date
  const formatDate = (dateString) => {
    return moment(dateString).format('MMMM D, YYYY');
  };

  // Format time
  const formatTime = (dateString) => {
    return moment(dateString).format('h:mm A');
  };

  // Format time ago for recent updates
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

  // Calculate days remaining
  const getDaysRemaining = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    return diffInDays;
  };

  // Handle view user detail
  const handleViewUser = async (user) => {
    if (activeTab === 'users') {
      await fetchUserDetail(user.id);
    } else if (activeTab === 'youthUsers') {
      await fetchYouthUserDetail(user.id);
    }
    setShowUserDetail(true);
  };

  // Close user detail view
  const handleCloseUserDetail = () => {
    setShowUserDetail(false);
    setSelectedUser(null);
    setUserNotes([]);
    setNewNote('');
  };

  // Toggle view mode between grid and list
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  // Toggle youth view mode between grid and list
  const toggleYouthViewMode = (mode) => {
    setYouthViewMode(mode);
  };

  // Change view between pending and authenticated
  const handleViewChange = (view) => {
    setCurrentView(view);
    setSelectedUsers([]);
    setSelectAll(false);
    setCurrentPage(1);
    // Update filteredUsers immediately to prevent UI issues
    if (view === 'pending') {
      setFilteredUsers(pendingUsers);
    } else {
      setFilteredUsers(authenticatedUsers);
    }
  };

  // Get filtered selected items by status
  const getFilteredSelectedItems = (status) => {
    return selectedUsers.filter(id => {
      const user = [...pendingUsers, ...authenticatedUsers].find(u => u.id === id);
      return user && (status === 'not_active' ? user.authentication_status === 'not_active' : user.authentication_status === 'active');
    });
  };

  // Get filtered selected youth items by status
  const getFilteredSelectedYouthItems = (status) => {
    return selectedYouthUsers.filter(id => {
      const user = youthUsers.find(u => u.id === id);
      return user && (status === 'not_authenticated' ? !user.is_authenticated : user.is_authenticated);
    });
  };

  // Get icon for file type
  const getFileIcon = (fileExtension) => {
    const ext = fileExtension?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png'].includes(ext)) {
      return <FaFileImage />;
    } else if (ext === 'pdf') {
      return <FaFilePdf />;
    }
    return <FaIdCard />;
  };

  // Get status details from statusType
  const getStatusDetails = (status) => {
    if (!status) return null;
    return statusTypes.find(type => type.id === status);
  };

  // Get youth status details from statusType
  const getYouthStatusDetails = (status) => {
    if (!status) return null;
    return youthStatusTypes.find(type => type.id === status);
  };

  // Calculate statistics
  const stats_metrics = useMemo(() => {
    // Get barangay counts for statistics 
    const barangayCounts = {};
    
    // Initialize barangay counts
    barangayOptions.forEach(barangay => {
      if (barangay !== 'All') {
        barangayCounts[barangay] = 0;
      }
    });
    
    // Calculate statistics from pending users
    pendingUsers.forEach(user => {
      if (barangayOptions.includes(user.sk_station)) {
        barangayCounts[user.sk_station] = (barangayCounts[user.sk_station] || 0) + 1;
      }
    });
    
    // Get recently authenticated users (last 7 days)
    const recentlyAuthenticated = authenticatedUsers
      .filter(user => {
        if (!user.authenticated_at) return false;
        const authDate = new Date(user.authenticated_at);
        const now = new Date();
        const diffInDays = Math.floor((now - authDate) / (1000 * 60 * 60 * 24));
        return diffInDays <= 7;
      })
      .sort((a, b) => new Date(b.authenticated_at) - new Date(a.authenticated_at))
      .slice(0, 5);
    
    // Get recently updated users
    const recentlyUpdated = [...pendingUsers, ...authenticatedUsers]
      .filter(user => user.updated_at)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5);
    
    // Get users with expiring terms
    const expiringTerms = [...pendingUsers, ...authenticatedUsers]
      .filter(user => {
        if (!user.term_end) return false;
        const termEnd = new Date(user.term_end);
        const now = new Date();
        const diffInDays = Math.floor((termEnd - now) / (1000 * 60 * 60 * 24));
        return diffInDays > 0 && diffInDays <= 30;
      })
      .sort((a, b) => new Date(a.term_end) - new Date(b.term_end))
      .slice(0, 5);
    
    // Get users with eligibility issues
    const eligibilityIssues = [...pendingUsers, ...authenticatedUsers]
      .filter(user => user.over_age || user.term_expired || user.terms_served >= 3)
      .slice(0, 5);
    
    return {
      barangayCounts,
      recentlyAuthenticated,
      recentlyUpdated,
      expiringTerms,
      eligibilityIssues
    };
  }, [pendingUsers, authenticatedUsers, barangayOptions]);

  // Calculate youth statistics
  const youth_stats_metrics = useMemo(() => {
    if (!youthUsers.length) return {};
    
    // Count by residency status
    const pasigResidents = youthUsers.filter(user => user.is_pasig_resident).length;
    const nonPasigResidents = youthUsers.filter(user => !user.is_pasig_resident).length;
    
    // Count by authentication status
    const authenticatedYouth = youthUsers.filter(user => user.is_authenticated).length;
    const unauthenticatedYouth = youthUsers.filter(user => !user.is_authenticated).length;
    
    // Count by barangay
    const barangayCounts = {};
    youthUsers.forEach(user => {
      const barangay = user.baranggay;
      if (barangay) {
        barangayCounts[barangay] = (barangayCounts[barangay] || 0) + 1;
      }
    });
    
    // Recently registered youth (last 7 days)
    const now = new Date();
    const recentlyRegistered = youthUsers
      .filter(user => {
        const createdDate = new Date(user.created_at);
        const diffInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        return diffInDays <= 7;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
    
    // Recently authenticated youth (last 7 days)
    const recentlyAuthenticatedYouth = youthUsers
      .filter(user => {
        if (!user.is_authenticated) return false;
        const updatedDate = new Date(user.updated_at);
        const diffInDays = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));
        return diffInDays <= 7;
      })
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5);
    
    return {
      pasigResidents,
      nonPasigResidents,
      authenticatedYouth,
      unauthenticatedYouth,
      barangayCounts,
      recentlyRegistered,
      recentlyAuthenticatedYouth
    };
  }, [youthUsers]);

  // If user doesn't have permission, show access denied
  if (!hasAuthPermission) {
    return (
      <div className="sk-auth-denied">
        <div className="sk-auth-denied-icon">
          <FaTimes />
        </div>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page. This page is only accessible to Federasyon, Chairman, and Admin users.</p>
      </div>
    );
  }

  // Render the main component
  return (
    <div className="sk-cmn-sklcss-auth-management">
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
      >
        <div className="dialog-form-group">
          <label htmlFor="confirmReason">Reason (optional):</label>
          <textarea
            id="confirmReason"
            className="form-control mb-2"
            value={confirmReason}
            onChange={(e) => setConfirmReason(e.target.value)}
            placeholder="Enter reason for this action..."
          ></textarea>
          
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="confirmNotify"
              checked={confirmNotify}
              onChange={(e) => setConfirmNotify(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="confirmNotify">
              Send email notification to user
            </label>
          </div>
        </div>
      </ConfirmationDialog>
      
      {/* SK Bulk Action Dialog */}
      <ConfirmationDialog
        isOpen={showBulkActionDialog}
        onClose={() => setShowBulkActionDialog(false)}
        onConfirm={handleBulkConfirm}
        title={`Bulk ${bulkAction === 'active' ? 'Authenticate' : 'De-authenticate'} SK Users`}
        message={`Are you sure you want to ${bulkAction === 'active' ? 'authenticate' : 'de-authenticate'} ${selectedUsers.length} selected users?`}
        confirmText={bulkAction === 'active' ? 'Authenticate All' : 'De-authenticate All'}
        confirmColor={bulkAction === 'active' ? 'success' : 'danger'}
      >
        <div className="dialog-form-group">
          <label htmlFor="bulkReason">Reason (optional):</label>
          <textarea
            id="bulkReason"
            className="form-control mb-2"
            value={bulkReason}
            onChange={(e) => setBulkReason(e.target.value)}
            placeholder="Enter reason for this bulk action..."
          ></textarea>
          
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="bulkNotify"
              checked={bulkNotify}
              onChange={(e) => setBulkNotify(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="bulkNotify">
              Send email notifications to users
            </label>
          </div>
        </div>
      </ConfirmationDialog>

      {/* Youth Bulk Action Dialog */}
      <ConfirmationDialog
        isOpen={showYouthBulkActionDialog}
        onClose={() => setShowYouthBulkActionDialog(false)}
        onConfirm={handleYouthBulkConfirm}
        title={`Bulk ${youthBulkAction === 'authenticate' ? 'Authenticate' : 'De-authenticate'} Youth Users`}
        message={`Are you sure you want to ${youthBulkAction === 'authenticate' ? 'authenticate' : 'de-authenticate'} ${selectedYouthUsers.length} selected youth users?`}
        confirmText={youthBulkAction === 'authenticate' ? 'Authenticate All' : 'De-authenticate All'}
        confirmColor={youthBulkAction === 'authenticate' ? 'success' : 'danger'}
      >
        <div className="dialog-form-group">
          <label htmlFor="youthBulkReason">Reason (optional):</label>
          <textarea
            id="youthBulkReason"
            className="form-control mb-2"
            value={youthBulkReason}
            onChange={(e) => setYouthBulkReason(e.target.value)}
            placeholder="Enter reason for this bulk action..."
          ></textarea>
          
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="youthBulkNotify"
              checked={youthBulkNotify}
              onChange={(e) => setYouthBulkNotify(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="youthBulkNotify">
              Send email notifications to users
            </label>
          </div>
        </div>
      </ConfirmationDialog>
      
      {/* Term Renewal Dialog */}
      {showTermRenewalDialog && userForRenewal && (
        <TermRenewalDialog
          user={userForRenewal}
          onClose={() => setShowTermRenewalDialog(false)}
          onSuccess={handleTermRenewalSuccess}
        />
      )}
      
      {/* Header */}
      <div className="sk-cmn-sklcss-auth-header">
        <h1 className="sk-cmn-sklcss-auth-title">User Authentication Management</h1>
        <p className="sk-cmn-sklcss-auth-description">
          Approve and manage access for SK officials and youth users. Verify user credentials, maintain secure access to the SK portal, and manage program participation eligibility.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="sk-cmn-sklcss-auth-tabs">
        <button 
          className={`sk-cmn-sklcss-auth-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FaUserShield className="me-2" /> SK Officials
        </button>
        <button 
          className={`sk-cmn-sklcss-auth-tab ${activeTab === 'youthUsers' ? 'active' : ''}`}
          onClick={() => setActiveTab('youthUsers')}
        >
          <FaUser className="me-2" /> Youth Users
        </button>
        <button 
          className={`sk-cmn-sklcss-auth-tab ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          <FaChartBar className="me-2" /> Statistics
        </button>
        <button 
          className={`sk-cmn-sklcss-auth-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <FaHistory className="me-2" /> Activity Logs
        </button>
      </div>

      {/* Dashboard Layout */}
      <div className="sk-cmn-sklcss-auth-dashboard">
        <div className="sk-cmn-sklcss-auth-main">
          {/* SK Users Tab */}
          {activeTab === 'users' && (
            <>
              {/* Controls */}
              <div className="sk-cmn-sklcss-auth-controls">
                <div className="sk-cmn-sklcss-auth-search">
                  <FaSearch className="sk-cmn-sklcss-auth-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="sk-cmn-sklcss-auth-search-input"
                  />
                </div>

                <div className="sk-cmn-sklcss-auth-filter-group">
                  <div className="sk-cmn-sklcss-auth-filter">
                    <span className="sk-cmn-sklcss-auth-filter-label">View:</span>
                    <div className="sk-cmn-sklcss-auth-view-toggle">
                      <button 
                        className={`sk-cmn-sklcss-auth-view-btn ${currentView === 'pending' ? 'active' : ''}`}
                        onClick={() => handleViewChange('pending')}
                      >
                        <FaLock className="me-1" /> Not Authenticated
                      </button>
                      <button 
                        className={`sk-cmn-sklcss-auth-view-btn ${currentView === 'authenticated' ? 'active' : ''}`}
                        onClick={() => handleViewChange('authenticated')}
                      >
                        <FaUnlock className="me-1" /> Authenticated
                      </button>
                    </div>
                  </div>

                  {/* Only show barangay filter for Federasyon and Admin */}
                  {(skUser?.sk_role === 'Federasyon' || skUser?.sk_role === 'Admin') && (
                    <div className="sk-cmn-sklcss-auth-filter">
                      <span className="sk-cmn-sklcss-auth-filter-label">Barangay:</span>
                      <select 
                        value={selectedBarangay} 
                        onChange={(e) => setSelectedBarangay(e.target.value)}
                        className="sk-cmn-sklcss-auth-filter-select"
                      >
                        {barangayOptions.map((barangay, index) => (
                          <option key={index} value={barangay}>
                            {barangay === 'All' ? 'All Barangays' : barangay}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="sk-cmn-sklcss-auth-filter">
                    <span className="sk-cmn-sklcss-auth-filter-label">Role:</span>
                    <select 
                      value={selectedRole} 
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="sk-cmn-sklcss-auth-filter-select"
                    >
                      {roleOptions.map((role, index) => (
                        <option key={index} value={role}>
                          {role === 'All' ? 'All Roles' : role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sk-cmn-sklcss-auth-filter">
                    <span className="sk-cmn-sklcss-auth-filter-label">Term Status:</span>
                    <select 
                      value={selectedTermStatus} 
                      onChange={(e) => setSelectedTermStatus(e.target.value)}
                      className="sk-cmn-sklcss-auth-filter-select"
                    >
                      {termStatusOptions.map((option, index) => (
                        <option key={index} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sk-cmn-sklcss-auth-filter">
                    <span className="sk-cmn-sklcss-auth-filter-label">Age Status:</span>
                    <select 
                      value={selectedAgeStatus} 
                      onChange={(e) => setSelectedAgeStatus(e.target.value)}
                      className="sk-cmn-sklcss-auth-filter-select"
                    >
                      {ageStatusOptions.map((option, index) => (
                        <option key={index} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sk-cmn-sklcss-auth-display-toggle">
                    <button 
                      className={`sk-cmn-sklcss-auth-display-btn ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => toggleViewMode('grid')}
                      title="Grid View"
                    >
                      <FaTh />
                    </button>
                    <button 
                      className={`sk-cmn-sklcss-auth-display-btn ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => toggleViewMode('list')}
                      title="List View"
                    >
                      <FaList />
                    </button>
                  </div>
                </div>

                <div className="sk-cmn-sklcss-auth-action-group">
                  {filteredUsers.length > 0 && (
                    <button 
                      className="sk-cmn-sklcss-auth-select-btn"
                      onClick={handleSelectAll}
                    >
                      {selectAll ? (
                        <><FaCheckSquare className="me-2" /> Unselect All</>
                      ) : (
                        <><FaSquare className="me-2" /> Select All</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Legend */}
              <div className="sk-cmn-sklcss-auth-legend">
                {statusTypes.map(type => (
                  <div key={type.id} className="sk-cmn-sklcss-auth-legend-pill">
                    <div 
                      className="sk-cmn-sklcss-auth-bookmark-sample" 
                      style={{ backgroundColor: type.color }}
                    ></div>
                    <span>{type.name}</span>
                  </div>
                ))}
              </div>

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="sk-cmn-sklcss-auth-bulk-actions">
                  <div className="sk-cmn-sklcss-auth-bulk-info">
                    <FaCheck className="sk-cmn-sklcss-auth-bulk-info-icon" /> 
                    <span>{selectedUsers.length} users selected</span>
                  </div>
                  <div className="sk-cmn-sklcss-auth-bulk-buttons">
                    {getFilteredSelectedItems('not_active').length > 0 && (
                      <button 
                        className="sk-cmn-sklcss-auth-bulk-btn auth"
                        onClick={() => {
                          setBulkAction('active');
                          setBulkReason('');
                          setBulkNotify(false);
                          setShowBulkActionDialog(true);
                        }}
                      >
                        <FaUserCheck /> Authenticate Selected ({getFilteredSelectedItems('not_active').length})
                      </button>
                    )}
                    
                    {getFilteredSelectedItems('active').length > 0 && (
                      <button 
                        className="sk-cmn-sklcss-auth-bulk-btn deauth"
                        onClick={() => {
                          setBulkAction('not_active');
                          setBulkReason('');
                          setBulkNotify(false);
                          setShowBulkActionDialog(true);
                        }}
                      >
                        <FaUserTimes /> De-authenticate Selected ({getFilteredSelectedItems('active').length})
                      </button>
                    )}
                    
                    <button 
                      className="sk-cmn-sklcss-auth-bulk-btn cancel"
                      onClick={() => {
                        setSelectedUsers([]);
                        setSelectAll(false);
                      }}
                    >
                      <FaTimes /> Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* SK Users Grid/List/Loading/Empty States */}
              {loading ? (
                <div className="sk-cmn-sklcss-auth-loading">
                  <div className="sk-cmn-sklcss-auth-loading-spinner"></div>
                  <p className="sk-cmn-sklcss-auth-loading-text">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="sk-cmn-sklcss-auth-empty">
                  <FaUserShield className="sk-cmn-sklcss-auth-empty-icon" />
                  <h3 className="sk-cmn-sklcss-auth-empty-text">No users found</h3>
                  <p className="sk-cmn-sklcss-auth-empty-subtext">
                    {searchQuery || selectedBarangay !== 'All' || selectedRole !== 'All' || 
                     selectedTermStatus !== 'All' || selectedAgeStatus !== 'All' ? 
                      "Try adjusting your search criteria or filters." : 
                      "There are no users requiring authentication at this time."}
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="sk-cmn-sklcss-auth-grid">
                  {getCurrentUsers().map((user) => (
                    <div 
                      key={user.id} 
                      className={`sk-cmn-sklcss-auth-card ${user.authentication_status === 'active' ? 'authenticated' : ''}`}
                    >
                      {/* Checkbox for selection */}
                      <div 
                        className="sk-cmn-sklcss-auth-card-checkbox"
                        onClick={() => handleSelectItem(user.id)}
                      >
                        {selectedUsers.includes(user.id) ? 
                          <FaCheckSquare className="sk-cmn-sklcss-auth-card-checkbox-icon checked" /> : 
                          <FaSquare className="sk-cmn-sklcss-auth-card-checkbox-icon" />
                        }
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-card-avatar">
                        <div className="sk-cmn-sklcss-auth-card-avatar-icon">
                          <FaUser />
                        </div>
                        <div className="sk-cmn-sklcss-auth-card-role">
                          {user.sk_role}
                        </div>
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-card-body">
                        <h3 className="sk-cmn-sklcss-auth-card-title">
                          {user.first_name} {user.last_name}
                        </h3>
                        <p className="sk-cmn-sklcss-auth-card-email">{user.email}</p>
                        
                        <div className="sk-cmn-sklcss-auth-card-meta">
                          <div className="sk-cmn-sklcss-auth-card-meta-item">
                            <FaBuilding className="sk-cmn-sklcss-auth-card-meta-icon" />
                            <span>{user.sk_station}</span>
                          </div>
                          <div className="sk-cmn-sklcss-auth-card-meta-item">
                            <FaPhone className="sk-cmn-sklcss-auth-card-meta-icon" />
                            <span>{user.phone_number}</span>
                          </div>
                          <div className="sk-cmn-sklcss-auth-card-meta-item">
                            <FaCalendarAlt className="sk-cmn-sklcss-auth-card-meta-icon" />
                            <span>
                              {user.authentication_status === 'active' 
                                ? formatDate(user.authenticated_at) 
                                : formatDate(user.created_at)}
                            </span>
                          </div>
                          {user.term_end && (
                            <div className="sk-cmn-sklcss-auth-card-meta-item" 
                                style={{color: user.term_expired ? '#ef4444' : (getDaysRemaining(user.term_end) <= 30 ? '#f97316' : 'inherit')}}>
                              <FaCalendarCheck className="sk-cmn-sklcss-auth-card-meta-icon" />
                              <span>
                                {user.term_expired ? 'Term Expired: ' : 'Term Ends: '}
                                {formatDate(user.term_end)}
                                {!user.term_expired && getDaysRemaining(user.term_end) <= 30 && 
                                  ` (${getDaysRemaining(user.term_end)} days)`}
                              </span>
                            </div>
                          )}
                          <div className="sk-cmn-sklcss-auth-card-meta-item"
                              style={{color: user.over_age ? '#8b5cf6' : 'inherit'}}>
                            <FaBirthdayCake className="sk-cmn-sklcss-auth-card-meta-icon" />
                            <span>
                              Age: {user.age}
                              {user.over_age && ' (Over Max Age)'}
                            </span>
                          </div>
                          {user.terms_served && (
                            <div className="sk-cmn-sklcss-auth-card-meta-item">
                              <FaCertificate className="sk-cmn-sklcss-auth-card-meta-icon" />
                              <span>
                                Term {user.terms_served} of 3
                              </span>
                            </div>
                          )}
                          
                          {/* Display status as text with appropriate color */}
                          {user.statusType && (
                            <div className="sk-cmn-sklcss-auth-card-meta-item" 
                                style={{color: getStatusDetails(user.statusType)?.color}}>
                              <FaInfoCircle className="sk-cmn-sklcss-auth-card-meta-icon" />
                              <span>
                                {getStatusDetails(user.statusType)?.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-card-footer">
                        <button 
                          className="sk-cmn-sklcss-auth-card-btn info" 
                          title="View Details"
                          onClick={() => handleViewUser(user)}
                        >
                          <FaInfoCircle />
                        </button>
                        <button 
                          className="sk-cmn-sklcss-auth-card-btn view-id" 
                          title={user.valid_id ? "View Oath Document" : "No oath document uploaded"}
                          onClick={() => handleViewID(user)}
                          disabled={!user.valid_id}
                        >
                          {getFileIcon(user.valid_id_extension)}
                        </button>
                        
                        {/* Show Term Renewal button for expired terms (if they haven't reached max terms) */}
                        {user.term_expired && user.terms_served < 3 && (
                          <button 
                            className="sk-cmn-sklcss-auth-card-btn"
                            style={{color: '#3b82f6'}}
                            title="Renew Term"
                            onClick={() => handleRenewTerm(user)}
                          >
                            <FaSync />
                          </button>
                        )}
                        
                        {user.authentication_status === 'not_active' ? (
                          <button 
                            className="sk-cmn-sklcss-auth-card-btn auth" 
                            title="Authenticate User"
                            onClick={() => handleAuthenticate(user.id)}
                            disabled={user.term_expired || user.over_age}
                          >
                            <FaUnlock />
                          </button>
                        ) : (
                          <button 
                            className="sk-cmn-sklcss-auth-card-btn deauth" 
                            title="De-authenticate User"
                            onClick={() => handleDeauthenticate(user.id)}
                          >
                            <FaLock />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sk-cmn-sklcss-auth-list">
                  {getCurrentUsers().map((user) => (
                    <div 
                      key={user.id} 
                      className={`sk-cmn-sklcss-auth-list-item ${user.authentication_status === 'active' ? 'authenticated' : ''}`}
                    >
                      {/* Checkbox for selection */}
                      <div 
                        className="sk-cmn-sklcss-auth-list-checkbox"
                        onClick={() => handleSelectItem(user.id)}
                      >
                        {selectedUsers.includes(user.id) ? 
                          <FaCheckSquare className="sk-cmn-sklcss-auth-list-checkbox-icon checked" /> : 
                          <FaSquare className="sk-cmn-sklcss-auth-list-checkbox-icon" />
                        }
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-list-info">
                        <div className="sk-cmn-sklcss-auth-list-avatar">
                          <div className="sk-cmn-sklcss-auth-list-avatar-icon">
                            <FaUser />
                          </div>
                          <div className="sk-cmn-sklcss-auth-list-role">
                            {user.sk_role}
                          </div>
                        </div>
                        
                        <div className="sk-cmn-sklcss-auth-list-details">
                          <h3 className="sk-cmn-sklcss-auth-list-name">
                            {user.first_name} {user.last_name}
                            {/* Display status as badge */}
                            {user.statusType && (
                              <span style={{
                                marginLeft: '10px',
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: getStatusDetails(user.statusType)?.color,
                                color: 'white'
                              }}>
                                {getStatusDetails(user.statusType)?.name}
                              </span>
                            )}
                          </h3>
                          <p className="sk-cmn-sklcss-auth-list-email">{user.email}</p>
                          
                          <div className="sk-cmn-sklcss-auth-list-meta">
                            <div className="sk-cmn-sklcss-auth-list-meta-item">
                              <FaBuilding className="sk-cmn-sklcss-auth-list-meta-icon" />
                              <span>{user.sk_station}</span>
                            </div>
                            <div className="sk-cmn-sklcss-auth-list-meta-item">
                              <FaPhone className="sk-cmn-sklcss-auth-list-meta-icon" />
                              <span>{user.phone_number}</span>
                            </div>
                            <div className="sk-cmn-sklcss-auth-list-meta-item">
                              <FaHome className="sk-cmn-sklcss-auth-list-meta-icon" />
                              <span title={user.formatted_address}>
                                {user.street}
                                {user.house_number ? `, ${user.house_number}` : ''}
                              </span>
                            </div>
                            <div className="sk-cmn-sklcss-auth-list-meta-item" 
                                style={{color: user.term_expired ? '#ef4444' : (getDaysRemaining(user.term_end) <= 30 ? '#f97316' : 'inherit')}}>
                              <FaCalendarCheck className="sk-cmn-sklcss-auth-list-meta-icon" />
                              <span>
                                Term: {formatDate(user.term_start)} - {formatDate(user.term_end)}
                                {user.term_expired ? ' (Expired)' : 
                                  !user.term_expired && getDaysRemaining(user.term_end) <= 30 ? 
                                  ` (${getDaysRemaining(user.term_end)} days left)` : ''}
                              </span>
                            </div>
                            <div className="sk-cmn-sklcss-auth-list-meta-item"
                                style={{color: user.over_age ? '#8b5cf6' : 'inherit'}}>
                              <FaBirthdayCake className="sk-cmn-sklcss-auth-list-meta-icon" />
                              <span>
                                Age: {user.age}
                                {user.over_age && ' (Over Max Age)'}
                              </span>
                            </div>
                            <div className="sk-cmn-sklcss-auth-list-meta-item">
                              <FaCertificate className="sk-cmn-sklcss-auth-list-meta-icon" />
                              <span>
                                Term {user.terms_served} of 3
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-list-actions">
                        <button 
                          className="sk-cmn-sklcss-auth-list-btn info" 
                          title="View Details"
                          onClick={() => handleViewUser(user)}
                        >
                          <FaInfoCircle />
                        </button>
                        <button 
                          className="sk-cmn-sklcss-auth-list-btn view-id" 
                          title={user.valid_id ? "View Oath Document" : "No oath document uploaded"}
                          onClick={() => handleViewID(user)}
                          disabled={!user.valid_id}
                        >
                          {getFileIcon(user.valid_id_extension)}
                        </button>
                        
                        {/* Show Term Renewal button for expired terms */}
                        {user.term_expired && user.terms_served < 3 && (
                          <button 
                            className="sk-cmn-sklcss-auth-list-btn" 
                            title="Renew Term"
                            onClick={() => handleRenewTerm(user)}
                            style={{color: '#3b82f6'}}
                          >
                            <FaSync />
                          </button>
                        )}
                        
                        {user.authentication_status === 'not_active' ? (
                          <button 
                            className="sk-cmn-sklcss-auth-list-btn auth" 
                            title="Authenticate User"
                            onClick={() => handleAuthenticate(user.id)}
                            disabled={user.term_expired || user.over_age}
                          >
                            <FaUnlock />
                          </button>
                        ) : (
                          <button 
                            className="sk-cmn-sklcss-auth-list-btn deauth" 
                            title="De-authenticate User"
                            onClick={() => handleDeauthenticate(user.id)}
                          >
                            <FaLock />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {filteredUsers.length > 0 && (
                <div className="sk-cmn-sklcss-auth-pagination">
                  <div className="sk-cmn-sklcss-auth-pagination-info">
                    Showing {Math.min(filteredUsers.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredUsers.length, currentPage * itemsPerPage)} of {filteredUsers.length} users
                  </div>
                  
                  <button 
                    className={`sk-cmn-sklcss-auth-pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous Page"
                  >
                    <FaChevronLeft />
                  </button>
                  
                  {renderPaginationButtons()}
                  
                  <button 
                    className={`sk-cmn-sklcss-auth-pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Next Page"
                  >
                    <FaChevronRight />
                  </button>
                  
                  <div className="sk-cmn-sklcss-auth-per-page">
                    <span className="sk-cmn-sklcss-auth-per-page-label">Show:</span>
                    <select 
                      className="sk-cmn-sklcss-auth-per-page-select"
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Youth Users Tab */}
          {activeTab === 'youthUsers' && (
            <>
              {/* Controls */}
              <div className="sk-cmn-sklcss-auth-controls">
                <div className="sk-cmn-sklcss-auth-search">
                  <FaSearch className="sk-cmn-sklcss-auth-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or address..."
                    value={youthSearchQuery}
                    onChange={(e) => setYouthSearchQuery(e.target.value)}
                    className="sk-cmn-sklcss-auth-search-input"
                  />
                </div>

                <div className="sk-cmn-sklcss-auth-filter-group">
                  <div className="sk-cmn-sklcss-auth-filter">
                    <span className="sk-cmn-sklcss-auth-filter-label">Barangay:</span>
                    <select 
                      value={selectedYouthBarangay} 
                      onChange={(e) => setSelectedYouthBarangay(e.target.value)}
                      className="sk-cmn-sklcss-auth-filter-select"
                    >
                      <option value="All">All Barangays</option>
                      {barangayOptions.filter(b => b !== 'All').map((barangay, index) => (
                        <option key={index} value={barangay}>{barangay}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sk-cmn-sklcss-auth-filter">
                    <span className="sk-cmn-sklcss-auth-filter-label">Status:</span>
                    <select 
                      value={selectedYouthResidency} 
                      onChange={(e) => setSelectedYouthResidency(e.target.value)}
                      className="sk-cmn-sklcss-auth-filter-select"
                    >
                      {residencyOptions.map((option, index) => (
                        <option key={index} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sk-cmn-sklcss-auth-display-toggle">
                    <button 
                      className={`sk-cmn-sklcss-auth-display-btn ${youthViewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => toggleYouthViewMode('grid')}
                      title="Grid View"
                    >
                      <FaTh />
                    </button>
                    <button 
                      className={`sk-cmn-sklcss-auth-display-btn ${youthViewMode === 'list' ? 'active' : ''}`}
                      onClick={() => toggleYouthViewMode('list')}
                      title="List View"
                    >
                      <FaList />
                    </button>
                  </div>
                </div>

                <div className="sk-cmn-sklcss-auth-action-group">
                  {filteredYouthUsers.length > 0 && (
                    <button 
                      className="sk-cmn-sklcss-auth-select-btn"
                      onClick={handleYouthSelectAll}
                    >
                      {youthSelectAll ? (
                        <><FaCheckSquare className="me-2" /> Unselect All</>
                      ) : (
                        <><FaSquare className="me-2" /> Select All</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Youth Status Legend */}
              <div className="sk-cmn-sklcss-auth-legend">
                {youthStatusTypes.map(type => (
                  <div key={type.id} className="sk-cmn-sklcss-auth-legend-pill">
                    <div 
                      className="sk-cmn-sklcss-auth-bookmark-sample" 
                      style={{ backgroundColor: type.color }}
                    ></div>
                    <span>{type.name}</span>
                  </div>
                ))}
              </div>

              {/* Youth Bulk Actions */}
              {selectedYouthUsers.length > 0 && (
                <div className="sk-cmn-sklcss-auth-bulk-actions">
                  <div className="sk-cmn-sklcss-auth-bulk-info">
                    <FaCheck className="sk-cmn-sklcss-auth-bulk-info-icon" /> 
                    <span>{selectedYouthUsers.length} users selected</span>
                  </div>
                  <div className="sk-cmn-sklcss-auth-bulk-buttons">
                    {getFilteredSelectedYouthItems('not_authenticated').length > 0 && (
                      <button 
                        className="sk-cmn-sklcss-auth-bulk-btn auth"
                        onClick={() => {
                          setYouthBulkAction('authenticate');
                          setYouthBulkReason('');
                          setYouthBulkNotify(false);
                          setShowYouthBulkActionDialog(true);
                        }}
                      >
                        <FaUserCheck /> Authenticate Selected ({getFilteredSelectedYouthItems('not_authenticated').length})
                      </button>
                    )}
                    
                    {getFilteredSelectedYouthItems('authenticated').length > 0 && (
                      <button 
                        className="sk-cmn-sklcss-auth-bulk-btn deauth"
                        onClick={() => {
                          setYouthBulkAction('deauthenticate');
                          setYouthBulkReason('');
                          setYouthBulkNotify(false);
                          setShowYouthBulkActionDialog(true);
                        }}
                      >
                        <FaUserTimes /> De-authenticate Selected ({getFilteredSelectedYouthItems('authenticated').length})
                      </button>
                    )}
                    
                    <button 
                      className="sk-cmn-sklcss-auth-bulk-btn cancel"
                      onClick={() => {
                        setSelectedYouthUsers([]);
                        setYouthSelectAll(false);
                      }}
                    >
                      <FaTimes /> Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Youth Users Grid/List/Loading/Empty States */}
              {youthLoading ? (
                <div className="sk-cmn-sklcss-auth-loading">
                  <div className="sk-cmn-sklcss-auth-loading-spinner"></div>
                  <p className="sk-cmn-sklcss-auth-loading-text">Loading youth users...</p>
                </div>
              ) : filteredYouthUsers.length === 0 ? (
                <div className="sk-cmn-sklcss-auth-empty">
                  <FaUser className="sk-cmn-sklcss-auth-empty-icon" />
                  <h3 className="sk-cmn-sklcss-auth-empty-text">No youth users found</h3>
                  <p className="sk-cmn-sklcss-auth-empty-subtext">
                    {youthSearchQuery || selectedYouthBarangay !== 'All' || selectedYouthResidency !== 'All' ? 
                      "Try adjusting your search criteria or filters." : 
                      "There are no youth users registered in the system at this time."}
                  </p>
                </div>
              ) : youthViewMode === 'grid' ? (
                <div className="sk-cmn-sklcss-auth-grid">
                  {getCurrentYouthUsers().map((user) => (
                    <div 
                      key={user.id} 
                      className={`sk-cmn-sklcss-auth-card ${user.is_authenticated ? 'authenticated' : ''}`}
                    >
                      {/* Checkbox for selection */}
                      <div 
                        className="sk-cmn-sklcss-auth-card-checkbox"
                        onClick={() => handleSelectYouthItem(user.id)}
                      >
                        {selectedYouthUsers.includes(user.id) ? 
                          <FaCheckSquare className="sk-cmn-sklcss-auth-card-checkbox-icon checked" /> : 
                          <FaSquare className="sk-cmn-sklcss-auth-card-checkbox-icon" />
                        }
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-card-avatar">
                        <div className="sk-cmn-sklcss-auth-card-avatar-icon">
                          <FaUser />
                        </div>
                        <div className="sk-cmn-sklcss-auth-card-role" style={{
                          backgroundColor: user.is_pasig_resident ? '#3b82f6' : '#8b5cf6'
                        }}>
                          {user.is_pasig_resident ? 'Pasig' : 'Non-Pasig'}
                        </div>
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-card-body">
                        <h3 className="sk-cmn-sklcss-auth-card-title">
                          {user.first_name} {user.last_name}
                        </h3>
                        <p className="sk-cmn-sklcss-auth-card-email">{user.email}</p>
                        
                        <div className="sk-cmn-sklcss-auth-card-meta">
                          <div className="sk-cmn-sklcss-auth-card-meta-item">
                            <FaBuilding className="sk-cmn-sklcss-auth-card-meta-icon" />
                            <span>{user.baranggay}</span>
                          </div>
                          <div className="sk-cmn-sklcss-auth-card-meta-item">
                            <FaPhone className="sk-cmn-sklcss-auth-card-meta-icon" />
                            <span>{user.phone_number}</span>
                          </div>
                          <div className="sk-cmn-sklcss-auth-card-meta-item">
                            <FaAddressCard className="sk-cmn-sklcss-auth-card-meta-icon" />
                            <span>
                              {user.is_authenticated ? 'Authenticated' : 'Not Authenticated'}
                            </span>
                          </div>
                          <div className="sk-cmn-sklcss-auth-card-meta-item">
                            <FaBirthdayCake className="sk-cmn-sklcss-auth-card-meta-icon" />
                            <span>
                              Age: {user.age}
                            </span>
                          </div>
                          
                          {/* Display status as text with appropriate color */}
                          {user.statusType && (
                            <div className="sk-cmn-sklcss-auth-card-meta-item" 
                                style={{color: getYouthStatusDetails(user.statusType)?.color}}>
                              <FaInfoCircle className="sk-cmn-sklcss-auth-card-meta-icon" />
                              <span>
                                {getYouthStatusDetails(user.statusType)?.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-card-footer">
                        <button 
                          className="sk-cmn-sklcss-auth-card-btn info" 
                          title="View Details"
                          onClick={() => handleViewUser(user)}
                        >
                          <FaInfoCircle />
                        </button>
                        {user.proof_of_address && (
                          <button 
                            className="sk-cmn-sklcss-auth-card-btn view-id" 
                            title="View Proof of Address"
                            onClick={() => handleViewID(user)}
                          >
                            <FaIdCard />
                          </button>
                        )}
                        
                        {/* Residency Update Buttons */}
                        {!user.is_pasig_resident ? (
                          <button 
                            className="sk-cmn-sklcss-auth-card-btn" 
                            title="Confirm as Pasig Resident"
                            onClick={() => handleUpdateResidency(user.id, true)}
                            style={{color: '#3b82f6'}}
                          >
                            <FaHome />
                          </button>
                        ) : (
                          <button 
                            className="sk-cmn-sklcss-auth-card-btn" 
                            title="Change to Non-Pasig Resident"
                            onClick={() => handleUpdateResidency(user.id, false)}
                            style={{color: '#8b5cf6'}}
                          >
                            <FaMapMarkerAlt />
                          </button>
                        )}
                        
                        {!user.is_authenticated ? (
                          <button 
                            className="sk-cmn-sklcss-auth-card-btn auth" 
                            title="Authenticate User"
                            onClick={() => handleAuthenticateYouth(user.id)}
                          >
                            <FaUnlock />
                          </button>
                        ) : (
                          <button 
                            className="sk-cmn-sklcss-auth-card-btn deauth" 
                            title="De-authenticate User"
                            onClick={() => handleDeauthenticateYouth(user.id)}
                          >
                            <FaLock />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sk-cmn-sklcss-auth-list">
                  {getCurrentYouthUsers().map((user) => (
                    <div 
                      key={user.id} 
                      className={`sk-cmn-sklcss-auth-list-item ${user.is_authenticated ? 'authenticated' : ''}`}
                    >
                      {/* Checkbox for selection */}
                      <div 
                        className="sk-cmn-sklcss-auth-list-checkbox"
                        onClick={() => handleSelectYouthItem(user.id)}
                      >
                        {selectedYouthUsers.includes(user.id) ? 
                          <FaCheckSquare className="sk-cmn-sklcss-auth-list-checkbox-icon checked" /> : 
                          <FaSquare className="sk-cmn-sklcss-auth-list-checkbox-icon" />
                        }
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-list-info">
                        <div className="sk-cmn-sklcss-auth-list-avatar">
                          <div className="sk-cmn-sklcss-auth-list-avatar-icon">
                            <FaUser />
                          </div>
                          <div className="sk-cmn-sklcss-auth-list-role" style={{
                            backgroundColor: user.is_pasig_resident ? '#3b82f6' : '#8b5cf6'
                          }}>
                            {user.is_pasig_resident ? 'Pasig' : 'Non-Pasig'}
                          </div>
                        </div>
                        
                        <div className="sk-cmn-sklcss-auth-list-details">
                          <h3 className="sk-cmn-sklcss-auth-list-name">
                            {user.first_name} {user.last_name}
                            {/* Display status as badge */}
                            {user.statusType && (
                              <span style={{
                                marginLeft: '10px',
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: getYouthStatusDetails(user.statusType)?.color,
                                color: 'white'
                              }}>
                                {getYouthStatusDetails(user.statusType)?.name}
                              </span>
                            )}
                          </h3>
                          <p className="sk-cmn-sklcss-auth-list-email">{user.email}</p>
                          
                          <div className="sk-cmn-sklcss-auth-list-meta">
                            <div className="sk-cmn-sklcss-auth-list-meta-item">
                              <FaBuilding className="sk-cmn-sklcss-auth-list-meta-icon" />
                              <span>{user.baranggay}</span>
                            </div>
                            <div className="sk-cmn-sklcss-auth-list-meta-item">
                              <FaPhone className="sk-cmn-sklcss-auth-list-meta-icon" />
                              <span>{user.phone_number}</span>
                            </div>
                            <div className="sk-cmn-sklcss-auth-list-meta-item">
                              <FaHome className="sk-cmn-sklcss-auth-list-meta-icon" />
                              <span title={user.address}>
                                {user.street}
                                {user.house_number ? `, ${user.house_number}` : ''}
                              </span>
                            </div>
                            <div className="sk-cmn-sklcss-auth-list-meta-item"
                                style={{color: user.is_authenticated ? '#22c55e' : '#ef4444'}}>
                              <FaAddressCard className="sk-cmn-sklcss-auth-list-meta-icon" />
                              <span>
                                {user.is_authenticated ? 'Authenticated' : 'Not Authenticated'}
                              </span>
                            </div>
                            <div className="sk-cmn-sklcss-auth-list-meta-item">
                              <FaBirthdayCake className="sk-cmn-sklcss-auth-list-meta-icon" />
                              <span>
                                Age: {user.age}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-list-actions">
                        <button 
                          className="sk-cmn-sklcss-auth-list-btn info" 
                          title="View Details"
                          onClick={() => handleViewUser(user)}
                        >
                          <FaInfoCircle />
                        </button>
                        
                        {user.proof_of_address && (
                          <button 
                            className="sk-cmn-sklcss-auth-list-btn view-id" 
                            title="View Proof of Address"
                            onClick={() => handleViewID(user)}
                          >
                            <FaIdCard />
                          </button>
                        )}
                        
                        {/* Residency Update Buttons */}
                        {!user.is_pasig_resident ? (
                          <button 
                            className="sk-cmn-sklcss-auth-list-btn" 
                            title="Confirm as Pasig Resident"
                            onClick={() => handleUpdateResidency(user.id, true)}
                            style={{color: '#3b82f6'}}
                          >
                            <FaHome />
                          </button>
                        ) : (
                          <button 
                            className="sk-cmn-sklcss-auth-list-btn" 
                            title="Change to Non-Pasig Resident"
                            onClick={() => handleUpdateResidency(user.id, false)}
                            style={{color: '#8b5cf6'}}
                          >
                            <FaMapMarkerAlt />
                          </button>
                        )}
                        
                        {!user.is_authenticated ? (
                          <button 
                            className="sk-cmn-sklcss-auth-list-btn auth" 
                            title="Authenticate User"
                            onClick={() => handleAuthenticateYouth(user.id)}
                          >
                            <FaUnlock />
                          </button>
                        ) : (
                          <button 
                            className="sk-cmn-sklcss-auth-list-btn deauth" 
                            title="De-authenticate User"
                            onClick={() => handleDeauthenticateYouth(user.id)}
                          >
                            <FaLock />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Youth Pagination */}
              {filteredYouthUsers.length > 0 && (
                <div className="sk-cmn-sklcss-auth-pagination">
                  <div className="sk-cmn-sklcss-auth-pagination-info">
                    Showing {Math.min(filteredYouthUsers.length, (youthCurrentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredYouthUsers.length, youthCurrentPage * itemsPerPage)} of {filteredYouthUsers.length} youth users
                  </div>
                  
                  <button 
                    className={`sk-cmn-sklcss-auth-pagination-btn ${youthCurrentPage === 1 ? 'disabled' : ''}`}
                    onClick={() => goToYouthPage(youthCurrentPage - 1)}
                    disabled={youthCurrentPage === 1}
                    title="Previous Page"
                  >
                    <FaChevronLeft />
                  </button>
                  
                  {renderYouthPaginationButtons()}
                  
                  <button 
                    className={`sk-cmn-sklcss-auth-pagination-btn ${youthCurrentPage === youthTotalPages ? 'disabled' : ''}`}
                    onClick={() => goToYouthPage(youthCurrentPage + 1)}
                    disabled={youthCurrentPage === youthTotalPages}
                    title="Next Page"
                  >
                    <FaChevronRight />
                  </button>
                  
                  <div className="sk-cmn-sklcss-auth-per-page">
                    <span className="sk-cmn-sklcss-auth-per-page-label">Show:</span>
                    <select 
                      className="sk-cmn-sklcss-auth-per-page-select"
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'statistics' && (
            <div className="sk-cmn-sklcss-auth-stats-container">
              <div className="row">
                <div className="col-md-12 mb-4">
                  <div className="sk-cmn-sklcss-auth-stats-card">
                    <div className="sk-cmn-sklcss-auth-stats-header">
                      <FaChartBar className="me-2" /> SK Authentication Overview
                    </div>
                    <div className="sk-cmn-sklcss-auth-stats-body">
                      <div className="sk-cmn-sklcss-auth-stat-item">
                        <div className="sk-cmn-sklcss-auth-stat-icon blue">
                          <FaUserShield />
                        </div>
                        <div className="sk-cmn-sklcss-auth-stat-info">
                          <p className="sk-cmn-sklcss-auth-stat-title">Total SK Users</p>
                          <p className="sk-cmn-sklcss-auth-stat-value">{stats.pending + stats.authenticated}</p>
                        </div>
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-stat-item">
                        <div className="sk-cmn-sklcss-auth-stat-icon green">
                          <FaUserCheck />
                        </div>
                        <div className="sk-cmn-sklcss-auth-stat-info">
                          <p className="sk-cmn-sklcss-auth-stat-title">Authenticated SK Users</p>
                          <p className="sk-cmn-sklcss-auth-stat-value">{stats.authenticated}</p>
                        </div>
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-stat-item">
                        <div className="sk-cmn-sklcss-auth-stat-icon amber">
                          <FaUserTimes />
                        </div>
                        <div className="sk-cmn-sklcss-auth-stat-info">
                          <p className="sk-cmn-sklcss-auth-stat-title">Not Authenticated SK</p>
                          <p className="sk-cmn-sklcss-auth-stat-value">{stats.pending}</p>
                        </div>
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-stat-item">
                        <div className="sk-cmn-sklcss-auth-stat-icon purple">
                          <FaClock />
                        </div>
                        <div className="sk-cmn-sklcss-auth-stat-info">
                          <p className="sk-cmn-sklcss-auth-stat-title">Recent Authentications</p>
                          <p className="sk-cmn-sklcss-auth-stat-value">{stats.recent_authentications}</p>
                          <p className="sk-cmn-sklcss-auth-stat-subtitle">
                            In the last 7 days
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Youth Authentication Stats */}
              {youth_stats_metrics && Object.keys(youth_stats_metrics).length > 0 && (
                <div className="row">
                  <div className="col-md-12 mb-4">
                    <div className="sk-cmn-sklcss-auth-stats-card">
                      <div className="sk-cmn-sklcss-auth-stats-header">
                        <FaUser className="me-2" /> Youth Authentication Overview
                      </div>
                      <div className="sk-cmn-sklcss-auth-stats-body">
                        <div className="sk-cmn-sklcss-auth-stat-item">
                          <div className="sk-cmn-sklcss-auth-stat-icon blue">
                            <FaUser />
                          </div>
                          <div className="sk-cmn-sklcss-auth-stat-info">
                            <p className="sk-cmn-sklcss-auth-stat-title">Total Youth Users</p>
                            <p className="sk-cmn-sklcss-auth-stat-value">{youthUsers.length}</p>
                          </div>
                        </div>
                        
                        <div className="sk-cmn-sklcss-auth-stat-item">
                          <div className="sk-cmn-sklcss-auth-stat-icon" style={{backgroundColor: '#dcfce7', color: '#16a34a'}}>
                            <FaUserCheck />
                          </div>
                          <div className="sk-cmn-sklcss-auth-stat-info">
                            <p className="sk-cmn-sklcss-auth-stat-title">Authenticated Youth</p>
                            <p className="sk-cmn-sklcss-auth-stat-value">{youth_stats_metrics.authenticatedYouth}</p>
                          </div>
                        </div>
                        
                        <div className="sk-cmn-sklcss-auth-stat-item">
                          <div className="sk-cmn-sklcss-auth-stat-icon" style={{backgroundColor: '#ffebee', color: '#d32f2f'}}>
                            <FaUserTimes />
                          </div>
                          <div className="sk-cmn-sklcss-auth-stat-info">
                            <p className="sk-cmn-sklcss-auth-stat-title">Unauthenticated Youth</p>
                            <p className="sk-cmn-sklcss-auth-stat-value">{youth_stats_metrics.unauthenticatedYouth}</p>
                          </div>
                        </div>
                        
                        <div className="sk-cmn-sklcss-auth-stat-item">
                          <div className="sk-cmn-sklcss-auth-stat-icon" style={{backgroundColor: '#e0f2fe', color: '#0ea5e9'}}>
                            <FaHome />
                          </div>
                          <div className="sk-cmn-sklcss-auth-stat-info">
                            <p className="sk-cmn-sklcss-auth-stat-title">Pasig Residents</p>
                            <p className="sk-cmn-sklcss-auth-stat-value">{youth_stats_metrics.pasigResidents}</p>
                          </div>
                        </div>
                        
                        <div className="sk-cmn-sklcss-auth-stat-item">
                          <div className="sk-cmn-sklcss-auth-stat-icon" style={{backgroundColor: '#f3e8ff', color: '#8b5cf6'}}>
                            <FaMapMarkerAlt />
                          </div>
                          <div className="sk-cmn-sklcss-auth-stat-info">
                            <p className="sk-cmn-sklcss-auth-stat-title">Non-Pasig Residents</p>
                            <p className="sk-cmn-sklcss-auth-stat-value">{youth_stats_metrics.nonPasigResidents}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="row">
                <div className="col-md-12 mb-4">
                  <div className="sk-cmn-sklcss-auth-stats-card">
                    <div className="sk-cmn-sklcss-auth-stats-header">
                      <FaExclamationTriangle className="me-2" /> SK Eligibility Concerns
                    </div>
                    <div className="sk-cmn-sklcss-auth-stats-body">
                      <div className="sk-cmn-sklcss-auth-stat-item">
                        <div className="sk-cmn-sklcss-auth-stat-icon" style={{backgroundColor: '#fee2e2', color: '#ef4444'}}>
                          <FaCalendarAlt />
                        </div>
                        <div className="sk-cmn-sklcss-auth-stat-info">
                          <p className="sk-cmn-sklcss-auth-stat-title">Expired Terms</p>
                          <p className="sk-cmn-sklcss-auth-stat-value">{stats.expired_terms}</p>
                          <p className="sk-cmn-sklcss-auth-stat-subtitle">
                            Users with expired terms that need renewal
                          </p>
                        </div>
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-stat-item">
                        <div className="sk-cmn-sklcss-auth-stat-icon" style={{backgroundColor: '#ffedd5', color: '#f97316'}}>
                          <FaCalendarCheck />
                        </div>
                        <div className="sk-cmn-sklcss-auth-stat-info">
                          <p className="sk-cmn-sklcss-auth-stat-title">Expiring Soon</p>
                          <p className="sk-cmn-sklcss-auth-stat-value">{stats.nearing_expiration}</p>
                          <p className="sk-cmn-sklcss-auth-stat-subtitle">
                            Terms expiring within the next 30 days
                          </p>
                        </div>
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-stat-item">
                        <div className="sk-cmn-sklcss-auth-stat-icon" style={{backgroundColor: '#f3e8ff', color: '#8b5cf6'}}>
                          <FaUserClock />
                        </div>
                        <div className="sk-cmn-sklcss-auth-stat-info">
                          <p className="sk-cmn-sklcss-auth-stat-title">Over Age</p>
                          <p className="sk-cmn-sklcss-auth-stat-value">{stats.over_age}</p>
                          <p className="sk-cmn-sklcss-auth-stat-subtitle">
                            Users who are 25 years or older (exceeded eligibility)
                          </p>
                        </div>
                      </div>
                      
                      <div className="sk-cmn-sklcss-auth-stat-item">
                        <div className="sk-cmn-sklcss-auth-stat-icon" style={{backgroundColor: '#dbeafe', color: '#3b82f6'}}>
                          <FaBirthdayCake />
                        </div>
                        <div className="sk-cmn-sklcss-auth-stat-info">
                          <p className="sk-cmn-sklcss-auth-stat-title">Nearing Max Age</p>
                          <p className="sk-cmn-sklcss-auth-stat-value">{stats.nearing_max_age}</p>
                          <p className="sk-cmn-sklcss-auth-stat-subtitle">
                            Users who are 24 years old (approaching age limit)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {skUser?.sk_role === 'Federasyon' || skUser?.sk_role === 'Admin' ? (
                <div className="row">
                  <div className="col-md-12 mb-4">
                    <div className="sk-cmn-sklcss-auth-stats-card">
                      <div className="sk-cmn-sklcss-auth-stats-header">
                        <FaBuilding className="me-2" /> Users by Barangay
                      </div>
                      <div className="sk-cmn-sklcss-auth-stats-body">
                        <div className="sk-cmn-sklcss-auth-barangay-stats">
                          {Object.entries(stats_metrics.barangayCounts)
                            .filter(([_, count]) => count > 0)
                            .sort(([_, countA], [__, countB]) => countB - countA)
                            .map(([barangay, count]) => (
                              <div key={barangay} className="sk-cmn-sklcss-auth-barangay-stat">
                                <span className="sk-cmn-sklcss-auth-barangay-name">{barangay}</span>
                                <span className="sk-cmn-sklcss-auth-barangay-count">{count}</span>
                                <div className="sk-cmn-sklcss-auth-barangay-progress">
                                  <div 
                                    className="sk-cmn-sklcss-auth-barangay-progress-bar" 
                                    style={{ 
                                      width: `${Math.min(100, (count / Math.max(...Object.values(stats_metrics.barangayCounts), 1)) * 100)}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              
              {/* Youth Statistics by Barangay */}
              {youth_stats_metrics && youth_stats_metrics.barangayCounts && Object.keys(youth_stats_metrics.barangayCounts).length > 0 && (
                <div className="row">
                  <div className="col-md-12 mb-4">
                    <div className="sk-cmn-sklcss-auth-stats-card">
                      <div className="sk-cmn-sklcss-auth-stats-header">
                        <FaBuilding className="me-2" /> Youth Users by Barangay
                      </div>
                      <div className="sk-cmn-sklcss-auth-stats-body">
                        <div className="sk-cmn-sklcss-auth-barangay-stats">
                          {Object.entries(youth_stats_metrics.barangayCounts)
                            .filter(([_, count]) => count > 0)
                            .sort(([_, countA], [__, countB]) => countB - countA)
                            .map(([barangay, count]) => (
                              <div key={barangay} className="sk-cmn-sklcss-auth-barangay-stat">
                                <span className="sk-cmn-sklcss-auth-barangay-name">{barangay}</span>
                                <span className="sk-cmn-sklcss-auth-barangay-count">{count}</span>
                                <div className="sk-cmn-sklcss-auth-barangay-progress">
                                  <div 
                                    className="sk-cmn-sklcss-auth-barangay-progress-bar" 
                                    style={{ 
                                      width: `${Math.min(100, (count / Math.max(...Object.values(youth_stats_metrics.barangayCounts), 1)) * 100)}%`,
                                      backgroundColor: '#3b82f6'
                                    }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="row">
                <div className="col-md-6 mb-4">
                  <div className="sk-cmn-sklcss-auth-stats-card">
                    <div className="sk-cmn-sklcss-auth-stats-header">
                      <FaCalendarAlt className="me-2" /> Terms Expiring Soon
                    </div>
                    <div className="sk-cmn-sklcss-auth-stats-body">
                      {stats_metrics.expiringTerms?.length > 0 ? (
                        <div className="sk-cmn-sklcss-auth-recent-list">
                          {stats_metrics.expiringTerms.map(user => (
                            <div key={user.id} className="sk-cmn-sklcss-auth-recent-item">
                              <div className="sk-cmn-sklcss-auth-recent-avatar">
                                <FaUser />
                              </div>
                              <div className="sk-cmn-sklcss-auth-recent-info">
                                <h4 className="sk-cmn-sklcss-auth-recent-name">
                                  {user.first_name} {user.last_name}
                                </h4>
                                <div className="sk-cmn-sklcss-auth-recent-meta">
                                  <span className="sk-cmn-sklcss-auth-recent-role">{user.sk_role}</span>
                                  <span className="sk-cmn-sklcss-auth-recent-time"
                                       style={{color: '#f97316'}}>
                                    <FaCalendarCheck /> 
                                    Expires {formatDate(user.term_end)} ({getDaysRemaining(user.term_end)} days left)
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="sk-cmn-sklcss-auth-stats-empty">No terms expiring soon</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6 mb-4">
                  <div className="sk-cmn-sklcss-auth-stats-card">
                    <div className="sk-cmn-sklcss-auth-stats-header">
                      <FaBan className="me-2" /> Eligibility Issues
                    </div>
                    <div className="sk-cmn-sklcss-auth-stats-body">
                      {stats_metrics.eligibilityIssues?.length > 0 ? (
                        <div className="sk-cmn-sklcss-auth-recent-list">
                          {stats_metrics.eligibilityIssues.map(user => (
                            <div key={user.id} className="sk-cmn-sklcss-auth-recent-item">
                              <div className="sk-cmn-sklcss-auth-recent-avatar">
                                <FaUser />
                              </div>
                              <div className="sk-cmn-sklcss-auth-recent-info">
                                <h4 className="sk-cmn-sklcss-auth-recent-name">
                                  {user.first_name} {user.last_name}
                                </h4>
                                <div className="sk-cmn-sklcss-auth-recent-meta">
                                  <span className="sk-cmn-sklcss-auth-recent-role">{user.sk_role}</span>
                                  <span className="sk-cmn-sklcss-auth-recent-time"
                                       style={{color: user.over_age ? '#8b5cf6' : (user.term_expired ? '#ef4444' : '#f97316')}}>
                                    {user.over_age ? (
                                      <><FaUserClock /> Age: {user.age} (Over Limit)</>
                                    ) : user.term_expired ? (
                                      <><FaCalendarAlt /> Term Expired: {formatDate(user.term_end)}</>
                                    ) : user.terms_served >= 3 ? (
                                      <><FaCertificate /> Max Terms Reached: {user.terms_served}/3</>
                                    ) : null}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="sk-cmn-sklcss-auth-stats-empty">No eligibility issues found</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-12">
                  <div className="sk-cmn-sklcss-auth-stats-card">
                    <div className="sk-cmn-sklcss-auth-stats-header">
                      <FaInfoCircle className="me-2" /> Authentication & Guidelines
                    </div>
                    <div className="sk-cmn-sklcss-auth-stats-body">
                      <div className="sk-cmn-sklcss-auth-guidelines">
                        <div className="sk-cmn-sklcss-auth-guideline">
                          <div className="sk-cmn-sklcss-auth-guideline-icon">
                            <FaIdCard />
                          </div>
                          <div className="sk-cmn-sklcss-auth-guideline-content">
                            <h4>Verify Documents</h4>
                            <p>Always check that the oath document or proof of address provided is valid and matches the user's profile information.</p>
                          </div>
                        </div>
                        
                        <div className="sk-cmn-sklcss-auth-guideline">
                          <div className="sk-cmn-sklcss-auth-guideline-icon">
                            <FaUserClock />
                          </div>
                          <div className="sk-cmn-sklcss-auth-guideline-content">
                            <h4>Age Eligibility</h4>
                            <p>SK members must be between 15-24 years old. Members who reach 25 years become ineligible.</p>
                          </div>
                        </div>
                        
                        <div className="sk-cmn-sklcss-auth-guideline">
                          <div className="sk-cmn-sklcss-auth-guideline-icon">
                            <FaSync />
                          </div>
                          <div className="sk-cmn-sklcss-auth-guideline-content">
                            <h4>Term Limits</h4>
                            <p>Maximum of 3 consecutive terms allowed. Each term can last up to 3 years.</p>
                          </div>
                        </div>
                        
                        <div className="sk-cmn-sklcss-auth-guideline">
                          <div className="sk-cmn-sklcss-auth-guideline-icon">
                            <FaRedo />
                          </div>
                          <div className="sk-cmn-sklcss-auth-guideline-content">
                            <h4>Residency Check</h4>
                            <p>Confirm youth residency by verifying their proof of address. Non-Pasig residents may be authenticated for specific programs.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          
          {activeTab === 'logs' && (
            <div className="sk-cmn-sklcss-auth-logs-container">
              <div className="sk-cmn-sklcss-auth-logs-header">
                <h3>Authentication Activity Logs</h3>
                <div className="sk-cmn-sklcss-auth-logs-per-page">
                  <label>Rows per page:</label>
                  <select 
                    value={logsPerPage} 
                    onChange={(e) => setLogsPerPage(Number(e.target.value))}
                    className="form-control form-control-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              
              {authLogs.length === 0 ? (
                <div className="sk-cmn-sklcss-auth-logs-empty">
                  <p>No authentication logs found.</p>
                </div>
              ) : (
                <div className="sk-cmn-sklcss-auth-logs-timeline">
                  {authLogs.map((log) => {
                    let parsedDetails = null;
                    // Try to parse details if it's a JSON string (for bulk operations)
                    if (log.log_type.includes('bulk_') && log.details) {
                      try {
                        parsedDetails = JSON.parse(log.details);
                      } catch (e) {
                        // If parsing fails, use the raw details
                        parsedDetails = null;
                      }
                    }
                    
                    return (
                      <div className={`sk-cmn-sklcss-auth-log-item ${log.log_type}`} key={log.id}>
                        <div className="sk-cmn-sklcss-auth-log-icon">
                          {log.log_type === 'authentication' && <FaUserCheck />}
                          {log.log_type === 'deauthentication' && <FaUserTimes />}
                          {log.log_type === 'bulk_authentication' && <FaUserCheck />}
                          {log.log_type === 'bulk_deauthentication' && <FaUserTimes />}
                          {log.log_type === 'note' && <FaStickyNote />}
                        </div>
                        <div className="sk-cmn-sklcss-auth-log-content">
                          <div className="sk-cmn-sklcss-auth-log-header">
                            <span className="sk-cmn-sklcss-auth-log-user">
                              {log.authenticator?.first_name} {log.authenticator?.last_name}
                            </span>
                            <span className="sk-cmn-sklcss-auth-log-action">{log.action}</span>
                            {!log.log_type.includes('bulk_') && log.user && (
                              <span className="sk-cmn-sklcss-auth-log-target">
                                {log.user?.first_name} {log.user?.last_name}
                              </span>
                            )}
                          </div>
                          
                          {/* Handle bulk operation details */}
                          {parsedDetails ? (
                            <div className="sk-cmn-sklcss-auth-log-details">
                              <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                                Summary: {parsedDetails.processed_count} processed, {parsedDetails.skipped_count} skipped
                                {parsedDetails.ineligible_count ? `, ${parsedDetails.ineligible_count} ineligible` : ''}
                              </div>
                              
                              {parsedDetails.reason && (
                                <div style={{ marginBottom: '10px' }}>
                                  <strong>Reason:</strong> {parsedDetails.reason}
                                </div>
                              )}
                              
                              {/* Show some of the processed users */}
                              {parsedDetails.user_ids && parsedDetails.user_ids.length > 0 && (
                                <div style={{ marginBottom: '10px' }}>
                                  <details>
                                    <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                                      View affected users ({parsedDetails.user_ids.length})
                                    </summary>
                                    <div style={{ marginTop: '5px', fontSize: '0.9em', color: '#666' }}>
                                      User IDs: {parsedDetails.user_ids.join(', ')}
                                    </div>
                                  </details>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Handle regular log details */
                            log.details && (
                              <div className="sk-cmn-sklcss-auth-log-details">
                                {/* Format the details nicely if it contains line breaks */}
                                {log.details.includes('\n') ? (
                                  <div style={{ whiteSpace: 'pre-line', fontSize: '0.9em' }}>
                                    {log.details}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.9em' }}>
                                    {log.details}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                          
                          <div className="sk-cmn-sklcss-auth-log-timestamp">
                            <FaCalendarAlt className="me-1" />
                            {formatDate(log.created_at)} at {formatTime(log.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="sk-cmn-sklcss-auth-logs-pagination">
                <button 
                  className="btn btn-outline-secondary btn-sm" 
                  onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                  disabled={logsPage === 1}
                >
                  Previous
                </button>
                <span className="sk-cmn-sklcss-auth-logs-page-info">
                  Page {logsPage} of {Math.ceil(logsTotal / logsPerPage) || 1}
                </span>
                <button 
                  className="btn btn-outline-secondary btn-sm" 
                  onClick={() => setLogsPage(p => p + 1)}
                  disabled={logsPage >= Math.ceil(logsTotal / logsPerPage)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - display only in statistics tab */}
        {activeTab === 'statistics' && (
          <div className="sk-cmn-sklcss-auth-sidebar">
            {/* SK Summary card */}
            <div className="sk-cmn-sklcss-auth-stats-card">
              <div className="sk-cmn-sklcss-auth-stats-header">
                <FaUserShield className="me-2" /> SK Authentication Status
              </div>
              <div className="sk-cmn-sklcss-auth-stats-body">
                <div className="sk-cmn-sklcss-auth-status-summary">
                  <div className="sk-cmn-sklcss-auth-status-chart">
                    <div className="sk-cmn-sklcss-auth-status-chart-container">
                      <div 
                        className="sk-cmn-sklcss-auth-status-progress" 
                        style={{ 
                          '--progress': `${stats.authenticated / (stats.authenticated + stats.pending || 1) * 100}%` 
                        }}
                      ></div>
                      <div className="sk-cmn-sklcss-auth-status-label">
                        {Math.round(stats.authenticated / (stats.authenticated + stats.pending || 1) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="sk-cmn-sklcss-auth-status-legend">
                    <div className="sk-cmn-sklcss-auth-status-legend-item authenticated">
                      <span className="sk-cmn-sklcss-auth-status-legend-color"></span>
                      <span className="sk-cmn-sklcss-auth-status-legend-label">Authenticated</span>
                      <span className="sk-cmn-sklcss-auth-status-legend-value">{stats.authenticated}</span>
                    </div>
                    <div className="sk-cmn-sklcss-auth-status-legend-item pending">
                      <span className="sk-cmn-sklcss-auth-status-legend-color"></span>
                      <span className="sk-cmn-sklcss-auth-status-legend-label">Not Authenticated</span>
                      <span className="sk-cmn-sklcss-auth-status-legend-value">{stats.pending}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Youth Summary card */}
            {youth_stats_metrics && Object.keys(youth_stats_metrics).length > 0 && (
              <div className="sk-cmn-sklcss-auth-stats-card mt-4">
                <div className="sk-cmn-sklcss-auth-stats-header">
                  <FaUser className="me-2" /> Youth Authentication Status
                </div>
                <div className="sk-cmn-sklcss-auth-stats-body">
                  <div className="sk-cmn-sklcss-auth-status-summary">
                    <div className="sk-cmn-sklcss-auth-status-chart">
                      <div className="sk-cmn-sklcss-auth-status-chart-container">
                        <div 
                          className="sk-cmn-sklcss-auth-status-progress" 
                          style={{ 
                            '--progress': `${youth_stats_metrics.authenticatedYouth / (youth_stats_metrics.authenticatedYouth + youth_stats_metrics.unauthenticatedYouth || 1) * 100}%`,
                            backgroundColor: '#22c55e'
                          }}
                        ></div>
                        <div className="sk-cmn-sklcss-auth-status-label">
                          {Math.round(youth_stats_metrics.authenticatedYouth / (youth_stats_metrics.authenticatedYouth + youth_stats_metrics.unauthenticatedYouth || 1) * 100)}%
                        </div>
                      </div>
                    </div>
                    <div className="sk-cmn-sklcss-auth-status-legend">
                      <div className="sk-cmn-sklcss-auth-status-legend-item authenticated">
                        <span className="sk-cmn-sklcss-auth-status-legend-color" style={{backgroundColor: '#22c55e'}}></span>
                        <span className="sk-cmn-sklcss-auth-status-legend-label">Authenticated</span>
                        <span className="sk-cmn-sklcss-auth-status-legend-value">{youth_stats_metrics.authenticatedYouth}</span>
                      </div>
                      <div className="sk-cmn-sklcss-auth-status-legend-item pending">
                        <span className="sk-cmn-sklcss-auth-status-legend-color" style={{backgroundColor: '#ef4444'}}></span>
                        <span className="sk-cmn-sklcss-auth-status-legend-label">Not Authenticated</span>
                        <span className="sk-cmn-sklcss-auth-status-legend-value">{youth_stats_metrics.unauthenticatedYouth}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Quick action buttons */}
            <div className="sk-cmn-sklcss-auth-quick-actions">
              <button 
                className="sk-cmn-sklcss-auth-quick-action-btn"
                onClick={() => {
                  setActiveTab('users');
                  setCurrentView('pending');
                  setSearchQuery('');
                  setSelectedBarangay('All');
                  setSelectedRole('All');
                  setSelectedTermStatus('All');
                  setSelectedAgeStatus('All');
                }}
              >
                <FaUserTimes className="sk-cmn-sklcss-auth-quick-action-icon" />
                <div className="sk-cmn-sklcss-auth-quick-action-text">
                  <span className="sk-cmn-sklcss-auth-quick-action-title">SK Not Authenticated</span>
                  <span className="sk-cmn-sklcss-auth-quick-action-count">{stats.pending} users</span>
                </div>
              </button>
              
              <button 
                className="sk-cmn-sklcss-auth-quick-action-btn"
                onClick={() => {
                  setActiveTab('users');
                  setCurrentView('authenticated');
                  setSearchQuery('');
                  setSelectedBarangay('All');
                  setSelectedRole('All');
                  setSelectedTermStatus('All');
                  setSelectedAgeStatus('All');
                }}
              >
                <FaUserCheck className="sk-cmn-sklcss-auth-quick-action-icon" />
                <div className="sk-cmn-sklcss-auth-quick-action-text">
                  <span className="sk-cmn-sklcss-auth-quick-action-title">SK Authenticated</span>
                  <span className="sk-cmn-sklcss-auth-quick-action-count">{stats.authenticated} users</span>
                </div>
              </button>
              
              <button 
                className="sk-cmn-sklcss-auth-quick-action-btn"
                onClick={() => {
                  setActiveTab('youthUsers');
                  setYouthSearchQuery('');
                  setSelectedYouthBarangay('All');
                  setSelectedYouthResidency('not_authenticated');
                }}
              >
                <FaUser className="sk-cmn-sklcss-auth-quick-action-icon" style={{color: '#ef4444'}} />
                <div className="sk-cmn-sklcss-auth-quick-action-text">
                  <span className="sk-cmn-sklcss-auth-quick-action-title">Youth Not Authenticated</span>
                  <span className="sk-cmn-sklcss-auth-quick-action-count">
                    {youth_stats_metrics?.unauthenticatedYouth || 0} users
                  </span>
                </div>
              </button>
              
              <button 
                className="sk-cmn-sklcss-auth-quick-action-btn"
                onClick={() => setActiveTab('logs')}
              >
                <FaHistory className="sk-cmn-sklcss-auth-quick-action-icon" />
                <div className="sk-cmn-sklcss-auth-quick-action-text">
                  <span className="sk-cmn-sklcss-auth-quick-action-title">View Logs</span>
                  <span className="sk-cmn-sklcss-auth-quick-action-count">Activity history</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseUserDetail}>
          <div className="modal-container user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Profile: {selectedUser.first_name} {selectedUser.last_name}</h3>
              <button className="close-modal-btn" onClick={handleCloseUserDetail}>×</button>
            </div>
            <div className="modal-body user-detail-body">
              {/* Different details for SK vs Youth users */}
              {activeTab === 'users' ? (
                <div className="row">
                  <div className="col-md-6">
                    <div className="user-detail-section">
                      <h4 className="user-detail-heading">
                        <FaUser className="me-2" />
                        Personal Information
                      </h4>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Full Name:</span>
                        <span className="user-detail-value">{selectedUser.first_name} {selectedUser.middle_name ? selectedUser.middle_name + ' ' : ''}{selectedUser.last_name}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Gender:</span>
                        <span className="user-detail-value">{selectedUser.gender}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Date of Birth:</span>
                        <span className="user-detail-value">{formatDate(selectedUser.birthdate)}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Age:</span>
                        <span className="user-detail-value" style={{color: selectedUser.over_age ? '#8b5cf6' : 'inherit'}}>
                          {selectedUser.age}
                          {selectedUser.over_age && ' (Over Age Limit)'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="user-detail-section">
                      <h4 className="user-detail-heading">
                        <FaUserShield className="me-2" />
                        SK Information
                      </h4>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Barangay:</span>
                        <span className="user-detail-value">{selectedUser.sk_station}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Role:</span>
                        <span className="user-detail-value">{selectedUser.sk_role}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Authentication Status:</span>
                        <span className={`user-detail-value ${selectedUser.authentication_status === 'active' ? 'text-success' : 'text-danger'}`}>
                          {selectedUser.authentication_status === 'active' ? 'Authenticated' : 'Not Authenticated'}
                        </span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Terms Served:</span>
                        <span className="user-detail-value">
                          {selectedUser.terms_served} of 3
                          {selectedUser.terms_served >= 3 && ' (Max Terms Reached)'}
                        </span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Current Term:</span>
                        <span className="user-detail-value" style={{color: selectedUser.term_expired ? '#ef4444' : (getDaysRemaining(selectedUser.term_end) <= 30 ? '#f97316' : 'inherit')}}>
                          {formatDate(selectedUser.term_start)} - {formatDate(selectedUser.term_end)}
                          {selectedUser.term_expired ? ' (Expired)' : (getDaysRemaining(selectedUser.term_end) <= 30 ? ` (${getDaysRemaining(selectedUser.term_end)} days left)` : '')}
                        </span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Registered On:</span>
                        <span className="user-detail-value">{formatDate(selectedUser.created_at)}</span>
                      </div>
                      {selectedUser.authenticated_at && (
                        <div className="user-detail-item">
                          <span className="user-detail-label">Authenticated On:</span>
                          <span className="user-detail-value">{formatDate(selectedUser.authenticated_at)}</span>
                        </div>
                      )}
                      {selectedUser.updated_at && (
                        <div className="user-detail-item">
                          <span className="user-detail-label">Last Updated:</span>
                          <span className="user-detail-value">{formatDate(selectedUser.updated_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-md-6 mt-3">
                    <div className="user-detail-section">
                      <h4 className="user-detail-heading">
                        <FaEnvelope className="me-2" />
                        Contact Information
                      </h4>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Email:</span>
                        <span className="user-detail-value">{selectedUser.email}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Phone:</span>
                        <span className="user-detail-value">{selectedUser.phone_number}</span>
                      </div>
                    </div>
                    
                    <div className="user-detail-section mt-3">
                      <h4 className="user-detail-heading">
                        <FaMapMarkerAlt className="me-2" />
                        Address Information
                      </h4>
                      <div className="user-detail-item">
                        <span className="user-detail-label">House Number:</span>
                        <span className="user-detail-value">{selectedUser.house_number || 'N/A'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Street:</span>
                        <span className="user-detail-value">{selectedUser.street || 'N/A'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Subdivision:</span>
                        <span className="user-detail-value">{selectedUser.subdivision || 'N/A'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Barangay:</span>
                        <span className="user-detail-value">{selectedUser.sk_station}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">City:</span>
                        <span className="user-detail-value">{selectedUser.city || 'Pasig'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Province:</span>
                        <span className="user-detail-value">{selectedUser.province || 'Metro Manila'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mt-3">
                    <div className="user-detail-section">
                      <h4 className="user-detail-heading">
                        <FaIdCard className="me-2" />
                        Oath Document
                      </h4>
                      {selectedUser.valid_id ? (
                        <div className="id-preview">
                          <button 
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleViewID(selectedUser)}
                          >
                            <FaEye className="me-1" /> View Oath Document ({selectedUser.valid_id_extension?.toUpperCase()})
                          </button>
                        </div>
                      ) : (
                        <div className="no-id-message">
                          No oath document uploaded.
                        </div>
                      )}
                    </div>
                    
                    <div className="user-detail-section mt-3">
                      <h4 className="user-detail-heading">
                        <FaStickyNote className="me-2" />
                        Admin Notes
                      </h4>
                      <div className="notes-input-area">
                        <textarea
                          className="form-control notes-textarea"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add a note about this user..."
                        ></textarea>
                        <button 
                          className="btn btn-primary"
                          onClick={handleAddNote}
                          disabled={!newNote.trim()}
                        >
                          Add Note
                        </button>
                      </div>
                      
                      <div className="notes-list">
                        {userNotes.length > 0 ? (
                          userNotes.map((note, index) => (
                            <div className="note-item" key={note.id || index}>
                              <div className="note-header">
                                <span className="note-author">
                                  {note.authenticator?.first_name} {note.authenticator?.last_name}
                                </span>
                                <span className="note-date">
                                  {formatDate(note.created_at)} at {formatTime(note.created_at)}
                                </span>
                              </div>
                              <div className="note-content">
                                {note.details}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-notes-message">
                            No notes have been added yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Youth User Detail
                <div className="row">
                  <div className="col-md-6">
                    <div className="user-detail-section">
                      <h4 className="user-detail-heading">
                        <FaUser className="me-2" />
                        Personal Information
                      </h4>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Full Name:</span>
                        <span className="user-detail-value">{selectedUser.first_name} {selectedUser.middle_name ? selectedUser.middle_name + ' ' : ''}{selectedUser.last_name}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Gender:</span>
                        <span className="user-detail-value">{selectedUser.gender}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Date of Birth:</span>
                        <span className="user-detail-value">{formatDate(selectedUser.dob)}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Age:</span>
                        <span className="user-detail-value">
                          {selectedUser.age}
                        </span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Registered On:</span>
                        <span className="user-detail-value">{formatDate(selectedUser.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="user-detail-section mt-3">
                      <h4 className="user-detail-heading">
                        <FaAddressCard className="me-2" />
                        Authentication Status
                      </h4>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Residency:</span>
                        <span className="user-detail-value" style={{color: selectedUser.is_pasig_resident ? '#3b82f6' : '#8b5cf6'}}>
                          {selectedUser.is_pasig_resident ? 'Pasig Resident' : 'Non-Pasig Resident'}
                        </span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Authentication:</span>
                        <span className="user-detail-value" style={{color: selectedUser.is_authenticated ? '#22c55e' : '#ef4444'}}>
                          {selectedUser.is_authenticated ? 'Authenticated' : 'Not Authenticated'}
                        </span>
                      </div>
                      {selectedUser.updated_at && (
                        <div className="user-detail-item">
                          <span className="user-detail-label">Last Updated:</span>
                          <span className="user-detail-value">{formatDate(selectedUser.updated_at)}</span>
                        </div>
                      )}
                      <div className="user-detail-item">
                        <span className="user-detail-label">Verification Status:</span>
                        <span className="user-detail-value">
                          {selectedUser.verification_status === 'verified' ? 'Email Verified' : 'Email Not Verified'}
                        </span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Profile Status:</span>
                        <span className="user-detail-value">
                          {selectedUser.profile_status === 'profiled' ? 'Profiled' : 'Not Profiled'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="user-detail-section">
                      <h4 className="user-detail-heading">
                        <FaEnvelope className="me-2" />
                        Contact Information
                      </h4>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Email:</span>
                        <span className="user-detail-value">{selectedUser.email}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Phone:</span>
                        <span className="user-detail-value">{selectedUser.phone_number}</span>
                      </div>
                    </div>
                    
                    <div className="user-detail-section mt-3">
                      <h4 className="user-detail-heading">
                        <FaMapMarkerAlt className="me-2" />
                        Address Information
                      </h4>
                      <div className="user-detail-item">
                        <span className="user-detail-label">House Number:</span>
                        <span className="user-detail-value">{selectedUser.house_number || 'N/A'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Street:</span>
                        <span className="user-detail-value">{selectedUser.street || 'N/A'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Subdivision:</span>
                        <span className="user-detail-value">{selectedUser.subdivision || 'N/A'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Barangay:</span>
                        <span className="user-detail-value">{selectedUser.baranggay}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">City:</span>
                        <span className="user-detail-value">{selectedUser.city || 'Pasig'}</span>
                      </div>
                      <div className="user-detail-item">
                        <span className="user-detail-label">Province:</span>
                        <span className="user-detail-value">{selectedUser.province || 'Metro Manila'}</span>
                      </div>
                    </div>
                    
                    <div className="user-detail-section mt-3">
                      <h4 className="user-detail-heading">
                        <FaIdCard className="me-2" />
                        Proof of Address
                      </h4>
                      {selectedUser.proof_of_address ? (
                        <div className="id-preview">
                          <button 
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleViewID(selectedUser)}
                          >
                            <FaEye className="me-1" /> View Proof of Address
                          </button>
                        </div>
                      ) : (
                        <div className="no-id-message">
                          {selectedUser.is_pasig_resident ? 
                           'No proof of address required for Pasig residents.' : 
                           'No proof of address uploaded.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer user-detail-footer">
              {activeTab === 'users' ? (
                <>
                  {/* Term Renewal Button */}
                  {selectedUser.term_expired && selectedUser.terms_served < 3 && (
                    <button 
                      className="btn btn-primary me-2"
                      onClick={() => handleRenewTerm(selectedUser)}
                    >
                      <FaSync className="me-1" /> Renew Term
                    </button>
                  )}
                  
                  {/* Authentication Buttons */}
                  {selectedUser.authentication_status === 'not_active' ? (
                    <button 
                      className="btn btn-success me-2"
                      onClick={() => {
                        handleAuthenticate(selectedUser.id);
                        handleCloseUserDetail();
                      }}
                      disabled={selectedUser.term_expired || selectedUser.over_age}
                    >
                      <FaUnlock className="me-1" /> Authenticate User
                    </button>
                  ) : (
                    <button 
                      className="btn btn-danger me-2"
                      onClick={() => {
                        handleDeauthenticate(selectedUser.id);
                        handleCloseUserDetail();
                      }}
                    >
                      <FaLock className="me-1" /> De-authenticate User
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* Youth Residency Button */}
                  {!selectedUser.is_pasig_resident ? (
                    <button 
                      className="btn btn-primary me-2"
                      onClick={() => {
                        handleUpdateResidency(selectedUser.id, true);
                        handleCloseUserDetail();
                      }}
                    >
                      <FaHome className="me-1" /> Confirm as Pasig Resident
                    </button>
                  ) : (
                    <button 
                      className="btn btn-secondary me-2"
                      onClick={() => {
                        handleUpdateResidency(selectedUser.id, false);
                        handleCloseUserDetail();
                      }}
                    >
                      <FaMapMarkerAlt className="me-1" /> Mark as Non-Pasig Resident
                    </button>
                  )}
                  
                  {/* Youth Authentication Buttons */}
                  {!selectedUser.is_authenticated ? (
                    <button 
                      className="btn btn-success me-2"
                      onClick={() => {
                        handleAuthenticateYouth(selectedUser.id);
                        handleCloseUserDetail();
                      }}
                    >
                      <FaUnlock className="me-1" /> Authenticate User
                    </button>
                  ) : (
                    <button 
                      className="btn btn-danger me-2"
                      onClick={() => {
                        handleDeauthenticateYouth(selectedUser.id);
                        handleCloseUserDetail();
                      }}
                    >
                      <FaLock className="me-1" /> De-authenticate User
                    </button>
                  )}
                </>
              )}
              
              <button 
                className="btn btn-secondary"
                onClick={handleCloseUserDetail}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ID Preview Modal */}
      {showImagePreview && (
        <div className="modal-overlay" onClick={() => setShowImagePreview(false)}>
          <div className="modal-container id-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Document: {previewData.name}</h3>
              <button className="close-modal-btn" onClick={() => setShowImagePreview(false)}>×</button>
            </div>
            <div className="modal-body id-preview-body">
              {previewData.url ? (
                <div className="id-document-preview">
                  {previewData.type === 'image' ? (
                    <img 
                      src={previewData.url} 
                      alt={previewData.name} 
                      className="id-preview-image"
                      onError={(e) => {
                        console.error('Image failed to load:', e);
                        e.target.src = '/images/id-placeholder.png'; // Fallback image
                        e.target.onerror = null; // Prevent infinite loop
                      }}
                    />
                  ) : previewData.type === 'pdf' ? (
                    <iframe
                      src={previewData.url}
                      title={previewData.name}
                      className="id-preview-pdf"
                      width="100%"
                      height="100%"
                      onError={(e) => {
                        console.error('PDF failed to load:', e);
                      }}
                    />
                  ) : (
                    <div className="id-not-available">
                      <p>Unsupported file type</p>
                      <p>Click download to save the file and view it locally.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="id-not-available">
                  <p>Document not available or could not be loaded.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {previewData.url && (
                <>
                  <a 
                    href={previewData.url} 
                    className="btn btn-info me-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaExternalLinkAlt className="me-1" /> Open in New Tab
                  </a>
                  <a 
                    href={previewData.url} 
                    download
                    className="btn btn-success me-2"
                  >
                    <FaDownload className="me-1" /> Download
                  </a>
                </>
              )}
              <button 
                className="btn btn-secondary"
                onClick={() => setShowImagePreview(false)}
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

export default SkUserAuthentication;