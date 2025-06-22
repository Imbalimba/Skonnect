import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaChevronDown } from "react-icons/fa";
import "../css/event_management.css";
import EventTabInterface from "../Components/EventTabInterface";
import Notification from "./Notification";
import ConfirmationDialog from "./ConfirmationDialog";
import { AuthContext } from "../../Contexts/AuthContext";
import EventPagination from './event_pagination';
import RegisteredAttendees from "./RegisteredAttendees";

const EventManagement = () => {
    const { skUser } = useContext(AuthContext);
    const [showModal, setShowModal] = useState(false);
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [eventCounts, setEventCounts] = useState({
        ongoing: 0,
        completed: 0,
        upcoming: 0,
    });

    // Notification state
    const [notification, setNotification] = useState(null);

    // Barangay filtering state
    const isFederationAdmin = skUser?.sk_role === "Federasyon";
    const barangayOptions = [
        "All",
        "Dela Paz",
        "Manggahan",
        "Maybunga",
        "Pinagbuhatan",
        "Rosario",
        "San Miguel",
        "Santa Lucia",
        "Santolan",
    ];
    const [selectedBarangay, setSelectedBarangay] = useState(
        isFederationAdmin ? "All" : skUser?.sk_station || ""
    );

    const [editingEvent, setEditingEvent] = useState(null);

    // Confirmation dialog state
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmEventId, setConfirmEventId] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState({
        title: "",
        message: "",
        confirmText: "",
        confirmColor: "",
    });

    // Add active tab state
    const [activeTab, setActiveTab] = useState('events');

    // New function to update event counts
const updateEventCounts = (eventsToCount) => {
    // Ensure eventsToCount is an array
    const eventsArray = Array.isArray(eventsToCount) ? eventsToCount : [];

    // If not a federation admin, filter events by the user's barangay
    const filteredEvents = isFederationAdmin
        ? eventsArray
        : eventsArray.filter(
              (event) => event.barangay === skUser?.sk_station
          );

    const counts = filteredEvents.reduce(
        (acc, event) => {
            if (event && event.status) {
                switch (event.status.toLowerCase()) {
                    case "ongoing":
                        acc.ongoing++;
                        break;
                    case "completed":
                        acc.completed++;
                        break;
                    case "upcoming":
                        acc.upcoming++;
                        break;
                    default:
                        break;
                }
            }
            return acc;
        },
        { ongoing: 0, completed: 0, upcoming: 0 }
    );

    setEventCounts(counts);
};

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleConfirmAction = (action, eventId, config) => {
        setConfirmAction(() => action);
        setConfirmEventId(eventId);
        setConfirmConfig(config);
        setShowConfirmDialog(true);
    };

    const handleConfirm = async () => {
        setShowConfirmDialog(false);
        try {
            await confirmAction(confirmEventId);
            showNotification(confirmConfig.successMessage, "success");
            fetchEvents();
        } catch (error) {
            console.error("Error:", error);
            showNotification(
                confirmConfig.errorMessage || "An error occurred",
                "error"
            );
        }
    };

    const handleCancel = () => {
        setShowConfirmDialog(false);
    };

    const formatTimeframe = (timeframe) => {
        const date = new Date(timeframe);
        return date
            .toLocaleString("en-US", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            })
            .replace(",", "");
    };

    const formatCreatedOn = (created_on) => {
        if (!created_on) return "";
        const date = new Date(created_on);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    // Update your handleAddEvent to handle both add and edit
  const handleAddEvent = (eventToEdit = null) => {
      if (eventToEdit) {
          console.log("Editing event data:", eventToEdit); // Debug log
          const eventForEditing = {
              ...eventToEdit,
              id: eventToEdit.id, // Explicitly include the ID
              timeframe: eventToEdit.timeframe
                  ? new Date(eventToEdit.timeframe).toISOString().slice(0, 16)
                  : "",
          };
          setEditingEvent(eventForEditing);
      } else {
          setEditingEvent(null);
      }
      setShowModal(true);
  };

    const handleCloseModal = () => {
        setShowModal(false);
        fetchEvents();
    };

const fetchEvents = async () => {
    try {
        const response = await axios.get("/api/eventmanage");
        const allEvents = Array.isArray(response.data) ? response.data : []; // Ensure we always have an array
        setEvents(allEvents);

        // Filter events based on barangay if not federation admin
        if (!isFederationAdmin && skUser?.sk_station) {
            const filteredByBarangay = allEvents.filter(
                (event) => event.barangay === skUser.sk_station
            );
            setFilteredEvents(filteredByBarangay);
        } else {
            // Federation admin sees all events
            setFilteredEvents(allEvents);
        }

        // Update counts for the specific view
        updateEventCounts(allEvents);
    } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]); // Reset to empty array on error
        setFilteredEvents([]);
        showNotification("Error fetching events. Please try again.", "error");
    }
};
    // Handle barangay filter change
    const handleBarangayChange = (e) => {
        const barangay = e.target.value;
        setSelectedBarangay(barangay);

        if (barangay === "All") {
            // For federation admin, show all events when "All" is selected
            if (isFederationAdmin) {
                setFilteredEvents(events);
                updateEventCounts(events);
            } else {
                // For non-admin, show events from their barangay
                const filteredByBarangay = events.filter(
                    (event) => event.barangay === skUser.sk_station
                );
                setFilteredEvents(filteredByBarangay);
                updateEventCounts(filteredByBarangay);
            }
        } else {
            // When a specific barangay is selected (only for federation admin)
            const filtered = events.filter(
                (event) => event.barangay === barangay
            );
            setFilteredEvents(filtered);
            updateEventCounts(filtered);
        }
    };

    // In Event_Management.jsx, update your delete handler
    const handleDelete = async (id) => {
        const deleteAction = async (id) => {
            await axios.delete(`/api/eventmanage/${id}`);
            return true; // Indicate success
        };

        handleConfirmAction(deleteAction, id, {
            title: "Delete Event",
            message: "Are you sure you want to permanently delete this event?",
            confirmText: "Delete",
            confirmColor: "danger",
            successMessage: "Event deleted successfully!",
            errorMessage: "Error deleting event. Please try again.",
        });
    };

    useEffect(() => {
        fetchEvents();
    }, []);

const currentEvents = (
    isFederationAdmin && selectedBarangay !== "All"
        ? (filteredEvents || []).filter(
              (event) => event.barangay === selectedBarangay
          )
        : filteredEvents || []
);

    const [currentPage, setCurrentPage] = useState(1);
    const eventsPerPage = 10;

    // Add pagination logic
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const paginatedEvents = currentEvents.slice(indexOfFirstEvent, indexOfLastEvent);
    const totalPages = Math.ceil(currentEvents.length / eventsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="em-event">
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
            <ConfirmationDialog
                isOpen={showConfirmDialog}
                onClose={handleCancel}
                onConfirm={handleConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                confirmColor={confirmConfig.confirmColor}
            />
            {/* User Info Section */}
            <div className="em-user-info-section">
                <div className="em-user-info">
                    <div className="em-user-avatar">
                        {skUser?.first_name?.charAt(0) || "S"}
                    </div>
                    <div className="em-user-name">
                        {skUser?.first_name} {skUser?.last_name}
                    </div>
                </div>

                {/* Barangay Filter for Federation Admin */}
                {isFederationAdmin && (
                    <div className="em-filter-wrapper">
                        <div className="em-category-dropdown-wrapper">
                            <select
                                className="em-category-dropdown"
                                value={selectedBarangay}
                                onChange={handleBarangayChange}
                            >
                                {barangayOptions.map((barangay, index) => (
                                    <option key={index} value={barangay}>
                                        {barangay}
                                    </option>
                                ))}
                            </select>
                            <FaChevronDown className="em-dropdown-icon" />
                        </div>
                    </div>
                )}

                {/* Badge for non-admin users */}
                {!isFederationAdmin && (
                    <div className="em-barangay-indicator">
                        <span className="em-badge em-bg-primary">
                            Barangay: {skUser?.sk_station}
                        </span>
                    </div>
                )}
            </div>
            <div className="em-event-cards">
                <div className="em-event-card">
                    <div
                        className="em-circle"
                        style={{ backgroundColor: "yellow" }}
                    >
                        {eventCounts.ongoing}
                    </div>
                    <p className="em-title">Meetings/Hearings</p>
                    <p>Ongoing</p>
                </div>
                <div className="em-event-card">
                    <div
                        className="em-circle"
                        style={{ backgroundColor: "green" }}
                    >
                        {eventCounts.completed}
                    </div>
                    <p className="em-title">Events/Programs</p>
                    <p>Completed</p>
                </div>
                <div className="em-event-card">
                    <div className="em-circle" style={{ backgroundColor: "red" }}>
                        {eventCounts.upcoming}
                    </div>
                    <p className="em-title">Events/Programs</p>
                    <p>Upcoming</p>
                </div>
                <div
                    className="em-event-card"
                    onClick={handleAddEvent}
                    style={{ cursor: "pointer" }}
                >
                    <div className="em-circle" style={{ backgroundColor: "gray" }}>
                        +
                    </div>
                    <p className="em-title">Add/Publish Event</p>
                </div>
            </div>
            <div className="em-table-wrapper">
                {/* Add Tab Buttons */}
                <div className="em-tabs">
                    <button 
                        className={`em-tab-button ${activeTab === 'events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        Events
                    </button>
                    <button 
                        className={`em-tab-button ${activeTab === 'attendees' ? 'active' : ''}`}
                        onClick={() => setActiveTab('attendees')}
                    >
                        Registered Attendees
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'events' ? (
                    <div className="em-event-management-card">
                        <div className="em-event-table">
                            <div className="em-event-table-header">
                                <div className="em-header-cell">EVENT</div>
                                <div className="em-header-cell">LOCATION</div>
                                <div className="em-header-cell">DESCRIPTION</div>
                                <div className="em-header-cell">TIMEFRAME</div>
                                <div className="em-header-cell">CREATED ON</div>
                                <div className="em-header-cell">STATUS</div>
                                {isFederationAdmin && (
                                    <div className="em-header-cell">BARANGAY</div>
                                )}
                                <div className="em-header-cell">ACTION</div>
                            </div>

                            {paginatedEvents.length > 0 ? (
                                paginatedEvents.map((event) => (
                                    <div className="em-event-table-row" key={event.id}>
                                        <div className="em-table-cell">{event.event}</div>
                                        <div className="em-table-cell">
                                            {event.location || "N/A"}
                                        </div>
                                        <div className="em-table-cell">
                                            {event.description ? (
                                                <div
                                                    className="em-description-indicator"
                                                    title={event.description}
                                                >
                                                    <span className="em-has-description">
                                                        Has Description
                                                    </span>
                                                </div>
                                            ) : (
                                                "No Description"
                                            )}
                                        </div>
                                        <div className="em-table-cell">
                                            {formatTimeframe(event.timeframe)}
                                        </div>
                                        <div className="em-table-cell">
                                            {formatCreatedOn(event.created_on)}
                                        </div>
                                        <div className="em-table-cell">
                                            <span
                                                className={`em-status ${event.status.toLowerCase()}`}
                                            >
                                                {event.status}
                                            </span>
                                        </div>
                                        {isFederationAdmin && (
                                            <div className="em-table-cell">
                                                {event.barangay || "All Barangays"}
                                            </div>
                                        )}
                                        <div className="em-table-cell">
                                            <div className="em-flex em-space-x-2">
                                                <button
                                                    onClick={() =>
                                                        handleAddEvent(event)
                                                    }
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(event.id)
                                                    }
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="em-event-table-row">
                                    <div
                                        className="em-table-cell em-empty-message"
                                        colSpan={isFederationAdmin ? 8 : 7}
                                    >
                                        No events found
                                        {selectedBarangay !== "All"
                                            ? ` for ${selectedBarangay}`
                                            : ""}
                                        .
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="em-registered-attendees">
                        <RegisteredAttendees skUser={skUser} />
                    </div>
                )}
            </div>

            {showModal && (
                <EventTabInterface
                    onClose={handleCloseModal}
                    skUser={skUser}
                    isFederationAdmin={isFederationAdmin}
                    editingEvent={editingEvent}
                    fetchEvents={fetchEvents}
                />
            )}
        </div>
    );
};

export default EventManagement;
