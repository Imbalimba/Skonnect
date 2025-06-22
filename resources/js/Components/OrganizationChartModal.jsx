import React, { useRef, useMemo, useState, useEffect } from 'react';
import { FaPhone, FaEnvelope, FaTimes, FaNetworkWired, FaDownload, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import jsPDF from 'jspdf';
import '../css/OrganizationChartModal.css';

// Import local logo images
import defaultLogo from '../assets/logo.png';  // federation
import delapazLogo from '../assets/delapaz_logo.png';  // dela paz
import manggahanLogo from '../assets/manggahan_logo.png';  // manggahan
import maybungaLogo from '../assets/maybunga_logo.png';  // maybunga
import pinagbuhatanLogo from '../assets/pinagbuhatan_logo.png'; // pinagbuhatan
import santolanLogo from '../assets/santolan_logo.png';  // santolan
import rosarioLogo from '../assets/rosario_logo.png';  // rosario
import sanmiguelLogo from '../assets/sanmiguel_logo.png';  // san miguel
import staLuciaLogo from '../assets/sta lucia_logo.png'; // sta lucia

const OrganizationChartModal = ({ show, onClose, stationName }) => {
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [data, setData] = useState([]);
  const chartRef = useRef(null);
  
  // Get station logo based on station name - with correct pathing
  const getStationLogo = (station) => {
    const logoMapping = {
      'Federation': defaultLogo,
      'Dela Paz': delapazLogo,
      'Manggahan': manggahanLogo,
      'Maybunga': maybungaLogo,
      'Pinagbuhatan': pinagbuhatanLogo,
      'Rosario': rosarioLogo,
      'San Miguel': sanmiguelLogo,
      'Santa Lucia': staLuciaLogo,
      'Santolan': santolanLogo
    };

    return logoMapping[station] || defaultLogo;
  };
  
  // Fetch detailed org chart data
  useEffect(() => {
    if (show) {
      const fetchOrgChartData = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`/api/directories/org-chart/${stationName}`);
          setData(response.data);
        } catch (error) {
          console.error('Failed to load org chart data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchOrgChartData();
    }
  }, [show, stationName]);
  
  // Export organization chart as PDF
  const handleExportPDF = () => {
    if (!chartRef.current) return;
    
    setPdfLoading(true);
    
    setTimeout(() => {
      try {
        const chart = chartRef.current;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Add title
        pdf.setFontSize(18);
        pdf.setTextColor(36, 86, 166);
        pdf.text(`${stationName} Organizational Chart`, 15, 15);
        
        // Add date
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 22);
        
        // Take a screenshot of the chart
        const chartWidth = chart.offsetWidth;
        const chartHeight = chart.offsetHeight;
        
        // Calculate scaling to fit to PDF
        const pageWidth = pdf.internal.pageSize.getWidth() - 30; // margins
        const scale = pageWidth / chartWidth;
        const scaledHeight = chartHeight * scale;
        
        // Convert chart to image
        html2canvas(chart, { 
          scale: 2, 
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          
          // Add the chart image
          pdf.addImage(imgData, 'PNG', 15, 30, pageWidth, scaledHeight);
          
          // Save the PDF
          pdf.save(`${stationName}_Org_Chart.pdf`);
          setPdfLoading(false);
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        setPdfLoading(false);
      }
    }, 500);
  };
  
  // Build reporting tree
  const reportingTree = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const tree = {};
    
    // Initialize tree
    data.forEach(person => {
      tree[person.id] = { ...person, children: [] };
    });
    
    // Add children to their parents
    data.forEach(person => {
      if (person.reports_to && tree[person.reports_to]) {
        tree[person.reports_to].children.push(tree[person.id]);
      }
    });
    
    return tree;
  }, [data]);
  
  // Find root nodes (no reports_to or reports_to not in our dataset)
  const rootNodes = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data
      .filter(person => !person.reports_to || !data.some(p => p.id === person.reports_to))
      .sort((a, b) => a.position_order - b.position_order);
  }, [data]);
  
  // Person Card Component
  const PersonCard = ({ person, size = 'medium' }) => {
    if (!person) return null;

    const sizeClass = size === 'large' ? 'org-chart-card-large' : 
                      size === 'small' ? 'org-chart-card-small' : 
                      'org-chart-card-medium';
    
    return (
      <div className={`org-chart-card ${sizeClass}`}>
        <div className="org-chart-logo-container">
          <img 
            src={getStationLogo(person.sk_station)} 
            alt={`${person.sk_station} Logo`} 
            className="org-chart-logo-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/logo.png'; // Fallback to default logo
            }}
          />
        </div>
        <div className="org-chart-person-info">
          <h4 className="org-chart-person-name">{person.name}</h4>
          <p className="org-chart-person-role">{person.role}</p>
          <div className="org-chart-person-contact">
            {person.email && (
              <a href={`mailto:${person.email}`} className="org-chart-contact-link">
                <FaEnvelope className="org-chart-contact-icon" />
                <span className="org-chart-contact-text">{person.email}</span>
              </a>
            )}
            {person.phone && (
              <a href={`tel:${person.phone}`} className="org-chart-contact-link">
                <FaPhone className="org-chart-contact-icon" />
                <span className="org-chart-contact-text">{person.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Renders a tree branch recursively
  const RenderTreeBranch = ({ nodeId }) => {
    const node = reportingTree[nodeId];
    if (!node) return null;
    
    return (
      <div className="org-chart-branch">
        <PersonCard person={node} size={node.children.length > 0 ? "large" : "medium"} />
        
        {node.children.length > 0 && (
          <>
            <div className="org-chart-connector">
              <div className="org-chart-vertical-line"></div>
              <div className="org-chart-horizontal-line"></div>
            </div>
            <div className="org-chart-children">
              {node.children
                .sort((a, b) => a.position_order - b.position_order)
                .map(child => (
                  <div key={child.id} className="org-chart-child">
                    <div className="org-chart-vertical-line-short"></div>
                    <RenderTreeBranch nodeId={child.id} />
                  </div>
                ))
              }
            </div>
          </>
        )}
      </div>
    );
  };

  // If it's not shown, don't render
  if (!show) return null;

  return (
    <div className="org-chart-modal-overlay">
      <div className="org-chart-modal-container">
        <div className="org-chart-modal-header">
          <div className="org-chart-modal-title">
            <h2>
              <FaNetworkWired className="org-chart-modal-icon" />
              Organizational Structure - {stationName}
            </h2>
          </div>
          <div className="org-chart-modal-actions">
            <button 
              className="org-chart-modal-download"
              onClick={handleExportPDF}
              disabled={pdfLoading || loading}
              title="Download as PDF"
            >
              {pdfLoading ? <FaSpinner className="org-chart-spinner" /> : <FaDownload />}
              <span>Export PDF</span>
            </button>
            <button className="org-chart-modal-close" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>
        <div className="org-chart-modal-content">
          {loading ? (
            <div className="org-chart-loading">
              <div className="org-chart-loading-spinner"></div>
              <p>Loading organizational chart...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="org-chart-empty">
              <p>No organizational data available for {stationName}</p>
            </div>
          ) : (
            <div ref={chartRef} className="org-chart-full">
              <div className="org-chart-section">
                <div className="org-chart-section-header">
                  <img 
                    src={getStationLogo(stationName)} 
                    alt={`${stationName} Logo`} 
                    className="org-chart-section-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/logo.png'; // Fallback to default logo
                    }}
                  />
                  <h3 className="org-chart-section-title">{stationName} Organization Chart</h3>
                </div>
                
                {rootNodes.length > 0 ? (
                  <div className="org-chart-trees">
                    {rootNodes.map(node => (
                      <RenderTreeBranch key={node.id} nodeId={node.id} />
                    ))}
                  </div>
                ) : (
                  <div className="org-chart-empty">
                    <p>No hierarchy relationships defined for {stationName}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationChartModal;