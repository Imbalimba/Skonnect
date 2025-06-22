import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  FaTimes, FaUpload, FaImage, FaCalendarAlt, FaInfo, 
  FaTrash, FaPlus, FaFilm, FaVideo, FaPhotoVideo 
} from 'react-icons/fa';
import '../css/AwardForm.css';

const AwardForm = ({ show, onHide, onSave, initialData, skUser }) => {
  // Define base state for the form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    recipients: '',
    date_awarded: '',
    year: new Date().getFullYear(),
    sk_station: skUser ? skUser.sk_station : '',
    main_image: null,
    main_image_preview: null,
    media_files: [], // Renamed from gallery_images to media_files
    media_previews: [], // Renamed from gallery_previews to media_previews
    media_captions: [], // Renamed from gallery_captions to media_captions
    media_subcaptions: [], // Renamed from gallery_subcaptions to media_subcaptions
    media_types: [], // New field to track if item is an image or video
    remove_main_image: false,
    media_remove: [], // Renamed from gallery_remove to media_remove
  });
  
  const [errors, setErrors] = useState({});
  const [existingMedia, setExistingMedia] = useState([]); // Renamed from existingGallery to existingMedia
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create refs for file inputs
  const mainImageInputRef = useRef(null);
  const mediaInputRef = useRef(null); // Renamed from galleryInputRef to mediaInputRef
  
  // Award categories
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
  
  // SK Stations (for Federasyon role)
  const stations = [
    'Federation',
    'Dela Paz',
    'Manggahan',
    'Maybunga',
    'Pinagbuhatan',
    'Rosario',
    'San Miguel',
    'Santa Lucia',
    'Santolan'
  ];
  
  // Initialize form data if editing an existing award
  useEffect(() => {
    if (initialData) {
      // Set basic form fields
      setFormData(prev => ({
        ...prev,
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || '',
        recipients: initialData.recipients || '',
        date_awarded: initialData.date_awarded ? formatDateForInput(initialData.date_awarded) : '',
        year: initialData.year || new Date().getFullYear(),
        sk_station: initialData.sk_station || (skUser ? skUser.sk_station : ''),
        main_image_preview: initialData.main_image ? `/storage/${initialData.main_image}` : null,
        remove_main_image: false,
        media_remove: [], // Renamed from gallery_remove to media_remove
      }));
      
      // Set existing media (if any)
      if (initialData.media && Array.isArray(initialData.media) && initialData.media.length > 0) {
        setExistingMedia(initialData.media.map((item, index) => ({
          id: index,
          path: item.path,
          caption: item.caption || '',
          subcaption: item.subcaption || '',
          type: item.type || 'image' // Default to image if not specified
        })));
      } else {
        setExistingMedia([]);
      }
    } else {
      // Reset form for new award
      setFormData({
        title: '',
        description: '',
        category: '',
        recipients: '',
        date_awarded: '',
        year: new Date().getFullYear(),
        sk_station: skUser ? skUser.sk_station : '',
        main_image: null,
        main_image_preview: null,
        media_files: [],
        media_previews: [],
        media_captions: [],
        media_subcaptions: [],
        media_types: [],
        remove_main_image: false,
        media_remove: [],
      });
      setExistingMedia([]);
    }
    
    // Reset errors
    setErrors({});
  }, [initialData, skUser]);
  
  // Format date for input field
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Handle main image selection
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        main_image: file,
        main_image_preview: URL.createObjectURL(file),
        remove_main_image: false
      }));
      
      // Clear any error for this field
      if (errors.main_image) {
        setErrors(prev => ({ ...prev, main_image: null }));
      }
    }
  };
  
  // Handle media file selection
  const handleMediaAdd = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      const newMediaFiles = [...formData.media_files];
      const newMediaPreviews = [...formData.media_previews];
      const newMediaCaptions = [...formData.media_captions];
      const newMediaSubcaptions = [...formData.media_subcaptions];
      const newMediaTypes = [...formData.media_types];
      
      files.forEach(file => {
        // Determine if file is an image or video
        const fileType = file.type.startsWith('video/') ? 'video' : 'image';
        
        newMediaFiles.push(file);
        
        // Create object URL for preview
        const objectUrl = URL.createObjectURL(file);
        newMediaPreviews.push(objectUrl);
        
        // Add empty caption and subcaption
        newMediaCaptions.push('');
        newMediaSubcaptions.push('');
        
        // Add file type (image or video)
        newMediaTypes.push(fileType);
      });
      
      setFormData(prev => ({
        ...prev,
        media_files: newMediaFiles,
        media_previews: newMediaPreviews,
        media_captions: newMediaCaptions,
        media_subcaptions: newMediaSubcaptions,
        media_types: newMediaTypes
      }));
    }
    
    // Reset file input
    e.target.value = null;
  };
  
  // Handle media caption change
  const handleMediaCaptionChange = (index, value) => {
    const newCaptions = [...formData.media_captions];
    newCaptions[index] = value;
    
    setFormData(prev => ({
      ...prev,
      media_captions: newCaptions
    }));
  };
  
  // Handle media subcaption change
  const handleMediaSubcaptionChange = (index, value) => {
    const newSubcaptions = [...formData.media_subcaptions];
    newSubcaptions[index] = value;
    
    setFormData(prev => ({
      ...prev,
      media_subcaptions: newSubcaptions
    }));
  };
  
  // Handle existing media caption change
  const handleExistingMediaCaptionChange = (index, value) => {
    const updatedMedia = [...existingMedia];
    updatedMedia[index].caption = value;
    
    setExistingMedia(updatedMedia);
  };
  
  // Handle existing media subcaption change
  const handleExistingMediaSubcaptionChange = (index, value) => {
    const updatedMedia = [...existingMedia];
    updatedMedia[index].subcaption = value;
    
    setExistingMedia(updatedMedia);
  };
  
  // Remove a new media file
  const handleRemoveMedia = (index) => {
    const newMediaFiles = [...formData.media_files];
    const newMediaPreviews = [...formData.media_previews];
    const newMediaCaptions = [...formData.media_captions];
    const newMediaSubcaptions = [...formData.media_subcaptions];
    const newMediaTypes = [...formData.media_types];
    
    // Release object URL to prevent memory leaks
    URL.revokeObjectURL(newMediaPreviews[index]);
    
    // Remove item at index
    newMediaFiles.splice(index, 1);
    newMediaPreviews.splice(index, 1);
    newMediaCaptions.splice(index, 1);
    newMediaSubcaptions.splice(index, 1);
    newMediaTypes.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      media_files: newMediaFiles,
      media_previews: newMediaPreviews,
      media_captions: newMediaCaptions,
      media_subcaptions: newMediaSubcaptions,
      media_types: newMediaTypes
    }));
  };
  
  // Mark an existing media for removal
  const handleRemoveExistingMedia = (index) => {
    const updatedRemoveList = [...formData.media_remove];
    updatedRemoveList.push(index);
    
    setFormData(prev => ({
      ...prev,
      media_remove: updatedRemoveList
    }));
  };
  
  // Undo removal of existing media
  const handleUndoRemoveExistingMedia = (index) => {
    const updatedRemoveList = formData.media_remove.filter(i => i !== index);
    
    setFormData(prev => ({
      ...prev,
      media_remove: updatedRemoveList
    }));
  };
  
  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category || formData.category.trim() === '') {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.recipients || formData.recipients.trim() === '') {
      newErrors.recipients = 'Recipients information is required';
    }
    
    if (!formData.date_awarded || formData.date_awarded.trim() === '') {
      newErrors.date_awarded = 'Date awarded is required';
    }
    
    if (!formData.year) {
      newErrors.year = 'Year is required';
    }
    
    if (!formData.sk_station || formData.sk_station.trim() === '') {
      newErrors.sk_station = 'SK Station is required';
    }
    
    // Main image validation
    if (!initialData && !formData.main_image) {
      newErrors.main_image = 'Main image is required';
    } else if (formData.remove_main_image && !formData.main_image) {
      newErrors.main_image = 'Main image is required. Please provide a new image';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const submitData = new FormData();
      
      // Add regular form fields
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('recipients', formData.recipients);
      submitData.append('date_awarded', formData.date_awarded);
      submitData.append('year', formData.year);
      submitData.append('sk_station', formData.sk_station);
      
      // Add main image if set
      if (formData.main_image) {
        submitData.append('main_image', formData.main_image);
      }
      
      // Add remove_main_image flag if set
      if (formData.remove_main_image) {
        submitData.append('remove_main_image', 'true');
      }
      
      // Add new media files
      formData.media_files.forEach((file, index) => {
        submitData.append('media_files[]', file);
        submitData.append('media_captions[]', formData.media_captions[index] || '');
        submitData.append('media_subcaptions[]', formData.media_subcaptions[index] || '');
        submitData.append('media_types[]', formData.media_types[index] || 'image');
      });
      
      // Add existing media information
      if (initialData && existingMedia.length > 0) {
        existingMedia.forEach((item, index) => {
          submitData.append(`update_media_captions[${index}]`, item.caption || '');
          submitData.append(`update_media_subcaptions[${index}]`, item.subcaption || '');
        });
      }
      
      // Add media removal indexes
      if (formData.media_remove.length > 0) {
        submitData.append('media_remove', formData.media_remove.join(','));
      }
      
      // If we're updating, add _method=PUT for Laravel
      if (initialData) {
        submitData.append('_method', 'PUT');
      }
      
      // Pass FormData to parent component for saving
      await onSave(submitData);
      
      // If we reach here, form was submitted successfully
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors(prev => ({
        ...prev,
        form: 'An error occurred while saving the award. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Check if an existing media file is marked for removal
  const isExistingMediaRemoved = (index) => {
    return formData.media_remove.includes(index);
  };

  return (
    <div className={`sk-award-form-container ${show ? 'show' : ''}`}>
      <div className="sk-award-form-overlay" onClick={onHide}></div>
      
      <div className="sk-award-form-content">
        <div className="sk-award-form-header">
          <h2 className="sk-award-form-title">
            {initialData ? 'Edit Award' : 'Add New Award'}
          </h2>
          <button className="sk-award-form-close-btn" onClick={onHide}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="sk-award-form">
          {/* Basic Information */}
          <div className="sk-award-form-section">
            <h3 className="sk-award-form-section-title">
              <FaInfo className="sk-award-form-section-icon" />
              Basic Information
            </h3>
            
            <div className="sk-award-form-row">
              <div className="sk-award-form-group">
                <label htmlFor="title">Award Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`sk-award-form-input ${errors.title ? 'error' : ''}`}
                  placeholder="Enter award title"
                />
                {errors.title && <div className="sk-award-form-error">{errors.title}</div>}
              </div>
            </div>
            
            <div className="sk-award-form-row">
              <div className="sk-award-form-group">
                <label htmlFor="description">Description*</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`sk-award-form-textarea ${errors.description ? 'error' : ''}`}
                  placeholder="Enter award description"
                  rows={4}
                ></textarea>
                {errors.description && <div className="sk-award-form-error">{errors.description}</div>}
              </div>
            </div>
            
            <div className="sk-award-form-row two-col">
              <div className="sk-award-form-group">
                <label htmlFor="category">Category*</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`sk-award-form-select ${errors.category ? 'error' : ''}`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && <div className="sk-award-form-error">{errors.category}</div>}
              </div>
              
              <div className="sk-award-form-group">
                <label htmlFor="recipients">Recipients*</label>
                <input
                  type="text"
                  id="recipients"
                  name="recipients"
                  value={formData.recipients}
                  onChange={handleInputChange}
                  className={`sk-award-form-input ${errors.recipients ? 'error' : ''}`}
                  placeholder="Enter award recipients"
                />
                {errors.recipients && <div className="sk-award-form-error">{errors.recipients}</div>}
              </div>
            </div>
            
            <div className="sk-award-form-row two-col">
              <div className="sk-award-form-group">
                <label htmlFor="date_awarded">Date Awarded*</label>
                <div className="sk-award-form-date-input">
                  <input
                    type="date"
                    id="date_awarded"
                    name="date_awarded"
                    value={formData.date_awarded}
                    onChange={handleInputChange}
                    className={`sk-award-form-input ${errors.date_awarded ? 'error' : ''}`}
                  />
                  <FaCalendarAlt className="sk-award-form-date-icon" />
                </div>
                {errors.date_awarded && <div className="sk-award-form-error">{errors.date_awarded}</div>}
              </div>
              
              <div className="sk-award-form-group">
                <label htmlFor="year">Year*</label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className={`sk-award-form-input ${errors.year ? 'error' : ''}`}
                  placeholder="Enter year"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
                {errors.year && <div className="sk-award-form-error">{errors.year}</div>}
              </div>
            </div>
            
            <div className="sk-award-form-row">
              <div className="sk-award-form-group">
                <label htmlFor="sk_station">SK Station*</label>
                {skUser && skUser.sk_role !== 'Federasyon' ? (
                  <input
                    type="text"
                    value={formData.sk_station}
                    className="sk-award-form-input"
                    readOnly
                  />
                ) : (
                  <select
                    id="sk_station"
                    name="sk_station"
                    value={formData.sk_station}
                    onChange={handleInputChange}
                    className={`sk-award-form-select ${errors.sk_station ? 'error' : ''}`}
                  >
                    <option value="">Select a station</option>
                    {stations.map(station => (
                      <option key={station} value={station}>
                        {station}
                      </option>
                    ))}
                  </select>
                )}
                {errors.sk_station && <div className="sk-award-form-error">{errors.sk_station}</div>}
              </div>
            </div>
          </div>
          
          {/* Main Image Upload */}
          <div className="sk-award-form-section">
            <h3 className="sk-award-form-section-title">
              <FaImage className="sk-award-form-section-icon" />
              Main Image
            </h3>
            
            <div className="sk-award-form-row">
              <div className="sk-award-form-image-container">
                {formData.main_image_preview ? (
                  <div className={`sk-award-form-image-preview ${formData.remove_main_image ? 'removed' : ''}`}>
                    <img 
                      src={formData.main_image_preview} 
                      alt="Award" 
                      className="sk-award-form-main-preview" 
                    />
                    
                    <div className="sk-award-form-image-actions">
                      <button 
                        type="button" 
                        className="sk-award-form-image-change-btn"
                        onClick={() => mainImageInputRef.current.click()}
                      >
                        {formData.remove_main_image ? 'Select New Image' : 'Change Image'}
                      </button>
                      
                      {initialData && !formData.remove_main_image && (
                        <button 
                          type="button" 
                          className="sk-award-form-image-remove-btn"
                          onClick={() => mainImageInputRef.current.click()}
                        >
                          Replace Image
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`sk-award-form-upload-box ${errors.main_image ? 'error' : ''}`}
                    onClick={() => mainImageInputRef.current.click()}
                  >
                    <div className="sk-award-form-upload-content">
                      <FaUpload className="sk-award-form-upload-icon" />
                      <div className="sk-award-form-upload-text">
                        <span className="sk-award-form-upload-title">Main Award Image</span>
                        <span className="sk-award-form-upload-subtitle">Click to upload (max 5MB)</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <input
                  type="file"
                  ref={mainImageInputRef}
                  accept="image/*"
                  className="sk-award-form-file-input"
                  onChange={handleMainImageChange}
                />
                
                {errors.main_image && (
                  <div className="sk-award-form-error">{errors.main_image}</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Media Upload (Images & Videos) */}
          <div className="sk-award-form-section">
            <h3 className="sk-award-form-section-title">
              <FaPhotoVideo className="sk-award-form-section-icon" />
              Additional Media (Images & Videos)
            </h3>
            
            <div className="sk-award-form-row">
              <div className="sk-award-form-gallery-upload" onClick={() => mediaInputRef.current.click()}>
                <FaPlus className="sk-award-form-gallery-upload-icon" />
                <span>Add Images or Videos</span>
                <span className="sk-award-form-gallery-upload-note">
                  Support: JPG, PNG, GIF, MP4, WebM (max 20MB per file)
                </span>
              </div>
              
              <input
                type="file"
                ref={mediaInputRef}
                accept="image/*,video/*"
                className="sk-award-form-file-input"
                onChange={handleMediaAdd}
                multiple
              />
            </div>
            
            {/* Existing Media */}
            {existingMedia.length > 0 && (
              <div className="sk-award-form-gallery-existing">
                <h4 className="sk-award-form-gallery-subtitle">Existing Media</h4>
                
                <div className="sk-award-form-gallery-grid">
                  {existingMedia.map((item, index) => (
                    <div 
                      key={`existing-${index}`} 
                      className={`sk-award-form-gallery-item ${isExistingMediaRemoved(index) ? 'removed' : ''}`}
                    >
                      <div className="sk-award-form-gallery-preview">
                        {item.type === 'video' ? (
                          <div className="sk-award-form-video-preview">
                            <FaFilm className="sk-award-form-video-icon" />
                            <span className="sk-award-form-video-label">Video</span>
                          </div>
                        ) : (
                          <img 
                            src={`/storage/${item.path}`} 
                            alt={item.caption || `Media ${index + 1}`} 
                            className="sk-award-form-gallery-img" 
                          />
                        )}
                        
                        {isExistingMediaRemoved(index) ? (
                          <div className="sk-award-form-gallery-removed-overlay">
                            <button
                              type="button"
                              className="sk-award-form-gallery-undo-btn"
                              onClick={() => handleUndoRemoveExistingMedia(index)}
                            >
                              Undo Remove
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="sk-award-form-gallery-remove-btn"
                            onClick={() => handleRemoveExistingMedia(index)}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                      
                      <div className="sk-award-form-gallery-captions">
                        <input
                          type="text"
                          placeholder="Caption"
                          value={item.caption}
                          onChange={(e) => handleExistingMediaCaptionChange(index, e.target.value)}
                          className="sk-award-form-gallery-caption"
                          disabled={isExistingMediaRemoved(index)}
                        />
                        <textarea
                          placeholder="Description (optional)"
                          value={item.subcaption}
                          onChange={(e) => handleExistingMediaSubcaptionChange(index, e.target.value)}
                          className="sk-award-form-gallery-subcaption"
                          disabled={isExistingMediaRemoved(index)}
                        ></textarea>
                      </div>
                      
                    </div>
                  ))}
                </div>
              </div>
            )}
                        
            {/* New Media */}
            {formData.media_files.length > 0 && (
              <div className="sk-award-form-gallery-new">
                <h4 className="sk-award-form-gallery-subtitle">New Media</h4>
                
                <div className="sk-award-form-gallery-grid">
                  {formData.media_previews.map((preview, index) => (
                    <div key={`new-${index}`} className="sk-award-form-gallery-item">
                      <div className="sk-award-form-gallery-preview">
                        {formData.media_types[index] === 'video' ? (
                          <div className="sk-award-form-video-preview">
                            <video 
                              src={preview} 
                              className="sk-award-form-gallery-video" 
                              controls
                            ></video>
                          </div>
                        ) : (
                          <img 
                            src={preview} 
                            alt={`New media ${index + 1}`} 
                            className="sk-award-form-gallery-img" 
                          />
                        )}
                        
                        <button
                          type="button"
                          className="sk-award-form-gallery-remove-btn"
                          onClick={() => handleRemoveMedia(index)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                      
                      <div className="sk-award-form-gallery-captions">
                        <input
                          type="text"
                          placeholder="Caption"
                          value={formData.media_captions[index]}
                          onChange={(e) => handleMediaCaptionChange(index, e.target.value)}
                          className="sk-award-form-gallery-caption"
                        />
                        <textarea
                          placeholder="Description (optional)"
                          value={formData.media_subcaptions[index]}
                          onChange={(e) => handleMediaSubcaptionChange(index, e.target.value)}
                          className="sk-award-form-gallery-subcaption"
                        ></textarea>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* No media message */}
            {existingMedia.length === 0 && formData.media_files.length === 0 && (
              <div className="sk-award-form-no-media">
                <p>No additional media added yet. Click "Add Images or Videos" to upload.</p>
              </div>
            )}
          </div>
          
          <div className="sk-award-form-footer">
            {errors.form && <div className="sk-award-form-error general">{errors.form}</div>}
            
            <div className="sk-award-form-actions">
              <button 
                type="button" 
                className="sk-award-form-cancel-btn" 
                onClick={onHide}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                className="sk-award-form-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : initialData ? 'Update Award' : 'Create Award'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AwardForm;