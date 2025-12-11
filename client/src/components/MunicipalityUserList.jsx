import { useState, useEffect } from "react";
import PropTypes from "prop-types"; // Importato per la validazione delle props
import { Alert, Modal, Dropdown, InputGroup, Tooltip, OverlayTrigger } from "react-bootstrap";
import { FaFilter, FaBuilding, FaChevronDown, FaUndo } from "react-icons/fa"; 
import { 
  getAllMunicipalityUsers, 
  deleteMunicipalityUser,
  updateMunicipalityUser,
  getAllRoles,
} from "../api/municipalityUserApi";
import { getRolesByDepartment, getAllDepartments } from "../api/departmentAPI";
import UserDetails from "./UserDetails"; 

import "../css/MunicipalityUserList.css"; 

export default function MunicipalityUserList({ refreshTrigger }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Filters
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]); 
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState(""); 
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", email: "", firstName: "", lastName: "", role: "" });
  const [editLoading, setEditLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --- FETCH DATA PRINCIPALE ---
  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      setLoading(true);
      setError("");
      try {
        const [usersData, departmentsData] = await Promise.all([
          getAllMunicipalityUsers(),
          getAllDepartments()
        ]);

        if (isMounted) {
            setUsers(usersData);
            setDepartments(departmentsData);
        }
      } catch (err) {
        if (isMounted) {
            console.error("Failed to fetch initial data:", err);
            setError("Failed to load data. " + (err.message || ""));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initData();
    return () => { isMounted = false; };
  }, [refreshTrigger]); // Dipendenza da refreshTrigger

  // --- FETCH RUOLI (Dipende dai dipartimenti, non dal refresh principale) ---
  useEffect(() => {
    let isMounted = true;
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
        if(isMounted) setRoles(rolesList);
      } catch (err) {
        if(isMounted) {
            console.error("Failed to fetch roles:", err);
            setRoles([]);
        }
      } finally {
        if(isMounted) setLoadingRoles(false);
      }
    };

    fetchRoles();
    return () => { isMounted = false; };
  }, [departmentFilter]);

  // Helper per refresh silenzioso dopo edit/delete
  const reloadUsers = async () => {
    try {
        const list = await getAllMunicipalityUsers();
        setUsers(list);
    } catch(e) { console.error(e); }
  };

  const handleResetFilters = () => {
      setDepartmentFilter("");
      setRoleFilter("");
  };

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
    if (e && e.preventDefault) e.preventDefault();
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
      await reloadUsers(); // Reload locale
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
      await reloadUsers(); // Reload locale
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Delete failed.");
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDepartmentSelect = (value) => setDepartmentFilter(value);
  const getSelectedDepartmentName = () => {
    if (!departmentFilter) return "All Departments";
    // Correzione S7773
    return departments.find(d => d.id === Number.parseInt(departmentFilter))?.name;
  };
  
  const handleRoleFilterSelect = (value) => setRoleFilter(value);
  const getRoleFilterName = () => {
    if (!roleFilter) return "All Roles";
    return roleFilter.name || roleFilter;
  };

  const filteredUsers = users.filter(user => {
    if (user.department_name === "external service providers") return false;
    const roleName = user.role_name ? user.role_name.toLowerCase() : "";
    if (roleName === "external maintainer") return false;

    const selectedDeptName = departmentFilter 
      // Correzione S7773
      ? departments.find(d => d.id === Number.parseInt(departmentFilter))?.name 
      : null;

    const departmentMatch = !departmentFilter || user.department_name === selectedDeptName;
    
    // Correzione S3358: Estrarre l'operatore ternario nidificato per chiarezza
    const isRoleMatch = (filter, userRoleName) => {
      if (!filter) return true;
      if (typeof filter === 'string') {
        return userRoleName === filter;
      }
      return userRoleName === filter.name;
    };
    const roleMatch = isRoleMatch(roleFilter, user.role_name);

    return departmentMatch && roleMatch;
  });

  return (
    <div className="municipalityUserList-modern">
      <div className="mul-header">
        <h1 className="mul-title">Officers Management</h1>
        <div className="mul-filters">
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
                    <Dropdown.Item eventKey="" active={departmentFilter === ""}>All Departments</Dropdown.Item>
                    {departments
                        .filter(dept => (dept.name || "").toLowerCase() !== "external service providers")
                        .map((dept) => (
                        <Dropdown.Item key={dept.id} eventKey={dept.id} active={departmentFilter === dept.id.toString()}>
                            {dept.name}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
             </Dropdown>
          </InputGroup>

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
                    <Dropdown.Item eventKey="" active={roleFilter === ""}>All Roles</Dropdown.Item>
                    {roles
                        .filter(role => ((typeof role === 'object' ? role.name : role) || "").toLowerCase() !== "external maintainer")
                        .map((role) => {
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

          <OverlayTrigger placement="top" overlay={<Tooltip>Reset Filters</Tooltip>}>
            <button className="mul-btn-reset" onClick={handleResetFilters} disabled={!departmentFilter && !roleFilter}>
                <FaUndo />
            </button>
          </OverlayTrigger>
        </div>
      </div>

      {(error || success) && (
        <Alert variant={error ? "danger" : "success"} onClose={() => {setError(""); setSuccess("")}} dismissible className="mb-4">
          {error || success}
        </Alert>
      )}

      <div className="mul-card">
        <div className="mul-card-body">
          {loading ? (
            <div className="mul-loading"><div className="mul-loading-spinner"></div>Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="mul-empty"><div>👥</div>No users found.</div>
          ) : (
            <div className="mul-table-wrapper">
              <table className="mul-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Username</th><th>Email</th><th>Department</th><th>Role</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td><span className="text-muted">#{user.id}</span></td>
                      <td><strong>{user.username}</strong></td>
                      <td>{user.email}</td>
                      <td>{user.department_name}</td>
                      <td><span className="mul-role-badge">{user.role_name}</span></td>
                      <td>
                        <div className="mul-actions">
                          <button className="mul-btn mul-btn-edit" onClick={() => handleEdit(user)}>Edit</button>
                          <button className="mul-btn mul-btn-delete" onClick={() => handleDeleteClick(user)}>Delete</button>
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

      {/* MODALS (Edit/Delete) omesse per brevità ma identiche a prima, usando UserDetails */}
       <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered dialogClassName="mul-modal-content">
        <Modal.Header closeButton className="mul-modal-header"><Modal.Title>Edit User</Modal.Title></Modal.Header>
        <Modal.Body className="mul-modal-body">
          <UserDetails formData={editForm} onChange={handleEditChange} onSubmit={handleEditSubmit} loading={editLoading} />
        </Modal.Body>
        <Modal.Footer>
          <button className="mul-modal-btn mul-modal-btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
          <button className="mul-modal-btn mul-modal-btn-confirm" onClick={handleEditSubmit}>{editLoading ? "Saving..." : "Save"}</button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
        <Modal.Body>Delete {deletingUser?.username}?</Modal.Body>
        <Modal.Footer>
          <button className="mul-modal-btn mul-modal-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
          <button className="mul-modal-btn mul-modal-btn-danger" onClick={handleDeleteConfirm}>{deleteLoading ? "Deleting..." : "Delete"}</button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

// Aggiungi la validazione delle props
MunicipalityUserList.propTypes = {
  refreshTrigger: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.string,
  ]).isRequired,
};