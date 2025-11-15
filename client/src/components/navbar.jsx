import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "../css/Navbar.css";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const showLogout = user && location.pathname.startsWith("/home");
  const isAdmin = user && user.role === 'Administrator';

  const queryParams = new URLSearchParams(location.search);
  const currentViewParam = queryParams.get('view_as');

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBrandClick = () => {
    navigate(user ? "/home" : "/");
  };

  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : 'U';
  };

  const getDisplayRole = () => {
    if (isAdmin && currentViewParam) {
      return `Viewing as: ${currentViewParam}`;
    }
    return user?.role || 'User';
  };

  return (
    <nav className={`navbar-modern ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Brand Section */}
        <div 
          className="navbar-brand"
          onClick={handleBrandClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleBrandClick()}
        >
          <img
            src="/participium-circle.jpg"
            alt="Participium Logo"
            className="brand-logo"
          />
          <span className="brand-text">Participium</span>
        </div>

        {/* User Section */}
        {showLogout && (
          <div className="navbar-user-section">
            {/* User Info Card */}
            <div className="user-info-card">
              <div className="user-avatar">
                {getInitials(user.username)}
              </div>
              <div className="user-details">
                <div className="user-name">
                  {user.username}
                </div>
                <div className={`user-role ${isAdmin ? 'admin' : ''}`}>
                  {getDisplayRole()}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              className="logout-btn-modern"
              onClick={onLogout}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}