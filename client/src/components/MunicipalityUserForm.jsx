import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Form, Button, Alert, Dropdown, Table } from "react-bootstrap";
import { createMunicipalityUser } from "../api/municipalityUserApi";
import { getAllDepartmentRolesMapping } from "../api/departmentAPI";
import { getAllCompanies } from "../api/companyApi";
import "../css/MunicipalityUserForm.css";
import {
  FaEye, FaEyeSlash, FaSave, FaTimes,
  FaUser, FaEnvelope, FaBuilding, FaLock, FaPlus, FaTrash, FaUserShield, FaIdCard, FaExclamationCircle
} from "react-icons/fa";

export default function MunicipalityUserForm({ onSuccess, onCancel }) {
  // --- STATE ---
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    companyName: ""
  });

  const [departmentRolesMapping, setDepartmentRolesMapping] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]); 
  
  const [newRoleDept, setNewRoleDept] = useState("");
  const [newRoleName, setNewRoleName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); // Field-specific errors
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState("");

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mappingData, companiesData] = await Promise.all([
          getAllDepartmentRolesMapping(),
          getAllCompanies()
        ]);
        setDepartmentRolesMapping(mappingData);
        setCompanies(companiesData);
      } catch (err) {
        console.error("Failed to load form data:", err);
        setGeneralError("Failed to load necessary data.");
      }
    };
    fetchData();
  }, []);

  // --- DERIVED STATE ---
  const availableDepartments = useMemo(() => {
    return [...new Set(departmentRolesMapping.map(dr => dr.department))].sort();
  }, [departmentRolesMapping]);

  const availableRolesForDept = useMemo(() => {
    if (!newRoleDept) return [];
    return departmentRolesMapping
      .filter(dr => dr.department === newRoleDept)
      .map(dr => dr.role)
      .sort();
  }, [departmentRolesMapping, newRoleDept]);

  const isExternalMaintainer = useMemo(() => {
    return selectedRoles.some(r => r.role.toLowerCase() === "external maintainer");
  }, [selectedRoles]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddRole = () => {
    if (!newRoleDept || !newRoleName) return;

    const roleToAdd = departmentRolesMapping.find(
      dr => dr.department === newRoleDept && dr.role === newRoleName
    );

    if (roleToAdd && !selectedRoles.some(r => r.id === roleToAdd.id)) {
      // Logic to enforce single role for External Maintainer
      const isAddingExternal = roleToAdd.role.toLowerCase() === "external maintainer";
      const hasExternal = selectedRoles.some(r => r.role.toLowerCase() === "external maintainer");

      if (isAddingExternal && hasExternal) {
        setErrors(prev => ({ ...prev, roles: "The External Maintainer role can be assigned only once." }));
        return;
      }

      if (isAddingExternal && selectedRoles.length > 0) {
        setErrors(prev => ({ ...prev, roles: "External Maintainer role cannot be combined with other roles." }));
        return;
      }

      if (!isAddingExternal && hasExternal) {
        setErrors(prev => ({ ...prev, roles: "External Maintainer role cannot be combined with other roles." }));
        return;
      }

      setSelectedRoles(prev => [...prev, roleToAdd]);
      setNewRoleDept("");
      setNewRoleName("");
      if (errors.roles) setErrors(prev => ({ ...prev, roles: "" }));
    }
  };

  const handleRemoveRole = (roleId) => {
    setSelectedRoles(prev => prev.filter(r => r.id !== roleId));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 chars";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    
    if (selectedRoles.length === 0) newErrors.roles = "Assign at least one role";
    if (isExternalMaintainer && !formData.companyName) newErrors.companyName = "Company is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        department_role_ids: selectedRoles.map(r => r.id),
        company_name: isExternalMaintainer ? formData.companyName : undefined
      };

      await createMunicipalityUser(payload);
      setSuccess("User created successfully!");
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setGeneralError(err.message || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      companyName: ""
    });
    setSelectedRoles([]);
    setNewRoleDept("");
    setNewRoleName("");
    setErrors({});
    setGeneralError("");
    setSuccess("");
    if (onCancel) onCancel();
  };

  // Helper for error display
  const ErrorMsg = ({ field }) => errors[field] ? (
    <div className="muf-error-msg"><FaExclamationCircle /> {errors[field]}</div>
  ) : null;

  return (
    <div className="muf-card">
      {/* HEADER */}
      <div className="muf-header">
        <div className="muf-header-title">
          <FaUserShield className="muf-header-icon" />
          <div>
            <h5>Create New User</h5>
            <small>Enter user details and assign roles</small>
          </div>
        </div>
        <button className="muf-close-btn" onClick={handleCancel}><FaTimes /></button>
      </div>

      {/* BODY */}
      <div className="muf-body">
        {generalError && <Alert variant="danger" className="py-2" onClose={() => setGeneralError("")} dismissible>{generalError}</Alert>}
        {success && <Alert variant="success" className="py-2" onClose={() => setSuccess("")} dismissible>{success}</Alert>}

        <Form onSubmit={handleSubmit} noValidate>
          <div className="muf-grid-layout">
            
            {/* LEFT COLUMN: INFO & SECURITY */}
            <div className="muf-col-left">
              <h6 className="muf-section-label">Personal Information</h6>
              
              <div className="muf-row-split">
                <div className="muf-input-wrapper">
                  <label>First Name</label>
                  <div className={`muf-input-group ${errors.firstName ? 'has-error' : ''}`}>
                    <div className="muf-input-icon"><FaUser /></div>
                    <input 
                      type="text" name="firstName" placeholder="Mario"
                      value={formData.firstName} onChange={handleChange} 
                    />
                  </div>
                  <ErrorMsg field="firstName" />
                </div>
                <div className="muf-input-wrapper">
                  <label>Last Name</label>
                  <div className={`muf-input-group ${errors.lastName ? 'has-error' : ''}`}>
                    <div className="muf-input-icon"><FaUser /></div>
                    <input 
                      type="text" name="lastName" placeholder="Rossi"
                      value={formData.lastName} onChange={handleChange} 
                    />
                  </div>
                  <ErrorMsg field="lastName" />
                </div>
              </div>

              <div className="muf-input-wrapper mt-3">
                <label>Email Address</label>
                <div className={`muf-input-group ${errors.email ? 'has-error' : ''}`}>
                  <div className="muf-input-icon"><FaEnvelope /></div>
                  <input 
                    type="email" name="email" placeholder="m.rossi@example.com"
                    value={formData.email} onChange={handleChange} 
                  />
                </div>
                <ErrorMsg field="email" />
              </div>

              <div className="muf-input-wrapper mt-3">
                <label>Username</label>
                <div className={`muf-input-group ${errors.username ? 'has-error' : ''}`}>
                  <div className="muf-input-icon"><FaIdCard /></div>
                  <input 
                    type="text" name="username" placeholder="m.rossi"
                    value={formData.username} onChange={handleChange} 
                  />
                </div>
                <ErrorMsg field="username" />
              </div>

              <h6 className="muf-section-label mt-4">Security</h6>
              <div className="muf-row-split">
                <div className="muf-input-wrapper">
                  <label>Password</label>
                  <div className={`muf-input-group ${errors.password ? 'has-error' : ''}`}>
                    <div className="muf-input-icon"><FaLock /></div>
                    <input 
                      type={showPassword ? "text" : "password"} name="password" placeholder="••••••"
                      value={formData.password} onChange={handleChange} 
                    />
                  </div>
                  <ErrorMsg field="password" />
                </div>
                <div className="muf-input-wrapper">
                  <label>Confirm</label>
                  <div className={`muf-input-group ${errors.confirmPassword ? 'has-error' : ''}`}>
                    <div className="muf-input-icon"><FaLock /></div>
                    <input 
                      type={showPassword ? "text" : "password"} name="confirmPassword" placeholder="••••••"
                      value={formData.confirmPassword} onChange={handleChange} 
                    />
                    <button type="button" className="muf-pwd-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <ErrorMsg field="confirmPassword" />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ROLES & COMPANY */}
            <div className="muf-col-right">
              <h6 className="muf-section-label">Access Control</h6>
              
              <div className="muf-roles-container">
                <div className="muf-roles-scroll">
                  <Table size="sm" className="muf-roles-table">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Role</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRoles.length === 0 ? (
                        <tr><td colSpan="3" className="text-center text-muted">No roles assigned.</td></tr>
                      ) : (
                        selectedRoles.map((role) => (
                          <tr key={role.id}>
                            <td>{role.department}</td>
                            <td><span className="muf-badge">{role.role}</span></td>
                            <td className="text-end">
                              <button type="button" className="muf-btn-icon-danger" onClick={() => handleRemoveRole(role.id)}>
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>

                <div className="muf-add-role-row">
                  <Dropdown onSelect={(k) => { setNewRoleDept(k); setNewRoleName(""); }} className="flex-fill">
                    <Dropdown.Toggle variant="light" className="muf-select-toggle">
                      {newRoleDept || "Department..."}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="muf-dropdown-menu">
                      {availableDepartments.map(dept => (
                        <Dropdown.Item key={dept} eventKey={dept} active={newRoleDept === dept}>{dept}</Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>

                  <Dropdown onSelect={(k) => setNewRoleName(k)} className="flex-fill">
                    <Dropdown.Toggle variant="light" className="muf-select-toggle" disabled={!newRoleDept}>
                      {newRoleName || "Role..."}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="muf-dropdown-menu">
                      {availableRolesForDept.map(role => (
                        <Dropdown.Item key={role} eventKey={role} active={newRoleName === role}>{role}</Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>

                  <button 
                    type="button" 
                    className="muf-btn-add" 
                    onClick={handleAddRole} 
                    disabled={!newRoleDept || !newRoleName}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              <ErrorMsg field="roles" />

              {/* Company Section (Conditional) */}
              <div className={`muf-company-section ${isExternalMaintainer ? 'visible' : ''}`}>
                 <h6 className="muf-section-label mt-3">External Organization</h6>
                 <div className="muf-input-wrapper">
                  <div className={`muf-input-group ${errors.companyName ? 'has-error' : ''}`}>
                    <div className="muf-input-icon"><FaBuilding /></div>
                    
                    {/* Replaced native select with Bootstrap Dropdown to match style */}
                    <Dropdown 
                      onSelect={(k) => {
                        handleChange({ target: { name: 'companyName', value: k } });
                      }} 
                      className="flex-fill w-100"
                    >
                      <Dropdown.Toggle variant="light" className="muf-select-toggle border-0 w-100 text-start">
                        {formData.companyName || "Select Company..."}
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="muf-dropdown-menu w-100">
                        {companies.map(c => (
                          <Dropdown.Item key={c.id} eventKey={c.name} active={formData.companyName === c.name}>
                            {c.name}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>

                  </div>
                  <ErrorMsg field="companyName" />
                </div>
              </div>
              
              {/* ACTIONS */}
              <div className="muf-actions mt-auto">
                <Button variant="outline-secondary" onClick={handleCancel}>Cancel</Button>
                <Button className="muf-btn-primary" type="submit" disabled={loading}>
                  {loading ? "Creating..." : <><FaSave className="me-2" /> Create User</>}
                </Button>
              </div>
            </div>

          </div>
        </Form>
      </div>
    </div>
  );
}

MunicipalityUserForm.propTypes = {
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func.isRequired
};