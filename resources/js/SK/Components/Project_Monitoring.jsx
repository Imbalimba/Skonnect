import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../css/project_monitor.css";
import MonitoringPagination from "../Components/MonitoringPagination";
import PrintTemplate from "../Components/PrintTemplate";
import { AuthContext } from "../../Contexts/AuthContext";
import { FaEdit, FaTrash, FaShare } from "react-icons/fa";

const ProjectMonitoring = () => {
    const { skUser } = useContext(AuthContext); // Get the skUser data from AuthContext
    const isFederationAdmin = skUser?.sk_role === "Federasyon"; // Check if user is federation admin

    // State to store project data entries
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [selectedCenter, setSelectedCenter] = useState("ALL");
    const [selectedBarangay, setSelectedBarangay] = useState(
        isFederationAdmin ? "All" : skUser?.sk_station || ""
    ); // Default to user's station if not admin
    const [sortBudget, setSortBudget] = useState("none"); // "none", "lowToHigh", "highToLow"
    const [showModal, setShowModal] = useState(false);
    const [editProject, setEditProject] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: "", type: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [publishFormData, setPublishFormData] = useState({
        barangay: '',
        time_start: null,
        time_end: null,
        description: '',
        center_of_participation: '',
        ppas: ''
    });

    // Centers of Participation options
    const centersOfParticipation = [
        "ALL",
        "HEALTH",
        "EDUCATION",
        "ENVIRONMENT",
        "GLOBAL MOBILITY",
        "ACTIVE CITIZENSHIP",
        "GOVERNANCE",
        "SOCIAL EQUITY AND INCLUSION",
        "PEACE-BUILDING AND SECURITY",
        "ECONOMIC EMPOWERMENT",
    ];

    // Barangay options
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

    // State for managing the form modal visibility
    const [formData, setFormData] = useState({
        ppas: "",
        description: "",
        expectedOutput: "",
        performanceTarget: "",
        implementationPeriod: "",
        centerOfParticipation: "ACTIVE CITIZENSHIP",
        barangay: isFederationAdmin
            ? "Dela Paz"
            : skUser?.sk_station || "Dela Paz", // Default to user's station
        budget: {
            total: "", // Only keeping total budget
        },
        personResponsible: "",
    });

    const [implementationStart, setImplementationStart] = useState(null);
    const [implementationEnd, setImplementationEnd] = useState(null);

    // Fetch projects when component mounts or selectedCenter changes
    useEffect(() => {
        fetchProjects();
    }, [selectedCenter, selectedBarangay]);

    // Filter and sort projects based on selected criteria
    useEffect(() => {
        if (projects.length > 0) {
            let filtered = projects.filter(
                (project) =>
                    (selectedCenter === "ALL" ||
                        project.centerOfParticipation === selectedCenter) &&
                    (selectedBarangay === "All" ||
                        project.barangay === selectedBarangay) &&
                    (searchQuery === '' ||
                        project.ppas.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        project.expectedOutput.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        project.performanceTarget.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        project.personResponsible.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        project.implementationPeriod.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        project.budget.total.toString().includes(searchQuery))
            );

            // Apply sorting
            if (sortBudget === "lowToHigh") {
                filtered = [...filtered].sort(
                    (a, b) =>
                        parseFloat(a.budget.total) - parseFloat(b.budget.total)
                );
            } else if (sortBudget === "highToLow") {
                filtered = [...filtered].sort(
                    (a, b) =>
                        parseFloat(b.budget.total) - parseFloat(a.budget.total)
                );
            }

            setFilteredProjects(filtered);
            setCurrentPage(1); // Reset to first page when filters change
        }
    }, [projects, selectedCenter, selectedBarangay, sortBudget, searchQuery]);

    // Function to fetch projects
    const fetchProjects = async () => {
    try {
        console.log("Fetching projects...");
const response = await axios.get("/api/projects");
        console.log("Full response:", response);
        console.log("Response status:", response.status);
        console.log("Response data:", response.data);

        // Check if response exists and has data
        if (!response) {
            throw new Error("No response received from server");
        }

        // Handle the new consistent response format
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            const formattedProjects = response.data.data.map((project) => ({
                id: project.id,
                referenceCode: project.reference_code,
                ppas: project.ppas,
                description: project.description,
                expectedOutput: project.expected_output,
                performanceTarget: project.performance_target,
                implementationPeriod: `${project.period_implementation_start} to ${project.period_implementation_end}`,
                centerOfParticipation: project.center_of_participation || "ACTIVE CITIZENSHIP",
                barangay: project.barangay || "Dela Paz",
                budget: {
                    mode: project.mode_budget,
                    co: project.co_budget,
                    total: project.total_budget,
                },
                personResponsible: project.person_responsible,
            }));

            console.log("Formatted projects:", formattedProjects);
            setProjects(formattedProjects);
        } else {
            // Handle empty or invalid data
            console.log("No projects found or invalid data format");
            setProjects([]);
        }
    } catch (error) {
        console.error("Error details:", error);
        console.error("Error response:", error.response);
        console.error("Error message:", error.message);
        setAlert({
            show: true,
            message: error.response?.data?.message || error.message || "Error loading projects",
            type: "danger",
        });
        setProjects([]); // Ensure projects is set to empty array on error
    }
};

    // Get current projects for pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProjects = filteredProjects.slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Handle edit project
    const handleEditProject = (project) => {
        setEditProject(project);
        setFormData({
            ppas: project.ppas,
            description: project.description,
            expectedOutput: project.expectedOutput,
            performanceTarget: project.performanceTarget,
            implementationPeriod: project.implementationPeriod,
            centerOfParticipation: project.centerOfParticipation,
            barangay: project.barangay,
            budget: {
                total: project.budget.total,
            },
            personResponsible: project.personResponsible,
        });
        setShowModal(true);
    };

    // Function to handle delete project
    const handleDeleteProject = async (projectId) => {
        if (window.confirm("Are you sure you want to delete this project?")) {
            try {
                await axios.delete(`/api/projects/${projectId}`);
                await fetchProjects();
                setAlert({
                    show: true,
                    message: "Project deleted successfully!",
                    type: "success",
                });
            } catch (error) {
                console.error("Error details:", error.response?.data);
                setAlert({
                    show: true,
                    message: error.response?.data?.message || "Error deleting project",
                    type: "danger",
                });
            }
        }
    };

    // Update the handleInputChange function to properly handle budget.total
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "budget.total") {
            setFormData((prev) => ({
                ...prev,
                budget: {
                    ...prev.budget,
                    total: value,
                },
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (!implementationStart || !implementationEnd) {
                throw new Error("Please select both start and end dates");
            }

            const projectData = {
                ...formData,
                period_implementation_start: implementationStart
                    .toISOString()
                    .slice(0, 7),
                period_implementation_end: implementationEnd
                    .toISOString()
                    .slice(0, 7),
                reference_code: formData.referenceCode,
                ppas: formData.ppas,
                description: formData.description,
                expected_output: formData.expectedOutput,
                performance_target: formData.performanceTarget,
                center_of_participation: formData.centerOfParticipation,
                barangay: formData.barangay,
                mode_budget: parseFloat(formData.budget.mode) || 0,
                co_budget: parseFloat(formData.budget.co) || 0,
                total_budget: parseFloat(formData.budget.total) || 0,
                person_responsible: formData.personResponsible,
            };

            if (editProject) {
    await axios.put(`/api/projects/${editProject.id}`, projectData);
} else {
    await axios.post("/api/projects", projectData);
}
            // Fetch updated projects
            await fetchProjects();
            setImplementationStart(null);
            setImplementationEnd(null);

            setAlert({
                show: true,
                message: editProject
                    ? "Project updated successfully!"
                    : "Project saved successfully!",
                type: "success",
            });

            // Reset form and edit state
            setFormData({
                referenceCode: "",
                ppas: "",
                description: "",
                expectedOutput: "",
                performanceTarget: "",
                implementationPeriod: "",
                centerOfParticipation: "ACTIVE CITIZENSHIP",
                barangay: isFederationAdmin
                    ? "Dela Paz"
                    : skUser?.sk_station || "Dela Paz", // Reset to user's station
                budget: {
                    mode: "",
                    co: "",
                    total: "",
                },
                personResponsible: "",
            });
            setEditProject(null);
            setShowModal(false);
        } catch (error) {
            console.error("Error details:", error.response?.data);

            let errorMessage = "Error saving project";
            if (error.response?.data?.errors) {
                errorMessage = Object.values(error.response.data.errors)
                    .flat()
                    .join("\n");
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setAlert({
                show: true,
                message: errorMessage,
                type: "danger",
            });
        }
    };

    // Add CSS for user info (copied from BarangayPolicyManagement reference)
    const userInfoStyle = {
        display: "flex",
        alignItems: "center",
        marginBottom: "1rem",
    };

    const userAvatarStyle = {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "#0f4a6a",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        marginRight: "10px",
    };

    const userNameStyle = {
        fontSize: "1rem",
        fontWeight: "bold",
        color: "#333",
    };

    const handlePublishSubmit = async (e) => {
        e.preventDefault();

        try {
            if (!selectedProject) {
                throw new Error("Please select a project to publish");
            }

            const response = await axios.post('/api/publish-programs', {
                project_id: selectedProject.id,
                barangay: publishFormData.barangay,
                time_start: publishFormData.time_start?.toISOString(),
                time_end: publishFormData.time_end?.toISOString(),
                description: publishFormData.description
            });

            setAlert({
                show: true,
                message: "Program published successfully!",
                type: "success"
            });

            setShowPublishModal(false);
            setSelectedProject(null);
            setPublishFormData({
                barangay: '',
                time_start: null,
                time_end: null,
                description: '',
                center_of_participation: '',
                ppas: ''
            });

        } catch (error) {
            console.error("Error publishing program:", error);
            let errorMessage = "Error publishing program";

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.errors) {
                errorMessage = Object.values(error.response.data.errors).flat().join('\n');
            } else if (error.message) {
                errorMessage = error.message;
            }

            setAlert({
                show: true,
                message: errorMessage,
                type: "danger"
            });
        }
    };

    return (
        <div className="project-monitoring-container">
            <div className="pm-user-info">
                <div className="pm-user-avatar">
                    {skUser?.first_name?.charAt(0) || 'S'}
                </div>
                <div className="pm-user-name">
                    {skUser?.first_name} {skUser?.last_name}
                </div>
            </div>

            <div className="dashboard">
                {alert.show && (
                    <div
                        className={`alert alert-${alert.type} alert-dismissible fade show m-3`}
                        role="alert"
                    >
                        {alert.message}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setAlert({ ...alert, show: false })}
                        ></button>
                    </div>
                )}

                <div className="print-only print-section">
                    <PrintTemplate
                        projects={filteredProjects}
                        selectedCenter={selectedCenter}
                        selectedBarangay={selectedBarangay}
                    />
                </div>

                <div className="dashboard1 no-print">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Project Monitoring</h4>
                            <div>
                                <button className="btn btn-primary me-2" onClick={() => window.print()}>
                                    Print
                                </button>
                                <button className="btn btn-primary me-2" onClick={() => {
                                    setEditProject(null);
                                    setShowModal(true);
                                }}>
                                    + Add Project
                                </button>
                                <button className="btn btn-success" onClick={() => {
                                    setSelectedProject(null);
                                    setShowPublishModal(true);
                                }}>
                                    <FaShare className="me-1" /> Publish Program
                                </button>
                            </div>
                        </div>

                        {/* Search and Filter Section */}
                        <div className="filter-section">
                            <div className="filter-group">
                                <label className="form-label">Search:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="filter-group">
                                <label className="form-label">Center of Participation:</label>
                                <select
                                    className="form-select"
                                    value={selectedCenter}
                                    onChange={(e) => {
                                        setSelectedCenter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    {centersOfParticipation.map((center) => (
                                        <option key={center} value={center}>{center}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label className="form-label">Barangay:</label>
                                {isFederationAdmin ? (
                                    <select
                                        className="form-select"
                                        value={selectedBarangay}
                                        onChange={(e) => {
                                            setSelectedBarangay(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        {barangayOptions.map((barangay) => (
                                            <option key={barangay} value={barangay}>{barangay}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="barangay-indicator">
                                        <span className="badge bg-primary">Barangay: {skUser?.sk_station}</span>
                                    </div>
                                )}
                            </div>
                            <div className="filter-group">
                                <label className="form-label">Sort Budget:</label>
                                <select
                                    className="form-select"
                                    value={sortBudget}
                                    onChange={(e) => {
                                        setSortBudget(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="none">No sorting</option>
                                    <option value="lowToHigh">Lowest to Highest</option>
                                    <option value="highToLow">Highest to Lowest</option>
                                </select>
                            </div>
                        </div>

                        {/* Projects Table */}
                        <div className="table-scroll-wrapper">
                            <div className="table-container">
                                <table className="table table-striped">
                                    <thead>
                                        <tr>
                                            <th colSpan="8" className="text-center">
                                                CENTER OF PARTICIPATION: {selectedCenter} | BARANGAY: {selectedBarangay} | SORT: {sortBudget === "none" ? "None" : sortBudget === "lowToHigh" ? "Low to High" : "High to Low"}
                                            </th>
                                        </tr>
                                        <tr>
                                            <th>PPAs</th>
                                            <th>Description</th>
                                            <th>Expected Output</th>
                                            <th>Performance Target</th>
                                            <th>Period of Implementation</th>
                                            <th>Budget</th>
                                            <th>Person Responsible</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentProjects.length > 0 ? (
                                            currentProjects.map((project) => (
                                                <tr key={project.id}>
                                                    <td style={{ whiteSpace: "pre-wrap" }}>{project.ppas}</td>
                                                    <td style={{ whiteSpace: "pre-wrap" }}>{project.description}</td>
                                                    <td>{project.expectedOutput}</td>
                                                    <td>{project.performanceTarget}</td>
                                                    <td>{project.implementationPeriod}</td>
                                                    <td className="text-end">₱{parseFloat(project.budget.total).toLocaleString()}</td>
                                                    <td>{project.personResponsible}</td>
                                                    <td>
                                                        <div className="action-buttons-wrap">
                                                            <button className="btn btn-primary btn-sm" onClick={() => handleEditProject(project)}>
                                                                <FaEdit />
                                                            </button>
                                                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProject(project.id)}>
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="text-center">No projects found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="pagination-container">
                            <button
                                className="pagination-btn"
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <div className="page-number">{currentPage}</div>
                            <button
                                className="pagination-btn"
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage >= Math.ceil(filteredProjects.length / itemsPerPage)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Add/Edit Project */}
            <div
                className={`modal fade ${
                    showModal ? "show d-block" : ""
                }`}
                tabIndex="-1"
                role="dialog"
            >
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header position-relative">
                            <h5 className="modal-title">
                                {editProject
                                    ? "Edit Existing Project"
                                    : "Add New Project"}
                            </h5>
                            <button
                                type="button"
                                className="btn-close position-absolute"
                                style={{ top: "1rem", right: "1rem" }}
                                onClick={() => {
                                    setShowModal(false);
                                    setEditProject(null);
                                }}
                            />
                        </div>
                        <div className="pm-modal-body">
                            <form onSubmit={handleSubmit}>
                                {/* Center of Participation */}
                                <div className="form-group">
                                    <div className="input-container">
                                        <select
                                            className="pm-pm-form-control"
                                            name="centerOfParticipation"
                                            value={
                                                formData.centerOfParticipation
                                            }
                                            onChange={handleInputChange}
                                            required
                                        >
                                            {centersOfParticipation.map(
                                                (center) => (
                                                    <option
                                                        key={center}
                                                        value={center}
                                                    >
                                                        {center}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                        <label
                                            className="pm-input-label"
                                        >
                                            Center of Participation
                                        </label>
                                    </div>
                                </div>

                                {/* Barangay */}
                                <div className="form-group">
                                    <div className="input-container">
                                        {isFederationAdmin ? (
                                            <select
                                                className="pm-pm-form-control"
                                                name="barangay"
                                                value={
                                                    formData.barangay
                                                }
                                                onChange={
                                                    handleInputChange
                                                }
                                                required
                                            >
                                                {barangayOptions
                                                    .filter(
                                                        (opt) =>
                                                            opt !==
                                                            "All"
                                                    )
                                                    .map((barangay) => (
                                                        <option
                                                            key={
                                                                barangay
                                                            }
                                                            value={
                                                                barangay
                                                            }
                                                        >
                                                            {barangay}
                                                        </option>
                                                    ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                className="pm-pm-form-control"
                                                name="barangay"
                                                value={
                                                    formData.barangay ||
                                                    skUser?.sk_station
                                                }
                                                onChange={
                                                    handleInputChange
                                                }
                                                disabled
                                                required
                                            />
                                        )}
                                        <label
                                            className="pm-input-label"
                                        >
                                            Barangay
                                        </label>
                                    </div>
                                </div>

                                {/* PPAs */}
                                <div className="form-group">
                                    <div className="input-container">
                                        <input
                                            type="text"
                                            className="pm-pm-form-control"
                                            name="ppas"
                                            value={formData.ppas}
                                            onChange={handleInputChange}
                                            placeholder=" "
                                            required
                                        />
                                        <label
                                            className="pm-input-label"
                                        >
                                            Program, Project, or
                                            Activity (PPAs)
                                        </label>
                                    </div>
                                </div>

                                {/* Project Description */}
                                <div className="form-group">
                                    <div className="input-container">
                                        <textarea
                                            className="pm-pm-form-control"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder=" "
                                            rows="3"
                                            required
                                        />
                                        <label
                                            className="pm-input-label"
                                        >
                                            Project Description
                                        </label>
                                    </div>
                                </div>

                                {/* Expected Output */}
                                <div className="form-group">
                                    <div className="input-container">
                                        <input
                                            type="text"
                                            className="pm-pm-form-control"
                                            name="expectedOutput"
                                            value={
                                                formData.expectedOutput
                                            }
                                            onChange={handleInputChange}
                                            placeholder=" "
                                            required
                                        />
                                        <label
                                            className="pm-input-label"
                                        >
                                            Expected Output
                                        </label>
                                    </div>
                                </div>

                                {/* Performance Target */}
                                <div className="form-group">
                                    <div className="input-container">
                                        <input
                                            type="text"
                                            className="pm-pm-form-control"
                                            name="performanceTarget"
                                            value={
                                                formData.performanceTarget
                                            }
                                            onChange={handleInputChange}
                                            placeholder=" "
                                            required
                                        />
                                        <label
                                            className="pm-input-label"
                                        >
                                            Performance Target
                                        </label>
                                    </div>
                                </div>

                                {/* Implementation Period */}
                                <div className="form-group row">
                                    <div className="col-md-6">
                                        <div className="input-container">
                                            <DatePicker
                                                selected={
                                                    implementationStart
                                                }
                                                onChange={(date) =>
                                                    setImplementationStart(
                                                        date
                                                    )
                                                }
                                                selectsStart
                                                startDate={
                                                    implementationStart
                                                }
                                                endDate={
                                                    implementationEnd
                                                }
                                                className="pm-pm-form-control w-100"
                                                placeholderText="Select start date"
                                                dateFormat="MMMM yyyy"
                                                showMonthYearPicker
                                                required
                                            />
                                            <label
                                                className="pm-input-label"
                                            >
                                                Implementation Start
                                                Date
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="input-container">
                                            <DatePicker
                                                selected={
                                                    implementationEnd
                                                }
                                                onChange={(date) =>
                                                    setImplementationEnd(
                                                        date
                                                    )
                                                }
                                                selectsEnd
                                                startDate={
                                                    implementationStart
                                                }
                                                endDate={
                                                    implementationEnd
                                                }
                                                minDate={
                                                    implementationStart
                                                }
                                                className="pm-pm-form-control w-100"
                                                placeholderText="Select end date"
                                                dateFormat="MMMM yyyy"
                                                showMonthYearPicker
                                                required
                                            />
                                            <label
                                                className="pm-input-label"
                                            >
                                                Implementation End Date
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="input-container">
                                        <input
                                            type="number"
                                            className="pm-pm-form-control"
                                            name="budget.total"
                                            value={
                                                formData.budget.total
                                            }
                                            onChange={handleInputChange}
                                            placeholder=" "
                                            required
                                            step="any" // This allows decimal numbers
                                        />
                                        <label
                                            className="pm-input-label"
                                        >
                                            Total Budget
                                        </label>
                                    </div>
                                </div>

                                {/* Person Responsible */}
                                <div className="form-group">
                                    <div className="input-container">
                                        <input
                                            type="text"
                                            className="pm-pm-form-control"
                                            name="personResponsible"
                                            value={formData.personResponsible}
                                            onChange={handleInputChange}
                                            placeholder=" "
                                            required
                                        />
                                        <label
                                            className="pm-input-label"
                                        >
                                            Person Responsible
                                        </label>
                                    </div>
                                </div>

                                {/* Button Group */}
                                <div className="button-group">
                                    <button
                                        type="submit"
                                        className="project-monitoring-btn-success"
                                    >
                                        {editProject
                                            ? "Update Project"
                                            : "Submit Project"}
                                    </button>
                                    <button
                                        type="button"
                                        className="project-monitoring-btn-success"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditProject(null);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Publish Program Modal */}
            {showPublishModal && (
                <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content">
                            <div className="modal-header position-relative">
                                <h5 className="modal-title">
                                    {selectedProject ? "Publish Selected Project" : "Publish New Program"}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close position-absolute"
                                    style={{ top: "1rem", right: "1rem" }}
                                    onClick={() => {
                                        setShowPublishModal(false);
                                        setSelectedProject(null);
                                        setPublishFormData({
                                            barangay: '',
                                            time_start: null,
                                            time_end: null,
                                            description: '',
                                            center_of_participation: '',
                                            ppas: ''
                                        });
                                    }}
                                />
                            </div>
                            <div className="pm-modal-body">
                                <form onSubmit={handlePublishSubmit}>
                                    {!selectedProject && (
                                        <>
                                            <div className="form-group">
                                                <div className="input-container">
                                                    <select
                                                        className="pm-pm-form-control"
                                                        value={publishFormData.center_of_participation}
                                                        onChange={(e) => {
                                                            const selectedCenter = e.target.value;
                                                            setPublishFormData(prev => ({
                                                                ...prev,
                                                                center_of_participation: selectedCenter,
                                                                ppas: '' // Reset PPAS when center changes
                                                            }));
                                                        }}
                                                        required
                                                    >
                                                        <option value="">Select Center of Participation</option>
                                                        {centersOfParticipation.filter(c => c !== "ALL").map((center) => (
                                                            <option key={center} value={center}>
                                                                {center}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <label className="pm-input-label">Center of Participation *</label>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <div className="input-container">
                                                    <select
                                                        className="pm-pm-form-control"
                                                        value={publishFormData.ppas}
                                                        onChange={(e) => {
                                                            const selectedPPAS = e.target.value;
                                                            const project = projects.find(p => p.ppas === selectedPPAS);
                                                            setSelectedProject(project);
                                                            setPublishFormData(prev => ({
                                                                ...prev,
                                                                ppas: selectedPPAS
                                                            }));
                                                        }}
                                                        required
                                                    >
                                                        <option value="">Select PPAS</option>
                                                        {projects
                                                            .filter(project =>
                                                                publishFormData.center_of_participation === '' ||
                                                                project.centerOfParticipation === publishFormData.center_of_participation
                                                            )
                                                            .map((project) => (
                                                                <option key={project.id} value={project.ppas}>
                                                                    {project.ppas}
                                                                </option>
                                                            ))}
                                                    </select>
                                                    <label className="pm-input-label">Program, Project, or Activity (PPAS) *</label>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="form-group">
                                        <div className="input-container">
                                            <select
                                                className="pm-pm-form-control"
                                                value={publishFormData.barangay}
                                                onChange={(e) => setPublishFormData({
                                                    ...publishFormData,
                                                    barangay: e.target.value
                                                })}
                                                required
                                            >
                                                <option value="">Select Barangay</option>
                                                {barangayOptions.filter(b => b !== "All").map((barangay) => (
                                                    <option key={barangay} value={barangay}>
                                                        {barangay}
                                                    </option>
                                                ))}
                                            </select>
                                            <label className="pm-input-label">Barangay *</label>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div className="input-container">
                                            <DatePicker
                                                selected={publishFormData.time_start}
                                                onChange={(date) => setPublishFormData({
                                                    ...publishFormData,
                                                    time_start: date
                                                })}
                                                showTimeSelect
                                                dateFormat="MMMM d, yyyy h:mm aa"
                                                className="pm-pm-form-control w-100"
                                                placeholderText="Select start date and time"
                                                required
                                            />
                                            <label className="pm-input-label">Start Date and Time *</label>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div className="input-container">
                                            <DatePicker
                                                selected={publishFormData.time_end}
                                                onChange={(date) => setPublishFormData({
                                                    ...publishFormData,
                                                    time_end: date
                                                })}
                                                showTimeSelect
                                                dateFormat="MMMM d, yyyy h:mm aa"
                                                className="pm-pm-form-control w-100"
                                                placeholderText="Select end date and time"
                                                minDate={publishFormData.time_start}
                                                required
                                            />
                                            <label className="pm-input-label">End Date and Time *</label>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div className="input-container">
                                            <textarea
                                                className="pm-pm-form-control"
                                                value={publishFormData.description}
                                                onChange={(e) => setPublishFormData({
                                                    ...publishFormData,
                                                    description: e.target.value
                                                })}
                                                placeholder=" "
                                                rows="4"
                                                required
                                            />
                                            <label className="pm-input-label">Description *</label>
                                        </div>
                                    </div>

                                    <div className="button-group">
                                        <button type="submit" className="project-monitoring-btn-success">
                                            Publish Program
                                        </button>
                                        <button
                                            type="button"
                                            className="project-monitoring-btn-success"
                                            onClick={() => {
                                                setShowPublishModal(false);
                                                setSelectedProject(null);
                                                setPublishFormData({
                                                    barangay: '',
                                                    time_start: null,
                                                    time_end: null,
                                                    description: '',
                                                    center_of_participation: '',
                                                    ppas: ''
                                                });
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        
    );
};

export default ProjectMonitoring;
