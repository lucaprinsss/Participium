import React , {useState} from "react";
import "../css/register.css";
import { registerCitizen } from "../api/citizenApi";
import { useNavigate } from "react-router-dom";


export default function Register() {

const navigate = useNavigate();

const [firstName , setFirstName] = useState('');
const [lastName , setLastName] = useState('');
const [email , setEmail] = useState('');
const [username , setUsername] = useState('');  
const [password , setPassword] = useState('');


const handleRegister = async (e) => {
    e.preventDefault()

    try {
      // map client camelCase fields to server expected snake_case and include role
      const payload = {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role: 'Citizen'
      };

      await registerCitizen(payload); // << API CALL

      navigate("/login"); // go login after success

    } catch(err){
      setError(err.message);
    }
};

return (
    <div className="register-container">
      <div className="register-box">
        <h1 className="register-logo">Register</h1>

        <form onSubmit={handleRegister} className="register-form">
         <div className="name-row">
          <div className="field-half">
           <label className="register-label">First Name</label>
             <input
              type="text"
             placeholder="Enter first name"
      value={firstName}
      onChange={(e) => setFirstName(e.target.value)}
              />
         </div>

            <div className="field-half">
              <label className="register-label">Last Name</label>
              <input
                type="text"
                placeholder="Enter last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>


          <label className="register-label">Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="register-label">Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label className="register-label">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}