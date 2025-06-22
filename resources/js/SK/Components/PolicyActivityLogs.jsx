import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import moment from 'moment';
import { FaSearch, FaFilter, FaCalendarAlt } from 'react-icons/fa';
import '../css/PolicyActivityLogs.css';
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

const PolicyActivityLogs = () => {
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
    barangay: '',
    policyType: 'all'
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

  // Policy type options
  const policyTypes = [
    { value: 'all', label: 'All Policies' },
    { value: 'city', label: 'City Policies' },
    { value: 'barangay', label: 'Barangay Policies' }
  ];

  const allowedRoles = ['federasyon', 'chairman', 'kagawad'];
  const userRole = (skUser?.sk_role || '').trim().toLowerCase();

  useEffect(() => {
    if (userRole === 'chairman' || userRole === 'kagawad') {
      setFilters(prev => ({
        ...prev,
        policyType: 'barangay',
        barangay: skUser.sk_station
      }));
    }
  }, [skUser]);

  // Fetch logs when filters change
  useEffect(() => {
    fetchActivityLogs();
    fetchSkAccounts();
  }, [currentPage, filters.policyType, filters.barangay, filters.activityType, filters.startDate, filters.endDate, filters.skAccount]);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        per_page: logsPerPage,
        activity_type: filters.activityType || undefined,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        sk_account_id: filters.skAccount || undefined
      };

      // Add barangay filter for non-Federasyon users
      if (skUser?.sk_role !== 'Federasyon') {
        params.barangay = skUser?.sk_station;
      } else if (filters.barangay && filters.barangay !== 'all') {
        params.barangay = filters.barangay;
      }

      let response;
      
      // Handle different policy types
      if (filters.policyType === 'all') {
        // Fetch both types of logs
        const [cityLogs, barangayLogs] = await Promise.all([
          axios.get('/api/policies/logs', { params }),
          axios.get('/api/barangay-policies/logs', { params })
        ]);

        const combinedLogs = [
          ...(cityLogs.data.logs.data || []).map(log => ({ ...log, type: 'city' })),
          ...(barangayLogs.data.logs.data || []).map(log => ({ ...log, type: 'barangay' }))
        ];

        const totalLogs = (cityLogs.data.logs.total || 0) + (barangayLogs.data.logs.total || 0);
        
        setLogs(combinedLogs);
        setFilteredLogs(combinedLogs);
        setTotalPages(Math.ceil(totalLogs / logsPerPage));
      } else {
        // Fetch only the selected type of logs
        const endpoint = filters.policyType === 'city' ? '/api/policies/logs' : '/api/barangay-policies/logs';
        response = await axios.get(endpoint, { params });
        
        if (!response.data || !response.data.logs) {
          console.error('Invalid response from API:', response.data);
          setError('Received invalid response from server');
          setLogs([]);
          setFilteredLogs([]);
          return;
        }

        const logsData = response.data.logs.data || [];
        const totalLogs = response.data.logs.total || 0;
        
        setLogs(logsData.map(log => ({ ...log, type: filters.policyType })));
        setFilteredLogs(logsData.map(log => ({ ...log, type: filters.policyType })));
        setTotalPages(Math.ceil(totalLogs / logsPerPage));
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
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
      let accounts = Array.isArray(response.data) ? response.data : [];
      console.log('SK Accounts from API:', accounts);

      if (userRole === 'federasyon') {
        // Show all SK accounts (Federasyon, Chairman, Kagawad)
        // No filter needed
      } else {
        // Only show Chairman and Kagawad in the user's barangay
        accounts = accounts.filter(acc =>
          ['Chairman', 'Kagawad'].includes(acc.sk_role) &&
          acc.sk_station === skUser.sk_station
        );
      }

      setSkAccounts(accounts);
    } catch (error) {
      console.error('Error fetching SK accounts:', error);
      setSkAccounts([]);
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
      barangay: '',
      policyType: 'all'
    });
    setCurrentPage(1);
  };

  // Update the filteredLogs logic to be a useEffect
  useEffect(() => {
    const filtered = logs.filter(log => {
      // Search query filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (log.sk_first_name?.toLowerCase() || '').includes(searchLower) ||
        (log.sk_last_name?.toLowerCase() || '').includes(searchLower) ||
        (log.activity_type?.toLowerCase() || '').includes(searchLower) ||
        (log.policy_title?.toLowerCase() || '').includes(searchLower);

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
        log.sk_account_id == filters.skAccount;

      // Barangay filter
      const matchesBarangay = 
        !filters.barangay || 
        log.sk_account?.sk_station === filters.barangay;

      return matchesSearch && matchesActivityType && matchesStartDate && matchesEndDate && matchesSkAccount && matchesBarangay;
    });

    setFilteredLogs(filtered);
  }, [logs, searchQuery, filters]);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('MMMM D, YYYY h:mm A');
  };

  const getActionIcon = (activityType) => {
    switch (activityType) {
      case 'create':
        return <span className="pal-action-icon create">+</span>;
      case 'edit':
        return <span className="pal-action-icon edit">✎</span>;
      case 'delete':
        return <span className="pal-action-icon delete">🗑</span>;
      case 'archive':
        return <span className="pal-action-icon archive">📦</span>;
      case 'restore':
        return <span className="pal-action-icon restore">↻</span>;
      default:
        return <span className="pal-action-icon">•</span>;
    }
  };

  const renderDetails = (log) => {
    if (!log.details) return null;
    
    try {
      const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      
      if (log.activity_type === 'edit') {
        return (
          <div className="pal-details-section">
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
      
      if (log.activity_type === 'delete') {
        return (
          <div className="pal-details-section">
            <h5>Deleted Policy Details:</h5>
            <ul>
              <li><strong>Title:</strong> {details.title}</li>
              <li><strong>Category:</strong> {details.category}</li>
              <li><strong>Year:</strong> {details.year}</li>
              <li><strong>Description:</strong> {details.description}</li>
              {log.type === 'barangay' && <li><strong>Barangay:</strong> {details.barangay}</li>}
            </ul>
          </div>
        );
      }
      
      if (log.activity_type === 'archive') {
        return (
          <div className="pal-details-section">
            <h5>Archived Policy Details:</h5>
            <ul>
              <li><strong>Title:</strong> {details.title}</li>
              <li><strong>Category:</strong> {details.category || details.policy_category}</li>
              {log.type === 'barangay' && <li><strong>Barangay:</strong> {details.barangay}</li>}
              <li><strong>Archive Reason:</strong> {details.archive_reason || 'N/A'}</li>
            </ul>
          </div>
        );
      }
      
      return (
        <div className="pal-details-section">
          {Object.entries(details).map(([key, value]) => (
            <p key={key}>
              <strong>{key}:</strong> {JSON.stringify(value)}
            </p>
          ))}
        </div>
      );
    } catch (e) {
      return <p className="pal-details-text">{log.details}</p>;
    }
  };

  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="pal-access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to view activity logs.</p>
      </div>
    );
  }

  return (
    <div className="pal-activity-logs-container">
      <div className="pal-logs-controls">
        <div className="pal-search-container">
          <FaSearch className="pal-search-icon" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pal-search-input"
          />
        </div>
        <button 
          className={`pal-filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={toggleFilters}
        >
          <FaFilter /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="pal-filters-panel">
          <div className="pal-filter-row">
            <div className="pal-filter-group">
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

            {skUser.sk_role === 'Federasyon' && (
              <div className="pal-filter-group">
                <label>Policy Type</label>
                <select
                  name="policyType"
                  value={filters.policyType}
                  onChange={handleFilterChange}
                >
                  {policyTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="pal-filter-group">
              <label>SK Account</label>
              <select
                name="skAccount"
                value={filters.skAccount}
                onChange={handleFilterChange}
              >
                <option value="">All Accounts</option>
                {skAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.first_name} {account.last_name} ({account.sk_role})
                  </option>
                ))}
              </select>
            </div>

            {skUser.sk_role === 'Federasyon' && (
              <div className="pal-filter-group">
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

          <div className="pal-filter-row">
            <div className="pal-filter-group">
              <label>From Date</label>
              <div className="pal-date-input-container">
                <FaCalendarAlt className="pal-date-icon" />
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="pal-filter-group">
              <label>To Date</label>
              <div className="pal-date-input-container">
                <FaCalendarAlt className="pal-date-icon" />
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
              className="pal-clear-filters"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="pal-loading-message">Loading activity logs...</div>
      ) : error ? (
        <div className="pal-error-message">{error}</div>
      ) : filteredLogs.length === 0 ? (
        <div className="pal-no-results">
          {logs.length === 0 ? 'No activity logs found in the system.' : 'No activity logs found matching your criteria.'}
        </div>
      ) : (
        <>
          <div className="pal-logs-table-container">
            <table className="pal-logs-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Activity Type</th>
                  <th>Policy Type</th>
                  <th>Policy</th>
                  <th>Details</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td className="pal-action-cell">
                      {getActionIcon(log.activity_type)}
                      <span className="pal-action-text">{log.action}</span>
                    </td>
                    <td className="pal-user-cell">
                      {`${log.sk_first_name || 'Unknown'} ${log.sk_last_name || 'User'}`}
                      <div className="pal-user-role">
                        {log.sk_role || 'N/A'}
                      </div>
                    </td>
                    <td className="pal-type-cell">
                      <span className={`pal-type-badge ${log.activity_type}`}>
                        {log.activity_type}
                      </span>
                    </td>
                    <td className="pal-policy-type-cell">
                      {log.type === 'city' ? 'City Policy' : 'Barangay Policy'}
                    </td>
                    <td className="pal-policy-cell">
                      {log.policy_title || (log.details && JSON.parse(log.details).title) || 'Deleted Policy'}
                    </td>
                    <td className="pal-details-cell">
                      {renderDetails(log)}
                    </td>
                    <td className="pal-date-cell">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pal-pagination">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="pal-pagination-button"
            >
              Previous
            </button>
            
            <div className="pal-page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`pal-pagination-button ${currentPage === number ? 'active' : ''}`}
                >
                  {number}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pal-pagination-button"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PolicyActivityLogs; 