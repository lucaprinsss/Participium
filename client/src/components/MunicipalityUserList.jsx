import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Alert, Modal, Dropdown, InputGroup, Tooltip, OverlayTrigger, Form } from "react-bootstrap";
import { FaFilter, FaBuilding, FaChevronDown, FaUndo } from "react-icons/fa";
import {
    getAllMunicipalityUsers,
    deleteMunicipalityUser,
    updateMunicipalityUser,
    getAllRoles,
} from "../api/municipalityUserApi";
import { getAllDepartments, getAllDepartmentRolesMapping } from "../api/departmentAPI";
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
    const [departmentRolesMapping, setDepartmentRolesMapping] = useState([]);
    
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [selectedDepartments, setSelectedDepartments] = useState([]);

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editLoading, setEditLoading] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingUser, setDeletingUser] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // --- MAIN DATA FETCH ---
    useEffect(() => {
        let isMounted = true;
        const initData = async () => {
            setLoading(true);
            setError("");
            try {
                const [usersData, departmentsData, rolesData, mappingData] = await Promise.all([
                    getAllMunicipalityUsers(),
                    getAllDepartments(),
                    getAllRoles(),
                    getAllDepartmentRolesMapping()
                ]);

                if (isMounted) {
                    setUsers(usersData);
                    setDepartments(departmentsData);
                    setRoles(rolesData);
                    setDepartmentRolesMapping(mappingData);
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
    }, [refreshTrigger]);

    // Helper for silent refresh after edit/delete
    const reloadUsers = async () => {
        try {
            const list = await getAllMunicipalityUsers();
            setUsers(list);
        } catch (e) { console.error(e); }
    };

    const handleResetFilters = () => {
        setSelectedDepartments([]);
        setSelectedRoles([]);
    };

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
            await reloadUsers();
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
            await reloadUsers();
            setTimeout(() => setSuccess(""), 5000);
        } catch (err) {
            setError(err.message || "Delete failed.");
            setShowDeleteModal(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    const toggleDepartmentFilter = (deptId) => {
        setSelectedDepartments(prev => {
            if (prev.includes(deptId)) return prev.filter(id => id !== deptId);
            return [...prev, deptId];
        });
    };

    const toggleRoleFilter = (roleName) => {
        setSelectedRoles(prev => {
            if (prev.includes(roleName)) return prev.filter(r => r !== roleName);
            return [...prev, roleName];
        });
    };

    const filteredUsers = users.filter(user => {
        const userRoles = user.roles || [];
        const isExternalServiceProvider = userRoles.some(r => (r.department_name || "").toLowerCase() === "external service providers");
        if (isExternalServiceProvider) return false;
        
        const isExternalMaintainer = userRoles.some(r => (r.role_name || "").toLowerCase() === "external maintainer");
        if (isExternalMaintainer) return false;

        // Department Filter (OR logic)
        const departmentMatch = selectedDepartments.length === 0 || 
            userRoles.some(r => {
                const dept = departments.find(d => d.name === r.department_name);
                return dept && selectedDepartments.includes(dept.id.toString());
            });

        // Role Filter (OR logic)
        const roleMatch = selectedRoles.length === 0 || 
            userRoles.some(r => selectedRoles.includes(r.role_name));

        return departmentMatch && roleMatch;
    });

    return (
        <div className="municipalityUserList-modern">
            <div className="mul-header">
                <h1 className="mul-title">Officers Management</h1>
                <div className="mul-filters">
                    <InputGroup className="mul-filter-group">
                        <InputGroup.Text className="mul-filter-icon"><FaBuilding /></InputGroup.Text>
                        <Dropdown className="mul-custom-dropdown" autoClose="outside">
                            <Dropdown.Toggle variant="light" className="mul-filter-toggle">
                                <div className="d-flex align-items-center justify-content-between w-100">
                                    <span className="text-truncate">
                                        {selectedDepartments.length === 0 ? "All Departments" : `${selectedDepartments.length} Selected`}
                                    </span>
                                    <FaChevronDown className="mul-dropdown-arrow ms-2" />
                                </div>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="modern-dropdown-menu">
                                {departments
                                    .filter(dept => (dept.name || "").toLowerCase() !== "external service providers")
                                    .map((dept) => (
                                        <Dropdown.Item key={dept.id} onClick={() => toggleDepartmentFilter(dept.id.toString())}>
                                            <Form.Check 
                                                type="checkbox"
                                                label={dept.name}
                                                checked={selectedDepartments.includes(dept.id.toString())}
                                                onChange={() => {}} // Handled by onClick
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </Dropdown.Item>
                                    ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    </InputGroup>

                    <InputGroup className="mul-filter-group">
                        <InputGroup.Text className="mul-filter-icon"><FaFilter /></InputGroup.Text>
                        <Dropdown className="mul-custom-dropdown" autoClose="outside">
                            <Dropdown.Toggle variant="light" className="mul-filter-toggle">
                                <div className="d-flex align-items-center justify-content-between w-100">
                                    <span className="text-truncate">
                                        {selectedRoles.length === 0 ? "All Roles" : `${selectedRoles.length} Selected`}
                                    </span>
                                    <FaChevronDown className="mul-dropdown-arrow ms-2" />
                                </div>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="modern-dropdown-menu">
                                {roles
                                    .filter(role => ((typeof role === 'object' ? role.name : role) || "").toLowerCase() !== "external maintainer")
                                    .map((role) => {
                                        const roleValue = typeof role === 'object' ? role.name : role;
                                        const roleKey = typeof role === 'object' ? role.id : role;
                                        return (
                                            <Dropdown.Item key={roleKey} onClick={() => toggleRoleFilter(roleValue)}>
                                                <Form.Check 
                                                    type="checkbox"
                                                    label={roleValue}
                                                    checked={selectedRoles.includes(roleValue)}
                                                    onChange={() => {}}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Dropdown.Item>
                                        );
                                    })}
                            </Dropdown.Menu>
                        </Dropdown>
                    </InputGroup>

                    <OverlayTrigger placement="top" overlay={<Tooltip>Reset Filters</Tooltip>}>
                        <button className="mul-btn-reset" onClick={handleResetFilters} disabled={selectedDepartments.length === 0 && selectedRoles.length === 0}>
                            <FaUndo />
                        </button>
                    </OverlayTrigger>
                </div>
            </div>

            {(error || success) && (
                <Alert variant={error ? "danger" : "success"} onClose={() => { setError(""); setSuccess("") }} dismissible className="mb-4">
                    {error || success}
                </Alert>
            )}

            <div className="mul-card">
                <div className="mul-card-body">
                    <div className="mul-table-wrapper mul-table-wrapper-scrollable">
                        <table className="mul-table">
                            <thead>
                                <tr>
                                    <th>ID</th><th>Username</th><th>Email</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4">
                                            <div className="mul-loading">
                                                <div className="mul-loading-content">
                                                    <div className="mul-loading-spinner"></div>
                                                    <div>Loading users...</div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4">
                                            <div className="mul-empty">
                                                <div className="mul-empty-content">
                                                    <div className="mul-empty-icon">👥</div>
                                                    <div>No users found.</div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr 
                                            key={user.id} 
                                            onClick={() => handleEdit(user)} 
                                            className="mul-table-row"
                                        >
                                            <td><span className="text-muted">#{user.id}</span></td>
                                            <td><strong>{user.username}</strong></td>
                                            <td>{user.email}</td>
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
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
                <Modal.Body>Delete {deletingUser?.username}?</Modal.Body>
                <Modal.Footer>
                    <button className="mul-modal-btn mul-modal-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                    <button className="mul-modal-btn mul-modal-btn-danger" onClick={handleDeleteConfirm}>{deleteLoading ? "Deleting..." : "Delete"}</button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

MunicipalityUserList.propTypes = {
    refreshTrigger: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.number,
        PropTypes.string,
    ]).isRequired,
};