import React from "react";

const BulkActionsBar = ({
  selectedPosts,
  allSelected,
  toggleSelectAll,
  handleBulkDelete,
  handleBulkExport,
  setSelectedPosts,
}) => {
  if (selectedPosts.length === 0) return null;

  return (
    <div className="col-12 mb-3">
      <div className="alert alert-info d-flex align-items-center gap-3 justify-content-between">
        <div>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="form-check-input me-2"
          />
          <span className="fw-semibold">{selectedPosts.length} selected</span>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
            🗑️ Delete
          </button>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handleBulkExport}
          >
            Export CSV
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedPosts([])}
          >
            Cancel Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;
