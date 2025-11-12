import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, logout } from "../api/authApi";
import {
  Navbar as BSNavbar,
  Container,
  Nav,
  Button,
  NavDropdown
} from "react-bootstrap";
import { BsEyeFill } from "react-icons/bs";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        setUser(u);
      })
      .catch(() => {
        // User not authenticated - silently handle
        setUser(null);
      });
  }, [location.pathname]); // Re-fetch user when navigation changes

  // Show logout when user is authenticated and on /home or any sub-route
  const showLogout = user && location.pathname.startsWith("/home");
  const isAdmin = user && user.role === 'Administrator';

  // Get current view from query params for the admin dropdown
  const queryParams = new URLSearchParams(location.search);
  const currentViewParam = queryParams.get('view_as');

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate("/login");
  };

  const handleBrandClick = () => {
    // If user is authenticated, go to home, otherwise go to login
    navigate(user ? "/home" : "/");
  };

  return (
    <BSNavbar
      fixed="top"
      style={{
        backgroundColor: 'var(--primary)',
        boxShadow: 'var(--shadow-md)',
        padding: '1rem 0',
        zIndex: 1030
      }}
      variant="dark"
      expand="lg"
    >
      <Container fluid className="px-4">
        <BSNavbar.Brand
          onClick={handleBrandClick}
          style={{
            fontSize: 'var(--font-xl)',
            fontWeight: 'var(--font-bold)',
            letterSpacing: '-0.025em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <img
            src="/participium-logo.png"
            alt="Participium Logo"
            style={{ height: '32px', width: 'auto' }}
          />
          Participium
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">

          {/* --- Left-aligned Nav (for View As) --- */}
          <Nav className="me-auto align-items-center">
            {showLogout && isAdmin && (
              <NavDropdown
                title={
                  <span className="text-white">
                    <BsEyeFill className="me-2" />
                    View As
                  </span>
                }
                id="admin-view-dropdown"
                className="ms-3"
                // MODIFICA: Rimosso 'align="end"' 
                // per usare l'allineamento di default (start)
              >
                <NavDropdown.Item
                  onClick={() => navigate('/home')}
                  active={!currentViewParam}
                >
                  Administrator (Default)
                </NavDropdown.Item>
                <NavDropdown.Item
                  onClick={() => navigate('/home?view_as=officer')}
                  active={currentViewParam === 'officer'}
                >
                  Municipality Officer
                </NavDropdown.Item>
                <NavDropdown.Item
                  onClick={() => navigate('/home?view_as=citizen')}
                  active={currentViewParam === 'citizen'}
                >
                  Citizen
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>

          {/* --- Right-aligned Nav (for User Info & Logout) --- */}
          <Nav className="ms-auto align-items-center">
            {showLogout && (
              <>
                {/* --- User Info --- */}
                <div className="text-light me-3">
                  <div
                    style={{
                      fontWeight: 'var(--font-medium)',
                      fontSize: 'var(--font-sm)'
                    }}
                  >
                    {user.username}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      opacity: 0.8,
                      textTransform: 'capitalize'
                    }}
                  >
                    {isAdmin && currentViewParam
                      ? `Viewing as: ${currentViewParam}`
                      : user.role
                    }
                  </div>
                </div>

                {/* --- Logout Button --- */}
                <Button
                  variant="light"
                  onClick={handleLogout}
                  style={{
                    fontWeight: 'var(--font-medium)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.5rem 1.5rem',
                    minHeight: 'var(--btn-height-sm)'
                  }}
                >
                  Logout
                </Button>
              </>
            )}
          </Nav>

        </BSNavbar.Collapse>
      </Container>
    </BSNavbar >
  );
}