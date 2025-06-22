import React, { useState, useEffect, useContext, useRef } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';
import axios from 'axios';
import { FaChevronDown, FaSearch, FaFileCsv, FaHistory, FaUser, FaFilter, FaTimes } from 'react-icons/fa';
import '../css/Participation.css';
import { AuthContext } from '../../Contexts/AuthContext';

// Register ChartDataLabels plugin
Chart.register(ChartDataLabels);

const Participation = () => {
  // State variables
  const [events, setEvents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [programAttendees, setProgramAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAttendees, setFilteredAttendees] = useState([]);
  const [viewType, setViewType] = useState('event'); // 'event', 'program', or 'user'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('registered');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [participationHistory, setParticipationHistory] = useState([]);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { skUser } = useContext(AuthContext);
  
  // Refs for components
  const searchInputRef = useRef(null);
  
  // Determine if user is federation admin (can see all barangays)
  const isFederationAdmin = skUser?.sk_role === 'Federasyon';
  const userBarangay = skUser?.sk_station || '';
  
  // Barangay options
  const barangayOptions = [
    'Dela Paz', 
    'Manggahan', 
    'Maybunga', 
    'Pinagbuhatan', 
    'Rosario', 
    'San Miguel', 
    'Santa Lucia', 
    'Santolan'
  ];

  // Set initial barangay based on user role
  useEffect(() => {
    if (!isFederationAdmin && userBarangay) {
      setSelectedBarangay(userBarangay);
    }
  }, [isFederationAdmin, userBarangay]);

  // Fetch initial data with role-based filtering
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let params = new URLSearchParams();
        
        // Add barangay filter for non-federation users
        if (!isFederationAdmin && userBarangay) {
          params.append('barangay', userBarangay);
        }
        
        // Fetch events with role-based filtering
        console.log('Fetching events with params:', params.toString());
        const eventsResponse = await axios.get(`/api/events/published-events?${params.toString()}`);
        
        if (!eventsResponse.data || !Array.isArray(eventsResponse.data)) {
          throw new Error('Invalid events data format');
        }
        
        // Transform the events data to match the expected format
        // FIX: Use better property access with fallbacks to handle different data structures
        const transformedEvents = eventsResponse.data.map(event => {
          // Extract the actual event name with multiple fallbacks
          let eventName = 'Unknown Event';
          
          // Try different possible paths to get the event name
          if (event.event && typeof event.event === 'object' && event.event.event) {
            // Case: event.event is an object with event property
            eventName = event.event.event;
          } else if (event.event && typeof event.event === 'string') {
            // Case: event.event is directly a string
            eventName = event.event;
          } else if (event.event_name) {
            // Case: event has event_name property
            eventName = event.event_name;
          }
          
          // Similarly get other properties with fallbacks
          const timeframe = event.event?.timeframe || event.timeframe || null;
          const location = event.event?.location || event.location || null;
          const eventBarangay = event.event?.barangay || event.barangay || '';
          
          return {
            id: event.id,
            event_name: eventName, // Store direct event name for easier access
            event: {
              event: eventName,
              timeframe: timeframe,
              location: location,
              barangay: eventBarangay
            },
            description: event.description,
            selected_tags: event.selected_tags,
            need_volunteers: event.need_volunteers,
            status: event.status,
            event_type: event.event_type,
            barangay: eventBarangay,
            participants_count: event.participants_count || 0,
            volunteers_count: event.volunteers_count || 0,
            attendees_count: event.attendees_count || 0
          };
        });
        
        console.log('Transformed events:', transformedEvents);
        setEvents(transformedEvents);
        
        // Fetch programs with role-based filtering
        const programsResponse = await axios.get(`/api/publish-programs?${params.toString()}`);
        if (!programsResponse.data || !Array.isArray(programsResponse.data)) {
          throw new Error('Invalid programs data format');
        }
        setPrograms(programsResponse.data);
        
        // Fetch attendance statistics with role-based filtering
        const statsResponse = await axios.get(`/api/attendance-statistics?${params.toString()}`);
        setAttendanceStats(statsResponse.data || {});
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setEvents([]);
        setPrograms([]);
        setAttendanceStats({});
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isFederationAdmin, userBarangay]);

  // Fetch registered attendees for an event
  const fetchRegisteredAttendees = async (publishEventId) => {
    try {
      console.log('Fetching registered attendees for event:', publishEventId);
      const params = new URLSearchParams();
      if (publishEventId) {
        params.append('eventmanage_id', publishEventId);
      }
      // Add barangay filter for non-federation users
      if (!isFederationAdmin && userBarangay) {
        params.append('barangay', userBarangay);
      }
      
      const response = await axios.get(`/api/registered-attendees?${params.toString()}`);
      console.log('Raw API Response for registered attendees:', response);
      console.log('Registered attendees data:', response.data);
      
      // Transform the data to ensure consistent structure
      const attendeesData = Array.isArray(response.data) ? response.data.map(attendee => ({
        id: attendee.id,
        account_id: attendee.account_id,
        first_name: attendee.first_name,
        middle_name: attendee.middle_name,
        last_name: attendee.last_name,
        barangay: attendee.barangay,
        attendee_type: attendee.attendee_type,
        attended: attendee.attended,
        email: attendee.email || '',
        publish_event_id: attendee.publish_event_id
      })) : [];
      
      console.log('Transformed attendees data:', attendeesData);
      setAttendees(attendeesData);
      setFilteredAttendees(attendeesData);
    } catch (error) {
      console.error('Error fetching registered attendees:', error);
      console.error('Error details:', error.response?.data);
      setAttendees([]);
      setFilteredAttendees([]);
    }
  };

  // Fetch attendees when an event is selected (now using registered attendees)
  useEffect(() => {
    if (selectedEvent) {
      fetchRegisteredAttendees(selectedEvent.id);
    }
  }, [selectedEvent]);

  // Fetch program attendees when a program is selected
  useEffect(() => {
    if (selectedProgram) {
      fetchProgramAttendees(selectedProgram.id);
    }
  }, [selectedProgram]);

  // Filter attendees when search query changes
  useEffect(() => {
    filterAttendees();
  }, [searchQuery, attendees, programAttendees, viewType]);

  // Update participation history when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchUserHistory(selectedUser.id);
    }
  }, [selectedUser]);

  // Fetch event attendees
  const fetchEventAttendees = async (eventId) => {
    try {
      const response = await axios.get(`/api/event-attendees/${eventId}`);
      setAttendees(response.data);
      setFilteredAttendees(response.data);
    } catch (error) {
      console.error('Error fetching event attendees:', error);
    }
  };

  // Fetch program attendees
  const fetchProgramAttendees = async (programId) => {
    try {
      const response = await axios.get(`/api/program-attendees/${programId}`);
      setProgramAttendees(response.data);
      setFilteredAttendees(response.data);
    } catch (error) {
      console.error('Error fetching program attendees:', error);
    }
  };

  // Fetch user participation history
  const fetchUserHistory = async (userId) => {
    try {
      console.log('Fetching history for user ID:', userId); // Debug log
      const response = await axios.get(`/api/user-participation-history/${userId}`);
      console.log('User history response:', response.data); // Debug log
      
      if (!response.data) {
        console.log('No history data received');
        setUserHistory({ events: [], programs: [] });
        return;
      }

      // Ensure we have arrays for events and programs
      const historyData = {
        events: Array.isArray(response.data.events) ? response.data.events : [],
        programs: Array.isArray(response.data.programs) ? response.data.programs : []
      };
      
      setUserHistory(historyData);
      
      // Process data for participation history chart
      const combinedHistory = [...historyData.events, ...historyData.programs];
      
      // Sort by date
      combinedHistory.sort((a, b) => {
        const dateA = new Date(a.date || a.timeframe || a.time_start);
        const dateB = new Date(b.date || b.timeframe || b.time_start);
        return dateA - dateB;
      });
      
      setParticipationHistory(combinedHistory);
    } catch (error) {
      console.error('Error fetching user history:', error);
      setUserHistory({ events: [], programs: [] });
    }
  };

  // Handle event selection
  const handleEventChange = (event) => {
    setSelectedEvent(event);
    setSelectedProgram(null);
    setViewType('event');
    setActiveTab('registered');
  };

  // Handle program selection
  const handleProgramChange = (program) => {
    setSelectedProgram(program);
    setSelectedEvent(null);
    setViewType('program');
    setActiveTab('registered');
  };

  // Handle barangay filter change
  const handleBarangayChange = (e) => {
    const barangay = e.target.value;
    setSelectedBarangay(barangay);
    
    // Reset selections
    setSelectedEvent(null);
    setSelectedProgram(null);
    setSelectedUser(null);
    
    // Fetch filtered events and programs
    fetchFilteredData(barangay);
  };

  // Fetch data filtered by barangay
  const fetchFilteredData = async (barangay) => {
    setLoading(true);
    try {
      let params = new URLSearchParams();
      
      // Only allow filtering by barangay if user is federation admin
      if (isFederationAdmin && barangay) {
        params.append('barangay', barangay);
      } else if (!isFederationAdmin) {
        // For non-federation users, always use their barangay
        params.append('barangay', userBarangay);
      }
      
      // Fetch events with role-based filtering
      const eventsResponse = await axios.get(`/api/events/published-events?${params.toString()}`);
      const transformedEvents = eventsResponse.data.map(event => {
        // Extract the actual event name with multiple fallbacks
        let eventName = 'Unknown Event';
        
        // Try different possible paths to get the event name
        if (event.event && typeof event.event === 'object' && event.event.event) {
          // Case: event.event is an object with event property
          eventName = event.event.event;
        } else if (event.event && typeof event.event === 'string') {
          // Case: event.event is directly a string
          eventName = event.event;
        } else if (event.event_name) {
          // Case: event has event_name property
          eventName = event.event_name;
        }
        
        // Similarly get other properties with fallbacks
        const timeframe = event.event?.timeframe || event.timeframe || null;
        const location = event.event?.location || event.location || null;
        const eventBarangay = event.event?.barangay || event.barangay || '';
        
        return {
          id: event.id,
          event_name: eventName, // Store direct event name for easier access
          event: {
            event: eventName,
            timeframe: timeframe,
            location: location,
            barangay: eventBarangay
          },
          description: event.description,
          selected_tags: event.selected_tags,
          need_volunteers: event.need_volunteers,
          status: event.status,
          event_type: event.event_type,
          barangay: eventBarangay,
          participants_count: event.participants_count || 0,
          volunteers_count: event.volunteers_count || 0,
          attendees_count: event.attendees_count || 0
        };
      });
      
      setEvents(transformedEvents);
      
      // Fetch programs with role-based filtering
      const programsResponse = await axios.get(`/api/publish-programs?${params.toString()}`);
      setPrograms(programsResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching filtered data:', error);
      setLoading(false);
    }
  };

  // Filter attendees based on search query
  const filterAttendees = () => {
    if (!searchQuery) {
      setFilteredAttendees(viewType === 'event' ? attendees : programAttendees);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    console.log('Search query:', query);
    console.log('Current attendees:', attendees);
    
    if (viewType === 'event') {
      const filtered = (attendees || []).filter(attendee => {
        console.log('Checking attendee:', attendee);
        // Use the correct property paths for event attendees
        const fullName = `${attendee.first_name || ''} ${attendee.middle_name || ''} ${attendee.last_name || ''}`.toLowerCase();
        console.log('Full name for search:', fullName);
        const email = (attendee.attendees_email || '').toLowerCase();
        const barangay = (attendee.barangay || '').toLowerCase();
        
        const matches = fullName.includes(query) || email.includes(query) || barangay.includes(query);
        console.log('Matches search?', matches);
        return matches;
      });
      
      console.log('Filtered results:', filtered);
      setFilteredAttendees(filtered);
    } else if (viewType === 'program') {
      const filtered = programAttendees.filter(attendee => {
        const fullName = `${attendee.firstname || ''} ${attendee.middlename || ''} ${attendee.lastname || ''}`.toLowerCase();
        const barangay = (attendee.barangay || '').toLowerCase();
        
        return fullName.includes(query) || barangay.includes(query);
      });
      
      setFilteredAttendees(filtered);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Switch to user view and select a user
  const viewUserProfile = (attendee) => {
    const userId = attendee.profile?.id || attendee.profile_id;
    if (!userId) return;
    
    const user = {
      id: userId,
      name: `${attendee.profile?.first_name || attendee.firstname || ''} ${attendee.profile?.last_name || attendee.lastname || ''}`,
      email: attendee.attendees_email || attendee.email || '',
      barangay: attendee.profile?.barangay || attendee.barangay || ''
    };
    
    setSelectedUser(user);
    setViewType('user');
    setSelectedEvent(null);
    setSelectedProgram(null);
  };

  // Export attendees to CSV
  const exportToCSV = () => {
    const attendeesToExport = viewType === 'event' ? attendees : programAttendees;
    
    if (!attendeesToExport || attendeesToExport.length === 0) {
      alert('No data to export');
      return;
    }
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // CSV Headers
    let headers = [];
    if (viewType === 'event') {
      headers = ['Name', 'Email', 'Status', 'Volunteer', 'Attended', 'Barangay'];
    } else {
      headers = ['Name', 'Barangay', 'Reason for Applying', 'Attended'];
    }
    
    csvContent += headers.join(',') + '\r\n';
    
    // CSV Rows
    attendeesToExport.forEach(attendee => {
      let row = [];
      
      if (viewType === 'event') {
        const name = `${attendee.profile?.first_name || ''} ${attendee.profile?.last_name || ''}`;
        row = [
          `"${name}"`,
          `"${attendee.attendees_email || ''}"`,
          `"${attendee.status || ''}"`,
          `"${attendee.is_volunteer === 'yes' ? 'Yes' : 'No'}"`,
          `"${attendee.attended === 'yes' ? 'Yes' : 'No'}"`,
          `"${attendee.profile?.barangay || ''}"`,
        ];
      } else {
        const name = `${attendee.firstname || ''} ${attendee.lastname || ''}`;
        row = [
          `"${name}"`,
          `"${attendee.barangay || ''}"`,
          `"${attendee.reason_for_applying || ''}"`,
          `"${attendee.attended === 'yes' ? 'Yes' : 'No'}"`,
        ];
      }
      
      csvContent += row.join(',') + '\r\n';
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${viewType === 'event' ? selectedEvent?.event_name : selectedProgram?.project?.name}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Update attendance status
  const updateAttendanceStatus = async (attendeeId, attended) => {
    try {
      const endpoint = viewType === 'event' 
        ? `/api/event-attendees/${attendeeId}` 
        : `/api/program-attendees/${attendeeId}`;
      
      await axios.put(endpoint, { attended });
      
      // Update local state
      if (viewType === 'event') {
        const updatedAttendees = attendees.map(a => 
          a.id === attendeeId ? { ...a, attended } : a
        );
        setAttendees(updatedAttendees);
        setFilteredAttendees(updatedAttendees);
      } else {
        const updatedAttendees = programAttendees.map(a => 
          a.id === attendeeId ? { ...a, attended } : a
        );
        setProgramAttendees(updatedAttendees);
        setFilteredAttendees(updatedAttendees);
      }
    } catch (error) {
      console.error('Error updating attendance status:', error);
    }
  };

  // Chart data for attendance status
  const attendanceStatusData = {
    labels: ['Registered', 'Attended', 'Declined', 'Maybe'],
    datasets: [
      {
        data: [
          attendees.filter(a => a.status === 'registered').length,
          attendees.filter(a => a.status === 'attending').length,
          attendees.filter(a => a.status === 'declined').length,
          attendees.filter(a => a.status === 'maybe').length
        ],
        backgroundColor: ['#36A2EB', '#4BC0C0', '#FF6384', '#FFCE56'],
        borderWidth: 0
      }
    ]
  };

  // Chart data for volunteer vs non-volunteer
  const volunteerData = {
    labels: ['Volunteers', 'Non-Volunteers'],
    datasets: [
      {
        data: [
          attendees.filter(a => a.is_volunteer === 'yes').length,
          attendees.filter(a => a.is_volunteer !== 'yes').length
        ],
        backgroundColor: ['#FF6384', '#36A2EB'],
        borderWidth: 0
      }
    ]
  };

  // Chart data for attendance rate
  const attendanceRateData = {
    labels: ['Attended', 'Did Not Attend'],
    datasets: [
      {
        data: [
          attendees.filter(a => a.attended === 'yes').length,
          attendees.filter(a => a.attended !== 'yes').length
        ],
        backgroundColor: ['#4BC0C0', '#FF6384'],
        borderWidth: 0
      }
    ]
  };

  // Program attendance data
  const programAttendanceData = {
    labels: ['Attended', 'Did Not Attend'],
    datasets: [
      {
        data: [
          programAttendees.filter(a => a.attended === 'yes').length,
          programAttendees.filter(a => a.attended !== 'yes').length
        ],
        backgroundColor: ['#4BC0C0', '#FF6384'],
        borderWidth: 0
      }
    ]
  };

  // Participation history chart data
  const participationHistoryData = {
    labels: participationHistory.map(item => {
      const date = new Date(item.date || item.timeframe || item.time_start);
      return date.toLocaleDateString();
    }),
    datasets: [
      {
        label: 'Event/Program Participation',
        data: participationHistory.map(item => item.attended === 'yes' ? 1 : 0),
        fill: false,
        borderColor: '#4BC0C0',
        tension: 0.1
      }
    ]
  };

  // Chart options
  const chartOptions = {
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

  // Render attendee table based on active tab
  const renderAttendeeTable = () => {
    let tableData = [];
    
    if (viewType === 'event') {
      if (activeTab === 'registered') {
        tableData = filteredAttendees.filter(a => a.attendee_type === 'participant' || a.attendee_type === 'volunteer');
      } else if (activeTab === 'volunteers') {
        tableData = filteredAttendees.filter(a => a.attendee_type === 'volunteer');
      } else if (activeTab === 'attended') {
        tableData = filteredAttendees.filter(a => a.attended === 'yes');
      }
      
      return (
        <div className="participation-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Barangay</th>
                <th>Type</th>
                <th>Attended</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length > 0 ? (
                tableData.map(attendee => (
                  <tr key={attendee.id}>
                    <td>{attendee.first_name} {attendee.last_name}</td>
                    <td>{attendee.barangay}</td>
                    <td>{attendee.attendee_type}</td>
                    <td>
                      <span className={`attendance-badge ${attendee.attended === 'yes' ? 'yes' : 'no'}`}>
                        {attendee.attended === 'yes' ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      {/* You can add actions here if needed */}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No attendees found in this category</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    } else if (viewType === 'program') {
      if (activeTab === 'registered') {
        tableData = filteredAttendees;
      } else if (activeTab === 'attended') {
        tableData = filteredAttendees.filter(a => a.attended === 'yes');
      }
      
      return (
        <div className="participation-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Barangay</th>
                <th>Reason for Applying</th>
                <th>Attended</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length > 0 ? (
                tableData.map(attendee => (
                  <tr key={attendee.id}>
                    <td>
                      <button 
                        className="user-link"
                        onClick={() => viewUserProfile(attendee)}
                      >
                        {attendee.firstname} {attendee.lastname}
                      </button>
                    </td>
                    <td>{attendee.barangay}</td>
                    <td className="reason-cell">{attendee.reason_for_applying}</td>
                    <td>
                      <select 
                        value={attendee.attended || 'no'} 
                        onChange={(e) => updateAttendanceStatus(attendee.id, e.target.value)}
                        className={`attendance-select ${attendee.attended === 'yes' ? 'attended' : 'not-attended'}`}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </td>
                    <td>
                      <button 
                        className="action-btn history-btn"
                        onClick={() => viewUserProfile(attendee)}
                        title="View Participation History"
                      >
                        <FaHistory />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No attendees found in this category</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    } else if (viewType === 'user') {
      return (
        <div className="user-history-container">
          <div className="user-history-header">
            <h4>Participation History for {selectedUser?.name || '(User)'}</h4>
            <p><strong>Email:</strong> {selectedUser?.email || '(No email)'}</p>
            <p><strong>Barangay:</strong> {selectedUser?.barangay || '(No barangay)'}</p>
          </div>
          
          <div className="history-charts">
            <div className="chart-container">
              <h5>Participation Timeline</h5>
              <div className="chart-wrapper history-chart">
                <Line 
                  data={participationHistoryData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 1,
                        ticks: {
                          stepSize: 1,
                          callback: function(value) {
                            return value === 0 ? 'No' : 'Yes';
                          }
                        },
                        title: {
                          display: true,
                          text: 'Attended'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="history-tabs">
            <button 
              className={`history-tab ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
            <button 
              className={`history-tab ${activeTab === 'programs' ? 'active' : ''}`}
              onClick={() => setActiveTab('programs')}
            >
              Programs
            </button>
          </div>
          
          {activeTab === 'events' && (
            <div className="history-table-container">
              <h5>Events Attended</h5>
              <div className="participation-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Volunteer</th>
                      <th>Attended</th>
                      <th>Barangay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userHistory.events && userHistory.events.length > 0 ? (
                      userHistory.events.map((event, index) => (
                        <tr key={index}>
                          <td>{event.event_name}</td>
                          <td>{new Date(event.date || event.timeframe).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge ${event.status}`}>
                              {event.status}
                            </span>
                          </td>
                          <td>
                            <span className={`volunteer-badge ${event.is_volunteer === 'yes' ? 'yes' : 'no'}`}>
                              {event.is_volunteer === 'yes' ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td>
                            <span className={`attendance-badge ${event.attended === 'yes' ? 'yes' : 'no'}`}>
                              {event.attended === 'yes' ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td>{event.barangay}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6">No event history found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'programs' && (
            <div className="history-table-container">
              <h5>Programs Attended</h5>
              <div className="participation-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Program Name</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Attended</th>
                      <th>Barangay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userHistory.programs && userHistory.programs.length > 0 ? (
                      userHistory.programs.map((program, index) => (
                        <tr key={index}>
                          <td>{program.program_name}</td>
                          <td>{new Date(program.time_start).toLocaleDateString()}</td>
                          <td>{new Date(program.time_end).toLocaleDateString()}</td>
                          <td>
                            <span className={`attendance-badge ${program.attended === 'yes' ? 'yes' : 'no'}`}>
                              {program.attended === 'yes' ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td>{program.barangay}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5">No program history found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  // Update the search function to use the accounts table directly
  const handleUserSearchChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.length < 2) {
      setUserSearchResults([]);
      setShowUserDropdown(false);
      return;
    }

    setSearchingUsers(true);
    try {
      // Search through the current attendees data
      const searchResults = attendees.filter(attendee => {
        const fullName = `${attendee.first_name || ''} ${attendee.middle_name || ''} ${attendee.last_name || ''}`.toLowerCase();
        return fullName.includes(value.toLowerCase());
      });

      console.log('Current attendees:', attendees);
      console.log('Search value:', value);
      console.log('Search results:', searchResults);
      
      setUserSearchResults(searchResults);
      setShowUserDropdown(true);
    } catch (error) {
      console.error('Search error:', error);
      setUserSearchResults([]);
      setShowUserDropdown(false);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Update the user search section to handle the data structure
  const renderUserSearchSection = () => (
    <div className="participation-user-search-section">
      <h4>Search Participant History</h4>
      <div className="participation-search-container">
        <div className="participation-search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search participants by name..."
            value={searchQuery}
            onChange={handleUserSearchChange}
            ref={searchInputRef}
          />
          {searchQuery && (
            <button className="clear-search" onClick={clearSearch}>
              <FaTimes />
            </button>
          )}
        </div>
        {searchingUsers && <div className="search-loading">Searching...</div>}
      </div>

      {showUserDropdown && userSearchResults.length > 0 && (
        <div className="participation-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Barangay</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userSearchResults.map(user => (
                <tr key={user.account_id || user.id}>
                  <td>{`${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}`}</td>
                  <td>{user.barangay}</td>
                  <td>{user.email}</td>
                  <td>
                    <button 
                      className="action-btn history-btn"
                      onClick={() => handleUserSelect(user)}
                      title="View Participation History"
                    >
                      <FaHistory />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showUserDropdown && userSearchResults.length === 0 && (
        <div className="participation-table-wrapper">
          <table>
            <tbody>
              <tr>
                <td colSpan="4" className="no-results">No participants found</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Update handleUserSelect to switch to user view
  const handleUserSelect = (user) => {
    console.log('Selected user:', user); // Debug log
    setSelectedUser({
      id: user.account_id || user.id, // Try both account_id and id
      name: `${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}`.trim(),
      email: user.email || '',
      barangay: user.barangay || ''
    });
    setViewType('user');
    setSelectedEvent(null);
    setSelectedProgram(null);
    setShowUserDropdown(false);
    setSearchQuery('');
  };

  // Render content based on view type
  const renderContent = () => {
    if (loading) {
      return <div className="loading-message">Loading data...</div>;
    }
    
    // Add role-based header information
    const renderRoleHeader = () => (
      <div className="participation-role-header">
        {isFederationAdmin ? (
          <p className="role-info">
            {selectedBarangay 
              ? `Viewing participation tracking for ${selectedBarangay} barangay`
              : 'Viewing participation tracking for all barangays'}
          </p>
        ) : (
          <p className="role-info">Viewing participation tracking for {userBarangay} barangay</p>
        )}
      </div>
    );

    // Also update the dashboard header text
    const renderDashboardHeader = () => (
      <div className="participation-dashboard-header">
        <h3>Event & Program Participation Dashboard</h3>
      </div>
    );

    if (viewType === 'event' && selectedEvent) {
      return (
        <div className="event-details">
          {renderRoleHeader()}
          <div className="event-info">
            <h3>{selectedEvent.event_name || selectedEvent.event?.event || 'Unnamed Event'}</h3>
            <div className="participation-event-meta">
              <span className="participation-event-meta-item"><strong>Date:</strong> {selectedEvent.event?.timeframe ? new Date(selectedEvent.event.timeframe).toLocaleDateString() : 'Date not available'}</span>
              <span className="participation-event-meta-item"><strong>Location:</strong> {selectedEvent.event?.location || 'Location not specified'}</span>
              <span className="participation-event-meta-item"><strong>Barangay:</strong> {selectedEvent.barangay}</span>
            </div>
            <p className="event-description">{selectedEvent.description}</p>
          </div>

          <div className="participation-dashboard-stats">
            <div className="participation-stat-card participation-stat-card-events">
              <div className="participation-stat-value">{attendees.length}</div>
              <div className="participation-stat-label">Total Registrants</div>
            </div>
            <div className="participation-stat-card participation-stat-card-programs">
              <div className="participation-stat-value">{attendees.filter(a => a.is_volunteer === 'yes').length}</div>
              <div className="participation-stat-label">Volunteers</div>
            </div>
            <div className="participation-stat-card participation-stat-card-attendance">
              <div className="participation-stat-value">{attendees.filter(a => a.attended === 'yes').length}</div>
              <div className="participation-stat-label">Actually Attended</div>
            </div>
            <div className="participation-stat-card participation-stat-card-volunteer">
              <div className="participation-stat-value">{attendees.length > 0 ? Math.round((attendees.filter(a => a.attended === 'yes').length / attendees.length) * 100) : 0}%</div>
              <div className="participation-stat-label">Attendance Rate</div>
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-container">
              <h4>Registration Status</h4>
              <div className="chart-wrapper">
                <Doughnut data={volunteerData} options={chartOptions} />
              </div>
            </div>
            <div className="chart-container">
              <h4>Attendance Rate</h4>
              <div className="chart-wrapper">
                <Doughnut data={attendanceRateData} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="search-export-section">
            <button className="export-btn" onClick={exportToCSV}>
              <FaFileCsv className="export-icon" /> Export to CSV
            </button>
            <div className="participation-search-container">
              <div className="participation-search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search attendees..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  ref={searchInputRef}
                />
                {searchQuery && (
                  <button className="clear-search" onClick={clearSearch}>
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="participation-attendees-tabs">
            <button 
              className={`participation-attendee-tab ${activeTab === 'registered' ? 'active' : ''}`}
              onClick={() => setActiveTab('registered')}
            >
              Registered ({attendees.filter(a => a.attendee_type === 'participant' || a.attendee_type === 'volunteer').length})
            </button>
            <button 
              className={`participation-attendee-tab ${activeTab === 'volunteers' ? 'active' : ''}`}
              onClick={() => setActiveTab('volunteers')}
            >
              Volunteers ({attendees.filter(a => a.attendee_type === 'volunteer').length})
            </button>
            <button 
              className={`participation-attendee-tab ${activeTab === 'attended' ? 'active' : ''}`}
              onClick={() => setActiveTab('attended')}
            >
              Actually Attended ({attendees.filter(a => a.attended === 'yes').length})
            </button>
          </div>

          <div className="participation-attendees-table">
            {renderAttendeeTable()}
          </div>
        </div>
      );
    } else if (viewType === 'program' && selectedProgram) {
      return (
        <div className="program-details">
          {renderRoleHeader()}
          <div className="program-info">
            <h3>{selectedProgram.project?.name}</h3>
            <div className="participation-program-meta">
              <span><strong>Start Date:</strong> {new Date(selectedProgram.time_start).toLocaleDateString()}</span>
              <span><strong>End Date:</strong> {new Date(selectedProgram.time_end).toLocaleDateString()}</span>
              <span><strong>Barangay:</strong> {selectedProgram.barangay}</span>
            </div>
            <p className="program-description">{selectedProgram.description}</p>
          </div>

          <div className="stats-section">
            <div className="participation-stat-card">
              <div className="stat-value">{programAttendees.length}</div>
              <div className="stat-label">Total Applicants</div>
            </div>
            <div className="participation-stat-card">
              <div className="stat-value">{programAttendees.filter(a => a.attended === 'yes').length}</div>
              <div className="stat-label">Actually Attended</div>
            </div>
            <div className="participation-stat-card">
              <div className="stat-value">
                {programAttendees.length > 0 
                  ? Math.round((programAttendees.filter(a => a.attended === 'yes').length / programAttendees.length) * 100) 
                  : 0}%
              </div>
              <div className="stat-label">Attendance Rate</div>
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-container">
              <h4>Program Attendance</h4>
              <div className="chart-wrapper">
                <Doughnut data={programAttendanceData} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="search-export-section">
            <button className="export-btn" onClick={exportToCSV}>
              <FaFileCsv className="export-icon" /> Export to CSV
            </button>
            <div className="participation-search-container">
              <div className="participation-search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search applicants..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  ref={searchInputRef}
                />
                {searchQuery && (
                  <button className="clear-search" onClick={clearSearch}>
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="participation-attendees-tabs">
            <button 
              className={`participation-attendee-tab ${activeTab === 'registered' ? 'active' : ''}`}
              onClick={() => setActiveTab('registered')}
            >
              All Applicants ({programAttendees.length})
            </button>
            <button 
              className={`participation-attendee-tab ${activeTab === 'attended' ? 'active' : ''}`}
              onClick={() => setActiveTab('attended')}
            >
              Actually Attended ({programAttendees.filter(a => a.attended === 'yes').length})
            </button>
          </div>

          <div className="participation-attendees-table">
            <h4>Applicant List</h4>
            {renderAttendeeTable()}
          </div>
        </div>
      );
    } else if (viewType === 'user' && selectedUser) {
      return renderAttendeeTable();
    } else {
      return (
        <div className="participation-dashboard-view">
          {renderRoleHeader()}
          {renderDashboardHeader()}
          
          <div className="participation-dashboard-stats">
            <div className="participation-stat-card participation-stat-card-events">
              <div className="participation-stat-value">{attendees.length}</div>
              <div className="participation-stat-label">Total Registrants</div>
            </div>
            <div className="participation-stat-card participation-stat-card-programs">
              <div className="participation-stat-value">{attendees.filter(a => a.is_volunteer === 'yes').length}</div>
              <div className="participation-stat-label">Volunteers</div>
            </div>
            <div className="participation-stat-card participation-stat-card-attendance">
              <div className="participation-stat-value">{attendees.filter(a => a.attended === 'yes').length}</div>
              <div className="participation-stat-label">Actually Attended</div>
            </div>
            <div className="participation-stat-card participation-stat-card-volunteer">
              <div className="participation-stat-value">
                {attendees.length > 0 
                  ? Math.round((attendees.filter(a => a.attended === 'yes').length / attendees.length) * 100) 
                  : 0}%
              </div>
              <div className="participation-stat-label">Attendance Rate</div>
            </div>
          </div>
          
          {/* Recent Events */}
          <div className="recent-events-section">
            <h4>Recent Events</h4>
            <div className="events-grid">
              {events.slice(0, 3).map(event => (
                <div 
                  key={event.id} 
                  className="participation-event-card"
                  onClick={() => handleEventChange(event)}
                >
                  <h5>{event.event_name || (event.event && event.event.event) || 'Unnamed Event'}</h5>
                  <p className="event-date">
                    {event.event?.timeframe ? new Date(event.event.timeframe).toLocaleDateString() : 'Date not available'}
                  </p>
                  <p className="event-location">{event.event?.location || 'Location not specified'}</p>
                  <div className="event-footer">
                    <span className="event-barangay">{event.barangay}</span>
                    <span className="attendance-rate">
                      {event.participants_count > 0 
                        ? Math.round((event.attendees_count / event.participants_count) * 100) 
                        : 0}% attended
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Top Programs */}
          <div className="top-programs-section">
            <h4>Active Programs</h4>
            <div className="programs-grid">
              {programs.slice(0, 3).map(program => (
                <div 
                  key={program.id} 
                  className="participation-program-card"
                  onClick={() => handleProgramChange(program)}
                >
                  <h5>{program.project?.name}</h5>
                  <p className="program-dates">
                    {program.time_start ? new Date(program.time_start).toLocaleDateString() : 'Start date not available'} - 
                    {program.time_end ? new Date(program.time_end).toLocaleDateString() : 'End date not available'}
                  </p>
                  <div className="program-footer">
                    <span className="program-barangay">{program.barangay}</span>
                    <span className="applicants-count">{program.applicantsCount || 0} applicants</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* User search section */}
          {viewType !== 'user' && renderUserSearchSection()}

          {/* Show user history below Active Programs if a user is selected */}
          {selectedUser && viewType !== 'user' && (
            <div className="user-history-section" style={{marginTop:'32px'}}>
              {renderAttendeeTable()}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="participation-container">
      <div className="participation-header">
        <h2 className="participation-title">KK Participation Tracking</h2>
        <p className="participation-subtitle">View and analyze event attendance and volunteer participation</p>
      </div>

      {/* Top Nav Tabs */}
      <div className="participation-tabs">
        <button 
          className={`participation-tab ${viewType === 'event' || viewType === 'program' ? 'active' : ''}`}
          onClick={() => {
            setViewType('event');
            setSelectedUser(null);
          }}
        >
          Events & Programs
        </button>
        {selectedUser && (
          <button 
            className={`participation-tab ${viewType === 'user' ? 'active' : ''}`}
            onClick={() => setViewType('user')}
          >
            User: {selectedUser.name}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="participation-filters">
        {isFederationAdmin && (
          <div className="participation-filter-group">
            <label htmlFor="barangay-filter">Filter by Barangay:</label>
            <div className="participation-select-wrapper">
              <select
                id="barangay-filter"
                value={selectedBarangay}
                onChange={handleBarangayChange}
                className="participation-select"
              >
                <option value="">All Barangays</option>
                {barangayOptions.map(barangay => (
                  <option key={barangay} value={barangay}>{barangay}</option>
                ))}
              </select>
              <FaChevronDown className="participation-dropdown-icon" />
            </div>
          </div>
        )}

        {viewType !== 'user' && (
          <>
            <div className="participation-filter-group">
              <label htmlFor="type-filter">View Type:</label>
              <div className="participation-select-wrapper">
                <select
                  id="type-filter"
                  value={viewType}
                  onChange={(e) => {
                    setViewType(e.target.value);
                    setSelectedEvent(null);
                    setSelectedProgram(null);
                  }}
                  disabled={loading}
                  className="participation-select"
                >
                  <option value="event">Events</option>
                  <option value="program">Programs</option>
                </select>
                <FaChevronDown className="participation-dropdown-icon" />
              </div>
            </div>

            {viewType === 'event' && (
              <div className="participation-filter-group">
                <label htmlFor="event-filter">Select Event:</label>
                <div className="participation-select-wrapper">
                  <select
                    id="event-filter"
                    value={selectedEvent?.id || ''}
                    onChange={(e) => {
                      const event = events.find(ev => ev.id === parseInt(e.target.value));
                      handleEventChange(event);
                    }}
                    disabled={loading}
                    className="participation-select"
                  >
                    <option value="">Select an event</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.event_name || (event.event && event.event.event) || 'Unnamed Event'}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="participation-dropdown-icon" />
                </div>
              </div>
            )}

            {viewType === 'program' && (
              <div className="participation-filter-group">
                <label htmlFor="program-filter">Select Program:</label>
                <div className="participation-select-wrapper">
                  <select
                    id="program-filter"
                    value={selectedProgram?.id || ''}
                    onChange={(e) => {
                      const program = programs.find(prog => prog.id === parseInt(e.target.value));
                      handleProgramChange(program);
                    }}
                    disabled={loading}
                    className="participation-select"
                  >
                    <option value="">Select a program</option>
                    {programs.map(program => (
                      <option key={program.id} value={program.id}>
                        {program.project?.name}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="participation-dropdown-icon" />
                </div>
              </div>
            )}
          </>
        )}

        <div className="participation-filter-group participation-filter-toggle">
          <button 
            className={`participation-filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> {showFilters ? 'Hide Filters' : 'More Filters'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="participation-advanced-filters">
          <div className="participation-date-filters">
            <div className="participation-date-filter-group">
              <label htmlFor="date-start">Start Date:</label>
              <input
                type="date"
                id="date-start"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="participation-date-input"
              />
            </div>
            <div className="participation-date-filter-group">
              <label htmlFor="date-end">End Date:</label>
              <input
                type="date"
                id="date-end"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="participation-date-input"
              />
            </div>
            <button className="participation-apply-filter-btn">Apply Filters</button>
            <button 
              className="participation-clear-filter-btn"
              onClick={() => setDateRange({ start: '', end: '' })}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="participation-main-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Participation;