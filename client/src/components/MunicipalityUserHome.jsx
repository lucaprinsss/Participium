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
  approveReport,
  rejectReport,
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
      const result = await approveReport(reportId);
      
      // Refresh data silently
      await fetchData(); 

      if (result?.error) throw new Error(result.error);
      
      // Return logic required by ReportDetails component
      if (!result?.assignee) return { noOfficerFound: true };
      return { success: true };
      
    } catch (error) {
      console.error("Error approving report:", error);
      throw error; // Propagate to modal for UI feedback
    }
  };

  const handleRejectReport = async (reportId, reason) => {
    try {
      await rejectReport(reportId, reason);
      await fetchData();
      return true;
    } catch (error) {
      console.error("Error rejecting report:", error);
      // Optional: setApiError(error.message); 
      return false;
    }
  };

  // --- RENDER CONTENT HELPER ---
  // Estrazione della logica per evitare nested ternary operation
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading reports...</p>
        </div>
      );
    }

    if (filteredReports.length === 0) {
      return (
        <div className="text-center p-5 text-muted">
          <h5>No reports found</h5>
          <p className="mb-0">Try adjusting your filters or check back later.</p>
        </div>
      );
    }

    return (
      <Table responsive hover className="mu-table mb-0 align-middle">
        <thead className="bg-light text-uppercase small text-muted">
          <tr>
            <th className="ps-4">Category</th>
            <th>Title</th>
            <th>Date</th>
            <th>Status</th>
            <th className="text-end pe-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredReports.map((report) => (
            <tr key={report.id}>
              <td className="ps-4">
                <span className="fw-semibold text-dark">
                  {report.category}
                </span>
              </td>
              <td>{report.title}</td>
              <td>{report.createdAt.toLocaleDateString()}</td>
              <td>
                <Badge bg={getStatusBadgeVariant(report.status)} className="fw-normal">
                  {report.status}
                </Badge>
              </td>
              <td className="text-end pe-4">
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="rounded-pill px-3 d-inline-flex align-items-center"
                  onClick={() => handleShow(report)}
                >
                  <BsEye className="me-2" /> View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  // --- MAIN RENDER ---
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

      {/* Table Card */}
      <Card className="mu-home-card border-0 shadow-sm">
        <Card.Body className="p-0">
          {renderContent()}
        </Card.Body>
      </Card>

      {/* Report Detail Modal */}
      <ReportDetails
        show={showModal}
        onHide={handleClose}
        report={selectedReport}
        user={user}
        onApprove={handleAcceptReport}
        onReject={handleRejectReport}
      />
    </Container>
  );
}