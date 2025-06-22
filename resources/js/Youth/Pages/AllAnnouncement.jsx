import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import YouthLayout from '../Components/YouthLayout';
import { FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';
import { useLocation, Link } from 'react-router-dom';
import '../css/AllAnnouncements.css';

const AllAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const itemsPerPage = 10;
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const announcementId = queryParams.get('id');

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

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get('/api/announcements', {
          params: {
            archived: '0'
          }
        });
        
        // Filter out announcements with sk_only visibility
        const publicAnnouncements = response.data.filter(
          announcement => announcement.visibility !== 'sk_only'
        );
        
        setAnnouncements(publicAnnouncements);
        
        // If an ID is provided in the URL, find and set the selected announcement
        if (announcementId) {
          const announcement = publicAnnouncements.find(
            a => a.id === parseInt(announcementId) || a.id === announcementId
          );
          
          if (announcement) {
            setSelectedAnnouncement(announcement);
          }
        }
        
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

    fetchAnnouncements();
  }, [announcementId]);

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
      
      // Filter by year
      if (selectedYear !== 'all') {
        const announcementYear = new Date(announcement.start_date).getFullYear();
        if (announcementYear != selectedYear) {
          return false;
        }
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
    return moment(dateString).format('MMMM D, YYYY');
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

  // Handle back to list view
  const handleBackToList = () => {
    setSelectedAnnouncement(null);
    // Update URL without the id parameter
    window.history.pushState({}, '', '/announcements');
  };

  return (
    <YouthLayout>
      <section className="youth-announce-banner">
        <div className="youth-announce-banner-content">
          <h1 className="youth-announce-banner-title">Announcements</h1>
          <p className="youth-announce-banner-subtitle">Stay updated with the latest announcements from Pasig SK</p>
        </div>
      </section>
      
      <div className="youth-announce-content-wrapper">
        {selectedAnnouncement ? (
          // Single Announcement View
          <div className="youth-announce-single-view">
            <button 
              className="youth-announce-back-button" 
              onClick={handleBackToList}
              aria-label="Back to all announcements"
            >
              <FaArrowLeft /> Back to All Announcements
            </button>
            
            <div className="youth-announce-single-card">
              <div className="youth-announce-single-header">
                <div className="youth-announce-single-date">
                  <FaCalendarAlt className="youth-announce-icon" />
                  <span>{formatDate(selectedAnnouncement.start_date)}</span>
                  {selectedAnnouncement.end_date && selectedAnnouncement.end_date !== selectedAnnouncement.start_date && (
                    <span> - {formatDate(selectedAnnouncement.end_date)}</span>
                  )}
                </div>
                <div className="youth-announce-card-badges">
                  {selectedAnnouncement.barangay === 'all' && (
                    <span className="youth-announce-badge youth-announce-badge-federation">
                      Pasig SK Federasyon
                    </span>
                  )}
                  {selectedAnnouncement.barangay === 'pasigfed' && (
                    <span className="youth-announce-badge youth-announce-badge-federation">
                      Pasig SK Federasyon
                    </span>
                  )}
                  {selectedAnnouncement.barangay !== 'all' && selectedAnnouncement.barangay !== 'pasigfed' && (
                    <span className="youth-announce-badge youth-announce-badge-barangay">
                      {selectedAnnouncement.barangay}
                    </span>
                  )}
                </div>
              </div>
              <div className="youth-announce-single-content">
                <h2 className="youth-announce-single-title">{selectedAnnouncement.title}</h2>
                <div className="youth-announce-single-text">
                  {selectedAnnouncement.content}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // List View
          <>
            <div className="youth-announce-filters">
              <div className="youth-announce-search">
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="youth-announce-search-input"
                />
              </div>
              
              <div className="youth-announce-filter-selects">
                <div className="youth-announce-filter">
                  <label htmlFor="barangay-filter">Barangay:</label>
                  <select
                    id="barangay-filter"
                    value={selectedBarangay}
                    onChange={(e) => {
                      setSelectedBarangay(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="youth-announce-select"
                  >
                    {barangayOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="youth-announce-filter">
                  <label htmlFor="year-filter">Year:</label>
                  <select
                    id="year-filter"
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="youth-announce-select"
                  >
                    {getYearOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="youth-announce-loading">Loading announcements...</div>
            ) : error ? (
              <div className="youth-announce-error">{error}</div>
            ) : paginatedAnnouncements.length === 0 ? (
              <div className="youth-announce-no-content">
                No announcements match your filters. Try adjusting your search criteria.
              </div>
            ) : (
              <>
                <div className="youth-announce-grid">
                  {paginatedAnnouncements.map(announcement => (
                    <div className="youth-announce-card" key={announcement.id}>
                      <div className="youth-announce-card-header">
                        <div className="youth-announce-card-date">
                          <FaCalendarAlt className="youth-announce-icon" />
                          <span>{formatDate(announcement.start_date)}</span>
                          {announcement.end_date && announcement.end_date !== announcement.start_date && (
                            <span> - {formatDate(announcement.end_date)}</span>
                          )}
                        </div>
                        <div className="youth-announce-card-badges">
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
                      <div className="youth-announce-card-content">
                        <h3 className="youth-announce-card-title">
                          <Link to={`/announcements?id=${announcement.id}`} className="youth-announce-title-link">
                            {announcement.title}
                          </Link>
                        </h3>
                        <p className="youth-announce-card-text">
                          {announcement.content.length > 150 ? (
                            <>
                              {announcement.content.substring(0, 150)}...
                              <Link to={`/announcements?id=${announcement.id}`} className="youth-announce-read-more">
                                Read More
                              </Link>
                            </>
                          ) : (
                            announcement.content
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="youth-announce-pagination">
                    <button
                      className="youth-announce-pagination-btn"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    
                    <div className="youth-announce-pagination-info">
                      Page {currentPage} of {totalPages}
                    </div>
                    
                    <button
                      className="youth-announce-pagination-btn"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </YouthLayout>
  );
};

export default AllAnnouncements;