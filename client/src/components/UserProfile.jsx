import React, { useState, useEffect, useRef } from "react";
import {
  FaUser,
  FaEnvelope,
  FaTelegramPlane,
  FaCloudUploadAlt,
  FaSave,
  FaCheckCircle,
  FaPen,
  FaTrashAlt,
} from "react-icons/fa";
import "../css/UserProfile.css";
import { updateUserProfile } from "../api/userApi";

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

  // Stato per gestire il Drag & Drop e File
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null); // NEW: Store base64
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Inizializza il form
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        telegramUsername: user.telegram_username || "", // Fixed: snake_case from API
        personalPhotoUrl: user.personal_photo_url || "", // Fixed: snake_case from API
        emailNotificationsEnabled: user.email_notifications_enabled ?? true, // Fixed: snake_case
      });
    }
  }, [user]);

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

  // ---------------------------------

  // NEW: Real API call
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Prepare data for API (convert to snake_case and camelCase appropriately)
      const updateData = {
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

      console.log("Sending update:", updateData);

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

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error("Update error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update profile. ";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    const f = formData.firstName ? formData.firstName[0].toUpperCase() : "U";
    const l = formData.lastName ? formData.lastName[0].toUpperCase() : "";
    return f + l;
  };

  const isCitizen = user?.role_name === "Citizen";

  return (
    <div className="up-profile-page-wrapper">
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
                {/* Badge Posizionato Sotto */}
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
                <div className="up-system-row">
                  <span className="up-label-sys">Verification</span>
                  <span
                    className={`up-value up-status-${
                      user?.isVerified ? "verified" : "pending"
                    }`}
                  >
                    {user?.isVerified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="up-system-row">
                  <span className="up-label-sys">Member Since</span>
                  <span className="up-value">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </div>
            )}
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
                    readOnly
                    disabled
                    title="First name cannot be changed"
                  />
                </div>
                <div className="up-form-group up-half-width">
                  <label className="up-label">Last Name</label>
                  <input
                    type="text"
                    className="up-input"
                    name="lastName"
                    value={formData.lastName}
                    readOnly
                    disabled
                    title="Last name cannot be changed"
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
                    readOnly
                    disabled
                    title="Email cannot be changed"
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
                    onChange={handleChange}
                    placeholder="e.g.  johndoe"
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
    </div>
  );
}
