import React, { useState } from 'react';
import { 
  FaTimes, FaCalendarAlt, FaUser, FaMapMarkerAlt, 
  FaChevronLeft, FaChevronRight, FaFilm, FaVideo,
  FaImage, FaInfo, FaBookmark
} from 'react-icons/fa';
import '../css/AwardDetail.css';

const AwardDetail = ({ award, onClose }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Format date for "time ago" display
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  };
  
  // Get category label
  const getCategoryLabel = (categoryId) => {
    switch(categoryId) {
      case 'leadership':
        return 'Leadership';
      case 'innovation':
        return 'Innovation';
      case 'service':
        return 'Community Service';
      case 'environment':
        return 'Environmental';
      case 'education':
        return 'Academic';
      case 'arts':
        return 'Arts & Culture';
      case 'sports':
        return 'Sports';
      case 'technology':
        return 'Technology';
      default:
        return categoryId;
    }
  };
  
  // Get bookmark label
  const getBookmarkLabel = (bookmarkStatus) => {
    switch(bookmarkStatus) {
      case 'new':
        return 'New';
      case 'updated':
        return 'Updated';
      default:
        return null;
    }
  };
  
  // Get bookmark color
  const getBookmarkColor = (bookmarkStatus) => {
    switch(bookmarkStatus) {
      case 'new':
        return '#10b981';
      case 'updated':
        return '#f59e0b';
      default:
        return null;
    }
  };
  
  // Prepare media array with main image first, then media items
  const allMedia = React.useMemo(() => {
    const mediaArray = [
      { path: award.main_image, caption: award.title, isMain: true, type: 'image' }
    ];
    
    if (award.media && Array.isArray(award.media) && award.media.length > 0) {
      award.media.forEach(item => {
        mediaArray.push({
          path: item.path,
          caption: item.caption || '',
          subcaption: item.subcaption || '',
          type: item.type || 'image'
        });
      });
    }
    
    return mediaArray;
  }, [award]);
  
  // Navigate to next media
  const goToNextMedia = (e) => {
    e.stopPropagation();
    setCurrentMediaIndex(prev => 
      (prev + 1) % allMedia.length
    );
  };
  
  // Navigate to previous media
  const goToPrevMedia = (e) => {
    e.stopPropagation();
    setCurrentMediaIndex(prev => 
      prev === 0 ? allMedia.length - 1 : prev - 1
    );
  };
  
  // Set specific media
  const setMedia = (index) => {
    setCurrentMediaIndex(index);
  };
  
  // Current media item
  const currentMedia = allMedia[currentMediaIndex];
  
  return (
    <div className="sk-award-detail-overlay" onClick={onClose}>
      <div className="sk-award-detail-container" onClick={e => e.stopPropagation()}>
        <button className="sk-award-detail-close" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="sk-award-detail-content">
          {/* Left Column - Media Display */}
          <div className="sk-award-detail-left">
            <div className="sk-award-detail-media-main">
              {/* Bookmark if applicable */}
              {award.bookmarkStatus && (
                <div 
                  className="sk-award-detail-bookmark"
                  style={{ backgroundColor: getBookmarkColor(award.bookmarkStatus) }}
                >
                  <FaBookmark />
                  <span className="sk-award-detail-bookmark-label">
                    {getBookmarkLabel(award.bookmarkStatus)}
                  </span>
                </div>
              )}
              
              {/* Media navigation arrows */}
              {allMedia.length > 1 && (
                <>
                  <button className="sk-award-detail-nav-prev" onClick={goToPrevMedia}>
                    <FaChevronLeft />
                  </button>
                  <button className="sk-award-detail-nav-next" onClick={goToNextMedia}>
                    <FaChevronRight />
                  </button>
                </>
              )}
              
              {/* Current media display */}
              <div className="sk-award-detail-media-wrapper">
                {currentMedia.type === 'video' ? (
                  <video 
                    src={`/storage/${currentMedia.path}`}
                    className="sk-award-detail-media-video"
                    controls
                    autoPlay={false}
                  ></video>
                ) : (
                  <img 
                    src={`/storage/${currentMedia.path}`}
                    alt={currentMedia.caption || award.title}
                    className="sk-award-detail-media-image"
                  />
                )}
                
                {/* Caption overlay for non-main media */}
                {!currentMedia.isMain && (currentMedia.caption || currentMedia.subcaption) && (
                  <div className="sk-award-detail-caption-overlay">
                    {currentMedia.caption && (
                      <h3 className="sk-award-detail-caption-title">{currentMedia.caption}</h3>
                    )}
                    {currentMedia.subcaption && (
                      <p className="sk-award-detail-caption-text">{currentMedia.subcaption}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Thumbnails for media selection */}
            {allMedia.length > 1 && (
              <div className="sk-award-detail-thumbnails">
                {allMedia.map((media, index) => (
                  <div 
                    key={index}
                    className={`sk-award-detail-thumbnail ${index === currentMediaIndex ? 'active' : ''}`}
                    onClick={() => setMedia(index)}
                  >
                    {media.type === 'video' ? (
                      <div className="sk-award-detail-video-thumbnail">
                        <FaFilm className="sk-award-detail-video-icon" />
                      </div>
                    ) : (
                      <img 
                        src={`/storage/${media.path}`}
                        alt={media.caption || `Thumbnail ${index + 1}`}
                        className="sk-award-detail-thumbnail-img"
                      />
                    )}
                    {media.type === 'video' && (
                      <div className="sk-award-detail-media-type video">
                        <FaVideo />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Right Column - Award Details */}
          <div className="sk-award-detail-right">
            <div className="sk-award-detail-header">
              <div className="sk-award-detail-badges">
                <span className={`sk-award-detail-category sk-award-category-${award.category}`}>
                  {getCategoryLabel(award.category)}
                </span>
                <span className="sk-award-detail-year">{award.year}</span>
                <span className={`sk-award-detail-status ${award.status === 'published' ? 'published' : 'archived'}`}>
                  {award.status}
                </span>
              </div>
              
              <h2 className="sk-award-detail-title">{award.title}</h2>
              
              <div className="sk-award-detail-meta">
                <div className="sk-award-detail-meta-item">
                  <FaCalendarAlt className="sk-award-detail-meta-icon" />
                  <span>Awarded: {formatDate(award.date_awarded)}</span>
                </div>
                
                <div className="sk-award-detail-meta-item">
                  <FaMapMarkerAlt className="sk-award-detail-meta-icon" />
                  <span>Station: {award.sk_station}</span>
                </div>
              </div>
            </div>
            
            <div className="sk-award-detail-info-section">
              <h3 className="sk-award-detail-section-title">
                <FaUser className="sk-award-detail-section-icon" />
                Recipients
              </h3>
              <p className="sk-award-detail-recipients">{award.recipients}</p>
            </div>
            
            <div className="sk-award-detail-info-section">
              <h3 className="sk-award-detail-section-title">
                <FaInfo className="sk-award-detail-section-icon" />
                Description
              </h3>
              <div className="sk-award-detail-description">
                {award.description}
              </div>
            </div>
            
            <div className="sk-award-detail-creation-info">
              <div className="sk-award-detail-creator">
                Created by: <strong>{award.creator ? `${award.creator.first_name} ${award.creator.last_name}` : 'Unknown'}</strong>
              </div>
              
              <div className="sk-award-detail-dates">
                <div className="sk-award-detail-date-item">
                  Created: {formatTimeAgo(award.created_at)}
                </div>
                {award.updated_at && award.updated_at !== award.created_at && (
                  <div className="sk-award-detail-date-item">
                    Updated: {formatTimeAgo(award.updated_at)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AwardDetail;