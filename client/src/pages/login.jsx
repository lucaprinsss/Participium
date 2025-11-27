import { useState, useEffect } from "react";
import { Alert, Card, Form, Button, Container, Row, Col, Spinner } from "react-bootstrap";
import { login } from "../api/authApi";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaLock, FaArrowLeft } from "react-icons/fa";
import "../css/Login.css";

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation(); // Hook to read navigation state (incoming errors)
  
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

  // EFFECT: Check if there are errors passed on page load
  // (e.g. redirect from an axios interceptor or another page for server error)
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
      // Clear history state to avoid showing error if user refreshes the page
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Hide error as soon as user starts typing to correct
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

    const trimmedUsername = formData.username.trim();

    // Update UI if necessary
    if (trimmedUsername !== formData.username) {
      setFormData(prev => ({ ...prev, username: trimmedUsername }));
    }

    // Client-side Validation
    if (!trimmedUsername) {
      setError("Please enter your username.");
      return;
    }
    if (!formData.password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const userData = await login(trimmedUsername, formData.password);

      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }

      navigate("/home");
    } catch (err) {
      console.error("Login failed:", err);
      
      // Reset password on error for security
      setFormData(prev => ({ ...prev, password: "" }));

      // ADVANCED ERROR HANDLING
      // Priority: Status Code -> Network Message -> Generic Message
      
      if (!err.status && (err.message === "Failed to fetch" || err.message.includes("Network"))) {
        // Specific case: Server is down or unreachable (Loading/connection error)
        setError("Unable to contact the server. Check your connection or try again later.");
      } else if (err.status === 401) {
        setError("Invalid username or password.");
      } else if (err.status === 400) {
        setError("Missing or invalid data. Check the fields.");
      } else if (err.status === 403) {
        setError("Account temporarily blocked or inactive.");
      } else if (err.status >= 500) {
        // Internal server errors shown as form errors
        setError("Internal server error.");
      } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setError("No internet connection detected.");
      } else {
        // Fallback to error message or generic message
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="log-page-container">
      <Row className="log-row">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card className="log-card">
            <Card.Body className="log-card-body">
              
              {/* Back Button */}
              <Button
                variant="link"
                className="log-back-btn"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                <FaArrowLeft className="me-2" />
                Back to Home
              </Button>

              {/* Header */}
              <div className="log-header">
                <div className="log-logo-container">
                  <img
                    src="/participium-logo.png"
                    alt="Participium Logo"
                    className="log-logo"
                  />
                </div>
                <h1 className="log-title">Welcome Back</h1>
                <p className="log-subtitle">
                  Sign in to your account
                </p>
              </div>

              {/* Error Alert - Now also shows server and loading errors */}
              {error && (
                <Alert
                  variant="danger"
                  onClose={() => setError("")}
                  dismissible
                  className="log-alert log-animated-alert"
                >
                  <div className="d-flex align-items-center">
                    <div className="log-alert-message"> {error} </div>
                  </div>
                </Alert>
              )}

              {/* Login Form */}
              <Form onSubmit={handleLogin} noValidate className="log-form">
                {/* Username Field */}
                <Form.Group className="log-form-group log-floating-label-group">
                  <div className={`log-form-control-container ${isFocused.username || formData.username ? 'focused' : ''}`}>
                    <FaUser className="log-input-icon" />
                    <Form.Control
                      type="text"
                      placeholder={(isFocused.username ? '' : 'username')}
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      onFocus={() => handleFocus('username')}
                      onBlur={() => handleBlur('username')}
                      disabled={loading}
                      className="log-modern-input"
                    />
                    <Form.Label className="log-floating-label">
                      Username
                    </Form.Label>
                  </div>
                </Form.Group>

                {/* Password Field */}
                <Form.Group className="log-form-group log-floating-label-group">
                  <div className={`log-form-control-container ${isFocused.password || formData.password ? 'focused' : ''}`}>
                    <FaLock className="log-input-icon" />
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      placeholder={(isFocused.password ? '' : 'password')}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      onFocus={() => handleFocus('password')}
                      onBlur={() => handleBlur('password')}
                      disabled={loading}
                      className="log-modern-input log-password-input"
                    />
                    <Form.Label className="log-floating-label">
                      Password
                    </Form.Label>
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="log-password-toggle-btn"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </div>
                </Form.Group>

                {/* Login Button */}
                <button
                  type="submit"
                  className="btn log-btn-custom-primary log-btn log-btn-primary log-modern-btn"
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
                    "Sign In"
                  )}
                </button>
              </Form>

              {/* Footer */}
              <div className="log-footer">
                <span className="log-footer-text">
                  Don't have an account?{" "}
                </span>
                <Button
                  variant="link"
                  className="log-link-btn"
                  onClick={() => !loading && navigate("/register")}
                  disabled={loading}
                >
                  Sign Up
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}