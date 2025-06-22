import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Button, Modal, Form, Spinner, Tabs, Tab, Row, Col, Card } from 'react-bootstrap';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { CSVLink } from 'react-csv';
import { 
  FaFilePdf, 
  FaFileExcel, 
  FaFileCsv, 
  FaPrint, 
  FaDownload, 
  FaFilter, 
  FaChartPie, 
  FaTable,
  FaFileAlt,
  FaCog
} from 'react-icons/fa';
import '../css/DemographicsReportExport.css';
import Chart from 'chart.js/auto';

// Import logos
import defaultLogo from '../../assets/logo.png';
import delapazLogo from '../../assets/delapaz_logo.png';
import manggahanLogo from '../../assets/manggahan_logo.png';
import maybungaLogo from '../../assets/maybunga_logo.png';
import pinagbuhatanLogo from '../../assets/pinagbuhatan_logo.png';
import santolanLogo from '../../assets/santolan_logo.png';
import rosarioLogo from '../../assets/rosario_logo.png';
import sanmiguelLogo from '../../assets/sanmiguel_logo.png';
import staLuciaLogo from '../../assets/sta lucia_logo.png';

const DemographicsReportExport = ({ profiles, filteredProfiles: originalFilteredProfiles, selectedBarangay }) => {
  // Logo mapping based on barangay
  const barangayLogos = {
    'default': defaultLogo,
    'Dela Paz': delapazLogo,
    'Manggahan': manggahanLogo,
    'Maybunga': maybungaLogo,
    'Pinagbuhatan': pinagbuhatanLogo,
    'Santolan': santolanLogo,
    'Rosario': rosarioLogo,
    'San Miguel': sanmiguelLogo,
    'Santa Lucia': staLuciaLogo
  };
  
  // Get the appropriate logo based on selected barangay
  const getLogo = () => {
    if (selectedBarangay && barangayLogos[selectedBarangay]) {
      return barangayLogos[selectedBarangay];
    }
    return barangayLogos.default;
  };
  
  // Initial state setup for dates (using proper date strings)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  // Format dates to YYYY-MM-DD for input fields
  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Chart canvas references
  const chartRefs = useRef({
    gender: React.createRef(),
    ageGroup: React.createRef(),
    civilStatus: React.createRef(),
    education: React.createRef(),
    voter: React.createRef(),
    employment: React.createRef(),
    kkAttendance: React.createRef(),
    community: React.createRef(),
    monthlyIncome: React.createRef()
  });
  
  // State for modal and report configuration
  const [showModal, setShowModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('pdf');
  const [reportTemplate, setReportTemplate] = useState('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [previewCharts, setPreviewCharts] = useState(false);
  
  // Report content configuration
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTables, setIncludeTables] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState([
    'gender', 'ageGroup', 'civilStatus', 'education', 'voter', 'employment'
  ]);
  const [selectedTables, setSelectedTables] = useState([
    'genderDistribution', 'ageGroupDistribution', 'civilStatus', 'educationalBackground'
  ]);
  
  // Paper and style settings
  const [paperSize, setPaperSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeDate, setIncludeDate] = useState(true);
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [footerText, setFooterText] = useState('');
  const [colorTheme, setColorTheme] = useState('standard');

   // Color themes
   const colorThemes = {
    standard: {
      primary: '#50606C',
      secondary: '#f1f1f1',
      accent: '#3a4b58'
    },
    green: {
      primary: '#28a745',
      secondary: '#e8f5e9',
      accent: '#1e7e34'
    },
    blue: {
      primary: '#007bff',
      secondary: '#e6f2ff',
      accent: '#0056b3'
    },
    gray: {
      primary: '#6c757d',
      secondary: '#f2f2f2',
      accent: '#555555'
    }
  };

  // Date range filter
  const [dateRange, setDateRange] = useState({
    from: thirtyDaysAgo.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0]
  });
  
  // Advanced filters
  const [advancedFilters, setAdvancedFilters] = useState({
    gender: [],
    ageGroup: [],
    civilStatus: [],
    education: [],
    voterStatus: [],
    employment: [],
    community: []
  });
  
  // Filter options for UI
  const filterOptions = {
    gender: ['Male', 'Female'],
    ageGroup: ['Child Youth (15-17)', 'Core Youth (18-24)', 'Young Adult (25-30)'],
    civilStatus: ['Single', 'Married', 'Widowed', 'Divorced', 'Separated', 'Annulled', 'Live-in', 'Unknown'],
    education: [
      'Elementary Level', 'Elementary Grad', 'High School Level', 'High School Grad',
      'Vocational Grad', 'College Level', 'College Grad', 'Masters Level',
      'Masters Grad', 'Doctorate Level', 'Doctorate Grad'
    ],
    voterStatus: ['SK Voter', 'National Voter', 'Voted Last Election'],
    employment: ['Employed', 'Unemployed', 'Self Employed', 'Currently Looking For a Job', 'Not Interested Looking For a Job'],
    community: ['Youth Org Member', 'Athlete', 'Scholar', 'PWD', 'Solo Parent', 'LGBTQIA+']
  };
  
    // Chart options for selection
  const chartOptions = [
    { id: 'gender', label: 'Gender Distribution' },
    { id: 'ageGroup', label: 'Age Group Distribution' },
    { id: 'civilStatus', label: 'Civil Status Distribution' },
    { id: 'education', label: 'Educational Background' },
    { id: 'voter', label: 'Voter Status' },
    { id: 'employment', label: 'Employment Status' },
    { id: 'kkAttendance', label: 'KK Assembly Attendance' },
    { id: 'community', label: 'Community Involvement' },
    { id: 'monthlyIncome', label: 'Monthly Income Range' }
  ];
  
  // Table options for selection
  const tableOptions = [
    { id: 'genderDistribution', label: 'Gender Distribution' },
    { id: 'ageGroupDistribution', label: 'Age Group Distribution' },
    { id: 'civilStatus', label: 'Civil Status Distribution' },
    { id: 'educationalBackground', label: 'Educational Background' },
    { id: 'workStatus', label: 'Work Status' },
    { id: 'voterStats', label: 'Voter Statistics' },
    { id: 'kkAssembly', label: 'KK Assembly Participation' },
    { id: 'communityInvolvement', label: 'Community Involvement' }
  ];
  
  // Template options
  const templateOptions = [
    { id: 'standard', label: 'Standard Report' },
    { id: 'executive', label: 'Executive Summary' },
    { id: 'detailed', label: 'Detailed Analysis' },
    { id: 'minimal', label: 'Minimal (Data Only)' }
  ];

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  
    // Apply all filters to get final filtered profiles
    const filteredProfiles = React.useMemo(() => {
      // First filter by date range
      let result = originalFilteredProfiles.filter(profile => {
        if (!profile.created_at) return false;
        
        const profileDate = new Date(profile.created_at);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        
        // Set time to midnight for date comparison
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        
        return profileDate >= fromDate && profileDate <= toDate;
      });
      
      // Apply advanced filters
      if (advancedFilters.gender.length > 0) {
        result = result.filter(profile => advancedFilters.gender.includes(profile.gender));
      }
      
      if (advancedFilters.ageGroup.length > 0) {
        result = result.filter(profile => {
          let ageGroup = '';
          if (profile.age >= 15 && profile.age <= 17) {
            ageGroup = 'Child Youth (15-17)';
          } else if (profile.age >= 18 && profile.age <= 24) {
            ageGroup = 'Core Youth (18-24)';
          } else if (profile.age >= 25 && profile.age <= 30) {
            ageGroup = 'Young Adult (25-30)';
          }
          return advancedFilters.ageGroup.includes(ageGroup);
        });
      }
      
      if (advancedFilters.civilStatus.length > 0) {
        result = result.filter(profile => advancedFilters.civilStatus.includes(profile.civil_status));
      }
      
      if (advancedFilters.education.length > 0) {
        result = result.filter(profile => advancedFilters.education.includes(profile.educational_background));
      }
      
      if (advancedFilters.voterStatus.length > 0) {
        result = result.filter(profile => {
          let matches = false;
          if (advancedFilters.voterStatus.includes('SK Voter') && profile.sk_voter === 'Yes') {
            matches = true;
          }
          if (advancedFilters.voterStatus.includes('National Voter') && profile.national_voter === 'Yes') {
            matches = true;
          }
          if (advancedFilters.voterStatus.includes('Voted Last Election') && profile.did_vote_last_election === 'Yes') {
            matches = true;
          }
          return matches;
        });
      }
      
      if (advancedFilters.employment.length > 0) {
        result = result.filter(profile => advancedFilters.employment.includes(profile.work_status));
      }
      
      if (advancedFilters.community.length > 0) {
        result = result.filter(profile => {
          let matches = false;
          if (advancedFilters.community.includes('Youth Org Member') && profile.youth_org === 'Yes') {
            matches = true;
          }
          if (advancedFilters.community.includes('Athlete') && profile.athlete === 'Yes') {
            matches = true;
          }
          if (advancedFilters.community.includes('Scholar') && profile.scholar === 'Yes') {
            matches = true;
          }
          if (advancedFilters.community.includes('PWD') && profile.pwd === 'Yes') {
            matches = true;
          }
          if (advancedFilters.community.includes('Solo Parent') && profile.soloparent === 'Yes') {
            matches = true;
          }
          if (advancedFilters.community.includes('LGBTQIA+') && profile.lgbtqia_member === 'Yes') {
            matches = true;
          }
          return matches;
        });
      }
      
      return result;
    }, [originalFilteredProfiles, dateRange, advancedFilters]);

    // Create chart datasets when preview is enabled
    useEffect(() => {
      if (previewCharts && includeCharts) {
        const cleanup = renderCharts();
        return cleanup;
      } else if (previewCharts && !includeCharts) {
        // Clean up any existing charts when includeCharts is turned off
        const chartInstances = Object.values(chartRefs.current)
          .filter(ref => ref.current)
          .map(ref => Chart.getChart(ref.current));
        
        chartInstances.forEach(chart => {
          if (chart) chart.destroy();
        });
      }
    }, [previewCharts, filteredProfiles, includeCharts]);


      // Function to render chart previews
        const renderCharts = () => {
          const chartInstances = [];
          
          // Gender Distribution chart
          if (chartRefs.current.gender.current) {
            const ctx = chartRefs.current.gender.current.getContext('2d');
            
            // Calculate data
            const maleCount = filteredProfiles.filter(p => p.gender === 'Male').length;
            const femaleCount = filteredProfiles.filter(p => p.gender === 'Female').length;
            
            // Create chart
            const chart = new Chart(ctx, {
              type: 'pie',
              data: {
                labels: ['Male', 'Female'],
                datasets: [{
                  data: [maleCount, femaleCount],
                  backgroundColor: ['#36A2EB', '#FF6384'],
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Gender Distribution'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                        const percentage = Math.round((context.raw / total) * 100);
                        return `${context.label}: ${context.raw} (${percentage}%)`;
                      }
                    }
                  }
                }
              }
            });
            
            chartInstances.push(chart);
          }
      
          // Age Group Distribution chart
          if (chartRefs.current.ageGroup.current) {
            const ctx = chartRefs.current.ageGroup.current.getContext('2d');
            
            // Calculate data
            const childYouth = filteredProfiles.filter(p => p.age >= 15 && p.age <= 17).length;
            const coreYouth = filteredProfiles.filter(p => p.age >= 18 && p.age <= 24).length;
            const youngAdult = filteredProfiles.filter(p => p.age >= 25 && p.age <= 30).length;
            
            // Create chart
            const chart = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: ['Child Youth (15-17)', 'Core Youth (18-24)', 'Young Adult (25-30)'],
                datasets: [{
                  label: 'Number of Youth',
                  data: [childYouth, coreYouth, youngAdult],
                  backgroundColor: ['#4BC0C0', '#FFCE56', '#FF9F40'],
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Age Group Distribution'
                  }
                }
              }
            });
            
            chartInstances.push(chart);
          }
          
          // Civil Status chart
          if (chartRefs.current.civilStatus.current) {
            const ctx = chartRefs.current.civilStatus.current.getContext('2d');
            
            // Count civil status occurrences
            const civilStatusCounts = {};
            filteredProfiles.forEach(profile => {
              if (profile.civil_status) {
                civilStatusCounts[profile.civil_status] = (civilStatusCounts[profile.civil_status] || 0) + 1;
              }
            });
            
            // Create chart
            const chart = new Chart(ctx, {
              type: 'pie',
              data: {
                labels: Object.keys(civilStatusCounts),
                datasets: [{
                  data: Object.values(civilStatusCounts),
                  backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                    '#9966FF', '#FF9F40', '#E7E9ED', '#8B008B'
                  ],
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Civil Status Distribution'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                        const percentage = Math.round((context.raw / total) * 100);
                        return `${context.label}: ${context.raw} (${percentage}%)`;
                      }
                    }
                  }
                }
              }
            });
            
            chartInstances.push(chart);
          }
      
          // Education Background chart
          if (chartRefs.current.education.current) {
            const ctx = chartRefs.current.education.current.getContext('2d');
            
            // Count education occurrences
            const educationCounts = {};
            filteredProfiles.forEach(profile => {
              if (profile.educational_background) {
                educationCounts[profile.educational_background] = (educationCounts[profile.educational_background] || 0) + 1;
              }
            });
            
            // Create chart
            const chart = new Chart(ctx, {
              type: 'pie',
              data: {
                labels: Object.keys(educationCounts),
                datasets: [{
                  data: Object.values(educationCounts),
                  backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                    '#9966FF', '#FF9F40', '#E7E9ED', '#8B008B',
                    '#008080', '#800000', '#808000'
                  ],
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Educational Background'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                        const percentage = Math.round((context.raw / total) * 100);
                        return `${context.label}: ${context.raw} (${percentage}%)`;
                      }
                    }
                  }
                }
              }
            });
            
            chartInstances.push(chart);
          }
          
          // Voter Status chart
          if (chartRefs.current.voter.current) {
            const ctx = chartRefs.current.voter.current.getContext('2d');
            
            // Calculate data
            const skVotersYes = filteredProfiles.filter(p => p.sk_voter === 'Yes').length;
            const skVotersNo = filteredProfiles.filter(p => p.sk_voter === 'No').length;
            const nationalVotersYes = filteredProfiles.filter(p => p.national_voter === 'Yes').length;
            const nationalVotersNo = filteredProfiles.filter(p => p.national_voter === 'No').length;
            
            // Create chart
            const chart = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: ['SK Voters', 'National Voters'],
                datasets: [
                  {
                    label: 'Yes',
                    data: [skVotersYes, nationalVotersYes],
                    backgroundColor: '#4BC0C0',
                    borderWidth: 1
                  },
                  {
                    label: 'No',
                    data: [skVotersNo, nationalVotersNo],
                    backgroundColor: '#FF6384',
                    borderWidth: 1
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Voter Registration Status'
                  }
                }
              }
            });
            
            chartInstances.push(chart);
          }
          
          // Employment Status chart
          if (chartRefs.current.employment.current) {
            const ctx = chartRefs.current.employment.current.getContext('2d');
            
            // Count work status occurrences
            const workCounts = {};
            filteredProfiles.forEach(profile => {
              if (profile.work_status) {
                workCounts[profile.work_status] = (workCounts[profile.work_status] || 0) + 1;
              }
            });
            
            // Create chart
            const chart = new Chart(ctx, {
              type: 'pie',
              data: {
                labels: Object.keys(workCounts),
                datasets: [{
                  data: Object.values(workCounts),
                  backgroundColor: [
                    '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF'
                  ],
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Employment Status'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                        const percentage = Math.round((context.raw / total) * 100);
                        return `${context.label}: ${context.raw} (${percentage}%)`;
                      }
                    }
                  }
                }
              }
            });
            
            chartInstances.push(chart);
          }
          
          // Return cleanup function to destroy charts when component unmounts
          return () => {
            chartInstances.forEach(chart => {
              chart.destroy();
            });
          };
        };
    
      // When user opens modal, prepare preview
      const handleShow = () => {
        setShowModal(true);
        setTimeout(() => {
          setPreviewCharts(true);
        }, 500);
      };
      
      const handleClose = () => {
        setShowModal(false);
        setPreviewCharts(false);
      };
    
    const handleFilterChange = (category, value) => {
      setAdvancedFilters(prev => {
        const updatedFilter = {...prev};
        const index = updatedFilter[category].indexOf(value);
        
        if (index > -1) {
          // Remove the value if it's already selected
          updatedFilter[category] = updatedFilter[category].filter(item => item !== value);
        } else {
          // Add the value
          updatedFilter[category] = [...updatedFilter[category], value];
        }
        
        return updatedFilter;
      });
    };
    
    const handleContentSelection = (type, id) => {
      if (type === 'chart') {
        setSelectedCharts(prev => {
          const index = prev.indexOf(id);
          if (index > -1) {
            return prev.filter(item => item !== id);
          } else {
            return [...prev, id];
          }
        });
      } else if (type === 'table') {
        setSelectedTables(prev => {
          const index = prev.indexOf(id);
          if (index > -1) {
            return prev.filter(item => item !== id);
          } else {
            return [...prev, id];
          }
        });
      }
    };
    
    const handleSelectAll = (type) => {
      if (type === 'chart') {
        setSelectedCharts(chartOptions.map(chart => chart.id));
      } else if (type === 'table') {
        setSelectedTables(tableOptions.map(table => table.id));
      }
    };
    
    const handleSelectNone = (type) => {
      if (type === 'chart') {
        setSelectedCharts([]);
      } else if (type === 'table') {
        setSelectedTables([]);
      }
    };
  
   // Apply template presets
   const applyTemplate = (templateId) => {
    setReportTemplate(templateId);
    
    switch(templateId) {
      case 'executive':
        // Executive summary focused on high-level metrics
        setIncludeCharts(true);
        setIncludeTables(true);
        setIncludeRawData(false);
        setSelectedCharts(['gender', 'ageGroup', 'voter', 'employment']);
        setSelectedTables(['genderDistribution', 'ageGroupDistribution', 'voterStats']);
        break;
        
      case 'detailed':
        // Detailed analysis with all charts and tables
        setIncludeCharts(true);
        setIncludeTables(true);
        setIncludeRawData(true);
        setSelectedCharts(chartOptions.map(chart => chart.id));
        setSelectedTables(tableOptions.map(table => table.id));
        break;
        
      case 'minimal':
        // Data only format
        setIncludeCharts(false);
        setIncludeTables(true);
        setIncludeRawData(true);
        setSelectedCharts([]);
        setSelectedTables(['genderDistribution', 'ageGroupDistribution', 'civilStatus', 'educationalBackground']);
        break;
        
      default: // standard
        // Balanced report with key visualizations
        setIncludeCharts(true);
        setIncludeTables(true);
        setIncludeRawData(false);
        setSelectedCharts(['gender', 'ageGroup', 'civilStatus', 'education', 'voter', 'employment']);
        setSelectedTables(['genderDistribution', 'ageGroupDistribution', 'civilStatus', 'educationalBackground']);
        break;
    }
  };
  
  const resetFilters = () => {
    setAdvancedFilters({
      gender: [],
      ageGroup: [],
      civilStatus: [],
      education: [],
      voterStatus: [],
      employment: [],
      community: []
    });
  };

  const generateReport = async () => {
    setIsGenerating(true);
    
    // Default title if not provided
    const title = reportTitle || `KK Demographics Report - ${selectedBarangay || 'All Barangays'}`;
    
    try {
      switch (reportType) {
        case 'pdf':
          await generatePDFReport(title);
          break;
        case 'excel':
          generateExcelReport(title);
          break;
        case 'csv':
          // CSV is handled by the CSVLink component
          break;
        case 'print':
          window.print();
          break;
        default:
          console.error('Unknown report type');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
      handleClose();
    }
  };

  const generatePDFReport = async (title) => {
    const doc = new jsPDF(orientation, 'mm', paperSize);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - (margin * 2);
    
    // Set colors based on selected theme
    const theme = colorThemes[colorTheme];
    
    // Add report header with logo and title
    addReportHeader(doc, title, theme);
    
    // Page number variables if enabled
    let pageCount = 1;
    
    let yPosition = 40;
    
    // Add report subtitle and metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    
    doc.text(`Barangay: ${selectedBarangay || 'All Barangays'}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    
    doc.text(`Date Range: ${dateRange.from} to ${dateRange.to}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    
    if (Object.values(advancedFilters).some(arr => arr.length > 0)) {
      doc.text('Filters Applied: Yes', pageWidth / 2, yPosition, { align: 'center' });
    } else {
      doc.text('Filters Applied: None', pageWidth / 2, yPosition, { align: 'center' });
    }
    yPosition += 10;
    
    // Add Executive Summary section
    yPosition = addExecutiveSummary(doc, yPosition, theme);
    
    // Add Breakdown by Demographics section if charts are included
    if (includeCharts && selectedCharts.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        if (includePageNumbers) addPageNumber(doc, ++pageCount);
        yPosition = 20;
      }
      
      // Capture chart canvases directly from the DOM
      yPosition = await addChartsToReport(doc, yPosition, theme, pageWidth, pageHeight);
    }
    
     // Add Data Summary Tables if tables are included
     if (includeTables && selectedTables.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        if (includePageNumbers) addPageNumber(doc, ++pageCount);
        yPosition = 20;
      }
      yPosition = addTablesToReport(doc, yPosition, theme);
    }
    
    // Add Raw Data if included
    if (includeRawData) {
      // Always start raw data on a new page
      doc.addPage();
      if (includePageNumbers) addPageNumber(doc, ++pageCount);
      yPosition = 20;
      addRawDataToReport(doc, yPosition, theme);
    }
    
    // Add footer text if provided
    if (footerText) {
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(footerText, pageWidth / 2, pageHeight - 5, { align: 'center' });
      }
    }

    // Add page numbers if enabled
    if (includePageNumbers) {
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 5);
      }
    }
    
    // Save the PDF
    doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };
  
  const addPageNumber = (doc, pageNumber) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${pageNumber}`, pageWidth - 20, pageHeight - 5);
  };
  
  const addReportHeader = (doc, title, theme) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Create a header background
    doc.setFillColor(theme.primary);
    doc.rect(0, 0, pageWidth, 25, 'F');


     // Add SK logo if enabled
     if (includeLogo) {
      try {
        // Get the appropriate logo based on barangay
        const logoSrc = getLogo();
        
        // Create a new image element to load the logo
        const img = new Image();
        img.src = logoSrc;
        
        // Calculate logo position (centered vertically in header)
        const logoWidth = 15;
        const logoHeight = 15;
        const logoX = 10;
        const logoY = 5;
        
        // Add the logo to the PDF
        doc.addImage(logoSrc, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.error("Error adding logo:", error);
        
        // Fallback to a colored box if logo fails
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(10, 5, 15, 15, 3, 3, 'F');
        
        // Add SK text as fallback
        doc.setFontSize(12);
        doc.setTextColor(theme.primary);
        doc.text('SK', 17.5, 14);
      }
    }
    
     // Add title
     doc.setFontSize(18);
     doc.setTextColor(255, 255, 255);
     doc.text(title, pageWidth / 2, 15, { align: 'center' });
     
     // Add a thin separator line
     doc.setDrawColor(255, 255, 255);
     doc.setLineWidth(0.5);
     doc.line(10, 25, pageWidth - 10, 25);
   };
  
   const addExecutiveSummary = (doc, startY, theme) => {
    let yPosition = startY;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Executive Summary heading
    doc.setFontSize(14);
    doc.setTextColor(theme.primary);
    doc.text('Executive Summary', 10, yPosition);
    yPosition += 8;
    
    // Draw a colored line under the heading
    doc.setDrawColor(theme.primary);
    doc.setLineWidth(0.5);
    doc.line(10, yPosition - 5, 60, yPosition - 5);
    
    // Summary text
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Calculate key metrics
    const totalProfiles = filteredProfiles.length;
    const totalMale = filteredProfiles.filter(profile => profile.gender === 'Male').length;
    const totalFemale = filteredProfiles.filter(profile => profile.gender === 'Female').length;
    const malePercent = totalProfiles ? ((totalMale / totalProfiles) * 100).toFixed(1) : 0;
    const femalePercent = totalProfiles ? ((totalFemale / totalProfiles) * 100).toFixed(1) : 0;
    
    const childYouth = filteredProfiles.filter(p => p.age >= 15 && p.age <= 17).length;
    const coreYouth = filteredProfiles.filter(p => p.age >= 18 && p.age <= 24).length;
    const youngAdult = filteredProfiles.filter(p => p.age >= 25 && p.age <= 30).length;
    
    const childYouthPercent = totalProfiles ? ((childYouth / totalProfiles) * 100).toFixed(1) : 0;
    const coreYouthPercent = totalProfiles ? ((coreYouth / totalProfiles) * 100).toFixed(1) : 0;
    const youngAdultPercent = totalProfiles ? ((youngAdult / totalProfiles) * 100).toFixed(1) : 0;
    
    const skVoters = filteredProfiles.filter(p => p.sk_voter === 'Yes').length;
    const nationalVoters = filteredProfiles.filter(p => p.national_voter === 'Yes').length;
    const kkAttendees = filteredProfiles.filter(p => p.kk_assembly_attendance === 'Yes').length;
    
    const skVotersPercent = totalProfiles ? ((skVoters / totalProfiles) * 100).toFixed(1) : 0;
    const nationalVotersPercent = totalProfiles ? ((nationalVoters / totalProfiles) * 100).toFixed(1) : 0;
    const kkAttendeesPercent = totalProfiles ? ((kkAttendees / totalProfiles) * 100).toFixed(1) : 0;
    
    // Add summary text
    doc.text(`This report provides an analysis of ${totalProfiles} youth profiles from ${selectedBarangay || 'all barangays'}.`, 10, yPosition);
    yPosition += 6;

    
     // Create a key metrics table
     const tableData = [
      ['Category', 'Count', 'Percentage'],
      ['Total Profiles', totalProfiles.toString(), '100%'],
      ['Male', totalMale.toString(), `${malePercent}%`],
      ['Female', totalFemale.toString(), `${femalePercent}%`],
      ['Child Youth (15-17)', childYouth.toString(), `${childYouthPercent}%`],
      ['Core Youth (18-24)', coreYouth.toString(), `${coreYouthPercent}%`],
      ['Young Adult (25-30)', youngAdult.toString(), `${youngAdultPercent}%`],
      ['SK Voters', skVoters.toString(), `${skVotersPercent}%`],
      ['National Voters', nationalVoters.toString(), `${nationalVotersPercent}%`],
      ['KK Assembly Attendees', kkAttendees.toString(), `${kkAttendeesPercent}%`]
    ];
    
    // Calculate column widths (adjust as needed)
    const colWidths = [65, 25, 25]; // Column widths in mm
    const rowHeight = 7; // Row height in mm
    
    // Draw table headers with theme background
    doc.setFillColor(theme.primary);
    doc.rect(10, yPosition, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    let xPos = 10;
    
    tableData[0].forEach((header, index) => {
      const align = index === 0 ? 'left' : 'center';
      if (align === 'left') {
        doc.text(header, xPos + 2, yPosition + 5);
      } else {
        doc.text(header, xPos + (colWidths[index] / 2), yPosition + 5, { align: 'center' });
      }
      xPos += colWidths[index];
    });
    
    yPosition += rowHeight;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Draw table rows with alternating background
    for (let i = 1; i < tableData.length; i++) {
      // Add light gray background to alternate rows
      if (i % 2 === 0) {
        doc.setFillColor(theme.secondary);
        doc.rect(10, yPosition, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
      }
      
      let xPos = 10;
      tableData[i].forEach((cell, index) => {
        const align = index === 0 ? 'left' : 'center';
        if (align === 'left') {
          doc.text(cell, xPos + 2, yPosition + 5);
        } else {
          doc.text(cell, xPos + (colWidths[index] / 2), yPosition + 5, { align: 'center' });
        }
        xPos += colWidths[index];
      });
      
      yPosition += rowHeight;
    }
    
  // Add a border around the table
  doc.setLineWidth(0.1);
  doc.setDrawColor(200, 200, 200);
  doc.rect(10, yPosition - (tableData.length - 1) * rowHeight, colWidths.reduce((a, b) => a + b, 0), (tableData.length - 1) * rowHeight);
  
  // Draw horizontal lines for each row
  for (let i = 1; i < tableData.length; i++) {
    doc.line(10, yPosition - (tableData.length - i) * rowHeight, 10 + colWidths.reduce((a, b) => a + b, 0), yPosition - (tableData.length - i) * rowHeight);
  }
  
  // Draw vertical lines for each column
  let xPosVert = 10;
  for (let i = 0; i < colWidths.length - 1; i++) {
    xPosVert += colWidths[i];
    doc.line(xPosVert, yPosition - (tableData.length - 1) * rowHeight, xPosVert, yPosition);
  }
  
  yPosition += 10;
    
   // Add key insights
   doc.setFontSize(11);
   doc.setFont(undefined, 'bold');
   doc.text('Key Insights:', 10, yPosition);
   yPosition += 6;
   
   doc.setFontSize(9);
   doc.setFont(undefined, 'normal');
   
   // Generate insights based on the data
   const insights = [];
   
   // Gender distribution insight
   if (totalMale > totalFemale) {
     insights.push(`Males make up the majority at ${malePercent}% compared to females at ${femalePercent}%.`);
   } else if (totalFemale > totalMale) {
     insights.push(`Females make up the majority at ${femalePercent}% compared to males at ${malePercent}%.`);
   } else {
     insights.push(`Gender distribution is balanced at ${malePercent}% for both males and females.`);
   }
   
    
   // Age group insight
   const maxAgeGroup = Math.max(childYouth, coreYouth, youngAdult);
   if (maxAgeGroup === childYouth) {
     insights.push(`Child Youth (15-17) is the largest age group at ${childYouthPercent}%.`);
   } else if (maxAgeGroup === coreYouth) {
     insights.push(`Core Youth (18-24) is the largest age group at ${coreYouthPercent}%.`);
   } else {
     insights.push(`Young Adult (25-30) is the largest age group at ${youngAdultPercent}%.`);
   }
   
   // Voter participation insight
   insights.push(`${skVotersPercent}% are registered SK Voters, while ${nationalVotersPercent}% are registered National Voters.`);
   
   // KK Assembly insight
   insights.push(`${kkAttendeesPercent}% have attended Katipunan ng Kabataan Assembly meetings.`);
   
   // List all insights
   insights.forEach((insight, index) => {
     doc.text(`${index + 1}. ${insight}`, 15, yPosition);
     yPosition += 5;
   });
   
   yPosition += 10;
   
   return yPosition;
 };
  
 const addChartsToReport = async (doc, startY, theme, pageWidth, pageHeight) => {
  let yPosition = startY;
  
  // Charts section heading
  doc.setFontSize(14);
  doc.setTextColor(theme.primary); 
  doc.text('Demographic Analysis', 10, yPosition);
  yPosition += 8;
  
  // Draw a colored line under the heading
  doc.setDrawColor(theme.primary);
  doc.setLineWidth(0.5);
  doc.line(10, yPosition - 5, 70, yPosition - 5);
  yPosition += 5;
  
   // Process each selected chart
   const chartsPerRow = orientation === 'landscape' ? 3 : 2;
   let chartsInCurrentRow = 0;
   let rowStartY = yPosition;
   let maxHeightInRow = 0;
   
  // Handle each selected chart type
  for (const chartId of selectedCharts) {
    if (!chartRefs.current[chartId] || !chartRefs.current[chartId].current) continue;
    
    try {
      // Get the chart canvas
      const canvas = chartRefs.current[chartId].current;
      
      // Get chart title
      const chartTitle = chartOptions.find(option => option.id === chartId)?.label || `Chart`;
      
      // Calculate image size based on orientation and layout
      const chartWidth = (pageWidth - 30) / chartsPerRow;
      const aspectRatio = canvas.height / canvas.width;
      const chartHeight = chartWidth * aspectRatio;
      
      // Check if we need a new page
      if (rowStartY + maxHeightInRow + chartHeight + 15 > pageHeight - 20) {
        doc.addPage();
        if (includePageNumbers) addPageNumber(doc, doc.getNumberOfPages());
        rowStartY = 20;
        maxHeightInRow = 0;
        chartsInCurrentRow = 0;
      }
      
      // Calculate x position
      const xPosition = 10 + (chartsInCurrentRow * (chartWidth + 5));
      
      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Add chart title
      doc.setFontSize(10);
      doc.setTextColor(theme.primary);
      doc.setFont(undefined, 'bold');
      doc.text(chartTitle, xPosition + (chartWidth / 2), rowStartY, { align: 'center' });
      
      // Add image
      doc.addImage(imgData, 'PNG', xPosition, rowStartY + 5, chartWidth, chartHeight);
      
      // Update chart positioning variables
      maxHeightInRow = Math.max(maxHeightInRow, chartHeight + 15);
      chartsInCurrentRow++;
      
      // Check if row is full or this is the last chart
      if (chartsInCurrentRow === chartsPerRow) {
        rowStartY += maxHeightInRow;
        chartsInCurrentRow = 0;
        maxHeightInRow = 0;
      }
      
    } catch (error) {
      console.error(`Error adding ${chartId} chart:`, error);
    }
  }
  
  // Finish any partially filled row
  if (chartsInCurrentRow > 0) {
    rowStartY += maxHeightInRow;
  }
  
  return rowStartY;
};
  
const addTablesToReport = (doc, startY, theme) => {
  let yPosition = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    if (includePageNumbers) addPageNumber(doc, doc.getNumberOfPages());
    yPosition = 20;
  }
  
  // Tables section heading
  doc.setFontSize(14);
  doc.setTextColor(theme.primary);
  doc.text('Data Tables', 10, yPosition);
  yPosition += 8;
  
  // Draw a colored line under the heading
  doc.setDrawColor(theme.primary);
  doc.setLineWidth(0.5);
  doc.line(10, yPosition - 5, 50, yPosition - 5);
  yPosition += 5;
  
  // Helper function to create table
  const createTable = (title, data, columns) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      if (includePageNumbers) addPageNumber(doc, doc.getNumberOfPages());
      yPosition = 20;
    }
    
    // Add table title
    doc.setFontSize(11);
    doc.setTextColor(theme.primary);
    doc.setFont(undefined, 'bold');
    doc.text(title, 10, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 8;
    
    // Calculate table dimensions
    const tableWidth = pageWidth - 20;
    const colWidths = columns.map((col, index) => {
      // Adjust column widths based on content type
      if (index === 0) return tableWidth * 0.5; // First column (category) gets 50%
      return tableWidth * 0.25; // Other columns get 25% each
    });
    
    const rowHeight = 7;
    
    // Draw table header with theme background
    doc.setFillColor(theme.primary);
    doc.setTextColor(255, 255, 255);
    doc.rect(10, yPosition, tableWidth, rowHeight, 'F');
    
    // Add header text
    let xPos = 10;
    doc.setFontSize(9);
    
    columns.forEach((col, index) => {
      if (index === 0) {
        doc.text(col.header, xPos + 2, yPosition + 5);
      } else {
        doc.text(col.header, xPos + (colWidths[index] / 2), yPosition + 5, { align: 'center' });
      }
      xPos += colWidths[index];
    });
    
    yPosition += rowHeight;
    doc.setTextColor(0, 0, 0);
    
    // Table rows
    for (let i = 0; i < data.length; i++) {
      // Add themed background to alternate rows
      if (i % 2 === 0) {
        doc.setFillColor(theme.secondary);
        doc.rect(10, yPosition, tableWidth, rowHeight, 'F');
      }
      
      let xPos = 10;
      columns.forEach((col, index) => {
        const value = data[i][col.key] || '';
        
        if (index === 0) {
          doc.text(value.toString(), xPos + 2, yPosition + 5);
        } else {
          doc.text(value.toString(), xPos + (colWidths[index] / 2), yPosition + 5, { align: 'center' });
        }
        
        xPos += colWidths[index];
      });
      
      yPosition += rowHeight;
      
      // Check if we need a new page in the middle of a table
      if (yPosition > pageHeight - 15 && i < data.length - 1) {
        doc.addPage();
        if (includePageNumbers) addPageNumber(doc, doc.getNumberOfPages());
        yPosition = 20;
        
        // Redraw the header on the new page
        doc.setFillColor(theme.primary);
        doc.setTextColor(255, 255, 255);
        doc.rect(10, yPosition, tableWidth, rowHeight, 'F');
        
        xPos = 10;
        doc.setFontSize(9);
        
        columns.forEach((col, index) => {
          if (index === 0) {
            doc.text(col.header, xPos + 2, yPosition + 5);
          } else {
            doc.text(col.header, xPos + (colWidths[index] / 2), yPosition + 5, { align: 'center' });
          }
          xPos += colWidths[index];
        });
        
        yPosition += rowHeight;
        doc.setTextColor(0, 0, 0);
      }
    }
    
    // Add border around the table
    doc.setLineWidth(0.1);
    doc.setDrawColor(theme.primary);
    doc.rect(10, yPosition - (data.length * rowHeight), tableWidth, data.length * rowHeight);
    
    yPosition += 15; // Add space after the table
    return yPosition;
  };
    
    // Create tables based on selected options
    if (selectedTables.includes('genderDistribution')) {
      const genderData = [
        { category: 'Male', count: filteredProfiles.filter(p => p.gender === 'Male').length, percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.gender === 'Male').length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%' },
        { category: 'Female', count: filteredProfiles.filter(p => p.gender === 'Female').length, percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.gender === 'Female').length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%' }
      ];
      
      yPosition = createTable('Gender Distribution', genderData, [
        { header: 'Gender', key: 'category' },
        { header: 'Count', key: 'count' },
        { header: 'Percentage', key: 'percentage' }
      ]);
    }
    
    if (selectedTables.includes('ageGroupDistribution')) {
      const ageGroupData = [
        { 
          category: 'Child Youth (15-17 yrs)', 
          count: filteredProfiles.filter(p => p.age >= 15 && p.age <= 17).length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.age >= 15 && p.age <= 17).length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        },
        { 
          category: 'Core Youth (18-24 yrs)', 
          count: filteredProfiles.filter(p => p.age >= 18 && p.age <= 24).length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.age >= 18 && p.age <= 24).length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        },
        { 
          category: 'Young Adult (25-30 yrs)', 
          count: filteredProfiles.filter(p => p.age >= 25 && p.age <= 30).length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.age >= 25 && p.age <= 30).length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        },
        { 
          category: 'Other', 
          count: filteredProfiles.filter(p => !p.age || p.age < 15 || p.age > 30).length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => !p.age || p.age < 15 || p.age > 30).length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        }
      ];
      
      yPosition = createTable('Age Group Distribution', ageGroupData, [
        { header: 'Age Group', key: 'category' },
        { header: 'Count', key: 'count' },
        { header: 'Percentage', key: 'percentage' }
      ]);
    }
    
    if (selectedTables.includes('civilStatus')) {
      // Count occurrences of each civil status
      const civilStatusCounts = {};
      filteredProfiles.forEach(profile => {
        if (profile.civil_status) {
          civilStatusCounts[profile.civil_status] = (civilStatusCounts[profile.civil_status] || 0) + 1;
        }
      });
      
      const civilStatusData = Object.keys(civilStatusCounts).map(status => ({
        category: status,
        count: civilStatusCounts[status],
        percentage: filteredProfiles.length ? ((civilStatusCounts[status] / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
      }));
      
      yPosition = createTable('Civil Status Distribution', civilStatusData, [
        { header: 'Civil Status', key: 'category' },
        { header: 'Count', key: 'count' },
        { header: 'Percentage', key: 'percentage' }
      ]);
    }
    
    if (selectedTables.includes('educationalBackground')) {
      // Count occurrences of each educational background
      const educationCounts = {};
      filteredProfiles.forEach(profile => {
        if (profile.educational_background) {
          educationCounts[profile.educational_background] = (educationCounts[profile.educational_background] || 0) + 1;
        }
      });
      
      const educationData = Object.keys(educationCounts).map(edu => ({
        category: edu,
        count: educationCounts[edu],
        percentage: filteredProfiles.length ? ((educationCounts[edu] / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
      }));
      
      yPosition = createTable('Educational Background', educationData, [
        { header: 'Education Level', key: 'category' },
        { header: 'Count', key: 'count' },
        { header: 'Percentage', key: 'percentage' }
      ]);
    }
    
    if (selectedTables.includes('workStatus')) {
      // Count occurrences of each work status
      const workStatusCounts = {};
      filteredProfiles.forEach(profile => {
        if (profile.work_status) {
          workStatusCounts[profile.work_status] = (workStatusCounts[profile.work_status] || 0) + 1;
        }
      });
      
      const workStatusData = Object.keys(workStatusCounts).map(status => ({
        category: status,
        count: workStatusCounts[status],
        percentage: filteredProfiles.length ? ((workStatusCounts[status] / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
      }));
      
      yPosition = createTable('Work Status Distribution', workStatusData, [
        { header: 'Work Status', key: 'category' },
        { header: 'Count', key: 'count' },
        { header: 'Percentage', key: 'percentage' }
      ]);
    }
    
    if (selectedTables.includes('voterStats')) {
      // SK Voter stats
      const skVoterData = [
        { 
          category: 'Yes', 
          count: filteredProfiles.filter(p => p.sk_voter === 'Yes').length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.sk_voter === 'Yes').length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        },
        { 
          category: 'No', 
          count: filteredProfiles.filter(p => p.sk_voter === 'No').length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.sk_voter === 'No').length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        }
      ];
      
      yPosition = createTable('SK Voter Status', skVoterData, [
        { header: 'Registered', key: 'category' },
        { header: 'Count', key: 'count' },
        { header: 'Percentage', key: 'percentage' }
      ]);
      
      // National Voter stats
      const nationalVoterData = [
        { 
          category: 'Yes', 
          count: filteredProfiles.filter(p => p.national_voter === 'Yes').length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.national_voter === 'Yes').length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        },
        { 
          category: 'No', 
          count: filteredProfiles.filter(p => p.national_voter === 'No').length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.national_voter === 'No').length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        }
      ];
      
      yPosition = createTable('National Voter Status', nationalVoterData, [
        { header: 'Registered', key: 'category' },
        { header: 'Count', key: 'count' },
        { header: 'Percentage', key: 'percentage' }
      ]);
    }
    
    if (selectedTables.includes('kkAssembly')) {
      // KK Assembly attendance
      const kkAssemblyData = [
        { 
          category: 'Yes', 
          count: filteredProfiles.filter(p => p.kk_assembly_attendance === 'Yes').length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.kk_assembly_attendance === 'Yes').length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        },
        { 
          category: 'No', 
          count: filteredProfiles.filter(p => p.kk_assembly_attendance === 'No').length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.kk_assembly_attendance === 'No').length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        }
      ];
      
      yPosition = createTable('KK Assembly Attendance', kkAssemblyData, [
        { header: 'Attended', key: 'category' },
        { header: 'Count', key: 'count' },
        { header: 'Percentage', key: 'percentage' }
      ]);
    }
    
    if (selectedTables.includes('communityInvolvement')) {
      // Community involvement stats
      const communityData = [
        {
          category: 'Youth Organization Members',
          count: filteredProfiles.filter(p => p.youth_org === 'Yes').length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.youth_org === 'Yes').length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        },
        {
          category: 'Athletes',
          count: filteredProfiles.filter(p => p.athlete === 'Yes').length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.athlete === 'Yes').length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        },
        {
          category: 'Scholars',
          count: filteredProfiles.filter(p => p.scholar === 'Yes').length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.scholar === 'Yes').length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        },
        {
          category: 'PWD',
          count: filteredProfiles.filter(p => p.pwd === 'Yes').length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.pwd === 'Yes').length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        },
        {
          category: 'Solo Parents',
          count: filteredProfiles.filter(p => p.soloparent === 'Yes').length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.soloparent === 'Yes').length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        },
        {
          category: 'LGBTQIA+ Members',
          count: filteredProfiles.filter(p => p.lgbtqia_member === 'Yes').length,
          percentage: filteredProfiles.length ? ((filteredProfiles.filter(p => p.lgbtqia_member === 'Yes').length / filteredProfiles.length) * 100).toFixed(1) + '%' : '0%'
        }
      ];
      
      yPosition = createTable('Community Involvement', communityData, [
        { header: 'Category', key: 'category' },
        { header: 'Count', key: 'count' },
        { header: 'Percentage', key: 'percentage' }
      ]);
    }
    
    return yPosition;
  };
  
  const addRawDataToReport = (doc, startY, theme) => {
    let yPosition = startY;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Raw Data section heading
    doc.setFontSize(14);
    doc.setTextColor(theme.primary);
    doc.text('Raw Data', 10, yPosition);
    yPosition += 8;
    
    // Draw a colored line under the heading
    doc.setDrawColor(theme.primary);
    doc.setLineWidth(0.5);
    doc.line(10, yPosition - 5, 40, yPosition - 5);
    
    // Add notice about data volume
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    
    const limitMessage = filteredProfiles.length > 100 
      ? `* Showing 100 of ${filteredProfiles.length} records. Export to Excel/CSV for complete data.`
      : '';
    
    if (limitMessage) {
      doc.text(limitMessage, 10, yPosition);
      yPosition += 6;
    }
    
    // Headers for data table
    const headers = [
      'Name', 
      'Age', 
      'Gender', 
      'Barangay',
      'Civil Status', 
      'Education', 
      'SK Voter',
      'Created Date'
    ];
    
    // Calculate column widths based on orientation
    const colWidths = [];
    if (orientation === 'landscape') {
      colWidths.push(
        pageWidth * 0.22, // Name - 22%
        pageWidth * 0.05, // Age - 5%
        pageWidth * 0.08, // Gender - 8%
        pageWidth * 0.1,  // Barangay - 10%
        pageWidth * 0.1,  // Civil Status - 10%
        pageWidth * 0.25, // Education - 25%
        pageWidth * 0.1,  // SK Voter - 10%
        pageWidth * 0.1   // Created Date - 10%
      );
    } else {
      colWidths.push(
        pageWidth * 0.25, // Name - 25%
        pageWidth * 0.05, // Age - 5%
        pageWidth * 0.1,  // Gender - 10% 
        pageWidth * 0.15, // Barangay - 15%
        pageWidth * 0.1,  // Civil Status - 10%
        pageWidth * 0.15, // Education - 15%
        pageWidth * 0.1,  // SK Voter - 10%
        pageWidth * 0.1   // Created Date - 10%
      );
    }
    
    const rowHeight = 7;
    
    // Draw table header with background
    doc.setFillColor(theme.primary);
    doc.setTextColor(255, 255, 255);
    doc.rect(10, yPosition, pageWidth - 20, rowHeight, 'F');
    
    // Add header text
    let xPos = 10;
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    
    headers.forEach((header, index) => {
      if (index === 0) {
        doc.text(header, xPos + 2, yPosition + 5);
      } else {
        doc.text(header, xPos + (colWidths[index] / 2), yPosition + 5, { align: 'center' });
      }
      xPos += colWidths[index];
    });
    
    yPosition += rowHeight;
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    
    // Data rows (limit to 100 for PDF)
    const dataLimit = Math.min(filteredProfiles.length, 100);
    
    for (let i = 0; i < dataLimit; i++) {
      const profile = filteredProfiles[i];
      
      // Add light gray or themed background to alternate rows
      if (i % 2 === 0) {
        doc.setFillColor(theme.secondary);
        doc.rect(10, yPosition, pageWidth - 20, rowHeight, 'F');
      }
      
      xPos = 10;
      
      // Name
      const fullName = `${profile.first_name || ''} ${profile.middle_name || ''} ${profile.last_name || ''}`.trim();
      doc.text(fullName || `Profile #${i+1}`, xPos + 2, yPosition + 5, { maxWidth: colWidths[0] - 4 });
      xPos += colWidths[0];
      
      // Age
      doc.text(String(profile.age || ''), xPos + (colWidths[1] / 2), yPosition + 5, { align: 'center' });
      xPos += colWidths[1];
      
      // Gender
      doc.text(profile.gender || '', xPos + (colWidths[2] / 2), yPosition + 5, { align: 'center' });
      xPos += colWidths[2];
      
      // Barangay
      doc.text(profile.barangay || '', xPos + (colWidths[3] / 2), yPosition + 5, { align: 'center' });
      xPos += colWidths[3];
      
      // Civil Status
      doc.text(profile.civil_status || '', xPos + (colWidths[4] / 2), yPosition + 5, { align: 'center' });
      xPos += colWidths[4];
      
      // Education
      const education = profile.educational_background || '';
      doc.text(education, xPos + (colWidths[5] / 2), yPosition + 5, { align: 'center', maxWidth: colWidths[5] - 4 });
      xPos += colWidths[5];
      
      // SK Voter
      doc.text(profile.sk_voter || '', xPos + (colWidths[6] / 2), yPosition + 5, { align: 'center' });
      xPos += colWidths[6];
      
      // Created Date
      let createdDate = '';
      if (profile.created_at) {
        try {
          createdDate = new Date(profile.created_at).toLocaleDateString();
        } catch (error) {
          console.error('Error formatting date:', error);
          createdDate = profile.created_at;
        }
      }
      doc.text(createdDate, xPos + (colWidths[7] / 2), yPosition + 5, { align: 'center' });
      
      yPosition += rowHeight;
      
      // Check if we need a new page
      if (yPosition > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        if (includePageNumbers) addPageNumber(doc, doc.getNumberOfPages());
        yPosition = 20;
        
        // Redraw the header on the new page
        doc.setFillColor(theme.primary);
        doc.setTextColor(255, 255, 255);
        doc.rect(10, yPosition, pageWidth - 20, rowHeight, 'F');
        
        xPos = 10;
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        
        headers.forEach((header, index) => {
          if (index === 0) {
            doc.text(header, xPos + 2, yPosition + 5);
          } else {
            doc.text(header, xPos + (colWidths[index] / 2), yPosition + 5, { align: 'center' });
          }
          xPos += colWidths[index];
        });
        
        yPosition += rowHeight;
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
      }
    }
    
    return yPosition;
  };

  const generateExcelReport = (title) => {
    // Filter only relevant data for privacy and security
    const exportData = filteredProfiles.map(profile => ({
      First_Name: profile.first_name || '',
      Middle_Name: profile.middle_name || '',
      Last_Name: profile.last_name || '',
      Age: profile.age,
      Gender: profile.gender,
      Barangay: profile.barangay,
      Address: profile.address,
      'Civil Status': profile.civil_status,
      'Youth Classification': profile.youth_classification,
      'Youth Age Group': profile.youth_age_group,
      'Educational Background': profile.educational_background,
      'Work Status': profile.work_status,
      'SK Voter': profile.sk_voter,
      'National Voter': profile.national_voter,
      'KK Assembly Attendance': profile.kk_assembly_attendance,
      'Attendance Times': profile.kk_assembly_attendance_times,
      'Reason for Not Attending': profile.reason_for_not_attending,
      'Voted Last Election': profile.did_vote_last_election,
      'Solo Parent': profile.soloparent,
      'Number of Children': profile.num_of_children,
      'PWD': profile.pwd,
      'PWD Years': profile.pwd_years,
      'Athlete': profile.athlete,
      'Sport': profile.sport_name,
      'Scholar': profile.scholar,
      'Pasig Scholar': profile.pasigscholar,
      'Scholarship Name': profile.scholarship_name,
      'Studying Level': profile.studying_level,
      'Year Level': profile.yearlevel,
      'School Name': profile.school_name,
      'Working Status': profile.working_status,
      'Company Name': profile.company_name,
      'Position': profile.position_name,
      'Licensed Professional': profile.licensed_professional,
      'Employment Years': profile.employment_yrs,
      'Monthly Income': profile.monthly_income,
      'Youth Org Member': profile.youth_org,
      'Organization Name': profile.org_name,
      'Organization Position': profile.org_position,
      'LGBTQIA+ Member': profile.lgbtqia_member,
      'OSY Ranking': profile.osyranking,
      'Created Date': profile.created_at ? new Date(profile.created_at).toLocaleDateString() : ''
    }));
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Helper function to count occurrences
    const countOccurrences = (field) => {
      return filteredProfiles.reduce((acc, profile) => {
        const key = profile[field] || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    };

    // Count for summary statistics
    const totalProfiles = filteredProfiles.length;
    const genderCounts = countOccurrences('gender');
    const civilStatusCounts = countOccurrences('civil_status');
    const educationCounts = countOccurrences('educational_background');
    const workCounts = countOccurrences('work_status');
    const skVoterCounts = countOccurrences('sk_voter');
    const nationalVoterCounts = countOccurrences('national_voter');
    const attendanceCounts = countOccurrences('kk_assembly_attendance');
    const scholarCounts = countOccurrences('scholar');
    const pwdCounts = countOccurrences('pwd');
    const athleteCounts = countOccurrences('athlete');
    const lgbtqiaCounts = countOccurrences('lgbtqia_member');

    // Age group calculations
    const childYouth = filteredProfiles.filter(p => p.age >= 15 && p.age <= 17).length;
    const coreYouth = filteredProfiles.filter(p => p.age >= 18 && p.age <= 24).length;
    const youngAdult = filteredProfiles.filter(p => p.age >= 25 && p.age <= 30).length;
    const otherAge = filteredProfiles.filter(p => !p.age || p.age < 15 || p.age > 30).length;

    // Summary Data
    const summaryData = [
      ['KK Demographics Report Summary'],
      ['Report Title', title],
      ['Generated on', new Date().toLocaleDateString(), 'at', new Date().toLocaleTimeString()],
      ['Barangay', selectedBarangay || 'All Barangays'],
      ['Date Range (Created)', `${dateRange.from} to ${dateRange.to}`],
      ['Total Profiles', totalProfiles],
      [''],
      ['Filters Applied:', Object.values(advancedFilters).some(arr => arr.length > 0) ? 'Yes' : 'None'],
      [''],
      ['Key Metrics'],
      ['Category', 'Count', 'Percentage'],
      ['Total Profiles', totalProfiles, '100%'],
      ['Males', genderCounts['Male'] || 0, totalProfiles ? ((genderCounts['Male'] / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      ['Females', genderCounts['Female'] || 0, totalProfiles ? ((genderCounts['Female'] / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      [''],
      ['Age Group Distribution'],
      ['Child Youth (15-17 yrs)', childYouth, totalProfiles ? ((childYouth / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      ['Core Youth (18-24 yrs)', coreYouth, totalProfiles ? ((coreYouth / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      ['Young Adult (25-30 yrs)', youngAdult, totalProfiles ? ((youngAdult / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      ['Other/Unknown', otherAge, totalProfiles ? ((otherAge / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      [''],
      ['Voter Registration Status'],
      ['SK Voter (Yes)', skVoterCounts['Yes'] || 0, totalProfiles ? ((skVoterCounts['Yes'] / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      ['SK Voter (No)', skVoterCounts['No'] || 0, totalProfiles ? ((skVoterCounts['No'] / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      ['National Voter (Yes)', nationalVoterCounts['Yes'] || 0, totalProfiles ? ((nationalVoterCounts['Yes'] / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      ['National Voter (No)', nationalVoterCounts['No'] || 0, totalProfiles ? ((nationalVoterCounts['No'] / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      [''],
      ['KK Assembly Attendance'],
      ['Attended (Yes)', attendanceCounts['Yes'] || 0, totalProfiles ? ((attendanceCounts['Yes'] / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      ['Did Not Attend (No)', attendanceCounts['No'] || 0, totalProfiles ? ((attendanceCounts['No'] / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      [''],
      ['Community Involvement'],
      ['Scholar', scholarCounts['Yes'] || 0, totalProfiles ? ((scholarCounts['Yes'] / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      ['PWD', pwdCounts['Yes'] || 0, totalProfiles ? ((pwdCounts['Yes'] / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      ['Athlete', athleteCounts['Yes'] || 0, totalProfiles ? ((athleteCounts['Yes'] / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
      ['LGBTQIA+ Member', lgbtqiaCounts['Yes'] || 0, totalProfiles ? ((lgbtqiaCounts['Yes'] / totalProfiles) * 100).toFixed(1) + '%' : '0%'],
    ];
    
    // Apply cell styling to summary sheet
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Apply some basic styling for Excel
    // Headers
    ['A1', 'A10', 'A15', 'A21', 'A27', 'A31'].forEach(cell => {
      if (!wsSummary[cell]) wsSummary[cell] = {};
      wsSummary[cell].s = { font: { bold: true, sz: 14 }, fill: { fgColor: { rgb: colorTheme === 'standard' ? '50606C' : 
        colorTheme === 'green' ? '28a745' : 
        colorTheme === 'blue' ? '007bff' : '6c757d' } } };
    });
    
    // Column headers
    ['A11', 'B11', 'C11'].forEach(cell => {
      if (!wsSummary[cell]) wsSummary[cell] = {};
      wsSummary[cell].s = { font: { bold: true } };
    });
    
    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.utils.book_append_sheet(wb, ws, 'Raw Data');
    
    // Add Civil Status Distribution worksheet
    if (Object.keys(civilStatusCounts).length > 0) {
      const civilStatusData = [
        ['Civil Status Distribution'],
        ['Category', 'Count', 'Percentage'],
        ...Object.entries(civilStatusCounts).map(([key, count]) => [
          key, 
          count, 
          totalProfiles ? ((count / totalProfiles) * 100).toFixed(1) + '%' : '0%'
        ])
      ];
      const wsCivilStatus = XLSX.utils.aoa_to_sheet(civilStatusData);
      // Add styling to civil status sheet
      wsCivilStatus['A1'].s = { font: { bold: true, sz: 14 } };
      ['A2', 'B2', 'C2'].forEach(cell => {
        if (!wsCivilStatus[cell]) wsCivilStatus[cell] = {};
        wsCivilStatus[cell].s = { font: { bold: true } };
      });
      XLSX.utils.book_append_sheet(wb, wsCivilStatus, 'Civil Status');
    }

    // Add Educational Background worksheet
    if (Object.keys(educationCounts).length > 0) {
      const educationData = [
        ['Educational Background Distribution'],
        ['Category', 'Count', 'Percentage'],
        ...Object.entries(educationCounts).map(([key, count]) => [
          key, 
          count, 
          totalProfiles ? ((count / totalProfiles) * 100).toFixed(1) + '%' : '0%'
        ])
      ];
      const wsEducation = XLSX.utils.aoa_to_sheet(educationData);
      // Add styling
      wsEducation['A1'].s = { font: { bold: true, sz: 14 } };
      ['A2', 'B2', 'C2'].forEach(cell => {
        if (!wsEducation[cell]) wsEducation[cell] = {};
        wsEducation[cell].s = { font: { bold: true } };
      });
      XLSX.utils.book_append_sheet(wb, wsEducation, 'Education');
    }
    
    // Add Work Status worksheet
    if (Object.keys(workCounts).length > 0) {
      const workData = [
        ['Work Status Distribution'],
        ['Category', 'Count', 'Percentage'],
        ...Object.entries(workCounts).map(([key, count]) => [
          key, 
          count, 
          totalProfiles ? ((count / totalProfiles) * 100).toFixed(1) + '%' : '0%'
        ])
      ];
      const wsWork = XLSX.utils.aoa_to_sheet(workData);
      // Add styling
      wsWork['A1'].s = { font: { bold: true, sz: 14 } };
      ['A2', 'B2', 'C2'].forEach(cell => {
        if (!wsWork[cell]) wsWork[cell] = {};
        wsWork[cell].s = { font: { bold: true } };
      });
      XLSX.utils.book_append_sheet(wb, wsWork, 'Employment');
    }
    
    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const excelData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(excelData, `${title.replace(/\s+/g, '_').toLowerCase()}.xlsx`);
  };
  
  // Prepare data for CSV export - more comprehensive than the table view
  const getCsvData = () => {
    return filteredProfiles.map(profile => ({
      'First Name': profile.first_name || '',
      'Middle Name': profile.middle_name || '',
      'Last Name': profile.last_name || '',
      'Age': profile.age,
      'Gender': profile.gender,
      'Barangay': profile.barangay,
      'Address': profile.address,
      'Civil Status': profile.civil_status,
      'Youth Classification': profile.youth_classification,
      'Youth Age Group': profile.youth_age_group,
      'Educational Background': profile.educational_background,
      'Work Status': profile.work_status,
      'SK Voter': profile.sk_voter,
      'National Voter': profile.national_voter,
      'KK Assembly Attendance': profile.kk_assembly_attendance,
      'Attendance Times': profile.kk_assembly_attendance_times,
      'Voted Last Election': profile.did_vote_last_election,
      'Solo Parent': profile.soloparent,
      'PWD': profile.pwd,
      'Athlete': profile.athlete,
      'Scholar': profile.scholar,
      'Working Status': profile.working_status,
      'Youth Org Member': profile.youth_org,
      'LGBTQIA+ Member': profile.lgbtqia_member,
      'Created Date': profile.created_at ? new Date(profile.created_at).toLocaleDateString() : ''
    }));
  };

  // Get appropriate filename based on filters
  const getReportFilename = () => {
    let filename = `kk_demographics`;
    
    if (selectedBarangay) {
      filename += `_${selectedBarangay.toLowerCase().replace(/\s+/g, '_')}`;
    } else {
      filename += `_all_barangays`;
    }
    
    if (Object.values(advancedFilters).some(arr => arr.length > 0)) {
      filename += `_filtered`;
    }
    
    filename += `_${new Date().toISOString().split('T')[0]}`;
    
    return filename;
  };

  return (
    <div className="demographics-report-export">
      <div className="report-export-header">
        <h3>Report Generation</h3>
        <p>Export demographic data with advanced filtering for analysis and reporting</p>
      </div>
      
      <div className="export-actions">
        <Button 
          variant="primary" 
          onClick={handleShow} 
          className="main-export-btn"
        >
          <FaDownload className="icon-left" />
          Generate Professional Report
        </Button>

        <div className="quick-export-buttons">
          <Button 
            variant="outline-primary" 
            className="export-option"
            onClick={() => {
              setReportType('pdf');
              applyTemplate('executive');
              handleShow();
            }}
          >
            <FaFilePdf className="export-icon" />
            <span>Executive Summary</span>
          </Button>
          
          <Button 
            variant="outline-primary" 
            className="export-option"
            onClick={() => {
              setReportType('excel');
              handleShow();
            }}
          >
            <FaFileExcel className="export-icon" />
            <span>Excel Export</span>
          </Button>
          
          <CSVLink
            data={getCsvData()}
            filename={`${getReportFilename()}.csv`}
            className="btn btn-outline-primary export-option"
          >
            <FaFileCsv className="export-icon" />
            <span>CSV Export</span>
          </CSVLink>
          
          <Button 
            variant="outline-primary" 
            className="export-option"
            onClick={() => window.print()}
          >
            <FaPrint className="export-icon" />
            <span>Print View</span>
          </Button>
        </div>
      </div>

      <Modal 
        show={showModal} 
        onHide={handleClose}
        className="report-modal"
        size="lg"
        centered
      >
        <Modal.Header closeButton className="modal-header">
          <Modal.Title>Generate Professional Demographics Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs activeKey={activeTab} onSelect={(key) => setActiveTab(key)} className="mb-3">
            <Tab eventKey="content" title={<span><FaChartPie /> Content</span>}>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Report Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter report title"
                    value={reportTitle}
                    onChange={e => setReportTitle(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Leave blank for automatic title based on selected barangay
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Report Template</Form.Label>
                  <div className="template-options">
                    {templateOptions.map(template => (
                      <Card 
                        key={template.id}
                        className={`template-card ${reportTemplate === template.id ? 'active' : ''}`}
                        onClick={() => applyTemplate(template.id)}
                      >
                        <Card.Body>
                          <Card.Title>{template.label}</Card.Title>
                          <Card.Text>
                            {template.id === 'standard' && 'Balanced report with key visualizations'}
                            {template.id === 'executive' && 'High-level metrics for decision makers'}
                            {template.id === 'detailed' && 'Comprehensive analysis with all charts and tables'}
                            {template.id === 'minimal' && 'Data-focused report without visualizations'}
                          </Card.Text>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Report Format</Form.Label>
                  <Form.Select value={reportType} onChange={e => setReportType(e.target.value)}>
                    <option value="pdf">PDF Report</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="csv">CSV File</option>
                    <option value="print">Print View</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Label>Include in Report</Form.Label>
                    <div className="content-toggle-buttons">
                      {reportType === 'pdf' && (
                        <>
                          <Form.Check
                            type="switch"
                            id="include-charts"
                            label="Charts"
                            checked={includeCharts}
                            onChange={e => setIncludeCharts(e.target.checked)}
                          />
                          <Form.Check
                            type="switch"
                            id="include-tables"
                            label="Tables"
                            checked={includeTables}
                            onChange={e => setIncludeTables(e.target.checked)}
                          />
                          <Form.Check
                            type="switch"
                            id="include-raw-data"
                            label="Raw Data"
                            checked={includeRawData}
                            onChange={e => setIncludeRawData(e.target.checked)}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </Form.Group>

                {includeCharts && reportType === 'pdf' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Charts to Include</Form.Label>
                    <div className="d-flex justify-content-end mb-2">
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleSelectAll('chart')}
                      >
                        Select All
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => handleSelectNone('chart')}
                      >
                        Select None
                      </Button>
                    </div>
                    <div className="chart-options">
                      {chartOptions.map(chart => (
                        <Form.Check
                          key={chart.id}
                          type="checkbox"
                          id={`chart-${chart.id}`}
                          label={chart.label}
                          checked={selectedCharts.includes(chart.id)}
                          onChange={() => handleContentSelection('chart', chart.id)}
                        />
                      ))}
                    </div>
                  </Form.Group>
                )}

{includeTables && (reportType === 'pdf' || reportType === 'excel') && (
                  <Form.Group className="mb-3">
                    <Form.Label>Tables to Include</Form.Label>
                    <div className="d-flex justify-content-end mb-2">
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleSelectAll('table')}
                      >
                        Select All
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => handleSelectNone('table')}
                      >
                        Select None
                      </Button>
                    </div>
                    <div className="chart-options">
                      {tableOptions.map(table => (
                        <Form.Check
                          key={table.id}
                          type="checkbox"
                          id={`table-${table.id}`}
                          label={table.label}
                          checked={selectedTables.includes(table.id)}
                          onChange={() => handleContentSelection('table', table.id)}
                        />
                      ))}
                    </div>
                  </Form.Group>
                )}
                
                {/* Chart Previews */}
                {previewCharts && includeCharts && (
                  <div className="chart-previews">
                    <h5>Chart Previews</h5>
                    <Row>
                      {selectedCharts.includes('gender') && (
                        <Col md={6} className="mb-3">
                          <div className="preview-chart">
                            <h6>Gender Distribution</h6>
                            <canvas ref={chartRefs.current.gender} width="300" height="200" />
                          </div>
                        </Col>
                      )}
                      {selectedCharts.includes('ageGroup') && (
                        <Col md={6} className="mb-3">
                          <div className="preview-chart">
                            <h6>Age Group Distribution</h6>
                            <canvas ref={chartRefs.current.ageGroup} width="300" height="200" />
                          </div>
                        </Col>
                      )}
                      {selectedCharts.includes('civilStatus') && (
                        <Col md={6} className="mb-3">
                          <div className="preview-chart">
                            <h6>Civil Status Distribution</h6>
                            <canvas ref={chartRefs.current.civilStatus} width="300" height="200" />
                          </div>
                        </Col>
                      )}
                      {selectedCharts.includes('education') && (
                        <Col md={6} className="mb-3">
                          <div className="preview-chart">
                            <h6>Educational Background</h6>
                            <canvas ref={chartRefs.current.education} width="300" height="200" />
                          </div>
                        </Col>
                      )}
                      {selectedCharts.includes('voter') && (
                        <Col md={6} className="mb-3">
                          <div className="preview-chart">
                            <h6>Voter Status</h6>
                            <canvas ref={chartRefs.current.voter} width="300" height="200" />
                          </div>
                        </Col>
                      )}
                      {selectedCharts.includes('employment') && (
                        <Col md={6} className="mb-3">
                          <div className="preview-chart">
                            <h6>Employment Status</h6>
                            <canvas ref={chartRefs.current.employment} width="300" height="200" />
                          </div>
                        </Col>
                      )}
                    </Row>
                  </div>
                )}
              </Form>
            </Tab>

            <Tab eventKey="filters" title={<span><FaFilter /> Filters</span>}>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Date Range (Based on Profile Creation Date)</Form.Label>
                  <div className="date-range-inputs">
                    <Form.Control
                      type="date"
                      value={dateRange.from}
                      onChange={e => handleDateRangeChange('from', e.target.value)}
                    />
                    <span className="date-range-separator">to</span>
                    <Form.Control
                      type="date"
                      value={dateRange.to}
                      onChange={e => handleDateRangeChange('to', e.target.value)}
                    />
                  </div>
                  <Form.Text className="text-muted">
                    Filter by when profiles were created in the system
                  </Form.Text>
                </Form.Group>
                
                <div className="advanced-filters-container">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Advanced Filters</h5>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={resetFilters}
                    >
                      Reset All Filters
                    </Button>
                  </div>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Gender</Form.Label>
                        <div className="filter-checkboxes">
                          {filterOptions.gender.map(option => (
                            <Form.Check
                              key={option}
                              type="checkbox"
                              id={`gender-${option}`}
                              label={option}
                              checked={advancedFilters.gender.includes(option)}
                              onChange={() => handleFilterChange('gender', option)}
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Age Group</Form.Label>
                        <div className="filter-checkboxes">
                          {filterOptions.ageGroup.map(option => (
                            <Form.Check
                              key={option}
                              type="checkbox"
                              id={`ageGroup-${option}`}
                              label={option}
                              checked={advancedFilters.ageGroup.includes(option)}
                              onChange={() => handleFilterChange('ageGroup', option)}
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Civil Status</Form.Label>
                        <div className="filter-checkboxes">
                          {filterOptions.civilStatus.map(option => (
                            <Form.Check
                              key={option}
                              type="checkbox"
                              id={`civilStatus-${option}`}
                              label={option}
                              checked={advancedFilters.civilStatus.includes(option)}
                              onChange={() => handleFilterChange('civilStatus', option)}
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Voter Status</Form.Label>
                        <div className="filter-checkboxes">
                          {filterOptions.voterStatus.map(option => (
                            <Form.Check
                              key={option}
                              type="checkbox"
                              id={`voterStatus-${option}`}
                              label={option}
                              checked={advancedFilters.voterStatus.includes(option)}
                              onChange={() => handleFilterChange('voterStatus', option)}
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Education</Form.Label>
                        <div className="filter-checkboxes scrollable">
                          {filterOptions.education.map(option => (
                            <Form.Check
                              key={option}
                              type="checkbox"
                              id={`education-${option}`}
                              label={option}
                              checked={advancedFilters.education.includes(option)}
                              onChange={() => handleFilterChange('education', option)}
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Employment</Form.Label>
                        <div className="filter-checkboxes scrollable">
                          {filterOptions.employment.map(option => (
                            <Form.Check
                              key={option}
                              type="checkbox"
                              id={`employment-${option}`}
                              label={option}
                              checked={advancedFilters.employment.includes(option)}
                              onChange={() => handleFilterChange('employment', option)}
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Community Involvement</Form.Label>
                        <div className="filter-checkboxes">
                          {filterOptions.community.map(option => (
                            <Form.Check
                              key={option}
                              type="checkbox"
                              id={`community-${option}`}
                              label={option}
                              checked={advancedFilters.community.includes(option)}
                              onChange={() => handleFilterChange('community', option)}
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
                
                <div className="filter-summary mt-3">
                  <p className="mb-1">
                    <strong>Current Filters:</strong>
                  </p>
                  <ul className="filter-summary-list">
                    {Object.entries(advancedFilters).map(([key, values]) => {
                      if (values.length === 0) return null;
                      return (
                        <li key={key}>
                          <span className="filter-category">{key}:</span> {values.join(', ')}
                        </li>
                      );
                    })}
                    {Object.values(advancedFilters).every(arr => arr.length === 0) && (
                      <li><em>No filters applied</em></li>
                    )}
                  </ul>
                  <p className="mt-2 mb-0">
                    <strong>Matching Profiles:</strong> {filteredProfiles.length} 
                    {filteredProfiles.length !== originalFilteredProfiles.length && 
                      ` (out of ${originalFilteredProfiles.length})`}
                  </p>
                </div>
              </Form>
            </Tab>
            
            <Tab eventKey="options" title={<span><FaCog /> Options</span>}>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Paper Size</Form.Label>
                  <Form.Select 
                    value={paperSize} 
                    onChange={e => setPaperSize(e.target.value)}
                  >
                    <option value="a4">A4 (210 x 297 mm)</option>
                    <option value="letter">US Letter (8.5 x 11 in)</option>
                    <option value="legal">Legal (8.5 x 14 in)</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Orientation</Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      name="orientation"
                      id="orientation-portrait"
                      label="Portrait"
                      checked={orientation === 'portrait'}
                      onChange={() => setOrientation('portrait')}
                      inline
                    />
                    <Form.Check
                      type="radio"
                      name="orientation"
                      id="orientation-landscape"
                      label="Landscape"
                      checked={orientation === 'landscape'}
                      onChange={() => setOrientation('landscape')}
                      inline
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Header Options</Form.Label>
                  <Form.Check
                    type="checkbox"
                    id="include-logo"
                    label="Include Barangay Logo"
                    checked={includeLogo}
                    onChange={e => setIncludeLogo(e.target.checked)}
                  />
                  <Form.Check
                    type="checkbox"
                    id="include-date"
                    label="Include Generation Date"
                    checked={includeDate}
                    onChange={e => setIncludeDate(e.target.checked)}
                  />
                  <Form.Check
                    type="checkbox"
                    id="include-page-numbers"
                    label="Include Page Numbers"
                    checked={includePageNumbers}
                    onChange={e => setIncludePageNumbers(e.target.checked)}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Footer Text (optional)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Confidential - For internal use only"
                    value={footerText}
                    onChange={e => setFooterText(e.target.value)}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Color Theme</Form.Label>
                  <div className="color-theme-options">
                    <div 
                      className={`color-theme ${colorTheme === 'standard' ? 'active' : ''}`}
                      onClick={() => setColorTheme('standard')}
                    >
                      <div className="color-sample" style={{ backgroundColor: '#50606C' }}></div>
                      <div>Standard</div>
                    </div>
                    <div 
                      className={`color-theme ${colorTheme === 'green' ? 'active' : ''}`}
                      onClick={() => setColorTheme('green')}
                    >
                      <div className="color-sample" style={{ backgroundColor: '#28a745' }}></div>
                      <div>Green</div>
                    </div>
                    <div 
                      className={`color-theme ${colorTheme === 'blue' ? 'active' : ''}`}
                      onClick={() => setColorTheme('blue')}
                    >
                      <div className="color-sample" style={{ backgroundColor: '#007bff' }}></div>
                      <div>Blue</div>
                    </div>
                    <div 
                      className={`color-theme ${colorTheme === 'gray' ? 'active' : ''}`}
                      onClick={() => setColorTheme('gray')}
                    >
                      <div className="color-sample" style={{ backgroundColor: '#6c757d' }}></div>
                      <div>Gray</div>
                    </div>
                  </div>
                </Form.Group>
              </Form>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>
            Cancel
          </Button>
          
          {reportType === 'csv' ? (
            <CSVLink
              data={getCsvData()}
              filename={`${getReportFilename()}.csv`}
              className="btn btn-primary"
              onClick={() => handleClose()}
            >
              Download CSV
            </CSVLink>
          ) : (
            <Button
              variant="primary"
              onClick={generateReport}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Generating...</span>
                </>
              ) : (
                <>Generate Report</>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DemographicsReportExport;