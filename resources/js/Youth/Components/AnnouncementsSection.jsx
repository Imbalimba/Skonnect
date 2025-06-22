import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { Link } from 'react-router-dom';
import '../css/Announcement.css';

const AnnouncementsSection = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  const [showBarangayPanel, setShowBarangayPanel] = useState(false);
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

  useEffect(() => {
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
          // Filter out announcements with sk_only visibility
          if (announcement.visibility === 'sk_only') {
            return false;
          }
          
          const startDate = new Date(announcement.start_date);
          startDate.setHours(0, 0, 0, 0);
          
          if (!announcement.end_date || announcement.end_date === announcement.start_date) {
            return startDate <= currentDate;
          } else {
            const endDate = new Date(announcement.end_date);
            endDate.setHours(23, 59, 59, 999);
            return startDate <= currentDate && currentDate <= endDate;
          }
        });
        
        // Updated filtering logic
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
        
        const sortedAnnouncements = filteredAnnouncements.sort((a, b) => 
          new Date(b.start_date) - new Date(a.start_date)
        );
        
        const limitedAnnouncements = sortedAnnouncements.slice(0, MAX_ANNOUNCEMENTS);
        
        setAnnouncements(limitedAnnouncements);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [selectedBarangay]);

  const formatDate = (dateString) => {
    return moment(dateString).format('MMM D, YYYY');
  };

  const getBarangayLabel = (value) => {
    const option = barangayOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // Function to truncate text and add read more link
  const truncateContent = (content, id) => {
    if (content.length <= MAX_CONTENT_LENGTH) {
      return content;
    }
    
    return (
      <>
        {content.substring(0, MAX_CONTENT_LENGTH)}...
        <Link to={`/announcements?id=${id}`} className="youth-announce-read-more">
          Read More
        </Link>
      </>
    );
  };

  return (
    <div className="youth-announce-container">
      <div className="youth-announce-header">
        <h3 className="youth-announce-title">
          {showBarangayPanel ? 'Select Barangay' : 'Announcements'}
        </h3>
        <button
          className="youth-announce-toggle-btn"
          onClick={() => setShowBarangayPanel(!showBarangayPanel)}
          aria-label="Toggle Barangay Panel"
        >
          ☰
        </button>
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
      ) : loading ? (
        <div className="youth-announce-loading">Loading announcements...</div>
      ) : announcements.length > 0 ? (
        <>
          {announcements.map((announcement) => (
            <div className="youth-announce-item" key={announcement.id}>
              <div className="youth-announce-date">
                {formatDate(announcement.start_date)}
                {announcement.end_date && announcement.end_date !== announcement.start_date && 
                  ` - ${formatDate(announcement.end_date)}`}
                {/* Updated badge display logic */}
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
              <div className="youth-announce-content">
                <h4 className="youth-announce-item-title">
                  <Link to={`/announcements?id=${announcement.id}`} className="youth-announce-title-link">
                    {announcement.title}
                  </Link>
                </h4>
                <p className="youth-announce-item-text">
                  {truncateContent(announcement.content, announcement.id)}
                </p>
              </div>
            </div>
          ))}
          {/* Always show "View All Announcements" link, not just when there are MAX_ANNOUNCEMENTS */}
          <div className="youth-announce-view-all">
            <Link to="/announcements" className="youth-announce-link">
              View All Announcements
            </Link>
          </div>
        </>
      ) : (
        <div className="youth-announce-empty">No announcements available</div>
      )}
    </div>
  );
};

export default AnnouncementsSection;