import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../css/CalendarComponent.css';
import axios from 'axios';

const CalendarComponent = () => {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [eventTooltip, setEventTooltip] = useState({ show: false, event: null, position: {} });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Updated to use the same endpoint as Event Management
        const response = await axios.get('/api/eventmanage');
        const formattedEvents = response.data.map(event => ({
          title: event.event,
          date: new Date(event.timeframe).toISOString().split('T')[0],
          status: event.status.toLowerCase(), // Ensure status is lowercase for consistency
          description: event.description,
          location: event.location,
          barangay: event.barangay
        }));
        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      }
    };

    fetchEvents();
  }, []);
  
  const getTileClassName = ({ date }) => {
    const formattedDate = date.toISOString().split('T')[0];
    const event = events.find(evt => evt.date === formattedDate);
    
    if (!event) return '';

    // Use the same status classes as Event Management
    switch (event.status) {
      case 'ongoing':
        return 'youth-cal-tile-ongoing';
      case 'upcoming':
        return 'youth-cal-tile-upcoming';
      case 'completed':
        return 'youth-cal-tile-completed';
      default:
        return '';
    }
  };

  const getTileContent = ({ date }) => {
    const formattedDate = date.toISOString().split('T')[0];
    const event = events.find(evt => evt.date === formattedDate);
    
    if (!event) return null;
    
    // Return null for content, we're using className for styling
    return null;
  };

  // Function to handle mouse hover on tiles to show event details
  const handleTileHover = (event, tileDate) => {
    const formattedDate = tileDate.toISOString().split('T')[0];
    const eventData = events.find(evt => evt.date === formattedDate);
    
    if (eventData) {
      const rect = event.currentTarget.getBoundingClientRect();
      setEventTooltip({
        show: true,
        event: eventData,
        position: {
          top: rect.top,
          left: rect.left + rect.width / 2
        }
      });
    }
  };

  // Function to hide tooltip
  const handleTileLeave = () => {
    setEventTooltip({ show: false, event: null, position: {} });
  };

  const handleTileClick = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    const event = events.find(evt => evt.date === formattedDate);
    
    if (event) {
      // You can add a modal or tooltip here to show event details
      console.log('Event details:', event);
    }
  };

  return (
    <div className="youth-cal-container">
      <h2 className="youth-cal-title">CALENDAR OF ACTIVITIES</h2>
      <Calendar
        onChange={setDate}
        value={date}
        className="youth-cal-custom"
        tileClassName={getTileClassName}
        tileContent={getTileContent}
        onClickTile={handleTileClick}
      />
      
      {/* Legend for the event types */}
      <div className="youth-cal-legend">
        <div className="youth-cal-legend-item">
          <div className="youth-cal-legend-color youth-cal-legend-ongoing"></div>
          <span>Ongoing</span>
        </div>
        <div className="youth-cal-legend-item">
          <div className="youth-cal-legend-color youth-cal-legend-upcoming"></div>
          <span>Upcoming</span>
        </div>
        <div className="youth-cal-legend-item">
          <div className="youth-cal-legend-color youth-cal-legend-completed"></div>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarComponent;