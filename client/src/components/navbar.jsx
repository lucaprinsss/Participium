import React, { useState, useEffect } from "react";
import "../css/navbar.css";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, logout } from "../api/authApi";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        setUser(u);
      })
      .catch(() => {
        // User not authenticated - silently handle
        setUser(null);
      });
  }, [location.pathname]); // Re-fetch user when navigation changes

  // Show logout when user is authenticated and on /home or any sub-route
  const showLogout = user && location.pathname.startsWith("/home");

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate("/login");
  };

  const handleBrandClick = () => {
    // If user is authenticated, go to home, otherwise go to login
    navigate(user ? "/home" : "/");
  };

  return (
    <div className="navbar">
      <span className="brand" onClick={handleBrandClick}>
        Participium
      </span>

      {showLogout && (
        <div className="navbar-user-section">
          <span className="navbar-username">
            {user.username}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
