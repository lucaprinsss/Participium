import { useEffect, useState } from "react";
import { getCurrentUser } from "../api/authApi";
import { useNavigate, useLocation } from "react-router-dom"; 
import CitizenHome from "../components/CitizenHome";
import AdminHome from "../components/AdminHome";
import MunicipalityUserHome from "../components/MunicipalityUserHome";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const location = useLocation(); 

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

    const queryParams = new URLSearchParams(location.search);
    const viewAs = queryParams.get('view_as');

    const actualRole = (user.role || "").toString().toLowerCase();
    const isAdmin = actualRole.includes("admin") || actualRole.includes("administrator");

    if (isAdmin && viewAs) {
      if (viewAs === 'citizen') {
        return <CitizenHome user={user} />;
      }
      if (viewAs === 'officer') {
        return <MunicipalityUserHome user={user} />;
      }
    }

    if (actualRole.includes("citizen")) {
      return <CitizenHome user={user} />;
    }
    if (isAdmin) {
      return <AdminHome />;
    }
    
    return <MunicipalityUserHome user={user} />;
  };

  return (
    <div className="homepage">
      <div className="hp-container">
        <div className="hp-main">
          <div className="hp-left">
            {getComponentToRender()}
          </div>
        </div>
      </div>
    </div>
  );
}