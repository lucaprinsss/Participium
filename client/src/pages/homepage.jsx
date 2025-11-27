import { useEffect, useState } from "react";
import { getCurrentUser } from "../api/authApi";
import { useNavigate } from "react-router-dom"; 
import CitizenHome from "../components/CitizenHome";
import AdminHome from "../components/AdminHome";
import MunicipalityUserHome from "../components/MunicipalityUserHome";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  const getComponentToRender = () => {
    if (!user) {
      return null;
    }
    
    const actualRole = (user.role_name || "").toString().toLowerCase();
    const isAdmin = actualRole.includes("administrator");
    
    if (actualRole.includes("citizen") || actualRole.includes("Citizen")) {
      return <CitizenHome user={user} />;
    }
    if (isAdmin) {
      return <AdminHome />;
    }
    
    return <MunicipalityUserHome user={user} />;
  };

  return (
      <div className="hp-container">
            {getComponentToRender()}
      </div>
  );
}