import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  useMapEvents,
  Tooltip
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FaMapMarkerAlt,
  FaArrowLeft,
  FaSave,
  FaCamera,
  FaTimes,
  FaTrash,
  FaListUl,
  FaInfoCircle
} from 'react-icons/fa';
import { Dropdown } from 'react-bootstrap';

import { getAllCategories, createReport } from '../api/reportApi';

import '../css/MapPage.css';

// --- LOGICA GEOMETRIA (Copiata per self-containment) ---
const isPointInMultiPolygon = (point, polygons) => {
    // ... stessa logica del tuo file originale ...
    let isInside = false;
    polygons.forEach(polygonGroup => {
        polygonGroup.forEach((ring, ringIndex) => {
            const coordinates = ring.map(coord => [coord[0], coord[1]]);
            const x = point.lng, y = point.lat;
            let inside = false;
            for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
                const xi = coordinates[i][0], yi = coordinates[i][1];
                const xj = coordinates[j][0], yj = coordinates[j][1];
                const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            if (ringIndex === 0 && inside) isInside = true;
            else if (ringIndex > 0 && inside) isInside = false;
        });
    });
    return isInside;
};

// Componente click mappa per inserimento
const LocationPicker = ({ onLocationSelect, turinPolygons }) => {
  useMapEvents({
    click(e) {
      if (turinPolygons.length > 0) {
        const isInside = isPointInMultiPolygon({ lat: e.latlng.lat, lng: e.latlng.lng }, turinPolygons);
        onLocationSelect(e.latlng, isInside);
      } else {
        onLocationSelect(e.latlng, true);
      }
    },
  });
  return null;
};

const RedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const ReportPage = () => {
  const navigate = useNavigate();
  
  const [marker, setMarker] = useState(null);
  const [categories, setCategories] = useState([]);
  const [turinData, setTurinData] = useState(null);
  const [turinPolygons, setTurinPolygons] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    is_anonymous: false,
    latitude: '',
    longitude: ''
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    getAllCategories().then(setCategories).catch(console.error);
    
    // Load GeoJSON per validazione
    fetch("/boundaries_turin_city.geojson")
      .then(res => res.json())
      .then(data => {
        setTurinData(data);
        const allPolygons = [];
        data.features.forEach(f => {
             if (f.geometry.type === 'MultiPolygon') allPolygons.push(...f.geometry.coordinates);
             else if (f.geometry.type === 'Polygon') allPolygons.push(f.geometry.coordinates);
        });
        setTurinPolygons(allPolygons);
      });
  }, []);

  const handleMapClick = (latlng, isInside) => {
    if (isInside) {
      setMarker(latlng);
      setFormData(prev => ({
        ...prev,
        latitude: latlng.lat.toFixed(6),
        longitude: latlng.lng.toFixed(6)
      }));
      setFormErrors(prev => ({ ...prev, location: '' }));
    } else {
      setNotification({ message: 'Please select a location inside Turin.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (photos.length + files.length > 3) return; // Error handling omesso per brevità
    
    const newPhotos = files.map(file => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file)
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validazione base
    if (!formData.title || !formData.description || !formData.category || !marker || photos.length === 0) {
        setNotification({message: "Please fill all required fields and pick a location.", type: "error"});
        return;
    }

    setIsSubmitting(true);
    try {
      const base64Photos = await Promise.all(photos.map(p => convertToBase64(p.file)));
      const payload = {
        ...formData,
        location: { latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude) },
        photos: base64Photos,
        isAnonymous: formData.is_anonymous
      };

      await createReport(payload);
      setNotification({ message: 'Report created successfully!', type: 'success' });
      setTimeout(() => navigate('/map'), 1500); // Torna alla mappa dopo successo
    } catch (error) {
      setNotification({ message: 'Submission failed.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPolygons = () => {
      if (!turinData) return null;
      // Render boundaries per riferimento visivo
      return turinData.features.map((f, i) => {
         const coords = f.geometry.coordinates;
         const opts = { color: '#A12B32', weight: 2, fillOpacity: 0.05 };
         if(f.geometry.type === 'MultiPolygon') return coords.map((p, j) => <Polygon key={`${i}-${j}`} positions={p.map(r=>r.map(c=>[c[1],c[0]]))} pathOptions={opts}/>);
         return <Polygon key={i} positions={coords.map(r=>r.map(c=>[c[1],c[0]]))} pathOptions={opts}/>;
      });
  };

  return (
    <div className="mp-page submit-mode">
      <header className="mp-header">
        <div className="mp-header-content">
            <button className="mp-btn secondary back-btn" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Back
            </button>
            <h1 className="mp-header-title">Create New Report</h1>
        </div>
      </header>

      {notification && (
        <div className={`mp-notification ${notification.type}`}>
            <FaInfoCircle /> {notification.message}
        </div>
      )}

      <main className="mp-main split-layout">
        {/* Sinistra: Mappa per selezione */}
        <div className="mp-section map-picker">
           <div className="mp-container picker-container">
             <MapContainer center={[45.0703, 7.6869]} zoom={12} className="mp-leaflet-map">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {renderPolygons()}
                <LocationPicker onLocationSelect={handleMapClick} turinPolygons={turinPolygons} />
                {marker && <Marker position={marker} icon={RedIcon} />}
             </MapContainer>
             <div className="picker-hint">Click on the map to set location</div>
           </div>
        </div>

        {/* Destra: Form */}
        <div className="mp-form-section">
          <div className="mp-form-card">
            <h2 className="mp-form-title"><FaMapMarkerAlt /> Report Details</h2>
            <form onSubmit={handleSubmit} className="mp-location-form">
               
               {/* Location Readonly */}
               <div className="mp-coords-group">
                  <div className="mp-form-group">
                    <label className="mp-form-label">Latitude</label>
                    <input className="mp-input" value={formData.latitude} readOnly placeholder="Select on map" />
                  </div>
                  <div className="mp-form-group">
                    <label className="mp-form-label">Longitude</label>
                    <input className="mp-input" value={formData.longitude} readOnly placeholder="Select on map" />
                  </div>
               </div>

               <div className="mp-form-group">
                  <label className="mp-form-label">Title *</label>
                  <input className="mp-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
               </div>

               <div className="mp-form-group">
                  <label className="mp-form-label">Category *</label>
                  <Dropdown onSelect={k => setFormData({...formData, category: k})}>
                     <Dropdown.Toggle className="mp-modern-dropdown-toggle">
                        <FaListUl className="mp-dropdown-icon" /> {formData.category || "Select Category"}
                     </Dropdown.Toggle>
                     <Dropdown.Menu className="mp-modern-dropdown-menu">
                        {categories.map((c, i) => <Dropdown.Item key={i} eventKey={c}>{c}</Dropdown.Item>)}
                     </Dropdown.Menu>
                  </Dropdown>
               </div>

               <div className="mp-form-group">
                  <label className="mp-form-label">Description *</label>
                  <textarea className="mp-input mp-textarea" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
               </div>

               <div className="mp-form-group">
                   <label className="mp-form-label">Photos ({photos.length}/3) *</label>
                   <div className="mp-photo-upload-area">
                      <input type="file" id="ph" multiple accept="image/*" onChange={handlePhotoUpload} className="mp-photo-input" />
                      <label htmlFor="ph" className="mp-photo-upload-label"><FaCamera /> Add Photos</label>
                   </div>
                   <div className="mp-photo-previews">
                      {photos.map(p => (
                          <div key={p.id} className="mp-photo-preview">
                              <img src={p.preview} alt="" />
                              <button type="button" className="mp-photo-remove-btn" onClick={() => setPhotos(photos.filter(x => x.id !== p.id))}><FaTimes/></button>
                          </div>
                      ))}
                   </div>
               </div>

               <div className="mp-form-actions">
                  <button type="submit" className="mp-btn primary" disabled={isSubmitting || !marker}>
                      <FaSave /> {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportPage;