import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Contexts/AuthContext';
import { FaSearch, FaFilter, FaSync, FaDownload, FaCalendarAlt, FaUser, FaTag } from 'react-icons/fa';
import ConfirmationDialog from '../Components/ConfirmationDialog';
import Notification from '../Components/Notification';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';   
import { saveAs } from 'file-saver';
import '../css/SkUserLogs.css';

const SkUserLogs = () => {
  const { skUser } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalLogs, setTotalLogs] = useState(0);

  // Filter state
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    date_from: '',
    date_to: '',
    search: ''
  });

  // Summary data
  const [summary, setSummary] = useState({
    today: 0,
    this_week: 0,
    this_month: 0,
    total: 0,
    top_actions: [],
    recent_activities: []
  });

  // Users for filtering
  const [users, setUsers] = useState([]);

  // Available actions for filtering
  const [actions, setActions] = useState([
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'signup', label: 'Registration' },
    { value: 'email_verification', label: 'Email Verification' },
    { value: 'forgot_password', label: 'Forgot Password' },
    { value: 'password_reset', label: 'Password Reset' },
    { value: '2fa_verification', label: '2FA Verification' },
    { value: 'page_visit', label: 'Page Visit' }
  ]);

  // Get logs from the server
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('per_page', perPage);

      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`/api/sk-user-logs?${params.toString()}`);

      if (response.data.success) {
        setLogs(response.data.logs.data);
        setCurrentPage(response.data.logs.current_page);
        setTotalPages(response.data.logs.last_page);
        setTotalLogs(response.data.logs.total);
      } else {
        setError('Failed to fetch logs');
      }
    } catch (err) {
      setError('Error fetching logs: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Get summary data
  const fetchSummary = async () => {
    try {
      const response = await axios.get('/api/sk-user-logs/summary');

      if (response.data.success) {
        setSummary(response.data.summary);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  // Get users for filtering
  const fetchUsers = async () => {
    try {
      // Using an endpoint that returns all SK users
      // You might need to implement this endpoint
      const response = await axios.get('/api/sk-users');

      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Load data on initial render and when filters or pagination changes
  useEffect(() => {
    fetchLogs();
  }, [currentPage, perPage, filters]);

  // Load summary and users only once on initial render
  useEffect(() => {
    fetchSummary();
    fetchUsers();
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({
      user_id: '',
      action: '',
      date_from: '',
      date_to: '',
      search: ''
    });
    setCurrentPage(1);
  };

  // Export logs to Excel
  const exportToExcel = async () => {
    try {
      setLoading(true);

      // Get all logs for export (no pagination)
      const params = new URLSearchParams();
      params.append('per_page', 1000); // Increase this if needed, or implement server-side export

      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`/api/sk-user-logs?${params.toString()}`);

      if (response.data.success) {
        const exportData = response.data.logs.data.map(log => ({
          'ID': log.id,
          'User': log.skaccount ? `${log.skaccount.first_name} ${log.skaccount.last_name}` : 'Guest',
          'Email': log.skaccount ? log.skaccount.email : 'N/A',
          'Action': log.action,
          'Description': log.description,
          'Page': log.page || 'N/A',
          'IP Address': log.ip_address,
          'Date/Time': format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')
        }));

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'User Logs');
        
        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Save file
        saveAs(blob, `sk_user_logs_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        
        setNotification({
          type: 'success',
          message: 'Logs exported successfully'
        });
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to export logs'
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Error exporting logs: ' + (err.response?.data?.message || err.message)
      });
    } finally {
      setLoading(false);
    }
  };

  // Format action for display
  const formatAction = (action) => {
    // Convert snake_case to Title Case with spaces
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get color class for action
  const getActionColorClass = (action) => {
    const actionMap = {
      login: 'success',
      logout: 'secondary',
      signup: 'primary',
      email_verification: 'info',
      forgot_password: 'warning',
      password_reset: 'warning',
      '2fa_verification': 'info',
      page_visit: 'light',
      login_failed: 'danger',
      verification_failed: 'danger',
      '2fa_failed': 'danger'
    };

    return `badge bg-${actionMap[action] || 'secondary'}`;
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">SK User Activity Logs</h1>
        <div>
          <button 
            className="btn btn-primary me-2" 
            onClick={() => {
              fetchLogs();
              fetchSummary();
            }}
            disabled={loading}
          >
            <FaSync className={loading ? 'fa-spin me-1' : 'me-1'} /> Refresh
          </button>
          <button 
            className="btn btn-success" 
            onClick={exportToExcel}
            disabled={loading}
          >
            <FaDownload className="me-1" /> Export to Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Today's Activity</h5>
              <h1 className="display-4">{summary.today}</h1>
              <p className="text-muted">Activities in the last 24 hours</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">This Week</h5>
              <h1 className="display-4">{summary.this_week}</h1>
              <p className="text-muted">Activities in the current week</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">This Month</h5>
              <h1 className="display-4">{summary.this_month}</h1>
              <p className="text-muted">Activities in the current month</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Total</h5>
              <h1 className="display-4">{summary.total}</h1>
              <p className="text-muted">Total recorded activities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><FaFilter className="me-2" /> Filters</h5>
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 mb-3">
              <label className="form-label">
                <FaUser className="me-1" /> User
              </label>
              <select 
                className="form-select"
                name="user_id"
                value={filters.user_id}
                onChange={handleFilterChange}
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">
                <FaTag className="me-1" /> Action
              </label>
              <select 
                className="form-select"
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
              >
                <option value="">All Actions</option>
                {actions.map(action => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">
                <FaCalendarAlt className="me-1" /> From Date
              </label>
              <input 
                type="date" 
                className="form-control"
                name="date_from"
                value={filters.date_from}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">
                <FaCalendarAlt className="me-1" /> To Date
              </label>
              <input 
                type="date" 
                className="form-control"
                name="date_to"
                value={filters.date_to}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search by description, action, or user details..."
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="card-header bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Activity Logs</h5>
            <div className="d-flex align-items-center">
              <span className="me-2">Show</span>
              <select 
                className="form-select form-select-sm" 
                style={{ width: '70px' }}
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="ms-2">entries</span>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Page</th>
                  <th>IP Address</th>
                  <th>Date/Time</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                )}
                
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      No activity logs found
                    </td>
                  </tr>
                )}
                
                {!loading && logs.map(log => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>
                      {log.skaccount ? (
                        <>
                          <strong>{log.skaccount.first_name} {log.skaccount.last_name}</strong>
                          <br />
                          <small className="text-muted">{log.skaccount.email}</small>
                        </>
                      ) : (
                        <span className="text-muted">Guest</span>
                      )}
                    </td>
                    <td>
                      <span className={getActionColorClass(log.action)}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td>{log.description || '-'}</td>
                    <td>{log.page || '-'}</td>
                    <td>{log.ip_address || '-'}</td>
                    <td>
                      {format(new Date(log.created_at), 'yyyy-MM-dd')}
                      <br />
                      <small className="text-muted">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              Showing {logs.length > 0 ? (currentPage - 1) * perPage + 1 : 0} to {Math.min(currentPage * perPage, totalLogs)} of {totalLogs} entries
            </div>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </button>
                </li>
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                
                {/* Page numbers - show 5 pages around current page */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    const min = Math.max(1, currentPage - 2);
                    const max = Math.min(totalPages, currentPage + 2);
                    return page >= min && page <= max;
                  })
                  .map(page => (
                    <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))
                }
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default SkUserLogs;