import React, { useState, useEffect, useContext } from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';
import axios from 'axios';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import DemographicsReportExport from './DemographicsReportExport';
import '../css/Demographics.css';
import { AuthContext } from '../../Contexts/AuthContext'; // Import AuthContext

// Register ChartDataLabels plugin
Chart.register(ChartDataLabels);

const Demographics = () => {
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [barangays, setBarangays] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [matchingCount, setMatchingCount] = useState(0);
  const [expandedSections, setExpandedSections] = useState([0]);
  const [isSearching, setIsSearching] = useState(false);
  const { skUser } = useContext(AuthContext); // Get user from context
  
  // Determine if user is federation admin (can see all barangays)
  const isFederationAdmin = skUser?.sk_role === 'Federasyon';
  
  // Simplified state for filters
  const [filters, setFilters] = useState({
    gender: [],
    civilStatus: [],
    youthAgeGroup: [],
    youthClassification: [],
    educationalBackground: [],
    workStatus: [],
    skVoter: [],
    nationalVoter: [],
    didVoteLastElection: [],
    kkAttendance: [],
    kkAssemblyAttendanceTimes: [],
    reasonForNotAttending: [],
    // Additional filters
    soloParent: [],
    pwd: [],
    athlete: [],
    scholar: [],
    pasigScholar: [],
    workingStatus: [],
    licensedProfessional: [],
    youthOrg: [],
    lgbtqiaMember: []
  });

  const filterOptions = {
    gender: ['Male', 'Female'],
    youthAgeGroup: ['Child Youth (15-17)', 'Core Youth (18-24)', 'Young Adult (25-30)'],
    civilStatus: ['Single', 'Married', 'Widowed', 'Divorced', 'Separated', 'Annulled', 'Unknown', 'Live-in'],
    youthClassification: [
      'In School Youth', 
      'Out of School Youth', 
      'Working Youth',
      'Youth with Specific Needs: Person w/ Disability',
      'Youth with Specific Needs: Children in Conflic w/ Law',
      'Youth with Specific Needs: Indigenous People'
    ],
    educationalBackground: [
      'Elementary Level',
      'Elementary Grad',
      'High School Level',
      'High School Grad',
      'Vocational Grad',
      'College Level',
      'College Grad',
      'Masters Level',
      'Masters Grad',
      'Doctorate Level',
      'Doctorate Grad'
    ],
    workStatus: [
      'Employed',
      'Unemployed',
      'Self Employed',
      'Currently Looking For a Job',
      'Not Interested Looking For a Job'
    ],
    yesNoOptions: ['Yes', 'No'],
    kkAssemblyAttendanceTimes: ['1-2 Times', '3-4 Times', '5 and above'],
    reasonForNotAttending: ['There was no KK Assembly Meeting', 'Not Interested to Attend']
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        // Build query parameters
        let params = new URLSearchParams();
        
        // If not federation admin, filter by user's barangay
        if (skUser && !isFederationAdmin) {
          params.append('barangay', skUser.sk_station);
        }
        
        // Make the API call with the params
        const response = await axios.get(`/api/profiles?${params.toString()}`);
        setProfiles(response.data);
  
        // Set predefined barangays
        const predefinedBarangays = [
          'Dela Paz', 
          'Manggahan', 
          'Maybunga', 
          'Pinagbuhatan', 
          'Rosario', 
          'San Miguel', 
          'Santa Lucia', 
          'Santolan'
        ];
        setBarangays(predefinedBarangays);
        
        // Set default selected barangay based on user role
        if (skUser && !isFederationAdmin) {
          setSelectedBarangay(skUser.sk_station);
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
      }
    };
  
    fetchProfiles();
  }, [skUser, isFederationAdmin]);
  
  useEffect(() => {
    // Filter profiles by selected barangay
    if (selectedBarangay) {
      setFilteredProfiles(profiles.filter((profile) => profile.barangay === selectedBarangay));
    } else {
      // If no barangay is selected, show only data from user's barangay if not federation admin
      if (skUser && !isFederationAdmin) {
        setFilteredProfiles(profiles.filter((profile) => profile.barangay === skUser.sk_station));
      } else {
        setFilteredProfiles(profiles); // Show all profiles if federation admin and no barangay selected
      }
    }
  }, [selectedBarangay, profiles, skUser, isFederationAdmin]);

  const handleBarangayChange = (event) => {
    setSelectedBarangay(event.target.value);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const toggleSection = (index) => {
    if (expandedSections.includes(index)) {
      setExpandedSections(expandedSections.filter(i => i !== index));
    } else {
      setExpandedSections([...expandedSections, index]);
    }
  };

  function countData(field, excludeNA = false) {
    const counts = {};
  
    filteredProfiles.forEach((profile) => {
      const value = profile[field];
  
      // Exclude "n/a" if excludeNA is true
      if (excludeNA && (value === "N/A" || value === "n/a" || value === null || value === "")) {
        return;
      }
  
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
  
    return counts;
  }

  const handleCheckboxChange = (filterKey, options) => (event) => {
    const { value, checked } = event.target;
    
    setFilters(prevFilters => {
      const currentFilter = [...prevFilters[filterKey]];
      
      if (value === "All") {
        if (checked) {
          // Update DOM checkboxes
          document.querySelectorAll(`input[name="${event.target.name}"]`).forEach(checkbox => {
            checkbox.checked = true;
          });
          return {
            ...prevFilters,
            [filterKey]: ["All", ...options]
          };
        } else {
          // Update DOM checkboxes
          document.querySelectorAll(`input[name="${event.target.name}"]`).forEach(checkbox => {
            checkbox.checked = false;
          });
          return {
            ...prevFilters,
            [filterKey]: []
          };
        }
      } else {
        let newFilter;
        if (checked) {
          newFilter = [...currentFilter, value];
          
          // Check if all options are now selected
          const allOptionsSelected = options.every(opt => 
            newFilter.includes(opt) || opt === "All"
          );
          
          if (allOptionsSelected && options.length + 1 === newFilter.length) {
            newFilter.push("All");
            // Check "All" checkbox in DOM
            const allCheckbox = document.querySelector(`input[name="${event.target.name}"][value="All"]`);
            if (allCheckbox) allCheckbox.checked = true;
          }
        } else {
          newFilter = currentFilter.filter(filter => filter !== value && filter !== "All");
          // Uncheck "All" checkbox in DOM
          const allCheckbox = document.querySelector(`input[name="${event.target.name}"][value="All"]`);
          if (allCheckbox) allCheckbox.checked = false;
        }
        
        return {
          ...prevFilters,
          [filterKey]: newFilter
        };
      }
    });
  };

  const handleSearch = () => {
    setIsSearching(true);
    let filtered = filteredProfiles;

    // Apply all active filters
    Object.entries(filters).forEach(([key, values]) => {
      if (values.length && !values.includes('All')) {
        switch(key) {
          case 'youthAgeGroup':
            filtered = filtered.filter((p) => {
              let ageGroup = '';
              if (p.age >= 15 && p.age <= 17) {
                ageGroup = 'Child Youth (15-17)';
              } else if (p.age >= 18 && p.age <= 24) {
                ageGroup = 'Core Youth (18-24)';
              } else if (p.age >= 25 && p.age <= 30) {
                ageGroup = 'Young Adult (25-30)';
              }
              return values.includes(ageGroup);
            });
            break;
          case 'kkAssemblyAttendanceTimes':
          case 'reasonForNotAttending':
            filtered = filtered.filter((p) => {
              if (p[key] === "N/A" || p[key] === "n/a") {
                return false;
              }
              return values.includes(p[key]);
            });
            break;
          default:
            filtered = filtered.filter((p) => values.includes(p[key]));
        }
      }
    });
    
    // Check if any filters are applied
    const filtersApplied = Object.values(filters).some(values => values.length > 0);
    setMatchingCount(filtersApplied ? filtered.length : 0);
    
    // Simulate loading for better UX
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  };

  const handleReset = () => {
    // Reset all filters
    setFilters({
      gender: [],
      civilStatus: [],
      youthAgeGroup: [],
      youthClassification: [],
      educationalBackground: [],
      workStatus: [],
      skVoter: [],
      nationalVoter: [],
      didVoteLastElection: [],
      kkAttendance: [],
      kkAssemblyAttendanceTimes: [],
      reasonForNotAttending: [],
      soloParent: [],
      pwd: [],
      athlete: [],
      scholar: [],
      pasigScholar: [],
      workingStatus: [],
      licensedProfessional: [],
      youthOrg: [],
      lgbtqiaMember: []
    });
    
    // Reset all checkboxes in DOM
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Reset matching count
    setMatchingCount(0);
  };

  // Compute summary statistics
  const totalKKNumber = filteredProfiles.length; 
  const totalMale = filteredProfiles.filter(profile => profile.gender === 'Male').length; 
  const totalFemale = filteredProfiles.filter(profile => profile.gender === 'Female').length;
  const malePercent = totalKKNumber > 0 ? (totalMale / totalKKNumber * 100).toFixed(1) : 0;
  const femalePercent = totalKKNumber > 0 ? (totalFemale / totalKKNumber * 100).toFixed(1) : 0;
  
  // Number of profiles with age data
  const profilesWithAge = filteredProfiles.filter(p => p.age).length;
  
  // Calculate age group counts
  const childYouthCount = filteredProfiles.filter(p => p.age >= 15 && p.age <= 17).length;
  const coreYouthCount = filteredProfiles.filter(p => p.age >= 18 && p.age <= 24).length;
  const youngAdultCount = filteredProfiles.filter(p => p.age >= 25 && p.age <= 30).length;
  const otherAgeCount = filteredProfiles.filter(p => !p.age || p.age < 15 || p.age > 30).length;

  // Data generation functions for charts
  const generatePieData = (dataObject, yesNoColors = false) => {
    const labels = Object.keys(dataObject);
    const data = Object.values(dataObject);
  
    let backgroundColor;
    if (yesNoColors) {
      const yesIndex = labels.indexOf("Yes");
      const noIndex = labels.indexOf("No");
      backgroundColor = labels.map((label, index) =>
        index === yesIndex ? "#28a745" : index === noIndex ? "#dc3545" : "#007bff"
      );
    } else {
      backgroundColor = [
        "#4ECDC4", "#FF6B6B", "#FFE66D", "#1A535C", "#F7FFF7", 
        "#FF9F1C", "#2EC4B6", "#E71D36", "#011627", "#FDFFFC",
        "#7400B8", "#5E60CE", "#48BFE3", "#80FFDB", "#81B29A"
      ];
    }
  
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 0
        },
      ],
    };
  };

  const pieOptionsWithPercentages = {
    plugins: {
      datalabels: {
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
          if (total === 0) return '';
          const percentage = ((value / total) * 100).toFixed(1) + '%';
          return percentage;
        },
        color: '#fff',
        font: {
          weight: 'bold',
          size: 12,
        },
        display: function(context) {
          const value = context.dataset.data[context.dataIndex];
          return value > 0;
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const dataset = context.dataset;
            const total = dataset.data.reduce((acc, val) => acc + val, 0);
            const value = dataset.data[context.dataIndex];
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      }
    },
    maintainAspectRatio: false,
    responsive: true,
    cutout: '65%'
  };
  
  const doughnutOptions = {
    ...pieOptionsWithPercentages,
    cutout: '50%'
  };

  const barOptions = {
    plugins: {
      legend: {
        display: false
      },
      datalabels: {
        formatter: (value) => {
          return value > 0 ? value : '';
        },
        color: '#fff',
        anchor: 'end',
        align: 'start',
        font: {
          size: 11,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },
    maintainAspectRatio: false,
    responsive: true
  };

  // Data for Gender Distribution
  const genderData = {
    labels: ['Male', 'Female'],
    datasets: [
      {
        data: [totalMale, totalFemale],
        backgroundColor: ['#36A2EB', '#FF6384'],
        borderWidth: 0
      }
    ]
  };

  // Data for Age Group Distribution
  const youthAgeGroupData = {
    labels: ['Child Youth (15-17 yrs)', 'Core Youth (18-24 yrs)', 'Young Adult (25-30 yrs)'],
    datasets: [
      {
        label: 'Number of People',
        data: [childYouthCount, coreYouthCount, youngAdultCount],
        backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'],
        borderWidth: 1,
      },
    ],
  };

  // Data for Education Distribution
  const educationData = generatePieData(countData("educational_background"));

  // Data for Civil Status Distribution
  const civilStatusData = generatePieData(countData("civil_status"));

  // Data for Voter Status
  const voterData = {
    labels: ['SK Voters', 'Non-SK Voters', 'National Voters', 'Non-National Voters'],
    datasets: [
      {
        label: 'Number of People',
        data: [
          filteredProfiles.filter(p => p.sk_voter === 'Yes').length,
          filteredProfiles.filter(p => p.sk_voter === 'No').length,
          filteredProfiles.filter(p => p.national_voter === 'Yes').length,
          filteredProfiles.filter(p => p.national_voter === 'No').length
        ],
        backgroundColor: ['#28a745', '#dc3545', '#17a2b8', '#6c757d'],
        borderWidth: 0
      }
    ]
  };

  // Data for Employment Status
  const employmentData = {
    labels: Object.keys(countData("work_status")),
    datasets: [
      {
        label: 'Work Status',
        data: Object.values(countData("work_status")),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  };

  // Simplified KK Attendance data for Overview tab
  const kkAttendanceOverview = {
    labels: ['Attended KK Assembly', 'Did Not Attend KK Assembly'],
    datasets: [
      {
        data: [
          filteredProfiles.filter(p => p.kk_assembly_attendance === 'Yes').length,
          filteredProfiles.filter(p => p.kk_assembly_attendance === 'No').length
        ],
        backgroundColor: ['#28a745', '#dc3545'],
        borderWidth: 0
      }
    ]
  };

  // Community Involvement Data
  const communityInvolvementData = {
    labels: ['Youth Org Members', 'Athletes', 'Scholars', 'PWD'],
    datasets: [
      {
        label: 'Number of People',
        data: [
          filteredProfiles.filter(p => p.youth_org === 'Yes').length,
          filteredProfiles.filter(p => p.athlete === 'Yes').length,
          filteredProfiles.filter(p => p.scholar === 'Yes').length,
          filteredProfiles.filter(p => p.pwd === 'Yes').length
        ],
        backgroundColor: ['#4ECDC4', '#FF6B6B', '#FFE66D', '#1A535C'],
        borderWidth: 0
      }
    ]
  };

  // Monthly Income Range data
  const monthlyIncomeData = {
    labels: [
      'Below ₱50,000', 
      '₱50,001 to ₱100,000', 
      '₱100,001 to ₱150,000',
      '₱150,001 to ₱200,000',
      '₱200,001 to ₱250,000',
      'Above ₱250,000',
      'Prefer not to disclose'
    ],
    datasets: [
      {
        label: 'Number of People',
        data: [
          filteredProfiles.filter(p => p.monthly_income === 'Below ₱50,000').length,
          filteredProfiles.filter(p => p.monthly_income === '₱50,001 to ₱100,000').length,
          filteredProfiles.filter(p => p.monthly_income === '₱100,001 to ₱150,000').length,
          filteredProfiles.filter(p => p.monthly_income === '₱150,001 to ₱200,000').length,
          filteredProfiles.filter(p => p.monthly_income === '₱200,001 to ₱250,000').length,
          filteredProfiles.filter(p => p.monthly_income === 'Above ₱250,000').length,
          filteredProfiles.filter(p => p.monthly_income === 'Prefer to not disclose').length
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)', 
          'rgba(153, 102, 255, 0.8)', 
          'rgba(255, 159, 64, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(169, 169, 169, 0.8)'
        ],
        borderWidth: 0
      },
    ],
  };

  return (
    <div className="demographics-dashboard">
      {/* Header Section - Updated layout with barangay filter on left */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="header-title">
            <h1>Demographics Dashboard</h1>
            <p>{selectedBarangay || (skUser && !isFederationAdmin ? skUser.sk_station : 'All Barangays')} • {filteredProfiles.length} Youth Profiles</p>
          </div>
          
          {/* Only show barangay dropdown for federation admins */}
          {isFederationAdmin && (
            <div className="barangay-dropdown-container ">
              <select
                id="barangay-select"
                value={selectedBarangay}
                onChange={handleBarangayChange}
                className="barangay-dropdown"
              >
                <option value="">All Barangays</option>
                {barangays.map((barangay) => (
                  <option key={barangay} value={barangay}>
                    {barangay}
                  </option>
                ))}
              </select>
              <span className="dropdown-icon">
                <FaChevronDown />
              </span>
            </div>
          )}
          
          {/* For non-federation users, show a static indicator of their barangay */}
          {!isFederationAdmin && skUser && (
            <div className="barangay-indicator">
              <span className="badge bg-primary">Barangay: {skUser.sk_station}</span>
            </div>
          )}
        </div>
        
        <div className="header-right">
          <DemographicsReportExport 
            profiles={profiles}
            filteredProfiles={filteredProfiles}
            selectedBarangay={selectedBarangay || (skUser && !isFederationAdmin ? skUser.sk_station : '')}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="demographics-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'detailed' ? 'active' : ''}`}
          onClick={() => handleTabChange('detailed')}
        >
          Detailed Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => handleTabChange('search')}
        >
          Advanced Search
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card total-profiles">
          <div className="stat-content">
            <div className="stat-value">{totalKKNumber}</div>
            <div className="stat-label">Total Profiles</div>
          </div>
          <div className="stat-icon kk-icon"></div>
        </div>
        
        <div className="stat-card male-profiles">
          <div className="stat-content">
            <div className="stat-value">{totalMale}</div>
            <div className="stat-label">Male ({malePercent}%)</div>
          </div>
          <div className="stat-icon male-icon"></div>
        </div>
        
        <div className="stat-card female-profiles">
          <div className="stat-content">
            <div className="stat-value">{totalFemale}</div>
            <div className="stat-label">Female ({femalePercent}%)</div>
          </div>
          <div className="stat-icon female-icon"></div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="tab-content overview-tab">
          {/* Row 1: Gender and Age Distribution */}
          <div className="chart-row">
            <div className="chart-container">
              <h3>Gender Distribution</h3>
              <div className="chart-wrapper">
                <Doughnut data={genderData} options={doughnutOptions} />
              </div>
            </div>
            
            <div className="chart-container">
              <h3>Age Group Distribution</h3>
              <div className="chart-wrapper">
                <Bar data={youthAgeGroupData} options={barOptions} />
              </div>
            </div>
          </div>

          {/* Row 2: Civil Status and Education */}
          <div className="chart-row">
            <div className="chart-container">
              <h3>Civil Status</h3>
              <div className="chart-wrapper">
                <Doughnut data={civilStatusData} options={doughnutOptions} />
              </div>
            </div>
            
            <div className="chart-container">
              <h3>Educational Background</h3>
              <div className="chart-wrapper">
                <Doughnut data={educationData} options={doughnutOptions} />
              </div>
            </div>
          </div>

          {/* Row 3: Voter Status and KK Assembly */}
          <div className="chart-row">
            <div className="chart-container">
              <h3>Voter Status</h3>
              <div className="chart-wrapper">
                <Bar data={voterData} options={barOptions} />
              </div>
            </div>
            
            <div className="chart-container">
              <h3>KK Assembly Attendance</h3>
              <div className="chart-wrapper">
                <Doughnut data={kkAttendanceOverview} options={doughnutOptions} />
              </div>
            </div>
          </div>

          {/* Row 4: Community Involvement and Employment */}
          <div className="chart-row">
            <div className="chart-container">
              <h3>Community Involvement</h3>
              <div className="chart-wrapper">
                <Bar data={communityInvolvementData} options={barOptions} />
              </div>
            </div>
            
            <div className="chart-container">
              <h3>Employment Status</h3>
              <div className="chart-wrapper">
                <Doughnut data={employmentData} options={doughnutOptions} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'detailed' && (
        <div className="tab-content detailed-tab">
          <div className="chart-grid">
            <div className="chart-card">
              <h4>Youth Classification</h4>
              <div className="chart-wrapper">
                <Pie 
                  data={generatePieData(countData("youth_classification"))}
                  options={pieOptionsWithPercentages}
                />
              </div>
            </div>
            
            <div className="chart-card">
              <h4>Work Status</h4>
              <div className="chart-wrapper">
                <Pie
                  data={generatePieData(countData("work_status"))}
                  options={pieOptionsWithPercentages}
                />
              </div>
            </div>
            
            <div className="chart-card">
              <h4>SK Voters</h4>
              <div className="chart-wrapper">
                <Pie
                  data={generatePieData(countData('sk_voter'), true)}
                  options={pieOptionsWithPercentages}
                />
              </div>
            </div>
            
            <div className="chart-card">
              <h4>National Registered Voters</h4>
              <div className="chart-wrapper">
                <Pie
                  data={generatePieData(countData('national_voter'), true)}
                  options={pieOptionsWithPercentages}
                />
              </div>
            </div>
            
            <div className="chart-card">
              <h4>Voted Last SK Election</h4>
              <div className="chart-wrapper">
                <Pie
                  data={generatePieData(countData("did_vote_last_election"), true)}
                  options={pieOptionsWithPercentages}
                />
              </div>
            </div>
            
            <div className="chart-card">
              <h4>KK Assembly Attendance</h4>
              <div className="chart-wrapper">
                <Pie
                  data={generatePieData(countData("kk_assembly_attendance"), true)}
                  options={pieOptionsWithPercentages}
                />
              </div>
            </div>
            
            <div className="chart-card">
              <h4>KK Assembly Attendance Times</h4>
              <div className="chart-wrapper">
                <Pie
                  data={generatePieData(countData("kk_assembly_attendance_times", true))}
                  options={pieOptionsWithPercentages}
                />
              </div>
            </div>
            
            <div className="chart-card">
              <h4>Reasons for Not Attending KK Assembly</h4>
              <div className="chart-wrapper">
                <Pie
                  data={generatePieData(countData("reason_for_not_attending", true))}
                  options={pieOptionsWithPercentages}
                />
              </div>
            </div>
            
            <div className="chart-card">
              <h4>Solo Parents</h4>
              <div className="chart-wrapper">
                <Pie
                  data={generatePieData(countData("soloparent"), true)}
                  options={pieOptionsWithPercentages}
                />
              </div>
            </div>
            
            <div className="chart-card">
              <h4>PWD Status</h4>
              <div className="chart-wrapper">
                <Pie
                  data={generatePieData(countData("pwd"), true)}
                  options={pieOptionsWithPercentages}
                />
              </div>
            </div>
            
            <div className="chart-card">
              <h4>Athletes</h4>
              <div className="chart-wrapper">
                <Pie
                 data={generatePieData(countData("athlete"), true)}
                 options={pieOptionsWithPercentages}
               />
             </div>
           </div>
           
           <div className="chart-card">
             <h4>Scholars</h4>
             <div className="chart-wrapper">
               <Pie
                 data={generatePieData(countData("scholar"), true)}
                 options={pieOptionsWithPercentages}
               />
             </div>
           </div>
           
           <div className="chart-card wide">
             <h4>Monthly Income Range</h4>
             <div className="chart-wrapper">
               <Bar data={monthlyIncomeData} options={barOptions} />
             </div>
           </div>
           
           <div className="chart-card">
             <h4>Pasig Scholars</h4>
             <div className="chart-wrapper">
               <Pie
                 data={generatePieData(countData("pasigscholar"), true)}
                 options={pieOptionsWithPercentages}
               />
             </div>
           </div>
           
           <div className="chart-card">
             <h4>Currently Working</h4>
             <div className="chart-wrapper">
               <Pie
                 data={generatePieData(countData("working_status"), true)}
                 options={pieOptionsWithPercentages}
               />
             </div>
           </div>
           
           <div className="chart-card">
             <h4>Licensed Professionals</h4>
             <div className="chart-wrapper">
               <Pie
                 data={generatePieData(countData("licensed_professional"), true)}
                 options={pieOptionsWithPercentages}
               />
             </div>
           </div>
           
           <div className="chart-card">
             <h4>Youth Organization Members</h4>
             <div className="chart-wrapper">
               <Pie
                 data={generatePieData(countData("youth_org"), true)}
                 options={pieOptionsWithPercentages}
               />
             </div>
           </div>
           
           <div className="chart-card">
             <h4>LGBTQIA+ Community</h4>
             <div className="chart-wrapper">
               <Pie
                 data={generatePieData(countData("lgbtqia_member"), true)}
                 options={pieOptionsWithPercentages}
               />
             </div>
           </div>
           
           <div className="chart-card">
             <h4>Student Level Distribution</h4>
             <div className="chart-wrapper">
               <Pie
                 data={generatePieData(countData("studying_level"))}
                 options={pieOptionsWithPercentages}
               />
             </div>
           </div>
         </div>
       </div>
     )}

     {activeTab === 'search' && (
       <div className="tab-content search-tab">
         <div className="search-container">
           <div className="search-header">
             <h3>Advanced Search</h3>
             {matchingCount > 0 && (
               <div className="matching-count">
                 Matching Profiles: <span>{matchingCount}</span>
               </div>
             )}
           </div>
           
           {/* Accordion Sections for Search */}
           <div className="accordion">
             {/* Basic Information Section */}
             <div className="accordion-item">
               <div 
                 className={`accordion-header ${expandedSections.includes(0) ? 'active' : ''}`}
                 onClick={() => toggleSection(0)}
               >
                 <h4>Basic Information</h4>
                 <span className="accordion-icon">
                   {expandedSections.includes(0) ? <FaChevronDown /> : <FaChevronRight />}
                 </span>
               </div>
               {expandedSections.includes(0) && (
                 <div className="accordion-content">
                   <div className="search-row">
                     <div className="search-group">
                       <h5>Gender</h5>
                       <div className="checkbox-inline">
                         <label>
                           <input 
                             type="checkbox" 
                             name="gender"
                             value="All" 
                             onChange={handleCheckboxChange('gender', filterOptions.gender)} 
                           /> All
                         </label>
                         {filterOptions.gender.map(option => (
                           <label key={option}>
                             <input 
                               type="checkbox" 
                               name="gender"
                               value={option} 
                               onChange={handleCheckboxChange('gender', filterOptions.gender)} 
                             /> {option}
                           </label>
                         ))}
                       </div>
                     </div>
                   </div>

                   <div className="search-row">
                     <div className="search-group">
                       <h5>Youth Age Group</h5>
                       <div className="checkbox-grid">
                         <label>
                           <input 
                             type="checkbox" 
                             name="youthAgeGroup"
                             value="All" 
                             onChange={handleCheckboxChange('youthAgeGroup', filterOptions.youthAgeGroup)} 
                           /> All
                         </label>
                         {filterOptions.youthAgeGroup.map(option => (
                           <label key={option}>
                             <input 
                               type="checkbox" 
                               name="youthAgeGroup"
                               value={option} 
                               onChange={handleCheckboxChange('youthAgeGroup', filterOptions.youthAgeGroup)} 
                             /> {option}
                           </label>
                         ))}
                       </div>
                     </div>
                   </div>

                   <div className="search-row">
                     <div className="search-group">
                       <h5>Civil Status</h5>
                       <div className="checkbox-grid">
                         <label>
                           <input 
                             type="checkbox" 
                             name="civilStatus"
                             value="All" 
                             onChange={handleCheckboxChange('civilStatus', filterOptions.civilStatus)} 
                           /> All
                         </label>
                         {filterOptions.civilStatus.map(option => (
                           <label key={option}>
                             <input 
                               type="checkbox" 
                               name="civilStatus"
                               value={option} 
                               onChange={handleCheckboxChange('civilStatus', filterOptions.civilStatus)} 
                             /> {option}
                           </label>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
               )}
             </div>

             {/* Classification & Education Section */}
             <div className="accordion-item">
               <div 
                 className={`accordion-header ${expandedSections.includes(1) ? 'active' : ''}`}
                 onClick={() => toggleSection(1)}
               >
                 <h4>Classification & Education</h4>
                 <span className="accordion-icon">
                   {expandedSections.includes(1) ? <FaChevronDown /> : <FaChevronRight />}
                 </span>
               </div>
               {expandedSections.includes(1) && (
                 <div className="accordion-content">
                   <div className="search-row">
                     <div className="search-group">
                       <h5>Youth Classification</h5>
                       <div className="checkbox-grid">
                         <label>
                           <input 
                             type="checkbox" 
                             name="youthClassification"
                             value="All" 
                             onChange={handleCheckboxChange('youthClassification', filterOptions.youthClassification)} 
                           /> All
                         </label>
                         {filterOptions.youthClassification.map(option => (
                           <label key={option}>
                             <input 
                               type="checkbox" 
                               name="youthClassification"
                               value={option} 
                               onChange={handleCheckboxChange('youthClassification', filterOptions.youthClassification)} 
                             /> {option.includes('Youth with Specific Needs:') ? option.split(': ')[1] : option}
                           </label>
                         ))}
                       </div>
                     </div>
                   </div>

                   <div className="search-row">
                     <div className="search-group">
                       <h5>Educational Background</h5>
                       <div className="checkbox-grid">
                         <label>
                           <input 
                             type="checkbox" 
                             name="educationalBackground"
                             value="All" 
                             onChange={handleCheckboxChange('educationalBackground', filterOptions.educationalBackground)} 
                           /> All
                         </label>
                         {filterOptions.educationalBackground.map(option => (
                           <label key={option}>
                             <input 
                               type="checkbox" 
                               name="educationalBackground"
                               value={option} 
                               onChange={handleCheckboxChange('educationalBackground', filterOptions.educationalBackground)} 
                             /> {option}
                           </label>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
               )}
             </div>

             {/* Work & Voter Status Section */}
             <div className="accordion-item">
               <div 
                 className={`accordion-header ${expandedSections.includes(2) ? 'active' : ''}`}
                 onClick={() => toggleSection(2)}
               >
                 <h4>Work & Voter Status</h4>
                 <span className="accordion-icon">
                   {expandedSections.includes(2) ? <FaChevronDown /> : <FaChevronRight />}
                 </span>
               </div>
               {expandedSections.includes(2) && (
                 <div className="accordion-content">
                   <div className="search-row">
                     <div className="search-group">
                       <h5>Work Status</h5>
                       <div className="checkbox-grid">
                         <label>
                           <input 
                             type="checkbox" 
                             name="workStatus"
                             value="All" 
                             onChange={handleCheckboxChange('workStatus', filterOptions.workStatus)} 
                           /> All
                         </label>
                         {filterOptions.workStatus.map(option => (
                           <label key={option}>
                             <input 
                               type="checkbox" 
                               name="workStatus"
                               value={option} 
                               onChange={handleCheckboxChange('workStatus', filterOptions.workStatus)} 
                             /> {option}
                           </label>
                         ))}
                       </div>
                     </div>
                   </div>

                   <div className="search-row">
                     <div className="search-group">
                       <h5>SK Voter</h5>
                       <div className="checkbox-inline">
                         <label>
                           <input 
                             type="checkbox" 
                             name="skVoter"
                             value="All" 
                             onChange={handleCheckboxChange('skVoter', filterOptions.yesNoOptions)} 
                           /> All
                         </label>
                         {filterOptions.yesNoOptions.map(option => (
                           <label key={option}>
                             <input 
                               type="checkbox" 
                               name="skVoter"
                               value={option} 
                               onChange={handleCheckboxChange('skVoter', filterOptions.yesNoOptions)} 
                             /> {option}
                           </label>
                         ))}
                       </div>
                     </div>
                   </div>

                   <div className="search-row">
                     <div className="search-group">
                       <h5>National Voter</h5>
                       <div className="checkbox-inline">
                         <label>
                           <input 
                             type="checkbox" 
                             name="nationalVoter"
                             value="All" 
                             onChange={handleCheckboxChange('nationalVoter', filterOptions.yesNoOptions)} 
                           /> All
                         </label>
                         {filterOptions.yesNoOptions.map(option => (
                           <label key={option}>
                             <input 
                               type="checkbox" 
                               name="nationalVoter"
                               value={option} 
                               onChange={handleCheckboxChange('nationalVoter', filterOptions.yesNoOptions)} 
                             /> {option}
                           </label>
                         ))}
                       </div>
                     </div>
                   </div>

                   <div className="search-row">
                     <div className="search-group">
                       <h5>Voted Last SK Election</h5>
                       <div className="checkbox-inline">
                         <label>
                           <input 
                             type="checkbox" 
                             name="didVoteLastElection"
                             value="All" 
                             onChange={handleCheckboxChange('didVoteLastElection', filterOptions.yesNoOptions)} 
                           /> All
                         </label>
                         {filterOptions.yesNoOptions.map(option => (
                           <label key={option}>
                             <input 
                               type="checkbox" 
                               name="didVoteLastElection"
                               value={option} 
                               onChange={handleCheckboxChange('didVoteLastElection', filterOptions.yesNoOptions)} 
                             /> {option}
                           </label>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
               )}
             </div>

             {/* Additional Information Section */}
             <div className="accordion-item">
               <div 
                 className={`accordion-header ${expandedSections.includes(3) ? 'active' : ''}`}
                 onClick={() => toggleSection(3)}
               >
                 <h4>Additional Information</h4>
                 <span className="accordion-icon">
                   {expandedSections.includes(3) ? <FaChevronDown /> : <FaChevronRight />}
                 </span>
               </div>
               {expandedSections.includes(3) && (
                 <div className="accordion-content">
                   <div className="search-row">
                     <div className="search-group">
                       <h5>Solo Parent</h5>
                       <div className="checkbox-inline">
                         <label>
                           <input 
                             type="checkbox" 
                             name="soloParent"
                             value="All" 
                             onChange={handleCheckboxChange('soloParent', filterOptions.yesNoOptions)} 
                           /> All
                         </label>
                         {filterOptions.yesNoOptions.map(option => (
                           <label key={option}>
                             <input 
                               type="checkbox" 
                               name="soloParent"
                               value={option} 
                               onChange={handleCheckboxChange('soloParent', filterOptions.yesNoOptions)} 
                             /> {option}
                           </label>
                         ))}
                       </div>
                     </div>
                   </div>

                   <div className="search-row">
                     <div className="search-group">
                       <h5>PWD</h5>
                       <div className="checkbox-inline">
                         <label>
                           <input 
                             type="checkbox" 
                             name="pwd"
                             value="All" 
                             onChange={handleCheckboxChange('pwd', filterOptions.yesNoOptions)} 
                           /> All
                         </label>
                         {filterOptions.yesNoOptions.map(option => (
                           <label key={option}>
                             <input 
                               type="checkbox" 
                               name="pwd"
                               value={option} 
                               onChange={handleCheckboxChange('pwd', filterOptions.yesNoOptions)} 
                             /> {option}
                           </label>
                         ))}
                       </div>
                     </div>
                   </div>

                   <div className="search-row">
                     <div className="search-group">
                       <h5>Scholar</h5>
                       <div className="checkbox-inline">
                         <label>
                           <input 
                             type="checkbox" 
                             name="scholar"
                             value="All" 
                             onChange={handleCheckboxChange('scholar', filterOptions.yesNoOptions)} 
                           /> All
                         </label>
                         {filterOptions.yesNoOptions.map(option => (
                           <label key={option}>
                             <input 
                               type="checkbox" 
                               name="scholar"
                               value={option} 
                               onChange={handleCheckboxChange('scholar', filterOptions.yesNoOptions)} 
                             /> {option}
                           </label>
                         ))}
                       </div>
                     </div>
                   </div>

                   <div className="search-row">
                     <div className="search-group">
                       <h5>Youth Organization Member</h5>
                       <div className="checkbox-inline">
                         <label>
                           <input 
                             type="checkbox" 
                             name="youthOrg"
                             value="All" 
                             onChange={handleCheckboxChange('youthOrg', filterOptions.yesNoOptions)} 
                           /> All
                         </label>
                         {filterOptions.yesNoOptions.map(option => (
                           <label key={option}>
                             <input 
                               type="checkbox" 
                               name="youthOrg"
                               value={option} 
                               onChange={handleCheckboxChange('youthOrg', filterOptions.yesNoOptions)} 
                             /> {option}
                           </label>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           </div>

           <div className="search-actions">
             <button 
               className="reset-button" 
               onClick={handleReset}
             >
               Reset Filters
             </button>
             <button 
               className="search-button" 
               onClick={handleSearch}
               disabled={isSearching}
             >
               {isSearching ? 'Searching...' : 'Search'}
             </button>
           </div>
         </div>
       </div>
     )}
   </div>
 );
};

export default Demographics;