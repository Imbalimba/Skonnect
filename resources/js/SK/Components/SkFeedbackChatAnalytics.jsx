import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChartBar, FaArrowLeft, FaSpinner, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const SkFeedbackChatAnalytics = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [error, setError] = useState(null);
  
  // Custom colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const STATUS_COLORS = {
    active: '#2196F3',
    pending: '#FF9800',
    resolved: '#4CAF50',
    closed: '#9E9E9E'
  };
  
  const CATEGORY_COLORS = {
    inquiry: '#2196F3',
    complaint: '#F44336',
    suggestion: '#4CAF50',
    technical: '#9C27B0',
    other: '#FF9800'
  };
  
  // Load analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await axios.get('/api/sk/analytics/feedback', {
          params: { period }
        });
        
        setAnalyticsData(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Failed to load analytics data. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [period]);
  
  // Handle period change
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };
  
  // Format data for status pie chart
  const formatStatusData = () => {
    if (!analyticsData || !analyticsData.conversations_by_status) return [];
    
    return Object.entries(analyticsData.conversations_by_status).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  };
  
  // Format data for category pie chart
  const formatCategoryData = () => {
    if (!analyticsData || !analyticsData.conversations_by_category) return [];
    
    return Object.entries(analyticsData.conversations_by_category).map(([category, count]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: count
    }));
  };
  
  // Format data for conversations over time
  const formatTimelineData = () => {
    if (!analyticsData || !analyticsData.conversations_over_time) return [];
    
    return analyticsData.conversations_over_time.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: item.count
    }));
  };
  
  // Custom tooltip for pie charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="sk-analytics-custom-tooltip">
          <p className="sk-analytics-tooltip-label">{`${payload[0].name}: ${payload[0].value}`}</p>
          <p className="sk-analytics-tooltip-percentage">
            {`${((payload[0].value / analyticsData.total_conversations) * 100).toFixed(1)}%`}
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="sk-analytics-container">
        <div className="sk-analytics-header">
          <h2>Feedback Analytics</h2>
          <button className="sk-analytics-back-button" onClick={onClose}>
            <FaArrowLeft /> Back
          </button>
        </div>
        <div className="sk-analytics-loading">
          <FaSpinner className="sk-analytics-spinner" />
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="sk-analytics-container">
        <div className="sk-analytics-header">
          <h2>Feedback Analytics</h2>
          <button className="sk-analytics-back-button" onClick={onClose}>
            <FaArrowLeft /> Back
          </button>
        </div>
        <div className="sk-analytics-error">
          <FaExclamationTriangle />
          <p>{error}</p>
          <button 
            onClick={() => handlePeriodChange(period)}
            className="sk-analytics-retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="sk-analytics-container">
      <div className="sk-analytics-header">
        <h2>Feedback Analytics</h2>
        <div className="sk-analytics-period-selector">
          <button 
            className={`sk-analytics-period-button ${period === 'week' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('week')}
          >
            Week
          </button>
          <button 
            className={`sk-analytics-period-button ${period === 'month' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('month')}
          >
            Month
          </button>
          <button 
            className={`sk-analytics-period-button ${period === 'quarter' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('quarter')}
          >
            Quarter
          </button>
          <button 
            className={`sk-analytics-period-button ${period === 'year' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('year')}
          >
            Year
          </button>
        </div>
        <button className="sk-analytics-back-button" onClick={onClose}>
          <FaArrowLeft /> Back
        </button>
      </div>
      
      <div className="sk-analytics-date-range">
        <FaCalendarAlt />
        <span>
          {analyticsData?.period?.start} - {analyticsData?.period?.end}
        </span>
      </div>
      
      <div className="sk-analytics-summary-cards">
        <div className="sk-analytics-card">
          <div className="sk-analytics-card-icon">
            <FaChartBar />
          </div>
          <div className="sk-analytics-card-content">
            <h3 className="sk-analytics-card-title">Total Conversations</h3>
            <p className="sk-analytics-card-value">{analyticsData?.total_conversations || 0}</p>
          </div>
        </div>
        
        <div className="sk-analytics-card">
          <div className="sk-analytics-card-icon response-time">
            <FaCalendarAlt />
          </div>
          <div className="sk-analytics-card-content">
            <h3 className="sk-analytics-card-title">Average Response Time</h3>
            <p className="sk-analytics-card-value">
              {analyticsData?.average_response_time?.formatted || 'N/A'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="sk-analytics-charts">
        <div className="sk-analytics-chart-container">
          <h3 className="sk-analytics-chart-title">Conversations by Status</h3>
          <div className="sk-analytics-chart">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatStatusData()}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {formatStatusData().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={STATUS_COLORS[entry.name.toLowerCase()] || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="sk-analytics-chart-container">
          <h3 className="sk-analytics-chart-title">Conversations by Category</h3>
          <div className="sk-analytics-chart">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatCategoryData()}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {formatCategoryData().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.name.toLowerCase()] || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="sk-analytics-chart-container full-width">
          <h3 className="sk-analytics-chart-title">Conversations Over Time</h3>
          <div className="sk-analytics-chart">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={formatTimelineData()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Conversations" 
                  stroke="#2196F3" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkFeedbackChatAnalytics;