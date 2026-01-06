import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Dropdown } from "react-bootstrap";
import { FaUserShield, FaTrash, FaPlus, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import "../css/UserDetails.css";

export default function UserDetails({ user, departmentRolesMapping, onSave, onCancel, loading, onDirtyChange }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        roles: []
    });
    
    // New Role Selection State
    const [newRoleDept, setNewRoleDept] = useState("");
    const [newRoleName, setNewRoleName] = useState("");
    const [roleError, setRoleError] = useState("");

    const [initialFormData, setInitialFormData] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (user) {
            const initial = {
                firstName: user.first_name || "",
                lastName: user.last_name || "",
                email: user.email || "",
                roles: user.roles ? [...user.roles] : []
            };
            setFormData(initial);
            setInitialFormData(initial);
        }
    }, [user]);

    useEffect(() => {
        if (!initialFormData) return;
        const dirty = 
            formData.firstName !== initialFormData.firstName ||
            formData.lastName !== initialFormData.lastName ||
            formData.email !== initialFormData.email ||
            JSON.stringify(formData.roles) !== JSON.stringify(initialFormData.roles);
        setIsDirty(dirty);
        if (onDirtyChange) onDirtyChange(dirty);
    }, [formData, initialFormData, onDirtyChange]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRemoveRole = (index) => {
        if (formData.roles.length <= 1) return; // Prevent removing last role
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.filter((_, i) => i !== index)
        }));
    };

    const handleAddRole = () => {
        if (!newRoleDept || !newRoleName) return;

        // Find the mapping entry
        const mapping = departmentRolesMapping.find(
            dr => dr.department === newRoleDept && dr.role === newRoleName
        );

        if (mapping) {
            // Validation: External Maintainer exclusivity
            const isAddingExternal = newRoleName.toLowerCase() === "external maintainer";
            const hasExternal = formData.roles.some(r => r.role_name.toLowerCase() === "external maintainer");

            if (isAddingExternal && hasExternal) {
                setRoleError("The External Maintainer role can be assigned only once.");
                return;
            }

            if (isAddingExternal && formData.roles.length > 0) {
                setRoleError("External Maintainer role cannot be combined with other roles.");
                return;
            }

            if (!isAddingExternal && hasExternal) {
                setRoleError("External Maintainer role cannot be combined with other roles.");
                return;
            }

            // Check if already exists
            const exists = formData.roles.some(r => r.department_role_id === mapping.id);
            if (!exists) {
                setRoleError(""); // Clear previous error
                setFormData(prev => ({
                    ...prev,
                    roles: [...prev.roles, {
                        department_role_id: mapping.id,
                        department_name: newRoleDept,
                        role_name: newRoleName
                    }]
                }));
            }
        }
        setNewRoleDept("");
        setNewRoleName("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        setIsEditing(false);
    };

    // Filter roles based on selected department
    const availableRolesForDept = newRoleDept 
        ? [...new Set(departmentRolesMapping
            .filter(dr => dr.department === newRoleDept)
            .map(dr => dr.role))]
        : [];

    return (
        <div className="ud-container">
            <div className="ud-header">
                <h3 className="ud-title">
                    <FaUserShield /> User Details
                </h3>
                {!isEditing ? (
                    <button className="ud-btn ud-btn-primary" onClick={() => setIsEditing(true)} disabled={loading}>
                        <FaEdit /> Modify
                    </button>
                ) : (
                    <div className="ud-actions">
                        <button className="ud-btn ud-btn-secondary" onClick={() => { setIsEditing(false); onCancel(); }} disabled={loading}>
                            <FaTimes /> Cancel
                        </button>
                        <button className="ud-btn ud-btn-primary" onClick={handleSubmit} disabled={loading}>
                            <FaSave /> Save
                        </button>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="ud-form-grid">
                    <div className="ud-form-group">
                        <label className="ud-label">First Name</label>
                        <input
                            className="ud-input"
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            disabled={!isEditing || loading}
                            required
                        />
                    </div>
                    <div className="ud-form-group">
                        <label className="ud-label">Last Name</label>
                        <input
                            className="ud-input"
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            disabled={!isEditing || loading}
                            required
                        />
                    </div>
                    <div className="ud-form-group">
                        <label className="ud-label">Email</label>
                        <input
                            className="ud-input"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={!isEditing || loading}
                            required
                        />
                    </div>
                    <div className="ud-form-group">
                        <label className="ud-label">Username</label>
                        <input
                            className="ud-input"
                            type="text"
                            value={user?.username || ""}
                            disabled
                            readOnly
                        />
                    </div>
                </div>

                {/* Roles Management */}
                <div className="ud-roles-section">
                    <h5 className="ud-roles-title">
                        <FaUserShield /> Roles
                    </h5>
                    
                    <div className="ud-roles-list">
                        {formData.roles.length > 0 ? (
                            formData.roles.map((role, index) => (
                                <div key={index} className="ud-role-badge">
                                    <span className="ud-role-dept">{role.department_name}</span>
                                    <span className="ud-role-name">{role.role_name}</span>
                                    {isEditing && formData.roles.length > 1 && (
                                        <button 
                                            type="button"
                                            className="ud-icon-btn" 
                                            onClick={() => handleRemoveRole(index)}
                                            title="Remove role"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="ud-empty-roles">No roles assigned</div>
                        )}
                    </div>

                    {isEditing && (
                        <div className="ud-add-role-row">
                            <div>
                                <label className="ud-label">Department</label>
                                <Dropdown onSelect={(k) => {
                                    setNewRoleDept(k);
                                    setNewRoleName("");
                                }}>
                                    <Dropdown.Toggle className="ud-dropdown-toggle" id="dropdown-dept">
                                        {newRoleDept || "Select Department..."}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="ud-dropdown-menu">
                                        {[...new Set(departmentRolesMapping.map(dr => dr.department))].map(dept => (
                                            <Dropdown.Item 
                                                key={dept} 
                                                eventKey={dept}
                                                className="ud-dropdown-item"
                                                active={newRoleDept === dept}
                                            >
                                                {dept}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                            <div>
                                <label className="ud-label">Role</label>
                                <Dropdown onSelect={(k) => setNewRoleName(k)}>
                                    <Dropdown.Toggle 
                                        className="ud-dropdown-toggle" 
                                        id="dropdown-role"
                                        disabled={!newRoleDept}
                                    >
                                        {newRoleName || "Select Role..."}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="ud-dropdown-menu">
                                        {availableRolesForDept.map(role => (
                                            <Dropdown.Item 
                                                key={role} 
                                                eventKey={role}
                                                className="ud-dropdown-item"
                                                active={newRoleName === role}
                                            >
                                                {role}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                            <button 
                                type="button"
                                className="ud-btn ud-btn-primary" 
                                onClick={handleAddRole} 
                                disabled={!newRoleDept || !newRoleName}
                            >
                                <FaPlus /> Add Role
                            </button>
                        </div>
                    )}
                    {roleError && <div className="text-danger mt-2 small">{roleError}</div>}
                </div>
            </form>
        </div>
    );
}

UserDetails.propTypes = {
    user: PropTypes.object,
    departmentRolesMapping: PropTypes.array,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    onDirtyChange: PropTypes.func
};