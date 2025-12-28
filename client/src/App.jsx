import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { getCurrentUser, logout } from "./api/authApi"; 
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Homepage.jsx";
import Navbar from "./components/Navbar.jsx";
import MainPage from "./pages/MainPage.jsx";
import MyReports from "./pages/MyReports.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import MapPage from "./pages/MapPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

import "./App.css";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // 1. DEFINIZIONE ROTTE
  // Rotte dove NON mostriamo la Navbar
  const noNavbarRoutes = ["/login", "/register", "/"];
  
  // Rotte accessibili a TUTTI (anche sloggati)
  // Qui aggiungiamo '/reports-map' e '*' (per il 404)
  const publicRoutes = ["/login", "/register", "/", "/reports-map"];

  const hideNavbar = noNavbarRoutes.includes(location.pathname);

  // Gestione classe CSS body per navbar
  useEffect(() => {
    if (hideNavbar) {
      document.body.classList.remove('has-navbar');
    } else {
      document.body.classList.add('has-navbar');
    }
    return () => {
      document.body.classList.remove('has-navbar');
    };
  }, [hideNavbar]);

  // Gestione Autenticazione
  useEffect(() => {
    let isMounted = true;
    
    const checkAuthentication = async () => {
      if (!isMounted) return;
      
      setIsAuthLoading(true);
      setAuthError(null);

      const hasLoginHint = localStorage.getItem("isLoggedIn");

      if (!hasLoginHint) {
        if (isMounted) {
          setUser(null);
          setIsAuthLoading(false);
          
          // MODIFICA CRUCIALE:
          // Se l'utente non è loggato, reindirizza SOLO se la rotta NON è pubblica.
          // In questo modo, se sei su /reports-map, non ti caccia via.
          if (!publicRoutes.includes(location.pathname)) {
             navigate("/login", { replace: true });
          }
        }
        return; 
      }
      
      try {
        const userData = await getCurrentUser();
        if (isMounted) {
          if (userData) {
             setUser(userData);
             // Se sei loggato e provi ad andare su login/register, vai alla home
             if (location.pathname === "/login" || location.pathname === "/register") {
               navigate("/home", { replace: true });
             }
          } else {
             localStorage.removeItem("isLoggedIn");
             setUser(null);
          }
        }
      } catch (error) {
        if (isMounted) {
          // Suppress 401 errors as they are expected for unauthenticated users
          if (error.status !== 401) {
            setAuthError(error.message || "Error during authentication check");
          }
          localStorage.removeItem("isLoggedIn");
          setUser(null);
          
          if (!publicRoutes.includes(location.pathname)) {
            navigate("/login", { replace: true });
          }
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    checkAuthentication();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAuthError(null);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      setAuthError("Error during logout. Please try again.");
    }
  };

  // --- WRAPPERS ---

  const ProtectedRoute = ({ children }) => {
    if (isAuthLoading) return <LoadingScreen message="Verifying access..." />;
    if (!user) return <Navigate to="/login" replace />;
    return children;
  };

  const CitizenRoute = ({ children }) => {
    // 1. Se sta ancora caricando, aspettiamo
    if (isAuthLoading) {
      return <LoadingScreen message="Checking permissions..." />;
    }

    // 2. Se non c'è utente, login
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // 3. Se l'utente c'è MA non è Citizen, rimandiamo alla Home
    const isCitizen = user.roles && user.roles.some(r => r.role_name === 'Citizen');
    if (!isCitizen) {
      return <Navigate to="/home" replace />;
    }

    // 4. Se è Citizen, mostra la pagina
    return children;
  };

  // Mostra loading screen solo se stiamo caricando l'auth E siamo su una rotta protetta
  // (per evitare il flash bianco su pagine pubbliche)
  if (isAuthLoading && !publicRoutes.includes(location.pathname)) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <div className="app-container">
      {!hideNavbar && <Navbar user={user} onLogout={handleLogout} />}

      <main className="main-content">
        <Routes>
          {/* --- ROTTE PUBBLICHE (Accessibili a tutti) --- */}
          
          <Route path="/" element={<MainPage />} />
          
          <Route path="/reports-map" element={<MapPage user={user} />} />
          
          <Route 
            path="/login" 
            element={user ? <Navigate to="/home" replace /> : <Login onLoginSuccess={setUser} />} 
          />
          
          <Route 
            path="/register" 
            element={user ? <Navigate to="/home" replace /> : <Register />} 
          />

          {/* --- ROTTE PROTETTE (Qualsiasi utente loggato) --- */}
          
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home user={user} />
              </ProtectedRoute>
            } 
          />

          {/* --- ROTTE CITTADINO (Solo ruolo 'Citizen') --- */}
          
          <Route 
            path="/my-reports" 
            element={
              <CitizenRoute>
                <MyReports />
              </CitizenRoute>
            } 
          />

          {/* --- 404 (Pubblica) --- */}
          <Route path="*" element={
            <ProtectedRoute>
              <NotFoundPage />
            </ProtectedRoute>  
          } 
          />
          
        </Routes>
      </main>
    </div>
  );
}

export default App;