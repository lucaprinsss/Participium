import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types"; // Importato per la validazione delle prop
import "../css/Navbar.css";

// --- UTILITY E HELPER (ESTRATTE) ---

// Funzione per ottenere le iniziali dell'utente in modo robusto
const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  // Se entrambi sono vuoti, restituisce 'U' (User)
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

  // 1. Logica dello scroll mantenuta
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Info Utente Derivate (uso useMemo per la stabilità)
  const userRole = user?.role_name;
  const isAdmin = userRole === 'Administrator';

  const isCitizen = useMemo(() => userRole === 'Citizen', [userRole]);
  
  // Utilizza useMemo per calcolare il nome utente completo e il ruolo di visualizzazione una sola volta
  const displayUsername = useMemo(() => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'User'; 
  }, [user?.first_name, user?.last_name, user?.username]);

  const displayRole = useMemo(() => userRole || 'User', [userRole]);
  
  // Calcola le iniziali (richiede che first_name e last_name siano passati)
  const avatarInitials = useMemo(() => {
      // Garantisce che getInitials sia chiamato solo se l'oggetto user è presente
      return getInitials(user?.first_name, user?.last_name);
  }, [user?.first_name, user?.last_name]);


  // 3. Gestore del Brand (Migliorata A11y)
  const handleBrandClick = () => navigate("/");

  return (
    <nav className={`navbar-modern ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Left Section */}
        <div className="navbar-left-section">
          
          {/* NAV BRAND: Usa una funzione singola per l'onClick e ha A11y già gestita */}
          <div 
            className="navbar-brand"
            onClick={handleBrandClick} // Uso la funzione handler
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { // Aggiunto spazio per accessibilità standard
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
            <button className="home-btn-navbar" onClick={() => navigate("/new-report")}>
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
                {avatarInitials}
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

// Validazione delle props
Navbar.propTypes = {
  user: PropTypes.shape({
    role_name: PropTypes.string,
    username: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
  }),
  onLogout: PropTypes.func.isRequired,
};