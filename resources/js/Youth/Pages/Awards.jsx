import React, { useState, useEffect } from "react";
import axios from "axios";
import '../css/Awards.css';
import YouthLayout from '../Components/YouthLayout';
import { 
  FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaTrophy, FaStar, 
  FaPhotoVideo, FaSearch, FaFilter, FaTimes, FaChevronRight, 
  FaChevronLeft, FaVideo, FaPlayCircle, FaFilm 
} from 'react-icons/fa';

const Awards = () => {
  // State for awards filtering and display
  const [isLoading, setIsLoading] = useState(true);
  const [allAwards, setAllAwards] = useState([]);
  const [filteredAwards, setFilteredAwards] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAward, setSelectedAward] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [years, setYears] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // Define categories mapping (for display purposes)
  const categories = [
    { id: 'leadership', name: 'Leadership' },
    { id: 'innovation', name: 'Innovation' },
    { id: 'service', name: 'Community Service' },
    { id: 'environment', name: 'Environmental' },
    { id: 'education', name: 'Academic' },
    { id: 'arts', name: 'Arts & Culture' },
    { id: 'sports', name: 'Sports' },
    { id: 'technology', name: 'Technology' }
  ];

  // Fetch awards from API
  useEffect(() => {
    fetchAwards();
  }, []);
  
  const fetchAwards = async () => {
    setIsLoading(true);
    try {
      // Make sure the URL exactly matches what's in your web.php route definition
      const response = await axios.get('/api/public/awards');
      
      if (response.data.success) {
        const awards = response.data.awards;
        setAllAwards(awards);
        setFilteredAwards(awards);
        
        // Extract unique years for filtering
        const uniqueYears = [...new Set(awards.map(award => award.year))].sort((a, b) => b - a);
        setYears(uniqueYears);
      } else {
        setError(response.data.message || 'Failed to fetch awards data');
        console.error('API error:', response.data);
      }
    } catch (error) {
      console.error('Error fetching awards:', error);
      
      // Provide more specific error message based on the error type
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Server error: ${error.response.status} - ${error.response.data.message || 'Failed to fetch awards'}`);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        setError('Network error: Unable to connect to the server');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('Application error: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter awards based on selected year and category
  useEffect(() => {
    let filtered = [...allAwards];
    
    if (selectedYear !== 'all') {
      filtered = filtered.filter(award => award.year === parseInt(selectedYear));
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(award => award.category === selectedCategory);
    }
    
    setFilteredAwards(filtered);
  }, [selectedYear, selectedCategory, allAwards]);

  // Handle year selection
  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  // Handle category selection
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Prepare media array for the selected award
  const getMediaItems = (award) => {
    if (!award) return [];
    
    // Start with main image
    const mediaItems = [
      { path: award.main_image, caption: award.title, isMain: true, type: 'image' }
    ];
    
    // Add other media items if present
    if (award.media && Array.isArray(award.media) && award.media.length > 0) {
      award.media.forEach(item => {
        mediaItems.push({
          path: item.path,
          caption: item.caption || '',
          subcaption: item.subcaption || '',
          type: item.type || 'image' // Default to image if type not specified
        });
      });
    }
    
    return mediaItems;
  };

  // Open award detail modal
  const openAwardModal = (award) => {
    setSelectedAward(award);
    setIsModalOpen(true);
    setCurrentMediaIndex(0); // Reset to first media (main image)
    document.body.classList.add('youth-awd-modal-open');
  };

  // Close award detail modal
  const closeAwardModal = () => {
    setIsModalOpen(false);
    document.body.classList.remove('youth-awd-modal-open');
  };

  // Get category name from category ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Other';
  };
  
  // Handle media navigation
  const goToPrevMedia = (e) => {
    e.stopPropagation();
    if (!selectedAward) return;
    
    const mediaItems = getMediaItems(selectedAward);
    
    setCurrentMediaIndex(prev => 
      prev === 0 ? mediaItems.length - 1 : prev - 1
    );
  };
  
  const goToNextMedia = (e) => {
    e.stopPropagation();
    if (!selectedAward) return;
    
    const mediaItems = getMediaItems(selectedAward);
    
    setCurrentMediaIndex(prev => 
      prev === mediaItems.length - 1 ? 0 : prev + 1
    );
  };
  
  const selectMedia = (index) => {
    setCurrentMediaIndex(index);
  };
  
  // Check if award has video content
  const hasVideoContent = (award) => {
    return award.media && 
           Array.isArray(award.media) && 
           award.media.some(item => item.type === 'video');
  };

  return (
    <YouthLayout>
      <section className="youth-awd-banner">
        <div className="youth-awd-banner-content">
          <h1 className="youth-awd-banner-title">Awards & Recognition</h1>
          <p className="youth-awd-banner-subtitle">Celebrating excellence and achievements in youth leadership</p>
        </div>
      </section>
      
      <div className="youth-awd-content-wrapper">
        <div className="youth-awd-excellence-header">
          <div className="youth-awd-excellence-title-wrapper">
            <div className="youth-awd-excellence-line"></div>
            <h2 className="youth-awd-excellence-title">RECOGNIZING EXCELLENCE</h2>
            <div className="youth-awd-excellence-line"></div>
          </div>
          <p className="youth-awd-excellence-description">
            The Sangguniang Kabataan Federation of Pasig City honors outstanding youth leaders, organizations, and initiatives through 
            these prestigious awards. These recognitions celebrate the exceptional contributions of young Pasigueños to community 
            development and nation-building.
          </p>
        </div>
        
        {/* Compact Filter Section */}
        <div className="youth-awd-compact-filters">
          <div className="youth-awd-filters-row">
            <div className="youth-awd-filter-group">
              <label className="youth-awd-filter-label">Year:</label>
              <div className="youth-awd-filter-buttons">
                <button 
                  className={`youth-awd-filter-chip ${selectedYear === 'all' ? 'active' : ''}`} 
                  onClick={() => handleYearChange('all')}
                >
                  All
                </button>
                {years.map(year => (
                  <button 
                    key={year} 
                    className={`youth-awd-filter-chip ${selectedYear === year.toString() ? 'active' : ''}`}
                    onClick={() => handleYearChange(year.toString())}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="youth-awd-filter-divider"></div>
            
            <div className="youth-awd-filter-group">
              <label className="youth-awd-filter-label">Category:</label>
              <div className="youth-awd-filter-buttons">
                <button 
                  className={`youth-awd-filter-chip ${selectedCategory === 'all' ? 'active' : ''}`} 
                  onClick={() => handleCategoryChange('all')}
                >
                  All
                </button>
                {categories.map(category => (
                  <button 
                    key={category.id} 
                    className={`youth-awd-filter-chip ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="youth-awd-loading">
            <div className="youth-awd-spinner"></div>
            <p className="youth-awd-loading-text">Loading awards...</p>
          </div>
        ) : error ? (
          <div className="youth-awd-error-message">
            <i className="fas fa-exclamation-triangle"></i>
            <p className="youth-awd-error-text">{error}</p>
          </div>
        ) : filteredAwards.length === 0 ? (
          <div className="youth-awd-no-results">
            <div className="youth-awd-no-results-icon">🏆</div>
            <h3 className="youth-awd-no-results-title">No awards found</h3>
            <p className="youth-awd-no-results-text">Try changing your filter criteria or check back later for updated awards.</p>
          </div>
        ) : (
          <div className="youth-awd-awards-grid">
            {filteredAwards.map((award) => (
              <div className="youth-awd-award-card" key={award.id}>
                <div className="youth-awd-award-image-container">
                  <img 
                    src={`/storage/${award.main_image}`} 
                    alt={award.title} 
                    className="youth-awd-award-image" 
                  />
                  <div className="youth-awd-award-year-badge">{award.year}</div>
                  
                  {/* Video indicator badge for awards with video content */}
                  {hasVideoContent(award) && (
                    <div className="youth-awd-award-video-badge" title="Contains video content">
                      <FaVideo />
                    </div>
                  )}
                  
                  <div className="youth-awd-award-overlay">
                    <button 
                      className="youth-awd-award-view-button"
                      onClick={() => openAwardModal(award)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
                <div className="youth-awd-award-content">
                  <div className="youth-awd-award-category">
                    {getCategoryName(award.category)}
                  </div>
                  <h3 className="youth-awd-award-title">{award.title}</h3>
                  <p className="youth-awd-award-description">{award.description.substring(0, 120)}...</p>
                  <div className="youth-awd-award-details">
                    <div className="youth-awd-award-recipients">
                      <FaUsers className="youth-awd-award-icon" /> <strong>Recipients:</strong> {award.recipients}
                    </div>
                    <div className="youth-awd-award-date">
                      <FaCalendarAlt className="youth-awd-award-icon" /> <strong>Date Awarded:</strong> {formatDate(award.date_awarded)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="youth-awd-nominate-section">
          <div className="youth-awd-nominate-content">
            <FaTrophy className="youth-awd-nominate-icon" />
            <h2 className="youth-awd-nominate-title">Know Someone Deserving?</h2>
            <p className="youth-awd-nominate-text">
              If you know a youth leader or organization that deserves recognition, 
              consider nominating them for our upcoming awards.
            </p>
            <a href="#" className="youth-awd-nominate-button">
              Nominate Today <FaChevronRight className="youth-awd-btn-icon" />
            </a>
          </div>
        </div>
      </div>
      
      {/* Award Detail Modal - Updated with video support */}
      {isModalOpen && selectedAward && (
        <div className="youth-awd-modal-overlay" onClick={closeAwardModal}>
          <div className="youth-awd-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="youth-awd-modal-close" onClick={closeAwardModal}>×</button>
            
            <div className="youth-awd-modal-header">
              <div className="youth-awd-modal-badge">{selectedAward.year}</div>
              <h2 className="youth-awd-modal-title">{selectedAward.title}</h2>
              <div className="youth-awd-modal-category">
                {getCategoryName(selectedAward.category)}
              </div>
            </div>
            
            <div className="youth-awd-modal-content-wrapper">
              {/* Left side - Media Gallery (Images & Videos) */}
              <div className="youth-awd-modal-left">
                <div className="youth-awd-modal-main-image">
                  {(() => {
                    const mediaItems = getMediaItems(selectedAward);
                    const currentItem = mediaItems[currentMediaIndex];
                    const isVideo = currentItem.type === 'video';
                    
                    return (
                      <>
                        {mediaItems.length > 1 && (
                          <button 
                            className="youth-awd-modal-nav youth-awd-modal-nav-prev" 
                            onClick={goToPrevMedia}
                          >
                            <FaChevronLeft />
                          </button>
                        )}
                        
                        {isVideo ? (
                          <div className="youth-awd-modal-video-container">
                            <video 
                              src={`/storage/${currentItem.path}`} 
                              className="youth-awd-modal-video" 
                              controls
                              preload="metadata"
                            ></video>
                          </div>
                        ) : (
                          <img 
                            src={`/storage/${currentItem.path}`} 
                            alt={currentItem.caption || selectedAward.title} 
                            className="youth-awd-modal-main-img"
                          />
                        )}
                        
                        {mediaItems.length > 1 && (
                          <button 
                            className="youth-awd-modal-nav youth-awd-modal-nav-next" 
                            onClick={goToNextMedia}
                          >
                            <FaChevronRight />
                          </button>
                        )}
                        
                        {/* Caption overlay - only show for non-main images/videos */}
                        {(currentItem.caption || currentItem.subcaption) && !currentItem.isMain && (
                          <div className="youth-awd-modal-caption-overlay">
                            {currentItem.caption && (
                              <h4 className="youth-awd-modal-caption-title">
                                {currentItem.caption}
                              </h4>
                            )}
                            {currentItem.subcaption && (
                              <p className="youth-awd-modal-caption-text">
                                {currentItem.subcaption}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                
                {/* Thumbnails for media navigation */}
                {(() => {
                  const mediaItems = getMediaItems(selectedAward);
                  
                  return mediaItems.length > 1 ? (
                    <div className="youth-awd-modal-thumbnails">
                      {mediaItems.map((item, idx) => (
                        <div 
                          className={`youth-awd-modal-thumbnail ${idx === currentMediaIndex ? 'active' : ''}`}
                          key={idx}
                          onClick={() => selectMedia(idx)}
                        >
                          {item.type === 'video' ? (
                            <div className="youth-awd-modal-video-thumb">
                              <div className="youth-awd-modal-video-thumb-overlay">
                                <FaPlayCircle className="youth-awd-modal-video-play-icon" />
                              </div>
                              <div className="youth-awd-modal-thumb-indicator">
                                <FaFilm />
                              </div>
                            </div>
                          ) : (
                            <img 
                              src={`/storage/${item.path}`} 
                              alt={item.caption || `Item ${idx + 1}`} 
                              className="youth-awd-modal-thumb-img"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
              
              {/* Right side - Award Details */}
              <div className="youth-awd-modal-right">
                <div className="youth-awd-modal-info">
                  <div className="youth-awd-modal-recipients">
                    <h3 className="youth-awd-modal-subheading">
                      <FaUsers className="youth-awd-modal-icon" /> Recipients
                    </h3>
                    <p className="youth-awd-modal-text">{selectedAward.recipients}</p>
                  </div>
                  <div className="youth-awd-modal-date">
                    <h3 className="youth-awd-modal-subheading">
                      <FaCalendarAlt className="youth-awd-modal-icon" /> Date Awarded
                    </h3>
                    <p className="youth-awd-modal-text">{formatDate(selectedAward.date_awarded)}</p>
                  </div>
                  <div className="youth-awd-modal-station">
                    <h3 className="youth-awd-modal-subheading">
                      <FaMapMarkerAlt className="youth-awd-modal-icon" /> SK Station
                    </h3>
                    <p className="youth-awd-modal-text">{selectedAward.sk_station}</p>
                  </div>
                </div>
                
                <div className="youth-awd-modal-description">
                  <h3 className="youth-awd-modal-subheading">
                    <FaStar className="youth-awd-modal-icon" /> About this Award
                  </h3>
                  <p className="youth-awd-modal-text">{selectedAward.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </YouthLayout>
  );
};

export default Awards;