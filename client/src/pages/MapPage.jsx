import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Polygon,
  Tooltip
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FaMapMarkerAlt,
  FaTrash,
  FaMap,
  FaInfoCircle,
  FaSave,
  FaCamera,
  FaTimes,
  FaListUl,
  FaExternalLinkAlt,
  FaFilter,
  FaUser,
  FaUsers,
  FaEye,
  FaEyeSlash,
  FaArrowRight
} from 'react-icons/fa';
import { Dropdown } from 'react-bootstrap';

// IMPORT API
import { getAllCategories, createReport, getReports } from '../api/reportApi';
import { getCurrentUser } from '../api/authApi';

import '../css/MapPage.css';
import ReportDetails from "../components/ReportDetails";
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// --- ICON CONFIGURATION ---
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28]
});
L.Marker.prototype.options.icon = DefaultIcon;

const RedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28]
});

// --- Point-in-Polygon Logic ---
const isPointInMultiPolygon = (point, polygons) => {
  let isInside = false;
  polygons.forEach(polygonGroup => {
    polygonGroup.forEach((ring, ringIndex) => {
      const coordinates = ring.map(coord => [coord[0], coord[1]]);
      const ringIsInside = isPointInRing(point, coordinates);
      if (ringIndex === 0 && ringIsInside) {
        isInside = true;
      } else if (ringIndex > 0 && ringIsInside) {
        isInside = false;
      }
    });
  });
  return isInside;
};

const isPointInRing = (point, ring) => {
  const x = point.lng;
  const y = point.lat;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const MapClickHandler = ({ onMapClick, turinPolygons }) => {
  useMapEvents({
    click(e) {
      if (turinPolygons && turinPolygons.length > 0) {
        const point = { lat: e.latlng.lat, lng: e.latlng.lng };
        const isInside = isPointInMultiPolygon(point, turinPolygons);
        onMapClick(e.latlng, isInside);
      } else {
        onMapClick(e.latlng, true);
      }
    },
  });
  return null;
};

const FormError = ({ message }) => (
  <div className="mp-form-error">
    <FaTimes />
    <span>{message}</span>
  </div>
);

const MapPage = () => {
  // --- Refs & Map Instance ---
  const [mapInstance, setMapInstance] = useState(null);
  const formSectionRef = useRef(null);

  // --- States ---
  const [marker, setMarker] = useState(null);
  const [existingReports, setExistingReports] = useState([]);
  const [notification, setNotification] = useState(null);
  const [turinData, setTurinData] = useState(null);
  const [turinBounds, setTurinBounds] = useState(null);
  const [turinPolygons, setTurinPolygons] = useState([]);

  // UX State: Form Visibility
  const [showForm, setShowForm] = useState(false);

  // User State
  const [currentUser, setCurrentUser] = useState(null);

  // --- Filter States ---
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const [viewMode, setViewMode] = useState('all'); // 'all' or 'mine'
  const [hideReports, setHideReports] = useState(false);

  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    is_anonymous: false,
    latitude: '',
    longitude: ''
  });

  const [formErrors, setFormErrors] = useState({
    title: '',
    description: '',
    category: '',
    photos: '',
    location: ''
  });

  const STATUS_OPTIONS = ['Resolved', 'Assigned', "In Progress", "Suspended"];

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const getLatLngFromReport = (report) => {
    if (!report.location) return null;
    if (report.location.latitude && report.location.longitude) {
      return [report.location.latitude, report.location.longitude];
    }
    if (report.location.type === 'Point' && Array.isArray(report.location.coordinates)) {
      return [report.location.coordinates[1], report.location.coordinates[0]];
    }
    if (typeof report.location === 'string') {
      try {
        const parsed = JSON.parse(report.location);
        if (parsed.coordinates) return [parsed.coordinates[1], parsed.coordinates[0]];
      } catch (e) { return null; }
    }
    return null;
  };

  // --- Map Resize Effect ---
  useEffect(() => {
    if (mapInstance) {
      const timer = setTimeout(() => {
        mapInstance.invalidateSize();
        if (showForm && marker) {
          mapInstance.panTo([marker.lat, marker.lng], { animate: true, duration: 0.5 });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showForm, mapInstance, marker]);


  // Load Initial Data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) { console.error("Error fetching current user:", error); }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const data = await getAllCategories();
        if (Array.isArray(data)) setCategories(data);
        else setCategories([]);
      } catch (error) {
        setNotification({ message: 'Unable to load categories.', type: 'error' });
      } finally { setIsLoadingCategories(false); }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchUserReports = async () => {
      try {
        const data = await getReports();
        if (Array.isArray(data)) setExistingReports(data);
      } catch (error) {
        setNotification({ message: 'Unable to load reports on the map.', type: 'warning' });
      }
    };
    fetchUserReports();
  }, []);

  useEffect(() => {
    const loadBoundaries = async () => {
      try {
        setIsLoadingMap(true);
        const response = await fetch("/boundaries_turin_city.geojson");
        if (!response.ok) throw new Error("Failed to fetch GeoJSON");
        const data = await response.json();
        setTurinData(data);

        const allPolygons = [];
        const allLatLngs = [];

        data.features.forEach(feature => {
          const geometryType = feature.geometry.type;
          const coordinates = feature.geometry.coordinates;

          if (geometryType === 'MultiPolygon') {
            coordinates.forEach(polygon => {
              allPolygons.push(polygon);
              polygon.forEach(ring => {
                const latLngs = ring.map(coord => [coord[1], coord[0]]);
                allLatLngs.push(...latLngs);
              });
            });
          } else if (geometryType === 'Polygon') {
            allPolygons.push(coordinates);
            coordinates.forEach(ring => {
              const latLngs = ring.map(coord => [coord[1], coord[0]]);
              allLatLngs.push(...latLngs);
            });
          }
        });
        setTurinPolygons(allPolygons);
        if (allLatLngs.length > 0) {
          const bounds = L.latLngBounds(allLatLngs);
          setTurinBounds(bounds);
        }
      } catch (err) {
        setNotification({ message: 'Unable to load city boundaries.', type: 'warning' });
      } finally { setIsLoadingMap(false); }
    };
    loadBoundaries();
  }, []);

  const torinoCenter = [45.0703, 7.6869];

  // --- MAP INTERACTION LOGIC ---
  const handleMapClick = (latlng, isInside = true) => {
    // MODIFICA CRUCIALE: Se il form è aperto, ignora i click. Il marker è bloccato.
    if (showForm) return;

    const { lat, lng } = latlng;

    if (isInside) {
      const newMarker = {
        id: Date.now(),
        lat,
        lng
      };

      setMarker(newMarker);
      setFormData(prev => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6)
      }));

      setFormErrors(prev => ({ ...prev, location: '' }));
    } else {
      setNotification({
        message: 'You can only report issues within the boundaries of Turin.',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleStartReport = () => {
    setShowForm(true);
  };

  const handleClear = (showNotification = true) => {
    setMarker(null);
    setShowForm(false);
    setFormData({
      title: '',
      description: '',
      category: '',
      is_anonymous: false,
      latitude: '',
      longitude: ''
    });
    setFormErrors({});
    photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos([]);

    const fileInput = document.getElementById('photos');
    if (fileInput) fileInput.value = '';

    if (showNotification) {
      setNotification({ message: 'Selection cleared.', type: 'info' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSelect = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (formErrors[fieldName]) setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (photos.length + files.length > 3) {
      setFormErrors(prev => ({ ...prev, photos: 'Maximum 3 photos allowed.' }));
      e.target.value = null;
      return;
    }

    const newPhotos = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file)
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
    setFormErrors(prev => ({ ...prev, photos: '' }));
    e.target.value = null;
  };

  const removePhoto = (id) => {
    setPhotos(prev => {
      const photoToRemove = prev.find(photo => photo.id === id);
      if (photoToRemove) URL.revokeObjectURL(photoToRemove.preview);
      return prev.filter(photo => photo.id !== id);
    });
  };

  const validateForm = () => {
    const errors = {};
    const maxDescLength = 200; // <--- MODIFICATO: Limite a 200

    if (!formData.title.trim()) errors.title = 'Title required.';
    else if (formData.title.trim().length < 5) errors.title = 'Minimum 5 characters.';

    if (!formData.description.trim()) errors.description = 'Description required.';
    else if (formData.description.trim().length < 10) errors.description = 'Minimum 10 characters.';
    else if (formData.description.length > maxDescLength) errors.description = `Max ${maxDescLength} characters.`;

    // ... (rest of validation)

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setNotification({ message: 'Correct errors before submitting.', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const base64Photos = await Promise.all(photos.map(photo => convertToBase64(photo.file)));

      const reportData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        },
        photos: base64Photos,
        is_anonymous: formData.is_anonymous,
        isAnonymous: formData.is_anonymous
      };

      await createReport(reportData);

      handleClear(false);
      setNotification({ message: 'Report submitted successfully!', type: 'success' });

      const updatedReports = await getReports();
      if (Array.isArray(updatedReports)) setExistingReports(updatedReports);

    } catch (error) {
      console.error('Submit error:', error);
      setNotification({ message: error.message || 'Error during submission.', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const renderPolygons = () => {
    if (!turinData) return null;

    return turinData.features.map((feature, index) => {
      const geometryType = feature.geometry.type;
      const coordinates = feature.geometry.coordinates;
      const pathOptions = {
        fillColor: 'var(--brand-red)',
        fillOpacity: 0.1,
        color: 'var(--brand-red)',
        weight: 2,
        opacity: 0.8,
      };

      if (geometryType === 'MultiPolygon') {
        return coordinates.map((polygon, polyIndex) => (
          <Polygon
            key={`${index}-${polyIndex}`}
            positions={polygon.map(ring => ring.map(coord => [coord[1], coord[0]]))}
            pathOptions={pathOptions}
          />
        ));
      } else if (geometryType === 'Polygon') {
        return (
          <Polygon
            key={index}
            positions={coordinates.map(ring => ring.map(coord => [coord[1], coord[0]]))}
            pathOptions={pathOptions}
          />
        );
      }
      return null;
    });
  };

  const getSelectedCategoryName = () => formData.category || "Select Category";

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#28a745';
      case 'Rejected': return '#dc3545';
      case 'Assigned': return '#007bff';
      case 'Pending Approval': return '#ffc107';
      default: return '#fd7e14';
    }
  };

  // --- FILTER LOGIC ---
  const filteredReports = existingReports.filter(report => {
    if (hideReports) return false;
    if (filterCategory !== 'All' && report.category !== filterCategory) return false;
    if (filterStatus !== 'All' && report.status !== filterStatus) return false;
    if (viewMode === 'mine') {
      if (!currentUser) return false;
      return report.reporter.id === currentUser.id;
    }
    if (report.status === 'Pending Approval' || report.status === 'Rejected') return false;
    return true;
  });

  return (
    <div className="mp-page">
      {/* Header */}
      <header className="mp-header">
        <div className="mp-header-content">
          <h1 className="mp-header-title">
            <FaMap className="mp-title-icon" />
            Turin Map - Your Reports
          </h1>
          <p className="mp-header-subtitle">
            View the status of your reports or create a new one.
          </p>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`mp-notification ${notification.type}`}>
          <div className="mp-notification-content">
            <FaInfoCircle className="mp-notification-icon" />
            <span className="mp-notification-message">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mp-main">
        <div className="mp-section">

          {/* --- FILTER BAR --- */}
          <div className="mp-filters-bar">
            <div className="mp-grid-item">
              <Dropdown onSelect={(k) => setFilterCategory(k)}>
                <Dropdown.Toggle
                  className={`mp-modern-dropdown-toggle ${filterCategory !== 'All' ? 'active' : ''}`}
                  id="filter-category"
                >
                  <div className="mp-truncate-wrapper">
                    <FaFilter className="mp-dropdown-icon" />
                    <span className="mp-btn-text">
                      {filterCategory === 'All' ? 'All Categories' : filterCategory}
                    </span>
                  </div>
                </Dropdown.Toggle>
                <Dropdown.Menu className="mp-modern-dropdown-menu">
                  <Dropdown.Item eventKey="All" active={filterCategory === 'All'}>All Categories</Dropdown.Item>
                  <Dropdown.Divider />
                  {categories.map((cat, idx) => (
                    <Dropdown.Item key={idx} eventKey={cat} active={filterCategory === cat}>
                      {cat}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>

            <div className="mp-grid-item">
              <Dropdown onSelect={(k) => setFilterStatus(k)}>
                <Dropdown.Toggle
                  className={`mp-modern-dropdown-toggle ${filterStatus !== 'All' ? 'active' : ''}`}
                  id="filter-status"
                >
                  <div className="mp-truncate-wrapper">
                    <FaListUl className="mp-dropdown-icon" />
                    <span className="mp-btn-text">
                      {filterStatus === 'All' ? 'All Statuses' : filterStatus}
                    </span>
                  </div>
                </Dropdown.Toggle>
                <Dropdown.Menu className="mp-modern-dropdown-menu">
                  <Dropdown.Item eventKey="All" active={filterStatus === 'All'}>All Statuses</Dropdown.Item>
                  <Dropdown.Divider />
                  {STATUS_OPTIONS.map((status, idx) => (
                    <Dropdown.Item key={idx} eventKey={status} active={filterStatus === status}>
                      {status}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>

            <div className="mp-grid-item">
              <button
                className={`mp-filter-btn ${viewMode === 'mine' ? 'active' : ''}`}
                onClick={() => setViewMode(prev => prev === 'all' ? 'mine' : 'all')}
                disabled={!currentUser}
              >
                {viewMode === 'all' ? (
                  <>
                    <FaUsers className="mp-btn-icon-fix" style={{ marginRight: '8px' }} />
                    All Users
                  </>
                ) : (
                  <>
                    <FaUser className="mp-btn-icon-fix" style={{ marginRight: '8px' }} />
                    My Reports
                  </>
                )}
              </button>
            </div>

            <div className="mp-grid-item">
              <button
                className={`mp-filter-btn ${hideReports ? 'alert-mode' : ''}`}
                onClick={() => setHideReports(!hideReports)}
              >
                {hideReports ? (
                  <>
                    <FaEyeSlash className="mp-btn-icon-fix" style={{ marginRight: '8px' }} />
                    Hidden
                  </>
                ) : (
                  <>
                    <FaEye className="mp-btn-icon-fix" style={{ marginRight: '8px' }} />
                    Visible
                  </>
                )}
              </button>
            </div>
          </div>

          {/* --- SPLIT LAYOUT CONTAINER --- */}
          <div className={`mp-content-split ${showForm ? 'is-open' : ''}`}>

            {/* LEFT COLUMN: MAP */}
            <div className="mp-map-column">
              <div className="mp-container">
                {isLoadingMap ? (
                  <div className="mp-loading">
                    <div className="mp-loading-spinner"></div>
                    <p>Loading map...</p>
                  </div>
                ) : (
                  <MapContainer
                    // MODIFICA CSS: Aggiunta classe is-locked per cambiare il cursore
                    className={`mp-leaflet-map ${showForm ? 'is-locked' : ''}`}
                    center={torinoCenter}
                    zoom={12}
                    scrollWheelZoom={true}
                    maxBounds={turinBounds}
                    maxBoundsViscosity={1.0}
                    ref={setMapInstance}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapClickHandler
                      onMapClick={handleMapClick}
                      turinPolygons={turinPolygons}
                    />

                    {renderPolygons()}

                    <MarkerClusterGroup
                      chunkedLoading
                      spiderfyOnMaxZoom={true}
                      maxClusterRadius={40}
                      iconCreateFunction={(cluster) => {
                        const count = cluster.getChildCount();
                        return L.divIcon({
                          html: `<div class="mp-cluster-icon">${count}</div>`,
                          className: 'mp-cluster-marker',
                          iconSize: L.point(50, 50)
                        });
                      }}>
                      {filteredReports.map((report) => {
                        const position = getLatLngFromReport(report);
                        if (!position) return null;

                        return (
                          <Marker
                            key={report.id}
                            position={position}
                            icon={DefaultIcon}
                            eventHandlers={{
                              click: () => {
                                setSelectedReport(report);
                                setShowDetailModal(true);
                              }
                            }}
                          >
                            <Tooltip direction="top" offset={[0, -28]} opacity={1}>
                              <div className="mp-tooltip-content" style={{ textAlign: 'center', minWidth: '120px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>
                                  {report.title}
                                </div>
                                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                                  {report.category}
                                </div>
                                <div style={{
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: getStatusColor(report.status),
                                  border: `1px solid ${getStatusColor(report.status)}`,
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  display: 'inline-block'
                                }}>
                                  {report.status}
                                </div>
                                <div style={{
                                  marginTop: '6px',
                                  fontSize: '10px',
                                  color: 'var(--brand-red)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px'
                                }}>
                                  <FaExternalLinkAlt size={10} /> Click for details
                                </div>
                              </div>
                            </Tooltip>
                          </Marker>
                        );
                      })}
                    </MarkerClusterGroup>

                    {marker && (
                      <Marker
                        key={`new-${marker.id}`}
                        position={[marker.lat, marker.lng]}
                        icon={RedIcon}
                        zIndexOffset={1000}
                        eventHandlers={{
                          click: () => {
                            // MODIFICA QUI:
                            // Prima: if(!showForm) handleStartReport();
                            // Adesso: Rimuove il marker se cliccato
                            handleClear(false);
                          }
                        }}
                      >
                        <Tooltip permanent direction="top" offset={[0, -28]}>
                          <b>New Location</b><br />
                          {!showForm ? (
                            // Aggiorniamo anche il testo del tooltip per coerenza
                            <span style={{ fontSize: '0.8em', color: '#666' }}>Click marker to remove</span>
                          ) : (
                            <span style={{ fontSize: '0.8em', color: 'var(--brand-red)' }}>Position Locked</span>
                          )}
                        </Tooltip>
                      </Marker>
                    )}
                  </MapContainer>
                )}

                {/* Floating Action Bar stays inside Map Container */}
                {marker && !showForm && (
                  <div className="mp-map-floating-action">
                    <div className="mp-floating-content">
                      <div className="mp-floating-text">
                        <strong>Location Selected</strong>
                        <span>Do you want to report an issue here?</span>
                      </div>
                      <div className="mp-floating-buttons">
                        <button
                          className="mp-btn-floating cancel"
                          onClick={() => handleClear(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="mp-btn-floating confirm"
                          onClick={handleStartReport}
                        >
                          Create Report <FaArrowRight />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {formErrors.location && (
                <div className="mp-map-error">
                  <FormError message={formErrors.location} />
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: FORM (Conditionally visible via CSS) */}
            <div className="mp-form-column" ref={formSectionRef}>
              <div className="mp-form-card side-panel">
                <div className="mp-form-header-row">
                  <h2 className="mp-form-title compact">
                    <FaMapMarkerAlt className="mp-form-title-icon" />
                    New Report
                  </h2>
                  <button type="button" className="mp-close-panel-btn" onClick={() => handleClear()}>
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mp-location-form compact">

                  {/* Coordinates Row (Compact) */}
                  <div className="mp-coords-group compact-coords">
                    <div className="mp-form-group">
                      <label className="mp-form-label-sm">Lat</label>
                      <input type="text" className="mp-input-sm" value={formData.latitude} readOnly />
                    </div>
                    <div className="mp-form-group">
                      <label className="mp-form-label-sm">Lng</label>
                      <input type="text" className="mp-input-sm" value={formData.longitude} readOnly />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mp-form-group">
                    <label htmlFor="title" className="mp-form-label">Title <span className="mp-required-asterisk">*</span></label>
                    {formErrors.title && <FormError message={formErrors.title} />}
                    <input
                      type="text"
                      id="title"
                      className={`mp-input ${formErrors.title ? 'is-invalid' : ''}`}
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Title..."
                    />
                  </div>

                  {/* Category */}
                  <div className="mp-form-group">
                    <label htmlFor="category" className="mp-form-label">Category <span className="mp-required-asterisk">*</span></label>
                    {formErrors.category && <FormError message={formErrors.category} />}
                    <Dropdown onSelect={(value) => handleSelect('category', value)}>
                      <Dropdown.Toggle className={`mp-modern-dropdown-toggle ${formErrors.category ? 'is-invalid' : ''}`} id="cat-drop">
                        {isLoadingCategories ? "Loading..." : getSelectedCategoryName()}
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="mp-modern-dropdown-menu">
                        {categories.map((cat, i) => (
                          <Dropdown.Item key={i} eventKey={cat} active={formData.category === cat}>{cat}</Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>

                  {/* Description */}
                  <div className="mp-form-group">
                    <label htmlFor="description" className="mp-form-label">
                      Description <span className="mp-required-asterisk">*</span>
                    </label>
                    {formErrors.description && <FormError message={formErrors.description} />}

                    {/* WRAPPER PER POSIZIONAMENTO */}
                    <div className="mp-textarea-wrapper">
                      <textarea
                        id="description"
                        className={`mp-input mp-textarea compact ${formErrors.description ? 'is-invalid' : ''}`}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe the problem in detail..."
                        rows="3"
                        maxLength={200} // <--- MODIFICATO: Limite HTML
                      />
                      {/* CONTATORE POSIZIONATO */}
                      <span className={`mp-char-counter ${formData.description.length >= 200 ? 'is-limit' : ''}`}>
                        {formData.description.length} / 200
                      </span>
                    </div>
                  </div>

                  {/* Photos (Compact) */}
                  <div className="mp-form-group">
                    <label className="mp-form-label">Photos ({photos.length}/3)</label>
                    {formErrors.photos && <FormError message={formErrors.photos} />}

                    <div className="mp-photo-row">
                      <label htmlFor="photos" className={`mp-photo-upload-mini ${photos.length >= 3 ? 'disabled' : ''}`}>
                        <FaCamera />
                      </label>
                      <input type="file" id="photos" multiple accept="image/*" onChange={handlePhotoUpload} className="mp-photo-input" disabled={photos.length >= 3} />

                      {photos.map(photo => (
                        <div key={photo.id} className="mp-photo-mini-preview">
                          <img src={photo.preview} alt="Preview" />
                          <button type="button" onClick={() => removePhoto(photo.id)}><FaTimes /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mp-form-actions compact">
                    <button type="button" className="mp-btn secondary sm" onClick={() => handleClear()} disabled={isSubmitting}>
                      Cancel
                    </button>
                    <button type="submit" className="mp-btn primary sm" disabled={!marker || isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Report Detail Modal */}
      <ReportDetails
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        report={selectedReport}
      />
    </div>
  );
};

export default MapPage;