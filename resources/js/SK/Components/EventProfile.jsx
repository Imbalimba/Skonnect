import React, { useState, useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react";
import "../css/eventprofile.css";

const EventProfile = ({ onClose, showModal }) => {
    // State for event selection
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState("");
    const [selectedEventDetails, setSelectedEventDetails] = useState(null);

    // State for demographics selection
    const [selectedDemographics, setSelectedDemographics] = useState([]);
    const [matchingProfiles, setMatchingProfiles] = useState(0);

    // State for demographic filters
    const [filters, setFilters] = useState({
        gender: {
            male: false,
            female: false,
        },
        ageGroup: {
            childYouth: false, // 15-17
            coreYouth: false, // 18-24
            youngAdult: false, // 25-30
        },
        civilStatus: {
            single: false,
            married: false,
            widowed: false,
            divorced: false,
            separated: false,
        },
        voterStatus: {
            skVoter: false,
            nationalVoter: false,
        },
        education: {
            elementary: false,
            highSchool: false,
            vocational: false,
            college: false,
            masters: false,
            doctorate: false,
        },
        employment: {
            employed: false,
            unemployed: false,
            selfEmployed: false,
        },
    });

    // Loading states
    const [isLoading, setIsLoading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    // Fetch events on component mount
    useEffect(() => {
        fetchEvents();
    }, []);

    // Calculate matching profiles when demographics or filters change
    useEffect(() => {
        if (selectedEvent && selectedDemographics.length > 0) {
            calculateMatchingProfiles();
        } else {
            setMatchingProfiles(0);
        }
    }, [selectedEvent, selectedDemographics]);

    // Get display name for a filter option
    const getDisplayNameForFilter = (category, option) => {
        // Mapping of filter options to display names
        const displayNames = {
            gender: {
                male: "Male",
                female: "Female",
            },
            ageGroup: {
                childYouth: "Child Youth (15-17)",
                coreYouth: "Core Youth (18-24)",
                youngAdult: "Young Adult (25-30)",
            },
            civilStatus: {
                single: "Single",
                married: "Married",
                widowed: "Widowed",
                divorced: "Divorced",
                separated: "Separated",
            },
            voterStatus: {
                skVoter: "SK Voter",
                nationalVoter: "National Voter",
            },
            education: {
                elementary: "Elementary",
                highSchool: "High School",
                vocational: "Vocational",
                college: "College",
                masters: "Masters",
                doctorate: "Doctorate",
            },
            employment: {
                employed: "Employed",
                unemployed: "Unemployed",
                selfEmployed: "Self-Employed",
            },
        };

        return displayNames[category]?.[option] || `${category} ${option}`;
    };

    // Fetch events from API
    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get("/api/eventmanage");
            setEvents(response.data);
        } catch (error) {
            console.error("Error fetching events:", error);
            alert("Error fetching events. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle event selection
    const handleEventChange = (e) => {
        const eventId = e.target.value;
        setSelectedEvent(eventId);

        if (eventId) {
            const selectedEvent = events.find(
                (event) => event.id.toString() === eventId
            );
            setSelectedEventDetails(selectedEvent);
        } else {
            setSelectedEventDetails(null);
        }
    };

    // Handle demographic tag selection for the common tags (Student, PWD, Athlete)
    const handleDemographicSelect = (demographic) => {
        if (selectedDemographics.includes(demographic)) {
            setSelectedDemographics((prev) =>
                prev.filter((item) => item !== demographic)
            );
        } else {
            setSelectedDemographics((prev) => [...prev, demographic]);
        }
    };

    // Handle filter changes
    const handleFilterChange = (category, option) => {
        // First update the filter state
        setFilters((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [option]: !prev[category][option],
            },
        }));

        // Then add or remove the tag from selectedDemographics
        const tagName = getDisplayNameForFilter(category, option);

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
}};