import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import { AuthContext } from '../../Contexts/AuthContext';
import { FaEye, FaEyeSlash, FaFilter, FaBuilding, FaLock, FaGlobe, FaTimes } from 'react-icons/fa';
import '../css/SKAnnouncement.css';

const SKAnnouncementsSection = () => {
  const { user, skUser } = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  const [selectedVisibility, setSelectedVisibility] = useState('all');
  const [showBarangayPanel, setShowBarangayPanel] = useState(false);
  const [showVisibilityPanel, setShowVisibilityPanel] = useState(false);
  const navigate = useNavigate(); // Initialize navigate for redirection
  const MAX_ANNOUNCEMENTS = 5; // Limit to 5 announcements
  const MAX_CONTENT_LENGTH = 120; // Maximum characters to display before truncating

  const barangayOptions = [
    { value: 'all', label: 'All Barangays' },
    { value: 'pasigfed', label: 'Pasig SK Federasyon' },
    { value: 'Dela Paz', label: 'Dela Paz' },
    { value: 'Manggahan', label: 'Manggahan' },
    { value: 'Maybunga', label: 'Maybunga' },
    { value: 'Pinagbuhatan', label: 'Pinagbuhatan' },
    { value: 'Rosario', label: 'Rosario' },
    { value: 'San Miguel', label: 'San Miguel' },
    { value: 'Santa Lucia', label: 'Santa Lucia' },
    { value: 'Santolan', label: 'Santolan' }
  ];

  const visibilityOptions = [
    { value: 'all', label: 'All Announcements', icon: <FaEye /> },
    { value: 'public', label: 'Public Only', icon: <FaGlobe /> },
    { value: 'sk_only', label: 'SK Only', icon: <FaLock /> }
  ];

  useEffect(() => {
    // Only fetch if user is logged in and is an SK official
    if (skUser) {
      fetchAnnouncements();
    } else {
      setLoading(false);
    }
  }, [skUser, selectedBarangay, selectedVisibility]);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('/api/announcements', {
        params: {
          archived: '0'
        }
      });
      
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      let filteredAnnouncements = response.data.filter(announcement => {
        const startDate = new Date(announcement.start_date);
        startDate.setHours(0, 0, 0, 0);
        
        // Filter by date
        let isValidDate = false;
        if (!announcement.end_date || announcement.end_date === announcement.start_date) {
          isValidDate = startDate <= currentDate;
        } else {
          const endDate = new Date(announcement.end_date);
          endDate.setHours(23, 59, 59, 999);
          isValidDate = startDate <= currentDate && currentDate <= endDate;
        }
        
        if (!isValidDate) return false;
        
        // Filter by visibility
        if (selectedVisibility !== 'all' && announcement.visibility !== selectedVisibility) {
          return false;
        }
        
        return true;
      });
      
      // Filter by barangay
      if (selectedBarangay === 'pasigfed') {
        // Show both pasigfed and all announcements for Federasyon
        filteredAnnouncements = filteredAnnouncements.filter(
          announcement => announcement.barangay === 'pasigfed' || announcement.barangay === 'all'
        );
      } else if (selectedBarangay !== 'all') {
        // For specific barangays, show only their own announcements
        filteredAnnouncements = filteredAnnouncements.filter(
          announcement => announcement.barangay === selectedBarangay
        );
      }
      
      // Sort by date (newest first)
      const sortedAnnouncements = filteredAnnouncements.sort((a, b) => 
        new Date(b.start_date) - new Date(a.start_date)
      );
      
      // Limit to MAX_ANNOUNCEMENTS
      const limitedAnnouncements = sortedAnnouncements.slice(0, MAX_ANNOUNCEMENTS);
      
      setAnnouncements(limitedAnnouncements);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('MMM D, YYYY');
  };

  // Function to truncate content and add read more link
  const truncateContent = (content, announcementId) => {
    if (!content || content.length <= MAX_CONTENT_LENGTH) {
      return <p className="youth-announce-item-text">{content}</p>;
    }
    
    return (
      <p className="youth-announce-item-text">
        {content.substring(0, MAX_CONTENT_LENGTH)}...
        <button 
          className="youth-announce-read-more" 
          onClick={(e) => {
            e.preventDefault();
            navigate(`/announcement-management?tab=ViewAllAnnouncements&id=${announcementId}`);
          }}
        >
          Read More
        </button>
      </p>
    );
  };

  // Handle redirection to view all announcements with optional specific announcement ID
  const handleViewAllClick = () => {
    navigate('/announcement-management?tab=ViewAllAnnouncements');
  };

  // If user is not an SK official, don't show this component
  if (!skUser) {
    return null;
  }

  return (
    <div className="youth-announce-container sk-announce-container">
      <div className="youth-announce-header">
        <h3 className="youth-announce-title">
          {showBarangayPanel 
            ? 'Select Barangay' 
            : showVisibilityPanel 
              ? 'Select Visibility' 
              : 'SK Announcements'}
        </h3>
        <div className="sk-announce-controls">
          <button
            className="youth-announce-toggle-btn sk-announce-toggle-btn"
            onClick={() => {
              setShowBarangayPanel(!showBarangayPanel);
              setShowVisibilityPanel(false);
            }}
            aria-label="Toggle Barangay Panel"
            title="Filter by Barangay"
          >
            <FaBuilding />
          </button>
          <button
            className={`youth-announce-toggle-btn sk-announce-toggle-btn ${selectedVisibility !== 'all' ? 'active-filter' : ''}`}
            onClick={() => {
              setShowVisibilityPanel(!showVisibilityPanel);
              setShowBarangayPanel(false);
            }}
            aria-label="Toggle Visibility Panel"
            title="Filter by Visibility (Public/SK Only)"
          >
            <FaFilter />
          </button>
        </div>
      </div>
  
      {/* Quick visibility filter buttons */}
      <div className="sk-visibility-quick-filters">
        {visibilityOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedVisibility(option.value)}
            className={`sk-visibility-tab ${selectedVisibility === option.value ? 'active' : ''}`}
            title={option.label}
          >
            <span className="sk-tab-icon">{option.icon}</span>
            <span className="sk-tab-label">{option.label}</span>
          </button>
        ))}
      </div>
      
      {showBarangayPanel ? (
        <div className="youth-announce-panel">
          <ul className="youth-announce-list">
            {barangayOptions.map((option) => (
              <li
                key={option.value}
                className={`youth-announce-list-item ${
                  selectedBarangay === option.value ? 'active' : ''
                }`}
                onClick={() => {
                  setSelectedBarangay(option.value);
                  setShowBarangayPanel(false);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      ) : showVisibilityPanel ? (
        <div className="youth-announce-panel">
          <ul className="youth-announce-list">
            {visibilityOptions.map((option) => (
              <li
                key={option.value}
                className={`youth-announce-list-item ${
                  selectedVisibility === option.value ? 'active' : ''
                }`}
                onClick={() => {
                  setSelectedVisibility(option.value);
                  setShowVisibilityPanel(false);
                }}
              >
                <span className="sk-filter-icon">{option.icon}</span>
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      ) : loading ? (
        <div className="youth-announce-loading">Loading announcements...</div>
      ) : announcements.length > 0 ? (
        <>
          <div className="sk-announce-filters-display">
            {selectedBarangay !== 'all' && (
              <div className="sk-filter-badge">
                <span className="sk-filter-label"><FaBuilding className="sk-filter-badge-icon" /> Barangay:</span>
                <span className="sk-filter-value">
                  {barangayOptions.find(opt => opt.value === selectedBarangay)?.label || selectedBarangay}
                </span>
                <button 
                  className="sk-clear-filter" 
                  onClick={() => setSelectedBarangay('all')}
                  title="Clear barangay filter"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            {selectedVisibility !== 'all' && (
              <div className="sk-filter-badge">
                <span className="sk-filter-label">
                  {selectedVisibility === 'public' ? <FaGlobe className="sk-filter-badge-icon" /> : <FaLock className="sk-filter-badge-icon" />}
                  Showing:
                </span>
                <span className="sk-filter-value">
                  {visibilityOptions.find(opt => opt.value === selectedVisibility)?.label || selectedVisibility}
                </span>
                <button 
                  className="sk-clear-filter" 
                  onClick={() => setSelectedVisibility('all')}
                  title="Show all announcements"
                >
                  <FaTimes />
                </button>
              </div>
            )}
          </div>
          
          {announcements.map((announcement) => (
            <div 
              className={`youth-announce-item ${
                announcement.visibility === 'sk_only' ? 'sk-only-announcement' : 'public-announcement'
              }`} 
              key={announcement.id}
              id={`announcement-${announcement.id}`}
            >
              <div className="youth-announce-date">
                {formatDate(announcement.start_date)}
                {announcement.end_date && announcement.end_date !== announcement.start_date && 
                  ` - ${formatDate(announcement.end_date)}`}
                  
                {/* Display appropriate badges */}
                <div className="youth-announce-badges">
                  {announcement.visibility === 'sk_only' ? (
                    <span className="youth-announce-badge youth-announce-badge-sk-only">
                      <FaLock className="youth-announce-badge-icon" /> SK Only
                    </span>
                  ) : (
                    <span className="youth-announce-badge youth-announce-badge-public">
                      <FaGlobe className="youth-announce-badge-icon" /> Public
                    </span>
                  )}
                  {announcement.barangay === 'all' && (
                    <span className="youth-announce-badge youth-announce-badge-federation">
                      Pasig SK Federasyon
                    </span>
                  )}
                  {announcement.barangay === 'pasigfed' && (
                    <span className="youth-announce-badge youth-announce-badge-federation">
                      Pasig SK Federasyon
                    </span>
                  )}
                  {announcement.barangay !== 'all' && announcement.barangay !== 'pasigfed' && (
                    <span className="youth-announce-badge youth-announce-badge-barangay">
                      {announcement.barangay}
                    </span>
                  )}
                </div>
              </div>
              <div className="youth-announce-content">
                <h4 className="youth-announce-item-title">{announcement.title}</h4>
                {truncateContent(announcement.content, announcement.id)}
              </div>
            </div>
          ))}
          
          <div className="youth-announce-view-all">
            <button 
              onClick={handleViewAllClick} 
              className="youth-announce-link"
            >
              View All Announcements
            </button>
          </div>
        </>
      ) : (
        <div className="youth-announce-empty">
          No {selectedVisibility === 'sk_only' ? 'SK-only' : selectedVisibility === 'public' ? 'public' : ''} announcements available
          {selectedBarangay !== 'all' && ` for ${barangayOptions.find(opt => opt.value === selectedBarangay)?.label}`}
        </div>
      )}
    </div>
  );
};

export default SKAnnouncementsSection;