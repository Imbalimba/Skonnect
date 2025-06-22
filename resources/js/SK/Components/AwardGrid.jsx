import React from 'react';
import { 
  FaEye, FaEdit, FaArchive, FaTrash, FaCheckSquare, FaSquare,
  FaUndoAlt, FaCalendarAlt, FaBookmark, FaFilm, FaMapMarkerAlt
} from 'react-icons/fa';
import '../css/AwardGrid.css';

const AwardGrid = ({ 
  awards, 
  selectedItems,
  onSelectItem,
  onView, 
  onEdit, 
  onArchive, 
  onRestore, 
  onDelete,
  categories,
  bookmarkTypes,
  canManageAward 
}) => {
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get category name
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  return (
    <div className="sk-award-grid">
      {awards.map((award) => {
        // Check if award has any videos
        const hasVideos = award.media && Array.isArray(award.media) && 
                          award.media.some(item => item.type === 'video');
        
        return (
          <div 
            key={award.id} 
            className={`sk-award-card ${award.status === 'archived' ? 'archived' : ''}`}
          >
            {/* Bookmark if applicable */}
            {award.bookmarkStatus && (
              <div 
                className="sk-award-bookmark"
                style={{ 
                  backgroundColor: bookmarkTypes.find(
                    type => type.id === award.bookmarkStatus
                  )?.color 
                }}
                title={bookmarkTypes.find(
                  type => type.id === award.bookmarkStatus
                )?.name}
              >
                <FaBookmark />
              </div>
            )}
            
            {/* Video indicator */}
            {hasVideos && (
              <div className="sk-award-video-indicator" title="Contains video">
                <FaFilm />
              </div>
            )}
            
            {/* Checkbox for selection */}
            <div 
              className="sk-award-card-checkbox"
              onClick={() => onSelectItem(award.id)}
            >
              {selectedItems.includes(award.id) ? 
                <FaCheckSquare className="sk-award-card-checkbox-icon checked" /> : 
                <FaSquare className="sk-award-card-checkbox-icon" />
              }
            </div>
            
            <div className="sk-award-card-image">
              <img 
                src={`/storage/${award.main_image}`} 
                alt={award.title} 
                className="sk-award-card-img"
              />
            </div>
            
            <div className="sk-award-card-body">
              <div className="sk-award-card-badges">
                <span className={`sk-award-category-badge sk-award-category-${award.category}`}>
                  {getCategoryName(award.category)}
                </span>
                <span className="sk-award-year-badge">{award.year}</span>
              </div>
              
              <h3 className="sk-award-card-title">{award.title}</h3>
              <p className="sk-award-card-recipients">{award.recipients}</p>
              <p className="sk-award-card-description">{award.description.substring(0, 100)}...</p>
              
              <div className="sk-award-card-meta">
                <div className="sk-award-card-meta-item">
                  <FaCalendarAlt className="sk-award-card-meta-icon" />
                  <span>{formatDate(award.date_awarded)}</span>
                </div>
                <div className="sk-award-card-meta-item">
                  <FaMapMarkerAlt className="sk-award-card-meta-icon" />
                  <span>{award.sk_station}</span>
                </div>
              </div>
            </div>
            
            <div className="sk-award-card-footer">
              <button 
                className="sk-award-card-btn preview" 
                title="View"
                onClick={() => onView(award)}
              >
                <FaEye />
              </button>
              {canManageAward(award) && (
                <>
                  <button 
                    className="sk-award-card-btn edit" 
                    title="Edit"
                    onClick={() => onEdit(award)}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="sk-award-card-btn archive" 
                    title={award.status === 'archived' ? 'Restore' : 'Archive'}
                    onClick={() => award.status === 'archived' ? 
                      onRestore(award.id) : onArchive(award.id)}
                  >
                    {award.status === 'archived' ? <FaUndoAlt /> : <FaArchive />}
                  </button>
                  <button 
                    className="sk-award-card-btn delete" 
                    title="Delete"
                    onClick={() => onDelete(award.id)}
                  >
                    <FaTrash />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AwardGrid;