import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { getCurrentUser, logout } from "./api/authApi"; 
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Homepage.jsx";
import Navbar from "./components/Navbar.jsx";
import MainPage from "./pages/MainPage.jsx";
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

  const noNavbarRoutes = ["/login", "/register", "/"];
  const hideNavbar = noNavbarRoutes.includes(location.pathname);

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
          if (!noNavbarRoutes.includes(location.pathname)) {
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
          localStorage.removeItem("isLoggedIn");
          setUser(null);
          setAuthError(error.message || "Error during authentication check");
          
          if (!noNavbarRoutes.includes(location.pathname)) {
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

  // --- Wrapper Standard per utenti loggati (qualsiasi ruolo) ---
  const ProtectedRoute = ({ children }) => {
    if (isAuthLoading) {
      return <LoadingScreen message="Verifying access..." />;
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  // --- NUOVO WRAPPER: Solo per 'Citizen' ---
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
    if (user.role_name !== 'Citizen') {
      return <Navigate to="/home" replace />;
    }

    // 4. Se è Citizen, mostra la pagina
    return children;
  };

  if (isAuthLoading && location.pathname !== "/" && !noNavbarRoutes.includes(location.pathname)) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <div className="app-container">
      {!hideNavbar && <Navbar user={user} onLogout={handleLogout} />}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<MainPage />} />
          
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/home" replace /> : <Login onLoginSuccess={setUser} />
            } 
          />
          
          <Route 
            path="/register" 
            element={
              user ? <Navigate to="/home" replace /> : <Register />
            } 
          />
          
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                {<Home user={user} />}
              </ProtectedRoute>
            } 
          />

          {/* --- QUI LA MODIFICA: Usiamo CitizenRoute --- */}
          <Route 
            path="/new-report" 
            element={
              <CitizenRoute>
                <MapPage user={user} />
              </CitizenRoute>
            } 
          />

          {/* --- QUI LA MODIFICA: Usiamo CitizenRoute --- */}
          <Route 
            path="/my-reports" 
            element={
              <CitizenRoute>
                <div>Profile Page - To be implemented</div>
              </CitizenRoute>
            } 
          />

          <Route 
            path="*" 
            element={
              <NotFoundPage />
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;