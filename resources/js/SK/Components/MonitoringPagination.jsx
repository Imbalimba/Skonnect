import React from "react";

const MonitoringPagination = ({
    itemsPerPage,
    totalItems,
    currentPage,
    paginate,
}) => {
    const pageNumbers = [];

    // Calculate total pages
    for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
        pageNumbers.push(i);
    }

    return (
        <nav>
            <ul className="pagination justify-content-center">
                {/* Previous Button */}
                <li
                    className={`page-item ${
                        currentPage === 1 ? "disabled" : ""
                    }`}
                >
                    <button
                        className="page-link"
                        onClick={() => paginate(currentPage - 1)}
                    >
                        Previous
                    </button>
                </li>

                {/* Page Numbers */}
                {pageNumbers.map((number) => (
                    <li
                        key={number}
                        className={`page-item ${
                            currentPage === number ? "active" : ""
                        }`}
                    >
                        <button
                            className="page-link"
                            onClick={() => paginate(number)}
                        >
                            {number}
                        </button>
                    </li>
                ))}

                {/* Next Button */}
                <li
                    className={`page-item ${
                        currentPage === pageNumbers.length ? "disabled" : ""
                    }`}
                >
                    <button
                        className="page-link"
                        onClick={() => paginate(currentPage + 1)}
                    >
                        Next
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default MonitoringPagination;
