import React, { useState, useEffect } from "react";
import { Alert, Card } from "react-bootstrap";
import { createMunicipalityUser, getAllRoles } from "../api/municipalityUserApi";
import "../css/MunicipalityUserForm.css";

export default function MunicipalityUserForm({ onUserCreated, onCancel }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "",
  });
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Fetch available roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        console.log("Fetching roles...");
        const rolesList = await getAllRoles();
        console.log("Roles fetched successfully:", rolesList);
        // Backend returns array of role strings
        setRoles(rolesList);
      } catch (err) {
        console.error("Failed to fetch roles:", err);
        console.error("Error status:", err.status);
        console.error("Error message:", err.message);
        
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    if (!formData.firstName.trim()) {
      setError("Please enter the first name");
      return;
    }
    if (!formData.lastName.trim()) {
      setError("Please enter the last name");
      return;
    }
    if (!formData.username.trim()) {
      setError("Please enter a username");
      return;
    }
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter an email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!formData.password.trim()) {
      setError("Please enter a password");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (!formData.role) {
      setError("Please select a role");
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

      // Reset form
      setFormData({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "",
      });

      // Notify parent component
      if (onUserCreated) {
        onUserCreated(newUser); 
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (err) {
      console.error("Failed to create user:", err);

      // Clear password on error
      setFormData((prev) => ({ ...prev, password: "" }));

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
    <Card className="municipality-user-form-card">
      
      <Card.Body>
        <h3 className="muf-title">Add New Municipality User</h3>

        <div className="alert-container">
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
        </div>

        <form onSubmit={handleSubmit} className="muf-form">

          <div className="name-row">
            <div className="muf-field">
              <label className="muf-label">First Name *</label>
              <input
                type="text"
                name="firstName"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
            <div className="muf-field">
              <label className="muf-label">Last Name *</label>
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="muf-field">
            <label className="muf-label">Username *</label>
            <input
              type="text"
              name="username"
              placeholder="Username (min. 3 characters)"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="muf-field">
            <label className="muf-label">Email *</label>
            <input
              type="email"
              name="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="muf-field">
            <label className="muf-label">Password *</label>
            <input
              type="password"
              name="password"
              placeholder="Password (min. 6 characters)"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="muf-field">
            <label className="muf-label">Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading || loadingRoles}
              required
              className="muf-select"
            >
              <option value="">
                {loadingRoles ? "Loading roles..." : "Select a role"}
              </option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="muf-actions">
            
            <button
              type="button" 
              className="muf-cancel-btn"
              onClick={onCancel}
              disabled={loading} 
            >
              Cancel
            </button>
            
            <button 
              type="submit" 
              disabled={loading || loadingRoles} 
              className="muf-submit-btn"
            >
              {loading ? "Creating user..." : "Create User"}
            </button>
            
          </div>
        </form>
      </Card.Body>
    </Card>
  );
}