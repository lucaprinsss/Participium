import { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Modal, Form, Alert, Row, Col, Dropdown, Spinner } from 'react-bootstrap';
import { BsEye, BsCheckCircle, BsXCircle, BsGeoAlt, BsPerson, BsCalendar3, BsExclamationTriangle } from 'react-icons/bs';
import { FaFilter, FaList } from "react-icons/fa"; 
import '../css/MunicipalityUserHome.css';

// IMPORT API
import {
  getReports,
  getAllCategories,
  approveReport,
  rejectReport,
  getReportsAssignedToMe,
} from "../api/reportApi";

const ALL_STATUSES = ["Pending Approval", "Assigned", "In Progress", "Suspended", "Rejected", "Resolved"];

export default function MunicipalityUserHome({user}) {
  console.log("🔍 MunicipalityUserHome received user:", user);
  const [reports, setReports] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending Approval");

  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Gestione Errori Modale
  const [errorMsg, setErrorMsg] = useState("");
  const [shakeKey, setShakeKey] = useState(0);

  const [apiError, setApiError] = useState(null);
  // Department to Category Mapping
  const getDepartmentCategory = (roleName) => {
    if (!roleName) return null;
    const normalizedRole = roleName.toLowerCase();
    const mapping = {
      "water network staff member": "Water Supply - Drinking Water",
      "sewer system staff member": "Sewer System",

      // Roads & Traffic
      "road maintenance staff member": "Road Signs and Traffic Lights",
      "traffic management staff member": "Road Signs and Traffic Lights",

      // Public Infrastructure
      "electrical staff member": "Public Lighting",
      "building maintenance staff member": "Architectural Barriers",
      "accessibility staff member": "Architectural Barriers",

      // Waste & Recycling
      "recycling program staff member": "Waste",

      // Parks & Green Areas
      "parks maintenance staff member": "Parks and Recreation",
    };

    return mapping[normalizedRole] || null;
  };

  // Check if user is staff (not admin)
  const isStaffMember =
    user &&
    user.role_name &&
    user.role_name.toLowerCase() !== "administrator" &&
    user.role_name.toLowerCase() !== "municipal public relations officer";
const userDepartmentCategory = isStaffMember
  ? getDepartmentCategory(user.role_name)
  : null;
  // Auto-set filters for staff members
  useEffect(() => {
    if (isStaffMember && userDepartmentCategory) {
      console.log("🔒 Staff member detected:", user.role_name);
      console.log("📂 Auto-filtering category:", userDepartmentCategory);
      setCategoryFilter(userDepartmentCategory);
      setStatusFilter("Assigned");
    } else if (
      user &&
      (user.role_name === "Administrator" ||
        user.role_name.toLowerCase() === "municipal public relations officer")
    ) {
      console.log("👑 Admin/PR Officer detected - showing Pending Approval");
      setStatusFilter("Pending Approval");
    }
  }, [user, isStaffMember, userDepartmentCategory]);

  // --- DATA FETCHING ---
const fetchData = async () => {
  setIsLoading(true);
  try {
    const categoriesData = await getAllCategories();
    setAllCategories(categoriesData || []);

    // Use different endpoint based on user role
    let reportsData;
    if (isStaffMember) {
      // Staff members: get only their assigned reports
      console.log("📋 Fetching reports assigned to:", user.username);
      reportsData = await getReportsAssignedToMe();
    } else {
      // Admin/PR Officer: get all reports
      console.log("👑 Fetching all reports (Admin/PR)");
      reportsData = await getReports();
    }

    console.log("REPORT TROVATI:", reportsData);

    const formattedReports = reportsData.map((report) => ({
      ...report,
      createdAt: new Date(report.createdAt),

      images: report.photos
        ? report.photos.map((p) => (typeof p === "string" ? p : p.storageUrl))
        : [],
    }));

    // Ordina per data (più recente prima)
    formattedReports.sort((a, b) => b.createdAt - a.createdAt);

    setReports(formattedReports);
    setApiError(null);
  } catch (err) {
    console.error("Error fetching data:", err);
    setApiError("Impossibile caricare i dati.  Riprova più tardi.");
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, [isStaffMember]);

  // --- Helpers ---
  const formatLocation = (loc) => {
    if (!loc) return "Posizione non disponibile";
    if (
      typeof loc === "object" &&
      loc.type === "Point" &&
      Array.isArray(loc.coordinates)
    ) {
      const [lng, lat] = loc.coordinates;
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    if (typeof loc === "string") return loc;
    return "Dati posizione non validi";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending Approval":
        return "warning";
      case "Assigned":
        return "primary";
      case "In Progress":
        return "info";
      case "Resolved":
        return "success";
      case "Rejected":
        return "danger";
      default:
        return "secondary";
    }
  };

  const handleCategorySelect = (val) => setCategoryFilter(val);
  const handleStatusSelect = (val) => setStatusFilter(val);

const filteredReports = reports.filter((report) => {
  const categoryMatch =
    categoryFilter === "" || report.category === categoryFilter;
  const statusMatch = statusFilter === "" || report.status === statusFilter;

  // Backend already filters by assignee for staff members
  // Just apply the UI filters (category and status)
  return categoryMatch && statusMatch;
});

  // Error handling helpers
  const triggerError = (msg) => {
    setErrorMsg(msg);
    setShakeKey((prev) => prev + 1);
  };

  const clearError = () => {
    setErrorMsg("");
  };

  // --- Modal Actions ---
  const handleClose = () => {
    setShowModal(false);
    setSelectedReport(null);
    setIsRejecting(false);
    setRejectionReason("");
    clearError();
  };

  const handleShow = (report) => {
    setSelectedReport(report);
    clearError();
    setShowModal(true);
  };

  const openImage = (imgUrl) => {
    setSelectedImage(imgUrl);
    setShowImageModal(true);
  };

  // --- API ACTIONS ---

  const handleAccept = async () => {
    if (!selectedReport) return;
    clearError();

    try {
      await approveReport(selectedReport.id);
      await fetchData();
      handleClose();
    } catch (error) {
      console.error("Error approving report:", error);
      triggerError(
        error.message || "Errore sconosciuto durante l'approvazione."
      );
    }
  };

  const handleRejectClick = () => {
    clearError();
    setIsRejecting(true);
  };

  const handleCancelReject = () => {
    clearError();
    setIsRejecting(false);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      triggerError("Please provide a reason for rejection.");
      return;
    }

    if (!selectedReport) return;

    try {
      await rejectReport(selectedReport.id, rejectionReason);
      await fetchData();
      handleClose();
    } catch (error) {
      console.error("Error rejecting report:", error);
      triggerError(error.message || "Errore sconosciuto durante il rifiuto.");
    }
  };

  return (
    <Container className="mu-home-container">
      <div className="mu-header-wrapper">
        <div>
          <h2 className="mu-home-title">Officer Dashboard</h2>
          <p className="mu-home-subtitle">
            Manage and validate citizen reports.
          </p>
        </div>

       <div className="mu-filters">
  {/* Only show dropdowns for Admin */}
  {! isStaffMember ?  (
    <>
      <Dropdown onSelect={handleCategorySelect} className="mu-filter-dropdown">
        <Dropdown.Toggle className="modern-dropdown-toggle" id="category-filter">
          <FaList className="dropdown-icon" />
          <span className="dropdown-toggle-text">
            {categoryFilter || "All Categories"}
          </span>
        </Dropdown.Toggle>
        <Dropdown.Menu className="modern-dropdown-menu">
          <Dropdown.Item eventKey="" active={categoryFilter === ""}>All Categories</Dropdown.Item>
          {allCategories.map((cat, idx) => (
            <Dropdown.Item key={idx} eventKey={cat} active={categoryFilter === cat}>{cat}</Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>

      <Dropdown onSelect={handleStatusSelect} className="mu-filter-dropdown">
        <Dropdown.Toggle className="modern-dropdown-toggle" id="status-filter">
          <FaFilter className="dropdown-icon" />
          <span className="dropdown-toggle-text">
            {statusFilter || "All Statuses"}
          </span>
        </Dropdown.Toggle>
        <Dropdown.Menu className="modern-dropdown-menu">
          <Dropdown.Item eventKey="" active={statusFilter === ""}>All Statuses</Dropdown.Item>
          {ALL_STATUSES.map((st, idx) => {
            return (
              <Dropdown.Item key={idx} eventKey={st} active={statusFilter === st}>{st}</Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
    </>
  ) : (
    /* Show locked filter info for Staff */
    <div className="text-muted" style={{ fontSize: '0.9rem', padding: '8px 16px', background: '#f8f9fa', borderRadius: '8px' }}>
      Viewing: <strong>{userDepartmentCategory}</strong>  Status: <strong>Assigned</strong>
    </div>
  )}
</div>
      </div>  

      {apiError && (
        <Alert variant="danger" onClose={() => setApiError(null)} dismissible>
          {apiError}
        </Alert>
      )}

      <Card className="mu-home-card">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <h5>No reports found</h5>
              <p>Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <Table responsive hover className="mu-table mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Category</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <span className="fw-bold text-secondary">
                        {report.category}
                      </span>
                    </td>
                    <td>{report.title}</td>
                    <td>{report.createdAt.toLocaleDateString()}</td>
                    <td>
                      <Badge bg={getStatusBadge(report.status)}>
                        {report.status}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="rounded-pill px-3"
                        onClick={() => handleShow(report)}
                      >
                        <BsEye className="me-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* --- Detail Modal --- */}
      <Modal
        show={showModal}
        onHide={handleClose}
        size="lg"
        centered
        scrollable
      >
        {selectedReport && (
          <>
            <Modal.Header closeButton className="bg-light">
              <div>
                <Modal.Title className="text-danger mb-1">
                  {selectedReport.title}
                </Modal.Title>
                <small className="text-muted">
                  Report ID: #{selectedReport.id}
                </small>
              </div>
            </Modal.Header>
            <Modal.Body>
              <Row className="g-3">
                <Col md={6}>
                  <div className="p-3 border rounded bg-light h-100">
                    <h6 className="text-muted small text-uppercase mb-2">
                      Status
                    </h6>
                    <Badge
                      bg={getStatusBadge(selectedReport.status)}
                      className="fs-6 mb-2"
                    >
                      {selectedReport.status}
                    </Badge>
                    <div className="small text-muted d-flex align-items-center gap-2">
                      <BsCalendar3 />{" "}
                      {selectedReport.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="p-3 border rounded bg-light h-100">
                    <h6 className="text-muted small text-uppercase mb-2">
                      Reporter Info
                    </h6>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <BsPerson className="text-primary" />
                      <span className="fw-bold">
                        {selectedReport.isAnonymous
                          ? "Anonymous User"
                          : selectedReport.reporter
                          ? `${selectedReport.reporter.first_name} ${selectedReport.reporter.last_name}`
                          : "Unknown User"}
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2 text-muted small text-truncate">
                      <BsGeoAlt /> {formatLocation(selectedReport.location)}
                    </div>
                  </div>
                </Col>
                <Col xs={12}>
                  <h6 className="text-danger fw-bold mt-2">Description</h6>
                  <p>{selectedReport.description}</p>
                </Col>
                {/* Only show photos to Admin/PR Officer, hide from staff */}
{! isStaffMember && (
  <Col xs={12}>
    <h6 className="text-primary fw-bold">
      Attached Photos ({selectedReport.images.length})
    </h6>
    {selectedReport.images.length > 0 ? (
      <div className="d-flex flex-wrap gap-3">
        {selectedReport.images. map((img, index) => (
          <div
            key={index}
            className="mu-report-img-container"
            onClick={() => openImage(img)}
          >
            <img
              src={img}
              alt={`Attachment ${index}`}
              className="mu-report-img"
            />
            <div className="mu-img-overlay">
              <BsEye className="text-white fs-3" />
            </div>
          </div>
        ))}
      </div>
          ) : (
            <p className="text-muted fst-italic small">No images.</p>
          )}
        </Col>
          )}

                {/* Error Message Area */}
                {errorMsg && (
                  <Col xs={12}>
                    <div
                      key={shakeKey}
                      className="mu-alert-error animate-shake"
                    >
                      <BsExclamationTriangle className="mu-alert-icon" />
                      <span>{errorMsg}</span>
                    </div>
                  </Col>
                )}
              </Row>

              {/* Actions */}
              {selectedReport.status === "Pending Approval" && (
                <div className="mt-4 pt-3 border-top">
                  {!isRejecting ? (
                    <div className="d-flex gap-2 justify-content-end">
                      <Button
                        variant="outline-danger"
                        onClick={handleRejectClick}
                      >
                        <BsXCircle className="me-2" /> Reject Report
                      </Button>
                      <Button
                        variant="success"
                        onClick={handleAccept}
                        className="text-white"
                      >
                        <BsCheckCircle className="me-2" /> Accept & Assign
                      </Button>
                    </div>
                  ) : (
                    <div className="rejection-form animate-fade-in">
                      <Form.Group className="mb-3">
                        <Form.Label className="text-danger fw-bold">
                          Reason for Rejection (Required)
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="Explain why this report is being rejected..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          isInvalid={!!errorMsg && !rejectionReason}
                        />
                      </Form.Group>
                      <div className="d-flex gap-2 justify-content-end">
                        <Button
                          variant="secondary"
                          onClick={handleCancelReject}
                        >
                          Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmReject}>
                          Confirm Rejection
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Modal.Body>
          </>
        )}
      </Modal>

      {/* Lightbox */}
      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        size="xl"
        centered
        className="mu-lightbox-modal"
      >
        <Modal.Body className="text-center p-0 bg-transparent">
          <img
            src={selectedImage}
            alt="Detail"
            className="img-fluid"
            style={{ maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
}