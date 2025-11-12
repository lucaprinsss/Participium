import { useEffect, useState } from "react";
import { getCurrentUser } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import CitizenHome from "../components/CitizenHome";
import AdminHome from "../components/AdminHome";
import MunicipalityUserHome from "../components/MunicipalityUserHome";
import "../css/homepage-page.css";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        // User not authenticated, redirect to login
        navigate("/login");
      });
  }, [navigate]);

  return (
    <div className="homepage-page">
      <div className="hp-container">

        <div className="hp-main">
          <div className="hp-left">
            {/* primary content area - keep components below for when features are ready */}
            {user &&
              (() => {
                const role = (user.role || "").toString().toLowerCase();
                if (role.includes("citizen"))
                  return <CitizenHome user={user} />;
                if (role.includes("admin") || role.includes("administrator"))
                  return <AdminHome />;
                // All other roles are municipality staff
                return <MunicipalityUserHome user={user} />;
              })()}
          </div>
        </div>
      </div>
    </div>
  );
}
