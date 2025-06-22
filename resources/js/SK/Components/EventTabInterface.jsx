import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";
import "../css/EventTabInterface.css";

const EventTabInterface = ({
    onClose,
    skUser,
    isFederationAdmin,
    editingEvent,
}) => {
    // State for active tab
    const [activeTab, setActiveTab] = useState("add");

    // State for Add Event form
const [eventForm, setEventForm] = useState(
    editingEvent
        ? {
              ...editingEvent,
              timeframe: editingEvent.timeframe
                  ? new Date(editingEvent.timeframe).toISOString().slice(0, 16)
                  : "",
              status: editingEvent.status || "upcoming", // Ensure status has a value
          }
        : {
              event: "",
              timeframe: "",
              location: "",
              description: "",
              status: "upcoming", // Default value
              barangay: isFederationAdmin ? "" : skUser?.sk_station || "",
          }
);
    // State for Publish Event
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState("");
    const [selectedDemographics, setSelectedDemographics] = useState([]);
    const [matchingProfiles, setMatchingProfiles] = useState(0);
    const [needVolunteers, setNeedVolunteers] = useState("no"); // New state for volunteer requirement

    // Define barangay options
    const barangayOptions = [
        "Dela Paz",
        "Manggahan",
        "Maybunga",
        "Pinagbuhatan",
        "Rosario",
        "San Miguel",
        "Santa Lucia",
        "Santolan",
    ];

    // State for advanced demographic filters - expanded for completeness
    const [filters, setFilters] = useState({
        gender: {
            male: false,
            female: false,
        },
        ageGroup: {
            child: false, // 15-17
            core: false, // 18-24
            young: false, // 25-30
        },
        civilStatus: {
            single: false,
            married: false,
            widowed: false,
            divorced: false,
            separated: false,
            annulled: false,
            liveIn: false,
            unknown: false,
        },
        voterStatus: {
            skVoter: false,
            nationalVoter: false,
            votedLastElection: false,
        },
        education: {
            elementaryLevel: false,
            elementaryGrad: false,
            highSchoolLevel: false,
            highSchoolGrad: false,
            vocationalGrad: false,
            collegeLevel: false,
            collegeGrad: false,
            mastersLevel: false,
            mastersGrad: false,
            doctorateLevel: false,
            doctorateGrad: false,
        },
        employment: {
            employed: false,
            unemployed: false,
            selfEmployed: false,
            lookingForJob: false,
            notInterestedInJob: false,
        },
        communityInvolvement: {
            youthOrgMember: false,
            pwd: false,
            athlete: false,
            soloParent: false,
            scholar: false,
            lgbtqia: false,
        },
    });

    // Loading state
    const [isLoading, setIsLoading] = useState(false);

    // Fetch events for dropdown
    useEffect(() => {
        fetchEvents();
    }, []);

    // Fetch events when active tab changes to publish
    useEffect(() => {
        if (activeTab === "publish") {
            fetchEvents();
        }
    }, [activeTab]);

    // Calculate matching profiles when demographics or filters change
    useEffect(() => {
        if (
            selectedEvent &&
            (selectedDemographics.length > 0 || needVolunteers === "yes")
        ) {
            fetchMatchingProfilesCount();
        } else {
            setMatchingProfiles(0);
        }
    }, [selectedEvent, selectedDemographics, needVolunteers]);

    useEffect(() => {
        console.log("Editing Event:", editingEvent);
    }, [editingEvent]);

    // Fetch all events from database
    const fetchEvents = async () => {
        try {
            const response = await axios.get("/api/eventmanage");
            let allEvents = response.data;

            // Filter events by barangay if not federation admin
            if (!isFederationAdmin && skUser?.sk_station) {
                allEvents = allEvents.filter(
                    (event) => event.barangay === skUser.sk_station
                );
            }

            setEvents(allEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
            alert("Error fetching events. Please try again.");
        }
    };

    // Format date for datetime-local input
    const formatDateForInput = (date) => {
        const d = new Date(date);
        return d.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
    };

    // Handle input change for Add Event form
    const handleEventFormChange = (e) => {
        const { name, value } = e.target;
        setEventForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    // Update your handleAddEventSubmit to handle both create and update
    const handleAddEventSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        let barangayValue = eventForm.barangay;
        if (isFederationAdmin && !barangayValue) {
            alert("Please select a barangay");
            setIsLoading(false);
            return;
        } else if (!isFederationAdmin && skUser?.sk_station) {
            barangayValue = skUser.sk_station;
        }

        const requestData = {
            event: String(eventForm.event),
            timeframe: new Date(eventForm.timeframe).toISOString(),
            location: String(eventForm.location),
            description: String(eventForm.description),
            status: String(eventForm.status),
            barangay: String(barangayValue),
        };

        console.log("Sending POST request to /api/eventmanage with:", requestData);

        if (editingEvent && editingEvent.id) {
            // PUT request for update
            console.log("Making PUT request to update event");
            const response = await axios.put(
                `/api/eventmanage/${editingEvent.id}`,
                requestData
            );
            console.log("Update response:", response.data);
            alert("Event updated successfully!");
            onClose();
        } else {
            // POST request for create
            console.log("Making POST request to create event");
            const response = await axios.post("/api/eventmanage", requestData);
            console.log("Create response:", response.data);
            alert("Event added successfully!");
            setEventForm({
                event: "",
                timeframe: "",
                location: "",
                description: "",
                status: "upcoming",
                barangay: isFederationAdmin ? "" : skUser?.sk_station || "",
            });
        }
    } catch (error) {
        console.error("Full error details:", error);
        console.log("Error config:", error.config);

        let errorMessage = "Failed to save event.";
        if (error.response) {
            console.log("Error response data:", error.response.data);
            console.log("Error response status:", error.response.status);
            console.log("Error response headers:", error.response.headers);

            if (error.response.data?.errors) {
                errorMessage = Object.values(error.response.data.errors)
                    .flat()
                    .join("\n");
            } else if (error.response.data?.message) {
                errorMessage = error.response.data.message;
            }
        } else if (error.request) {
            console.log("Error request:", error.request);
            errorMessage = "No response received from server";
        }

        alert(errorMessage);
    } finally {
        setIsLoading(false);
    }
};
// Handle demographic tag selection
    const handleDemographicSelect = (demographic) => {
        if (selectedDemographics.includes(demographic)) {
            setSelectedDemographics((prev) =>
                prev.filter((item) => item !== demographic)
            );
        } else {
            setSelectedDemographics((prev) => [...prev, demographic]);
        }
    };

    // Handle filter checkbox changes
    const handleFilterChange = (category, option, displayName) => {
        // First, update the filter state
        setFilters((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [option]: !prev[category][option],
            },
        }));

        // Then add or remove the tag from selectedDemographics
        const tagName =
            displayName || getDisplayNameForFilter(category, option);

        if (!filters[category][option]) {
            // If checkbox is being checked, add to demographics
            if (!selectedDemographics.includes(tagName)) {
                setSelectedDemographics((prev) => [...prev, tagName]);
            }
        } else {
            // If checkbox is being unchecked, remove from demographics
            setSelectedDemographics((prev) =>
                prev.filter((item) => item !== tagName)
            );
        }
    };

    // Get display name for a filter
    const getDisplayNameForFilter = (category, option) => {
        // Mapping of filter options to display names
        const displayNames = {
            gender: {
                male: "Male",
                female: "Female",
            },
            ageGroup: {
                child: "Child Youth (15-17)",
                core: "Core Youth (18-24)",
                young: "Young Adult (25-30)",
            },
            civilStatus: {
                single: "Single",
                married: "Married",
                widowed: "Widowed",
                divorced: "Divorced",
                separated: "Separated",
                annulled: "Annulled",
                liveIn: "Live-in",
                unknown: "Unknown",
            },
            voterStatus: {
                skVoter: "SK Voter",
                nationalVoter: "National Voter",
                votedLastElection: "Voted Last Election",
            },
            education: {
                elementaryLevel: "Elementary Level",
                elementaryGrad: "Elementary Grad",
                highSchoolLevel: "High School Level",
                highSchoolGrad: "High School Grad",
                vocationalGrad: "Vocational Grad",
                collegeLevel: "College Level",
                collegeGrad: "College Grad",
                mastersLevel: "Masters Level",
                mastersGrad: "Masters Grad",
                doctorateLevel: "Doctorate Level",
                doctorateGrad: "Doctorate Grad",
            },
            employment: {
                employed: "Employed",
                unemployed: "Unemployed",
                selfEmployed: "Self-Employed",
                lookingForJob: "Currently Looking For a Job",
                notInterestedInJob: "Not Interested Looking For a Job",
            },
            communityInvolvement: {
                youthOrgMember: "Youth Org Member",
                pwd: "PWD",
                athlete: "Athlete",
                soloParent: "Solo Parent",
                scholar: "Scholar",
                lgbtqia: "LGBTQIA+",
            },
        };

        return displayNames[category]?.[option] || `${category} ${option}`;
    };

    const [filtersCollapsed, setFiltersCollapsed] = useState(false);
    // Select all filters and demographicsad
    const handleSelectAll = () => {
        // Update all filters to true
        const newFilters = {
            gender: {
                male: true,
                female: true,
            },
            ageGroup: {
                child: true,
                core: true,
                young: true,
            },
            civilStatus: {
                single: true,
                married: true,
                widowed: true,
                divorced: true,
                separated: true,
                annulled: true,
                liveIn: true,
                unknown: true,
            },
            voterStatus: {
                skVoter: true,
                nationalVoter: true,
                votedLastElection: true,
            },
            education: {
                elementaryLevel: true,
                elementaryGrad: true,
                highSchoolLevel: true,
                highSchoolGrad: true,
                vocationalGrad: true,
                collegeLevel: true,
                collegeGrad: true,
                mastersLevel: true,
                mastersGrad: true,
                doctorateLevel: true,
                doctorateGrad: true,
            },
            employment: {
                employed: true,
                unemployed: true,
                selfEmployed: true,
                lookingForJob: true,
                notInterestedInJob: true,
            },
            communityInvolvement: {
                youthOrgMember: true,
                pwd: true,
                athlete: true,
                soloParent: true,
                scholar: true,
                lgbtqia: true,
            },
        };

        setFilters(newFilters);

        // Add all demographics to selectedDemographics
        const allDemographics = [];
        Object.keys(newFilters).forEach((category) => {
            Object.keys(newFilters[category]).forEach((option) => {
                allDemographics.push(getDisplayNameForFilter(category, option));
            });
        });

        setSelectedDemographics(allDemographics);
    };

    // Clear all filters and demographics
    const handleClearAll = () => {
        resetFilters();
        setSelectedDemographics([]);
    };

    // Fetch count of matching profiles based on selected demographics and filters
    const fetchMatchingProfilesCount = async () => {
        try {
            // Only proceed if we have an event selected and either demographics or needVolunteers
            if (!selectedEvent || (selectedDemographics.length === 0 && needVolunteers === "no")) {
                setMatchingProfiles(0);
                return;
            }

            console.log("Matching Profiles Request:", {
                demographics: selectedDemographics,
                filters: filters,
                barangay: isFederationAdmin ? eventForm.barangay : skUser?.sk_station,
                need_volunteers: needVolunteers,
            });

            const response = await axios.post(
                "/api/events/matching-profiles",
                {
                    demographics: selectedDemographics,
                    filters: filters,
                    barangay: isFederationAdmin ? eventForm.barangay : skUser?.sk_station,
                    need_volunteers: needVolunteers,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            );

            setMatchingProfiles(response.data.count || 0);
        } catch (error) {
            console.error("Full error details for matching profiles:", error);

            let errorMessage = "Failed to fetch matching profiles.";

            if (error.response) {
                console.log("Error Response:", error.response);

                if (error.response.status === 422) {
                    if (error.response.data.errors) {
                        const validationErrors = Object.values(error.response.data.errors)
                            .flat()
                            .join("\n");
                        errorMessage = `Validation Error:\n${validationErrors}`;
                    } else {
                        errorMessage =
                            error.response.data.message ||
                            error.response.data.error ||
                            "Validation failed";
                    }
                } else {
                    errorMessage =
                        error.response.data.details ||
                        error.response.data.message ||
                        error.response.data.error ||
                        "Failed to fetch matching profiles";
                }
            } else if (error.request) {
                errorMessage = "No response received from the server";
            } else {
                errorMessage = "Error setting up the matching profiles request";
            }

            console.error(errorMessage);
            setMatchingProfiles(0);
        }
    };

    const handlePublishEventSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!selectedEvent) {
            alert("Please select an event to publish");
            setIsLoading(false);
            return;
        }

        if (selectedDemographics.length === 0 && needVolunteers === "no") {
            alert(
                "Please select at least one demographic or filter, or indicate that volunteers are needed"
            );
            setIsLoading(false);
            return;
        }

        try {
            // Prepare publish event data with comprehensive logging
            const publishData = {
                event_id: selectedEvent,
                selected_tags: selectedDemographics,
                filters: filters,
                need_volunteers: needVolunteers,
                description: "", // Add empty description if not provided
                event_type: eventForm.event_type || "sk", // Add event_type
                barangay:
                    events.find(
                        (event) => event.id.toString() === selectedEvent
                    )?.barangay ||
                    (isFederationAdmin
                        ? eventForm.barangay
                        : skUser?.sk_station),
            };

            console.log("Publish Event Request:", publishData);

            const response = await axios.post(
                "/api/events/publish",
                publishData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            );

            alert("Event published successfully!");
            console.log("Publish response:", response.data);

            // Reset form
            setSelectedEvent("");
            setSelectedDemographics([]);
            setNeedVolunteers("no");
            resetFilters();
        } catch (error) {
            console.error("Full error details for publishing event:", error);

            let errorMessage = "Failed to publish event.";

            if (error.response) {
                console.log("Error Response:", error.response);

                // Handle validation errors
                if (error.response.status === 422) {
                    if (error.response.data.errors) {
                        const validationErrors = Object.values(
                            error.response.data.errors
                        )
                            .flat()
                            .join("\n");
                        errorMessage = `Validation Error:\n${validationErrors}`;
                    } else {
                        errorMessage =
                            error.response.data.message ||
                            error.response.data.error ||
                            "Validation failed";
                    }
                } else if (error.response.status === 500) {
                    errorMessage =
                        error.response.data.error ||
                        "Internal server error occurred while publishing event";
                } else {
                    // Other error status codes
                    errorMessage =
                        error.response.data.details ||
                        error.response.data.message ||
                        error.response.data.error ||
                        "Failed to publish event";
                }
            } else if (error.request) {
                errorMessage = "No response received from the server";
            } else {
                errorMessage = "Error setting up the publish event request";
            }

            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    // Reset all filters to their default (false) values
    const resetFilters = () => {
        setFilters({
            gender: {
                male: false,
                female: false,
            },
            ageGroup: {
                child: false,
                core: false,
                young: false,
            },
            civilStatus: {
                single: false,
                married: false,
                widowed: false,
                divorced: false,
                separated: false,
                annulled: false,
                liveIn: false,
                unknown: false,
            },
            voterStatus: {
                skVoter: false,
                nationalVoter: false,
                votedLastElection: false,
            },
            education: {
                elementaryLevel: false,
                elementaryGrad: false,
                highSchoolLevel: false,
                highSchoolGrad: false,
                vocationalGrad: false,
                collegeLevel: false,
                collegeGrad: false,
                mastersLevel: false,
                mastersGrad: false,
                doctorateLevel: false,
                doctorateGrad: false,
            },
            employment: {
                employed: false,
                unemployed: false,
                selfEmployed: false,
                lookingForJob: false,
                notInterestedInJob: false,
            },
            communityInvolvement: {
                youthOrgMember: false,
                pwd: false,
                athlete: false,
                soloParent: false,
                scholar: false,
                lgbtqia: false,
            },
        });
    };

    return (
        <div className="event-tab-modal-overlay">
            <div className="event-tab-interface">
                <div className="event-tab-header">
                    <div className="event-tabs">
                        <button
                            className={`event-tab ${
                                activeTab === "add" ? "active" : ""
                            }`}
                            onClick={() => setActiveTab("add")}
                        >
                            ADD EVENT
                        </button>
                        <button
                            className={`event-tab ${
                                activeTab === "publish" ? "active" : ""
                            }`}
                            onClick={() => setActiveTab("publish")}
                        >
                            PUBLISH EVENT
                        </button>
                    </div>
                    <button className="close-button" onClick={onClose}>
                        <FaTimes size={18} />
                    </button>
                </div>

                <div className="event-tab-content">
                    {/* ADD EVENT TAB */}
                    {activeTab === "add" && (
                        <div className="add-event-tab">
                            <h2>Add New Event</h2>
                            <form onSubmit={handleAddEventSubmit}>
                                <div className="form-group">
                                    <label htmlFor="event">Event Name*</label>
                                    <input
                                        type="text"
                                        id="event"
                                        name="event"
                                        value={eventForm.event}
                                        onChange={handleEventFormChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="timeframe">
                                        Date & Time*
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="timeframe"
                                        name="timeframe"
                                        value={eventForm.timeframe}
                                        onChange={handleEventFormChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="location">Location*</label>
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        value={eventForm.location}
                                        onChange={handleEventFormChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">
                                        Description*
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={eventForm.description}
                                        onChange={handleEventFormChange}
                                        rows="4"
                                        required
                                    ></textarea>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="status">Status*</label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={eventForm.status || "upcoming"}
                                        onChange={handleEventFormChange}
                                        required
                                    >
                                        <option value="upcoming">Upcoming</option>
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                {/* Barangay Selection Field */}
                                <div className="form-group">
                                    <label htmlFor="barangay">Barangay*</label>
                                    {isFederationAdmin ? (
                                        <select
                                            id="barangay"
                                            name="barangay"
                                            value={eventForm.barangay}
                                            onChange={handleEventFormChange}
                                            required
                                        >
                                            <option value="">
                                                -- Select Barangay --
                                            </option>
                                            {barangayOptions.map(
                                                (barangay, index) => (
                                                    <option
                                                        key={index}
                                                        value={barangay}
                                                    >
                                                        {barangay}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            id="barangay"
                                            name="barangay"
                                            value={eventForm.barangay}
                                            readOnly
                                            disabled
                                        />
                                    )}
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Saving..." : "Save Event"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* PUBLISH EVENT TAB */}
                    {activeTab === "publish" && (
                        <div className="publish-event-tab">
                            <h2>Publish Event to Skonnect Website</h2>

                            <form onSubmit={handlePublishEventSubmit}>
                                <div className="info-box">
                                    <p>
                                        Select an event to publish and specify
                                        which demographic groups should receive
                                        it or if volunteers are needed.
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="selectedEvent">
                                        Select Event:
                                    </label>
                                    <select
                                        id="selectedEvent"
                                        value={selectedEvent}
                                        onChange={(e) =>
                                            setSelectedEvent(e.target.value)
                                        }
                                        required
                                    >
                                        <option value="">
                                            -- Select an event --
                                        </option>
                                        {events.map((event) => (
                                            <option
                                                key={event.id}
                                                value={event.id}
                                            >
                                                {event.event} (
                                                {new Date(
                                                    event.timeframe
                                                ).toLocaleDateString()}
                                                )
                                                {isFederationAdmin &&
                                                    ` - ${
                                                        event.barangay ||
                                                        "All Barangays"
                                                    }`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Add Event Type dropdown */}
                                <div className="form-group">
                                    <label htmlFor="eventType">
                                        Event Type*
                                    </label>
                                    <select
                                        id="eventType"
                                        value={eventForm.event_type || "sk"}
                                        onChange={(e) => setEventForm(prev => ({
                                            ...prev,
                                            event_type: e.target.value
                                        }))}
                                        required
                                    >
                                        <option value="sk">SK Event</option>
                                        <option value="youth">Youth Event</option>
                                    </select>
                                    <small className="form-text text-muted">
                                        Select whether this is an SK event or a general youth event
                                    </small>
                                </div>

                                {/* New Volunteer Requirement Field */}
                                <div className="form-group">
                                    <label htmlFor="needVolunteers">
                                        Do you need volunteers for this event?
                                    </label>
                                    <select
                                        id="needVolunteers"
                                        value={needVolunteers}
                                        onChange={(e) =>
                                            setNeedVolunteers(e.target.value)
                                        }
                                    >
                                        <option value="no">No</option>
                                        <option value="yes">Yes</option>
                                    </select>
                                    <small className="form-text text-muted">
                                        If "Yes", only users who have
                                        volunteered will be able to see and
                                        register for this event.
                                    </small>
                                </div>

                                {/* Barangay Selection Field for Federation Admin */}
                                {isFederationAdmin &&
                                    activeTab === "publish" &&
                                    !selectedEvent && (
                                        <div className="form-group">
                                            <label htmlFor="publishBarangay">
                                                Target Barangay:
                                            </label>
                                            <select
                                                id="publishBarangay"
                                                name="barangay"
                                                value={eventForm.barangay}
                                                onChange={handleEventFormChange}
                                            >
                                                <option value="">
                                                    -- All Barangays --
                                                </option>
                                                {barangayOptions.map(
                                                    (barangay, index) => (
                                                        <option
                                                            key={index}
                                                            value={barangay}
                                                        >
                                                            {barangay}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                            <small className="form-text text-muted">
                                                Select a specific barangay or
                                                leave blank to target all
                                                barangays
                                            </small>
                                        </div>
                                    )}

                                {/* Selected Demographics Section */}
                                <div className="form-group">
                                    <label>Selected Demographics:</label>
                                    <div className="selected-demographics">
                                        {selectedDemographics.length > 0 ? (
                                            selectedDemographics.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="demographic-badge"
                                                >
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDemographicSelect(
                                                                tag
                                                            )
                                                        }
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))
                                        ) : (
                                            <p className="no-demographics">
                                                No demographics selected
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Matching Profiles Count - Moved above filters */}
                                <div className="matching-profiles">
                                    <p>
                                        Matching Profiles:{" "}
                                        <span className="count">
                                            {matchingProfiles}
                                        </span>
                                    </p>
                                </div>

                                {/* Select All and Clear All Buttons */}
                                <div className="filter-action-buttons">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={handleSelectAll}
                                    >
                                        Select All Filters
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={handleClearAll}
                                    >
                                        Clear All Filters
                                    </button>
                                </div>

                                {/* Demographic Filters Section */}
                                <div className="demographic-filters">
                                    <div className="filters-header">
                                        <h3>Demographic Filters</h3>
                                        <button
                                            type="button"
                                            className="collapse-button"
                                            onClick={() =>
                                                setFiltersCollapsed(
                                                    !filtersCollapsed
                                                )
                                            }
                                        >
                                            {filtersCollapsed
                                                ? "Show Filters"
                                                : "Hide Filters"}
                                        </button>
                                    </div>

                                    {!filtersCollapsed && (
                                        <div className="filters-content">
                                            <div className="filter-sections-container">
                                                {/* Gender Filters */}
                                                <div className="filter-section">
                                                    <h4>Gender</h4>
                                                    <div className="filter-options">
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters.gender
                                                                        .male
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "gender",
                                                                        "male",
                                                                        "Male"
                                                                    )
                                                                }
                                                            />
                                                            Male
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters.gender
                                                                        .female
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "gender",
                                                                        "female",
                                                                        "Female"
                                                                    )
                                                                }
                                                            />
                                                            Female
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Age Group Filters */}
                                                <div className="filter-section">
                                                    <h4>Age Group</h4>
                                                    <div className="filter-options">
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters.ageGroup
                                                                        .child
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "ageGroup",
                                                                        "child",
                                                                        "Child Youth (15-17)"
                                                                    )
                                                                }
                                                            />
                                                            Child Youth (15-17)
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters.ageGroup
                                                                        .core
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "ageGroup",
                                                                        "core",
                                                                        "Core Youth (18-24)"
                                                                    )
                                                                }
                                                            />
                                                            Core Youth (18-24)
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters.ageGroup
                                                                        .young
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "ageGroup",
                                                                        "young",
                                                                        "Young Adult (25-30)"
                                                                    )
                                                                }
                                                            />
                                                            Young Adult (25-30)
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Civil Status Filters */}
                                                <div className="filter-section">
                                                    <h4>Civil Status</h4>
                                                    <div className="filter-options">
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .civilStatus
                                                                        .single
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "civilStatus",
                                                                        "single",
                                                                        "Single"
                                                                    )
                                                                }
                                                            />
                                                            Single
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .civilStatus
                                                                        .married
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "civilStatus",
                                                                        "married",
                                                                        "Married"
                                                                    )
                                                                }
                                                            />
                                                            Married
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .civilStatus
                                                                        .widowed
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "civilStatus",
                                                                        "widowed",
                                                                        "Widowed"
                                                                    )
                                                                }
                                                            />
                                                            Widowed
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .civilStatus
                                                                        .divorced
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "civilStatus",
                                                                        "divorced",
                                                                        "Divorced"
                                                                    )
                                                                }
                                                            />
                                                            Divorced
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .civilStatus
                                                                        .separated
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "civilStatus",
                                                                        "separated",
                                                                        "Separated"
                                                                    )
                                                                }
                                                            />
                                                            Separated
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .civilStatus
                                                                        .annulled
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "civilStatus",
                                                                        "annulled",
                                                                        "Annulled"
                                                                    )
                                                                }
                                                            />
                                                            Annulled
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .civilStatus
                                                                        .liveIn
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "civilStatus",
                                                                        "liveIn",
                                                                        "Live-in"
                                                                    )
                                                                }
                                                            />
                                                            Live-in
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .civilStatus
                                                                        .unknown
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "civilStatus",
                                                                        "unknown",
                                                                        "Unknown"
                                                                    )
                                                                }
                                                            />
                                                            Unknown
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Voter Status Filters */}
                                                <div className="filter-section">
                                                    <h4>Voter Status</h4>
                                                    <div className="filter-options">
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .voterStatus
                                                                        .skVoter
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "voterStatus",
                                                                        "skVoter",
                                                                        "SK Voter"
                                                                    )
                                                                }
                                                            />
                                                            SK Voter
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .voterStatus
                                                                        .nationalVoter
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "voterStatus",
                                                                        "nationalVoter",
                                                                        "National Voter"
                                                                    )
                                                                }
                                                            />
                                                            National Voter
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .voterStatus
                                                                        .votedLastElection
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "voterStatus",
                                                                        "votedLastElection",
                                                                        "Voted Last Election"
                                                                    )
                                                                }
                                                            />
                                                            Voted Last Election
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Education Filters */}
                                                <div className="filter-section">
                                                    <h4>Education</h4>
                                                    <div className="filter-options">
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .education
                                                                        .elementaryLevel
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "education",
                                                                        "elementaryLevel",
                                                                        "Elementary Level"
                                                                    )
                                                                }
                                                            />
                                                            Elementary Level
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .education
                                                                        .elementaryGrad
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "education",
                                                                        "elementaryGrad",
                                                                        "Elementary Grad"
                                                                    )
                                                                }
                                                            />
                                                            Elementary Grad
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .education
                                                                        .highSchoolLevel
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "education",
                                                                        "highSchoolLevel",
                                                                        "High School Level"
                                                                    )
                                                                }
                                                            />
                                                            High School Level
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .education
                                                                        .highSchoolGrad
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "education",
                                                                        "highSchoolGrad",
                                                                        "High School Grad"
                                                                    )
                                                                }
                                                            />
                                                            High School Grad
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .education
                                                                        .vocationalGrad
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "education",
                                                                        "vocationalGrad",
                                                                        "Vocational Grad"
                                                                    )
                                                                }
                                                            />
                                                            Vocational Grad
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .education
                                                                        .collegeLevel
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "education",
                                                                        "collegeLevel",
                                                                        "College Level"
                                                                    )
                                                                }
                                                            />
                                                            College Level
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .education
                                                                        .collegeGrad
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "education",
                                                                        "collegeGrad",
                                                                        "College Grad"
                                                                    )
                                                                }
                                                            />
                                                            College Grad
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .education
                                                                        .mastersLevel
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "education",
                                                                        "mastersLevel",
                                                                        "Masters Level"
                                                                    )
                                                                }
                                                            />
                                                            Masters Level
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .education
                                                                        .mastersGrad
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "education",
                                                                        "mastersGrad",
                                                                        "Masters Grad"
                                                                    )
                                                                }
                                                            />
                                                            Masters Grad
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .education
                                                                        .doctorateLevel
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "education",
                                                                        "doctorateLevel",
                                                                        "Doctorate Level"
                                                                    )
                                                                }
                                                            />
                                                            Doctorate Level
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .education
                                                                        .doctorateGrad
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "education",
                                                                        "doctorateGrad",
                                                                        "Doctorate Grad"
                                                                    )
                                                                }
                                                            />
                                                            Doctorate Grad
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Employment Filters */}
                                                <div className="filter-section">
                                                    <h4>Employment</h4>
                                                    <div className="filter-options">
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .employment
                                                                        .employed
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "employment",
                                                                        "employed",
                                                                        "Employed"
                                                                    )
                                                                }
                                                            />
                                                            Employed
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .employment
                                                                        .unemployed
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "employment",
                                                                        "unemployed",
                                                                        "Unemployed"
                                                                    )
                                                                }
                                                            />
                                                            Unemployed
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .employment
                                                                        .selfEmployed
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "employment",
                                                                        "selfEmployed",
                                                                        "Self-Employed"
                                                                    )
                                                                }
                                                            />
                                                            Self-Employed
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .employment
                                                                        .lookingForJob
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "employment",
                                                                        "lookingForJob",
                                                                        "Currently Looking For a Job"
                                                                    )
                                                                }
                                                            />
                                                            Currently Looking For a
                                                            Job
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .employment
                                                                        .notInterestedInJob
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "employment",
                                                                        "notInterestedInJob",
                                                                        "Not Interested Looking For a Job"
                                                                    )
                                                                }
                                                            />
                                                            Not Interested Looking
                                                            For a Job
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Community Involvement Filters */}
                                                <div className="filter-section">
                                                    <h4>Community Involvement</h4>
                                                    <div className="filter-options">
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .communityInvolvement
                                                                        .youthOrgMember
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "communityInvolvement",
                                                                        "youthOrgMember",
                                                                        "Youth Org Member"
                                                                    )
                                                                }
                                                            />
                                                            Youth Org Member
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .communityInvolvement
                                                                        .pwd
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "communityInvolvement",
                                                                        "pwd",
                                                                        "PWD"
                                                                    )
                                                                }
                                                            />
                                                            PWD
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .communityInvolvement
                                                                        .athlete
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "communityInvolvement",
                                                                        "athlete",
                                                                        "Athlete"
                                                                    )
                                                                }
                                                            />
                                                            Athlete
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .communityInvolvement
                                                                        .soloParent
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "communityInvolvement",
                                                                        "soloParent",
                                                                        "Solo Parent"
                                                                    )
                                                                }
                                                            />
                                                            Solo Parent
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .communityInvolvement
                                                                        .scholar
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "communityInvolvement",
                                                                        "scholar",
                                                                        "Scholar"
                                                                    )
                                                                }
                                                            />
                                                            Scholar
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filters
                                                                        .communityInvolvement
                                                                        .lgbtqia
                                                                }
                                                                onChange={() =>
                                                                    handleFilterChange(
                                                                        "communityInvolvement",
                                                                        "lgbtqia",
                                                                        "LGBTQIA+"
                                                                    )
                                                                }
                                                            />
                                                            LGBTQIA+
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading
                                            ? "Publishing..."
                                            : "Publish Event"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventTabInterface;
