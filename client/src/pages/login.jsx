import React , {useState} from "react";
import "../css/login.css";
import { login } from "../api/authApi";
import { useNavigate } from "react-router-dom";


export default function Login() {

const navigate = useNavigate();


const [username , setUsername] = useState('');
const [password , setPassword] = useState('');

const handleLogin = async (e) => {
    e.preventDefault()

    try {
        await login(username, password);
        navigate("/home");
    } catch (error) {
        console.error("Login failed:", error);
    }
};

return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-logo">Login</h1>

        <form onSubmit={handleLogin} className="login-form">
          <label className="login-label">Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label className="login-label">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Log in</button>
        </form>

        <div className="signup-link">
          Don't have an account? <span onClick={() => navigate("/register")}>Register</span>
        </div>
      </div>
    </div>
  );
}