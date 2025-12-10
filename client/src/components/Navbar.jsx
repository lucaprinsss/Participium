import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../css/Navbar.css";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0).toUpperCase() || '';
    const last = lastName?.charAt(0).toUpperCase() || '';
    return first + last || 'U'; 
  };

  const getDisplayRole = () => user?.role_name || 'User';
  const isAdmin = user?.role_name === 'Administrator';

  // Aggiornato per usare first_name e last_name
  const getUsername = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'User'; 
  };

  const isCitizen = () => user?.role_name === 'Citizen';

  return (
    <nav className={`navbar-modern ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Left Section */}
        <div className="navbar-left-section">
          <div 
            className="navbar-brand"
            onClick={() => navigate("/")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate("/")}
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

          {user && isCitizen() && (
            <button className="home-btn-navbar" onClick={() => navigate("/new-report")}>
              {/* NUOVA ICONA: Map Pin (Indicatore Mappa) */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>Map</span>
            </button>
          )}

        </div>

        {/* Right Section */}
        {user && (
          <div className="navbar-right-section">
            <div className="user-info-card">
              <div className="user-avatar">
                {getInitials(user.first_name, user.last_name)}
              </div>
              <div className="user-details">
                <div className="user-name">{getUsername()}</div>
                <div className={`user-role ${isAdmin ? 'admin' : ''}`}>
                  {getDisplayRole()}
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