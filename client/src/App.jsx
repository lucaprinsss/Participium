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

import "./App.css";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Definizione delle route che non mostrano la navbar
  const noNavbarRoutes = ["/login", "/register", "/"];
  const hideNavbar = noNavbarRoutes.includes(location.pathname);

  // Gestione classe CSS per la navbar
  useEffect(() => {
    if (hideNavbar) {
      document.body.classList.remove('has-navbar');
    } else {
      document.body.classList.add('has-navbar');
    }

    // Cleanup
    return () => {
      document.body.classList.remove('has-navbar');
    };
  }, [hideNavbar]);

  // Check authentication status on app load and on route change
  useEffect(() => {
    let isMounted = true;
    
    const checkAuthentication = async () => {
      if (!isMounted) return;
      
      setIsAuthLoading(true);
      setAuthError(null);

      // --- NUOVA LOGICA: Controllo "Indizio" ---
      // Se non c'è l'indizio che l'utente si era loggato in passato,
      // non disturbiamo il server (evitando il 401).
      const hasLoginHint = localStorage.getItem("isLoggedIn");

      if (!hasLoginHint) {
        // Non siamo loggati (o abbiamo fatto logout), saltiamo la chiamata API
        if (isMounted) {
          setUser(null);
          setIsAuthLoading(false);
          // Se siamo su una rotta protetta, il redirect avverrà nel blocco catch/finally o qui sotto
          if (!noNavbarRoutes.includes(location.pathname)) {
             navigate("/login", { replace: true });
          }
        }
        return; 
      }
      
      // Se l'indizio c'è, facciamo la chiamata al server per confermare che il cookie sia ancora valido
      try {
        const userData = await getCurrentUser();
        if (isMounted) {
          if (userData) {
             setUser(userData);
             // Redirect automatico se siamo su login/register ma siamo loggati
             if (location.pathname === "/login" || location.pathname === "/register") {
               navigate("/home", { replace: true });
             }
          } else {
             // Caso raro: avevamo il flag in localStorage ma il cookie è scaduto -> 401 gestito
             // Puliamo il flag per il futuro
             localStorage.removeItem("isLoggedIn");
             setUser(null);
          }
        }
      } catch (error) {
        if (isMounted) {
          // Se c'è un errore reale, puliamo l'indizio per sicurezza
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

  // Logout handler
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

  // Protected Route Wrapper
  const ProtectedRoute = ({ children }) => {
    if (isAuthLoading) {
      return <LoadingScreen message="Verifying access..." />;
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  //If still loading auth state, show loading screen (except on root)
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

          <Route 
            path="/new-report" 
            element={
              <ProtectedRoute>
                <MapPage user={user} />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/my-reports" 
            element={
              <ProtectedRoute>
                <div>Profile Page - To be implemented</div>
              </ProtectedRoute>
            } 
          />

          {/* Route 404 */}
          <Route 
            path="*" 
            element={
              <div className="not-found-container">
                <h2>404 - Page Not Found</h2>
                <p>The page you are looking for does not exist.</p>
                <button 
                  onClick={() => navigate("/")}
                  className="home-btn"
                >
                  Go to Home
                </button>
              </div>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;