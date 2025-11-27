import { useState, useEffect } from "react";
import { Alert, Modal, Dropdown } from "react-bootstrap";
import { FaFilter, FaBuilding } from "react-icons/fa";
import { 
  getAllMunicipalityUsers, 
  deleteMunicipalityUser,
  updateMunicipalityUser,
  getAllRoles,
} from "../api/municipalityUserApi";
import { getRolesByDepartment, getAllDepartments } from "../api/departmentAPI";

import "../css/MunicipalityUserList.css"; 

export default function MunicipalityUserList({ refreshTrigger }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Filters states
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]); 
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState(""); 
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", email: "", firstName: "", lastName: "", role: "" });
  const [editLoading, setEditLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [usersData, departmentsData] = await Promise.all([
          getAllMunicipalityUsers(),
          getAllDepartments()
        ]);

        setUsers(usersData);
        setDepartments(departmentsData);
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

  // Fetch Roles when Department Filter changes
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      setRoleFilter(""); 
      
      try {
        let rolesList;
        if (departmentFilter) {
          rolesList = await getRolesByDepartment(departmentFilter);
        } else {
          rolesList = await getAllRoles();
        }
        setRoles(rolesList);
      } catch (err) {
        console.error("Failed to fetch roles:", err);
        setError("Failed to load roles for the selected department: " + departmentFilter);
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [departmentFilter]);

  const fetchUsers = async () => {
    try {
      const usersList = await getAllMunicipalityUsers();
      setUsers(usersList);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(`Failed to load users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Edit Modal Functions ---
  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      role: user.role_name,
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editForm.email.trim() || !editForm.firstName.trim() || !editForm.lastName.trim()) {
      setError("All fields are required");
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
  const handleDepartmentSelect = (value) => setDepartmentFilter(value);
  
  const getSelectedDepartmentName = () => {
    if (!departmentFilter) return "All Departments";
    return departments.find(d => d.id === parseInt(departmentFilter))?.name;
  };
  
  const handleRoleFilterSelect = (value) => setRoleFilter(value);

  const getRoleFilterName = () => {
    if (!roleFilter) return "All Roles";
    return roleFilter.name || roleFilter;
  };

  // --- Filter Logic ---
  const filteredUsers = users.filter(user => {
    const selectedDeptName = departmentFilter 
      ? departments.find(d => d.id === parseInt(departmentFilter))?.name 
      : null;

    const departmentMatch = !departmentFilter || user.department_name === selectedDeptName;
    const roleMatch = !roleFilter || 
                      (typeof roleFilter === 'string' ? user.role_name === roleFilter : user.role_name === roleFilter.name);

    return departmentMatch && roleMatch;
  });

  return (
    <div className="municipalityUserList-modern">
      {/* Header */}
      <div className="mul-header">
        <h1 className="mul-title">Officers Management</h1>
        
        <div className="mul-filters">
          {/* Department Dropdown */}
          <Dropdown 
            onSelect={handleDepartmentSelect} 
            className="mul-filter-dropdown-departments"
          >
            <Dropdown.Toggle 
              className="modern-dropdown-toggle" 
              id="department-filter-dropdown"
            >
              <FaBuilding className="dropdown-icon" />
              <span className="dropdown-toggle-text">{getSelectedDepartmentName()}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="modern-dropdown-menu">
              <Dropdown.Item eventKey="" active={departmentFilter === ""}>
                All Departments
              </Dropdown.Item>
              {departments.map((dept) => (
                <Dropdown.Item 
                  key={dept.id} 
                  eventKey={dept.id}
                  active={departmentFilter === dept.id.toString()}
                >
                  {dept.name}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          {/* Role Dropdown */}
          <Dropdown 
            onSelect={handleRoleFilterSelect} 
            className="mul-filter-dropdown"
          >
            <Dropdown.Toggle 
              className="modern-dropdown-toggle" 
              id="role-filter-dropdown"
              disabled={loadingRoles} 
            >
              <FaFilter className="dropdown-icon" />
              <span className="dropdown-toggle-text">
                {loadingRoles ? "Loading roles..." : getRoleFilterName()}
              </span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="modern-dropdown-menu">
              <Dropdown.Item eventKey="" active={roleFilter === ""}>
                All Roles
              </Dropdown.Item>
              {roles.map((role) => {
                 const roleValue = typeof role === 'object' ? role.name : role;
                 const roleKey = typeof role === 'object' ? role.id : role;
                 return (
                  <Dropdown.Item 
                    key={roleKey} 
                    eventKey={roleValue}
                    active={roleFilter === roleValue}
                  >
                    {roleValue}
                  </Dropdown.Item>
                 );
              })}
            </Dropdown.Menu>
          </Dropdown>
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
                  {roleFilter || departmentFilter
                    ? "No users match the current filters."
                    : "No municipality users found."
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
                    <th>Email</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td><strong>{user.username}</strong></td>
                      <td>{user.email}</td>
                      <td>{user.department_name}</td>
                      <td><span className="mul-role-badge">{user.role_name}</span></td>
                      <td>
                        <div className="mul-actions">
                          <button className="mul-btn mul-btn-edit" onClick={() => handleEdit(user)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                            Edit
                          </button>
                          <button className="mul-btn mul-btn-delete" onClick={() => handleDeleteClick(user)}>
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
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered dialogClassName="mul-modal-content">
        <Modal.Header closeButton className="mul-modal-header">
          <Modal.Title className="mul-modal-title">Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body className="mul-modal-body">
          <form onSubmit={handleEditSubmit} className="mul-edit-form">
            <div className="name-row">
              <div className="mul-field">
                <label className="mul-label"><span className="mul-required">First Name</span></label>
                <input type="text" name="firstName" value={editForm.firstName} onChange={handleEditChange} disabled={editLoading} required />
              </div>
              <div className="mul-field">
                <label className="mul-label"><span className="mul-required">Last Name</span></label>
                <input type="text" name="lastName" value={editForm.lastName} onChange={handleEditChange} disabled={editLoading} required />
              </div>
            </div>

            <div className="mul-field">
              <label className="mul-label">Username</label>
              <input type="text" value={editForm.username} disabled className="mul-readonly" />
              <small className="mul-help-text">Username cannot be changed</small>
            </div>

            <div className="mul-field">
              <label className="mul-label"><span className="mul-required">Email</span></label>
              <input type="email" name="email" value={editForm.email} onChange={handleEditChange} disabled={editLoading} required />
            </div>

            <div className="mul-field">
              <label className="mul-label">Role</label>
              <input type="text" value={editForm.role} disabled className="mul-readonly" />
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer className="mul-modal-footer">
          <button className="mul-modal-btn mul-modal-btn-cancel" onClick={() => setShowEditModal(false)} disabled={editLoading}>
            Cancel
          </button>
          <button className="mul-modal-btn mul-modal-btn-confirm" onClick={handleEditSubmit} disabled={editLoading}>
            {editLoading ? (<><div className="mul-loading-spinner" style={{ width: '16px', height: '16px' }}></div> Saving...</>) : 'Save Changes'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered dialogClassName="mul-modal-content">
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
                This action cannot be undone.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="mul-modal-footer">
          <button className="mul-modal-btn mul-modal-btn-cancel" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
            Cancel
          </button>
          <button className="mul-modal-btn mul-modal-btn-danger" onClick={handleDeleteConfirm} disabled={deleteLoading}>
            {deleteLoading ? (<><div className="mul-loading-spinner" style={{ width: '16px', height: '16px' }}></div> Deleting...</>) : 'Delete User'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}