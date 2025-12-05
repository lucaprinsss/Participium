import { useState, useEffect } from "react";
import { Alert, Modal, Dropdown, InputGroup, Tooltip, OverlayTrigger } from "react-bootstrap";
import { FaFilter, FaBuilding, FaChevronDown, FaUndo, FaUser, FaEnvelope, FaUserShield, FaSave } from "react-icons/fa"; // Aggiunto FaUndo
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

  // --- Reset Filters ---
  const handleResetFilters = () => {
      setDepartmentFilter("");
      setRoleFilter("");
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
          
          {/* Department Filter */}
          <InputGroup className="mul-filter-group">
             <InputGroup.Text className="mul-filter-icon"><FaBuilding/></InputGroup.Text>
             <Dropdown onSelect={handleDepartmentSelect} className="mul-custom-dropdown">
                <Dropdown.Toggle variant="light" className="mul-filter-toggle">
                    <div className="d-flex align-items-center justify-content-between w-100">
                        <span className="text-truncate">{getSelectedDepartmentName()}</span>
                        <FaChevronDown className="mul-dropdown-arrow ms-2"/>
                    </div>
                </Dropdown.Toggle>
                <Dropdown.Menu className="modern-dropdown-menu">
                    <Dropdown.Item eventKey="" active={departmentFilter === ""}>
                        All Departments
                    </Dropdown.Item>
                    {departments.map((dept) => (
                        <Dropdown.Item key={dept.id} eventKey={dept.id} active={departmentFilter === dept.id.toString()}>
                            {dept.name}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
             </Dropdown>
          </InputGroup>

          {/* Role Filter */}
          <InputGroup className="mul-filter-group">
             <InputGroup.Text className="mul-filter-icon"><FaFilter/></InputGroup.Text>
             <Dropdown onSelect={handleRoleFilterSelect} className="mul-custom-dropdown">
                <Dropdown.Toggle variant="light" className="mul-filter-toggle" disabled={loadingRoles}>
                    <div className="d-flex align-items-center justify-content-between w-100">
                        <span className="text-truncate">{loadingRoles ? "Loading..." : getRoleFilterName()}</span>
                        <FaChevronDown className="mul-dropdown-arrow ms-2"/>
                    </div>
                </Dropdown.Toggle>
                <Dropdown.Menu className="modern-dropdown-menu">
                    <Dropdown.Item eventKey="" active={roleFilter === ""}>
                        All Roles
                    </Dropdown.Item>
                    {roles.map((role) => {
                        const roleValue = typeof role === 'object' ? role.name : role;
                        const roleKey = typeof role === 'object' ? role.id : role;
                        return (
                            <Dropdown.Item key={roleKey} eventKey={roleValue} active={roleFilter === roleValue}>
                                {roleValue}
                            </Dropdown.Item>
                        );
                    })}
                </Dropdown.Menu>
             </Dropdown>
          </InputGroup>

          {/* Reset Filters Button */}
          <OverlayTrigger placement="top" overlay={<Tooltip>Reset Filters</Tooltip>}>
            <button 
                className="mul-btn-reset" 
                onClick={handleResetFilters} 
                disabled={!departmentFilter && !roleFilter}
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
                            Edit
                          </button>
                          <button className="mul-btn mul-btn-delete" onClick={() => handleDeleteClick(user)}>
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
                <InputGroup className="mul-input-group">
                    <InputGroup.Text className="mul-icon"><FaUser/></InputGroup.Text>
                    <input type="text" name="firstName" className="form-control mul-input" value={editForm.firstName} onChange={handleEditChange} required disabled={editLoading}/>
                </InputGroup>
              </div>
              <div className="mul-field">
                <label className="mul-label"><span className="mul-required">Last Name</span></label>
                <InputGroup className="mul-input-group">
                    <InputGroup.Text className="mul-icon"><FaUser/></InputGroup.Text>
                    <input type="text" name="lastName" className="form-control mul-input" value={editForm.lastName} onChange={handleEditChange} required disabled={editLoading}/>
                </InputGroup>
              </div>
            </div>

            <div className="mul-field">
              <label className="mul-label">Username</label>
              <InputGroup className="mul-input-group">
                    <InputGroup.Text className="mul-icon"><FaUser/></InputGroup.Text>
                    <input type="text" className="form-control mul-input mul-readonly" value={editForm.username} disabled />
              </InputGroup>
              <small className="mul-help-text">Username cannot be changed</small>
            </div>

            <div className="mul-field">
              <label className="mul-label"><span className="mul-required">Email</span></label>
              <InputGroup className="mul-input-group">
                    <InputGroup.Text className="mul-icon"><FaEnvelope/></InputGroup.Text>
                    <input type="email" name="email" className="form-control mul-input" value={editForm.email} onChange={handleEditChange} required disabled={editLoading}/>
              </InputGroup>
            </div>

            <div className="mul-field">
              <label className="mul-label">Role</label>
              <InputGroup className="mul-input-group">
                    <InputGroup.Text className="mul-icon"><FaUserShield/></InputGroup.Text>
                    <input type="text" className="form-control mul-input mul-readonly" value={editForm.role} disabled />
              </InputGroup>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer className="mul-modal-footer">
          <button className="mul-modal-btn mul-modal-btn-cancel" onClick={() => setShowEditModal(false)} disabled={editLoading}>
            Cancel
          </button>
          <button className="mul-modal-btn mul-modal-btn-confirm" onClick={handleEditSubmit} disabled={editLoading}>
            {editLoading ? "Saving..." : <><FaSave className="me-2"/> Save Changes</>}
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
            {deleteLoading ? "Deleting..." : "Delete User"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}