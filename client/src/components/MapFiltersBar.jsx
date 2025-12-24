import React, { useState } from "react";
import { Dropdown } from "react-bootstrap";
import {
  FaFilter,
  FaListUl,
  FaUsers,
  FaUser,
  FaEye,
  FaEyeSlash,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import "../css/MapFiltersBar.css";

const STATUS_OPTIONS = ["Resolved", "Assigned", "In Progress", "Suspended"];

const MapFiltersBar = ({
  categories,
  currentUser,
  filterCategory,
  setFilterCategory,
  filterStatus,
  setFilterStatus,
  viewMode,
  setViewMode,
  hideReports,
  setHideReports,
  onSearch, // Nuova prop
}) => {
  const [searchText, setSearchText] = useState("");

  const handleSearchSubmit = () => {
    // Invia la ricerca al genitore
    if (onSearch) {
      onSearch(searchText);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const clearSearch = () => {
    setSearchText("");
    if (onSearch) {
      onSearch(""); // Una stringa vuota resetta la ricerca nel genitore
    }
  };

  return (
    <div className="mp-filters-bar">
      {/* 0. Search Bar (NUOVO) */}
      <div className="mp-grid-item search-item">
        <div className="mp-search-wrapper">
          <input
            type="text"
            className="mp-search-input"
            placeholder="Search address..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {searchText ? (
            <button className="mp-search-btn clear" onClick={clearSearch}>
              <FaTimes />
            </button>
          ) : (
            <button className="mp-search-btn" onClick={handleSearchSubmit}>
              <FaSearch />
            </button>
          )}
        </div>
      </div>

      {/* 1. Category Filter */}
      <div className="mp-grid-item">
        <Dropdown onSelect={(k) => setFilterCategory(k)}>
          <Dropdown.Toggle
            className={`mp-modern-dropdown-toggle ${
              filterCategory !== "All" ? "active" : ""
            }`}
            id="filter-category"
          >
            <div className="mp-truncate-wrapper">
              <FaFilter className="mp-dropdown-icon" />
              <span className="mp-btn-text">
                {filterCategory === "All" ? "All Categories" : filterCategory}
              </span>
            </div>
          </Dropdown.Toggle>
          <Dropdown.Menu className="mp-modern-dropdown-menu">
            <Dropdown.Item eventKey="All" active={filterCategory === "All"}>
              All Categories
            </Dropdown.Item>
            <Dropdown.Divider />
            {categories.map((cat, idx) => (
              <Dropdown.Item
                key={idx}
                eventKey={cat}
                active={filterCategory === cat}
              >
                {cat}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* 2. Status Filter */}
      <div className="mp-grid-item">
        <Dropdown onSelect={(k) => setFilterStatus(k)}>
          <Dropdown.Toggle
            className={`mp-modern-dropdown-toggle ${
              filterStatus !== "All" ? "active" : ""
            }`}
            id="filter-status"
          >
            <div className="mp-truncate-wrapper">
              <FaListUl className="mp-dropdown-icon" />
              <span className="mp-btn-text">
                {filterStatus === "All" ? "All Statuses" : filterStatus}
              </span>
            </div>
          </Dropdown.Toggle>
          <Dropdown.Menu className="mp-modern-dropdown-menu">
            <Dropdown.Item eventKey="All" active={filterStatus === "All"}>
              All Statuses
            </Dropdown.Item>
            <Dropdown.Divider />
            {STATUS_OPTIONS.map((status, idx) => (
              <Dropdown.Item
                key={idx}
                eventKey={status}
                active={filterStatus === status}
              >
                {status}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* 3. User Filter (All vs Mine) */}
      <div className="mp-grid-item">
        <button
          className={`mp-filter-btn ${viewMode === "mine" ? "active" : ""}`}
          onClick={() => setViewMode((prev) => (prev === "all" ? "mine" : "all"))}
          disabled={!currentUser}
        >
          {viewMode === "all" ? (
            <>
              <FaUsers className="mp-btn-icon-fix" />
              All Users
            </>
          ) : (
            <>
              <FaUser className="mp-btn-icon-fix" />
              My Reports
            </>
          )}
        </button>
      </div>

      {/* 4. Visibility Toggle */}
      <div className="mp-grid-item">
        <button
          className={`mp-filter-btn ${hideReports ? "alert-mode" : ""}`}
          onClick={() => setHideReports(!hideReports)}
        >
          {hideReports ? (
            <>
              <FaEyeSlash className="mp-btn-icon-fix" />
              Hidden
            </>
          ) : (
            <>
              <FaEye className="mp-btn-icon-fix" />
              Visible
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MapFiltersBar;