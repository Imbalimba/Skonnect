import React, { useState, useEffect } from 'react';
import { 
  FaEdit, FaArchive, FaTrash, FaUndoAlt, FaLock, FaCheck, 
  FaCheckSquare, FaSquare, FaBookmark
} from 'react-icons/fa';
import '../css/DirectoryTable.css';

const DirectoryTable = ({
  directories,
  loading,
  skUser,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onBulkArchive,
  onBulkRestore,
  onBulkDelete,
  selectedItems,
  onSelectItem,
  onSelectAll,
  selectAll,
  bookmarkTypes
}) => {
  // Check if user has permission to edit/archive/delete
  const canManageDirectory = (directory) => {
    // Federasyon can manage all directories
    if (skUser.sk_role === 'Federasyon') {
      return true;
    } 
    
    // Check if directory was created by Federasyon (special protection)
    const createdByFederasyon = directory.creator && directory.creator.sk_role === 'Federasyon';
    if (createdByFederasyon && skUser.sk_role !== 'Federasyon') {
      return false;
    }
    
    // Chairman can manage their own directories and Kagawad directories in their station
    if (skUser.sk_role === 'Chairman') {
      return directory.sk_station === skUser.sk_station && 
        (directory.created_by === skUser.id || 
         (directory.creator && directory.creator.sk_role === 'Kagawad'));
    } 
    
    // Kagawad can only manage their own directories
    return directory.created_by === skUser.id;
  };
  
  // Find bookmark details from bookmarkStatus
  const getBookmarkDetails = (status) => {
    if (!status) return null;
    return bookmarkTypes.find(type => type.id === status);
  };

  const getCategoryLabel = (category) => {
    switch(category) {
      case 'executive':
        return 'Executive Committee';
      case 'committee':
        return 'Committees';
      case 'barangay':
        return 'Barangay SK Chairpersons';
      case 'partner':
        return 'Partner Agencies';
      default:
        return category;
    }
  };

  const getCategoryClass = (category) => {
    switch(category) {
      case 'executive':
        return 'sk-dir-category-executive';
      case 'committee':
        return 'sk-dir-category-committee';
      case 'barangay':
        return 'sk-dir-category-barangay';
      case 'partner':
        return 'sk-dir-category-partner';
      default:
        return '';
    }
  };

  // Format creator display
  const formatCreatorDisplay = (creator) => {
    if (!creator) return 'Unknown';
    
    if (creator.sk_role === 'Federasyon') {
      return (
        <div className="sk-dir-creator">
          <div className="sk-dir-creator-name">
            {creator.first_name} {creator.last_name}
          </div>
          <div className="sk-dir-creator-role">
            Federasyon
          </div>
        </div>
      );
    }
    
    return (
      <div className="sk-dir-creator">
        <div className="sk-dir-creator-name">
          {creator.first_name} {creator.last_name}
        </div>
        <div className="sk-dir-creator-role">
          {creator.sk_role} - {creator.sk_station}
        </div>
      </div>
    );
  };
  
  // Format updater display
  const formatUpdaterDisplay = (updater, updated_at) => {
    if (!updater) return 'Unknown';
    
    const date = new Date(updated_at);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    return (
      <div className="sk-dir-updater">
        <div className="sk-dir-updater-info">
          <div className="sk-dir-updater-name">
            {updater.first_name} {updater.last_name}
          </div>
          <div className="sk-dir-updater-role">
            {updater.sk_role}
          </div>
        </div>
        <div className="sk-dir-updated-date">
          {formattedDate}
        </div>
      </div>
    );
  };

  return (
    <div className="sk-dir-table-container">    
      {loading ? (
        <div className="sk-dir-loading">
          <div className="sk-dir-loading-spinner"></div>
          <p>Loading directories...</p>
        </div>
      ) : directories.length === 0 ? (
        <div className="sk-dir-empty">
          <p>No directories found. Add a new directory to get started.</p>
        </div>
      ) : (
        <div className="sk-dir-table-wrapper">
          <table className="sk-dir-table">
            <thead>
              <tr>
                <th className="sk-dir-checkbox-col">
                  <div className="sk-dir-checkbox" onClick={onSelectAll}>
                    {selectAll ? <FaCheckSquare className="sk-dir-checkbox-icon checked" /> : <FaSquare className="sk-dir-checkbox-icon" />}
                  </div>
                </th>
                <th>Name</th>
                <th>Role/Position</th>
                <th>Contact Information</th>
                <th>Category</th>
                <th>Station</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {directories.map(directory => {
                const canManage = canManageDirectory(directory);
                const isSelected = selectedItems.includes(directory.id);
                const bookmarkStatus = getBookmarkDetails(directory.bookmarkStatus);
                
                return (
                  <tr 
                    key={directory.id} 
                    className={`sk-dir-row ${directory.status === 'archived' ? 'sk-dir-row-archived' : ''} ${isSelected ? 'sk-dir-row-selected' : ''}`}
                  >
                    <td className="sk-dir-checkbox-col">
                      <div 
                        className={`sk-dir-checkbox ${!canManage ? 'sk-dir-checkbox-disabled' : ''}`}
                        onClick={() => canManage && onSelectItem(directory.id)}
                      >
                        {isSelected ? 
                          <FaCheckSquare className="sk-dir-checkbox-icon checked" /> : 
                          <FaSquare className="sk-dir-checkbox-icon" />
                        }
                      </div>
                    </td>
                    <td className="sk-dir-name-col">
                      {/* Add bookmark indicator if applicable */}
                      {bookmarkStatus && (
                        <div 
                          className="sk-dir-bookmark-indicator"
                          style={{ backgroundColor: bookmarkStatus.color }}
                          title={bookmarkStatus.name}
                        >
                          <FaBookmark className="sk-dir-bookmark-icon" />
                        </div>
                      )}
                      <span className="sk-dir-name">{directory.name}</span>
                    </td>
                    <td>{directory.role}</td>
                    <td>
                      {directory.email && (
                        <div className="sk-dir-contact">
                          <span className="sk-dir-contact-label">Email:</span>
                          <a href={`mailto:${directory.email}`} className="sk-dir-contact-value">
                            {directory.email}
                          </a>
                        </div>
                      )}
                      {directory.phone && (
                        <div className="sk-dir-contact">
                          <span className="sk-dir-contact-label">Phone:</span>
                          <a href={`tel:${directory.phone}`} className="sk-dir-contact-value">
                            {directory.phone}
                          </a>
                        </div>
                      )}
                      {directory.location && (
                        <div className="sk-dir-contact">
                          <span className="sk-dir-contact-label">Location:</span>
                          <span className="sk-dir-contact-value">{directory.location}</span>
                        </div>
                      )}
                      {!directory.email && !directory.phone && !directory.location && 
                        <span className="sk-dir-no-contact">No contact info</span>
                      }
                    </td>
                    <td>
                      <span className={`sk-dir-category-badge ${getCategoryClass(directory.category)}`}>
                        {getCategoryLabel(directory.category)}
                      </span>
                    </td>
                    <td>{directory.sk_station}</td>
                    <td>
                      <span className={`sk-dir-status-badge ${directory.status === 'published' ? 'sk-dir-status-published' : 'sk-dir-status-archived'}`}>
                        {directory.status === 'published' ? 'Published' : 'Archived'}
                      </span>
                    </td>
                    <td>
                      {formatUpdaterDisplay(directory.updater, directory.updated_at)}
                    </td>
                    <td>
                      {canManage ? (
                        <div className="sk-dir-actions">
                          <button
                            className="sk-dir-btn sk-dir-btn-edit"
                            onClick={() => onEdit(directory)}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          
                          {directory.status === 'published' ? (
                            <button
                              className="sk-dir-btn sk-dir-btn-archive"
                              onClick={() => onArchive(directory.id)}
                              title="Archive"
                            >
                              <FaArchive />
                            </button>
                          ) : (
                            <button
                              className="sk-dir-btn sk-dir-btn-restore"
                              onClick={() => onRestore(directory.id)}
                              title="Restore"
                            >
                              <FaUndoAlt />
                            </button>
                          )}
                          
                          <button
                            className="sk-dir-btn sk-dir-btn-delete"
                            onClick={() => onDelete(directory.id)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ) : (
                        <div className="sk-dir-no-permission">
                          <FaLock />
                          <span>No Permission</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DirectoryTable;