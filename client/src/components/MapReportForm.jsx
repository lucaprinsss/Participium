import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  FaMapMarkerAlt,
  FaCamera,
  FaTimes,
  FaUserSecret,
} from "react-icons/fa";
import { Dropdown } from "react-bootstrap";
import { createReport } from "../api/reportApi";
import "../css/MapReportForm.css";

// Helper components
const FormError = ({ message }) => (
  <div className="mp-form-error">
    <FaTimes />
    <span>{message}</span>
  </div>
);

FormError.propTypes = {
  message: PropTypes.string.isRequired,
};

const MapReportForm = ({
  marker,
  address,
  isLoadingAddress,
  categories,
  isLoadingCategories,
  onClose,
  onReportCreated,
  setNotification,
}) => {
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    is_anonymous: false,
    latitude: "",
    longitude: "",
    address: "",
  });

  const [formErrors, setFormErrors] = useState({
    title: "",
    description: "",
    category: "",
    photos: "",
  });

  // Helper function to show notifications that disappear after 3 seconds
  const handleNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Effect to update formData when marker/address changes from parent
  useEffect(() => {
    if (marker) {
      setFormData((prev) => ({
        ...prev,
        latitude: marker.lat.toFixed(6),
        longitude: marker.lng.toFixed(6),
        address: address || "",
      }));
    } else {
        // Reset form if no marker (though component might be unmounted/hidden)
        setPhotos((prev) => {
            prev.forEach((photo) => URL.revokeObjectURL(photo.preview));
            return [];
        });
        setFormData({
            title: "",
            description: "",
            category: "",
            is_anonymous: false,
            latitude: "",
            longitude: "",
            address: "",
        });
    }
  }, [marker, address]);

  // Clean up photos on unmount
  useEffect(() => {
      return () => {
        photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
      }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (photos.length + files.length > 3) {
      setFormErrors((prev) => ({
        ...prev,
        photos: "Maximum 3 photos allowed.",
      }));
      e.target.value = null;
      return;
    }

    const newPhotos = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
    setFormErrors((prev) => ({ ...prev, photos: "" }));
    e.target.value = null;
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const photoToRemove = prev.find((photo) => photo.id === id);
      if (photoToRemove) URL.revokeObjectURL(photoToRemove.preview);
      return prev.filter((photo) => photo.id !== id);
    });
  };

  const validateForm = () => {
    const errors = {};
    const maxDescLength = 200;

    if (!formData.title.trim()) errors.title = "Title required.";
    else if (formData.title.trim().length < 5)
      errors.title = "Minimum 5 characters.";

    if (!formData.description.trim())
      errors.description = "Description required.";
    else if (formData.description.trim().length < 10)
      errors.description = "Minimum 10 characters.";
    else if (formData.description.length > maxDescLength)
      errors.description = `Max ${maxDescLength} characters.`;
    
    if (!formData.category) errors.category = "Category required.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      handleNotification("Correct errors before submitting.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const base64Photos = await Promise.all(
        photos.map((photo) => convertToBase64(photo.file))
      );

      const reportData = {
        address: formData.address,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: {
          latitude: Number.parseFloat(formData.latitude),
          longitude: Number.parseFloat(formData.longitude),
          address: formData.address,
        },
        photos: base64Photos,
        is_anonymous: formData.is_anonymous,
        isAnonymous: formData.is_anonymous,
      };

      await createReport(reportData);

      handleNotification("Report submitted successfully!", "success");

      // Clear internal state
      setPhotos([]);
      setFormData({
          title: "",
          description: "",
          category: "",
          is_anonymous: false,
          latitude: "",
          longitude: "",
          address: "",
      });

      onReportCreated(); // Notify parent to refresh map
    } catch (error) {
      console.error("Submit error:", error);
      handleNotification(error.message || "Error during submission.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedCategoryName = () =>
    formData.category || "Select Category";

  return (
    <div className="mp-form-card side-panel">
      <div className="mp-form-header-row">
        <h2 className="mp-form-title compact">
          <FaMapMarkerAlt className="mp-form-title-icon" />
          New Report
        </h2>
        <button
          type="button"
          className="mp-close-panel-btn"
          onClick={onClose}
        >
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mp-location-form compact">
        {/* Address Field */}
        <div className="mp-form-group">
          <label className="mp-form-label">Address</label>
          <input
            type="text"
            className="mp-input"
            value={
              isLoadingAddress
                ? "Calculating address..."
                : formData.address
            }
            readOnly
            style={{
              backgroundColor: "var(--bg-lighter)",
              color: "var(--text-muted)",
            }}
          />
        </div>

        {/* Title */}
        <div className="mp-form-group">
          <label htmlFor="title" className="mp-form-label">
            Title <span className="mp-required-asterisk">*</span>
          </label>
          {formErrors.title && <FormError message={formErrors.title} />}
          <input
            type="text"
            id="title"
            className={`mp-input ${formErrors.title ? "is-invalid" : ""}`}
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="Title..."
          />
        </div>

        {/* Category */}
        <div className="mp-form-group">
          <label htmlFor="category" className="mp-form-label">
            Category <span className="mp-required-asterisk">*</span>
          </label>
          {formErrors.category && (
            <FormError message={formErrors.category} />
          )}
          <Dropdown
            onSelect={(value) => handleInputChange("category", value)}
          >
            <Dropdown.Toggle
              className={`mp-modern-dropdown-toggle ${
                formErrors.category ? "is-invalid" : ""
              }`}
              id="cat-drop"
            >
              {isLoadingCategories
                ? "Loading..."
                : getSelectedCategoryName()}
            </Dropdown.Toggle>
            <Dropdown.Menu className="mp-modern-dropdown-menu">
              {categories.map((cat, i) => (
                <Dropdown.Item
                  key={i}
                  eventKey={cat}
                  active={formData.category === cat}
                >
                  {cat}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Description */}
        <div className="mp-form-group">
          <label htmlFor="description" className="mp-form-label">
            Description <span className="mp-required-asterisk">*</span>
          </label>
          {formErrors.description && (
            <FormError message={formErrors.description} />
          )}

          <div className="mp-textarea-wrapper">
            <textarea
              id="description"
              className={`mp-input mp-textarea compact ${
                formErrors.description ? "is-invalid" : ""
              }`}
              value={formData.description}
              onChange={(e) =>
                handleInputChange("description", e.target.value)
              }
              placeholder="Describe the problem in detail..."
              rows="3"
              maxLength={200}
            />
            <span
              className={`mp-char-counter ${
                formData.description.length >= 200 ? "is-limit" : ""
              }`}
            >
              {formData.description.length} / 200
            </span>
          </div>
        </div>

        {/* --- SPLIT ROW FOR PHOTOS & ANONYMOUS --- */}
        <div className="mp-form-row-split">
          {/* Photos - Left Side */}
          <div className="mp-form-group mp-split-item">
            <label className="mp-form-label">
              Photos ({photos.length}/3)
            </label>
            {formErrors.photos && <FormError message={formErrors.photos} />}

            <div className="mp-photo-row">
              {photos.length < 3 && (
                <label htmlFor="photos" className="mp-photo-upload-mini">
                  <FaCamera />
                </label>
              )}
              <input
                type="file"
                id="photos"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="mp-photo-input"
                disabled={photos.length >= 3}
              />

              {photos.map((photo) => (
                <div key={photo.id} className="mp-photo-mini-preview">
                  <img src={photo.preview} alt="Preview" />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Anonymous - Right Side */}
          <div className="mp-split-item">
            <label
              className="mp-form-label"
              style={{ opacity: 0, pointerEvents: "none" }}
            >
              Options
            </label>
            <div className="mp-toggle-group">
              <div className="mp-toggle-info">
                <FaUserSecret
                  className={`mp-toggle-icon-visual ${
                    formData.is_anonymous ? "active" : ""
                  }`}
                />
                <div className="mp-toggle-text">
                  <span className="mp-toggle-title">Anonymous</span>
                  <span className="mp-toggle-subtitle">
                    {formData.is_anonymous ? "Hidden" : "Visible"}
                  </span>
                </div>
              </div>
              <label className="mp-toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.is_anonymous}
                  onChange={(e) =>
                    handleInputChange("is_anonymous", e.target.checked)
                  }
                />
                <span className="mp-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mp-form-actions compact">
          <button
            type="button"
            className="mp-btn secondary sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="mp-btn primary sm"
            disabled={!marker || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </form>
    </div>
  );
};

MapReportForm.propTypes = {
  marker: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  address: PropTypes.string,
  isLoadingAddress: PropTypes.bool.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  isLoadingCategories: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onReportCreated: PropTypes.func.isRequired,
  setNotification: PropTypes.func.isRequired,
};

export default MapReportForm;