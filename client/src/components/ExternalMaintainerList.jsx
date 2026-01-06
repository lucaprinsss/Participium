import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Alert, Modal, Dropdown, InputGroup, Tooltip, OverlayTrigger } from "react-bootstrap";
import { FaBuilding, FaChevronDown, FaUndo } from "react-icons/fa";
import { getAllExternals, deleteMunicipalityUser, updateMunicipalityUser } from "../api/municipalityUserApi";
import { getAllCompanies } from "../api/companyApi";
import { getAllDepartmentRolesMapping } from "../api/departmentAPI";
import UserDetails from "./UserDetails";
import "../css/MunicipalityUserList.css"; // Import for modal styles

export default function ExternalMaintainerList({ refreshTrigger }) {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departmentRolesMapping, setDepartmentRolesMapping] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Filters
  const [companyFilter, setCompanyFilter] = useState("");

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      setLoading(true);
      setError("");
      try {
        const [usersData, companiesData, mappingData] = await Promise.all([
          getAllExternals(),
          getAllCompanies(),
          getAllDepartmentRolesMapping()
        ]);
        if (isMounted) {
          setUsers(usersData);
          setCompanies(companiesData);
          setDepartmentRolesMapping(mappingData);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load data.");
          console.error("Error fetching initial data:", err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    initData();
    return () => { isMounted = false; };
  }, [refreshTrigger]);

  const reloadList = async () => {
    try {
      const list = await getAllExternals();
      setUsers(list);
    } catch (e) {
      console.error("Error reloading list:", e);
    }
  };

  const handleResetFilters = () => setCompanyFilter("");

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (formData) => {
    setError("");
    setSuccess("");

    if (!formData.email.trim() || !formData.firstName.trim() || !formData.lastName.trim()) {
        setError("All fields are required");
        return;
    }

    setEditLoading(true);
    try {
      const payload = {
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        department_role_ids: formData.roles.map(r => r.department_role_id)
      };

      await updateMunicipalityUser(editingUser.id, payload);
      setSuccess(`User "${editingUser.username}" updated successfully!`);
      setShowEditModal(false);
      await reloadList();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Update failed.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setError("");
    setSuccess("");
    setDeleteLoading(true);
    try {
      await deleteMunicipalityUser(deletingUser.id);
      setSuccess(`User "${deletingUser.username}" deleted successfully!`);
      setShowDeleteModal(false);
      setDeletingUser(null);
      await reloadList();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Delete failed.");
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCompanySelect = (value) => setCompanyFilter(value);
  const getSelectedCompanyName = () => {
    if (!companyFilter) return "All Companies";
    const selected = companies.find(c => c.id.toString() === companyFilter);
    return selected ? selected.name : "All Companies";
  };

  const filteredUsers = users.filter(user => {
    if (companyFilter) {
      const selectedCompany = companies.find(c => c.id === Number.parseInt(companyFilter));
      if (user.company_name !== selectedCompany?.name) return false;
    }
    return true;
  });

  return (
    <div className="municipalityUserList-modern">
      <div className="mul-header">
        <h1 className="mul-title">External Maintainers</h1>
        <div className="mul-filters">
          <InputGroup className="mul-filter-group">
            <InputGroup.Text className="mul-filter-icon"><FaBuilding /></InputGroup.Text>
            <Dropdown onSelect={handleCompanySelect} className="mul-custom-dropdown">
              <Dropdown.Toggle variant="light" className="mul-filter-toggle">
                <div className="d-flex align-items-center justify-content-between w-100">
                  <span className="text-truncate">{getSelectedCompanyName()}</span>
                  <FaChevronDown className="mul-dropdown-arrow ms-2" />
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu className="modern-dropdown-menu">
                <Dropdown.Item eventKey="" active={companyFilter === ""}>All Companies</Dropdown.Item>
                {companies.map((comp) => (
                  <Dropdown.Item key={comp.id} eventKey={comp.id.toString()} active={companyFilter === comp.id.toString()}>
                    {comp.name}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </InputGroup>
          <OverlayTrigger placement="top" overlay={<Tooltip>Reset Filters</Tooltip>}>
            <button className="mul-btn-reset" onClick={handleResetFilters} disabled={!companyFilter}><FaUndo /></button>
          </OverlayTrigger>
        </div>
      </div>

      {(error || success) && (
        <Alert variant={error ? "danger" : "success"} onClose={() => { setError(""); setSuccess("") }} dismissible className="mb-4">{error || success}</Alert>
      )}

      <div className="mul-card">
        <div className="mul-card-body">
          {loading ? (
            <div className="mul-loading">
              <div className="mul-loading-spinner"></div>
              Loading...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="mul-empty">
              <div>👷</div>
              No maintainers found.
            </div>
          ) : (
            <div className="mul-table-wrapper mul-table-wrapper-scrollable">
              <table className="mul-table">
                <thead>
                  <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Company</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr 
                        key={user.id}
                        onClick={() => handleEdit(user)}
                        style={{ cursor: 'pointer' }}
                        className="mul-table-row"
                    >
                      <td><span className="text-muted">#{user.id}</span></td>
                      <td><strong>{user.username}</strong></td>
                      <td>{user.email}</td>
                      <td><span className="mul-role-badge">{user.roles?.map(r => r.role_name).join(', ') || ''}</span></td>
                      <td>{user.company_name || "-"}</td>
                      <td>
                        <div className="mul-actions">
                          <button 
                            className="mul-btn mul-btn-delete" 
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(user); }}
                          >
                            Delete
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

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered dialogClassName="mul-modal-content" size="lg">
        <Modal.Body className="mul-modal-body p-0">
          <UserDetails 
            user={editingUser} 
            departmentRolesMapping={departmentRolesMapping}
            onSave={handleEditSubmit} 
            onCancel={() => setShowEditModal(false)}
            loading={editLoading} 
          />
        </Modal.Body>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the external maintainer <b>{deletingUser?.username}</b>?
        </Modal.Body>
        <Modal.Footer>
          <button className="mul-modal-btn mul-modal-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
          <button className="mul-modal-btn mul-modal-btn-danger" onClick={handleDeleteConfirm}>{deleteLoading ? "Deleting..." : "Delete"}</button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

ExternalMaintainerList.propTypes = {
  refreshTrigger: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.string,
  ]).isRequired,
};