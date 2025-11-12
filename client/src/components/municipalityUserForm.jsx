import React, { useState, useEffect } from "react";
import { Alert, Card, Form, Button, Row, Col } from "react-bootstrap";
import { createMunicipalityUser, getAllRoles } from "../api/municipalityUserApi";

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
    if (!formData.confirmPassword.trim()) {
      setError("Please confirm your password");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
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
        confirmPassword: "",
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

      // Clear passwords on error
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
    <Card 
      className="shadow-lg" 
      style={{ 
        borderRadius: 'var(--radius-xl)',
        border: 'none'
      }}
    >
      <Card.Body className="p-5">
        <h3 
          style={{ 
            color: 'var(--primary)',
            fontWeight: 'var(--font-bold)',
            fontSize: 'var(--font-xxl)',
            marginBottom: 'var(--spacing-lg)'
          }}
        >
          Add New Municipality User
        </h3>

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

        <Form onSubmit={handleSubmit}>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontWeight: 'var(--font-medium)' }}>
                  First Name *
                </Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  size="lg"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontWeight: 'var(--font-medium)' }}>
                  Last Name *
                </Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  size="lg"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-4">
            <Form.Label style={{ fontWeight: 'var(--font-medium)' }}>
              Username *
            </Form.Label>
            <Form.Control
              type="text"
              name="username"
              placeholder="Username (min. 3 characters)"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              required
              size="lg"
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label style={{ fontWeight: 'var(--font-medium)' }}>
              Email *
            </Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
              size="lg"
            />
          </Form.Group>

          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontWeight: 'var(--font-medium)' }}>
                  Password *
                </Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Password (min. 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  size="lg"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontWeight: 'var(--font-medium)' }}>
                  Confirm Password *
                </Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  size="lg"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-4">
            <Form.Label style={{ fontWeight: 'var(--font-medium)' }}>
              Role *
            </Form.Label>
            <Form.Select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading || loadingRoles}
              required
              size="lg"
            >
              <option value="">
                {loadingRoles ? "Loading roles..." : "Select a role"}
              </option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <div className="d-flex gap-3 justify-content-end mt-4">
            <Button
              type="button" 
              variant="danger"
              size="lg"
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
                if (onCancel) {
                  onCancel();
                }
              }}
              disabled={loading}
              style={{
                fontWeight: 'var(--font-medium)',
                padding: '0.75rem 2rem'
              }}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              variant="primary"
              size="lg"
              disabled={loading || loadingRoles}
              style={{
                fontWeight: 'var(--font-semibold)',
                padding: '0.75rem 2rem'
              }}
            >
              {loading ? "Creating user..." : "Create User"}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}