import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Alert, Card, Form, Button, Container, Row, Col, Spinner } from "react-bootstrap";
import { login } from "../api/authApi";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaLock, FaArrowLeft } from "react-icons/fa";
import OtpVerification from "../components/OtpVerification"; // Assicurati che il percorso sia corretto
import "../css/Login.css";

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATO ---
  const [formData, setFormData] = useState({
    username: "", // Questo campo funge anche da email in molti sistemi, oppure usa email separata se necessario
    password: ""
  });
  
  // Stato per gestire la visualizzazione: 'login' oppure 'verification'
  const [viewState, setViewState] = useState('login'); 

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Flag specifico per mostrare il pulsante di azione nell'errore
  const [isUnverifiedError, setIsUnverifiedError] = useState(false);

  const [isFocused, setIsFocused] = useState({
    username: false,
    password: false
  });

  // --- EFFECT: Gestione errori in ingresso ---
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // --- HANDLERS UI ---
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) {
      setError("");
      setIsUnverifiedError(false);
    }
  };

  const handleFocus = (field) => setIsFocused(prev => ({ ...prev, [field]: true }));
  const handleBlur = (field) => setIsFocused(prev => ({ ...prev, [field]: false }));

  // --- LOGICA LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsUnverifiedError(false);

    const trimmedUsername = formData.username.trim();

    if (trimmedUsername !== formData.username) {
      setFormData(prev => ({ ...prev, username: trimmedUsername }));
    }

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

      localStorage.setItem("isLoggedIn", "true");
      if (onLoginSuccess) onLoginSuccess(userData);
      navigate("/home");

    } catch (err) {
      console.error("Login failed:", err);
      setFormData(prev => ({ ...prev, password: "" }));

      const serverMessage = err.data?.error || err.data?.message || err.message || "";
      
      // Controllo se l'errore riguarda la verifica dell'account
      // Nota: Adatta queste stringhe in base a cosa risponde ESATTAMENTE il backend (es. status 403)
      const isUnverified = 
        err.status === 403 || 
        serverMessage.toLowerCase().includes("verified") || 
        serverMessage.toLowerCase().includes("active");

      if (isUnverified) {
        setError("Account not verified. Please complete the verification process.");
        setIsUnverifiedError(true);
      } else if (!err.status && (serverMessage === "Failed to fetch" || serverMessage.includes("Network"))) {
        setError("Unable to contact the server. Check your connection.");
      } else if (serverMessage && serverMessage !== "Failed to fetch") {
        setError(serverMessage);
      } else if (err.status === 401) {
        setError("Invalid username or password.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- LOGICA PASSAGGIO A VERIFICA ---
  const handleSwitchToVerification = async () => {
    // Prima di cambiare vista, inviamo il codice (opzionale, o possiamo lasciare che lo faccia l'utente nella view successiva)
    // Per UX fluida, andiamo alla view e l'utente può cliccare "Resend" se non ha il codice.
    setViewState('verification');
    setError("");
  };

  return (
    <Container fluid className="log-page-container">
      <Row className="log-row">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card className="log-card">
            <Card.Body className="log-card-body">

              {/* Back Button (Gestito in base alla vista) */}
              <Button
                variant="link"
                className="log-back-btn"
                onClick={() => viewState === 'verification' ? setViewState('login') : navigate("/")}
                disabled={loading}
              >
                <FaArrowLeft className="me-2" />
                {viewState === 'verification' ? "Back to Login" : "Back to Home"}
              </Button>

              {/* Header */}
              <div className="log-header">
                <div className="log-logo-container">
                  <img src="/participium-logo.png" alt="Logo" className="log-logo" />
                </div>
                <h1 className="log-title">
                  {viewState === 'verification' ? "Verify Account" : "Welcome Back"}
                </h1>
                <p className="log-subtitle">
                  {viewState === 'verification' 
                    ? "Enter the code sent to your email" 
                    : "Sign in to your account"}
                </p>
              </div>

              {/* --- VISTA: LOGIN FORM --- */}
              {viewState === 'login' && (
                <>
                  {error && (
                    <Alert variant="danger" onClose={() => setError("")} dismissible className="log-alert log-animated-alert">
                      <div className="d-flex flex-column">
                        <span>{error}</span>
                        {/* PULSANTE "NON TROPPO INVASIVO" PER VERIFICA */}
                        {isUnverifiedError && (
                          <Button 
                            variant="link" 
                            className="p-0 text-start mt-1 text-decoration-underline text-danger fw-bold"
                            style={{ fontSize: '0.9rem' }}
                            onClick={handleSwitchToVerification}
                          >
                            Is that you? Verify your account now &rarr;
                          </Button>
                        )}
                      </div>
                    </Alert>
                  )}

                  <Form onSubmit={handleLogin} noValidate className="log-form">
                    <Form.Group className="log-form-group log-floating-label-group">
                      <div className={`log-form-control-container ${isFocused.username || formData.username ? 'focused' : ''}`}>
                        <FaUser className="log-input-icon" />
                        <Form.Control
                          type="text"
                          placeholder={isFocused.username ? '' : 'username'}
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          onFocus={() => handleFocus('username')}
                          onBlur={() => handleBlur('username')}
                          disabled={loading}
                          className="log-modern-input"
                        />
                        <Form.Label className="log-floating-label">Username </Form.Label>
                      </div>
                    </Form.Group>

                    <Form.Group className="log-form-group log-floating-label-group">
                      <div className={`log-form-control-container ${isFocused.password || formData.password ? 'focused' : ''}`}>
                        <FaLock className="log-input-icon" />
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          placeholder={isFocused.password ? '' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          onFocus={() => handleFocus('password')}
                          onBlur={() => handleBlur('password')}
                          disabled={loading}
                          className="log-modern-input log-password-input"
                        />
                        <Form.Label className="log-floating-label">Password</Form.Label>
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

                    <button type="submit" className="btn log-btn-custom-primary log-btn log-modern-btn" disabled={loading}>
                      {loading ? <><Spinner animation="border" size="sm" className="me-2" /> Signing in...</> : "Sign In"}
                    </button>
                  </Form>

                  <div className="log-footer">
                    <span className="log-footer-text">Don't have an account? </span>
                    <Button
                      variant="link"
                      className="log-link-btn"
                      onClick={() => !loading && navigate("/register")}
                      disabled={loading}
                    >
                      Sign Up
                    </Button>
                  </div>
                </>
              )}

              {/* --- VISTA: OTP VERIFICATION --- */}
              {viewState === 'verification' && (
                <div className="fade-in-animation">
                   <OtpVerification 
                      username={formData.username} 
                   />
                </div>
              )}

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

Login.propTypes = {
  onLoginSuccess: PropTypes.func,
};