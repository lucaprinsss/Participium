import React, { useState, useEffect } from 'react';
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
  FaUserSecret,
  FaUser,
  FaListUl,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { Dropdown } from 'react-bootstrap';

// IMPORT API
import { getAllCategories, createReport, getReports } from '../api/reportApi';

import '../css/MapPage.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// --- CONFIGURAZIONE ICONE ---
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
  const [marker, setMarker] = useState(null);
  const [existingReports, setExistingReports] = useState([]);
  const [notification, setNotification] = useState(null);
  const [turinData, setTurinData] = useState(null);
  const [turinBounds, setTurinBounds] = useState(null);
  const [turinPolygons, setTurinPolygons] = useState([]);

  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 1. Caricamento Categorie
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const data = await getAllCategories();
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Errore categorie:", error);
        setNotification({
          message: 'Impossibile caricare le categorie.',
          type: 'error'
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // 2. Caricamento Report dell'Utente Loggato
  useEffect(() => {
    const fetchUserReports = async () => {
      try {
        const data = await getReports();
        if (Array.isArray(data)) {
          setExistingReports(data);
        }
      } catch (error) {
        console.error("Errore fetch user reports:", error);
        setNotification({
          message: 'Impossibile caricare i tuoi report sulla mappa.',
          type: 'warning'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    };
    fetchUserReports();
  }, []);

  // 3. Caricamento GeoJSON Confini
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
        console.error("Error loading GeoJSON:", err);
        setNotification({
          message: 'Unable to load city boundaries. Validation disabled.',
          type: 'warning'
        });
      } finally {
        setIsLoadingMap(false);
      }
    };

    loadBoundaries();
  }, []);

  const torinoCenter = [45.0703, 7.6869];

  const handleMapClick = (latlng, isInside = true) => {
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

      setNotification({
        message: 'Posizione impostata. Compila il form per inviare.',
        type: 'success'
      });
    } else {
      setNotification({
        message: 'Puoi segnalare problemi solo all\'interno dei confini di Torino.',
        type: 'error'
      });
    }

    setTimeout(() => setNotification(null), 5000);
  };

  const handleClear = (showNotification = true) => {
    setMarker(null);
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

    // Reset manuale dell'input file se presente nel DOM (opzionale, gestito meglio in handlePhotoUpload)
    const fileInput = document.getElementById('photos');
    if (fileInput) fileInput.value = '';

    if (showNotification) {
      setNotification({ message: 'Form resettato.', type: 'info' });
      setTimeout(() => setNotification(null), 5000);
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

  // --- CORREZIONE 2: Reset del valore input per permettere il re-upload ---
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Se non ci sono file (es. utente preme annulla), non fare nulla
    if (files.length === 0) return;

    if (photos.length + files.length > 3) {
      setFormErrors(prev => ({ ...prev, photos: 'Massimo 3 foto consentite.' }));
      // Importante: resetta l'input anche in caso di errore
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
    
    // Resetta il valore dell'input per permettere di caricare lo stesso file se viene rimosso
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
    const maxDescLength = 250;

    if (!formData.title.trim()) errors.title = 'Titolo richiesto.';
    else if (formData.title.trim().length < 5) errors.title = 'Minimo 5 caratteri.';

    if (!formData.description.trim()) errors.description = 'Descrizione richiesta.';
    else if (formData.description.trim().length < 10) errors.description = 'Minimo 10 caratteri.';
    else if (formData.description.length > maxDescLength) errors.description = `Max ${maxDescLength} caratteri.`;

    if (!formData.category) errors.category = 'Seleziona una categoria.';
    if (photos.length === 0) errors.photos = 'Carica almeno una foto.';
    if (!marker) errors.location = 'Posiziona un marker sulla mappa.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setNotification({ message: 'Correggi gli errori prima di inviare.', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const base64Photos = await Promise.all(photos.map(photo => convertToBase64(photo.file)));

      // --- CORREZIONE 1: Gestione corretta del payload per evitare l'errore DB ---
      // Assicuriamoci che il backend riceva il formato che si aspetta (spesso snake_case)
      const reportData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        },
        photos: base64Photos,
        // Invia il flag in snake_case per compatibilità col database/backend
        is_anonymous: formData.is_anonymous,
        // Mantieni anche camelCase se il backend è ibrido, ma is_anonymous è cruciale per i DB
        isAnonymous: formData.is_anonymous 
      };

      console.log('REPORT CREATO: ', reportData);
      console.log("FOTO: ", reportData.photos)
      await createReport(reportData);
      

      // 1. Pulisci il form SENZA mostrare la notifica di reset
      handleClear(false);

      // 2. Imposta la notifica di successo
      setNotification({ message: 'Segnalazione inviata con successo!', type: 'success' });

      // Ricarica la lista per vedere il nuovo report sulla mappa
      const updatedReports = await getReports();
      if (Array.isArray(updatedReports)) setExistingReports(updatedReports);

    } catch (error) {
      console.error('Submit error:', error);
      setNotification({ message: error.message || 'Errore durante l\'invio.', type: 'error' });
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

  const getSelectedCategoryName = () => formData.category || "Seleziona Categoria";

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#28a745'; // Verde
      case 'Rejected': return '#dc3545'; // Rosso
      case 'Assigned': return '#007bff'; // Blu
      case 'Pending Approval': return '#ffc107'; // Giallo
      default: return '#fd7e14'; // Arancione
    }
  };

  return (
    <div className="mp-page">
      {/* Header */}
      <header className="mp-header">
        <div className="mp-header-content">
          <h1 className="mp-header-title">
            <FaMap className="mp-title-icon" />
            Torino Map - Le Tue Segnalazioni
          </h1>
          <p className="mp-header-subtitle">
            Visualizza lo stato delle tue segnalazioni o creane una nuova.
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
        {/* Map Container */}
        <div className="mp-section">
          <div className="mp-container">
            {isLoadingMap ? (
              <div className="mp-loading">
                <div className="mp-loading-spinner"></div>
                <p>Caricamento mappa...</p>
              </div>
            ) : (
              <MapContainer
                className="mp-leaflet-map"
                center={torinoCenter}
                zoom={12}
                scrollWheelZoom={true}
                maxBounds={turinBounds}
                maxBoundsViscosity={1.0}
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

                {/* --- CLUSTERING DEI REPORT ESISTENTI --- */}
                <MarkerClusterGroup
                  chunkedLoading
                  spiderfyOnMaxZoom={true}
                  maxClusterRadius={40}
                >
                  {existingReports.map((report) => {
                    const position = getLatLngFromReport(report);
                    if (!position) return null;

                    return (
                      <Marker
                        key={report.id}
                        position={position}
                        icon={DefaultIcon}
                        eventHandlers={{
                          click: () => {
                            window.open(`/reports/${report.id}`, '_blank', 'noopener,noreferrer');
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
                              <FaExternalLinkAlt size={10} /> Clicca per dettagli
                            </div>
                          </div>
                        </Tooltip>
                      </Marker>
                    );
                  })}
                </MarkerClusterGroup>

                {/* --- MARKER DI CREAZIONE (Rosso) --- */}
                {marker && (
                  <Marker
                    key={`new-${marker.id}`}
                    position={[marker.lat, marker.lng]}
                    icon={RedIcon}
                    zIndexOffset={1000}
                    eventHandlers={{
                      click: () => handleClear()
                    }}
                  >
                    <Tooltip permanent direction="top" offset={[0, -28]}>
                      <b>Nuova Segnalazione</b><br />
                      <span style={{ fontSize: '0.8em' }}>Compila il form sotto</span>
                    </Tooltip>
                  </Marker>
                )}
              </MapContainer>
            )}
          </div>
          {formErrors.location && (
            <div className="mp-map-error">
              <FormError message={formErrors.location} />
            </div>
          )}
        </div>

        {/* Form Section */}
        <div className="mp-form-section">
          <div className="mp-form-card">
            <h2 className="mp-form-title">
              <FaMapMarkerAlt className="mp-form-title-icon" />
              Dettagli Segnalazione
            </h2>

            <form onSubmit={handleSubmit} className="mp-location-form">
              {/* Coordinates Section */}
              <div className="mp-coords-section">
                <h3 className="mp-coords-title">Coordinate Location</h3>
                <div className="mp-coords-group">
                  <div className="mp-form-group">
                    <label htmlFor="latitude" className="mp-form-label">Latitudine</label>
                    <input
                      type="text"
                      id="latitude"
                      className="mp-input"
                      value={formData.latitude}
                      readOnly
                      placeholder="Clicca sulla mappa"
                    />
                  </div>
                  <div className="mp-form-group">
                    <label htmlFor="longitude" className="mp-form-label">Longitudine</label>
                    <input
                      type="text"
                      id="longitude"
                      className="mp-input"
                      value={formData.longitude}
                      readOnly
                      placeholder="Clicca sulla mappa"
                    />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="mp-form-group">
                <label htmlFor="title" className="mp-form-label">
                  Titolo <span className="mp-required-asterisk">*</span>
                </label>
                {formErrors.title && <FormError message={formErrors.title} />}
                <input
                  type="text"
                  id="title"
                  className={`mp-input ${formErrors.title ? 'is-invalid' : ''}`}
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Inserisci un titolo descrittivo..."
                />
              </div>

              {/* Description */}
              <div className="mp-form-group">
                <label htmlFor="description" className="mp-form-label">
                  Descrizione <span className="mp-required-asterisk">*</span>
                </label>
                {formErrors.description && <FormError message={formErrors.description} />}
                <div className="mp-textarea-wrapper">
                  <textarea
                    id="description"
                    className={`mp-input mp-textarea ${formErrors.description ? 'is-invalid' : ''}`}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descrivi il problema in dettaglio..."
                    rows="4"
                    maxLength={250}
                  />
                  <span className={`mp-char-counter ${formData.description.length >= 250 ? 'is-limit' : ''}`}>
                    {formData.description.length} / 250
                  </span>
                </div>
              </div>

              {/* CATEGORY DROPDOWN */}
              <div className="mp-form-group">
                <label htmlFor="category-dropdown" className="mp-form-label">
                  Categoria <span className="mp-required-asterisk">*</span>
                </label>
                {formErrors.category && <FormError message={formErrors.category} />}
                <Dropdown onSelect={(value) => handleSelect('category', value)}>
                  <Dropdown.Toggle
                    className={`mp-modern-dropdown-toggle ${formErrors.category ? 'is-invalid' : ''}`}
                    disabled={isSubmitting || isLoadingCategories}
                    id="category-dropdown"
                  >
                    <FaListUl className="mp-dropdown-icon" />
                    <span className="mp-dropdown-toggle-text">
                      {isLoadingCategories ? "Caricamento..." : getSelectedCategoryName()}
                    </span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="mp-modern-dropdown-menu">
                    {!isLoadingCategories && categories.length > 0 ? (
                      categories.map((cat, index) => (
                        <Dropdown.Item
                          key={index}
                          eventKey={cat}
                          active={formData.category === cat}
                          title={cat}
                        >
                          {cat}
                        </Dropdown.Item>
                      ))
                    ) : (
                      <Dropdown.Item disabled>Nessuna categoria</Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Photo Upload */}
              <div className="mp-form-group">
                <label className="mp-form-label">
                  Foto <span className="mp-required-asterisk">*</span> ({photos.length}/3)
                </label>
                {formErrors.photos && <FormError message={formErrors.photos} />}
                <div className="mp-photo-upload-area">
                  <input
                    type="file"
                    id="photos"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="mp-photo-input"
                    disabled={photos.length >= 3}
                  />
                  <label htmlFor="photos" className={`mp-photo-upload-label ${photos.length >= 3 ? 'is-disabled' : ''}`}>
                    <FaCamera className="mp-photo-upload-icon" />
                    <span>{photos.length >= 3 ? 'Max 3 foto raggiunte' : 'Aggiungi Foto'}</span>
                  </label>
                </div>

                {photos.length > 0 && (
                  <div className="mp-photo-previews">
                    {photos.map(photo => (
                      <div key={photo.id} className="mp-photo-preview">
                        <img src={photo.preview} alt="Preview" />
                        <button
                          type="button"
                          className="mp-photo-remove-btn"
                          onClick={() => removePhoto(photo.id)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <small className="mp-help-text">
                  Richiesta almeno 1 foto, massimo 3.
                </small>
              </div>

              {/* TODO: Anonymous Checkbox */}
              {/* <div className="mp-form-group">
                <label className="mp-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_anonymous}
                    onChange={(e) => handleInputChange('is_anonymous', e.target.checked)}
                    className="mp-checkbox-input"
                  />
                  <span className="mp-checkbox-icon">
                    {formData.is_anonymous ? <FaUserSecret /> : <FaUser />}
                  </span>
                  <span className="mp-checkbox-text">Invia in anonimo</span>
                </label>
              </div> */}

              {/* Form Actions */}
              <div className="mp-form-actions">
                <button
                  type="button"
                  className="mp-btn secondary"
                  onClick={() => handleClear()}
                  disabled={isSubmitting}
                >
                  <FaTrash className="mp-btn-icon" />
                  Svuota
                </button>

                <button
                  type="submit"
                  className="mp-btn primary"
                  disabled={!marker || isSubmitting}
                >
                  <FaSave className="mp-btn-icon" />
                  {isSubmitting ? 'Invio in corso...' : 'Invia Segnalazione'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MapPage;