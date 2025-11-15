import { useState } from "react";
import { Alert, Card, Form, Button, Row, Col, InputGroup } from "react-bootstrap";
import { registerCitizen } from "../api/citizenApi";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import "../css/Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    if (!firstName.trim()) return setError("Please enter your first name");
    if (!lastName.trim()) return setError("Please enter your last name");
    if (!email.trim()) return setError("Please enter your email");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError("Please enter a valid email address");
    if (!username.trim()) return setError("Please enter a username");
    if (username.length < 3) return setError("Username must be at least 3 characters long");
    if (!password.trim()) return setError("Please enter a password");
    if (password.length < 6) return setError("Password must be at least 6 characters long");
    if (password !== confirmPassword) return setError("Passwords do not match");

    setLoading(true);

    try {
      const payload = {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role: "Citizen",
      };

      await registerCitizen(payload);
      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Registration failed:", err);
      setPassword("");
      setConfirmPassword("");

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
    <div className="register-container">
      <Card className="shadow-lg register-card">
        <Card.Body className="register-card-body">
          <div className="text-center register-header">
            <img src="/participium-logo.png" alt="Participium Logo" className="register-logo" />
            <p className="text-muted mb-4">Create your account</p>
          </div>

          {error && (
            <Alert variant="danger" onClose={() => setError("")} dismissible className="mb-3">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" onClose={() => setSuccess("")} dismissible className="mb-3">
              {success}
            </Alert>
          )}

          <Form onSubmit={handleRegister} noValidate>
            <Row className="mb-3">
              <Col md={6} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3 password-wrapper">
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Choose a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-4 password-wrapper">
              <Form.Label>Confirm Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100 mb-3" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </Form>

          <Button
            variant="light"
            className="w-100 mb-3"
            onClick={() => !loading && navigate("/")}
            disabled={loading}
          >
            Main Page
          </Button>

          <div className="text-center mt-3">
            <span className="text-muted">Already have an account? </span>
            <Button
              variant="link"
              className="p-0"
              onClick={() => !loading && navigate("/login")}
              disabled={loading}
            >
              Sign in
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}