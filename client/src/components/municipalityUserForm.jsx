import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Alert, Dropdown } from "react-bootstrap";
import { createMunicipalityUser, getAllRoles } from "../api/municipalityUserApi";
import { getRolesByDepartment, getAllDepartments } from "../api/departmentAPI";
import "../css/MunicipalityUserForm.css";
import { FaEye, FaEyeSlash, FaUserPlus, FaTimes, FaCheck, FaShieldAlt, FaBuilding } from "react-icons/fa";

// --- Utility Functions ---
const cleanInput = (value, isEmail = false) => {
  if (typeof value !== 'string') return value;
  const noSpaces = value.replace(/\s/g, '');
  return isEmail ? noSpaces.toLowerCase() : noSpaces;
};

const calculateStrength = (password) => {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 6) strength += 1;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  return strength;
};

const getStrengthColor = (strength) => {
  const colors = ["#dc3545", "#ff6b35", "#ffa726", "#9ccc65", "#4caf50"];
  return colors[strength] || "#dc3545";
};

// --- Sub-Components ---

const FormInput = ({ label, name, type = "text", value, placeholder, onChange, disabled, required = true }) => {
  const handleKeyDown = (e) => {
    if (e.key === " ") e.preventDefault();
  };

  const handleChange = (e) => {
    const cleaned = cleanInput(e.target.value, type === "email");
    onChange(name, cleaned);
  };

  return (
    <div className="form-group" style={{ width: '100%' }}>
      <label className="muf-form-label">
        <span>{label}</span>
        {required && <span className="muf-required-asterisk">*</span>}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="muf-modern-input"
        autoComplete="off"
        style={{ width: '100%' }}
      />
    </div>
  );
};

const FormSelect = ({ label, icon: Icon, value, options, onChange, disabled, placeholder, loading }) => {
  const selectedName = options.find(opt => String(opt.id) === String(value))?.name;

  return (
    <div className="form-group" style={{ width: '100%' }}>
      <label className="muf-form-label">
        <span>{label}</span>
        <span className="muf-required-asterisk">*</span>
      </label>
      <Dropdown onSelect={(val) => onChange(val)}>
        <Dropdown.Toggle
          className="muf-modern-dropdown-toggle"
          disabled={disabled}
          id={`dropdown-${label}`}
          style={{ width: '100%' }}
        >
          <Icon className="muf-dropdown-icon" />
          <span className="muf-dropdown-toggle-text">
            {loading ? "Loading..." : (selectedName || placeholder)}
          </span>
        </Dropdown.Toggle>
        <Dropdown.Menu className="muf-modern-dropdown-menu" style={{ width: '100%' }}>
          {options.map(opt => (
            <Dropdown.Item
              key={opt.id}
              eventKey={opt.id}
              active={String(value) === String(opt.id)}
            >
              {opt.name}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

// --- Main Component ---

export default function MunicipalityUserForm({ onUserCreated, onCancel }) {
  const [formData, setFormData] = useState({
    username: "", email: "", password: "", confirmPassword: "",
    firstName: "", lastName: "", department: "", role: "",
  });
  
  const [data, setData] = useState({ departments: [], roles: [] });
  const [status, setStatus] = useState({ loading: false, error: "", success: "", loadingDepts: true, loadingRoles: false });
  const [showPwd, setShowPwd] = useState({ main: false, confirm: false });

  // Derived state for password strength
  const passwordStrength = useMemo(() => calculateStrength(formData.password), [formData.password]);

  // Initial Data Load
  useEffect(() => {
    let isMounted = true;
    getAllDepartments()
      .then(depts => {
        if (isMounted) {
          setData(prev => ({ ...prev, departments: depts }));
          setStatus(prev => ({ ...prev, loadingDepts: false }));
        }
      })
      .catch(err => {
        console.error("Failed to load departments", err);
        if (isMounted) setStatus(prev => ({ ...prev, loadingDepts: false }));
      });
    return () => { isMounted = false; };
  }, []);

  // Fetch Roles when Department changes
  useEffect(() => {
    if (!formData.department) {
      setData(prev => ({ ...prev, roles: [] }));
      return;
    }

    const fetchRoles = async () => {
      setStatus(prev => ({ ...prev, loadingRoles: true }));
      try {
        const deptId = parseInt(formData.department);
        let rolesList = await getRolesByDepartment(deptId);
        setData(prev => ({ ...prev, roles: rolesList }));
      } catch (err) {
        console.error("Role fetch error, fallback to all", err);
        try {
          const allRoles = await getAllRoles();
          setData(prev => ({ ...prev, roles: allRoles }));
        } catch (e) {
          setStatus(prev => ({ ...prev, error: "Failed to load roles." }));
        }
      } finally {
        setStatus(prev => ({ ...prev, loadingRoles: false }));
      }
    };

    fetchRoles();
  }, [formData.department]);

  // Handlers
  const updateField = useCallback((name, value) => {
    setFormData(prev => {
      // Se stiamo cambiando il dipartimento, resettiamo il ruolo
      if (name === 'department') {
        return { ...prev, department: value, role: "" };
      }
      
      // Per tutti gli altri campi (incluso 'role'), aggiorniamo normalmente
      return { ...prev, [name]: value };
    });
    
    if (status.error) setStatus(prev => ({ ...prev, error: "" }));
  }, [status.error]);

  const togglePwd = (field) => setShowPwd(prev => ({ ...prev, [field]: !prev[field] }));

  const validate = () => {
    if (!formData.firstName.trim()) return "Enter first name";
    if (!formData.lastName.trim()) return "Enter last name";
    if (!formData.username.trim()) return "Enter username";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return "Invalid email format";
    if (formData.password.length < 6) return "Password min 6 chars";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    if (!formData.department) return "Select a department";
    if (!formData.role) return "Select a role";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(prev => ({ ...prev, error: "", success: "" }));

    const errorMsg = validate();
    if (errorMsg) {
      setStatus(prev => ({ ...prev, error: errorMsg }));
      return;
    }

    setStatus(prev => ({ ...prev, loading: true }));

    try {
      const selectedDept = data.departments.find(d => String(d.id) === String(formData.department));
      const selectedRole = data.roles.find(r => String(r.id) === String(formData.role));

      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        department_name: selectedDept?.name || "",
        role_name: selectedRole?.name || "",
      };

      const newUser = await createMunicipalityUser(payload);
      
      setStatus(prev => ({ ...prev, success: `User "${newUser.username}" created!`, loading: false }));
      setFormData({ username: "", email: "", password: "", confirmPassword: "", firstName: "", lastName: "", department: "", role: "" });
      
      if (onUserCreated) onUserCreated(newUser);
      setTimeout(() => setStatus(prev => ({ ...prev, success: "" })), 5000);

    } catch (err) {
      console.error(err);
      setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      let errMsg = "Failed to create user.";
      if (err.status === 409) errMsg = "Username/Email already exists.";
      else if (err.status === 403) errMsg = "Permission denied.";
      
      setStatus(prev => ({ ...prev, error: errMsg, loading: false }));
    }
  };

  return (
    <div className="muf-user-form" style={{ width: '100%' }}>
      <div className="muf-form-glass-container">
        {/* Header */}
        <div className="muf-form-header">
          <div className="muf-header-icon"><FaUserPlus /></div>
          <h2 className="muf-form-title">Create new Municipality User</h2>
          <p className="muf-form-subtitle">Add a new user to the municipality management system</p>
        </div>

        {/* Alerts */}
        <div className="muf-alert-container">
          {status.error && (
            <Alert variant="danger" onClose={() => setStatus(p => ({...p, error: ""}))} dismissible className="muf-modern-alert">
              <div className="muf-alert-content"><FaTimes className="alert-icon" />{status.error}</div>
            </Alert>
          )}
          {status.success && (
            <Alert variant="success" onClose={() => setStatus(p => ({...p, success: ""}))} dismissible className="muf-modern-alert">
              <div className="muf-alert-content"><FaCheck className="alert-icon" />{status.success}</div>
            </Alert>
          )}
        </div>

        <form className="muf-modern-form" onSubmit={handleSubmit} noValidate>
          <div className="muf-form-cards-container">
            
            {/* Personal Info Card */}
            <div className="muf-form-card">
              <div className="muf-card-header">
                <div className="muf-card-icon"><FaUserPlus /></div>
                <div>
                  <h3 className="muf-card-title">Personal Information</h3>
                  <p className="muf-card-subtitle">Basic user details</p>
                </div>
              </div>
              <div className="muf-form-grid">
                <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={updateField} placeholder="Enter first name" disabled={status.loading} />
                <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={updateField} placeholder="Enter last name" disabled={status.loading} />
                <FormInput label="Username" name="username" value={formData.username} onChange={updateField} placeholder="Enter username" disabled={status.loading} />
                <FormInput label="Email Address" name="email" type="email" value={formData.email} onChange={updateField} placeholder="user@municipality.com" disabled={status.loading} />
              </div>
            </div>

            {/* Access & Role Card */}
            <div className="muf-form-card">
              <div className="muf-card-header">
                <div className="muf-card-icon"><FaShieldAlt /></div>
                <div>
                  <h3 className="muf-card-title">Access & Role</h3>
                  <p className="muf-card-subtitle">Security and permissions</p>
                </div>
              </div>
              <div className="muf-form-grid">
                <FormSelect 
                  label="Department" 
                  icon={FaBuilding} 
                  value={formData.department} 
                  options={data.departments} 
                  onChange={(val) => updateField('department', val)}
                  disabled={status.loading || status.loadingDepts}
                  loading={status.loadingDepts}
                  placeholder="Select department"
                />
                
                <FormSelect 
                  label="User Role" 
                  icon={FaShieldAlt} 
                  value={formData.role} 
                  options={data.roles} 
                  onChange={(val) => updateField('role', val)}
                  disabled={status.loading || status.loadingRoles || !formData.department}
                  loading={status.loadingRoles}
                  placeholder={!formData.department ? "Select department first" : "Select user role"}
                />

                {/* Password Field */}
                <div className="form-group" style={{ width: '100%' }}>
                  <label className="muf-form-label"><span>Password</span><span className="muf-required-asterisk">*</span></label>
                  <div className="muf-password-container">
                    <div className="muf-password-input-wrapper">
                      <input
                        type={showPwd.main ? "text" : "password"}
                        className="muf-modern-input muf-password-input"
                        placeholder="Create password (min. 6 chars)"
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        disabled={status.loading}
                        style={{ width: '100%' }}
                      />
                      <button type="button" className="muf-password-toggle-btn" onClick={() => togglePwd('main')} disabled={status.loading}>
                        {showPwd.main ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="muf-password-strength">
                        <div className="muf-strength-bar" style={{width: '100%'}}>
                          <div className="muf-strength-fill" style={{ width: `${(passwordStrength / 5) * 100}%`, backgroundColor: getStrengthColor(passwordStrength) }} />
                        </div>
                        <div className="muf-strength-labels"><span>Weak</span><span>Strong</span></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="form-group" style={{ width: '100%' }}>
                  <label className="muf-form-label"><span>Confirm Password</span><span className="muf-required-asterisk">*</span></label>
                  <div className="muf-password-input-wrapper">
                    <input
                      type={showPwd.confirm ? "text" : "password"}
                      className="muf-modern-input muf-password-input"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      disabled={status.loading}
                      style={{ width: '100%' }}
                    />
                    <button type="button" className="muf-password-toggle-btn" onClick={() => togglePwd('confirm')} disabled={status.loading}>
                      {showPwd.confirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {formData.password && formData.confirmPassword && (
                    <div className="muf-password-match">
                      {formData.password === formData.confirmPassword 
                        ? <span className="muf-match-success">✓ Passwords match</span>
                        : <span className="muf-match-error">✗ Passwords don't match</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="muf-form-actions">
            <button
              type="button"
              className="muf-modern-btn secondary"
              onClick={() => {
                setFormData({ username: "", email: "", password: "", confirmPassword: "", firstName: "", lastName: "", department: "", role: "" });
                setStatus(p => ({...p, error: "", success: ""}));
                if (onCancel) onCancel();
              }}
              disabled={status.loading}
            >
              <FaTimes /> Cancel
            </button>
            <button type="submit" className="muf-modern-btn primary" disabled={status.loading || status.loadingDepts || status.loadingRoles}>
              {status.loading ? <><div className="muf-loading-spinner"></div> Creating...</> : <><FaUserPlus /> Create User</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}