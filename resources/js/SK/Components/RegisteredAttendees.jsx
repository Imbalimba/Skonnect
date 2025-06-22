import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaFilter, FaCheck } from "react-icons/fa";

const RegisteredAttendees = ({ skUser }) => {
    const [attendees, setAttendees] = useState([]);
    const [filteredAttendees, setFilteredAttendees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [events, setEvents] = useState([]);
    
    // Filter states
    const [filter, setFilter] = useState("all"); // "all", "participant", "volunteer"
    const [selectedEvent, setSelectedEvent] = useState("all"); // "all" or specific event ID
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const attendeesPerPage = 10;
    
    // Check if the user is a federation admin
    const isFederationAdmin = skUser?.sk_role === "Federasyon";

    useEffect(() => {
        fetchEvents();
        fetchAttendees();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await axios.get("/api/eventmanage");
            let eventsData = Array.isArray(response.data) ? response.data : [];
            
            // Filter by barangay if not federation admin
            if (!isFederationAdmin && skUser?.sk_station) {
                eventsData = eventsData.filter(
                    event => event.barangay === skUser.sk_station
                );
            }
            
            // Sort events by timeframe, most recent first
            eventsData.sort((a, b) => new Date(b.timeframe) - new Date(a.timeframe));
            
            setEvents(eventsData);
        } catch (err) {
            console.error("Error fetching events:", err);
            setError("Failed to load events");
        }
    };

    const fetchAttendees = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedEvent !== "all") {
                params.append('eventmanage_id', selectedEvent);
            }
            
            const response = await axios.get(`/api/registered-attendees?${params.toString()}`);
            
            let attendeesData = Array.isArray(response.data) ? response.data : [];
            
            // Filter by barangay if not federation admin
            if (!isFederationAdmin && skUser?.sk_station) {
                attendeesData = attendeesData.filter(
                    attendee => attendee.barangay === skUser.sk_station
                );
            }
            
            setAttendees(attendeesData);
            setFilteredAttendees(attendeesData);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching attendees:", err);
            setError("Failed to load registered attendees");
            setLoading(false);
        }
    };

    // Apply filters
    useEffect(() => {
        let filtered = [...attendees];
        
        // Apply attendee type filter
        if (filter !== "all") {
            filtered = filtered.filter(
                (attendee) => attendee.attendee_type === filter
            );
        }
        
        setFilteredAttendees(filtered);
        setCurrentPage(1); // Reset to first page when filtering
    }, [filter, attendees]);

    // Update fetchAttendees when selectedEvent changes
    useEffect(() => {
        fetchAttendees();
    }, [selectedEvent]);

    // Handle event selection change
    const handleEventChange = (eventId) => {
        setSelectedEvent(eventId);
    };

    // Handle attendance checkbox change
    const handleAttendanceChange = async (attendeeId, attended) => {
        try {
            await axios.patch(`/api/registered-attendees/${attendeeId}`, {
                attended: attended ? 'yes' : 'no'
            });
            
            // Update local state
            const updatedAttendees = attendees.map((attendee) =>
                attendee.id === attendeeId
                    ? { ...attendee, attended: attended ? 'yes' : 'no' }
                    : attendee
            );
            setAttendees(updatedAttendees);
            
            // Reapply filters to the updated attendees
            let filtered = [...updatedAttendees];
            if (selectedEvent !== "all") {
                filtered = filtered.filter(
                    (attendee) => attendee.eventmanage_id === parseInt(selectedEvent)
                );
            }
            if (filter !== "all") {
                filtered = filtered.filter(
                    (attendee) => attendee.attendee_type === filter
                );
            }
            setFilteredAttendees(filtered);
        } catch (err) {
            console.error("Error updating attendance:", err);
            alert("Failed to update attendance status");
        }
    };

    // Pagination logic
    const indexOfLastAttendee = currentPage * attendeesPerPage;
    const indexOfFirstAttendee = indexOfLastAttendee - attendeesPerPage;
    const currentAttendees = filteredAttendees.slice(
        indexOfFirstAttendee,
        indexOfLastAttendee
    );
    const totalPages = Math.ceil(filteredAttendees.length / attendeesPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    if (loading) return <div className="loading-message">Loading attendees...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div>
            <div className="filter-controls">
                <div className="filter-dropdown" style={{ border: 'none' }}>
                        <select
                            value={selectedEvent}
                            onChange={(e) => handleEventChange(e.target.value)}
                            className="attendee-filter"
                        >
                            <option value="all">All Events</option>
                            {events.map(event => (
                                <option key={event.id} value={event.id}>
                                    {event.event} ({new Date(event.timeframe).toLocaleDateString()})
                                </option>
                            ))}
                        </select>
                </div>
                <div className="filter-dropdown" style={{ border: 'none' }}>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="attendee-filter"
                        >
                            <option value="all">All Attendees</option>
                            <option value="participant">Participants</option>
                            <option value="volunteer">Volunteers</option>
                        </select>
                </div>
            </div>

            <div className="em-event-table">
                <div className="em-event-table-header">
                    <div className="em-header-cell">FIRST NAME</div>
                    <div className="em-header-cell">MIDDLE NAME</div>
                    <div className="em-header-cell">LAST NAME</div>
                    <div className="em-header-cell">BARANGAY</div>
                    <div className="em-header-cell">ATTENDEE TYPE</div>
                    <div className="em-header-cell">ATTENDED?</div>
                </div>

                {currentAttendees.length > 0 ? (
                    currentAttendees.map((attendee) => (
                        <div className="em-event-table-row" key={attendee.id}>
                            <div className="em-table-cell">{attendee.first_name}</div>
                            <div className="em-table-cell">{attendee.middle_name || "-"}</div>
                            <div className="em-table-cell">{attendee.last_name}</div>
                            <div className="em-table-cell">{attendee.barangay}</div>
                            <div className="em-table-cell">
                                <span className={`em-status ${attendee.attendee_type === "participant" ? "upcoming" : "ongoing"}`}>
                                    {attendee.attendee_type === "participant"
                                        ? "Participant"
                                        : "Volunteer"}
                                </span>
                            </div>
                            <div className="em-table-cell">
                                <label className="attendance-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={attendee.attended === 'yes'}
                                        onChange={(e) =>
                                            handleAttendanceChange(
                                                attendee.id,
                                                e.target.checked
                                            )
                                        }
                                        className="attendance-checkbox"
                                    />
                                </label>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="em-event-table-row">
                        <div className="em-table-cell em-empty-message" colSpan="6">
                            No registered attendees found
                            {selectedEvent !== "all" || filter !== "all"
                                ? ` with the selected filters`
                                : ""}
                            .
                        </div>
                    </div>
                )}
            </div>

            {filteredAttendees.length > 0 && (
                <div className="em-pagination">
                    <button
                        className="em-pagination-button"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span className="em-pagination-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className="em-pagination-button"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default RegisteredAttendees;