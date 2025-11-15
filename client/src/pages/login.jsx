import React, { useState } from "react";
import { Alert, Card, Form, Button, Container, Row, Col, InputGroup, Spinner } from "react-bootstrap";
import { login } from "../api/authApi"; 
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaLock, FaArrowLeft } from "react-icons/fa";
import "../css/Login.css";

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({
    username: false,
    password: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleFocus = (field) => {
    setIsFocused(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const handleBlur = (field) => {
    setIsFocused(prev => ({
      ...prev,
      [field]: false
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Enhanced client-side validation
    if (!formData.username.trim()) {
      setError("Please enter your username");
      return;
    }
    if (!formData.password.trim()) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);

    try {
      const userData = await login(formData.username, formData.password);

      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }

      navigate("/home");
    } catch (err) {
      console.error("Login failed:", err);

      // Clear password field on error
      setFormData(prev => ({ ...prev, password: "" }));

      // Enhanced error handling
      if (err.status === 401) {
        setError("Invalid username or password. Please try again.");
      } else if (err.status === 400) {
        setError("Invalid request. Please check your input.");
      } else if (err.status === 403) {
        setError("Account temporarily locked. Please try again later.");
      } else if (err.status >= 500) {
        setError("Server error. Please try again later.");
      } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setError("No internet connection. Please check your network.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="login-page-container">
      <Row className="login-row">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card className="login-card">
            <Card.Body className="login-card-body">
              
              {/* Back Button */}
              <Button
                variant="link"
                className="back-btn"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                <FaArrowLeft className="me-2" />
                Back to Main
              </Button>

              {/* Header */}
              <div className="login-header">
                <div className="logo-container">
                  <img
                    src="/participium-logo.png"
                    alt="Participium Logo"
                    className="login-logo"
                  />
                </div>
                <h1 className="login-title">Welcome Back</h1>
                <p className="login-subtitle">
                  Sign in to your account
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert
                  variant="danger"
                  onClose={() => setError("")}
                  dismissible
                  className="login-alert animated-alert"
                >
                  <div className="d-flex align-items-center">
                    <div className="alert-message">{error}</div>
                  </div>
                </Alert>
              )}

              {/* Login Form */}
              <Form onSubmit={handleLogin} noValidate className="login-form">
                {/* Username Field */}
                <Form.Group className="login-form-group floating-label-group">
                  <div className={`form-control-container ${isFocused.username || formData.username ? 'focused' : ''}`}>
                    <FaUser className="input-icon" />
                    <Form.Control
                      type="text"
                      placeholder={(isFocused.username ? '' : 'username')}
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      onFocus={() => handleFocus('username')}
                      onBlur={() => handleBlur('username')}
                      disabled={loading}
                      className="login-input modern-input"
                    />
                    <Form.Label className="floating-label">
                      Username
                    </Form.Label>
                  </div>
                </Form.Group>

                {/* Password Field */}
                <Form.Group className="login-form-group floating-label-group">
                  <div className={`form-control-container ${isFocused.password || formData.password ? 'focused' : ''}`}>
                    <FaLock className="input-icon" />
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      placeholder={(isFocused.password ? '' : 'password')}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      onFocus={() => handleFocus('password')}
                      onBlur={() => handleBlur('password')}
                      disabled={loading}
                      className="modern-input password-input"
                    />
                    <Form.Label className="floating-label">
                      Password
                    </Form.Label>
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="password-toggle-btn"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </div>
                </Form.Group>

                {/* Login Button */}
                <button
                  type="submit"
                  className="btn btn-custom-primary login-btn login-btn-primary modern-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        animation="border"
                        size="sm"
                        className="me-2"
                      />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </Form>

              {/* Footer */}
              <div className="login-footer">
                <span className="login-footer-text">
                  Don't have an account?{" "}
                </span>
                <Button
                  variant="link"
                  className="login-link-btn"
                  onClick={() => !loading && navigate("/register")}
                  disabled={loading}
                >
                  Create one
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}