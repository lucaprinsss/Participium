import React, { useState } from "react";
import { Alert, Card } from "react-bootstrap";
import "../css/login.css";
import { login } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);

    try {
      await login(username, password);
      navigate("/home");
    } catch (err) {
      console.error("Login failed:", err);

      // Clear password field on error
      setPassword("");

      // Set user-friendly error message
      if (err.status === 401) {
        setError("Invalid username or password. Please try again.");
      } else if (err.status === 400) {
        setError("Invalid request. Please check your input.");
      } else if (!navigator.onLine) {
        setError("No internet connection. Please check your network.");
      } else {
        setError(err.message || "Login failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Card.Body>
          <img
            src="/participium-logo.png"
            alt="Participium Logo"
            className="login-logo-img"
          />

          <p className="login-subtitle">Sign in to your account</p>

          {error && (
            <div className="alert-container">
              <Alert variant="danger" onClose={() => setError("")} dismissible>
                {error}
              </Alert>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form" noValidate>
            <div className="login-field">
              <label className="login-label">Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="signup-link">
            Don't have an account?{" "}
            <span onClick={() => !loading && navigate("/register")}>
              Create one
            </span>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}