import React from "react";

const PrintTemplate = ({ projects, selectedCenter, selectedBarangay }) => {
    return (
        <div className="print-template">
            <style type="text/css" media="print">
                {`
                @page {
                    size: landscape;
                }

                /* Hide everything except print-template during printing */
                body * {
                    visibility: hidden;
                }

                .print-template,
                .print-template * {
                    visibility: visible;
                }

                .print-template {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th, td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: left;
                }

                .text-end {
                    text-align: right;
                }
                `}
            </style>
                    <h2 className="text-center mb-3">
                        {selectedCenter === "ALL"
                            ? "ALL CENTERS OF PARTICIPATION"
                            : `CENTER OF PARTICIPATION: ${selectedCenter}`} |
                        BARANGAY: {selectedBarangay}
                    </h2>
            <div className="table-responsive">
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>PPAs</th>
                            <th>Description</th>
                            <th>Expected Output</th>
                            <th>Performance Target</th>
                            <th>Period of Implementation</th>
                            <th>Budget</th>
                            <th>Person Responsible</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project, index) => (
                            <tr key={index}>
                                <td style={{ whiteSpace: "pre-wrap" }}>{project.ppas}</td>
                                <td style={{ whiteSpace: "pre-wrap" }}>{project.description}</td>
                                <td>{project.expectedOutput}</td>
                                <td>{project.performanceTarget}</td>
                                <td>{project.implementationPeriod}</td>
                                <td className="text-end">{project.budget.total}</td>
                                <td>{project.personResponsible}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PrintTemplate;
