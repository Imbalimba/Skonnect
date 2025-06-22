import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import moment from 'moment';
import { FaSearch, FaFilter, FaCalendarAlt } from 'react-icons/fa';
import '../css/AnnouncementActivityLogs.css';
import { AuthContext } from '../../Contexts/AuthContext';

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

const AnnouncementActivityLogs = () => {
  const { skUser } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    activityType: '',
    startDate: '',
    endDate: '',
    skAccount: '',
    barangay: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [skAccounts, setSkAccounts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  // Activity type options
  const activityTypes = [
    { value: '', label: 'All Activities' },
    { value: 'create', label: 'Create' },
    { value: 'edit', label: 'Edit' },
    { value: 'delete', label: 'Delete' },
    { value: 'archive', label: 'Archive' },
    { value: 'restore', label: 'Restore' }
  ];

  useEffect(() => {
    fetchActivityLogs();
    fetchSkAccounts();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching activity logs...'); // Debug log
      
      // Add pagination and barangay filter to the request
      const params = {
        page: currentPage,
        per_page: logsPerPage
      };
      if (skUser?.sk_role === 'Federasyon' && filters.barangay && filters.barangay !== 'all') {
        params.barangay = filters.barangay;
      }
      const response = await axios.get('/api/announcements/logs', { params });
      
      console.log('API Response:', response.data); // Debug log
      
      // Check if response is empty or invalid
      if (!response.data || !response.data.logs) {
        console.error('Invalid response from API:', response.data);
        setError('Received invalid response from server');
        setLogs([]);
        setFilteredLogs([]);
        return;
      }

      // Get logs from the paginated response
      const logsData = response.data.logs.data || [];
      const totalLogs = response.data.logs.total || 0;
      
      console.log('Logs data:', logsData); // Debug log
      
      // Format the logs to ensure proper data structure
      const formattedLogs = logsData.map(log => ({
        id: log.id,
        activity_type: log.activity_type,
        action: log.action,
        details: log.details,
        created_at: log.created_at,
        sk_account: {
          id: log.sk_account_id,
          first_name: log.sk_first_name || 'Unknown',
          last_name: log.sk_last_name || 'User',
          sk_role: log.sk_role || 'N/A'
        },
        announcement: {
          id: log.announcement_id,
          title: log.announcement_title || 'Deleted Announcement',
          barangay: log.announcement_barangay || 'N/A'
        }
      }));
      
      console.log('Formatted logs:', formattedLogs); // Debug log
      
      setLogs(formattedLogs);
      setFilteredLogs(formattedLogs);
      setTotalPages(Math.ceil(totalLogs / logsPerPage));
    } catch (error) {
      console.error('Error fetching activity logs:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError('Failed to fetch activity logs. Please try again.');
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkAccounts = async () => {
    try {
      const response = await axios.get('/api/sk-accounts');
      setSkAccounts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching SK accounts:', error);
      setSkAccounts([]); // fallback to empty array on error
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const clearFilters = () => {
    setFilters({
      activityType: '',
      startDate: '',
      endDate: '',
      skAccount: '',
      barangay: ''
    });
    setCurrentPage(1);
  };

  // Update the filteredLogs logic to be a useEffect
  useEffect(() => {
    const filtered = logs.filter(log => {
      // Search query filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (log.sk_account?.first_name?.toLowerCase() || '').includes(searchLower) ||
        (log.sk_account?.last_name?.toLowerCase() || '').includes(searchLower) ||
        (log.activity_type?.toLowerCase() || '').includes(searchLower) ||
        (log.action?.toLowerCase() || '').includes(searchLower) ||
        (log.announcement?.title?.toLowerCase() || '').includes(searchLower);

      // Activity type filter
      const matchesActivityType = 
        !filters.activityType || 
        log.activity_type === filters.activityType;

      // Date range filter
      const logDate = new Date(log.created_at);
      const matchesStartDate = 
        !filters.startDate || 
        new Date(logDate.toDateString()) >= new Date(filters.startDate);
      const matchesEndDate = 
        !filters.endDate || 
        new Date(logDate.toDateString()) <= new Date(filters.endDate);

      // SK account filter
      const matchesSkAccount = 
        !filters.skAccount || 
        log.sk_account?.id == filters.skAccount;

      // Barangay filter
      const matchesBarangay = 
        !filters.barangay || 
        log.announcement?.barangay === filters.barangay;

      return matchesSearch && matchesActivityType && matchesStartDate && matchesEndDate && matchesSkAccount && matchesBarangay;
    });

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [logs, searchQuery, filters]);

  // Update useEffect to refetch when page changes
  useEffect(() => {
    fetchActivityLogs();
  }, [currentPage]); // Add currentPage as dependency

  // Update pagination logic to use server-side pagination
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Remove client-side pagination since we're using server-side pagination
  const currentLogs = filteredLogs;

  const formatDate = (dateString) => {
    return moment(dateString).format('MMMM D, YYYY h:mm A');
  };

  const getActionIcon = (activityType) => {
    switch (activityType) {
      case 'create':
        return <span className="aal-action-icon create">+</span>;
      case 'edit':
        return <span className="aal-action-icon edit">✎</span>;
      case 'delete':
        return <span className="aal-action-icon delete">🗑</span>;
      case 'archive':
        return <span className="aal-action-icon archive">��</span>;
      case 'restore':
        return <span className="aal-action-icon restore">↻</span>;
      default:
        return <span className="aal-action-icon">•</span>;
    }
  };

  const renderDetails = (log) => {
    if (!log.details) return null;
    
    try {
      const details = JSON.parse(log.details);
      
      if (log.activity_type === 'edit') {
        return (
          <div className="aal-details-section">
            <h5>Changes:</h5>
            <ul>
              {Object.entries(details.changes || {}).map(([field, value]) => (
                <li key={field}>
                  <strong>{field}:</strong> {JSON.stringify(value)}
                </li>
              ))}
            </ul>
          </div>
        );
      }
      
      return (
        <div className="aal-details-section">
          {Object.entries(details).map(([key, value]) => (
            <p key={key}>
              <strong>{key}:</strong> {JSON.stringify(value)}
            </p>
          ))}
        </div>
      );
    } catch (e) {
      return <p className="aal-details-text">{log.details}</p>;
    }
  };

  return (
    <div className="aal-activity-logs-container">
      <div className="aal-logs-controls">
        <div className="aal-search-container">
          <FaSearch className="aal-search-icon" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="aal-search-input"
          />
        </div>

        <button 
          className={`aal-filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={toggleFilters}
        >
          <FaFilter /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="aal-filters-panel">
          <div className="aal-filter-row">
            <div className="aal-filter-group">
              <label>Activity Type</label>
              <select
                name="activityType"
                value={filters.activityType}
                onChange={handleFilterChange}
              >
                {activityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="aal-filter-group">
              <label>SK Account</label>
              <select
                name="skAccount"
                value={filters.skAccount}
                onChange={handleFilterChange}
              >
                <option value="">All Accounts</option>
                {(Array.isArray(skAccounts) ? skAccounts : []).map(account => (
                  <option key={account.id} value={account.id}>
                    {account.first_name} {account.last_name}
                  </option>
                ))}
              </select>
            </div>

            {skUser?.sk_role === 'Federasyon' && (
              <div className="aal-filter-group">
                <label>Barangay</label>
                <select
                  name="barangay"
                  value={filters.barangay}
                  onChange={handleFilterChange}
                >
                  {barangayOptions.map(barangay => (
                    <option key={barangay} value={barangay}>
                      {barangay === 'all' ? 'All Barangays' : barangay}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="aal-filter-row">
            <div className="aal-filter-group">
              <label>From Date</label>
              <div className="aal-date-input-container">
                <FaCalendarAlt className="aal-date-icon" />
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="aal-filter-group">
              <label>To Date</label>
              <div className="aal-date-input-container">
                <FaCalendarAlt className="aal-date-icon" />
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  min={filters.startDate}
                />
              </div>
            </div>

            <button 
              className="aal-clear-filters"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="aal-loading-message">Loading activity logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="aal-no-results">
          {logs.length === 0 ? 'No activity logs found in the system.' : 'No activity logs found matching your criteria.'}
        </div>
      ) : (
        <>
          <div className="aal-logs-table-container">
            <table className="aal-logs-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Activity Type</th>
                  <th>Announcement</th>
                  <th>Details</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map(log => (
                  <tr key={log.id}>
                    <td className="aal-action-cell">
                      {getActionIcon(log.activity_type)}
                      <span className="aal-action-text">{log.action}</span>
                    </td>
                    <td className="aal-user-cell">
                      {`${log.sk_account?.first_name || 'Unknown'} ${log.sk_account?.last_name || 'User'}`}
                      <div className="aal-user-role">
                        {log.sk_account?.sk_role || 'N/A'}
                      </div>
                    </td>
                    <td className="aal-type-cell">
                      <span className={`aal-type-badge ${log.activity_type}`}>
                        {log.activity_type}
                      </span>
                    </td>
                    <td className="aal-announcement-cell">
                      {log.announcement ? 
                        log.announcement.title : 
                        'Announcement Deleted'}
                    </td>
                    <td className="aal-details-cell">
                      {renderDetails(log)}
                    </td>
                    <td className="aal-date-cell">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="aal-pagination">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="aal-pagination-button"
            >
              Previous
            </button>
            
            <div className="aal-page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`aal-pagination-button ${currentPage === number ? 'active' : ''}`}
                >
                  {number}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="aal-pagination-button"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AnnouncementActivityLogs;