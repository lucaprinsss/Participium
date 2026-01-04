import React, { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
    Container,
    Card,
    Table,
    Badge,
    Button,
    Alert,
    Dropdown,
    InputGroup,
    Tab,
    Nav
} from "react-bootstrap";
import { BsEye } from "react-icons/bs";
import { FaFilter, FaList, FaChevronDown, FaUserTie, FaHardHat, FaInfoCircle } from "react-icons/fa";
import "../css/MunicipalityUserHome.css";
import "../css/MunicipalityUserList.css";

// Componenti
import ReportDetails from "./ReportDetails";

// IMPORT API 
import {
    getReports,
    getAllCategories,
    updateReportStatus,
    getReportsAssignedToMe,
} from "../api/reportApi";

// --- CONSTANTS & CONFIGURATION ---
const ALL_STATUSES = [
    "Pending Approval",
    "Assigned",
    "In Progress",
    "Suspended",
    "Rejected",
    "Resolved",
];

// FIX: Removed "All Statuses" from here to avoid duplication in the Dropdown
const STAFF_MEMBER_STATUSES_LIST = [
    "Assigned",
    "In Progress",
    "Suspended",
    "Resolved",
];

const ROLE_DEPARTMENT_MAPPING = {
    "water network staff member": "Water Supply - Drinking Water",
    "sewer system staff member": "Sewer System",
    "road maintenance staff member": "Road Signs and Traffic Lights",
    "traffic management staff member": "Road Signs and Traffic Lights",
    "electrical staff member": "Public Lighting",
    "building maintenance staff member": "Architectural Barriers",
    "accessibility staff member": "Architectural Barriers",
    "recycling program staff member": "Waste",
    "parks maintenance staff member": "Public Green Areas and Playgrounds",
};

const getStatusBadgeVariant = (status) => {
    // Correzione S7781: Uso replaceAll() per sostituire tutte le occorrenze di underscore.
    const normalizedStatus = status?.replaceAll("_", " ").toLowerCase();

    if (normalizedStatus === "pending approval") return "warning";
    if (normalizedStatus === "assigned") return "info";
    if (normalizedStatus === "in progress") return "primary";
    if (normalizedStatus === "resolved") return "success";
    if (normalizedStatus === "rejected") return "danger";
    if (normalizedStatus === "suspended") return "warning";
    return "secondary";
};

const getDepartmentCategory = (roleName) => {
    if (!roleName) return null;
    return ROLE_DEPARTMENT_MAPPING[roleName.toLowerCase()] || null;
};

// Helper per convertire lo stato UI (es. "Pending Approval") in stato API (es. "PENDING_APPROVAL")
const formatStatusForApi = (uiStatus) => {
    if (!uiStatus || uiStatus === "All Statuses") return null;
    return uiStatus;
};

// --- SUB-COMPONENTI ESTRATTI PER RIDURRE LA COMPLESSITÀ ---

// 1. Component for table body
const ReportsTableBody = React.memo(({ reports, handleShow }) => {
    if (reports.length === 0) {
        return (
            <tr>
                <td colSpan="6" className="text-center p-5 text-muted">
                    <h5>No reports found</h5>
                    <p className="mb-0">
                        No reports match the search criteria.
                    </p>
                </td>
            </tr>
        );
    }

    const getStatusClass = (status) => {
        const s = status?.toLowerCase().replace(/_/g, " ");
        if (s === "pending approval") return "mul-status-pending";
        if (s === "assigned") return "mul-status-assigned";
        if (s === "in progress") return "mul-status-assigned"; // Using same blue for progress
        if (s === "resolved") return "mul-status-resolved";
        if (s === "rejected") return "mul-status-rejected";
        if (s === "suspended") return "mul-status-suspended";
        return "mul-status-open";
    };

    return reports.map((report) => (
        <tr 
            key={report.id} 
            className="mul-table-row"
            onClick={() => handleShow(report)}
        >
            <td className="ps-4">
                <span className="fw-semibold text-dark">{report.category}</span>
            </td>
            <td><strong>{report.title}</strong></td>
            <td>{report.createdAt.toLocaleDateString()}</td>
            <td>
                {report.assignee?.username || report.assignee?.id || (
                    <span className="text-muted fst-italic">N/A</span>
                )}
            </td>
            <td>
                <span className={`mul-status-badge ${getStatusClass(report.status)}`}>
                    {report.status.replace(/_/g, " ")}
                </span>
            </td>
            <td className="text-end pe-4">
                <div className="mul-actions justify-content-end">
                    <button
                        className="mul-btn mul-btn-edit"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleShow(report);
                        }}
                    >
                        <BsEye className="me-2" /> View
                    </button>
                </div>
            </td>
        </tr>
    ));
});

ReportsTableBody.propTypes = {
    reports: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        category: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        createdAt: PropTypes.instanceOf(Date).isRequired,
        status: PropTypes.string.isRequired,
        assignee: PropTypes.oneOfType([
            PropTypes.shape({ username: PropTypes.string, id: PropTypes.number }),
            PropTypes.number,
            PropTypes.string,
        ]),
    })).isRequired,
    handleShow: PropTypes.func.isRequired,
};

// 2. Componente per i filtri
const ReportsFilters = React.memo(({ isCategoryFilterDisabled, categoryFilter, statusFilter, allCategories, availableStatuses, setCategoryFilter, setStatusFilter }) => (
    <div className="mul-filters">
        {/* Category Filter */}
        <InputGroup className="mul-filter-group">
            <InputGroup.Text className="mul-filter-icon">
                <FaList />
            </InputGroup.Text>
            <Dropdown
                onSelect={setCategoryFilter}
                className="mul-custom-dropdown"
            >
                <Dropdown.Toggle
                    variant="light"
                    className="mul-filter-toggle"
                    id="category-filter"
                    disabled={isCategoryFilterDisabled}
                >
                    <div className="d-flex align-items-center justify-content-between w-100">
                        <span className="text-truncate">
                            {categoryFilter || "All Categories"}
                        </span>
                        <FaChevronDown className="mul-dropdown-arrow ms-2" />
                    </div>
                </Dropdown.Toggle>
                <Dropdown.Menu className="modern-dropdown-menu">
                    <Dropdown.Item eventKey="" active={categoryFilter === ""}>
                        All Categories
                    </Dropdown.Item>
                    {/* Correction S6479: Use cat as key */}
                    {allCategories.map((cat) => (
                        <Dropdown.Item
                            key={cat}
                            eventKey={cat}
                            active={categoryFilter === cat}
                        >
                            {cat}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        </InputGroup>

        {/* Status Filter */}
        <InputGroup className="mul-filter-group">
            <InputGroup.Text className="mul-filter-icon">
                <FaFilter />
            </InputGroup.Text>
            <Dropdown
                onSelect={setStatusFilter}
                className="mul-custom-dropdown"
            >
                <Dropdown.Toggle
                    variant="light"
                    className="mul-filter-toggle"
                    id="status-filter"
                >
                    <div className="d-flex align-items-center justify-content-between w-100">
                        <span className="text-truncate">
                            {statusFilter || "All Statuses"}
                        </span>
                        <FaChevronDown className="mul-dropdown-arrow ms-2" />
                    </div>
                </Dropdown.Toggle>
                <Dropdown.Menu className="modern-dropdown-menu">
                    {/* Caso speciale per "All Statuses" */}
                    <Dropdown.Item eventKey="" active={statusFilter === ""}>
                        All Statuses
                    </Dropdown.Item>
                    {/* Correction S6479: Use st as key */}
                    {availableStatuses.map((st) => (
                        <Dropdown.Item
                            key={st}
                            eventKey={st}
                            active={statusFilter === st}
                        >
                            {st}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        </InputGroup>
    </div>
));

ReportsFilters.propTypes = {
    isCategoryFilterDisabled: PropTypes.bool.isRequired,
    categoryFilter: PropTypes.string.isRequired,
    statusFilter: PropTypes.string.isRequired,
    allCategories: PropTypes.array.isRequired,
    availableStatuses: PropTypes.array.isRequired,
    setCategoryFilter: PropTypes.func.isRequired,
    setStatusFilter: PropTypes.func.isRequired,
};


// --- HELPER: Get Views based on Roles ---
const getViews = (user) => {
    const views = [];
    const roles = user?.roles || [];

    const isAdmin = roles.some(r => (r.role_name || "").toLowerCase() === 'administrator');
    const isPR = roles.some(r => (r.role_name || "").toLowerCase() === 'municipal public relations officer');
    const isDirector = roles.some(r => (r.role_name || "").includes('Director'));

    if (isAdmin || isPR) {
        views.push({
            key: 'global',
            label: isAdmin ? 'Admin Dashboard' : 'Public Relations Dashboard',
            icon: <FaUserTie className="me-2" />,
            fetchMethod: 'getAll',
            fixedCategory: null,
            availableStatuses: ALL_STATUSES,
            canFilterCategory: true,
            defaultStatus: 'Pending Approval'
        });
    }

    if (isDirector) {
        views.push({
            key: 'director-dashboard',
            label: 'Director Dashboard',
            icon: <FaUserTie className="me-2" />,
            fetchMethod: 'none',
            fixedCategory: null,
            availableStatuses: [],
            canFilterCategory: false,
            defaultStatus: ''
        });
    }

    roles.forEach((role, index) => {
        const roleName = (role.role_name || "").toLowerCase();
        if (roleName === 'administrator' || roleName === 'municipal public relations officer') return;

        const category = ROLE_DEPARTMENT_MAPPING[roleName];
        if (category) {
            // Avoid duplicates if user has multiple roles mapping to same category
            const existing = views.find(v => v.label === category);
            if (!existing) {
                views.push({
                    key: `dept-${index}`,
                    label: category,
                    icon: <FaHardHat className="me-2" />,
                    fetchMethod: 'getAssigned',
                    fixedCategory: category,
                    availableStatuses: STAFF_MEMBER_STATUSES_LIST,
                    canFilterCategory: false,
                    defaultStatus: ''
                });
            }
        }
    });

    return views;
};

// --- COMPONENTE PRINCIPALE ---

export default function MunicipalityUserHome({ user }) {

    // 1. Calculate Views
    const views = useMemo(() => getViews(user), [user]);
    
    // 2. State for Active View
    const [activeViewKey, setActiveViewKey] = useState(() => views.length > 0 ? views[0].key : 'default');

    // 3. Get Current View Config
    const currentView = useMemo(() => 
        views.find(v => v.key === activeViewKey) || views[0]
    , [views, activeViewKey]);

    // 4. Filters State
    const [categoryFilter, setCategoryFilter] = useState(() => {
        const initialView = views.length > 0 ? views[0] : null;
        return initialView?.fixedCategory || "";
    });
    const [statusFilter, setStatusFilter] = useState(() => {
        const initialView = views.length > 0 ? views[0] : null;
        return initialView?.defaultStatus || "";
    });

    // Effect to reset/set filters when currentView changes
    useEffect(() => {
        if (currentView) {
            setCategoryFilter(currentView.fixedCategory || "");
            setStatusFilter(currentView.defaultStatus || "");
        }
    }, [currentView]);

    const [reports, setReports] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    // 1. Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const categoriesData = await getAllCategories();
                setAllCategories(categoriesData || []);
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };
        fetchCategories();
    }, []);

    // 2. Fetch Reports
    const fetchReportsData = useCallback(async () => {
        if (!user || !currentView) return;

        setIsLoading(true);
        setApiError(null);

        try {
            const apiStatusParam = formatStatusForApi(statusFilter);
            const apiCategoryParam = categoryFilter === "" || categoryFilter === "All Categories" ? null : categoryFilter;

            let reportsData;

            if (currentView.fetchMethod === 'getAll') {
                reportsData = await getReports(apiStatusParam, apiCategoryParam);
            } else {
                reportsData = await getReportsAssignedToMe(apiStatusParam, apiCategoryParam);
            }

            const formattedReports = (reportsData || []).map((report) => ({
                ...report,
                createdAt: new Date(report.createdAt),
                images:
                    report.photos?.map((p) =>
                        typeof p === "string" ? p : p.storageUrl
                    ) || [],
            }));

            formattedReports.sort((a, b) => b.createdAt - a.createdAt);
            setReports(formattedReports);
        } catch (err) {
            console.error("Error fetching reports:", err);
            setApiError("Unable to load data. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, [user, currentView, statusFilter, categoryFilter]);

    useEffect(() => {
        fetchReportsData();
    }, [fetchReportsData]);


    // --- HANDLERS ---
    const handleClose = () => {
        setShowModal(false);
        setTimeout(() => setSelectedReport(null), 200);
    };

    const handleShow = (report) => {
        setSelectedReport(report);
        setShowModal(true);
    };

    const handleAcceptReport = async (reportId) => {
        try {
            const result = await updateReportStatus(reportId, "Assigned");
            if (result?.error) throw new Error(result.error);
            if (!result?.assignee) return { noOfficerFound: true };
            return { success: true, assignee: result.assignee };
        } catch (error) {
            console.error("Error approving report:", error);
            throw error;
        }
    };

    const handleRejectReport = async (reportId, reason) => {
        try {
            await updateReportStatus(reportId, "Rejected", reason);
            return true;
        } catch (error) {
            console.error("Error rejecting report:", error);
            return false;
        }
    };

    const handleReportUpdateFromModal = async (reportId, updates) => {
        await fetchReportsData();
        setSelectedReport(prev => (
            prev && prev.id === reportId ? { ...prev, ...updates } : prev
        ));
    };

    // --- RENDER CONTENT HELPER ---
    const renderTable = (tableReports, handleView) => {
        return (
            <div className="mul-table-wrapper mul-table-wrapper-scrollable">
                <Table hover className="mul-table mb-0 align-middle">
                    <thead className="bg-light text-uppercase small text-muted">
                        <tr>
                            <th className="ps-4">Category</th>
                            <th>Title</th>
                            <th>Date</th>
                            <th>Assigned External </th>
                            <th>Status</th>
                            <th className="text-end pe-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <ReportsTableBody reports={tableReports} handleShow={handleView} />
                    </tbody>
                </Table>
            </div>
        );
    };

    const renderContent = () => {
        if (currentView?.key === 'director-dashboard') {
            return (
                <>
                    <div className="mul-header">
                        <div>
                            <h2 className="mul-title">Director Dashboard</h2>
                            <p className="text-muted">Department overview and analytics.</p>
                        </div>
                    </div>
                    <Card className="mul-card border-0 shadow-sm p-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                        <div className="mb-4" style={{ fontSize: '3rem', color: '#cbd5e1' }}>
                            <FaInfoCircle />
                        </div>
                        <h3 className="text-muted">Feature Coming Soon</h3>
                        <p className="text-muted" style={{ maxWidth: '500px' }}>
                            We apologize, but the Director Dashboard is currently under development.<br/>
                            Our team is working to bring you this feature as soon as possible.
                        </p>
                    </Card>
                </>
            );
        }

        return (
            <>
                 {/* Header Section */}
                 <div className="mul-header">
                    <div>
                        <h2 className="mul-title">{currentView?.label || "Officer Dashboard"}</h2>
                        <p className="text-muted">
                            Manage and validate citizen reports.
                        </p>
                    </div>
    
                    <ReportsFilters
                        isCategoryFilterDisabled={!currentView?.canFilterCategory}
                        categoryFilter={categoryFilter}
                        statusFilter={statusFilter}
                        allCategories={allCategories}
                        availableStatuses={currentView?.availableStatuses || ALL_STATUSES}
                        setCategoryFilter={setCategoryFilter}
                        setStatusFilter={setStatusFilter}
                    />
                </div>
    
                {/* Error Alert */}
                {apiError && (
                    <Alert variant="danger" onClose={() => setApiError(null)} dismissible>
                        {apiError}
                    </Alert>
                )}
    
                {/* Table Card */}
                <Card className="mul-card border-0 shadow-sm" style={{ minHeight: '300px' }}>
                    {isLoading ? (
                        <div className="text-center p-5"></div>
                    ) : (
                        <Card.Body className="p-0">
                            {reports.length === 0 ? (
                                <div className="text-center p-5 text-muted">
                                    <h5>No reports found</h5>
                                    <p className="mb-0">
                                        There are no reports matching the current criteria ({statusFilter || "All Statuses"}).
                                    </p>
                                </div>
                            ) : (
                                renderTable(reports, handleShow)
                            )}
                        </Card.Body>
                    )}
                </Card>
            </>
        );
    };

    // --- MAIN RENDER ---
    if (views.length > 1) {
        return (
            <Container fluid className="mul-page-wrapper">
                <Tab.Container activeKey={activeViewKey} onSelect={setActiveViewKey}>
                    <div className="mul-layout-wrapper">
                        {/* Sidebar */}
                        <div className="mul-sidebar">
                            <Nav variant="pills" className="flex-column mul-nav-pills">
                                <div className="mul-nav-group-label">Views</div>
                                {views.map(view => (
                                    <Nav.Item key={view.key}>
                                        <Nav.Link eventKey={view.key}>
                                            {view.icon} {view.label}
                                        </Nav.Link>
                                    </Nav.Item>
                                ))}
                            </Nav>
                        </div>

                        {/* Content */}
                        <div className="mul-content">
                            <Tab.Content>
                                <Tab.Pane eventKey={activeViewKey}>
                                    {renderContent()}
                                </Tab.Pane>
                            </Tab.Content>
                        </div>
                    </div>
                </Tab.Container>

                <ReportDetails
                    show={showModal}
                    onHide={handleClose}
                    report={selectedReport}
                    user={user}
                    onApprove={handleAcceptReport}
                    onReject={handleRejectReport}
                    onReportUpdated={handleReportUpdateFromModal}
                    onStatusUpdate={fetchReportsData}
                />
            </Container>
        );
    }

    // Single View Layout
    return (
        <Container className="mul-page-wrapper">
            {renderContent()}
            <ReportDetails
                show={showModal}
                onHide={handleClose}
                report={selectedReport}
                user={user}
                onApprove={handleAcceptReport}
                onReject={handleRejectReport}
                onReportUpdated={handleReportUpdateFromModal}
                onStatusUpdate={fetchReportsData}
            />
        </Container>
    );
}

MunicipalityUserHome.propTypes = {
    user: PropTypes.shape({
        roles: PropTypes.arrayOf(PropTypes.shape({
            role_name: PropTypes.string,
            department_name: PropTypes.string
        })),
    }).isRequired,
};