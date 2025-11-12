import React, { useState, useEffect } from "react";
import { Alert, Card, Modal, Button } from "react-bootstrap";
import { 
  getAllMunicipalityUsers, 
  deleteMunicipalityUser,
  updateMunicipalityUser
} from "../api/municipalityUserApi";
import "../css/municipality-user-list.css";

export default function MunicipalityUserList({ refreshTrigger }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
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

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

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
      username: user.username, // Keep for display only
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

    // Validation
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
        role: editForm.role, // Keep the original role
      };

      console.log("Updating user with payload:", payload);
      const updatedUser = await updateMunicipalityUser(editingUser.id, payload);
      console.log("User updated successfully:", updatedUser);
      
      setSuccess(`User "${editForm.username}" updated successfully!`);
      setShowEditModal(false);
      
      // Refresh the list
      await fetchUsers();

      // Auto-hide success message
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
      console.log("Attempting to delete user:", deletingUser);
      console.log("User ID:", deletingUser.id);
      await deleteMunicipalityUser(deletingUser.id);
      console.log("Delete successful");
      
      setSuccess(`User "${deletingUser.username}" deleted successfully!`);
      setShowDeleteModal(false);
      setDeletingUser(null);
      
      // Refresh the list
      await fetchUsers();

      // Auto-hide success message
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

  if (loading) {
    return (
      <Card className="municipality-user-list-card">
        <Card.Body>
          <div className="mul-loading">Loading users...</div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="municipality-user-list-card">
        <Card.Body>
          <h3 className="mul-title">Municipality Users</h3>

          {error && (
            <Alert variant="danger" onClose={() => setError("")} dismissible>
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" onClose={() => setSuccess("")} dismissible>
              {success}
            </Alert>
          )}

          {users.length === 0 ? (
            <div className="mul-empty">
              No municipality users found. Create one to get started.
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
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{`${user.first_name || ""} ${user.last_name || ""}`.trim() || "N/A"}</td>
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
                            Edit
                          </button>
                          <button
                            className="mul-btn mul-btn-delete"
                            onClick={() => handleDeleteClick(user)}
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
        </Card.Body>
      </Card>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleEditSubmit} className="mul-edit-form">
            <div className="name-row">
              <div className="mul-field">
                <label className="mul-label">First Name *</label>
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
                <label className="mul-label">Last Name *</label>
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
                Username cannot be changed.
              </small>
            </div>

            <div className="mul-field">
              <label className="mul-label">Email *</label>
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
              <small className="mul-help-text">
                Role cannot be changed. Contact a system administrator if you need to change the role.
              </small>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={editLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditSubmit} disabled={editLoading}>
            {editLoading ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deletingUser && (
            <p>
              Are you sure you want to delete user <strong>{deletingUser.username}</strong>? 
              This action cannot be undone.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
