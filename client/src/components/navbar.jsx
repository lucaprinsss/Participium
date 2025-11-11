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
        //console.log('getCurrentUser ->', u);
      })
      .catch((err) => {
        console.error('getCurrentUser failed', err);
      });
  }, []);

  // Show logout when user is present and we are on /home or any sub-route
  const showLogout = user && location.pathname.startsWith("/home");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="navbar">
      <span className="brand" onClick={()=>navigate("/")}>Participium</span>

      {showLogout && (
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      )}
    </div>
  );
}
