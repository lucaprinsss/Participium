import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../api/authApi";
import CitizenHome from "../components/citizenHome";
import AdminHome from "../components/adminHome";
import "../css/homepage-page.css";

export default function Home() {

  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="homepage-page">
      <div className="hp-container">
        <div className="hp-header">
          <div>
            <h1 className="hp-title">Participium</h1>
            <div className="hp-subtitle">Civic reporting platform for the Municipality</div>
          </div>

          {user && <div className="hp-welcome">Welcome, <strong>{user.username}</strong></div>}
        </div>

        <div className="hp-main">
          <div className="hp-left">
            {/* primary content area - keep components below for when features are ready */}
            {user && (() => {
              const role = (user.role || '').toString().toLowerCase();
              if (role.includes('citizen')) return <CitizenHome user={user} />;
              if (role.includes('admin') || role.includes('administrator')) return <AdminHome />;
              return <div className="hp-placeholder">Please sign in to access the platform features.</div>;
            })()}
          </div>

          <aside className="hp-right">
            <div style={{marginBottom:12}}>
              <h3 style={{margin:0,color:'#0b3d91'}}>Quick actions</h3>
            </div>
            <div className="hp-actions">
              <button className="hp-btn" disabled>New report</button>
              <button className="hp-btn ghost" disabled>My reports</button>
            </div>

            <div style={{marginTop:18}} className="hp-placeholder">
              <p style={{marginTop:0}}><strong>Status</strong></p>
              <p style={{margin:0}}>Some features are not available yet. We are working to enable report submission and management.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
