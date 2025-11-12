import { Routes, Route , useLocation , Navigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import Home from "./pages/Homepage.jsx";
import Navbar from "./components/navbar.jsx";

function App() {
  const location = useLocation();

  // Hide navbar on login and register pages
  const hideNavbar = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/";
  
  // Add/remove body class based on navbar visibility
  useEffect(() => {
    if (hideNavbar) {
      document.body.classList.remove('has-navbar');
    } else {
      document.body.classList.add('has-navbar');
    }
  }, [hideNavbar]);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </>
  );
}

export default App;
