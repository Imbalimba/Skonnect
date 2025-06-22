import React, { useState, useEffect, useContext } from 'react';
import CalendarComponent from '../components/CalendarComponent';
import '../css/HomePage.css';
import YouthLayout from '../Components/YouthLayout';
import AnnouncementsSection from '../components/AnnouncementsSection';
import AllAnnouncements from './AllAnnouncement';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaUsers } from 'react-icons/fa';
import axios from 'axios';
import { AuthContext } from '../../Contexts/AuthContext';
import eventsImg from '../../assets/events.png';
import femImg from '../../assets/fem.png';

const HomePage = () => {
  const [featuredPrograms, setFeaturedPrograms] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  // Configure axios defaults
  axios.defaults.withCredentials = true;
  axios.defaults.headers.common["Accept"] = "application/json";
  axios.defaults.headers.common["Content-Type"] = "application/json";
  axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting to fetch data...');
        setLoading(true);
        setError(null);

        // Add user_id and profile_id to the request if user is logged in
        const params = {};
        if (user) {
          params.user_id = user.id;
          if (user.profile_id) {
            params.profile_id = user.profile_id;
          }
        }

        // Fetch both programs and events in parallel
        const [programsResponse, eventsResponse] = await Promise.all([
          axios.get("/api/publish-programs", { params }),
          axios.get("/api/events/published-events", { params })
        ]);

        console.log('Programs response:', programsResponse.data);
        console.log('Events response:', eventsResponse.data);

        // Sort programs by date (most recent first)
        const sortedPrograms = programsResponse.data.sort((a, b) => {
          const dateA = new Date(a.time_start || 0);
          const dateB = new Date(b.time_start || 0);
          return dateB - dateA;
        });

        // Get featured programs (first 2)
        const featured = sortedPrograms.slice(0, 2);
        console.log('Featured programs:', featured);
        setFeaturedPrograms(featured);

        // Sort events by date (most recent first)
        const sortedEvents = eventsResponse.data.sort((a, b) => {
          const dateA = new Date(a.event?.timeframe || 0);
          const dateB = new Date(b.event?.timeframe || 0);
          return dateB - dateA;
        });

        // Get upcoming events (first 4)
        const upcoming = sortedEvents.slice(0, 4);
        console.log('Upcoming events:', upcoming);
        setUpcomingEvents(upcoming);

      } catch (err) {
        console.error("Error fetching data:", err);
        console.error("Error details:", {
          message: err.message,
          response: err.response,
          status: err.response?.status,
          data: err.response?.data
        });
        setError(
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch data. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Format date from timeframe
  const formatDate = (timeframe) => {
    if (!timeframe) return "Date not specified";
    const date = new Date(timeframe);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time from timeframe
  const formatTime = (timeframe) => {
    if (!timeframe) return "Time not specified";
    const date = new Date(timeframe);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <YouthLayout>
      <section className="youth-hp-banner">
        <div className="youth-hp-banner-content">
          <h1 className="youth-hp-banner-text">Basta Kabataang Pasigueño, Aktibo!</h1>
          <p className="youth-hp-banner-subtitle">Empowering the youth of Pasig City through leadership, service, and community</p>
        </div>
      </section>
      
      <div className="youth-hp-content-wrapper">
        <div className="youth-hp-main-content">
          {/* Featured Programs Section */}
          <section className="youth-hp-section">
            <h2 className="youth-hp-section-title">Featured Programs</h2>
            
            {loading ? (
              <div className="youth-hp-loading">Loading programs...</div>
            ) : error ? (
              <div className="youth-hp-error">{error}</div>
            ) : featuredPrograms.length === 0 ? (
              <div className="youth-hp-no-content">No featured programs available at the moment.</div>
            ) : (
              <div className="youth-pe-programs-grid-homepage">
                {featuredPrograms.map((program) => (
                  <div key={program.id} className="youth-pe-program-card-homepage">
                    <div className="youth-pe-program-image-homepage">
                      <img 
                        src={program.project?.image || femImg}
                        alt={program.project?.ppas || "Program image"}
                        className="youth-pe-program-img-homepage"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = femImg;
                        }}
                      />
                      <span className="youth-pe-program-category-homepage">
                        {program.project?.center_of_participation || "Program"}
                      </span>
                    </div>
                    <div className="youth-pe-program-content-homepage">
                      <h3 className="youth-pe-program-title-homepage">
                        {program.project?.ppas || "Untitled Program"}
                      </h3>
                      <div className="youth-pe-program-info-homepage">
                        <div className="youth-pe-program-info-item-homepage">
                          <span className="youth-pe-program-info-label-homepage">
                            <FaCalendarAlt className="youth-pe-event-icon" />
                            Date:
                          </span>
                          <span className="youth-pe-program-info-text-homepage">
                            {formatDate(program.time_start)}
                          </span>
                        </div>
                        <div className="youth-pe-program-info-item-homepage">
                          <span className="youth-pe-program-info-label-homepage">
                            <FaClock className="youth-pe-event-icon" />
                            Time:
                          </span>
                          <span className="youth-pe-program-info-text-homepage">
                            {formatTime(program.time_start)}
                          </span>
                        </div>
                        <div className="youth-pe-program-info-item-homepage">
                          <span className="youth-pe-program-info-label-homepage">
                            <FaMapMarkerAlt className="youth-pe-event-icon" />
                            Location:
                          </span>
                          <span className="youth-pe-program-info-text-homepage">
                            {program.project?.barangay || "Location not specified"}
                          </span>
                        </div>
                      </div>
                      <p className="youth-pe-program-description-homepage">
                        {program.description || "No description available"}
                      </p>
                      <div className="youth-pe-event-actions youth-pe-full-width">
                        <a href={`/program-events?program=${program.id}`} className="youth-pe-btn youth-pe-btn-primary">Learn More</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          
          {/* Upcoming Events Section */}
          <section className="youth-hp-section">
            <h2 className="youth-hp-section-title">Upcoming Events</h2>
            
            {loading ? (
              <div className="youth-hp-loading">Loading events...</div>
            ) : error ? (
              <div className="youth-hp-error">{error}</div>
            ) : upcomingEvents.length === 0 ? (
              <div className="youth-hp-no-content">No upcoming events available at the moment.</div>
            ) : (
              <>
                <div className="youth-pe-events-grid">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="youth-pe-event-card">
                      <div className="youth-pe-event-image">
                        <img 
                          src={event.image || eventsImg}
                          alt={event.event?.event || "Event image"}
                          className="youth-pe-event-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = eventsImg;
                          }}
                        />
                        <span className="youth-pe-event-category">
                          {event.barangay || event.event?.barangay || "City-wide"}
                        </span>
                      </div>
                      <div className="youth-pe-event-content">
                        <h3 className="youth-pe-event-title">
                          {event.event?.event || "Untitled Event"}
                        </h3>
                        <div className="youth-pe-event-details">
                          <div className="youth-pe-event-detail">
                            <FaCalendarAlt className="youth-pe-event-icon" />
                            <span className="youth-pe-event-text">
                              {formatDate(event.event?.timeframe)}
                            </span>
                          </div>
                          <div className="youth-pe-event-detail">
                            <FaClock className="youth-pe-event-icon" />
                            <span className="youth-pe-event-text">
                              {formatTime(event.event?.timeframe)}
                            </span>
                          </div>
                          <div className="youth-pe-event-detail">
                            <FaMapMarkerAlt className="youth-pe-event-icon" />
                            <span className="youth-pe-event-text">
                              {event.event?.location || "Location not specified"}
                            </span>
                          </div>
                          {event.participants_count !== undefined && (
                            <div className="youth-pe-event-detail">
                              <FaUsers className="youth-pe-event-icon" />
                              <div className="youth-pe-attendees-info">
                                <div className="youth-pe-attendee-count">
                                  <span>{event.participants_count} {event.participants_count === 1 ? 'Participant' : 'Participants'}</span>
                                  {event.need_volunteers === 'yes' && (
                                    <>
                                      <span className="youth-pe-attendee-separator">•</span>
                                      <span>{event.volunteers_count || 0} {event.volunteers_count === 1 ? 'Volunteer' : 'Volunteers'}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="youth-pe-event-description">
                          {event.description || event.event?.description || "No description available"}
                        </p>
                        <div className="youth-pe-event-actions">
                          <a href={`/program-events?event=${event.id}`} className="youth-pe-btn youth-pe-btn-primary">View Details</a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="youth-hp-view-all">
                  <a href="/program-events" className="youth-hp-link">View All Events</a>
                </div>
              </>
            )}
          </section>
        </div>
        
        <div className="youth-hp-sidebar">
          {/* Quick Links */}
          <div className="youth-hp-quick-links">
            <h3 className="youth-hp-section-heading">Quick Links</h3>
            <div className="youth-hp-links-grid">
              <a href="/youth-development-policies" className="youth-hp-quick-link">
                <div className="youth-hp-quick-link-icon">📋</div>
                <span>Youth Development Plan</span>
              </a>
              <a href="/templates" className="youth-hp-quick-link">
                <div className="youth-hp-quick-link-icon">📝</div>
                <span>Document Templates</span>
              </a>
              <a href="/directory" className="youth-hp-quick-link">
                <div className="youth-hp-quick-link-icon">👥</div>
                <span>SK Official Directory</span>
              </a>
              <a href="/faqs" className="youth-hp-quick-link">
                <div className="youth-hp-quick-link-icon">❓</div>
                <span>FAQs</span>
              </a>
            </div>
          </div>
          
          {/* Announcements Section */}
          <AnnouncementsSection />
          
          {/* Calendar Component */}
          <CalendarComponent />
        </div>
      </div>
    </YouthLayout>
  );
};

export default HomePage;