import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "../css/Navbar.css";

// --- UTILITY E HELPER ---
const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return (first + last) || 'U'; 
};
getInitials.propTypes = {
  firstName: PropTypes.string,
  lastName: PropTypes.string,
};

// --- COMPONENTE PRINCIPALE ---
export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Info Utente Derivate (uso useMemo per la stabilità)
  const userRoles = useMemo(() => user?.roles || [], [user]);
  const isAdmin = useMemo(() => userRoles.some(r => r.role_name === 'Administrator'), [userRoles]);

  const isCitizen = useMemo(() => userRoles.some(r => r.role_name === 'Citizen'), [userRoles]);
  
  const displayUsername = useMemo(() => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'User'; 
  }, [user?.first_name, user?.last_name, user?.username]);

  const displayRole = useMemo(() => {
    if (userRoles.length > 1) return 'Multiple roles';
    return userRoles.map(r => r.role_name).join(', ') || 'User';
  }, [userRoles]);
  
  const avatarInitials = useMemo(() => {
      return getInitials(user?.first_name, user?.last_name);
  }, [user?.first_name, user?.last_name]);

  const handleBrandClick = () => navigate("/");
  
  // NUOVO HANDLER PER IL PROFILO
  const handleProfileClick = () => navigate("/my-profile");

  return (
    <nav className={`navbar-modern ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Left Section */}
        <div className="navbar-left-section">
          <div 
            className="navbar-brand"
            onClick={handleBrandClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { 
                e.preventDefault(); 
                handleBrandClick();
              }
            }}
          >
            <img
              src="/participium-circle.jpg"
              alt="Participium Logo"
              className="brand-logo"
            />
            <span className="brand-text">Participium</span>
          </div>

          {user && (
            <button className="home-btn-navbar" onClick={() => navigate("/home")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Home</span>
            </button>
          )}

          {user && isCitizen && (
            <button className="home-btn-navbar" onClick={() => navigate("/reports-map")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>Map</span>
            </button>
          )}

          {user && isCitizen && (
            <button className="home-btn-navbar" onClick={() => navigate("/my-reports")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Reports</span>
            </button>
          )}
        </div>

        {/* Right Section */}
        {user && (
          <div className="navbar-right-section">
            
            {/* MODIFIED: User Info Card is now clickable */}
            <div 
                className="user-info-card clickable-profile" 
                onClick={handleProfileClick}
                role="button"
                tabIndex={0}
                title="Go to My Profile"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleProfileClick();
                    }
                }}
            >
              <div className="user-avatar">
                {user?.personal_photo_url ? (
                  <img 
                    src={user.personal_photo_url} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  avatarInitials
                )}
              </div>
              <div className="user-details">
                <div className="user-name">{displayUsername}</div>
                <div className={`user-role ${isAdmin ? 'admin' : ''}`}>
                  {displayRole}
                </div>
              </div>
            </div>

            <button className="logout-btn-modern" onClick={onLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

Navbar.propTypes = {
  user: PropTypes.shape({
    roles: PropTypes.arrayOf(PropTypes.shape({
        role_name: PropTypes.string
    })),
    username: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
  }),
  onLogout: PropTypes.func.isRequired,
};