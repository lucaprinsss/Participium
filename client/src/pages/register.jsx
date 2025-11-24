import { useState } from "react";
import { Alert, Card, Form, Button, Container, Row, Col, Spinner } from "react-bootstrap";
import { registerCitizen } from "../api/citizenApi";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaArrowLeft, FaIdCard } from "react-icons/fa";
// Assicurati che questo import punti al file CSS aggiornato
import "../css/Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", username: "", password: "", confirmPassword: ""
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  const trimValue = (value) => typeof value === 'string' ? value.trim() : value;
  const removeAllSpaces = (value) => typeof value === 'string' ? value.replace(/\s/g, '') : value;

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthColor = () => {
    const colors = ["#dc3545", "#ff6b35", "#ffa726", "#9ccc65", "#4caf50"];
    return colors[passwordStrength] || "#dc3545";
  };

  const handleInputChange = (field, value) => {
    let cleanedValue = value;
    
    if (field === "email") {
      cleanedValue = removeAllSpaces(value).toLowerCase();
    } else if (["firstName", "lastName", "username"].includes(field)) {
      cleanedValue = trimValue(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: cleanedValue }));
    
    if (field === "password") {
      setPasswordStrength(calculatePasswordStrength(cleanedValue));
    }

    if (error) setError("");
  };

  const handleBlur = (field) => {
    const currentValue = formData[field];
    let cleanedValue = currentValue;
    
    if (typeof currentValue === 'string') {
      if (field === "email") {
        cleanedValue = removeAllSpaces(currentValue).toLowerCase();
      } else if (["firstName", "lastName", "username"].includes(field)) {
        cleanedValue = trimValue(currentValue);
      }
      
      if (cleanedValue !== currentValue) {
        setFormData(prev => ({ ...prev, [field]: cleanedValue }));
      }
    }
    
    setFocusedField("");
  };

  const handleKeyDown = (e, field) => {
    if (field === "email" && e.key === " ") {
      e.preventDefault();
    }
  };

  const handlePaste = (e, field) => {
    if (field === "email") {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const cleanedText = removeAllSpaces(pastedText).toLowerCase();
      
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      const newValue = formData.email.substring(0, start) + cleanedText + formData.email.substring(end);
      
      setFormData(prev => ({ ...prev, email: newValue }));
      
      setTimeout(() => {
        target.setSelectionRange(start + cleanedText.length, start + cleanedText.length);
      }, 0);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanedFormData = {
      firstName: trimValue(formData.firstName),
      lastName: trimValue(formData.lastName),
      email: removeAllSpaces(formData.email).toLowerCase(),
      username: trimValue(formData.username),
      password: formData.password,
      confirmPassword: formData.confirmPassword
    };

    setFormData(cleanedFormData);

    if (!cleanedFormData.firstName) return setError("Please enter your first name");
    if (!cleanedFormData.lastName) return setError("Please enter your last name");
    if (!cleanedFormData.email) return setError("Please enter your email");
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanedFormData.email)) return setError("Please enter a valid email address");
    if (/[A-Z]/.test(cleanedFormData.email)) return setError("Email must not contain uppercase letters");
    
    if (!cleanedFormData.username) return setError("Please enter a username");
    if (cleanedFormData.username.length < 3) return setError("Username must be at least 3 characters long");
    
    if (!cleanedFormData.password) return setError("Please enter a password");
    if (cleanedFormData.password.length < 6) return setError("Password must be at least 6 characters long");
    if (cleanedFormData.password !== cleanedFormData.confirmPassword) return setError("Passwords do not match");

    setLoading(true);

    try {
      const payload = {
        username: cleanedFormData.username,
        email: cleanedFormData.email,
        password: cleanedFormData.password,
        first_name: cleanedFormData.firstName,
        last_name: cleanedFormData.lastName,
        role: "Citizen",
      };

      await registerCitizen(payload);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Registration failed:", err);
      setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      setPasswordStrength(0); // Reset strength on error

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

  const isFieldActive = (field) => focusedField === field || formData[field];

  return (
    <Container fluid className="reg-page-container">
      <Row className="reg-row">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <Card className="reg-card">
            <Card.Body className="reg-card-body">
              
              <Button
                variant="link"
                className="reg-back-btn"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                <FaArrowLeft className="me-2" />
                Back to Main
              </Button>

              <div className="reg-header">
                <div className="reg-logo-container">
                  <img
                    src="/participium-logo.png"
                    alt="Participium Logo"
                    className="reg-logo"
                  />
                </div>
                <h1 className="reg-title">Join Participium</h1>
                <p className="reg-subtitle">Create your account</p>
              </div>

              {error && (
                <Alert variant="danger" dismissible onClose={() => setError("")} className="reg-alert">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess("")} className="reg-alert">
                  {success}
                </Alert>
              )}

              <Form onSubmit={handleRegister} noValidate className="reg-form">
                <Row>
                  {["firstName", "lastName"].map(field => (
                    <Col xs={12} md={6} key={field}>
                      <Form.Group className="reg-form-group">
                        <div className={`reg-form-control-container ${isFieldActive(field) ? 'focused' : ''}`}>
                          <FaUser className="reg-input-icon" />
                          <Form.Control
                            type="text"
                            placeholder={isFieldActive(field) ? '' : field === "firstName" ? "first name" : "last name"}
                            value={formData[field]}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            onFocus={() => setFocusedField(field)}
                            onBlur={() => handleBlur(field)}
                            disabled={loading}
                            className="reg-modern-input"
                          />
                          <Form.Label className="reg-floating-label">
                            {field === "firstName" ? "First Name" : "Last Name"}
                          </Form.Label>
                        </div>
                      </Form.Group>
                    </Col>
                  ))}
                </Row>

                {["email", "username"].map(field => (
                  <Form.Group className="reg-form-group" key={field}>
                    <div className={`reg-form-control-container ${isFieldActive(field) ? 'focused' : ''}`}>
                      {field === "email" ? <FaEnvelope className="reg-input-icon" /> : <FaIdCard className="reg-input-icon" />}
                      <Form.Control
                        type={field === "email" ? "email" : "text"}
                        placeholder={isFieldActive(field) ? '' : field}
                        value={formData[field]}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        onFocus={() => setFocusedField(field)}
                        onBlur={() => handleBlur(field)}
                        onKeyDown={(e) => field === "email" && handleKeyDown(e, field)}
                        onPaste={(e) => field === "email" && handlePaste(e, field)}
                        disabled={loading}
                        className="reg-modern-input"
                      />
                      <Form.Label className="reg-floating-label">
                        {field === "email" ? "Email" : "Username"}
                      </Form.Label>
                    </div>
                  </Form.Group>
                ))}

                {["password", "confirmPassword"].map(field => (
                  <Form.Group className="reg-form-group" key={field}>
                    <div className={`reg-form-control-container ${isFieldActive(field) ? 'focused' : ''}`}>
                      <FaLock className="reg-input-icon" />
                      <Form.Control
                        type={field === "password" ? (showPassword ? "text" : "password") : (showConfirmPassword ? "text" : "password")}
                        placeholder={isFieldActive(field) ? '' : field === "password" ? "password" : "confirm password"}
                        value={formData[field]}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        onFocus={() => setFocusedField(field)}
                        onBlur={() => handleBlur(field)}
                        disabled={loading}
                        className="reg-modern-input reg-password-input"
                      />
                      <Form.Label className="reg-floating-label">
                        {field === "password" ? "Password" : "Confirm Password"}
                      </Form.Label>
                      <Button
                        variant="outline-secondary"
                        onClick={() => field === "password" ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                        className="reg-password-toggle-btn"
                      >
                        {field === "password" ? (showPassword ? <FaEyeSlash /> : <FaEye />) : (showConfirmPassword ? <FaEyeSlash /> : <FaEye />)}
                      </Button>
                    </div>
                    {/* PASSWORD STRENGTH METER INSERTION */}
                    {field === "password" && formData.password && (
                      <div className="reg-password-strength">
                        <div className="reg-strength-bar">
                          <div
                            className="reg-strength-fill"
                            style={{
                              width: `${(passwordStrength / 5) * 100}%`,
                              backgroundColor: getPasswordStrengthColor()
                            }}
                          />
                        </div>
                        <div className="reg-strength-labels">
                          <span>Weak</span>
                          <span>Strong</span>
                        </div>
                      </div>
                    )}
                  </Form.Group>
                ))}

                <button
                  type="submit"
                  className="btn reg-btn-custom-primary reg-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </Form>

              <div className="reg-footer">
                <span className="reg-footer-text">Already have an account? </span>
                <Button
                  variant="link"
                  className="reg-link-btn"
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