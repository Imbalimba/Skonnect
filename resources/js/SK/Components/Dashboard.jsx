import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import "../css/dashboard.css";
import SKAnnouncementsSection from "./SKAnnouncementsSection";
import { AuthContext } from "../../Contexts/AuthContext";
import { FaUsers, FaHome, FaTimesCircle, FaCalendarAlt, FaBriefcase } from "react-icons/fa";
import { Link } from "react-router-dom";

const Dashboard = () => {
    const { skUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        outOfSchool: 0,
        employed: 0,
        eventCount: 0,
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Profiles fetch (with barangay filter if not federation)
                let params = new URLSearchParams();
                if (skUser && skUser.sk_role !== "Federasyon") {
                    params.append("barangay", skUser.sk_station);
                }
                const profilesRes = await axios.get(`/api/profiles?${params.toString()}`);
                const profilesData = profilesRes.data || [];

                // Announcements fetch (active only)
                const announcementsRes = await axios.get("/api/announcements?archived=0");
                const announcementsData = announcementsRes.data || [];

                // Events fetch
                const eventsRes = await axios.get("/api/eventmanage");
                const eventsData = eventsRes.data || [];
                let filteredEvents = eventsData;
                if (skUser && skUser.sk_role !== "Federasyon") {
                    filteredEvents = eventsData.filter(e => e.barangay === skUser.sk_station);
                }

                // Compute stats
                const total = profilesData.length;
                const outOfSchool = profilesData.filter(p => p.youth_classification === "Out of School Youth").length;
                const employed = profilesData.filter(p => p.work_status === "Employed").length;
                const eventCount = filteredEvents.length;

                setProfiles(profilesData);
                setAnnouncements(announcementsData);
                setStats({
                    total,
                    outOfSchool,
                    employed,
                    eventCount,
                });
            } catch (err) {
                // Optionally handle error
                console.error("Error fetching data:", err);
            }
            setLoading(false);
        };
        fetchData();
    }, [skUser]);

    // Helper for More Info button
    const moreInfoBtn = (link) => (
        <Link to={link} className="stat-card-more-info">
            More Info <span className="stat-card-more-info-icon">→</span>
        </Link>
    );

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
            </div>
            <div className="dashboard-container">
                <div className="dashboard-main">
                    <div className="dashboard-stats">
                        <div className="stat-cards-container">
                            {/* Card 1: Total Individuals */}
                            <div className="stat-card teal-card">
                                <div className="stat-card-content">
                                    <div className="stat-card-info">
                                        <div>
                                            <h2 className="stat-card-number">{loading ? "..." : stats.total}</h2>
                                            <p className="stat-card-title">Total Individuals</p>
                                        </div>
                                        <div className="stat-card-icon"><FaUsers /></div>
                                    </div>
                                </div>
                                <div className="stat-card-more-info-wrapper">
                                    {moreInfoBtn("/kkprofiling")}
                                </div>
                            </div>

                            {/* Card 2: Out of School Youth */}
                            <div className="stat-card green-card">
                                <div className="stat-card-content">
                                    <div className="stat-card-info">
                                        <div>
                                            <h2 className="stat-card-number">{loading ? "..." : stats.outOfSchool}</h2>
                                            <p className="stat-card-title">Out of School Youth</p>
                                        </div>
                                        <div className="stat-card-icon"><FaTimesCircle /></div>
                                    </div>
                                </div>
                                <div className="stat-card-more-info-wrapper">
                                    {moreInfoBtn("/kkprofiling?filter=out-of-school")}
                                </div>
                            </div>

                            {/* Card 3: Employed Youth */}
                            <div className="stat-card pink-card">
                                <div className="stat-card-content">
                                    <div className="stat-card-info">
                                        <div>
                                            <h2 className="stat-card-number">{loading ? "..." : stats.employed}</h2>
                                            <p className="stat-card-title">Employed Youth</p>
                                        </div>
                                        <div className="stat-card-icon"><FaBriefcase /></div>
                                    </div>
                                </div>
                                <div className="stat-card-more-info-wrapper">
                                    {moreInfoBtn("/kkprofiling?filter=employed")}
                                </div>
                            </div>

                            {/* Card 4: Total Events Published */}
                            <div className="stat-card red-card">
                                <div className="stat-card-content">
                                    <div className="stat-card-info">
                                        <div>
                                            <h2 className="stat-card-number">{loading ? "..." : stats.eventCount}</h2>
                                            <p className="stat-card-title">Events Published</p>
                                        </div>
                                        <div className="stat-card-icon"><FaCalendarAlt /></div>
                                    </div>
                                </div>
                                <div className="stat-card-more-info-wrapper">
                                    {moreInfoBtn("/events")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="dashboard-sidebar">
                    <SKAnnouncementsSection />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;