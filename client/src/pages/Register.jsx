import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Alert, Card, Form, Button, Container, Row, Col, Spinner } from "react-bootstrap";
import { registerCitizen } from "../api/citizenApi";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaArrowLeft, FaIdCard } from "react-icons/fa";
import OtpVerification from "../components/OtpVerification";
import "../css/Register.css";

// --- Componente Toggle Password (invariato) ---
const PasswordToggleButton = ({
  field,
  showPassword,
  showConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
  loading
}) => {
  const isPasswordField = field === "password";
  const isConfirmPasswordField = field === "confirmPassword";

  let iconToShow;
  if (isPasswordField) {
    iconToShow = showPassword ? <FaEyeSlash /> : <FaEye />;
  } else if (isConfirmPasswordField) {
    iconToShow = showConfirmPassword ? <FaEyeSlash /> : <FaEye />;
  }

  const handleClick = () => {
    if (isPasswordField) setShowPassword(!showPassword);
    else if (isConfirmPasswordField) setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Button
      variant="outline-secondary"
      onClick={handleClick}
      disabled={loading}
      className="reg-password-toggle-btn"
    >
      {iconToShow}
    </Button>
  );
};

PasswordToggleButton.propTypes = {
  field: PropTypes.string.isRequired,
  showPassword: PropTypes.bool.isRequired,
  showConfirmPassword: PropTypes.bool.isRequired,
  setShowPassword: PropTypes.func.isRequired,
  setShowConfirmPassword: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATO ---
  // Step 1: Registrazione, Step 2: Verifica OTP (delegato a componente)
  const [step, setStep] = useState(1);

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

  // EFFECT: Check errors from navigation
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // --- UTILS ---
  const trimValue = (value) => typeof value === 'string' ? value.trim() : value;
  const removeAllSpaces = (value) => typeof value === 'string' ? value.replaceAll(' ', '') : value;

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthColor = () => {
    const colors = ["#dc3545", "#ff6b35", "#ffa726", "#9ccc65", "#4caf50"];
    return colors[passwordStrength] || "#dc3545";
  };

  const handleApiError = (err) => {
    if (!err.status && (err.message === "Failed to fetch" || err.message.includes("Network"))) {
      setError("Unable to contact the server. Check your connection.");
    } else if (err.status === 409) {
      setError("Username or email already exists.");
    } else if (err.status >= 500) {
      setError("Internal server error.");
    } else {
      setError(err.message || "Operation failed. Please try again.");
    }
  };

  // --- HANDLERS FORM STEP 1 ---
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
      if (field === "email") cleanedValue = removeAllSpaces(currentValue).toLowerCase();
      else if (["firstName", "lastName", "username"].includes(field)) cleanedValue = trimValue(currentValue);
      
      if (cleanedValue !== currentValue) {
        setFormData(prev => ({ ...prev, [field]: cleanedValue }));
      }
    }
    setFocusedField("");
  };

  const handleKeyDown = (e, field) => {
    if (field === "email" && e.key === " ") e.preventDefault();
  };

  const handlePaste = (e, field) => {
    if (field === "email") {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const cleanedText = pastedText.replaceAll(' ', '').toLowerCase();
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

  // HANDLER REGISTRAZIONE (STEP 1)
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

    // Validazione
    if (!cleanedFormData.firstName) return setError("Please enter your first name");
    if (!cleanedFormData.lastName) return setError("Please enter your last name");
    if (!cleanedFormData.email) return setError("Please enter your email");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanedFormData.email)) return setError("Please enter a valid email address");
    if (/[A-Z]/.test(cleanedFormData.email)) return setError("Email must not contain uppercase letters");
    if (!cleanedFormData.username) return setError("Please choose a username");
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
      setSuccess("Registration started! Please check your email for the OTP code.");

      setTimeout(() => {
        setSuccess(""); 
        setStep(2);
        setLoading(false);
      }, 1500);

    } catch (err) {
      console.error("Registration failed:", err);
      handleApiError(err);
      setLoading(false);
    }
  };

  // UI HELPERS
  const isFieldActive = (field) => focusedField === field || formData[field];
  
  const backButtonText = step === 2 ? "Back to Details" : "Back to Home";
  const headerTitle = step === 1 ? "Join Participium" : "Verify Account";
  const headerSubtitle = step === 1 ? "Create your account" : `Code sent to ${formData.email}`;

  const getFieldName = (field) => (field === "firstName" ? "First Name" : "Last Name");

  const getFieldPlaceholder = (field) => {
    if (isFieldActive(field)) return "";
    return field === "firstName" ? "first name" : "last name";
  };

  const getFieldIcon = (field) =>
    field === "email" ? (
      <FaEnvelope className="reg-input-icon" />
    ) : (
      <FaIdCard className="reg-input-icon" />
    );

  const getPasswordFieldType = (field) => {
    if (field === "password") {
      return showPassword ? "text" : "password";
    }
    return showConfirmPassword ? "text" : "password";
  };

  const getPasswordPlaceholder = (field) => {
    if (isFieldActive(field)) return "";
    return field === "password" ? "password" : "confirm password";
  };

  return (
    <Container fluid className="reg-page-container">
      <Row className="reg-row">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <Card className="reg-card">
            <Card.Body className="reg-card-body">

              <Button
                variant="link"
                className="reg-back-btn"
                onClick={() => step === 2 ? setStep(1) : navigate("/")}
                disabled={loading}
              >
                <FaArrowLeft className="me-2" />
                {backButtonText}
              </Button>

              <div className="reg-header">
                <div className="reg-logo-container">
                  <img src="/participium-logo.png" alt="Participium Logo" className="reg-logo" />
                </div>
                <h1 className="reg-title">{headerTitle}</h1>
                <p className="reg-subtitle">{headerSubtitle}</p>
              </div>

              {/* Messaggi di errore/successo globali (Step 1) */}
              {step === 1 && error && (
                <Alert variant="danger" dismissible onClose={() => setError("")} className="reg-alert">
                  {error}
                </Alert>
              )}
              {step === 1 && success && (
                <Alert variant="success" dismissible onClose={() => setSuccess("")} className="reg-alert">
                  {success}
                </Alert>
              )}

              {/* --- STEP 1: REGISTRATION FORM --- */}
              {step === 1 && (
                <Form onSubmit={handleRegister} noValidate className="reg-form">
                  <Row>
                    {["firstName", "lastName"].map(field => (
                      <Col xs={12} md={6} key={field}>
                        <Form.Group className="reg-form-group">
                          <div className={`reg-form-control-container ${isFieldActive(field) ? 'focused' : ''}`}>
                            <FaUser className="reg-input-icon" />
                            <Form.Control
                              type="text"
                              placeholder={getFieldPlaceholder(field)}
                              value={formData[field]}
                              onChange={(e) => handleInputChange(field, e.target.value)}
                              onFocus={() => setFocusedField(field)}
                              onBlur={() => handleBlur(field)}
                              disabled={loading}
                              className="reg-modern-input"
                            />
                            <Form.Label className="reg-floating-label">
                              {getFieldName(field)}
                            </Form.Label>
                          </div>
                        </Form.Group>
                      </Col>
                    ))}
                  </Row>

                  {["email", "username"].map(field => (
                    <Form.Group className="reg-form-group" key={field}>
                      <div className={`reg-form-control-container ${isFieldActive(field) ? 'focused' : ''}`}>
                        {getFieldIcon(field)}
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
                          type={getPasswordFieldType(field)}
                          placeholder={getPasswordPlaceholder(field)}
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
                        <PasswordToggleButton
                          field={field}
                          showPassword={showPassword}
                          showConfirmPassword={showConfirmPassword}
                          setShowPassword={setShowPassword}
                          setShowConfirmPassword={setShowConfirmPassword}
                          loading={loading}
                        />
                      </div>
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

                  <button type="submit" className="btn reg-btn-custom-primary reg-btn" disabled={loading}>
                    {loading ? <><Spinner animation="border" size="sm" className="me-2" /> Sending...</> : "Create Account"}
                  </button>
                </Form>
              )}

              {/* --- STEP 2: OTP VERIFICATION COMPONENT --- */}
              {step === 2 && (
                <OtpVerification 
                  username={formData.username} 
                />
              )}

              <div className="reg-footer">
                <span className="reg-footer-text">Already have an account? </span>
                <Button
                  variant="link"
                  className="reg-link-btn"
                  onClick={() => !loading && navigate("/login")}
                  disabled={loading}
                >
                  Sign In
                </Button>
              </div>

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}