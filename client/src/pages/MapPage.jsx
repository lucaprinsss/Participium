import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Polygon,
  Tooltip,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaMap,
  FaInfoCircle,
  FaArrowRight,
  FaExternalLinkAlt,
  FaTimes,
} from "react-icons/fa";

// IMPORT API
import {
  getAllCategories,
  getReports,
  getAddressFromCoordinates,
  getReportsByAddress,
} from "../api/reportApi";
import { getCurrentUser } from "../api/authApi";

// IMPORT CUSTOM COMPONENTS & CSS
import "../css/MapPage.css";
import ReportDetails from "../components/ReportDetails";
import MapFiltersBar from "../components/MapFiltersBar";
import MapReportForm from "../components/MapReportForm"; 

// --- ICON CONFIGURATION ---
const createIcon = (colorUrl) => {
  return new L.Icon({
    iconUrl: colorUrl,
    shadowUrl: "/marker/marker_shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    tooltipAnchor: [16, -28],
  });
};

const Icons = {
  blue: createIcon("/marker/marker_blue.png"),
  green: createIcon("/marker/marker_green.png"),
  orange: createIcon("/marker/marker_orange.png"),
  yellow: createIcon("/marker/marker_yellow.png"),
  red: createIcon("/marker/marker_red.png"),
  grey: createIcon("/marker/marker_grey.png"),
  black: createIcon("/marker/marker_black.png"),
};

L.Marker.prototype.options.icon = Icons.blue;

// --- Point-in-Polygon Logic ---
const isPointInMultiPolygon = (point, polygons) => {
  let isInside = false;
  polygons.forEach((polygonGroup) => {
    polygonGroup.forEach((ring, ringIndex) => {
      const coordinates = ring.map((coord) => [coord[0], coord[1]]);
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
    const xi = ring[i][0],
      yi = ring[i][1];
    const xj = ring[j][0],
      yj = ring[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
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

  // UX State
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // --- Filter States ---
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [viewMode, setViewMode] = useState("all");
  const [hideReports, setHideReports] = useState(false);

  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  
  // Logic for address calculation kept here as it depends on marker
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const [locationError, setLocationError] = useState("");

  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // --- AUTO DISMISS NOTIFICATION EFFECT ---
  // Questa logica assicura che QUALSIASI notifica scompaia dopo 4 secondi
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000); // 4 secondi fissi per tutti i messaggi

      // Cleanup: se la notifica cambia prima dei 4 secondi, resetta il timer
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // --- LOGICA COLORE MARKER ---
  const getMarkerIcon = (status) => {
    switch (status) {
      case "Resolved": return Icons.green;
      case "Assigned": return Icons.blue;
      case "In Progress": return Icons.orange;
      case "Pending Approval": return Icons.yellow;
      case "Suspended": return Icons.grey;
      case "Rejected": return Icons.black;
      case "Open": default: return Icons.blue;
    }
  };

  const getLatLngFromReport = (report) => {
    if (!report.location) return null;
    if (report.location.latitude && report.location.longitude) {
      return [report.location.latitude, report.location.longitude];
    }
    if (
      report.location.type === "Point" &&
      Array.isArray(report.location.coordinates)
    ) {
      return [report.location.coordinates[1], report.location.coordinates[0]];
    }
    if (typeof report.location === "string") {
      try {
        const parsed = JSON.parse(report.location);
        if (parsed.coordinates)
          return [parsed.coordinates[1], parsed.coordinates[0]];
      } catch {
        return null;
      }
    }
    return null;
  };

  // --- Map Resize Effect ---
  useEffect(() => {
    if (mapInstance) {
      const timer = setTimeout(() => {
        mapInstance.invalidateSize();
        if (showForm && marker) {
          mapInstance.panTo([marker.lat, marker.lng], {
            animate: true,
            duration: 0.5,
          });
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
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
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
      } catch {
        setNotification({
          message: "Unable to load categories.",
          type: "error",
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const refreshReports = async () => {
    try {
      // Se stiamo "resettando" o caricando all'inizio
      const data = await getReports();
      if (Array.isArray(data)) setExistingReports(data);
    } catch {
      setNotification({
        message: "Unable to load reports on the map.",
        type: "warning",
      });
    }
  };

  useEffect(() => {
    refreshReports();
  }, []);

  // --- HANDLER RICERCA INDIRIZZO ---
  const handleAddressSearch = async (searchText) => {
    // Se la barra di ricerca è vuota, ricarichiamo tutti i report
    if (!searchText || searchText.trim() === "") {
      await refreshReports();
      return;
    }

    try {
      setIsLoadingMap(true);
      const results = await getReportsByAddress(searchText);
      
      if (Array.isArray(results)) {
        setExistingReports(results);
        
        // Notifica per risultati vuoti
        if (results.length === 0) {
          setNotification({
            message: `No reports found for "${searchText}".`,
            type: "info",
          });
        } else {
           // Opzionale: Se volessimo centrare la mappa sul primo risultato
           // servirebbe estrarre le coordinate e usare mapInstance.flyTo
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setNotification({
        message: "Error searching for reports.",
        type: "error",
      });
    } finally {
      setIsLoadingMap(false);
    }
  };

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

        data.features.forEach((feature) => {
          const geometryType = feature.geometry.type;
          const coordinates = feature.geometry.coordinates;

          if (geometryType === "MultiPolygon") {
            coordinates.forEach((polygon) => {
              allPolygons.push(polygon);
              polygon.forEach((ring) => {
                const latLngs = ring.map((coord) => [coord[1], coord[0]]);
                allLatLngs.push(...latLngs);
              });
            });
          } else if (geometryType === "Polygon") {
            allPolygons.push(coordinates);
            coordinates.forEach((ring) => {
              const latLngs = ring.map((coord) => [coord[1], coord[0]]);
              allLatLngs.push(...latLngs);
            });
          }
        });
        setTurinPolygons(allPolygons);
        if (allLatLngs.length > 0) {
          const bounds = L.latLngBounds(allLatLngs);
          setTurinBounds(bounds);
        }
      } catch {
        setNotification({
          message: "Unable to load city boundaries.",
          type: "warning",
        });
      } finally {
        setIsLoadingMap(false);
      }
    };
    loadBoundaries();
  }, []);

  // --- Effect per calcolare l'indirizzo ---
  useEffect(() => {
    if (marker) {
      const fetchAddress = async () => {
        setIsLoadingAddress(true);
        setCurrentAddress("");

        try {
          const addressFound = await getAddressFromCoordinates(
            marker.lat,
            marker.lng
          );
          setCurrentAddress(addressFound);
        } catch (error) {
          console.error("Failed to retrieve address", error);
          setCurrentAddress("Address not found");
        } finally {
          setIsLoadingAddress(false);
        }
      };

      fetchAddress();
    }
  }, [marker]);

  const torinoCenter = [45.0703, 7.6869];

  // --- MAP INTERACTION LOGIC ---
  const handleMapClick = (latlng, isInside = true) => {
    if (showForm) return;

    const { lat, lng } = latlng;

    if (isInside) {
      const newMarker = {
        id: Date.now(),
        lat,
        lng,
      };

      setMarker(newMarker);
      setLocationError("");
    } else {
      setNotification({
        message: "You can only report issues within the boundaries of Turin.",
        type: "error",
      });
      // Il setTimeout manuale è stato rimosso, gestito dall'useEffect
    }
  };

  const handleStartReport = () => {
    setShowForm(true);
  };

  const handleClear = (showInfoNotification = true) => {
    setMarker(null);
    setShowForm(false);
    setCurrentAddress("");
    setIsLoadingAddress(false);
    setLocationError("");

    if (showInfoNotification) {
      setNotification({ message: "Selection cleared.", type: "info" });
      // Il setTimeout manuale è stato rimosso, gestito dall'useEffect
    }
  };

  const handleReportCreated = () => {
    handleClear(false);
    refreshReports();
  };

  const renderPolygons = () => {
    if (!turinData) return null;

    return turinData.features.map((feature, index) => {
      const geometryType = feature.geometry.type;
      const coordinates = feature.geometry.coordinates;
      const pathOptions = {
        fillColor: "var(--brand-red)",
        fillOpacity: 0.1,
        color: "var(--brand-red)",
        weight: 2,
        opacity: 0.8,
      };

      if (geometryType === "MultiPolygon") {
        return coordinates.map((polygon, polyIndex) => (
          <Polygon
            key={`${index}-${polyIndex}`}
            positions={polygon.map((ring) =>
              ring.map((coord) => [coord[1], coord[0]])
            )}
            pathOptions={pathOptions}
          />
        ));
      } else if (geometryType === "Polygon") {
        return (
          <Polygon
            key={index}
            positions={coordinates.map((ring) =>
              ring.map((coord) => [coord[1], coord[0]])
            )}
            pathOptions={pathOptions}
          />
        );
      }
      return null;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved": return "#28a745";
      case "Rejected": return "#dc3545";
      case "Assigned": return "#007bff";
      case "Pending Approval": return "#ffc107";
      default: return "#fd7e14";
    }
  };

  // --- FILTER LOGIC ---
  const filteredReports = existingReports.filter((report) => {
    if (hideReports) return false;
    if (filterCategory !== "All" && report.category !== filterCategory)
      return false;
    if (filterStatus !== "All" && report.status !== filterStatus) return false;
    if (viewMode === "mine") {
      if (!currentUser) return false;
      return report.reporterId === currentUser.id;
    }
    if (
      report.status === "Pending Approval" ||
      report.status === "Rejected"
    )
      return false;
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
            View the status of your reports or create a new one by selecting on
            the map.
          </p>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`mp-notification ${notification.type}`}>
          <div className="mp-notification-content">
            <FaInfoCircle className="mp-notification-icon" />
            <span className="mp-notification-message">
              {notification.message}
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mp-main">
        <div className="mp-section">
          {/* --- FILTER BAR --- */}
          <MapFiltersBar
            categories={categories}
            currentUser={currentUser}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            viewMode={viewMode}
            setViewMode={setViewMode}
            hideReports={hideReports}
            setHideReports={setHideReports}
            onSearch={handleAddressSearch} // Passata la funzione di ricerca
          />

          {/* --- SPLIT LAYOUT CONTAINER --- */}
          <div
            className={`mp-content-split ${showForm ? "is-open" : ""}`}
          >
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
                    className={`mp-leaflet-map ${
                      showForm ? "is-locked" : ""
                    }`}
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
                          className: "mp-cluster-marker",
                          iconSize: L.point(50, 50),
                        });
                      }}
                    >
                      {filteredReports.map((report) => {
                        const position = getLatLngFromReport(report);
                        if (!position) return null;

                        return (
                          <Marker
                            key={report.id}
                            position={position}
                            icon={getMarkerIcon(report.status)}
                            eventHandlers={{
                              click: () => {
                                setSelectedReport(report);
                                setShowDetailModal(true);
                              },
                            }}
                          >
                            <Tooltip
                              direction="top"
                              offset={[0, -28]}
                              opacity={1}
                            >
                              <div
                                className="mp-tooltip-content"
                                style={{
                                  textAlign: "center",
                                  minWidth: "120px",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    marginBottom: "2px",
                                  }}
                                >
                                  {report.title}
                                </div>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#666",
                                    marginBottom: "4px",
                                  }}
                                >
                                  {report.category}
                                </div>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    color: getStatusColor(
                                      report.status
                                    ),
                                    border: `1px solid ${getStatusColor(
                                      report.status
                                    )}`,
                                    borderRadius: "4px",
                                    padding: "2px 6px",
                                    display: "inline-block",
                                  }}
                                >
                                  {report.status}
                                </div>
                                <div
                                  style={{
                                    marginTop: "6px",
                                    fontSize: "10px",
                                    color: "var(--brand-red)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <FaExternalLinkAlt size={10} />{" "}
                                  Click for details
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
                        icon={Icons.red}
                        zIndexOffset={1000}
                        eventHandlers={{
                          click: () => {
                            handleClear(false);
                          },
                        }}
                      >
                        <Tooltip
                          permanent
                          direction="top"
                          offset={[0, -28]}
                        >
                          <b>
                            {isLoadingAddress
                              ? "Locating..."
                              : currentAddress || "Location Selected"}
                          </b>
                          <br />
                          {!showForm ? (
                            <span
                              style={{
                                fontSize: "0.8em",
                                color: "#666",
                              }}
                            >
                              Click marker to remove
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.8em",
                                color: "var(--brand-red)",
                              }}
                            >
                              Position Locked
                            </span>
                          )}
                        </Tooltip>
                      </Marker>
                    )}
                  </MapContainer>
                )}

                {/* Floating Action Bar */}
                {marker && !showForm && (
                  <div className="mp-map-floating-action">
                    <div className="mp-floating-content">
                      <div className="mp-floating-text">
                        <strong>Location Selected</strong>
                        <span>
                          Do you want to report an issue here?
                        </span>
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
              {locationError && (
                <div className="mp-map-error">
                  <FormError message={locationError} />
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: FORM */}
            <div className="mp-form-column" ref={formSectionRef}>
              <MapReportForm 
                marker={marker}
                address={currentAddress}
                isLoadingAddress={isLoadingAddress}
                categories={categories}
                isLoadingCategories={isLoadingCategories}
                onClose={() => handleClear(true)}
                onReportCreated={handleReportCreated}
                setNotification={setNotification}
              />
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