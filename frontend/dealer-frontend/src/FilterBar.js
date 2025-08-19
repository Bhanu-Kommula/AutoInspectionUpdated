import React from "react";

function FilterBar({
  filters,
  locations,
  offers,
  applyFilter,
  clearFilters,
  setFilters,
  setSelectedCity,
}) {
  return (
    <div className="d-flex flex-wrap justify-content-md-end justify-content-center gap-2 mb-4">
      {/* 🔷 Filter by Location */}
      <div style={{ position: "relative", minWidth: "200px" }}>
        <select
          className="form-select pe-5"
          value={filters.location}
          onChange={(e) => {
            const val = e.target.value;
            setFilters((prev) => ({ ...prev, location: val }));
            applyFilter("location", val);
          }}
          style={{
            paddingRight: filters.location ? "2.5rem" : "1rem",
            appearance: "none",
            MozAppearance: "none",
            WebkitAppearance: "none",
            backgroundImage: "none",
          }}
        >
          <option value="">Filter by Location</option>
          {locations.map((loc, idx) => (
            <option key={idx} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        {filters.location && (
          <span
            onClick={() => {
              setFilters((prev) => ({ ...prev, location: "" }));
              setSelectedCity(null);
              applyFilter("location", "");
            }}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              fontWeight: "bold",
              fontSize: "18px",
              color: "#000",
              cursor: "pointer",
              zIndex: 2,
            }}
            title="Clear location filter"
          >
            ×
          </span>
        )}
      </div>

      {/* 💰 Filter by Offer */}
      <div style={{ position: "relative", minWidth: "160px" }}>
        <select
          className="form-select pe-5"
          value={filters.offerAmount}
          onChange={(e) => {
            const val = e.target.value;
            setFilters((prev) => ({ ...prev, offerAmount: val }));
            applyFilter("offerAmount", val);
          }}
          style={{
            paddingRight: filters.offerAmount ? "2.5rem" : "1rem",
            appearance: "none",
            MozAppearance: "none",
            WebkitAppearance: "none",
            backgroundImage: "none",
          }}
        >
          <option value="">Filter by Offer</option>
          {offers.map((amt, idx) => (
            <option key={idx} value={amt}>
              {amt}
            </option>
          ))}
        </select>

        {filters.offerAmount && (
          <span
            onClick={() => {
              setFilters((prev) => ({ ...prev, offerAmount: "" }));
              applyFilter("offerAmount", "");
            }}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              fontWeight: "bold",
              fontSize: "18px",
              color: "#000",
              cursor: "pointer",
              zIndex: 2,
            }}
            title="Clear offer filter"
          >
            ×
          </span>
        )}
      </div>

      {/* 🔘 Clear All Filters Button */}
      <button className="btn btn-secondary" onClick={clearFilters}>
        Clear Filters
      </button>
    </div>
  );
}

export default FilterBar;
