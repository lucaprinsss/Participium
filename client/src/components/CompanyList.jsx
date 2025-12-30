import { useState, useEffect } from "react";
import PropTypes from "prop-types"; // Imported for props validation
import { Alert, InputGroup, Tooltip, OverlayTrigger } from "react-bootstrap";
import { FaSearch, FaBuilding, FaTag, FaUndo } from "react-icons/fa";
import { getAllCompanies } from "../api/companyApi";
import "../css/MunicipalityUserList.css";

export default function CompanyList({ refreshTrigger }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");

  // Fetch Logic triggerata dal cambio di refreshTrigger (o mount iniziale)
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAllCompanies();
        if (isMounted) setCompanies(data);
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch companies:", err);
          setError("Failed to load company registry.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [refreshTrigger]);

  const handleResetFilters = () => {
    setSearchText("");
  };

  const filteredCompanies = companies.filter(company => {
    if (!searchText) return true;
    const lowerSearch = searchText.toLowerCase();
    return (
      company.name.toLowerCase().includes(lowerSearch) ||
      company.category.toLowerCase().includes(lowerSearch)
    );
  });

  // Correzione S3358: Logica di rendering estratta in una funzione separata
  const renderContent = () => {
    if (loading) {
      return (
        <div className="mul-loading">
          <div className="mul-loading-content">
            <div className="mul-loading-spinner"></div>
            <div>Loading companies...</div>
          </div>
        </div>
      );
    }

    if (filteredCompanies.length === 0) {
      const emptyMessage = searchText
        ? "No companies match your search."
        : "No companies found in the registry.";

      return (
        <div className="mul-empty">
          <div className="mul-empty-content">
            <div className="mul-empty-icon">🏢</div>
            <div>
              {emptyMessage}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mul-table-wrapper mul-table-wrapper-scrollable">
        <table className="mul-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((company) => (
              <tr key={company.id || company.name}>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <FaBuilding className="text-muted" />
                    <strong>{company.name}</strong>
                  </div>
                </td>
                <td>
                  <span className="mul-role-badge">
                    <FaTag className="me-1" style={{ fontSize: '0.7rem' }} />
                    {company.category}
                  </span>
                </td>
                <td>
                  <div className="mul-actions">
                    <button className="mul-btn mul-btn-edit" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };


  return (
    <div className="municipalityUserList-modern">
      <div className="mul-header">
        <h1 className="mul-title">Company Registry</h1>
        <div className="mul-filters">
          <InputGroup className="mul-filter-group">
            <InputGroup.Text className="mul-filter-icon"><FaSearch /></InputGroup.Text>
            <input
              type="text"
              className="form-control mul-filter-toggle"
              placeholder="Search companies..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ borderLeft: 'none', boxShadow: 'none' }}
            />
          </InputGroup>

          <OverlayTrigger placement="top" overlay={<Tooltip>Reset Filters</Tooltip>}>
            <button
              className="mul-btn-reset"
              onClick={handleResetFilters}
              disabled={!searchText}
            >
              <FaUndo />
            </button>
          </OverlayTrigger>
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible className="mb-4">
          {error}
        </Alert>
      )}

      <div className="mul-card">
        <div className="mul-card-body">
          {/* Call to extracted rendering function */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// Added props validation (S6774)
CompanyList.propTypes = {
  refreshTrigger: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.string,
  ]).isRequired,
};