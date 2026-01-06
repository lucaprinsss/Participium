import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { getNotifications, markAsRead, markAllAsRead } from "../api/notificationApi";
import { getReportById } from "../api/reportApi";
import ReportDetails from "./ReportDetails";
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import "../css/Navbar.css";

// --- UTILITY E HELPER ---
const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return (first + last) || 'U'; 
};

// --- TOAST COMPONENT (Copied from ReportDetails.jsx) ---
const ToastMessage = ({ message, type, onClose }) => {
  useEffect(() => {
      const timer = setTimeout(() => {
          onClose();
      }, 3000); // 3 seconds as requested
      return () => clearTimeout(timer);
  }, [onClose]);

  const getIconAndClass = (msgType) => {
      switch (msgType) {
          case 'error': return { icon: <FaTimes />, className: 'error' }; // Using FaTimes as error icon placeholder if needed
          case 'warning': return { icon: <FaExclamationTriangle />, className: 'warning' };
          case 'info': return { icon: <FaInfoCircle />, className: 'info' };
          case 'success': default: return { icon: <FaCheckCircle />, className: 'success' };
      }
  };

  const { icon, className } = getIconAndClass(type);

  return (
      <div className={`mp-notification ${className}`}>
          <div className="mp-notification-content">
              {icon && <span className="mp-notification-icon">{icon}</span>}
              <span className="mp-notification-message">{message}</span>
              <button
                  onClick={onClose}
                  aria-label="Close notification"
                  style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: '10px', cursor: 'pointer', fontSize: '1rem' }}
              >
                  <FaTimes />
              </button>
          </div>
      </div>
  );
};

ToastMessage.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  onClose: PropTypes.func.isRequired,
};

// --- COMPONENTE PRINCIPALE ---
export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const dropdownRef = useRef(null);
  const lastNotificationIdRef = useRef(null);
  const isFirstLoad = useRef(true);

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: false, message: "", type: "" });
    setTimeout(() => setToast({ show: true, message, type }), 100);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Polling for notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        const unreadData = data.filter(n => !n.isRead);
        unreadData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setNotifications(unreadData);
        setUnreadCount(unreadData.length);

        if (isFirstLoad.current) {
          isFirstLoad.current = false;
          lastNotificationIdRef.current = unreadData[0]?.id || 0;
        } else if (unreadData.length > 0) {
          const latestNotification = unreadData[0];
          if (latestNotification.id > (lastNotificationIdRef.current || 0)) {
            showToast("You have a new notification!", "info");
            lastNotificationIdRef.current = latestNotification.id;
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        if (error?.status === 401 || error?.message?.includes('Not authenticated')) {
          showToast("Expired session. Please log in again.", "error");
          onLogout?.();
        }
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [user, showToast, onLogout]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
    
    if (notification.reportId) {
      try {
        const report = await getReportById(notification.reportId);
        setSelectedReport(report);
        setShowReportModal(true);
        setShowNotifications(false);
      } catch (error) {
        console.error("Error fetching report details:", error);
        showToast("Unable to load report details", "error");
      }
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // 2. Info Utente Derivate (uso useMemo per la stabilità)
  const userRoles = useMemo(() => user?.roles || [], [user]);
  const isAdmin = useMemo(() => userRoles.some(r => r.role_name === 'Administrator'), [userRoles]);
  
  const isCitizen = useMemo(() => userRoles.some(r => r.role_name === 'Citizen'), [userRoles]);
  
  const displayUsername = useMemo(() => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'User'; 
  }, [user?.first_name, user?.last_name, user?.username]);

  const displayRole = useMemo(() => {
    if (userRoles.length > 1) return 'Multiple roles';
    return userRoles.map(r => r.role_name).join(', ') || 'User';
  }, [userRoles]);
  
  const avatarInitials = useMemo(() => {
      return getInitials(user?.first_name, user?.last_name);
  }, [user?.first_name, user?.last_name]);

  const handleBrandClick = () => navigate("/");
  
  // NUOVO HANDLER PER IL PROFILO
  const handleProfileClick = () => navigate("/my-profile");

  return (
    <nav className={`navbar-modern ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Left Section */}
        <div className="navbar-left-section">
          <div 
            className="navbar-brand"
            onClick={handleBrandClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { 
                e.preventDefault(); 
                handleBrandClick();
              }
            }}
          >
            <img
              src="/participium-circle.jpg"
              alt="Participium Logo"
              className="brand-logo"
            />
            <span className="brand-text">Participium</span>
          </div>

          {user && (
            <button className="home-btn-navbar" onClick={() => navigate("/home")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Home</span>
            </button>
          )}

          {user && isCitizen && (
            <button className="home-btn-navbar" onClick={() => navigate("/reports-map")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>Map</span>
            </button>
          )}

          {user && isCitizen && (
            <button className="home-btn-navbar" onClick={() => navigate("/my-reports")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Reports</span>
            </button>
          )}
        </div>

        {/* Right Section */}
        {user && (
          <div className="navbar-right-section">
            
            {/* Notification Bell */}
            <div className="notification-wrapper" ref={dropdownRef}>
              <button 
                className="notification-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button className="mark-all-read" onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="no-notifications">No notifications</div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <p className="notification-message">{notification.content}</p>
                          <span className="notification-time">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MODIFIED: User Info Card is now clickable */}
            <div 
                className="user-info-card clickable-profile" 
                onClick={handleProfileClick}
                role="button"
                tabIndex={0}
                title="Go to My Profile"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleProfileClick();
                    }
                }}
            >
              <div className="user-avatar">
                {user?.personal_photo_url ? (
                  <img 
                    src={user.personal_photo_url} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  avatarInitials
                )}
              </div>
              <div className="user-details">
                <div className="user-name">{displayUsername}</div>
                <div className={`user-role ${isAdmin ? 'admin' : ''}`}>
                  {displayRole}
                </div>
              </div>
            </div>

            <button className="logout-btn-modern" onClick={onLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
      {toast.show && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <ReportDetails
          show={showReportModal}
          onHide={() => setShowReportModal(false)}
          report={selectedReport}
          user={user}
          // Pass dummy handlers or implement if needed for Navbar context
          onApprove={() => {}}
          onReject={() => {}}
          onStatusUpdate={() => {}}
          onReportUpdated={setSelectedReport}
          openChat={true} // Open chat by default if coming from notification? Maybe useful.
        />
      )}
    </nav>
  );
}

Navbar.propTypes = {
  user: PropTypes.shape({
    roles: PropTypes.arrayOf(PropTypes.shape({
        role_name: PropTypes.string
    })),
    username: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    personal_photo_url: PropTypes.string,
  }),
  onLogout: PropTypes.func.isRequired,
};