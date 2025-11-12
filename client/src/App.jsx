import { Routes, Route , useLocation , Navigate } from "react-router-dom";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import Home from "./pages/homepage.jsx";
import Navbar from "./components/navbar.jsx";

function App() {
    const location = useLocation();

  // hide only on register page
  // const hideNavbar = location.pathname === "/register";
  return (
    <>
      {/* {!hideNavbar && <Navbar />} */}
      <Navbar />
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
