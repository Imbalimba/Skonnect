import React, { useState, useContext, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import '../css/Navbar.css';
import { AuthContext } from '../../Contexts/AuthContext';
import { FaUserCircle, FaSignOutAlt, FaUser } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async () => {
    const response = await logout();
    if (response.success) {
      navigate('/');
      setIsDropdownOpen(false);
      closeMenu();
    } else {
      console.error('Logout failed', response.error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="youth-nav-navbar">
      <NavLink to="/" className="youth-nav-brand">
        <img src={logo} alt="SK Logo" className="youth-nav-logo" />
        <div className="youth-nav-title">
          <span className="youth-nav-title-main">Pederasyon ng Sangguniang</span>
          <span className="youth-nav-title-sub">Kabataan | Pasig</span>
        </div>
      </NavLink>

      <div className={`youth-nav-menu-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className={`youth-nav-content ${isMenuOpen ? 'active' : ''}`}>
        <ul className="youth-nav-menu">
          <li className="youth-nav-item">
            <NavLink to="/" className={({isActive}) => isActive ? "youth-nav-link active" : "youth-nav-link"} onClick={closeMenu}>
              HOME
            </NavLink>
          </li>
          <li className="youth-nav-item">
            <NavLink to="/announcements" className={({isActive}) => isActive ? "youth-nav-link active" : "youth-nav-link"} onClick={closeMenu}>
              ANNOUNCEMENT
            </NavLink>
          </li>
          <li className="youth-nav-item">
            <NavLink to="/program-events" className={({isActive}) => isActive ? "youth-nav-link active" : "youth-nav-link"} onClick={closeMenu}>
              PROGRAM & EVENTS
            </NavLink>
          </li>
          <li className="youth-nav-item">
            <NavLink to="/directory" className={({isActive}) => isActive ? "youth-nav-link active" : "youth-nav-link"} onClick={closeMenu}>
              DIRECTORY
            </NavLink>
          </li>
          <li className="youth-nav-item">
            <NavLink to="/youth-development-policies" className={({isActive}) => isActive ? "youth-nav-link active" : "youth-nav-link"} onClick={closeMenu}>
              YOUTH DEVELOPMENT
            </NavLink>
          </li>
          <li className="youth-nav-item">
            <NavLink to="/awards" className={({isActive}) => isActive ? "youth-nav-link active" : "youth-nav-link"} onClick={closeMenu}>
              AWARDS
            </NavLink>
          </li>
          <li className="youth-nav-item">
            <NavLink to="/templates" className={({isActive}) => isActive ? "youth-nav-link active" : "youth-nav-link"} onClick={closeMenu}>
              TEMPLATES
            </NavLink>
          </li>
          <li className="youth-nav-item">
            <NavLink to="/faqs" className={({isActive}) => isActive ? "youth-nav-link active" : "youth-nav-link"} onClick={closeMenu}>
              FAQs
            </NavLink>
          </li>
        </ul>

        <div className="youth-nav-auth">
          {user ? (
            <div className="youth-nav-user-dropdown" ref={dropdownRef}>
              <button 
                className="youth-nav-user-button"
                onClick={toggleDropdown}
              >
                <FaUserCircle className="youth-nav-user-icon" />
                <span>{user.first_name}</span>
              </button>
              
              {isDropdownOpen && (
                <div className="youth-nav-dropdown-menu">                  
                  <div className="youth-nav-dropdown-header">
                    <FaUser className="youth-nav-dropdown-icon" />
                    <div className="youth-nav-dropdown-user-info">
                      <p className="youth-nav-dropdown-name">{user.first_name} {user.last_name}</p>
                      <p className="youth-nav-dropdown-email">{user.email}</p>
                    </div>
                  </div>
                  <div className="youth-nav-dropdown-divider"></div>
                  {/* Conditionally render the Start Profiling button */}
                  {user && user.profile_status === "not_profiled" && (
                    <>
                      <NavLink to="/profile" className="youth-nav-dropdown-item">
                        <i className="fas fa-user-edit youth-nav-dropdown-item-icon"></i>
                        <span>Start Profiling</span>
                      </NavLink>
                      <div className="youth-nav-dropdown-divider"></div>
                    </>
                  )}
                  <button onClick={handleLogout} className="youth-nav-dropdown-item">
                    <FaSignOutAlt className="youth-nav-dropdown-item-icon" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/login" className="youth-nav-auth-link youth-nav-signin-link" onClick={closeMenu}>
                Sign In
              </NavLink>
              <NavLink to="/signup" className="youth-nav-auth-link youth-nav-register-link" onClick={closeMenu}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;