import React, { useState } from 'react';
import axios from 'axios';
import { FaSync, FaCalendar, FaCalendarCheck, FaListAlt } from 'react-icons/fa';

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

// Export the component to be used in SkUserAuthentication.jsx
export default TermRenewalDialog;