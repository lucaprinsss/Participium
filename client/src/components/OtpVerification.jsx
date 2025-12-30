import { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { verifyEmailCode, findUserByUsername, resendVerificationCode } from "../api/citizenApi";
import "../css/OtpVerification.css";

const OtpVerification = ({ username }) => {
  const navigate = useNavigate();
  
  // --- STATO ---
  // Array di 6 stringhe vuote per i 6 input
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);

  // References to DOM inputs to handle focus
  const inputRefs = useRef([]);

  // --- EFFECT: Caricamento Utente ---
  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        if (!username) throw new Error("Username missing");
        const foundUser = await findUserByUsername(username);
        
        if (isMounted) {
          if (!foundUser) {
            setError("User not found. Please try registering again.");
          } else {
            setUser(foundUser);
          }
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        if (isMounted) setError("Could not retrieve user details.");
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };

    fetchUser();
    return () => { isMounted = false; };
  }, [username]);

  // --- LOGICA INPUT ---
  
  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Move focus to the next input if a number was entered
    if (element.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
    
    // Pulisce errori se l'utente sta digitando
    if (error) setError("");
  };

  const handleKeyDown = (e, index) => {
    // Gestione Backspace
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // If the box is empty and you press backspace, go to the previous one
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    // Accept only numbers
    if (!/^\d+$/.test(pasteData)) return;

    const newOtp = [...otp];
    const digits = pasteData.split("").slice(0, 6);

    digits.forEach((digit, i) => {
      newOtp[i] = digit;
      if (inputRefs.current[i]) {
        inputRefs.current[i].value = digit; // Update visuale immediato
      }
    });

    setOtp(newOtp);
    
    // Focus on the last filled element or the next empty one
    const nextFocusIndex = Math.min(digits.length, 5);
    inputRefs.current[nextFocusIndex].focus();
  };

  // --- LOGICA VERIFICA ---
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    
    const otpCode = otp.join("");
    setError("");
    setSuccess("");

    if (otpCode.length < 6) {
      setError("Please fill in all 6 digits.");
      return;
    }

    if (!user || !user.email) {
      setError("User data not loaded. Please refresh.");
      return;
    }

    setLoading(true);

    try {
      await verifyEmailCode(user.email, otpCode);
      setSuccess("Verified! Redirecting...");
      setTimeout(() => {
        navigate(0); // Refresh per gestire lo stato di login pulito
      }, 1500);
    } catch (err) {
      console.error("Verification failed:", err);
      handleApiError(err);
      setLoading(false);
      // Reset OTP in caso di errore per permettere riprova
      // setOtp(new Array(6).fill("")); 
    }
  };

  const handleResendCode = async () => {
    if (!user || !user.email) return;
    setLoading(true);
    try {
      await resendVerificationCode(user.email);
      setSuccess("New code sent!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (err) => {
    const msg = err.message || "Verification failed";
    if (msg.includes("Network")) setError("Connection error.");
    else if (err.status === 400) setError("Invalid code.");
    else setError(msg);
  };

  // --- RENDER ---
  if (initialLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  return (
    <div className="otp-wrapper">
      
      {/* Area Notifiche */}
      <div className="otp-status-message">
        {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess("")} dismissible>{success}</Alert>}
      </div>

      <form onSubmit={handleVerifyOtp} style={{width: '100%'}}>
        <div className="otp-input-group">
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              name="otp"
              maxLength="1"
              className={`otp-digit-input ${data ? 'filled' : ''}`}
              value={data}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={index === 0 ? handlePaste : undefined}
              ref={(el) => (inputRefs.current[index] = el)}
              disabled={loading}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          ))}
        </div>

        <button type="submit" className="otp-action-btn" disabled={loading || otp.join("").length < 6}>
          {loading ? <><Spinner animation="border" size="sm" className="me-2" /> Verifying...</> : "Verify Account"}
        </button>
      </form>

      <div className="otp-resend-container">
        <span className="me-1">Didn't receive the code?</span>
        <button 
          onClick={handleResendCode} 
          className="otp-resend-link"
          disabled={loading}
        >
          Resend
        </button>
      </div>

      {user?.email && (
        <div className="text-center">
           <span className="otp-email-hint">
             Sent to <strong>{user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}</strong>
           </span>
        </div>
      )}
    </div>
  );
};

OtpVerification.propTypes = {
  username: PropTypes.string.isRequired,
};

export default OtpVerification;