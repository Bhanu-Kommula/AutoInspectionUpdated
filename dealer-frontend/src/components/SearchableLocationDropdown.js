import React, { useState, useEffect, useRef } from "react";
import locationData from "../data/US_States_and_Cities.json";

const SearchableLocationDropdown = ({
  value = "",
  onChange,
  placeholder = "Search for a city...",
  required = false,
  className = "",
  id = "location",
  name = "location",
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Flatten the location data into a searchable array
  const allCities = React.useMemo(() => {
    const cities = [];
    Object.entries(locationData).forEach(([state, cityList]) => {
      cityList.forEach((city) => {
        cities.push({
          display: `${city}, ${state}`,
          city: city,
          state: state,
          searchText: `${city} ${state}`.toLowerCase(),
        });
      });
    });
    return cities.sort((a, b) => a.display.localeCompare(b.display));
  }, []);

  // Filter cities based on search term
  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = allCities
        .filter((location) =>
          location.searchText.includes(searchTerm.toLowerCase())
        )
        .slice(0, 10); // Limit to 10 results for performance
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  }, [searchTerm, allCities]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    onChange && onChange(e); // Pass through to parent
  };

  // Handle selection
  const handleSelect = (location) => {
    setSearchTerm(location.display);
    setIsOpen(false);

    // Create synthetic event for parent component
    const syntheticEvent = {
      target: {
        name: name,
        value: location.display,
      },
    };
    onChange && onChange(syntheticEvent);
  };

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update searchTerm when value prop changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  return (
    <div className={`position-relative ${className}`} ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        className="form-control"
        id={id}
        name={name}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        style={{
          borderRadius: "10px",
          border: "2px solid #e3e6ea",
          padding: "10px 14px",
        }}
      />

      {isOpen && filteredCities.length > 0 && (
        <div
          className="position-absolute w-100 bg-white border rounded shadow-lg"
          style={{
            top: "100%",
            left: 0,
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto",
            marginTop: "2px",
            border: "1px solid #ddd",
          }}
        >
          {filteredCities.map((location, index) => (
            <div
              key={`${location.city}-${location.state}-${index}`}
              className="px-3 py-2 cursor-pointer"
              style={{
                cursor: "pointer",
                borderBottom:
                  index < filteredCities.length - 1
                    ? "1px solid #f0f0f0"
                    : "none",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f8f9fa";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "white";
              }}
              onClick={() => handleSelect(location)}
            >
              <div className="fw-semibold">{location.city}</div>
              <small className="text-muted">{location.state}</small>
            </div>
          ))}
        </div>
      )}

      {isOpen && searchTerm && filteredCities.length === 0 && (
        <div
          className="position-absolute w-100 bg-white border rounded shadow-lg"
          style={{
            top: "100%",
            left: 0,
            zIndex: 1000,
            marginTop: "2px",
            border: "1px solid #ddd",
          }}
        >
          <div className="px-3 py-2 text-muted">
            No cities found matching "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableLocationDropdown;
