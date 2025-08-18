import React from "react";

const PaginationBar = ({ currentPage, totalPages, handlePageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="d-flex justify-content-center mt-4">
      <ul className="pagination">
        <li className={`page-item${currentPage === 1 ? " disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
        </li>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <li
            key={page}
            className={`page-item${currentPage === page ? " active" : ""}`}
          >
            <button
              className="page-link"
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          </li>
        ))}
        <li
          className={`page-item${
            currentPage === totalPages ? " disabled" : ""
          }`}
        >
          <button
            className="page-link"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default PaginationBar;
