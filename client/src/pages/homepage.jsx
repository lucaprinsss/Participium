import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import CitizenHome from "../components/citizenHome";
import AdminHome from "../components/adminHome";
import MunicipalityUserHome from "../components/municipalityUserHome";
import "../css/homepage-page.css";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        // User not authenticated, redirect to login
        navigate("/login");
      });
  }, [navigate]);

  // Auto-hide welcome message after 5 seconds
  useEffect(() => {
    if (user && showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [user, showWelcome]);

  // Check if user is citizen
  const isCitizen = user && (user.role || "").toString().toLowerCase().includes("citizen");

  return (
    <div className="homepage-page">
      <div className="hp-container">
        <div className="hp-header">

          {user && showWelcome && (
            <div className="hp-welcome">
              Welcome, <strong>{user.username}</strong>
              <button
                className="hp-welcome-close"
                onClick={() => setShowWelcome(false)}
                aria-label="Close welcome message"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="hp-main">
          <div className="hp-left">
            {/* primary content area - keep components below for when features are ready */}
            {user &&
              (() => {
                const role = (user.role || "").toString().toLowerCase();
                if (role.includes("citizen"))
                  return <CitizenHome user={user} />;
                if (role.includes("admin") || role.includes("administrator"))
                  return <AdminHome />;
                // All other roles are municipality staff
                return <MunicipalityUserHome user={user} />;
              })()}
          </div>
        </div>
      </div>
    </div>
  );
}
