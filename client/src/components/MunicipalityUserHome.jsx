import { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Dropdown, Spinner } from 'react-bootstrap';
import { BsEye } from 'react-icons/bs';
import { FaFilter, FaList } from "react-icons/fa";
import '../css/MunicipalityUserHome.css';

// Componenti
import ReportDetails from './ReportDetails';

// IMPORT API
import {
  getReports,
  getAllCategories,
  updateReportStatus,
  getReportsAssignedToMe,
} from "../api/reportApi";

// --- CONSTANTS & CONFIGURATION ---
const ALL_STATUSES = ["Pending Approval", "Assigned", "In Progress", "Suspended", "Rejected", "Resolved"];

const ROLE_DEPARTMENT_MAPPING = {
  "water network staff member": "Water Supply - Drinking Water",
  "sewer system staff member": "Sewer System",
  "road maintenance staff member": "Road Signs and Traffic Lights",
  "traffic management staff member": "Road Signs and Traffic Lights",
  "electrical staff member": "Public Lighting",
  "building maintenance staff member": "Architectural Barriers",
  "accessibility staff member": "Architectural Barriers",
  "recycling program staff member": "Waste",
  "parks maintenance staff member": "Parks and Recreation",
};

const getStatusBadgeVariant = (status) => {
  switch (status) {
    case "Pending Approval": return "warning";
    case "Assigned": return "primary";
    case "In Progress": return "info";
    case "Resolved": return "success";
    case "Rejected": return "danger";
    default: return "secondary";
  }
};

const getDepartmentCategory = (roleName) => {
  if (!roleName) return null;
  return ROLE_DEPARTMENT_MAPPING[roleName.toLowerCase()] || null;
};

export default function MunicipalityUserHome({ user }) {
  // --- STATE ---
  const [reports, setReports] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending Approval");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // --- DERIVED STATE (MEMOIZED) ---
  const userRole = user?.role_name?.toLowerCase();
  
  const isStaffMember = useMemo(() => {
    return userRole && 
           userRole !== "administrator" && 
           userRole !== "municipal public relations officer";
  }, [userRole]);

  const userDepartmentCategory = useMemo(() => {
    return isStaffMember ? getDepartmentCategory(user?.role_name) : null;
  }, [isStaffMember, user?.role_name]);

  // --- INITIALIZATION EFFECTS ---
  
  // 1. Set default filters based on role
  useEffect(() => {
    if (isStaffMember && userDepartmentCategory) {
      setCategoryFilter(userDepartmentCategory);
      setStatusFilter("Assigned");
    } else if (userRole === "administrator" || userRole === "municipal public relations officer") {
      setStatusFilter("Pending Approval");
    }
  }, [isStaffMember, userDepartmentCategory, userRole]);

  // 2. Fetch Data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      // Parallel fetching for categories and reports
      const [categoriesData, reportsData] = await Promise.all([
        getAllCategories(),
        isStaffMember ? getReportsAssignedToMe() : getReports()
      ]);

      setAllCategories(categoriesData || []);

      const formattedReports = (reportsData || []).map((report) => ({
        ...report,
        createdAt: new Date(report.createdAt), // Ensure Date object
        images: report.photos?.map((p) => (typeof p === "string" ? p : p.storageUrl)) || [],
      }));

      // Sort by date descending
      formattedReports.sort((a, b) => b.createdAt - a.createdAt);
      
      setReports(formattedReports);
    } catch (err) {
      console.error("Error fetching data:", err);
      setApiError("Unable to load data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [isStaffMember]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [fetchData, user]);

  // --- FILTERING LOGIC (MEMOIZED) ---
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesCategory = categoryFilter === "" || report.category === categoryFilter;
      const matchesStatus = statusFilter === "" || report.status === statusFilter;
      return matchesCategory && matchesStatus;
    });
  }, [reports, categoryFilter, statusFilter]);

  // --- HANDLERS ---
  const handleClose = () => {
    setShowModal(false);
    setTimeout(() => setSelectedReport(null), 200); // Clear after animation
  };

  const handleShow = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const handleAcceptReport = async (reportId) => {
    try {
      await updateReportStatus(selectedReport.id, 'Assigned');
      await fetchData();
      handleClose();
    } catch (error) {
      console.error("Error approving report:", error);
      throw error; // Propagate to modal for UI feedback
    }
  };

  const handleRejectReport = async (reportId, reason) => {
    try {
      await updateReportStatus(selectedReport.id, 'Rejected', rejectionReason);
      await fetchData();
      return true;
    } catch (error) {
      console.error("Error rejecting report:", error);
      triggerError(error.message || "Unknown error during rejection.");
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedReport) return;
    clearError();

    try {
      await updateReportStatus(selectedReport.id, newStatus);
      await fetchData();
      handleClose();
    } catch (error) {
      console.error(`Error updating status to ${newStatus}:`, error);
      triggerError(error.message || `Failed to update status.`);
    }
  };

  return (
    <Container className="mu-home-container">
      {/* Header Section */}
      <div className="mu-header-wrapper">
        <div>
          <h2 className="mu-home-title">Officer Dashboard</h2>
          <p className="mu-home-subtitle">Manage and validate citizen reports.</p>
        </div>

        <div className="mu-filters">
          {!isStaffMember ? (
            <>
              {/* Category Dropdown */}
              <Dropdown onSelect={setCategoryFilter} className="mu-filter-dropdown">
                <Dropdown.Toggle className="modern-dropdown-toggle" id="category-filter">
                  <FaList className="dropdown-icon" />
                  <span className="dropdown-toggle-text">
                    {categoryFilter || "All Categories"}
                  </span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="modern-dropdown-menu">
                  <Dropdown.Item eventKey="" active={categoryFilter === ""}>All Categories</Dropdown.Item>
                  {allCategories.map((cat, idx) => (
                    <Dropdown.Item key={idx} eventKey={cat} active={categoryFilter === cat}>
                      {cat}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>

              {/* Status Dropdown */}
              <Dropdown onSelect={setStatusFilter} className="mu-filter-dropdown">
                <Dropdown.Toggle className="modern-dropdown-toggle" id="status-filter">
                  <FaFilter className="dropdown-icon" />
                  <span className="dropdown-toggle-text">
                    {statusFilter || "All Statuses"}
                  </span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="modern-dropdown-menu">
                  <Dropdown.Item eventKey="" active={statusFilter === ""}>All Statuses</Dropdown.Item>
                  {ALL_STATUSES.map((st, idx) => (
                    <Dropdown.Item key={idx} eventKey={st} active={statusFilter === st}>
                      {st}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </>
          ) : (
            <div className="bg-light p-2 px-3 rounded text-muted small">
               Viewing: <strong>{userDepartmentCategory || "My Department"}</strong> &nbsp;|&nbsp; Status: <strong>Assigned</strong>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {apiError && (
        <Alert variant="danger" onClose={() => setApiError(null)} dismissible>
          {apiError}
        </Alert>
      )}

      {/* Extracted report content logic */}
      {(() => {
        if (isLoading) {
          return (
            <Card className="mu-home-card">
              <Card.Body className="p-0">
                <div className="text-center p-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Loading reports...</p>
                </div>
              </Card.Body>
            </Card>
          );
        } else if (filteredReports.length === 0) {
          return (
            <Card className="mu-home-card">
              <Card.Body className="p-0">
                <div className="text-center p-5 text-muted">
                  <h5>No reports found</h5>
                  <p>Try adjusting your filters or check back later.</p>
                </div>
              </Card.Body>
            </Card>
          );
        } else {
          return (
            <Card className="mu-home-card">
              <Card.Body className="p-0">
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
              </Card.Body>
            </Card>
          );
        }
      })()}

      {/* Report Detail Modal */}
      <ReportDetails
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

                {/* Staff Actions */}
                {isStaffMember && ['Assigned', 'In Progress', 'Suspended'].includes(selectedReport.status) && (
                  <Col xs={12} className="mt-4 pt-3 border-top">
                    <h6 className="text-primary fw-bold">Update Report Status</h6>
                    <DropdownButton
                      id="dropdown-basic-button"
                      title="Set Status To..."
                      onSelect={handleStatusUpdate}
                    >
                      {selectedReport.status === 'Assigned' && (
                        <>
                          <Dropdown.Item eventKey="In Progress">In Progress</Dropdown.Item>
                          <Dropdown.Item eventKey="Resolved">Resolved</Dropdown.Item>
                        </>
                      )}
                      {selectedReport.status === 'In Progress' && (
                        <>
                          <Dropdown.Item eventKey="Suspended">Suspended</Dropdown.Item>
                          <Dropdown.Item eventKey="Resolved">Resolved</Dropdown.Item>
                        </>
                      )}
                      {selectedReport.status === 'Suspended' && (
                        <Dropdown.Item eventKey="In Progress">Back to In Progress</Dropdown.Item>
                      )}
                    </DropdownButton>
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