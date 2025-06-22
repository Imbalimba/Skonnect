// YouthDevelopmentPolicy.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/YouthDevelopmentPolicy.css';
import YouthLayout from '../Components/YouthLayout';
import { FaDownload, FaFilter, FaFileAlt, FaExclamationTriangle } from 'react-icons/fa';

const YouthDevelopmentPolicy = () => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [policyData, setPolicyData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBarangay, setSelectedBarangay] = useState('All');
  const [barangayPolicies, setBarangayPolicies] = useState([]);

  const currentYear = new Date().getFullYear();
  const barangayOptions = ['All', 'Dela Paz', 'Manggahan', 'Maybunga', 'Pinagbuhatan', 'Rosario', 'San Miguel', 'Santa Lucia', 'Santolan'];

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setIsLoading(true);
        const [regularResponse, barangayResponse] = await Promise.all([
          axios.get('/api/policies?archived=false'),
          axios.get('/api/barangay-policies?archived=false')
        ]);
        
        // Combine regular policies and barangay resolutions into categories
        const allCategories = [
          ...new Set([
            ...regularResponse.data.map(policy => policy.category),
            'Barangay Resolutions'
          ])
        ];
        
        setCategories(allCategories);

        if (!activeCategory && allCategories.length > 0) {
          setActiveCategory(allCategories[0]);
        }

        setBarangayPolicies(barangayResponse.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching policies:', error);
        setIsLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  useEffect(() => {
    const fetchCategoryPolicies = async () => {
      if (activeCategory === 'Barangay Resolutions') {
        try {
          let filtered = [...barangayPolicies];
          if (selectedBarangay !== 'All') {
            filtered = filtered.filter(policy => policy.barangay === selectedBarangay);
          }
          setPolicyData(filtered);
        } catch (error) {
          console.error('Error fetching barangay policies:', error);
        }
      } else if (activeCategory) {
        try {
          const response = await axios.get('/api/policies?archived=false');
          const filteredPolicies = response.data.filter(policy => policy.category === activeCategory);
          setPolicyData(filteredPolicies);
        } catch (error) {
          console.error('Error fetching category policies:', error);
        }
      }
    };

    fetchCategoryPolicies();
  }, [activeCategory, selectedBarangay, barangayPolicies]);

  // Group policies by year
  const groupedPolicies = policyData.reduce((groups, policy) => {
    const year = policy.year || 'Unknown';
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(policy);
    return groups;
  }, {});

  const sortedYears = Object.keys(groupedPolicies).sort((a, b) => b - a);

  return (
    <YouthLayout>
      {/* Banner Section */}
      <section className="youth-ydp-banner">
        <div className="youth-ydp-banner-content">
          <h1 className="youth-ydp-banner-title">Youth Development Policies</h1>
          <p className="youth-ydp-banner-subtitle">Empowering the youth through effective governance and policies</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="youth-ydp-main-wrapper">
        <div className="youth-ydp-container">
          <div className="youth-ydp-section">
            {/* Sidebar */}
            <div className="youth-ydp-sidebar">
              <h3 className="youth-ydp-sidebar-heading">Policy Categories</h3>
              <ul className="youth-ydp-categories">
                {categories.map((category) => (
                  <li
                    key={category}
                    className={`youth-ydp-category ${activeCategory === category ? 'youth-ydp-active' : ''}`}
                    onClick={() => setActiveCategory(category)}
                  >
                    <span className="youth-ydp-category-text">{category}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Policy Content */}
            <div className="youth-ydp-content">
              <div className="youth-ydp-title-container">
                <h2 className="youth-ydp-title">{activeCategory}</h2>
                
                {activeCategory === 'Barangay Resolutions' && (
                  <div className="youth-ydp-filter-container">
                    <div className="youth-ydp-filter-label">
                      <FaFilter className="youth-ydp-filter-icon" /> Filter by Barangay:
                    </div>
                    <div className="youth-ydp-barangay-buttons">
                      {barangayOptions.map((barangay) => (
                        <button
                          key={barangay}
                          className={`youth-ydp-barangay-btn ${selectedBarangay === barangay ? 'active' : ''}`}
                          onClick={() => setSelectedBarangay(barangay)}
                        >
                          {barangay}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="youth-ydp-loading">
                  <div className="youth-ydp-loading-spinner"></div>
                  <p className="youth-ydp-loading-text">Loading policies...</p>
                </div>
              ) : policyData.length === 0 ? (
                <div className="youth-ydp-empty">
                  <div className="youth-ydp-empty-icon">
                    <FaExclamationTriangle />
                  </div>
                  <p className="youth-ydp-empty-text">
                    {activeCategory === 'Barangay Resolutions' 
                      ? `No barangay resolutions found${selectedBarangay !== 'All' ? ` for ${selectedBarangay}` : ''}.`
                      : 'No policies found for this category.'}
                  </p>
                </div>
              ) : (
                sortedYears.map((year) => (
                  <div key={year} className="youth-ydp-table-container">
                    <div className="youth-ydp-year-header">
                      <h3 className="youth-ydp-year-title">
                        {year} {activeCategory}
                        {activeCategory === 'Barangay Resolutions' && selectedBarangay !== 'All' && ` (${selectedBarangay})`}
                      </h3>
                    </div>
                    <table className="youth-ydp-table">
                      <thead>
                        <tr>
                          <th className="youth-ydp-th">Title</th>
                          <th className="youth-ydp-th">Description</th>
                          {activeCategory === 'Barangay Resolutions' && <th className="youth-ydp-th">Barangay</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {groupedPolicies[year].map((policy) => (
                          <tr key={policy.id} className="youth-ydp-row">
                            <td className="youth-ydp-title-cell">
                              <a 
                                href={policy.file_url || `/storage/${policy.file_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="youth-ydp-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FaDownload className="youth-ydp-download-icon" />
                                <FaFileAlt className="youth-ydp-file-icon" />
                                <span className="youth-ydp-link-text">{policy.title}</span>
                              </a>
                            </td>
                            <td className="youth-ydp-desc-cell">{policy.description}</td>
                            {activeCategory === 'Barangay Resolutions' && (
                              <td className="youth-ydp-barangay-cell">{policy.barangay}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </YouthLayout>
  );
};

export default YouthDevelopmentPolicy;