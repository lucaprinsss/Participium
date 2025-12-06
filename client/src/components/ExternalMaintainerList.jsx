import { useState, useEffect } from "react";
import { Alert, Modal, Dropdown, InputGroup, Tooltip, OverlayTrigger } from "react-bootstrap";
import { FaBuilding, FaChevronDown, FaUndo, FaSave } from "react-icons/fa"; 
import { 
  getAllExternals, 
  deleteMunicipalityUser,
  updateMunicipalityUser
} from "../api/municipalityUserApi";
import { getAllCompanies } from "../api/companyApi";
import UserDetails from "./UserDetails"; 

import "../css/ExternalMaintainerList.css"; 

export default function ExternalMaintainerList({ refreshTrigger }) {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Filters states
  const [companyFilter, setCompanyFilter] = useState("");
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", email: "", first_name: "", last_name: "", role: "", companyName: "" });
  const [editLoading, setEditLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [usersData, companiesData] = await Promise.all([
          getAllExternals(),
          getAllCompanies()
        ]);

        setUsers(usersData);
        setCompanies(companiesData);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
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

  const fetchUsers = async () => {
    try {
      const usersList = await getAllExternals();
      setUsers(usersList);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(`Failed to load users: ${err.message}`);
    }
  };

  // --- Reset Filters ---
  const handleResetFilters = () => {
      setCompanyFilter("");
  };

  // --- Edit Modal Functions ---
  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
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
    
    setError("");
    setSuccess("");

    if (!editForm.email.trim() || !editForm.first_name.trim() || !editForm.last_name.trim()) {
      setError("All fields are required");
      return;
    }

    setEditLoading(true);

    try {
      const payload = {
        email: editForm.email,
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        role: editForm.role, 
      };

      await updateMunicipalityUser(editingUser.id, payload);
      
      setSuccess(`User "${editForm.username}" updated successfully!`);
      setShowEditModal(false);
      await fetchUsers();

      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Failed to update user:", err);
      if (err.status === 409) setError("Username or email already exists.");
      else if (err.status === 403) setError("You don't have permission to update users.");
      else if (err.status === 404) setError("User not found.");
      else setError(err.message || "Failed to update user.");
    } finally {
      setEditLoading(false);
    }
  };

  // --- Delete Modal Functions ---
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
      await fetchUsers();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Failed to delete user:", err);
      if (err.status === 403) setError("You don't have permission to delete users.");
      else if (err.status === 404) setError("User not found.");
      else setError(err.message || "Failed to delete user.");
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Filter Handler Functions ---
  const handleCompanySelect = (value) => setCompanyFilter(value);
  
  const getSelectedCompanyName = () => {
    if (!companyFilter) return "All Companies";
    const selected = companies.find(c => c.id.toString() === companyFilter);
    return selected ? selected.name : "All Companies";
  };

  // --- Filter Logic (DATA LEVEL) ---
  const filteredUsers = users.filter(user => {
    // Se c'è un filtro azienda attivo
    if (companyFilter) {
        const selectedCompany = companies.find(c => c.id.toString() === companyFilter);
        // Confrontiamo il nome dell'azienda dell'utente con quello selezionato
        // (Assumendo che user.company_name sia la stringa del nome)
        if (user.company_name !== selectedCompany?.name) {
            return false;
        }
    }
    return true;
  });

  return (
    <div className="externalMaintainerList-modern">
      {/* Header */}
      <div className="eml-header">
        <h1 className="eml-title">External Maintainers Management</h1>
        
        <div className="eml-filters">
          
          {/* Company Filter */}
          <InputGroup className="eml-filter-group">
             <InputGroup.Text className="eml-filter-icon"><FaBuilding/></InputGroup.Text>
             <Dropdown onSelect={handleCompanySelect} className="eml-custom-dropdown">
                <Dropdown.Toggle variant="light" className="eml-filter-toggle">
                    <div className="d-flex align-items-center justify-content-between w-100">
                        <span className="text-truncate">{getSelectedCompanyName()}</span>
                        <FaChevronDown className="eml-dropdown-arrow ms-2"/>
                    </div>
                </Dropdown.Toggle>
                <Dropdown.Menu className="modern-dropdown-menu">
                    <Dropdown.Item eventKey="" active={companyFilter === ""}>
                        All Companies
                    </Dropdown.Item>
                    {companies.map((comp) => (
                        <Dropdown.Item key={comp.id} eventKey={comp.id} active={companyFilter === comp.id.toString()}>
                            {comp.name}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
             </Dropdown>
          </InputGroup>

          {/* Reset Filters Button */}
          <OverlayTrigger placement="top" overlay={<Tooltip>Reset Filters</Tooltip>}>
            <button 
                className="eml-btn-reset" 
                onClick={handleResetFilters} 
                disabled={!companyFilter}
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

      {success && (
        <Alert variant="success" onClose={() => setSuccess("")} dismissible className="mb-4">
          {success}
        </Alert>
      )}

      {/* Main Card */}
      <div className="eml-card">
        <div className="eml-card-body">
          {loading ? (
            <div className="eml-loading">
              <div className="eml-loading-content">
                <div className="eml-loading-spinner"></div>
                <div>Loading maintainers...</div>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="eml-empty">
              <div className="eml-empty-content">
                <div className="eml-empty-icon">👷</div>
                <div>
                  {companyFilter
                    ? "No maintainers match the selected company."
                    : "No External Maintainers found."
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="eml-table-wrapper">
              <table className="eml-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Company</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td><span className="text-muted">#{user.id}</span></td>
                      <td><strong>{user.username}</strong></td>
                      <td>{user.email}</td>
                      <td><span className="eml-role-badge">{user.role_name}</span></td>
                      <td>
                        {user.company_name ? (
                            <span className="text-muted small"><FaBuilding className="me-1"/>{user.company_name}</span>
                        ) : (
                            <span className="text-muted small">-</span>
                        )}
                      </td>
                      <td>
                        <div className="eml-actions">
                          <button className="eml-btn eml-btn-edit" onClick={() => handleEdit(user)}>
                            Edit
                          </button>
                          <button className="eml-btn eml-btn-delete" onClick={() => handleDeleteClick(user)}>
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

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered dialogClassName="eml-modal-content">
        <Modal.Header closeButton className="eml-modal-header">
          <Modal.Title className="eml-modal-title">Edit Maintainer</Modal.Title>
        </Modal.Header>
        <Modal.Body className="eml-modal-body">
          <UserDetails
            formData={editForm} 
            onChange={handleEditChange} 
            onSubmit={handleEditSubmit} 
            loading={editLoading} 
          />
        </Modal.Body>
        <Modal.Footer className="eml-modal-footer">
          <button className="eml-modal-btn eml-modal-btn-cancel" onClick={() => setShowEditModal(false)} disabled={editLoading}>
            Cancel
          </button>
          <button className="eml-modal-btn eml-modal-btn-confirm" onClick={handleEditSubmit} disabled={editLoading}>
            {editLoading ? "Saving..." : <><FaSave className="me-2"/> Save Changes</>}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered dialogClassName="eml-modal-content">
        <Modal.Header closeButton className="eml-modal-header">
          <Modal.Title className="eml-modal-title">Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body className="eml-modal-body">
          {deletingUser && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Delete <strong>{deletingUser.username}</strong>?
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                This action cannot be undone.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="eml-modal-footer">
          <button className="eml-modal-btn eml-modal-btn-cancel" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
            Cancel
          </button>
          <button className="eml-modal-btn eml-modal-btn-danger" onClick={handleDeleteConfirm} disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete User"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}