import { useState } from "react";
import { Alert, Card, Form, Button, Container, Row, Col, Spinner } from "react-bootstrap";
import { registerCitizen } from "../api/citizenApi";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaArrowLeft, FaIdCard } from "react-icons/fa";
import "../css/Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({
    firstName: false,
    lastName: false,
    email: false,
    username: false,
    password: false,
    confirmPassword: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.firstName.trim()) return setError("Please enter your first name");
    if (!formData.lastName.trim()) return setError("Please enter your last name");
    if (!formData.email.trim()) return setError("Please enter your email");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return setError("Please enter a valid email address");
    if (!formData.username.trim()) return setError("Please enter a username");
    if (formData.username.length < 3) return setError("Username must be at least 3 characters long");
    if (!formData.password.trim()) return setError("Please enter a password");
    if (formData.password.length < 6) return setError("Password must be at least 6 characters long");
    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match");

    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: "Citizen",
      };

      await registerCitizen(payload);
      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Registration failed:", err);
      setFormData(prev => ({ 
        ...prev, 
        password: "",
        confirmPassword: ""
      }));

      if (err.status === 409) {
        setError("Username or email already exists. Please try another.");
      } else if (err.status === 400) {
        setError(err.message || "Invalid registration data. Please check your input.");
      } else if (!navigator.onLine) {
        setError("No internet connection. Please check your network.");
      } else {
        setError(err.message || "Registration failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="register-page-container">
      <Row className="register-row">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <Card className="register-card">
            <Card.Body className="register-card-body">
              
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
              <div className="register-header">
                <div className="logo-container">
                  <img
                    src="/participium-logo.png"
                    alt="Participium Logo"
                    className="register-logo"
                  />
                </div>
                <h1 className="register-title">Join Participium</h1>
                <p className="register-subtitle">
                  Create your account
                </p>
              </div>

              {/* Alerts */}
              {error && (
                <Alert
                  variant="danger"
                  onClose={() => setError("")}
                  dismissible
                  className="register-alert animated-alert compact-alert"
                >
                  <div className="d-flex align-items-center">
                    <div className="alert-icon">⚠️</div>
                    <div className="alert-message compact-message">{error}</div>
                  </div>
                </Alert>
              )}

              {success && (
                <Alert
                  variant="success"
                  onClose={() => setSuccess("")}
                  dismissible
                  className="register-alert animated-alert compact-alert"
                >
                  <div className="d-flex align-items-center">
                    <div className="alert-icon">✅</div>
                    <div className="alert-message compact-message">{success}</div>
                  </div>
                </Alert>
              )}

              {/* Registration Form */}
              <Form onSubmit={handleRegister} noValidate className="register-form">
                <Row>
                  <Col xs={12} md={6}>
                    <Form.Group className="register-form-group floating-label-group">
                      <div className={`form-control-container ${isFocused.firstName || formData.firstName ? 'focused' : ''}`}>
                        <FaUser className="input-icon" />
                        <Form.Control
                          type="text"
                          placeholder={(isFocused.firstName ? '' : 'first name')}
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          onFocus={() => handleFocus('firstName')}
                          onBlur={() => handleBlur('firstName')}
                          disabled={loading}
                          className="register-input modern-input"
                        />
                        <Form.Label className="floating-label enhanced-label">
                          First Name
                        </Form.Label>
                      </div>
                    </Form.Group>
                  </Col>

                  <Col xs={12} md={6}>
                    <Form.Group className="register-form-group floating-label-group">
                      <div className={`form-control-container ${isFocused.lastName || formData.lastName ? 'focused' : ''}`}>
                        <FaUser className="input-icon" />
                        <Form.Control
                          type="text"
                          placeholder={(isFocused.lastName ? '' : 'last name')}
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          onFocus={() => handleFocus('lastName')}
                          onBlur={() => handleBlur('lastName')}
                          disabled={loading}
                          className="register-input modern-input"
                        />
                        <Form.Label className="floating-label enhanced-label">
                          Last Name
                        </Form.Label>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="register-form-group floating-label-group">
                  <div className={`form-control-container ${isFocused.email || formData.email ? 'focused' : ''}`}>
                    <FaEnvelope className="input-icon" />
                    <Form.Control
                      type="email"
                      placeholder={(isFocused.email ? '' : 'email')}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onFocus={() => handleFocus('email')}
                      onBlur={() => handleBlur('email')}
                      disabled={loading}
                      className="modern-input"
                    />
                    <Form.Label className="floating-label enhanced-label">
                      Email
                    </Form.Label>
                  </div>
                </Form.Group>

                <Form.Group className="register-form-group floating-label-group">
                  <div className={`form-control-container ${isFocused.username || formData.username ? 'focused' : ''}`}>
                    <FaIdCard className="input-icon" />
                    <Form.Control
                      type="text"
                      placeholder={(isFocused.username ? '' : 'username')}
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      onFocus={() => handleFocus('username')}
                      onBlur={() => handleBlur('username')}
                      disabled={loading}
                      className="modern-input"
                    />
                    <Form.Label className="floating-label enhanced-label">
                      Username
                    </Form.Label>
                  </div>
                </Form.Group>

                <Form.Group className="register-form-group floating-label-group">
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
                    <Form.Label className="floating-label enhanced-label">
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

                <Form.Group className="register-form-group floating-label-group">
                  <div className={`form-control-container ${isFocused.confirmPassword || formData.confirmPassword ? 'focused' : ''}`}>
                    <FaLock className="input-icon" />
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={(isFocused.confirmPassword ? '' : 'confirm password')}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onFocus={() => handleFocus('confirmPassword')}
                      onBlur={() => handleBlur('confirmPassword')}
                      disabled={loading}
                      className="modern-input password-input"
                    />
                    <Form.Label className="floating-label enhanced-label">
                      Confirm Password
                    </Form.Label>
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      className="password-toggle-btn"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </div>
                </Form.Group>

                {/* Register Button */}
                <button
                  type="submit"
                  className="btn btn-custom-primary register-btn register-btn-primary modern-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        animation="border"
                        size="sm"
                        className="me-2"
                      />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </Form>

              {/* Footer */}
              <div className="register-footer">
                <span className="register-footer-text">
                  Already have an account?{" "}
                </span>
                <Button
                  variant="link"
                  className="register-link-btn"
                  onClick={() => !loading && navigate("/login")}
                  disabled={loading}
                >
                  Sign in
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}