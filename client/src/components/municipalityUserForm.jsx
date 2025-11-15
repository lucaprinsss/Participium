import React, { useState, useEffect } from "react";
import { Alert } from "react-bootstrap";
import { createMunicipalityUser, getAllRoles } from "../api/municipalityUserApi";
import "../css/MunicipalityUserForm.css";
import { FaEye, FaEyeSlash, FaUserPlus, FaTimes, FaCheck, FaShieldAlt } from "react-icons/fa";

export default function MunicipalityUserForm({ onUserCreated, onCancel }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "",
  });
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        console.log("Fetching roles...");
        const rolesList = await getAllRoles();
        console.log("Roles fetched successfully:", rolesList);
        setRoles(rolesList);
      } catch (err) {
        console.error("Failed to fetch roles:", err);
        if (err.status === 403) {
          setError("You don't have permission to view roles. Please make sure you're logged in as an administrator.");
        } else if (err.status === 401) {
          setError("You are not authenticated. Please log in again.");
        } else {
          setError(`Failed to load roles: ${err.message}`);
        }
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const getPasswordStrengthColor = () => {
    const colors = ["#dc3545", "#ff6b35", "#ffa726", "#9ccc65", "#4caf50"];
    return colors[passwordStrength] || "#dc3545";
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.firstName.trim()) errors.push("Please enter the first name");
    if (!formData.lastName.trim()) errors.push("Please enter the last name");
    if (!formData.username.trim()) errors.push("Please enter a username");
    if (!formData.email.trim()) errors.push("Please enter an email");
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) errors.push("Please enter a valid email address");
    
    if (!formData.password.trim()) errors.push("Please enter a password");
    if (formData.password.length < 6) errors.push("Password must be at least 6 characters long");
    if (!formData.confirmPassword.trim()) errors.push("Please confirm your password");
    if (formData.password !== formData.confirmPassword) errors.push("Passwords do not match");
    if (!formData.role) errors.push("Please select a role");

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
      };

      const newUser = await createMunicipalityUser(payload);
      setSuccess(`User "${newUser.username}" created successfully!`);

      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        role: "",
      });

      if (onUserCreated) {
        onUserCreated(newUser);
      }

      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (err) {
      console.error("Failed to create user:", err);
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));

      if (err.status === 409) {
        setError("Username or email already exists. Please try another.");
      } else if (err.status === 403) {
        setError("You don't have permission to create users.");
      } else if (err.status === 400) {
        setError(err.message || "Invalid data. Please check your input.");
      } else if (!navigator.onLine) {
        setError("No internet connection. Please check your network.");
      } else {
        setError(err.message || "Failed to create user. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-user-form">
      <div className="form-glass-container">
        <div className="form-header">
          <div className="header-icon">
            <FaUserPlus />
          </div>
          <h2 className="form-title">
            Create New Municipality User
          </h2>
          <p className="form-subtitle">
            Add a new user to the municipality management system
          </p>
        </div>

        {(error || success) && (
          <div className="alert-container">
            {error && (
              <Alert variant="danger" onClose={() => setError("")} dismissible className="modern-alert">
                <div className="alert-content">
                  <FaTimes className="alert-icon" />
                  {error}
                </div>
              </Alert>
            )}
            {success && (
              <Alert variant="success" onClose={() => setSuccess("")} dismissible className="modern-alert">
                <div className="alert-content">
                  <FaCheck className="alert-icon" />
                  {success}
                </div>
              </Alert>
            )}
          </div>
        )}

        <form className="modern-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <span>First Name</span>
                <span className="required-asterisk">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
                className="modern-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Last Name</span>
                <span className="required-asterisk">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
                className="modern-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Username</span>
                <span className="required-asterisk">*</span>
              </label>
              <input
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                className="modern-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Email Address</span>
                <span className="required-asterisk">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="user@municipality.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="modern-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Password</span>
                <span className="required-asterisk">*</span>
              </label>
              <div className="password-container">
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create password (min. 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="modern-input password-input"
                  />
                  <button
                    type="button"
                    className="password-toggle modern-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill"
                        style={{
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor: getPasswordStrengthColor()
                        }}
                      />
                    </div>
                    <div className="strength-labels">
                      <span>Weak</span>
                      <span>Strong</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Confirm Password</span>
                <span className="required-asterisk">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  className="modern-input password-input"
                />
                <button
                  type="button"
                  className="password-toggle modern-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formData.password && formData.confirmPassword && (
                <div className="password-match">
                  {formData.password === formData.confirmPassword ? (
                    <span className="match-success">✓ Passwords match</span>
                  ) : (
                    <span className="match-error">✗ Passwords don't match</span>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>User Role</span>
                <span className="required-asterisk">*</span>
              </label>
              <div className="select-wrapper">
                <FaShieldAlt className="select-icon" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={loading || loadingRoles}
                  className="modern-select"
                >
                  <option value="">
                    {loadingRoles ? "Loading roles..." : "Select user role"}
                  </option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="modern-btn secondary"
              onClick={() => {
                setFormData({
                  username: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                  firstName: "",
                  lastName: "",
                  role: "",
                });
                setError("");
                setSuccess("");
                if (onCancel) onCancel();
              }}
              disabled={loading}
            >
              <FaTimes />
              Cancel
            </button>

            <button
              type="submit"
              className="modern-btn primary"
              disabled={loading || loadingRoles}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Creating User...
                </>
              ) : (
                <>
                  <FaUserPlus />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}