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

// FIX: Rimosso "All Statuses" da qui per evitare la duplicazione nel Dropdown
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

// 1. Componente per il corpo della tabella
const ReportsTableBody = React.memo(({ reports, handleShow }) => {
    if (reports.length === 0) {
        return (
            <tr>
                <td colSpan="6" className="text-center p-5 text-muted"> {/* Aumentato colSpan */}
                    <h5>Nessuna segnalazione trovata</h5>
                    <p className="mb-0">
                        Nessuna segnalazione corrisponde ai criteri di ricerca.
                    </p>
                </td>
            </tr>
        );
    }

    return reports.map((report) => (
        <tr key={report.id}>
            <td className="ps-4">
                <span className="fw-semibold text-dark">{report.category}</span>
            </td>
            <td>{report.title}</td>
            <td>{report.createdAt.toLocaleDateString()}</td>
            <td>
                {/* Colonna Aggiunta per l'Assegnatario */}
                {report.assignee?.username || report.assignee?.id || (
                    <span className="text-muted fst-italic">N/A</span>
                )}
            </td>
            <td>
                <Badge
                    bg={getStatusBadgeVariant(report.status)}
                    className="fw-normal"
                >
                    {/* Correzione S7781: Uso replaceAll() per sostituire tutti gli underscore */}
                    {report.status.replaceAll("_", " ")}
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
    <div className="mu-filters">
        {/* Category Filter */}
        <InputGroup className="mu-filter-group">
            <InputGroup.Text className="mu-filter-icon">
                <FaList />
            </InputGroup.Text>
            <Dropdown
                onSelect={setCategoryFilter}
                className="mu-custom-dropdown"
            >
                <Dropdown.Toggle
                    variant="light"
                    className="mu-filter-toggle"
                    id="category-filter"
                    disabled={isCategoryFilterDisabled}
                >
                    <div className="d-flex align-items-center justify-content-between w-100">
                        <span className="text-truncate">
                            {categoryFilter || "All Categories"}
                        </span>
                        <FaChevronDown className="mu-dropdown-arrow ms-2" />
                    </div>
                </Dropdown.Toggle>
                <Dropdown.Menu className="modern-dropdown-menu">
                    <Dropdown.Item eventKey="" active={categoryFilter === ""}>
                        All Categories
                    </Dropdown.Item>
                    {/* Correzione S6479: Uso cat come chiave */}
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
        <InputGroup className="mu-filter-group">
            <InputGroup.Text className="mu-filter-icon">
                <FaFilter />
            </InputGroup.Text>
            <Dropdown
                onSelect={setStatusFilter}
                className="mu-custom-dropdown"
            >
                <Dropdown.Toggle
                    variant="light"
                    className="mu-filter-toggle"
                    id="status-filter"
                >
                    <div className="d-flex align-items-center justify-content-between w-100">
                        <span className="text-truncate">
                            {statusFilter || "All Statuses"}
                        </span>
                        <FaChevronDown className="mu-dropdown-arrow ms-2" />
                    </div>
                </Dropdown.Toggle>
                <Dropdown.Menu className="modern-dropdown-menu">
                    {/* Caso speciale per "All Statuses" */}
                    <Dropdown.Item eventKey="" active={statusFilter === ""}>
                        All Statuses
                    </Dropdown.Item>
                    {/* Correzione S6479: Uso st come chiave */}
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
            canFilterCategory: true
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
            canFilterCategory: false
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
                    canFilterCategory: false
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
    const [categoryFilter, setCategoryFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Effect to reset/set filters when currentView changes
    useEffect(() => {
        if (currentView) {
            setCategoryFilter(currentView.fixedCategory || "");
            if (currentView.key === 'global') {
                 setStatusFilter("Pending Approval");
            } else {
                 setStatusFilter(""); // All Statuses for staff view
            }
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
            <Table responsive hover className="mu-table mb-0 align-middle">
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
        );
    };

    const renderContent = () => {
        if (currentView?.key === 'director-dashboard') {
            return (
                <>
                    <div className="mu-header-wrapper">
                        <div>
                            <h2 className="mu-home-title">Director Dashboard</h2>
                            <p className="mu-home-subtitle">Department overview and analytics.</p>
                        </div>
                    </div>
                    <Card className="mu-home-card border-0 shadow-sm p-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
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
                 <div className="mu-header-wrapper">
                    <div>
                        <h2 className="mu-home-title">{currentView?.label || "Officer Dashboard"}</h2>
                        <p className="mu-home-subtitle">
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
                <Card className="mu-home-card border-0 shadow-sm" style={{ minHeight: '300px' }}>
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
            <Container fluid className="mu-home-container">
                <Tab.Container activeKey={activeViewKey} onSelect={setActiveViewKey}>
                    <div className="mu-layout-wrapper">
                        {/* Sidebar */}
                        <div className="mu-sidebar">
                            <Nav variant="pills" className="flex-column mu-nav-pills">
                                <div className="mu-nav-group-label">Views</div>
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
                        <div className="mu-content">
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
        <Container className="mu-home-container">
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