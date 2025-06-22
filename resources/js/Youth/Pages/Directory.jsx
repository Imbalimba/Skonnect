// Directory.jsx (Youth Side)
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../css/Directory.css';
import { FaSearch, FaUserCircle, FaMapMarkerAlt, FaPhone, FaEnvelope, 
         FaFilter, FaCalendarDay, FaChevronRight, FaNetworkWired, 
         FaBuilding, FaMapMarked } from 'react-icons/fa';
import OrganizationChartModal from '../../Components/OrganizationChartModal';
import YouthLayout from '../Components/YouthLayout';

const Directory = () => {
  // State for directory data from API
  const [directoryData, setDirectoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrgChart, setShowOrgChart] = useState(false);
  const [selectedStation, setSelectedStation] = useState('all');
  const [orgChartStation, setOrgChartStation] = useState('');

  // Fetch directory data from API
  useEffect(() => {
    const fetchDirectoryData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/public-directory');
        setDirectoryData(response.data);
      } catch (error) {
        console.error('Failed to load directory data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDirectoryData();
  }, []);

  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredData, setFilteredData] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Category options
  const categories = [
    { id: "all", name: "Youth Development Council", description: "All SK officers and committee members", icon: "fas fa-users" },
    { id: "executive", name: "Executive Committee", description: "SK Officers", icon: "fas fa-star" },
    { id: "committee", name: "Committees", description: "SK committee chairpersons and co-chairpersons", icon: "fas fa-tasks" },
    { id: "barangay", name: "Barangay SK Chairpersons", description: "SK chairpersons from each barangay", icon: "fas fa-map-marker-alt" },
    { id: "partner", name: "Partner Agencies", description: "Allied government agencies and organizations", icon: "fas fa-handshake" }
  ];

  // Get all unique stations for filter
  const stations = useMemo(() => {
    const uniqueStations = ['all', ...new Set(directoryData.map(item => item.sk_station))].sort();
    return uniqueStations.map(station => ({
      id: station,
      name: station === 'all' ? 'All Stations' : station
    }));
  }, [directoryData]);

  // Function to filter data based on search query, selected category, and selected station
  const filterData = () => {
    setIsFiltering(true);
    
    setTimeout(() => {
      let filtered = directoryData;
      
      // Filter by category first
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(item => item.category === selectedCategory);
      }
      
      // Filter by station
      if (selectedStation !== 'all') {
        filtered = filtered.filter(item => item.sk_station === selectedStation);
      }
      
      // Then filter by search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(query) || 
          item.role.toLowerCase().includes(query) || 
          (item.email && item.email.toLowerCase().includes(query))
        );
      }
      
      setFilteredData(filtered);
      setIsFiltering(false);
    }, 300); // Short delay for animation purposes
  };

  // Filter data when search query, selected category, or selected station changes
  useEffect(() => {
    filterData();
  }, [searchQuery, selectedCategory, selectedStation, directoryData]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  // Handle station selection
  const handleStationSelect = (stationId) => {
    setSelectedStation(stationId);
  };

  // Get active category
  const activeCategory = useMemo(() => {
    return categories.find(cat => cat.id === selectedCategory) || categories[0];
  }, [selectedCategory]);

  // Get active station
  const activeStation = useMemo(() => {
    return stations.find(station => station.id === selectedStation) || stations[0];
  }, [selectedStation, stations]);

  // Group directories by station for better organization
  const groupedByStation = useMemo(() => {
    if (selectedCategory === 'barangay' && selectedStation === 'all') {
      return filteredData.reduce((acc, item) => {
        const station = item.sk_station;
        if (!acc[station]) {
          acc[station] = [];
        }
        acc[station].push(item);
        return acc;
      }, {});
    }
    return null;
  }, [filteredData, selectedCategory, selectedStation]);

  // Get organization chart data for a specific station
  const getStationOrgChartData = (stationName) => {
    return directoryData.filter(item => 
      item.sk_station === stationName && 
      item.status === 'published'
    );
  };

  // Handle opening org chart for a station
  const handleOpenOrgChart = (stationName) => {
    setOrgChartStation(stationName);
    setShowOrgChart(true);
  };

  // Function to render table rows
  const renderTableRows = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={5} className="youth-dir-loading-cell">
            <div className="youth-dir-loading">
              <div className="youth-dir-loading-spinner"></div>
              <p className="youth-dir-loading-text">Loading directory data...</p>
            </div>
          </td>
        </tr>
      );
    }
    
    if (filteredData.length === 0) {
      return (
        <tr className="youth-dir-table-no-results">
          <td colSpan={5} className="youth-dir-no-results-cell">
            <div className="youth-dir-no-results">
              <div className="youth-dir-no-results-icon">
                <FaSearch />
              </div>
              <h3 className="youth-dir-no-results-title">No results found</h3>
              <p className="youth-dir-no-results-text">Try adjusting your search or select a different category or station.</p>
              <button 
                className="youth-dir-btn youth-dir-btn-secondary youth-dir-reset-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStation('all');
                }}
              >
                Reset Filters
              </button>
            </div>
          </td>
        </tr>
      );
    }
    
    if (selectedCategory === 'barangay' && selectedStation === 'all' && groupedByStation) {
      const stationNames = Object.keys(groupedByStation).sort();
      
      return stationNames.map(station => (
        <React.Fragment key={station}>
          <tr className="youth-dir-station-header">
            <td colSpan={5}>
              <div className="youth-dir-station-title">
                <FaBuilding className="youth-dir-station-icon" />
                {station} Barangay
                <button 
                  className="youth-dir-view-org-btn"
                  onClick={() => handleOpenOrgChart(station)}
                  title={`View ${station} Organizational Chart`}
                >
                  <FaNetworkWired /> View Org Chart
                </button>
              </div>
            </td>
          </tr>
          {groupedByStation[station].map(item => renderDirectoryRow(item))}
        </React.Fragment>
      ));
    }
    
    return filteredData.map(item => renderDirectoryRow(item));
  };
  
  // Function to render a single directory row
  const renderDirectoryRow = (item) => (
    <tr key={item.id} className="youth-dir-table-row">
      <td className="youth-dir-table-role">
        <div className="youth-dir-role-container">
          <span className="youth-dir-role-text">{item.role}</span>
        </div>
      </td>
      <td className="youth-dir-name-cell">
        <div className="youth-dir-name-container">
          <span className="youth-dir-name">{item.name}</span>
        </div>
      </td>
      <td className="youth-dir-phone-cell">
        {item.phone ? (
          <a href={`tel:${item.phone}`} className="youth-dir-contact-link">
            <FaPhone className="youth-dir-icon" /> <span className="youth-dir-phone">{item.phone}</span>
          </a>
        ) : (
          <span className="youth-dir-na">N/A</span>
        )}
      </td>
      <td className="youth-dir-location-cell">
        {item.location ? (
          <span className="youth-dir-location">
            <FaMapMarkerAlt className="youth-dir-icon" /> <span className="youth-dir-location-text">{item.location}</span>
          </span>
        ) : (
          <span className="youth-dir-na">N/A</span>
        )}
      </td>
      <td className="youth-dir-email-cell">
        {item.email ? (
          <a href={`mailto:${item.email}`} className="youth-dir-contact-link youth-dir-email">
            <FaEnvelope className="youth-dir-icon" /> <span className="youth-dir-email-text">{item.email}</span>
          </a>
        ) : (
          <span className="youth-dir-na">N/A</span>
        )}
      </td>
    </tr>
  );

  // Function to get active filter description
  const getFilterDescription = () => {
    let description = activeCategory.description;

    if (selectedStation !== 'all') {
      description += ` from ${selectedStation}`;
    }

    return description;
  };

  return (
    <YouthLayout>
      <div className="youth-page">
        <section className="youth-dir-banner">
          <div className="youth-dir-banner-content">
            <h1 className="youth-dir-banner-title">OFFICIAL DIRECTORY</h1>
            <p className="youth-dir-banner-subtitle">Connect with Sangguniang Kabataan officers and departments</p>
          </div>
        </section>
        
        <div className="youth-dir-main-wrapper">
          <div className="youth-dir-content-wrapper">
            <div className="youth-dir-table-container">
              <div className="youth-dir-table-header">
                <div className="youth-dir-table-header-content">
                  <div className="youth-dir-table-header-icon">
                    {selectedStation !== 'all' ? <FaBuilding /> : <FaUserCircle />}
                  </div>
                  <div>
                    <h2 className="youth-dir-table-title">
                      {selectedStation !== 'all' ? `${selectedStation} - ${activeCategory.name}` : activeCategory.name}
                    </h2>
                    <p className="youth-dir-table-description">{getFilterDescription()}</p>
                  </div>
                </div>
              </div>
              
              <div className="youth-dir-table-responsive">
                <table className="youth-dir-table">
                  <thead>
                    <tr>
                      <th>Position/Role</th>
                      <th>Name</th>
                      <th>Contact Number</th>
                      <th>Office Location</th>
                      <th>Email Address</th>
                    </tr>
                  </thead>
                  <tbody className={isFiltering ? 'youth-dir-table-filtering' : ''}>
                    {renderTableRows()}
                  </tbody>
                </table>
              </div>
              
              {filteredData.length > 0 && (
                <div className="youth-dir-table-footer">
                  <p className="youth-dir-results-counter">Showing <strong>{filteredData.length}</strong> of <strong>{directoryData.length}</strong> entries</p>
                </div>
              )}
            </div>
            
            <div className="youth-dir-directory-info">
              <div className="youth-dir-info-card">
                <div className="youth-dir-info-card-icon">
                  <FaUserCircle />
                </div>
                <div className="youth-dir-info-card-content">
                  <h3 className="youth-dir-info-card-title">Need Assistance?</h3>
                  <p className="youth-dir-info-card-text">
                    For more information or assistance, please contact the SK Federation Office at 
                    <a href="tel:+6328643111" className="youth-dir-info-link">
                      <FaPhone className="youth-dir-icon" /> (02) 8643-1111
                    </a> local 1700 or email 
                    <a href="mailto:sk@pasigcity.gov.ph" className="youth-dir-info-link">
                      <FaEnvelope className="youth-dir-icon" /> sk@pasigcity.gov.ph
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="youth-dir-sidebar">
            <div className="youth-dir-sidebar-card youth-dir-search-sidebar">
              <h3 className="youth-dir-section-heading">
                <FaSearch className="youth-dir-section-icon" />
                Find Contact Information
              </h3>
              <div className="youth-dir-search-container-sidebar">
                <div className="youth-dir-search-input-wrapper">
                  <FaSearch className="youth-dir-search-icon" />
                  <input 
                    type="text" 
                    className="youth-dir-search-input" 
                    placeholder="Search by name or position..." 
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                <button 
                  className="youth-dir-btn youth-dir-btn-primary youth-dir-search-btn" 
                  onClick={filterData}
                >
                  <FaSearch /> Search
                </button>
              </div>
            </div>
            
            {/* Station Filter Sidebar Card */}
            <div className="youth-dir-sidebar-card">
              <h3 className="youth-dir-section-heading">
                <FaBuilding className="youth-dir-section-icon" />
                Barangay Stations
              </h3>
              <ul className="youth-dir-category-list">
                {stations.map(station => (
                  <li 
                    key={station.id} 
                    className={`youth-dir-category-item ${selectedStation === station.id ? 'active' : ''}`}
                  >
                    <a 
                      href="#" 
                      className="youth-dir-category-link"
                      onClick={(e) => {
                        e.preventDefault();
                        handleStationSelect(station.id);
                      }}
                    >
                      <FaChevronRight className="youth-dir-category-icon" />
                      {station.name}
                      {station.id !== 'all' && (
                        <button 
                          className="youth-dir-org-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOrgChart(station.id);
                          }}
                          title={`View ${station.name} Organization Chart`}
                        >
                          <FaNetworkWired />
                        </button>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="youth-dir-sidebar-card">
              <h3 className="youth-dir-section-heading">
                <FaFilter className="youth-dir-section-icon" />
                Directory Categories
              </h3>
              <ul className="youth-dir-category-list">
                {categories.map(category => (
                  <li 
                    key={category.id} 
                    className={`youth-dir-category-item ${selectedCategory === category.id ? 'active' : ''}`}
                  >
                    <a 
                      href="#" 
                      className="youth-dir-category-link"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCategorySelect(category.id);
                      }}
                    >
                      <FaChevronRight className="youth-dir-category-icon" />
                      {category.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="youth-dir-sidebar-card">
              <h3 className="youth-dir-section-heading">
                <FaCalendarDay className="youth-dir-section-icon" />
                Office Hours
              </h3>
              <div className="youth-dir-office-hours">
                <div className="youth-dir-schedule-item">
                  <div className="youth-dir-schedule-day">
                    <FaCalendarDay className="youth-dir-icon" /> Monday - Friday
                  </div>
                  <div className="youth-dir-schedule-time">8:00 AM - 5:00 PM</div>
                </div>
                <div className="youth-dir-schedule-item">
                  <div className="youth-dir-schedule-day">
                    <FaCalendarDay className="youth-dir-icon" /> Saturday
                  </div>
                  <div className="youth-dir-schedule-time">8:00 AM - 12:00 PM</div>
                </div>
                <div className="youth-dir-schedule-item">
                  <div className="youth-dir-schedule-day">
                    <FaCalendarDay className="youth-dir-icon" /> Sunday
                  </div>
                  <div className="youth-dir-schedule-time">Closed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Organization Chart Modal */}
        <OrganizationChartModal
          show={showOrgChart}
          onClose={() => setShowOrgChart(false)}
          data={getStationOrgChartData(orgChartStation)}
          stationName={orgChartStation}
        />
      </div>
    </YouthLayout>
  );
};

export default Directory;