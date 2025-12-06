import { useState, useEffect } from "react";
import { Alert, InputGroup, Tooltip, OverlayTrigger } from "react-bootstrap";
import { FaSearch, FaBuilding, FaTag, FaUndo } from "react-icons/fa"; 
import { getAllCompanies } from "../api/companyApi";

// Importiamo lo stesso CSS per mantenere lo stile identico
import "../css/MunicipalityUserList.css"; 

export default function CompanyList({ refreshTrigger }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter state
  const [searchText, setSearchText] = useState("");

  // Initial Data Fetch
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const data = await getAllCompanies();
        setCompanies(data);
      } catch (err) {
        console.error("Failed to fetch companies:", err);
        if (err.status === 403) {
          setError("You don't have permission to view data.");
        } else if (err.status === 401) {
          setError("You are not authenticated.");
        } else {
          setError(`Failed to load data: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [refreshTrigger]);

  // --- Reset Filters ---
  const handleResetFilters = () => {
      setSearchText("");
  };

  // --- Filter Logic ---
  const filteredCompanies = companies.filter(company => {
    if (!searchText) return true;
    const lowerSearch = searchText.toLowerCase();
    return (
        company.name.toLowerCase().includes(lowerSearch) ||
        company.category.toLowerCase().includes(lowerSearch)
    );
  });

  return (
    <div className="municipalityUserList-modern">
      {/* Header */}
      <div className="mul-header">
        <h1 className="mul-title">Company Registry</h1>
        
        <div className="mul-filters">
          
          {/* Search Filter (Styled like the original dropdowns) */}
          <InputGroup className="mul-filter-group">
             <InputGroup.Text className="mul-filter-icon"><FaSearch/></InputGroup.Text>
             <input 
                type="text" 
                className="form-control mul-filter-toggle"
                placeholder="Search companies..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ borderLeft: 'none', boxShadow: 'none' }} // Small inline fix to match specific toggle look
             />
          </InputGroup>

          {/* Reset Filters Button */}
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

      {/* Alerts */}
      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible className="mb-4">
          {error}
        </Alert>
      )}

      {/* Main Card */}
      <div className="mul-card">
        <div className="mul-card-body">
          {loading ? (
            <div className="mul-loading">
              <div className="mul-loading-content">
                <div className="mul-loading-spinner"></div>
                <div>Loading companies...</div>
              </div>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="mul-empty">
              <div className="mul-empty-content">
                <div className="mul-empty-icon">🏢</div>
                <div>
                  {searchText
                    ? "No companies match your search."
                    : "No companies found in the registry."
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="mul-table-wrapper">
              <table className="mul-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Category</th>
                    {/* Lasciamo una colonna vuota o azioni future se necessario, per mantenere l'allineamento visivo */}
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
                        {/* Utilizziamo lo stile 'badge' originale per la categoria */}
                        <span className="mul-role-badge">
                            <FaTag className="me-1" style={{fontSize: '0.7rem'}}/>
                            {company.category}
                        </span>
                      </td>
                      <td>
                        {/* Placeholder per azioni future, per mantenere lo stile della tabella */}
                        <div className="mul-actions">
                          <button className="mul-btn mul-btn-edit" style={{opacity: 0.5, cursor: 'not-allowed'}}>
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}