import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Alert, Modal, Dropdown, InputGroup, Tooltip, OverlayTrigger } from "react-bootstrap";
import { FaBuilding, FaChevronDown, FaUndo } from "react-icons/fa";
import { getAllExternals, deleteMunicipalityUser, updateMunicipalityUser } from "../api/municipalityUserApi";
import { getAllCompanies } from "../api/companyApi";
import UserDetails from "./UserDetails";
import "../css/ExternalMaintainerList.css";

export default function ExternalMaintainerList({ refreshTrigger }) {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "",
    companyName: ""
  });
  const [editLoading, setEditLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  // Rimossa la dichiarazione di deleteLoading (S6133, S1481)

  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      setLoading(true);
      setError("");
      try {
        const [usersData, companiesData] = await Promise.all([
          getAllExternals(),
          getAllCompanies()
        ]);
        if (isMounted) {
          setUsers(usersData);
          setCompanies(companiesData);
        }
      } catch (err) {
        // Gestione minima dell'eccezione (S2486)
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
      // Gestione minima dell'eccezione (S2486)
      console.error("Error reloading list:", e);
    }
  };

  const handleResetFilters = () => setCompanyFilter("");

  const handleEdit = (user) => {
    setEditingUser(user);
    // Mappiamo i dati snake_case (dal DB) alle chiavi camelCase (per il Form)
    setEditForm({
      username: user.username,
      email: user.email,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      role: user.role_name,
      companyName: user.company_name || ""
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setEditLoading(true);
    try {
      // Rimappiamo i dati del form (camelCase) al payload dell'API (snake_case)
      const payload = {
        email: editForm.email,
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        role: editForm.role,
      };
      await updateMunicipalityUser(editingUser.id, payload);
      setSuccess(`Updated successfully!`);
      setShowEditModal(false);
      await reloadList();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError("Update failed.");
      // Gestione minima dell'eccezione (S2486)
      console.error("Error updating user:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    // Rimosso setDeleteLoading(true) (S1854)
    try {
      await deleteMunicipalityUser(deletingUser.id);
      setSuccess(`Deleted successfully!`);
      setShowDeleteModal(false);
      await reloadList();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError("Delete failed.");
      // Gestione minima dell'eccezione (S2486)
      console.error("Error deleting user:", err);
    } finally {
      // Rimosso setDeleteLoading(false) (S1854)
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="eml-loading">
          <div className="eml-loading-spinner"></div>
          Loading...
        </div>
      );
    }

    if (filteredUsers.length === 0) {
      return (
        <div className="eml-empty">
          <div>👷</div>
          No maintainers found.
        </div>
      );
    }

    return (
      <div className="eml-table-wrapper">
        <table className="eml-table">
          <thead>
            <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Company</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td><strong>{user.username}</strong></td>
                <td>{user.email}</td>
                <td><span className="eml-role-badge">{user.role_name}</span></td>
                <td>{user.company_name || "-"}</td>
                <td>
                  <div className="eml-actions">
                    <button className="eml-btn eml-btn-edit" onClick={() => handleEdit(user)}>Edit</button>
                    <button className="eml-btn eml-btn-delete" onClick={() => handleDeleteClick(user)}>Delete</button>
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
    <div className="externalMaintainerList-modern">
      <div className="eml-header">
        <h1 className="eml-title">External Maintainers</h1>
        <div className="eml-filters">
          <InputGroup className="eml-filter-group">
            <InputGroup.Text className="eml-filter-icon"><FaBuilding /></InputGroup.Text>
            <Dropdown onSelect={handleCompanySelect} className="eml-custom-dropdown">
              <Dropdown.Toggle variant="light" className="eml-filter-toggle">
                <div className="d-flex align-items-center justify-content-between w-100">
                  <span className="text-truncate">{getSelectedCompanyName()}</span>
                  <FaChevronDown className="eml-dropdown-arrow ms-2" />
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
            <button className="eml-btn-reset" onClick={handleResetFilters} disabled={!companyFilter}><FaUndo /></button>
          </OverlayTrigger>
        </div>
      </div>

      {(error || success) && (
        <Alert variant={error ? "danger" : "success"} onClose={() => { setError(""); setSuccess("") }} dismissible className="mb-4">{error || success}</Alert>
      )}

      <div className="eml-card">
        <div className="eml-card-body">
          {renderContent()}
        </div>
      </div>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Edit</Modal.Title></Modal.Header>
        <Modal.Body>
          <UserDetails formData={editForm} onChange={handleEditChange} onSubmit={handleEditSubmit} loading={editLoading} />
        </Modal.Body>
        <Modal.Footer>
          <button className="eml-modal-btn eml-modal-btn-confirm" onClick={handleEditSubmit}>Save</button>
        </Modal.Footer>
      </Modal>

      {/* Modal di Eliminazione Aggiornata per coerenza con MunicipalityUserList */}
      <Modal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)} 
        centered 
        dialogClassName="eml-modal-content"
      >
        <Modal.Header closeButton className="eml-modal-header">
          <Modal.Title className="eml-modal-title">Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body className="eml-modal-body">
          Are you sure you want to delete the external maintainer <b>{deletingUser?.username}</b>?
        </Modal.Body>
        <Modal.Footer className="eml-modal-footer">
          <button 
            className="eml-modal-btn eml-modal-btn-cancel" 
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </button>
          <button 
            className="eml-modal-btn eml-modal-btn-danger" 
            onClick={handleDeleteConfirm}
          >
            Delete
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

// Aggiunta la validazione delle props (S6774)
ExternalMaintainerList.propTypes = {
  refreshTrigger: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.string,
  ]).isRequired,
};