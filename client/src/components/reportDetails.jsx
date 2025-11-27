import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { FaTimes, FaUser, FaMapMarkerAlt } from "react-icons/fa";
import "../css/ReportDetails.css";

const ReportDetails = ({ show, onHide, report }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  if (!report) return null;

  const openImage = (imgUrl) => {
    setSelectedImage(imgUrl);
    setShowImageModal(true);
  };

  const formatLocation = (loc) => {
    if (!loc) return "Location not available";
    if (loc.latitude && loc.longitude) {
      return `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
    }
    if (loc.type === "Point" && Array.isArray(loc.coordinates)) {
      const [lng, lat] = loc.coordinates;
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    return "Location data unavailable";
  };

  const getReporterName = () => {
    if (report.isAnonymous || report.is_anonymous) {
      return "Anonymous User";
    }
    if (report.reporter) {
      return `${report.reporter.first_name} ${report.reporter.last_name}`;
    }
    return "Unknown User";
  };

  // Get photos array
  const photos = report.photos
    ? report.photos.map((p) => (typeof p === "string" ? p : p.storageUrl))
    : report.images || [];

  return (
    <>
      <Modal
        show={show}
        onHide={onHide}
        size="lg"
        centered
        scrollable
        className="rdm-modal"
      >
        <Modal.Header className="rdm-header">
          <div className="rdm-header-content">
            <h2 className="rdm-title">{report.title}</h2>
            <p className="rdm-subtitle">Report ID: #{report.id}</p>
          </div>
          <button className="rdm-close-btn" onClick={onHide}>
            <FaTimes />
          </button>
        </Modal.Header>

        <Modal.Body className="rdm-body">
          {/* Reporter Info Section */}
          <div className="rdm-section">
            <h3 className="rdm-section-title">
              <FaUser className="rdm-section-icon" />
              Reporter Information
            </h3>
            <div className="rdm-info-card">
              <div className="rdm-info-item">
                <span className="rdm-info-label">Name:</span>
                <span className="rdm-info-value">{getReporterName()}</span>
              </div>
              <div className="rdm-info-item">
                <span className="rdm-info-label">
                  <FaMapMarkerAlt className="rdm-location-icon" />
                  Location:
                </span>
                <span className="rdm-info-value">
                  {formatLocation(report.location)}
                </span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="rdm-section">
            <h3 className="rdm-section-title">Description</h3>
            <div className="rdm-description">{report.description}</div>
          </div>

          {/* Photos Section */}
          {photos.length > 0 && (
            <div className="rdm-section">
              <h3 className="rdm-section-title">
                Attached Photos ({photos.length})
              </h3>
              <div className="rdm-photo-grid">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="rdm-photo-item"
                    onClick={() => openImage(photo)}
                  >
                    <img
                      src={photo}
                      alt={`Report photo ${index + 1}`}
                      className="rdm-photo"
                    />
                    <div className="rdm-photo-overlay">
                      <span>Click to enlarge</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Image Lightbox Modal */}
      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        size="xl"
        centered
        className="rdm-lightbox"
      >
        <Modal.Body
          className="rdm-lightbox-body"
          onClick={() => setShowImageModal(false)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            className="rdm-lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
          {/* <button
            className="rdm-lightbox-close"
            onClick={() => setShowImageModal(false)}
          >
            <FaTimes />
          </button> */}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ReportDetails;
