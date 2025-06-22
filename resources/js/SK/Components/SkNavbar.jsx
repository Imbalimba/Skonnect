import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaUserCircle, FaCalendarAlt, FaTasks, 
         FaUser, FaClipboardList, FaComments, FaSignOutAlt, 
         FaBars, FaTimes, FaChevronDown, FaTrophy, FaNewspaper, 
         FaFileAlt, FaUserShield, FaIdBadge, FaHistory } from 'react-icons/fa';
import { AuthContext } from '../../Contexts/AuthContext';
import '../css/SkNavbar.css';

// Import local logo images
import defaultLogo from '../../assets/logo.png';  // federation
import delapazLogo from '../../assets/delapaz_logo.png';  // dela paz
import manggahanLogo from '../../assets/manggahan_logo.png';  // manggahan
import maybungaLogo from '../../assets/maybunga_logo.png';  // maybunga
import pinagbuhatanLogo from '../../assets/pinagbuhatan_logo.png'; // pinagbuhatan
import santolanLogo from '../../assets/santolan_logo.png';  // santolan
import rosarioLogo from '../../assets/rosario_logo.png';  // rosario
import sanmiguelLogo from '../../assets/sanmiguel_logo.png';  // san miguel
import staLuciaLogo from '../../assets/sta lucia_logo.png'; // sta lucia

const SKNavbar = () => {
    const [navVisible, setNavVisible] = useState(true);
    const [contentDropdownOpen, setContentDropdownOpen] = useState(false);
    const { skUser, skLogout } = useContext(AuthContext);
    const navigate = useNavigate();

    const toggleNav = () => {
        setNavVisible(!navVisible);
    };

    const toggleContentDropdown = () => {
        setContentDropdownOpen(!contentDropdownOpen);
    };

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            const { success } = await skLogout();
            if (success) {
                navigate('/sk-login');
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const hasAuthPermission = skUser && (skUser.sk_role === 'Federasyon' || skUser.sk_role === 'Chairman' || skUser.sk_role === 'Admin');

    // Get logo based on user's role or station
    const getLogo = () => {
        // If user is not logged in or data isn't available, use default logo
        if (!skUser) return defaultLogo;
        
        // Logo mapping based on barangay/station or federation
        const logoMapping = {
            'Federation': defaultLogo,
            'Dela Paz': delapazLogo,
            'Manggahan': manggahanLogo,
            'Maybunga': maybungaLogo,
            'Pinagbuhatan': pinagbuhatanLogo,
            'Rosario': rosarioLogo,
            'San Miguel': sanmiguelLogo,
            'Santa Lucia': staLuciaLogo,
            'Santolan': santolanLogo
        };
        
        // If user is Federasyon, use Federation logo
        if (skUser.sk_role === 'Federasyon') {
            return logoMapping['Federation'];
        }
        
        // Otherwise use the logo based on their station
        return logoMapping[skUser.sk_station] || logoMapping['Federation']; // Fallback to Federation logo
    };

    // Get user's full name
    const getUserFullName = () => {
        if (!skUser) return '';
        return `${skUser.first_name} ${skUser.last_name}`;
    };

    return (
        <>
            <button className="sk-nav-sklcss-toggle" onClick={toggleNav}>
                {navVisible ? <FaTimes /> : <FaBars />}
            </button>
            
            <div className={`sk-nav-sklcss-container ${!navVisible ? 'sk-nav-sklcss-hidden' : ''}`}>
                <div className="sk-nav-sklcss-header">
                    <img src={getLogo()} alt="SKonnect Logo" className="sk-nav-sklcss-logo" />
                    <span className="sk-nav-sklcss-title">SKonnect</span>
                </div>
                
                {/* User Profile Section */}
                {skUser && (
                    <div className="sk-nav-sklcss-user-profile">
                        <div className="sk-nav-sklcss-user-avatar">
                            <FaIdBadge />
                        </div>
                        <div className="sk-nav-sklcss-user-info">
                            <h3 className="sk-nav-sklcss-user-name">{getUserFullName()}</h3>
                            <p className="sk-nav-sklcss-user-role">
                                {skUser.sk_role}
                                {skUser.sk_role !== 'Federasyon' && ` • ${skUser.sk_station}`}
                            </p>
                        </div>
                    </div>
                )}
                
                <div className="sk-nav-sklcss-scrollable">
                    <div className="sk-nav-sklcss-section">
                        <span className="sk-nav-sklcss-section-title">Main</span>
                        <div className="sk-nav-sklcss-item">
                            <NavLink to="/dashboard" className={({isActive}) => isActive ? "sk-nav-sklcss-link active" : "sk-nav-sklcss-link"}>
                                <FaTachometerAlt className="sk-nav-sklcss-icon" />
                                <span className="sk-nav-sklcss-text">Dashboard</span>
                            </NavLink>
                        </div>

                        {/* User Authentication - Only visible to Federasyon and Chairman roles */}
                        {hasAuthPermission && (
                            <div className="sk-nav-sklcss-item">
                                <NavLink to="/sk-user-authentication" className={({isActive}) => isActive ? "sk-nav-sklcss-link active" : "sk-nav-sklcss-link"}>
                                    <FaUserShield className="sk-nav-sklcss-icon" />
                                    <span className="sk-nav-sklcss-text">User Authentication</span>
                                </NavLink>
                            </div>
                        )}

                        {/* User Authentication - Only visible to Federasyon and Chairman roles */}
                        {hasAuthPermission && (
                            <div className="sk-nav-sklcss-item">
                                <NavLink to="/sk-user-logs" className={({isActive}) => isActive ? "sk-nav-sklcss-link active" : "sk-nav-sklcss-link"}>
                                    <FaHistory className="sk-nav-sklcss-icon" />
                                    <span className="sk-nav-sklcss-text">User Activity Logs</span>
                                </NavLink>
                            </div>
                        )}
                    </div>
                    
                    <div className="sk-nav-sklcss-section">
                        <span className="sk-nav-sklcss-section-title">Management</span>
                        <div className="sk-nav-sklcss-item">
                            <NavLink to="/event" className={({isActive}) => isActive ? "sk-nav-sklcss-link active" : "sk-nav-sklcss-link"}>
                                <FaCalendarAlt className="sk-nav-sklcss-icon" />
                                <span className="sk-nav-sklcss-text">Event Management</span>
                            </NavLink>
                        </div>
                        <div className="sk-nav-sklcss-item">
                            <NavLink to="/project_monitor" className={({isActive}) => isActive ? "sk-nav-sklcss-link active" : "sk-nav-sklcss-link"}>
                                <FaTasks className="sk-nav-sklcss-icon" />
                                <span className="sk-nav-sklcss-text">Project Monitoring</span>
                            </NavLink>
                        </div>
                        <div className="sk-nav-sklcss-item">
                            <NavLink to="/sk-profiles" className={({isActive}) => isActive ? "sk-nav-sklcss-link active" : "sk-nav-sklcss-link"}>
                                <FaUser className="sk-nav-sklcss-icon" />
                                <span className="sk-nav-sklcss-text">KK Profiling</span>
                            </NavLink>
                        </div>
                        
                        {/* Content Management with Dropdown */}
                        <div className="sk-nav-sklcss-item sk-nav-sklcss-dropdown">
                            <div 
                                className="sk-nav-sklcss-link" 
                                onClick={toggleContentDropdown}
                            >
                                <FaClipboardList className="sk-nav-sklcss-icon" />
                                <span className="sk-nav-sklcss-text">Content Management</span>
                                <FaChevronDown className={`sk-nav-sklcss-dropdown-arrow ${contentDropdownOpen ? 'rotate' : ''}`} />
                            </div>
                            
                            <div className={`sk-nav-sklcss-dropdown-menu ${contentDropdownOpen ? 'open' : ''}`}>
                                <NavLink to="/announcement-management" className={({isActive}) => isActive ? "sk-nav-sklcss-dropdown-item active" : "sk-nav-sklcss-dropdown-item"}>
                                    <FaNewspaper className="sk-nav-sklcss-dropdown-icon" />
                                    <span>Announcement Management</span>
                                </NavLink>
                                <NavLink to="/award-management" className={({isActive}) => isActive ? "sk-nav-sklcss-dropdown-item active" : "sk-nav-sklcss-dropdown-item"}>
                                    <FaTrophy className="sk-nav-sklcss-dropdown-icon" />
                                    <span>Awards Management</span>
                                </NavLink>
                                <NavLink to="/directory-management" className={({isActive}) => isActive ? "sk-nav-sklcss-dropdown-item active" : "sk-nav-sklcss-dropdown-item"}>
                                    <FaUserCircle className="sk-nav-sklcss-dropdown-icon" />
                                    <span>Directory Management</span>
                                </NavLink>
                                <NavLink to="/policy-management" className={({isActive}) => isActive ? "sk-nav-sklcss-dropdown-item active" : "sk-nav-sklcss-dropdown-item"}>
                                    <FaFileAlt className="sk-nav-sklcss-dropdown-icon" />
                                    <span>Policy Management</span>
                                </NavLink>
                                <NavLink to="/template-management" className={({isActive}) => isActive ? "sk-nav-sklcss-dropdown-item active" : "sk-nav-sklcss-dropdown-item"}>
                                    <FaNewspaper className="sk-nav-sklcss-dropdown-icon" />
                                    <span>Templates Management</span>
                                </NavLink>
                            </div>
                        </div>
                    </div>
                    
                    <div className="sk-nav-sklcss-section">
                        <span className="sk-nav-sklcss-section-title">Feedback & Queries</span>
                        <div className="sk-nav-sklcss-item">
                            <NavLink to="/sk-feedback" className={({isActive}) => isActive ? "sk-nav-sklcss-link active" : "sk-nav-sklcss-link"}>
                                <FaComments className="sk-nav-sklcss-icon" />
                                <span className="sk-nav-sklcss-text">Youth Feedback</span>
                            </NavLink>
                        </div>
                    </div>
                    
                    {skUser && (
                        <div className="sk-nav-sklcss-section">
                            <span className="sk-nav-sklcss-section-title">Account</span>
                            <div className="sk-nav-sklcss-item">
                                <a href="#" className="sk-nav-sklcss-link" onClick={handleLogout}>
                                    <FaSignOutAlt className="sk-nav-sklcss-icon" />
                                    <span className="sk-nav-sklcss-text">Logout</span>
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default SKNavbar;