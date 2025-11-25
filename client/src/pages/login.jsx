import { useState, useEffect } from "react";
import { Alert, Card, Form, Button, Container, Row, Col, Spinner } from "react-bootstrap";
import { login } from "../api/authApi";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaLock, FaArrowLeft } from "react-icons/fa";
import "../css/Login.css";

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation(); // Hook per leggere lo stato della navigazione (errori in arrivo)
  
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

  // EFFETTO: Controlla se ci sono errori passati al caricamento della pagina
  // (es. redirect da un interceptor axios o da un'altra pagina per errore server)
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
      // Puliamo lo stato della history per non mostrare l'errore se l'utente aggiorna la pagina
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Nascondi l'errore appena l'utente inizia a scrivere per correggere
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

    // Aggiorna UI se necessario
    if (trimmedUsername !== formData.username) {
      setFormData(prev => ({ ...prev, username: trimmedUsername }));
    }

    // Validazione Client-side
    if (!trimmedUsername) {
      setError("Inserisci il tuo username.");
      return;
    }
    if (!formData.password.trim()) {
      setError("Inserisci la tua password.");
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
      
      // Resetta la password in caso di errore per sicurezza
      setFormData(prev => ({ ...prev, password: "" }));

      // GESTIONE ERRORI AVANZATA
      // Priorità: Status Code -> Messaggio Network -> Messaggio Generico
      
      if (!err.status && (err.message === "Failed to fetch" || err.message.includes("Network"))) {
        // Caso specifico: Il server è giù o non raggiungibile (Errore di caricamento/connessione)
        setError("Impossibile contattare il server. Verifica la tua connessione o riprova più tardi.");
      } else if (err.status === 401) {
        setError("Username o password non validi.");
      } else if (err.status === 400) {
        setError("Dati mancanti o non validi. Controlla i campi.");
      } else if (err.status === 403) {
        setError("Account temporaneamente bloccato o non attivo.");
      } else if (err.status >= 500) {
        // Errori interni del server mostrati come errori del form
        setError("Internal server error.");
      } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setError("Nessuna connessione internet rilevata.");
      } else {
        // Fallback sul messaggio dell'errore o messaggio generico
        setError(err.message || "Login fallito. Si prega di riprovare.");
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
                Torna alla Home
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
                <h1 className="log-title">Bentornato</h1>
                <p className="log-subtitle">
                  Accedi al tuo account
                </p>
              </div>

              {/* Error Alert - Ora mostra anche errori server e di caricamento */}
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
                      Accesso in corso...
                    </>
                  ) : (
                    "Accedi"
                  )}
                </button>
              </Form>

              {/* Footer */}
              <div className="log-footer">
                <span className="log-footer-text">
                  Non hai un account?{" "}
                </span>
                <Button
                  variant="link"
                  className="log-link-btn"
                  onClick={() => !loading && navigate("/register")}
                  disabled={loading}
                >
                  Registrati
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}