
import React from 'react';
import { 
  FaEdit, FaArchive, FaTrash, FaUndoAlt, FaLock, FaCheck, FaCheckSquare, 
  FaSquare, FaEye, FaTrophy, FaBookmark 
} from 'react-icons/fa';
import '../css/AwardTable.css';

const AwardTable = ({
  awards,
  loading,
  selectedItems,
  onSelectItem,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  canManageAward,
  bookmarkTypes
}) => {
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getCategoryLabel = (category) => {
    switch(category) {
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
        return category;
    }
  };

  const getCategoryClass = (category) => {
    switch(category) {
      case 'leadership':
        return 'sk-award-category-leadership';
      case 'innovation':
        return 'sk-award-category-innovation';
      case 'service':
        return 'sk-award-category-service';
      case 'environment':
        return 'sk-award-category-environment';
      case 'education':
        return 'sk-award-category-education';
      case 'arts':
        return 'sk-award-category-arts';
      case 'sports':
        return 'sk-award-category-sports';
      case 'technology':
        return 'sk-award-category-technology';
      default:
        return '';
    }
  };

  return (
    <div className="sk-award-table-wrapper">
      <table className="sk-award-table">
        <thead>
          <tr>
            <th className="sk-award-checkbox-col"></th>
            <th></th>
            <th>Title</th>
            <th>Category</th>
            <th>Recipients</th>
            <th>Date Awarded</th>
            <th>Year</th>
            <th>Station</th>
            <th>Status</th>
            <th>Created By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {awards.map(award => {
            const canManage = canManageAward(award);
            const isSelected = selectedItems.includes(award.id);
            
            return (
              <tr 
                key={award.id} 
                className={`sk-award-row ${award.status === 'archived' ? 'sk-award-row-archived' : ''} ${isSelected ? 'sk-award-row-selected' : ''}`}
              >
                <td className="sk-award-checkbox-col">
                  <div 
                    className={`sk-award-checkbox ${!canManage ? 'sk-award-checkbox-disabled' : ''}`}
                    onClick={() => canManage && onSelectItem(award.id)}
                  >
                    {isSelected ? 
                      <FaCheckSquare className="sk-award-checkbox-icon checked" /> : 
                      <FaSquare className="sk-award-checkbox-icon" />
                    }
                  </div>
                </td>
                <td className="sk-award-image-col">
                  <div className="sk-award-thumbnail">
                    {award.bookmarkStatus && (
                      <div 
                        className="sk-award-bookmark-indicator"
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
                    <img 
                      src={`/storage/${award.main_image}`} 
                      alt={award.title} 
                      className="sk-award-thumbnail-img"
                    />
                  </div>
                </td>
                <td>
                  <div className="sk-award-title-block">
                    <div className="sk-award-title">{award.title}</div>
                    <div className="sk-award-description">{award.description.substring(0, 100)}...</div>
                  </div>
                </td>
                <td>
                  <span className={`sk-award-category-badge ${getCategoryClass(award.category)}`}>
                    {getCategoryLabel(award.category)}
                  </span>
                </td>
                <td>{award.recipients}</td>
                <td>{formatDate(award.date_awarded)}</td>
                <td>{award.year}</td>
                <td>{award.sk_station}</td>
                <td>
                  <span className={`sk-award-status-badge ${award.status === 'published' ? 'sk-award-status-published' : 'sk-award-status-archived'}`}>
                    {award.status}
                  </span>
                </td>
                <td>
                  {award.creator ? (
                    <div className="sk-award-creator">
                      <div className="sk-award-creator-name">
                        {award.creator.first_name} {award.creator.last_name}
                      </div>
                      <div className="sk-award-creator-role">
                        {award.creator.sk_role === 'Federasyon' ? 
                          'Federasyon' : 
                          `${award.creator.sk_role} - ${award.creator.sk_station}`}
                      </div>
                    </div>
                  ) : (
                    <span>Unknown</span>
                  )}
                </td>
                <td>
                  <div className="sk-award-actions">
                    <button
                      className="sk-award-btn sk-award-btn-view"
                      onClick={() => onView(award)}
                      title="View"
                    >
                      <FaEye />
                    </button>
                    
                    {canManage ? (
                      <>
                        <button
                          className="sk-award-btn sk-award-btn-edit"
                          onClick={() => onEdit(award)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        
                        {award.status === 'published' ? (
                          <button
                            className="sk-award-btn sk-award-btn-archive"
                            onClick={() => onArchive(award.id)}
                            title="Archive"
                          >
                            <FaArchive />
                          </button>
                        ) : (
                          <button
                            className="sk-award-btn sk-award-btn-restore"
                            onClick={() => onRestore(award.id)}
                            title="Restore"
                          >
                            <FaUndoAlt />
                          </button>
                        )}
                        
                        <button
                          className="sk-award-btn sk-award-btn-delete"
                          onClick={() => onDelete(award.id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </>
                    ) : (
                      <div className="sk-award-no-permission">
                        <FaLock />
                        <span>No Permission</span>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AwardTable;