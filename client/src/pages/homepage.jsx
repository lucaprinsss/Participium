import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../api/authApi";
import CitizenHome from "../components/citizenHome";
import AdminHome from "../components/adminHome";

export default function Home() {

  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => {});
  }, []);

  return (
    <div style={{paddingTop:"120px"}}>

      {/* welcome card */}
      {user && (
        <div style={{
          background:"#ffeaa7",
          padding:"12px 20px",
          borderRadius:"10px",
          width:"fit-content",
          margin:"0 auto"
        }}>
          Welcome, <b>{user.username}</b>!
        </div>
      )}

      {user && user.role === "citizen" && <CitizenHome user={user} />} {/*Change after implementing backend functions*/}
      {user && user.role === "admin" && <AdminHome />}

    </div>
  )
}
