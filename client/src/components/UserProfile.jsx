import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useBlocker } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaTelegramPlane,
  FaCloudUploadAlt,
  FaSave,
  FaCheckCircle,
  FaPen,
  FaTrashAlt,
  FaInfoCircle,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import "../css/UserProfile.css";
import { updateUserProfile, updatePassword } from "../api/userApi";
import TelegramLinkModal from './TelegramLinkModal';

export default function UserProfile({ user, onUpdateUser }) {
  // Stato locale per il form
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    telegramUsername: "",
    personalPhotoUrl: "",
    emailNotificationsEnabled: true,
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Stato per gestire il Drag & Drop e File
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null); // NEW: Store base64
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Notification & Dirty State
  const [notification, setNotification] = useState(null);
  const [initialFormData, setInitialFormData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showBlockerModal, setShowBlockerModal] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  // Inizializza il form
  useEffect(() => {
    if (user) {
      const initialData = {
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        telegramUsername: user.telegram_username || "", // Fixed: snake_case from API
        personalPhotoUrl: user.personal_photo_url || "", // Fixed: snake_case from API
        emailNotificationsEnabled: user.email_notifications_enabled ?? true, // Fixed: snake_case
      };
      setFormData(initialData);
      setInitialFormData(initialData);
    }
  }, [user]);

  // Check for unsaved changes
  useEffect(() => {
    if (!initialFormData) return;
    
    const isFormChanged = 
      formData.firstName !== initialFormData.firstName ||
      formData.lastName !== initialFormData.lastName ||
      formData.email !== initialFormData.email ||
      formData.emailNotificationsEnabled !== initialFormData.emailNotificationsEnabled ||
      (photoBase64 !== null) || // Photo changed
      (selectedFile === null && !formData.personalPhotoUrl && initialFormData.personalPhotoUrl); // Photo removed

    const isPasswordChanged = 
      passwordData.currentPassword !== "" || 
      passwordData.newPassword !== "" || 
      passwordData.confirmPassword !== "";

    setIsDirty(isFormChanged || isPasswordChanged);
  }, [formData, passwordData, photoBase64, selectedFile, initialFormData]);

  // Auto dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Block navigation if dirty
  let blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
      if (blocker.state === "blocked") {
          setShowBlockerModal(true);
      } else {
          setShowBlockerModal(false);
      }
  }, [blocker.state]);

  const handleBlockerConfirm = () => {
      if (blocker.state === "blocked") {
          blocker.proceed();
      }
      setShowBlockerModal(false);
  };

  const handleBlockerCancel = () => {
      if (blocker.state === "blocked") {
          blocker.reset();
      }
      setShowBlockerModal(false);
  };

  // Block browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- LOGICA DRAG & DROP & FILE ---

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChangeFile = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // NEW: Convert file to base64
  const handleFile = (file) => {
    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: "Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP).",
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setMessage({
        type: "error",
        text: "File too large. Maximum size is 5MB.",
      });
      return;
    }

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, personalPhotoUrl: previewUrl }));

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result); // This includes the data: image/xxx;base64, prefix
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPhotoBase64(null);
    setFormData((prev) => ({ ...prev, personalPhotoUrl: "" }));
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  // --- PASSWORD LOGIC ---

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthColor = () => {
    const colors = ["#dc3545", "#ff6b35", "#ffa726", "#9ccc65", "#4caf50"];
    return colors[passwordStrength] || "#dc3545";
  };

  const handlePasswordInput = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "newPassword") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters." });
      setPasswordLoading(false);
      return;
    }

    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setPasswordMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStrength(0);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update password.";
      setPasswordMessage({ type: "error", text: errorMessage });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ---------------------------------

  // NEW: Real API call
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Prepare data for API (convert to snake_case and camelCase appropriately)
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        telegramUsername: formData.telegramUsername || null,
        emailNotificationsEnabled: formData.emailNotificationsEnabled,
      };

      // Add photo if changed
      if (photoBase64) {
        updateData.personalPhoto = photoBase64;
      } else if (selectedFile === null && !formData.personalPhotoUrl) {
        // Photo was removed
        updateData.personalPhoto = null;
      }
      
      // Call the API
      const updatedUser = await updateUserProfile(updateData);

      // Update parent component
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      // Update local state with response
      setFormData({
        firstName: updatedUser.first_name || "",
        lastName: updatedUser.last_name || "",
        email: updatedUser.email || "",
        telegramUsername: updatedUser.telegram_username || "",
        personalPhotoUrl: updatedUser.personal_photo_url || "",
        emailNotificationsEnabled:
          updatedUser.email_notifications_enabled ?? true,
      });

      // Clear the base64 after successful save
      setPhotoBase64(null);
      setSelectedFile(null);

      // Update initialFormData to reflect saved state (clears dirty flag)
      setInitialFormData({
        firstName: updatedUser.first_name || "",
        lastName: updatedUser.last_name || "",
        email: updatedUser.email || "",
        telegramUsername: updatedUser.telegram_username || "",
        personalPhotoUrl: updatedUser.personal_photo_url || "",
        emailNotificationsEnabled: updatedUser.email_notifications_enabled ?? true,
      });

      setNotification({ type: "success", message: "Profile updated successfully!" });
    } catch (error) {
      console.error("Update error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update profile. ";
      setNotification({ type: "error", message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    const f = formData.firstName ? formData.firstName[0].toUpperCase() : "U";
    const l = formData.lastName ? formData.lastName[0].toUpperCase() : "";
    return f + l;
  };

  const isCitizen = user?.roles?.some(r => r.role_name === "Citizen");

  return (
    <div className="up-profile-page-wrapper">
      {/* Notification Toast */}
      {notification && (
        <div className={`up-notification ${notification.type}`}>
          <div className="up-notification-content">
            <div className="up-notification-icon">
              {notification.type === "success" && <FaCheckCircle />}
              {notification.type === "error" && <FaTimes />}
              {notification.type === "info" && <FaInfoCircle />}
            </div>
            <span className="up-notification-message">{notification.message}</span>
            <button
              className="up-notification-close"
              onClick={() => setNotification(null)}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      <div className="up-profile-container">
        {/* Header Section */}
        <div className="up-profile-header">
          <h1 className="up-profile-title">My Profile</h1>
          <p className="up-profile-subtitle">
            Manage your personal information and preferences
          </p>
        </div>

        <form onSubmit={handleSubmit} className="up-profile-grid">
          {/* Left Column:  Identity & Avatar */}
          <div className="up-profile-col-left">
            <div className="up-profile-card up-avatar-card">
              <div className="up-avatar-preview-wrapper">
                {formData.personalPhotoUrl ? (
                  <img
                    src={formData.personalPhotoUrl}
                    alt="Profile"
                    className="up-avatar-img"
                  />
                ) : (
                  <div className="up-avatar-placeholder">{getInitials()}</div>
                )}
                {/* Badge Positioned Below */}
                <div className="up-role-badge">{user?.role_name || "User"}</div>
              </div>

              <h2 className="up-user-fullname-display">
                {formData.firstName} {formData.lastName}
              </h2>
              <p className="up-user-username-display">@{user?.username}</p>

              {/* MODERN UPLOAD SECTION */}
              <div className="up-upload-container">
                <input
                  ref={inputRef}
                  type="file"
                  className="up-file-input-hidden"
                  onChange={handleChangeFile}
                  accept="image/*"
                />

                {formData.personalPhotoUrl ? (
                  // STATO 1: Immagine Caricata (Pulsanti Moderni)
                  <div className="up-photo-controls fade-in">
                    <button
                      type="button"
                      className="up-control-btn up-btn-change"
                      onClick={onButtonClick}
                    >
                      <FaPen className="up-btn-icon" />
                      <span>Change Photo</span>
                    </button>
                    <button
                      type="button"
                      className="up-control-btn up-btn-remove"
                      onClick={handleRemovePhoto}
                      title="Remove Photo"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                ) : (
                  // STATO 2: Drag & Drop (Area Moderna)
                  <div
                    className={`up-drag-area ${
                      dragActive ? "up-drag-active" : ""
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={onButtonClick}
                  >
                    <div className="up-drag-content">
                      <div className="up-icon-circle">
                        <FaCloudUploadAlt />
                      </div>
                      <p className="up-drag-text">
                        <strong>Click to upload</strong> or drag here
                      </p>
                      <span className="up-drag-hint">
                        SVG, PNG, JPG (max 5MB)
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {/* END UPLOAD SECTION */}
            </div>

            {!isCitizen && (
              <div className="up-profile-card up-system-info-card">
                <h3>System Info</h3>
                <div className="up-system-row">
                  <span className="up-label-sys">Department Role</span>
                  <span className="up-value">
                    {user?.departmentRole?.name || "None"}
                  </span>
                </div>
                <div className="up-system-row">
                  <span className="up-label-sys">Company ID</span>
                  <span className="up-value">{user?.companyId || "N/A"}</span>
                </div>
              </div>
            )}

            {/* Account Overview - Visible to Everyone */}
            <div className="up-profile-card up-system-info-card">
              <h3>Account Overview</h3>
              <div className="up-system-row">
                <span className="up-label-sys">Member Since</span>
                <span className="up-value">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "-"}
                </span>
              </div>
              <div className="up-system-row">
                <span className="up-label-sys">Verification</span>
                <span
                  className={`up-value up-status-${
                    user?.is_verified ? "verified" : "pending"
                  }`}
                >
                  {user?.is_verified ? "Verified" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column:  Editable Details */}
          <div className="up-profile-col-right">
            {/* Personal Information */}
            <div className="up-profile-card">
              <div className="up-card-header-custom">
                <FaUser className="up-header-icon" />
                <h3>Personal Information</h3>
              </div>
              <div className="up-form-row">
                <div className="up-form-group up-half-width">
                  <label className="up-label">First Name</label>
                  <input
                    type="text"
                    className="up-input"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="up-form-group up-half-width">
                  <label className="up-label">Last Name</label>
                  <input
                    type="text"
                    className="up-input"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="up-profile-card">
              <div className="up-card-header-custom">
                <FaEnvelope className="up-header-icon" />
                <h3>Contact Details</h3>
              </div>
              <div className="up-form-group">
                <label className="up-label">Email Address</label>
                <div className="up-input-with-icon">
                  <FaEnvelope className="up-input-icon" />
                  <input
                    type="email"
                    className="up-input"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div className="up-form-group">
                <label className="up-label">Telegram Username</label>
                <div className="up-input-with-icon">
                  <FaTelegramPlane className="up-input-icon" />
                  <input
                    type="text"
                    className="up-input"
                    name="telegramUsername"
                    value={formData.telegramUsername}
                    readOnly
                    placeholder="Not linked"
                    onClick={() => setShowTelegramModal(true)}
                    /*style={{ cursor: 'pointer' }}*/
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="up-profile-card">
              <div className="up-card-header-custom">
                <FaCheckCircle className="up-header-icon" />
                <h3>Preferences</h3>
              </div>
              <div className="up-setting-row">
                <div className="up-setting-info">
                  <label htmlFor="emailNotif" className="up-label">
                    Email Notifications
                  </label>
                  <p>Receive updates about your reports and city news. </p>
                </div>
                <label className="up-toggle-switch">
                  <input
                    type="checkbox"
                    id="emailNotif"
                    name="emailNotificationsEnabled"
                    checked={formData.emailNotificationsEnabled}
                    onChange={handleChange}
                  />
                  <span className="up-slider up-round"></span>
                </label>
              </div>
            </div>

            {/* Security - Password Change */}
            <div className="up-profile-card">
              <div className="up-card-header-custom">
                <FaLock className="up-header-icon" />
                <h3>Security</h3>
              </div>
              
              <div className="up-form-group">
                <label className="up-label">Current Password</label>
                <div className="up-input-with-icon">
                  <FaLock className="up-input-icon" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    className="up-input"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInput}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="up-password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="up-form-row">
                <div className="up-form-group up-half-width">
                  <label className="up-label">New Password</label>
                  <div className="up-input-with-icon">
                    <FaLock className="up-input-icon" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="up-input"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInput}
                      placeholder="New password"
                    />
                    <button
                      type="button"
                      className="up-password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {/* Password Strength Meter */}
                  {passwordData.newPassword && (
                    <div className="up-password-strength">
                      <div 
                        className="up-strength-bar" 
                        style={{ 
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor: getPasswordStrengthColor() 
                        }}
                      />
                      <span style={{ color: getPasswordStrengthColor() }}>
                        {["Weak", "Fair", "Good", "Strong", "Very Strong"][passwordStrength] || "Weak"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="up-form-group up-half-width">
                  <label className="up-label">Confirm Password</label>
                  <div className="up-input-with-icon">
                    <FaLock className="up-input-icon" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="up-input"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInput}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="up-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="up-password-actions">
                {passwordMessage && (
                  <div className={`up-status-message up-${passwordMessage.type}`}>
                    {passwordMessage.text}
                  </div>
                )}
                <button 
                  type="button" 
                  className="up-btn-secondary"
                  onClick={handlePasswordSubmit}
                  disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword}
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="up-action-bar">
              {message && (
                <div className={`up-status-message up-${message.type}`}>
                  {message.text}
                </div>
              )}
              <button type="submit" className="up-save-btn" disabled={loading}>
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    <FaSave /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Unsaved Changes Modal */}
      {showBlockerModal && (
        <div className="up-modal-overlay">
          <div className="up-modal-content">
            <div className="up-modal-icon-wrapper">
              <FaExclamationTriangle className="up-modal-icon" />
            </div>
            <h3 className="up-modal-title">Unsaved Changes</h3>
            <p className="up-modal-text">
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </p>
            <div className="up-modal-actions">
              <button 
                className="up-btn-modal-cancel" 
                onClick={handleBlockerCancel}
              >
                Stay
              </button>
              <button 
                className="up-btn-modal-confirm" 
                onClick={handleBlockerConfirm}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Link Modal */}
      {showTelegramModal && (
        <TelegramLinkModal 
          onClose={() => setShowTelegramModal(false)} 
          onUpdate={(telegramUsername) => {
            setFormData((prev) => ({
              ...prev,
              telegramUsername: telegramUsername || ""
            }));
            if (onUpdateUser && user) {
              onUpdateUser({
                ...user,
                telegram_username: telegramUsername || null
              });
            }
          }}
        />
      )}
    </div>
  );
}

UserProfile.propTypes = {
  user: PropTypes.shape({
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    email: PropTypes.string,
    telegram_username: PropTypes.string,
    personal_photo_url: PropTypes.string,
    email_notifications_enabled: PropTypes.bool,
    username: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.shape({
      role_name: PropTypes.string,
    })),
    role_name: PropTypes.string,
    departmentRole: PropTypes.shape({
      name: PropTypes.string,
    }),
    companyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    created_at: PropTypes.string,
    is_verified: PropTypes.bool,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onUpdateUser: PropTypes.func,
};
