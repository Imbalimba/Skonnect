import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import moment from 'moment';
import { FaSearch, FaFilter, FaCalendarAlt } from 'react-icons/fa';
import '../css/ProfileActivityLogs.css';
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

const ProfileActivityLogs = () => {
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

  // Add getActivityColor function
  const getActivityColor = (activityType) => {
    switch (activityType) {
      case 'create':
        return 'create';
      case 'edit':
        return 'edit';
      case 'delete':
        return 'delete';
      case 'archive':
        return 'archive';
      case 'restore':
        return 'restore';
      default:
        return '';
    }
  };

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
      
      // Add pagination and barangay filter to the request
      const params = {
        page: currentPage,
        per_page: logsPerPage
      };
      if (skUser?.sk_role === 'Federasyon' && filters.barangay && filters.barangay !== 'all') {
        params.barangay = filters.barangay;
      }
      const response = await axios.get('/api/profile-activity-logs', { params });
      
      if (!response.data || !response.data.logs) {
        console.error('Invalid response from API:', response.data);
        setError('Received invalid response from server');
        setLogs([]);
        setFilteredLogs([]);
        return;
      }

      const logsData = response.data.logs.data || [];
      const totalLogs = response.data.logs.total || 0;
      
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
        profile: {
          id: log.profile_id,
          first_name: log.profile_first_name || 'Deleted Profile',
          last_name: log.profile_last_name || '',
          barangay: log.profile_barangay || 'N/A'
        }
      }));
      
      setLogs(formattedLogs);
      setFilteredLogs(formattedLogs);
      setTotalPages(Math.ceil(totalLogs / logsPerPage));
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
      setSkAccounts(Array.isArray(response.data) ? response.data : []);
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
      barangay: ''
    });
    setCurrentPage(1);
  };

  useEffect(() => {
    const filtered = logs.filter(log => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (log.sk_account?.first_name?.toLowerCase() || '').includes(searchLower) ||
        (log.sk_account?.last_name?.toLowerCase() || '').includes(searchLower) ||
        (log.activity_type?.toLowerCase() || '').includes(searchLower) ||
        (log.action?.toLowerCase() || '').includes(searchLower) ||
        (log.profile?.first_name?.toLowerCase() || '').includes(searchLower) ||
        (log.profile?.last_name?.toLowerCase() || '').includes(searchLower);

      const matchesActivityType = 
        !filters.activityType || 
        log.activity_type === filters.activityType;

      const logDate = new Date(log.created_at);
      const matchesStartDate = 
        !filters.startDate || 
        new Date(logDate.toDateString()) >= new Date(filters.startDate);
      const matchesEndDate = 
        !filters.endDate || 
        new Date(logDate.toDateString()) <= new Date(filters.endDate);

      const matchesSkAccount = 
        !filters.skAccount || 
        log.sk_account?.id == filters.skAccount;

      const matchesBarangay = !filters.barangay || filters.barangay === 'all' ||
        (
          (
            log.profile?.barangay &&
            log.profile.barangay.trim().toLowerCase() === filters.barangay.trim().toLowerCase()
          ) ||
          (
            log.details &&
            (() => {
              try {
                const details = JSON.parse(log.details);
                return (
                  details.barangay &&
                  details.barangay.trim().toLowerCase() === filters.barangay.trim().toLowerCase()
                );
              } catch {
                return false;
              }
            })()
          )
        );

      return matchesSearch && matchesActivityType && matchesStartDate && matchesEndDate && matchesSkAccount && matchesBarangay;
    });

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [logs, searchQuery, filters]);

  useEffect(() => {
    fetchActivityLogs();
  }, [currentPage]);

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
      const details = JSON.parse(log.details);
      
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

  if (!skUser || !['Federasyon', 'SK Chairman', 'SK Secretary'].includes(skUser.sk_role)) {
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
                    {account.first_name} {account.last_name}
                  </option>
                ))}
              </select>
            </div>

            {skUser?.sk_role === 'Federasyon' && (
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
                  <th>Profile</th>
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
                      {log.sk_account.first_name} {log.sk_account.last_name}
                      <div className="pal-user-role">{log.sk_account.sk_role}</div>
                    </td>
                    <td className="pal-type-cell">
                      <span className={`pal-type-badge ${log.activity_type}`}>
                        {log.activity_type}
                      </span>
                    </td>
                    <td className="pal-profile-cell">
                      {log.profile.first_name} {log.profile.last_name}
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

export default ProfileActivityLogs; 