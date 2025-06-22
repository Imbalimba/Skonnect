    import React, { useState, useEffect } from 'react';
    import axios from 'axios';
    import programsImg from '../../assets/fem.png';
    import { FaUser, FaBuilding, FaFileAlt, FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
    import Notification from '../../SK/Components/Notification';

    const ProgramSection = ({ activeBarangay, user, authLoading }) => {
        const [publishedPrograms, setPublishedPrograms] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [selectedProgram, setSelectedProgram] = useState(null);
        const [showRegistrationModal, setShowRegistrationModal] = useState(false);
        const [registrationFormData, setRegistrationFormData] = useState({
            firstname: '',
            middlename: '',
            lastname: '',
            barangay: '',
            reason_for_applying: ''
        });
        const [formErrors, setFormErrors] = useState({});
        const [registrationLoading, setRegistrationLoading] = useState(false);
        const [notification, setNotification] = useState({ show: false, message: '', type: '' });

        useEffect(() => {
            const fetchPublishedPrograms = async () => {
                try {
                    setLoading(true);
                    setError(null);

                    const params = {
                        barangay: activeBarangay === "All" ? null : activeBarangay,
                    };

                    if (user) {
                        params.user_id = user.id;
                        if (user.profile_id) {
                            params.profile_id = user.profile_id;
                        }
                    }

                    const response = await axios.get("/api/publish-programs", { params });
                    setPublishedPrograms(response.data);
                } catch (err) {
                    setError(
                        err.response?.data?.message ||
                        err.message ||
                        "Failed to fetch programs. Please try again later."
                    );
                } finally {
                    setLoading(false);
                }
            };

            fetchPublishedPrograms();
        }, [activeBarangay, user]);

        const formatDateTime = (dateString) => {
            if (!dateString) return "Date not specified";
            const date = new Date(dateString);
            return date.toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        };

        const handleRegistrationFormChange = (e) => {
            const { name, value } = e.target;
            setRegistrationFormData(prev => ({
                ...prev,
                [name]: value
            }));

            if (formErrors[name]) {
                setFormErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        };

        const validateRegistrationForm = () => {
            const errors = {};
            if (!registrationFormData.firstname.trim()) {
                errors.firstname = "First name is required";
            }
            if (!registrationFormData.lastname.trim()) {
                errors.lastname = "Last name is required";
            }
            if (!registrationFormData.barangay) {
                errors.barangay = "Barangay is required";
            }
            if (!registrationFormData.reason_for_applying.trim()) {
                errors.reason_for_applying = "Reason for applying is required";
            }
            setFormErrors(errors);
            return Object.keys(errors).length === 0;
        };

        const handleRegistrationSubmit = async (e) => {
            e.preventDefault();

            if (!validateRegistrationForm()) {
                return;
            }

            try {
                setRegistrationLoading(true);
                setFormErrors({});

                await axios.get('/sanctum/csrf-cookie');

                const requestData = {
                    publish_program_id: selectedProgram.id,
                    account_id: user.id,
                    ...registrationFormData
                };

                const response = await axios.post('/api/publish-programs/register', requestData);

                setShowRegistrationModal(false);
                setRegistrationFormData({
                    firstname: '',
                    middlename: '',
                    lastname: '',
                    barangay: '',
                    reason_for_applying: ''
                });

                setNotification({
                    show: true,
                    message: "Successfully registered for the program!",
                    type: "success"
                });

                setPublishedPrograms(prevPrograms =>
                    prevPrograms.map(program =>
                        program.id === selectedProgram.id
                            ? { ...program, isRegistered: true }
                            : program
                    )
                );

            } catch (error) {
                console.error('Registration error:', error);
                let errorMessage = 'Failed to register for the program. Please try again.';

                if (error.response?.status === 409) {
                    errorMessage = "You have already registered for this program.";
                } else if (error.response?.status === 422) {
                    const validationErrors = error.response.data.errors;
                    if (validationErrors) {
                        setFormErrors(validationErrors);
                        errorMessage = 'Please check the form for errors.';
                    }
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

        const isUserRegisteredForProgram = (program) => {
            if (!user) return false;
            return program.isRegistered;
        };

        const renderRegisterButton = (program) => {
            if (!user) {
                return (
                    <button
                        className="youth-pe-btn youth-pe-btn-primary youth-pe-full-width"
                        onClick={() => {
                            window.location.href = "/login";
                        }}
                    >
                        Log In to Apply
                    </button>
                );
            }

            if (user.profile_status === "not_profiled") {
                return (
                    <button
                        className="youth-pe-btn youth-pe-btn-primary youth-pe-full-width"
                        onClick={() => {
                            window.location.href = "/profile";
                        }}
                    >
                        Complete Profile to Apply
                    </button>
                );
            }

            if (isUserRegisteredForProgram(program)) {
                return (
                    <button
                        className="youth-pe-btn youth-pe-btn-secondary youth-pe-full-width"
                        disabled
                    >
                        Already Applied
                    </button>
                );
            }

            return (
                <button
                    className="youth-pe-btn youth-pe-btn-primary youth-pe-full-width"
                    onClick={() => {
                        setSelectedProgram(program);
                        setShowRegistrationModal(true);
                        setRegistrationFormData({
                            firstname: user.first_name || '',
                            middlename: user.middle_name || '',
                            lastname: user.last_name || '',
                            barangay: user.barangay || '',
                            reason_for_applying: ''
                        });
                    }}
                >
                    Apply Now
                </button>
            );
        };

        if (loading) {
            return (
                <div className="youth-pe-loading">
                    <div className="youth-pe-spinner"></div>
                    <p>Loading programs...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="youth-pe-no-content">
                    <div className="youth-pe-error-message">
                        <p>Error: {error}</p>
                    </div>
                </div>
            );
        }

        return (
            <>
                {notification.show && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification({ show: false, message: '', type: '' })}
                    />
                )}

                <div className="youth-pe-programs-content">
                    <h2 className="youth-pe-section-title">
                        {activeBarangay === "All"
                            ? "All Ongoing Programs"
                            : `Programs in ${activeBarangay}`}
                    </h2>
                    
                    {!authLoading && !user && (
                        <div className="youth-pe-login-notice">
                            <p>
                                You're viewing programs as a guest.
                                <a href="/login" className="youth-pe-login-link">
                                    {" "}
                                    Log in
                                </a>{" "}
                                to register for programs.
                            </p>
                        </div>
                    )}

                    {publishedPrograms.length === 0 ? (
                        <div className="youth-pe-no-content">
                            <p className="youth-pe-no-content-text">No programs found for the selected barangay. Please check back later or try another category.</p>
                        </div>
                    ) : (
                        <div className="youth-pe-programs-grid">
                            {publishedPrograms.map((program) => (
                                <div key={program.id} className="youth-pe-program-card">
                                    <div className="youth-pe-program-image">
                                        <img
                                            src={program.project?.image || programsImg}
                                            alt={program.project?.ppas || "Program image"}
                                            className="youth-pe-program-img"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = programsImg;
                                            }}
                                        />
                                        <span className="youth-pe-program-category">
                                            {program.project?.center_of_participation || "Program"}
                                        </span>
                                    </div>
                                    <div className="youth-pe-program-content">
                                        <h3 className="youth-pe-program-title">
                                            {program.project?.ppas || "Untitled Program"}
                                        </h3>
                                        <p className="youth-pe-program-description">
                                            {program.description || "No description available"}
                                        </p>
                                        <div className="youth-pe-program-info">
                                            <div className="youth-pe-program-info-item">
                                                <span className="youth-pe-program-info-label">
                                                    <FaCalendarAlt className="youth-pe-event-icon" /> Schedule:
                                                </span>
                                                <span className="youth-pe-program-info-text">
                                                    {formatDateTime(program.time_start)} - {formatDateTime(program.time_end)}
                                                </span>
                                            </div>
                                            <div className="youth-pe-program-info-item">
                                                <span className="youth-pe-program-info-label">
                                                    <FaMapMarkerAlt className="youth-pe-event-icon" /> Location:
                                                </span>
                                                <span className="youth-pe-program-info-text">
                                                    {program.project?.barangay || activeBarangay || "Not specified"}
                                                </span>
                                            </div>
                                        </div>
                                        {renderRegisterButton(program)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Registration Modal */}
                {showRegistrationModal && (
                    <div className="youth-pe-modal-overlay">
                        <div className="youth-pe-modal youth-pe-registration-modal">
                            <div className="youth-pe-modal-header">
                                <h2>Apply for Program</h2>
                                <button
                                    className="youth-pe-modal-close"
                                    onClick={() => setShowRegistrationModal(false)}
                                    disabled={registrationLoading}
                                >
                                    &times;
                                </button>
                            </div>
                            <form onSubmit={handleRegistrationSubmit}>
                                <div className="youth-pe-modal-body">
                                    <div className="youth-pe-registration-form">
                                        <div className="youth-pe-form-group">
                                            <label className="youth-pe-form-label">
                                                <FaUser className="youth-pe-form-icon" /> First Name
                                            </label>
                                            <input
                                                type="text"
                                                name="firstname"
                                                className={`youth-pe-form-input ${formErrors.firstname ? "error" : ""}`}
                                                value={registrationFormData.firstname}
                                                onChange={handleRegistrationFormChange}
                                                disabled={registrationLoading}
                                                required
                                            />
                                            {formErrors.firstname && (
                                                <span className="youth-pe-input-error">{formErrors.firstname}</span>
                                            )}
                                        </div>

                                        <div className="youth-pe-form-group">
                                            <label className="youth-pe-form-label">
                                                <FaUser className="youth-pe-form-icon" /> Middle Name
                                            </label>
                                            <input
                                                type="text"
                                                name="middlename"
                                                className="youth-pe-form-input"
                                                value={registrationFormData.middlename}
                                                onChange={handleRegistrationFormChange}
                                                disabled={registrationLoading}
                                            />
                                        </div>

                                        <div className="youth-pe-form-group">
                                            <label className="youth-pe-form-label">
                                                <FaUser className="youth-pe-form-icon" /> Last Name
                                            </label>
                                            <input
                                                type="text"
                                                name="lastname"
                                                className={`youth-pe-form-input ${formErrors.lastname ? "error" : ""}`}
                                                value={registrationFormData.lastname}
                                                onChange={handleRegistrationFormChange}
                                                disabled={registrationLoading}
                                                required
                                            />
                                            {formErrors.lastname && (
                                                <span className="youth-pe-input-error">{formErrors.lastname}</span>
                                            )}
                                        </div>

                                        <div className="youth-pe-form-group">
                                            <label className="youth-pe-form-label">
                                                <FaBuilding className="youth-pe-form-icon" /> Barangay
                                            </label>
                                            <select
                                                name="barangay"
                                                className={`youth-pe-form-input ${formErrors.barangay ? "error" : ""}`}
                                                value={registrationFormData.barangay}
                                                onChange={handleRegistrationFormChange}
                                                disabled={registrationLoading}
                                                required
                                            >
                                                <option value="">Select barangay</option>
                                                {[
                                                    "Dela Paz",
                                                    "Manggahan",
                                                    "Maybunga",
                                                    "Pinagbuhatan",
                                                    "Rosario",
                                                    "San Miguel",
                                                    "Santa Lucia",
                                                    "Santolan"
                                                ].map(barangay => (
                                                    <option key={barangay} value={barangay}>
                                                        {barangay}
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.barangay && (
                                                <span className="youth-pe-input-error">{formErrors.barangay}</span>
                                            )}
                                        </div>

                                        <div className="youth-pe-form-group">
                                            <label className="youth-pe-form-label">
                                                <FaFileAlt className="youth-pe-form-icon" /> Reason for Applying
                                            </label>
                                            <textarea
                                                name="reason_for_applying"
                                                className={`youth-pe-form-input ${formErrors.reason_for_applying ? "error" : ""}`}
                                                value={registrationFormData.reason_for_applying}
                                                onChange={handleRegistrationFormChange}
                                                disabled={registrationLoading}
                                                rows="4"
                                                required
                                            />
                                            {formErrors.reason_for_applying && (
                                                <span className="youth-pe-input-error">{formErrors.reason_for_applying}</span>
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
                                        {registrationLoading ? "Submitting..." : "Submit Application"}
                                    </button>
                                    <button
                                        type="button"
                                        className="youth-pe-btn youth-pe-btn-secondary"
                                        onClick={() => setShowRegistrationModal(false)}
                                        disabled={registrationLoading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

              
            </>
        );
    };

    export default ProgramSection;