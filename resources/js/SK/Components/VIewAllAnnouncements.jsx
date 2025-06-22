import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import moment from 'moment';
import { Link, useLocation } from 'react-router-dom';
import { FaCalendarAlt, FaEye, FaEyeSlash, FaFilter, FaBuilding, FaLock, FaGlobe, FaTimes, FaThumbtack } from 'react-icons/fa';
import '../css/ViewAllAnnouncements.css';

const ViewAllAnnouncements = ({ isArchiveMode }) => {
  // Use useLocation to get query parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const highlightedAnnouncementId = queryParams.get('id');

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  const [selectedVisibility, setSelectedVisibility] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalAnnouncement, setModalAnnouncement] = useState(null);
  
  const announcementRefs = useRef({});
  const itemsPerPage = 10;
  const MAX_CONTENT_LENGTH = 150; // Maximum characters to display before truncating

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
    fetchAnnouncements();
  }, [selectedBarangay, selectedVisibility, isArchiveMode]);

  // Scroll to highlighted announcement if ID is provided
  useEffect(() => {
    if (highlightedAnnouncementId && announcements.length > 0) {
      const foundAnnouncement = announcements.find(a => a.id.toString() === highlightedAnnouncementId);
      if (foundAnnouncement) {
        // Find which page the announcement is on
        const index = announcements.indexOf(foundAnnouncement);
        const pageNumber = Math.floor(index / itemsPerPage) + 1;
        setCurrentPage(pageNumber);
        
        // Set a timeout to ensure the DOM has updated after the page change
        setTimeout(() => {
          const ref = announcementRefs.current[highlightedAnnouncementId];
          if (ref) {
            ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Highlight the announcement by opening the modal
            handleOpenModal(foundAnnouncement);
          }
        }, 100);
      }
    }
  }, [highlightedAnnouncementId, announcements]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/announcements', {
        params: {
          archived: isArchiveMode ? '1' : '0'
        }
      });
      
      setAnnouncements(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch announcements. Please try again later.'
      );
      setLoading(false);
    }
  };

  // Get unique years from announcements
  const getYearOptions = () => {
    const years = new Set();
    announcements.forEach(announcement => {
      const year = new Date(announcement.start_date).getFullYear();
      years.add(year);
    });
    
    const sortedYears = [...years].sort((a, b) => b - a); // Most recent first
    return [{ value: 'all', label: 'All Years' }, ...sortedYears.map(year => ({ value: year, label: year.toString() }))];
  };

  // Filter announcements based on selected filters and search query
  const getFilteredAnnouncements = () => {
    return announcements.filter(announcement => {
      // Filter by barangay
      if (selectedBarangay !== 'all' && 
          announcement.barangay !== selectedBarangay && 
          !(selectedBarangay === 'pasigfed' && announcement.barangay === 'all')) {
        return false;
      }
      
      // Filter by visibility
      if (selectedVisibility !== 'all' && announcement.visibility !== selectedVisibility) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          announcement.title.toLowerCase().includes(query) ||
          announcement.content.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('MMM D, YYYY');
  };

  // Pagination logic
  const filteredAnnouncements = getFilteredAnnouncements();
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => 
    new Date(b.start_date) - new Date(a.start_date)
  );
  
  const totalPages = Math.ceil(sortedAnnouncements.length / itemsPerPage);
  const paginatedAnnouncements = sortedAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Function to truncate text and add read more toggle
  const truncateContent = (content) => {
    if (content.length <= MAX_CONTENT_LENGTH) {
      return content;
    }
    
    return (
      <>
        {content.substring(0, MAX_CONTENT_LENGTH)}...
      </>
    );
  };

  // Toggle to show full announcement
  const toggleAnnouncementView = (announcement) => {
    if (selectedAnnouncement && selectedAnnouncement.id === announcement.id) {
      setSelectedAnnouncement(null);
    } else {
      setSelectedAnnouncement(announcement);
    }
  };

  // Modal functions
  const handleOpenModal = (announcement) => {
    setModalAnnouncement(announcement);
    setShowModal(true);
    // Update URL with announcement ID without causing a page reload
    const url = new URL(window.location);
    url.searchParams.set('id', announcement.id);
    window.history.pushState({}, '', url);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalAnnouncement(null);
    // Remove the ID parameter from URL
    const url = new URL(window.location);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url);
  };

  // Close modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        handleCloseModal();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal]);

  return (
    <div className="manage-announce-container">
      <div className="manage-announce-filters">
        <div className="manage-announce-search">
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="manage-announce-search-input"
          />
        </div>
        
        <div className="manage-announce-filter-selects">
          <div className="manage-announce-filter">
            <label htmlFor="barangay-filter">Barangay:</label>
            <select
              id="barangay-filter"
              value={selectedBarangay}
              onChange={(e) => {
                setSelectedBarangay(e.target.value);
                setCurrentPage(1);
              }}
              className="manage-announce-select"
            >
              {barangayOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="manage-announce-filter">
            <label htmlFor="visibility-filter">Visibility:</label>
            <select
              id="visibility-filter"
              value={selectedVisibility}
              onChange={(e) => {
                setSelectedVisibility(e.target.value);
                setCurrentPage(1);
              }}
              className="manage-announce-select"
            >
              {visibilityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {isArchiveMode && (
        <div className="manage-announce-archive-banner">
          <FaEyeSlash className="archive-icon" /> You are viewing archived announcements
        </div>
      )}
      
      {loading ? (
        <div className="manage-announce-loading">Loading announcements...</div>
      ) : error ? (
        <div className="manage-announce-error">{error}</div>
      ) : paginatedAnnouncements.length === 0 ? (
        <div className="manage-announce-no-content">
          No announcements match your filters. Try adjusting your search criteria.
        </div>
      ) : (
        <>
          <div className="manage-announce-list">
            {paginatedAnnouncements.map(announcement => (
              <div 
                className={`manage-announce-card ${announcement.visibility === 'sk_only' ? 'sk-only-announce' : 'public-announce'} ${isArchiveMode ? 'archived-announce' : ''} ${highlightedAnnouncementId && highlightedAnnouncementId === announcement.id.toString() ? 'highlighted-announce' : ''}`} 
                key={announcement.id}
                id={`announcement-${announcement.id}`}
                ref={el => {announcementRefs.current[announcement.id] = el}}
              >
                <div className="manage-announce-card-header">
                  <div className="manage-announce-card-date">
                    <FaCalendarAlt className="manage-announce-icon" />
                    <span>{formatDate(announcement.start_date)}</span>
                    {announcement.end_date && announcement.end_date !== announcement.start_date && (
                      <span> - {formatDate(announcement.end_date)}</span>
                    )}
                  </div>
                  <div className="manage-announce-card-badges">
                    {announcement.visibility === 'sk_only' ? (
                      <span className="manage-announce-badge manage-announce-badge-sk-only">
                        <FaLock className="manage-announce-badge-icon" /> SK Only
                      </span>
                    ) : (
                      <span className="manage-announce-badge manage-announce-badge-public">
                        <FaGlobe className="manage-announce-badge-icon" /> Public
                      </span>
                    )}
                    {announcement.barangay === 'all' && (
                      <span className="manage-announce-badge manage-announce-badge-federation">
                        Pasig SK Federasyon
                      </span>
                    )}
                    {announcement.barangay === 'pasigfed' && (
                      <span className="manage-announce-badge manage-announce-badge-federation">
                        Pasig SK Federasyon
                      </span>
                    )}
                    {announcement.barangay !== 'all' && announcement.barangay !== 'pasigfed' && (
                      <span className="manage-announce-badge manage-announce-badge-barangay">
                        {announcement.barangay}
                      </span>
                    )}
                  </div>
                </div>
                <div className="manage-announce-card-content">
                  <h3 className="manage-announce-card-title">
                    {announcement.title}
                  </h3>
                  <div className="manage-announce-card-text">
                    {selectedAnnouncement && selectedAnnouncement.id === announcement.id ? (
                      <div className="manage-announce-full-content">
                        {announcement.content}
                        <button 
                          className="manage-announce-read-less" 
                          onClick={() => toggleAnnouncementView(announcement)}
                        >
                          Show Less
                        </button>
                      </div>
                    ) : (
                      <>
                        {truncateContent(announcement.content)}
                        {announcement.content.length > MAX_CONTENT_LENGTH && (
                          <button 
                            className="manage-announce-read-more" 
                            onClick={() => handleOpenModal(announcement)}
                          >
                            Read More
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="manage-announce-pagination">
              <button
                className="manage-announce-pagination-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <div className="manage-announce-pagination-info">
                Page {currentPage} of {totalPages}
              </div>
              
              <button
                className="manage-announce-pagination-btn"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Full announcement modal */}
      {showModal && modalAnnouncement && (
        <div className="announcement-modal-overlay" onClick={handleCloseModal}>
          <div className="announcement-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="announcement-modal-close" onClick={handleCloseModal}>×</button>
            
            <div className="announcement-modal-header">
              <h3 className="announcement-modal-title">{modalAnnouncement.title}</h3>
              <div className="announcement-modal-badges">
                {modalAnnouncement.visibility === 'sk_only' ? (
                  <span className="manage-announce-badge manage-announce-badge-sk-only">
                    <FaLock className="manage-announce-badge-icon" /> SK Only
                  </span>
                ) : (
                  <span className="manage-announce-badge manage-announce-badge-public">
                    <FaGlobe className="manage-announce-badge-icon" /> Public
                  </span>
                )}
                {modalAnnouncement.barangay === 'all' && (
                  <span className="manage-announce-badge manage-announce-badge-federation">
                    Pasig SK Federasyon
                  </span>
                )}
                {modalAnnouncement.barangay === 'pasigfed' && (
                  <span className="manage-announce-badge manage-announce-badge-federation">
                    Pasig SK Federasyon
                  </span>
                )}
                {modalAnnouncement.barangay !== 'all' && modalAnnouncement.barangay !== 'pasigfed' && (
                  <span className="manage-announce-badge manage-announce-badge-barangay">
                    {modalAnnouncement.barangay}
                  </span>
                )}
              </div>
            </div>
            
            <div className="announcement-modal-date">
              <FaCalendarAlt className="manage-announce-icon" />
              <span>{formatDate(modalAnnouncement.start_date)}</span>
              {modalAnnouncement.end_date && modalAnnouncement.end_date !== modalAnnouncement.start_date && (
                <span> - {formatDate(modalAnnouncement.end_date)}</span>
              )}
            </div>
            
            <div className="announcement-modal-body">
              <p className="announcement-modal-content">{modalAnnouncement.content}</p>
            </div>
            
            <div className="announcement-modal-footer">
              <button 
                className="announcement-modal-btn" 
                onClick={handleCloseModal}
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

export default ViewAllAnnouncements;