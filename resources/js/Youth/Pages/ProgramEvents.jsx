// ProgramEvents.jsx
import React, { useState, useEffect, useContext } from "react";
import ChatComponent from "../components/ChatComponent";
import "../css/ProgramEvents.css";
import Notification from "../../SK/Components/Notification";
import {
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaClock,
    FaFilter,
    FaTimes,
    FaUsers,
    FaTags,
    FaUser,
    FaBuilding,
    FaUserTag,
    FaFileAlt
} from "react-icons/fa";
import YouthLayout from "../Components/YouthLayout";
import axios from "axios";
import eventsImg from "../../assets/events.png";
import { AuthContext } from "../../Contexts/AuthContext";
import ProgramSection from '../Components/ProgramSection';

const ProgramEvents = () => {
    // State for active tab (Programs or Events)
    const [activeTab, setActiveTab] = useState("events");
    
    // State for active category filter
    const [activeBarangay, setActiveBarangay] = useState("All");
    
    // State for filter dropdown on mobile
    const [showFilters, setShowFilters] = useState(false);
    
    // State for data from DB
    const [publishedEvents, setPublishedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Get auth context
    const { user, loading: authLoading } = useContext(AuthContext);

    // Registration modal state
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [currentEventId, setCurrentEventId] = useState(null);
    const [registrationFormData, setRegistrationFormData] = useState({
        name: "",
        age: "",
        barangay: "",
        joiningAs: "",
    });
    const [formErrors, setFormErrors] = useState({});
    const [registrationLoading, setRegistrationLoading] = useState(false);

    // Barangays for filtering - sorted with "All" at beginning
    const barangays = [
        "All",
        "Dela Paz",
        "Manggahan",
        "Maybunga",
        "Pinagbuhatan",
        "Rosario",
        "San Miguel",
        "Santa Lucia",
        "Santolan",
    ].sort((a, b) => {
        // Keep 'All' at the beginning
        if (a === "All") return -1;
        if (b === "All") return 1;
        // Sort other barangays alphabetically
        return a.localeCompare(b);
    });

    // Joining options
    const joiningOptions = ["Participant", "Volunteer"];

    // Configure axios defaults
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common["Accept"] = "application/json";
    axios.defaults.headers.common["Content-Type"] = "application/json";
    axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

    // Fetch published events from DB (with barangay filtering)
    useEffect(() => {
        const fetchPublishedEvents = async () => {
            try {
                setLoading(true);
                setError(null);

                // Add user_id and profile_id to the request if user is logged in
                const params = {
                    barangay: activeBarangay === "All" ? null : activeBarangay,
                };

                if (user) {
                    params.user_id = user.id;
                    if (user.profile_id) {
                        params.profile_id = user.profile_id;
                    }
                }

                const response = await axios.get("/api/events/published-events", { params });

                // Log the response for debugging
                console.log("Published events response:", response.data);

                // Ensure response.data is an array
                if (!Array.isArray(response.data)) {
                    console.error("Invalid response format:", response.data);
                    throw new Error("Invalid response format from server");
                }

                // Sort events by date (most recent first)
                const sortedEvents = response.data.sort((a, b) => {
                    // First sort by barangay
                    const barangayA = a.barangay || '';
                    const barangayB = b.barangay || '';
                    if (barangayA !== barangayB) {
                        return barangayA.localeCompare(barangayB);
                    }
                    // If same barangay, sort by date
                    const dateA = new Date(a.event?.timeframe || 0);
                    const dateB = new Date(b.event?.timeframe || 0);
                    return dateB - dateA;
                });

                setPublishedEvents(sortedEvents);
            } catch (err) {
                console.error("Error fetching published events:", err);
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to fetch events. Please try again later."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPublishedEvents();
    }, [activeBarangay, user]); // Add user to dependencies

    // Add new state for registered attendees
    const [registeredAttendees, setRegisteredAttendees] = useState({});

    // Fetch registered attendees for each event
    useEffect(() => {
        const fetchRegisteredAttendees = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/registered-attendees');
                const attendees = response.data;

                // Group attendees by eventmanage_id
                const attendeesByEvent = attendees.reduce((acc, attendee) => {
                    const eventId = attendee.eventmanage_id;
                    if (!acc[eventId]) {
                        acc[eventId] = [];
                    }
                    acc[eventId].push(attendee);
                    return acc;
                }, {});

                setRegisteredAttendees(attendeesByEvent);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching registered attendees:', err);
                setError('Failed to load registered attendees');
                setLoading(false);
            }
        };

        fetchRegisteredAttendees();
    }, []);

    // Handle registration form input changes
    const handleRegistrationFormChange = (e) => {
        const { name, value } = e.target;
        setRegistrationFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));

        // Clear error for this field when user types
        if (formErrors[name]) {
            setFormErrors((prevErrors) => ({
                ...prevErrors,
                [name]: "",
            }));
        }
    };

    // Validate registration form
    const validateRegistrationForm = () => {
        const errors = {};
        if (!registrationFormData.name.trim()) {
            errors.name = "Name is required";
        }
        if (!registrationFormData.age) {
            errors.age = "Age is required";
        }
        if (!registrationFormData.barangay) {
            errors.barangay = "Barangay is required";
        }
        if (!registrationFormData.joiningAs) {
            errors.joiningAs = "Please select how you're joining";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Open registration modal with demographic checks
    const openRegistrationModal = async (eventId) => {
        if (!user) {
            setNotification({
                show: true,
                message: "Please log in to register for events.",
                type: "error"
            });
            window.location.href = "/login";
            return;
        }

        try {
            // Check profile status
            const response = await axios.get(`/api/events/check-profile-status/${user.id}`);
            const { status, message, profile } = response.data;

            if (status !== 'complete') {
                setNotification({
                    show: true,
                    message: message,
                    type: "error"
                });
                if (status === 'no_profile' || status === 'incomplete') {
                    window.location.href = "/profile";
                }
                return;
            }

            // If profile is complete, proceed with registration
            setCurrentEventId(eventId);
            setShowRegistrationModal(true);

            // Pre-fill the registration form with profile data
            setRegistrationFormData({
                name: `${profile.first_name} ${profile.middle_name ? profile.middle_name + ' ' : ''}${profile.last_name}`,
                age: profile.age,
                barangay: profile.barangay,
                joiningAs: ""
            });

        } catch (error) {
            console.error("Error checking profile status:", error);
            setNotification({
                show: true,
                message: "Error checking profile status. Please try again.",
                type: "error"
            });
        }
    };

    // Check if user is registered for an event
    const isUserRegisteredForEvent = (event) => {
        if (!user) return false;
        return event.registeredAttendees?.some(attendee => attendee.account_id === user.id);
    };

    // Submit registration
    const submitRegistration = async (e) => {
        e.preventDefault();

        if (!validateRegistrationForm()) {
            return;
        }

        // Check if user is authenticated
        if (!user || !user.id) {
            setNotification({
                show: true,
                message: "Please log in to register for events.",
                type: "error"
            });
            window.location.href = "/login";
            return;
        }

        try {
            setRegistrationLoading(true);
            setFormErrors({});

            // Split the name into parts
            const nameParts = registrationFormData.name.split(' ');
            const firstName = nameParts[0];
            const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
            const lastName = nameParts[nameParts.length - 1];

            const registrationData = {
                publish_event_id: currentEventId,
                account_id: user.id,
                first_name: firstName,
                middle_name: middleName,
                last_name: lastName,
                barangay: registrationFormData.barangay,
                attendee_type: registrationFormData.joiningAs.toLowerCase()
            };

            // Get CSRF token
            await axios.get('/sanctum/csrf-cookie');

            // Verify user exists before proceeding
            try {
                await axios.get(`/api/users/verify/${user.id}`);
            } catch (error) {
                setNotification({
                    show: true,
                    message: "Your session has expired. Please log in again.",
                    type: "error"
                });
                window.location.href = "/login";
                return;
            }

            const response = await axios.post('/api/events/register-attendee', registrationData);

            // Update the event counts in the events list
            setPublishedEvents(publishedEvents.map(event => {
                if (event.id === currentEventId) {
                    return {
                        ...event,
                        isRegistered: true,
                        participants_count: response.data.participants_count || event.participants_count,
                        volunteers_count: response.data.volunteers_count || event.volunteers_count
                    };
                }
                return event;
            }));
        
            // Update selected event if it's the same as the current event
            if (selectedEvent && selectedEvent.id === currentEventId) {
                setSelectedEvent(prev => ({
                    ...prev,
                    participants_count: response.data.participants_count || prev.participants_count,
                    volunteers_count: response.data.volunteers_count || prev.volunteers_count
                }));
            }

            setShowRegistrationModal(false);
            setRegistrationFormData({
                name: '',
                age: '',
                barangay: '',
                joiningAs: 'Participant'
            });
            setFormErrors({});

            setNotification({
                show: true,
                message: "Successfully registered for the event!",
                type: "success"
            });
        } catch (error) {
            console.error('Registration error:', error);
            let errorMessage = 'Failed to register for the event. Please try again.';
        
            if (error.response?.status === 409) {
                errorMessage = "You have already registered for this event.";
            } else if (error.response?.status === 422) {
                // Handle validation errors
                const validationErrors = error.response.data.errors;
                if (validationErrors) {
                    setFormErrors(validationErrors);
                    errorMessage = 'Please check the form for errors.';
                }
            } else if (error.response?.status === 403) {
                errorMessage = error.response.data.error === 'This event does not require volunteers'
                    ? "This event does not require volunteers. Please register as a participant instead."
                    : "You do not match any of the required demographics for this event. Please check the event requirements.";
            } else if (error.response?.status === 404) {
                errorMessage = "Please complete your profile before registering for events.";
            } else if (error.response?.status === 401) {
                errorMessage = "Your session has expired. Please log in again.";
                window.location.href = "/login";
                return;
            }

            setNotification({
                show: true,
                message: errorMessage,
                type: "error"
            });
        } finally {
            setRegistrationLoading(false);
        }
    };

    // Render register button based on user status
    const renderRegisterButton = (event) => {
        if (!user) {
            return (
                <button
                    className="youth-pe-btn youth-pe-btn-primary"
                    onClick={() => {
                        window.location.href = "/login";
                    }}
                >
                    Log In to Register
                </button>
            );
        }
    
        if (user.profile_status === "not_profiled") {
            return (
                <button
                    className="youth-pe-btn youth-pe-btn-primary"
                    onClick={() => {
                        window.location.href = "/profile";
                    }}
                >
                    Complete Profile to Register
                </button>
            );
        }
    
        if (isUserRegisteredForEvent(event) || event.isRegistered) {
            return (
                <button
                    className="youth-pe-btn youth-pe-btn-secondary"
                    disabled
                >
                    Already Registered
                </button>
            );
        }
    
        return (
            <button
                className="youth-pe-btn youth-pe-btn-primary"
                onClick={() => openRegistrationModal(event.id)}
            >
                Register
            </button>
        );
    };
    // Filter events based on selected barangay
    const filteredEvents = publishedEvents.filter((event) => {
        if (activeBarangay === "All") return true;
        const eventBarangay = event.barangay || event.event?.barangay;
        return eventBarangay?.toLowerCase() === activeBarangay.toLowerCase();
    });

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

    // Calculate current year for copyright
    const currentYear = new Date().getFullYear();

    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // Update the event card rendering to include attendee count
    const renderEventCard = (event) => {
        const participantCount = event.participants_count || 0;
        const volunteerCount = event.volunteers_count || 0;

        return (
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
                        <div className="youth-pe-event-detail">
                            <FaUsers className="youth-pe-event-icon" />
                            <div className="youth-pe-attendees-info">
                                <div className="youth-pe-attendee-count">
                                    <span>{participantCount} {participantCount === 1 ? 'Participant' : 'Participants'}</span>
                                    {event.need_volunteers === 'yes' && (
                                        <>
                                            <span className="youth-pe-attendee-separator">•</span>
                                            <span>{volunteerCount} {volunteerCount === 1 ? 'Volunteer' : 'Volunteers'}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        {event.selected_tags && (
                            <div className="youth-pe-event-detail">
                                <FaTags className="youth-pe-event-icon" />
                                <div className="youth-pe-tags-container">
                                    {(typeof event.selected_tags === "string"
                                        ? JSON.parse(event.selected_tags)
                                        : event.selected_tags
                                    )
                                        .slice(0, 5) // Only show first 5 tags
                                        .map((tag, index) => (
                                            <span
                                                key={index}
                                                className="youth-pe-tag"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    {(typeof event.selected_tags === "string"
                                        ? JSON.parse(event.selected_tags).length > 5
                                        : event.selected_tags.length > 5) && (
                                        <span className="youth-pe-tag-more">
                                            +
                                            {typeof event.selected_tags === "string"
                                                ? JSON.parse(event.selected_tags).length - 5
                                                : event.selected_tags.length - 5}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="youth-pe-event-description">
                        {event.description || event.event?.description || "No description available"}
                    </p>
                    <div className="youth-pe-event-actions">
                        {renderRegisterButton(event)}
                        <button
                            className="youth-pe-btn youth-pe-btn-secondary"
                            onClick={() => setSelectedEvent(event)}
                        >
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <YouthLayout>
            {notification.show && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification({ show: false, message: '', type: '' })}
                />
            )}

            {/* Banner Section */}
            <section className="youth-pe-banner">
                <div className="youth-pe-banner-content">
                    <h1 className="youth-pe-banner-title">Programs & Events</h1>
                    <p className="youth-pe-banner-subtitle">
                        Discover opportunities for growth, learning, and community involvement
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="youth-pe-content-wrapper">
                <div className="youth-pe-container">
                    {/* Tabs Navigation */}
                    <div className="youth-pe-tabs-container">
                        <div className="youth-pe-tabs">
                            <button 
                                className={`youth-pe-tab ${activeTab === 'events' ? 'youth-pe-tab-active' : ''}`}
                                onClick={() => setActiveTab('events')}
                            >
                                Upcoming Events
                            </button>
                            <button 
                                className={`youth-pe-tab ${activeTab === 'programs' ? 'youth-pe-tab-active' : ''}`}
                                onClick={() => setActiveTab('programs')}
                            >
                                Ongoing Programs
                            </button>
                        </div>
                    </div>
                    
                    {/* Filter Section */}
                    <div className="youth-pe-filter-section">
                        <div className="youth-pe-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                            <FaFilter className="youth-pe-filter-icon" /> 
                            <span>Filter by Barangay</span> 
                            {showFilters ? <FaTimes /> : null}
                        </div>
                        
                        <div className={`youth-pe-filters ${showFilters ? 'youth-pe-filters-active' : ''}`}>
                            {barangays.map((barangay) => (
                                <button
                                    key={barangay}
                                    className={`youth-pe-filter-btn ${activeBarangay === barangay ? 'youth-pe-filter-active' : ''}`}
                                    onClick={() => {
                                        setActiveBarangay(barangay);
                                        setShowFilters(false);
                                    }}
                                >
                                    {barangay}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Loading and Error States */}
                    {loading && (
                        <div className="youth-pe-loading">
                            <div className="youth-pe-spinner"></div>
                            <p>Loading events...</p>
                        </div>
                    )}

                    {error && (
                        <div className="youth-pe-no-content">
                            <div className="youth-pe-error-message">
                                <FaTimes className="youth-pe-error-icon" />
                                <p>Error: {error}</p>
                            </div>
                        </div>
                    )}

                    {/* Events Content */}
                    {!loading && !error && activeTab === 'events' && (
                        <div className="youth-pe-events-content">
                            <h2 className="youth-pe-section-title">
                                {activeBarangay === "All"
                                    ? "All Upcoming Events"
                                    : `Events in ${activeBarangay}`}
                            </h2>
                            
                            {!authLoading && !user && (
                                <div className="youth-pe-login-notice">
                                    <p>
                                        You're viewing events as a guest.
                                        <a
                                            href="/login"
                                            className="youth-pe-login-link"
                                        >
                                            {" "}
                                            Log in
                                        </a>{" "}
                                        to register for events.
                                    </p>
                                </div>
                            )}

                            {filteredEvents.length === 0 ? (
                                <div className="youth-pe-no-content">
                                    <p className="youth-pe-no-content-text">No events found in this category. Please check back later or try another category.</p>
                                </div>
                            ) : (
                                <div className="youth-pe-events-grid">
                                    {filteredEvents.map(renderEventCard)}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Programs Content */}
                    {!loading && !error && activeTab === 'programs' && (
                        <ProgramSection
                            activeBarangay={activeBarangay}
                            user={user}
                            authLoading={authLoading}
                        />
                    )}
                </div>
                
                {/* Call to Action Section */}
                <div className="youth-pe-cta">
                    <div className="youth-pe-cta-content">
                        <h2 className="youth-pe-cta-title">Want to propose a program or event?</h2>
                        <p className="youth-pe-cta-text">Have an idea for a youth program or event? We welcome your suggestions and proposals!</p>
                        <a href="/submit-proposal" className="youth-pe-btn youth-pe-btn-secondary youth-pe-cta-btn">Submit a Proposal</a>
                    </div>
                </div>
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="youth-pe-modal-overlay">
                    <div className="youth-pe-modal">
                        <div className="youth-pe-modal-header">
                            <h2>
                                {selectedEvent.event?.event || "Event Details"}
                            </h2>
                            <button
                                className="youth-pe-modal-close"
                                onClick={() => setSelectedEvent(null)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="youth-pe-modal-body">
                            <div className="youth-pe-event-details-section">
                                <h3>Event Information</h3>
                                <div className="youth-pe-detail-row">
                                    <span className="youth-pe-detail-label">
                                        Barangay:
                                    </span>
                                    <span className="youth-pe-barangay-badge">
                                        {selectedEvent.barangay ||
                                            selectedEvent.event?.barangay ||
                                            "No barangay specified"}
                                    </span>
                                </div>
                                <div className="youth-pe-detail-row">
                                    <span className="youth-pe-detail-label">
                                        Date:
                                    </span>
                                    <span>
                                        {formatDate(
                                            selectedEvent.event?.timeframe
                                        )}
                                    </span>
                                </div>
                                <div className="youth-pe-detail-row">
                                    <span className="youth-pe-detail-label">
                                        Time:
                                    </span>
                                    <span>
                                        {formatTime(
                                            selectedEvent.event?.timeframe
                                        )}
                                    </span>
                                </div>
                                <div className="youth-pe-detail-row">
                                    <span className="youth-pe-detail-label">
                                        Location:
                                    </span>
                                    <span>
                                        {selectedEvent.event?.location ||
                                            "N/A"}
                                    </span>
                                </div>
                                <div className="youth-pe-detail-row">
                                    <span className="youth-pe-detail-label">
                                        Total Attendees:
                                    </span>
                                    <span>
                                        {selectedEvent.attendees?.length ||
                                            0}
                                    </span>
                                </div>
                                <div className="youth-pe-detail-row">
                                    <span className="youth-pe-detail-label">
                                        Participants:
                                    </span>
                                    <span>
                                        {selectedEvent.participants_count || 0}
                                    </span>
                                </div>
                                {selectedEvent.need_volunteers === 'yes' && (
                                    <div className="youth-pe-detail-row">
                                        <span className="youth-pe-detail-label">
                                            Volunteers:
                                        </span>
                                        <span>
                                            {selectedEvent.volunteers_count || 0}
                                        </span>
                                    </div>
                                )}
                                {selectedEvent.selected_tags && (
                                    <div className="youth-pe-detail-row">
                                        <span className="youth-pe-detail-label">
                                            Target Demographics:
                                        </span>
                                        <div className="youth-pe-tags-container">
                                            {(typeof selectedEvent.selected_tags ===
                                            "string"
                                                ? JSON.parse(
                                                      selectedEvent.selected_tags
                                                  )
                                                : selectedEvent.selected_tags
                                            ).map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="youth-pe-tag"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="youth-pe-detail-row">
                                    <span className="youth-pe-detail-label">
                                        Description:
                                    </span>
                                    <p>
                                        {selectedEvent.description ||
                                            selectedEvent.event
                                                ?.description ||
                                            "No description available"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="youth-pe-modal-footer">
                            {!user ? (
                                <button
                                    className="youth-pe-btn youth-pe-btn-primary"
                                    onClick={() => {
                                        window.location.href = "/login";
                                    }}
                                >
                                    Log In to Register
                                </button>
                            ) : user.profile_status === "not_profiled" ? (
                                <button
                                    className="youth-pe-btn youth-pe-btn-primary"
                                    onClick={() => {
                                        window.location.href = "/profile";
                                    }}
                                >
                                    Complete Profile to Register
                                </button>
                            ) : (
                                <button
                                    className="youth-pe-btn youth-pe-btn-primary"
                                    onClick={() =>
                                        openRegistrationModal(
                                            selectedEvent.id
                                        )
                                    }
                                >
                                    Register Now
                                </button>
                            )}
                            <button
                                className="youth-pe-btn youth-pe-btn-secondary"
                                onClick={() => setSelectedEvent(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Registration Modal */}
            {showRegistrationModal && (
                <div className="youth-pe-modal-overlay">
                    <div className="youth-pe-modal youth-pe-registration-modal">
                        <div className="youth-pe-modal-header">
                            <h2>Register for Event</h2>
                            <button
                                className="youth-pe-modal-close"
                                onClick={() => setShowRegistrationModal(false)}
                                disabled={registrationLoading}
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={submitRegistration}>
                            <div className="youth-pe-modal-body">
                                <div className="youth-pe-registration-form">
                                    <div className="youth-pe-form-group">
                                        <label className="youth-pe-form-label">
                                            <FaUser className="youth-pe-form-icon" />{" "}
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            className={`youth-pe-form-input ${
                                                formErrors.name
                                                    ? "error"
                                                    : ""
                                            }`}
                                            value={
                                                registrationFormData.name
                                            }
                                            onChange={
                                                handleRegistrationFormChange
                                            }
                                            disabled={registrationLoading}
                                            required
                                        />
                                        {formErrors.name && (
                                            <span className="youth-pe-input-error">
                                                {formErrors.name}
                                            </span>
                                        )}
                                    </div>

                                    <div className="youth-pe-form-group">
                                        <label className="youth-pe-form-label">
                                            <FaUserTag className="youth-pe-form-icon" />{" "}
                                            Age
                                        </label>
                                        <input
                                            type="number"
                                            name="age"
                                            className={`youth-pe-form-input ${
                                                formErrors.age
                                                    ? "error"
                                                    : ""
                                            }`}
                                            value={registrationFormData.age}
                                            onChange={
                                                handleRegistrationFormChange
                                            }
                                            disabled={registrationLoading}
                                            required
                                        />
                                        {formErrors.age && (
                                            <span className="youth-pe-input-error">
                                                {formErrors.age}
                                            </span>
                                        )}
                                    </div>

                                    <div className="youth-pe-form-group">
                                        <label className="youth-pe-form-label">
                                            <FaBuilding className="youth-pe-form-icon" />{" "}
                                            Barangay
                                        </label>
                                        <select
                                            name="barangay"
                                            className={`youth-pe-form-input ${
                                                formErrors.barangay
                                                    ? "error"
                                                    : ""
                                            }`}
                                            value={
                                                registrationFormData.barangay
                                            }
                                            onChange={
                                                handleRegistrationFormChange
                                            }
                                            disabled={registrationLoading}
                                            required
                                        >
                                            <option value="">
                                                Select barangay
                                            </option>
                                            {barangays
                                                .filter((b) => b !== "All")
                                                .map((barangay) => (
                                                    <option
                                                        key={barangay}
                                                        value={barangay}
                                                    >
                                                        {barangay}
                                                    </option>
                                                ))}
                                        </select>
                                        {formErrors.barangay && (
                                            <span className="youth-pe-input-error">
                                                {formErrors.barangay}
                                            </span>
                                        )}
                                    </div>

                                    <div className="youth-pe-form-group">
                                        <label className="youth-pe-form-label">
                                            <FaUsers className="youth-pe-form-icon" />{" "}
                                            Joining the event as
                                        </label>
                                        <select
                                            name="joiningAs"
                                            className={`youth-pe-form-input ${
                                                formErrors.joiningAs
                                                    ? "error"
                                                    : ""
                                            }`}
                                            value={
                                                registrationFormData.joiningAs
                                            }
                                            onChange={
                                                handleRegistrationFormChange
                                            }
                                            disabled={registrationLoading}
                                            required
                                        >
                                            <option value="">
                                                Select role
                                            </option>
                                            {joiningOptions.map(
                                                (option) => (
                                                    <option
                                                        key={option}
                                                        value={option}
                                                    >
                                                        {option}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                        {formErrors.joiningAs && (
                                            <span className="youth-pe-input-error">
                                                {formErrors.joiningAs}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="youth-pe-modal-footer">
                                <button
                                    type="submit"
                                    className="youth-pe-btn youth-pe-btn-primary"
                                    disabled={registrationLoading}
                                >
                                    {registrationLoading
                                        ? "Registering..."
                                        : "Complete Registration"}
                                </button>
                                <button
                                    type="button"
                                    className="youth-pe-btn youth-pe-btn-secondary"
                                    onClick={() =>
                                        setShowRegistrationModal(false)
                                    }
                                    disabled={registrationLoading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* Chat Component */}
            <ChatComponent />
        </YouthLayout>
    );
};

export default ProgramEvents;