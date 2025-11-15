import { useState, useEffect } from "react";
import { Alert, Modal } from "react-bootstrap";
import { 
  getAllMunicipalityUsers, 
  deleteMunicipalityUser,
  updateMunicipalityUser,
  getAllRoles
} from "../api/municipalityUserApi";
import "../css/MunicipalityUserList.css";

export default function MunicipalityUserList({ refreshTrigger }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roles, setRoles] = useState([]);
  const [roleFilter, setRoleFilter] = useState("");
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch users and roles
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [refreshTrigger]);

  const fetchRoles = async () => {
    try {
      const rolesList = await getAllRoles();
      setRoles(rolesList);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const usersList = await getAllMunicipalityUsers();
      setUsers(usersList);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      if (err.status === 403) {
        setError("You don't have permission to view users.");
      } else if (err.status === 401) {
        setError("You are not authenticated. Please log in again.");
      } else {
        setError(`Failed to load users: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      role: user.role,
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editForm.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!editForm.firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (!editForm.lastName.trim()) {
      setError("Last name is required");
      return;
    }

    setEditLoading(true);

    try {
      const payload = {
        email: editForm.email,
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        role: editForm.role,
      };

      await updateMunicipalityUser(editingUser.id, payload);
      
      setSuccess(`User "${editForm.username}" updated successfully!`);
      setShowEditModal(false);
      
      await fetchUsers();

      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (err) {
      console.error("Failed to update user:", err);
      
      if (err.status === 409) {
        setError("Username or email already exists.");
      } else if (err.status === 403) {
        setError("You don't have permission to update users.");
      } else if (err.status === 404) {
        setError("User not found.");
      } else {
        setError(err.message || "Failed to update user.");
      }
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
      
      await fetchUsers();

      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (err) {
      console.error("Failed to delete user:", err);
      
      if (err.status === 403) {
        setError("You don't have permission to delete users.");
      } else if (err.status === 404) {
        setError("User not found.");
      } else {
        setError(err.message || "Failed to delete user.");
      }
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredUsers = roleFilter 
    ? users.filter(user => user.role === roleFilter)
    : users;

  return (
    <div className="municipalityUserList-modern">
      {/* Header con Filtri */}
      <div className="mul-header">
        <h1 className="mul-title">Users Management</h1>
        
        <div className="mul-filters">
          <select
            className="mul-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alert Messages */}
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

      {/* Card Container */}
      <div className="mul-card">
        <div className="mul-card-body">
          {loading ? (
            <div className="mul-loading">
              <div className="mul-loading-content">
                <div className="mul-loading-spinner"></div>
                <div>Loading users...</div>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="mul-empty">
              <div className="mul-empty-content">
                <div className="mul-empty-icon">👥</div>
                <div>
                  {roleFilter 
                    ? `No users found with role "${roleFilter}".`
                    : "No municipality users found. Create one to get started."
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="mul-table-wrapper">
              <table className="mul-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.username}</strong>
                      </td>
                      <td>
                        {`${user.first_name || ""} ${user.last_name || ""}`.trim() || "N/A"}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className="mul-role-badge">{user.role}</span>
                      </td>
                      <td>
                        <div className="mul-actions">
                          <button
                            className="mul-btn mul-btn-edit"
                            onClick={() => handleEdit(user)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                            Edit
                          </button>
                          <button
                            className="mul-btn mul-btn-delete"
                            onClick={() => handleDeleteClick(user)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
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
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        centered
        dialogClassName="mul-modal-content"
        contentClassName="mul-modal-overlay"
      >
        <Modal.Header closeButton className="mul-modal-header">
          <Modal.Title className="mul-modal-title">Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body className="mul-modal-body">
          <form onSubmit={handleEditSubmit} className="mul-edit-form">
            <div className="name-row">
              <div className="mul-field">
                <label className="mul-label">
                  <span className="mul-required">First Name</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={editForm.firstName}
                  onChange={handleEditChange}
                  disabled={editLoading}
                  required
                />
              </div>

              <div className="mul-field">
                <label className="mul-label">
                  <span className="mul-required">Last Name</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={editForm.lastName}
                  onChange={handleEditChange}
                  disabled={editLoading}
                  required
                />
              </div>
            </div>

            <div className="mul-field">
              <label className="mul-label">Username</label>
              <input
                type="text"
                name="username"
                value={editForm.username}
                disabled
                className="mul-readonly"
              />
              <small className="mul-help-text">
                Username cannot be changed
              </small>
            </div>

            <div className="mul-field">
              <label className="mul-label">
                <span className="mul-required">Email</span>
              </label>
              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleEditChange}
                disabled={editLoading}
                required
              />
            </div>

            <div className="mul-field">
              <label className="mul-label">Role</label>
              <input
                type="text"
                name="role"
                value={editForm.role}
                disabled
                className="mul-readonly"
              />
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer className="mul-modal-footer">
          <button 
            className="mul-modal-btn mul-modal-btn-cancel"
            onClick={() => setShowEditModal(false)} 
            disabled={editLoading}
          >
            Cancel
          </button>
          <button 
            className="mul-modal-btn mul-modal-btn-confirm"
            onClick={handleEditSubmit} 
            disabled={editLoading}
          >
            {editLoading ? (
              <>
                <div className="mul-loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)} 
        centered
        dialogClassName="mul-modal-content"
        contentClassName="mul-modal-overlay"
      >
        <Modal.Header closeButton className="mul-modal-header">
          <Modal.Title className="mul-modal-title">Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body className="mul-modal-body">
          {deletingUser && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Delete <strong>{deletingUser.username}</strong>?
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                This action cannot be undone and all associated data will be permanently removed.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="mul-modal-footer">
          <button 
            className="mul-modal-btn mul-modal-btn-cancel"
            onClick={() => setShowDeleteModal(false)} 
            disabled={deleteLoading}
          >
            Cancel
          </button>
          <button 
            className="mul-modal-btn mul-modal-btn-danger"
            onClick={handleDeleteConfirm} 
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <div className="mul-loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}