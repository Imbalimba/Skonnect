import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaTimes, FaSearch } from 'react-icons/fa';

const CannedResponseSelector = ({ onSelect, onClose }) => {
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentResponse, setCurrentResponse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'greeting',
    is_public: true
  });
  const [error, setError] = useState('');
  
  // Categories
  const categories = [
    { id: 'all', name: 'All Responses' },
    { id: 'greeting', name: 'Greetings' },
    { id: 'inquiry', name: 'Inquiries' },
    { id: 'complaint', name: 'Complaints' },
    { id: 'suggestion', name: 'Suggestions' },
    { id: 'technical', name: 'Technical Support' },
    { id: 'closing', name: 'Closing' },
    { id: 'other', name: 'Other' }
  ];
  
  // Fetch canned responses from API
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setIsLoading(true);
        
        const response = await axios.get('/api/sk/canned-responses');
        setResponses(response.data);
        setFilteredResponses(response.data);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching canned responses:', error);
        setIsLoading(false);
      }
    };
    
    fetchResponses();
  }, []);
  
  // Filter responses when search or category changes
  useEffect(() => {
    if (!responses) return;
    
    let filtered = [...responses];
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(response => response.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(response => 
        response.title.toLowerCase().includes(query) || 
        response.content.toLowerCase().includes(query)
      );
    }
    
    setFilteredResponses(filtered);
  }, [searchQuery, selectedCategory, responses]);
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle add response form submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.category) {
      setError('Please fill out all required fields');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await axios.post('/api/sk/canned-responses', formData);
      
      // Add to responses list
      setResponses(prev => [...prev, response.data.response]);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        category: 'greeting',
        is_public: true
      });
      
      // Hide form
      setShowAddForm(false);
      setError('');
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error adding canned response:', error);
      setError('Failed to add response. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle edit response form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.category) {
      setError('Please fill out all required fields');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await axios.put(`/api/sk/canned-responses/${currentResponse.id}`, formData);
      
      // Update responses list
      setResponses(prev => 
        prev.map(item => 
          item.id === currentResponse.id ? response.data.response : item
        )
      );
      
      // Reset form and state
      setFormData({
        title: '',
        content: '',
        category: 'greeting',
        is_public: true
      });
      
      setCurrentResponse(null);
      setShowEditForm(false);
      setError('');
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error updating canned response:', error);
      setError('Failed to update response. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle delete response
  const handleDelete = async (responseId) => {
    if (!window.confirm('Are you sure you want to delete this response?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      await axios.delete(`/api/sk/canned-responses/${responseId}`);
      
      // Remove from responses list
      setResponses(prev => prev.filter(item => item.id !== responseId));
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error deleting canned response:', error);
      setError('Failed to delete response. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle edit response button click
  const handleEditClick = (response) => {
    setCurrentResponse(response);
    setFormData({
      title: response.title,
      content: response.content,
      category: response.category,
      is_public: response.is_public
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle category selection
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };
  
  return (
    <div className="sk-canned-container">
      <div className="sk-canned-header">
        <h3>Canned Responses</h3>
        <button className="sk-canned-close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
      
      <div className="sk-canned-actions">
        <div className="sk-canned-search">
          <FaSearch className="sk-canned-search-icon" />
          <input
            type="text"
            placeholder="Search responses..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <button 
          className="sk-canned-add-btn"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setShowEditForm(false);
            setError('');
          }}
        >
          <FaPlus /> {showAddForm ? 'Cancel' : 'New Response'}
        </button>
      </div>
      
      {error && <div className="sk-canned-error">{error}</div>}
      
      {showAddForm && (
        <div className="sk-canned-form">
          <h4>Add New Response</h4>
          <form onSubmit={handleAddSubmit}>
            <div className="sk-canned-form-group">
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="sk-canned-form-group">
              <label>Category:</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                {categories.filter(cat => cat.id !== 'all').map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sk-canned-form-group">
              <label>Content:</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={4}
                required
              />
            </div>
            <div className="sk-canned-form-group checkbox">
              <input
                type="checkbox"
                name="is_public"
                id="is_public"
                checked={formData.is_public}
                onChange={handleInputChange}
              />
              <label htmlFor="is_public">Make available to all agents</label>
            </div>
            <div className="sk-canned-form-actions">
              <button 
                type="button" 
                className="sk-canned-cancel-btn"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="sk-canned-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? <FaSpinner className="sk-canned-spinner" /> : 'Save Response'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {showEditForm && currentResponse && (
        <div className="sk-canned-form">
          <h4>Edit Response</h4>
          <form onSubmit={handleEditSubmit}>
            <div className="sk-canned-form-group">
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="sk-canned-form-group">
              <label>Category:</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                {categories.filter(cat => cat.id !== 'all').map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sk-canned-form-group">
              <label>Content:</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={4}
                required
              />
            </div>
            <div className="sk-canned-form-group checkbox">
              <input
                type="checkbox"
                name="is_public"
                id="edit_is_public"
                checked={formData.is_public}
                onChange={handleInputChange}
              />
              <label htmlFor="edit_is_public">Make available to all agents</label>
            </div>
            <div className="sk-canned-form-actions">
              <button 
                type="button" 
                className="sk-canned-cancel-btn"
                onClick={() => {
                  setShowEditForm(false);
                  setCurrentResponse(null);
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="sk-canned-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? <FaSpinner className="sk-canned-spinner" /> : 'Update Response'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="sk-canned-categories">
        {categories.map(category => (
          <button
            key={category.id}
            className={`sk-canned-category ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => handleCategoryChange(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      <div className="sk-canned-responses">
        {isLoading && filteredResponses.length === 0 ? (
          <div className="sk-canned-loading">
            <FaSpinner className="sk-canned-spinner" />
            <p>Loading responses...</p>
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="sk-canned-empty">
            <p>No responses found. Create a new response or adjust your filters.</p>
          </div>
        ) : (
          filteredResponses.map(response => (
            <div key={response.id} className="sk-canned-response-item">
              <div className="sk-canned-response-header">
                <div className="sk-canned-response-title">
                  {response.title}
                </div>
                <div className="sk-canned-response-actions">
                  <button 
                    className="sk-canned-edit-btn"
                    onClick={() => handleEditClick(response)}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="sk-canned-delete-btn"
                    onClick={() => handleDelete(response.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="sk-canned-response-content">
                {response.content}
              </div>
              <div className="sk-canned-response-meta">
                <span className="sk-canned-response-category">
                  {response.category}
                </span>
                <button 
                  className="sk-canned-select-btn"
                  onClick={() => onSelect(response)}
                >
                  Use This
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CannedResponseSelector;