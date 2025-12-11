import React, { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types"; // Aggiunto per best practices
import {
    Container,
    Card,
    Table,
    Badge,
    Button,
    Alert,
    Dropdown,
    //Spinner,
    InputGroup,
} from "react-bootstrap";
import { BsEye } from "react-icons/bs";
import { FaFilter, FaList, FaChevronDown } from "react-icons/fa";
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
const STAFF_MEMBER_STATUSES = [
    "All Statuses",
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
                <td colSpan="5" className="text-center p-5 text-muted">
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
    })).isRequired,
    handleShow: PropTypes.func.isRequired,
};

// 2. Componente per i filtri
const ReportsFilters = React.memo(({ isStaffMember, categoryFilter, statusFilter, allCategories, availableStatuses, setCategoryFilter, setStatusFilter }) => (
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
                    disabled={isStaffMember}
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
    isStaffMember: PropTypes.bool.isRequired,
    categoryFilter: PropTypes.string.isRequired,
    statusFilter: PropTypes.string.isRequired,
    allCategories: PropTypes.array.isRequired,
    availableStatuses: PropTypes.array.isRequired,
    setCategoryFilter: PropTypes.func.isRequired,
    setStatusFilter: PropTypes.func.isRequired,
};


// --- COMPONENTE PRINCIPALE ---

export default function MunicipalityUserHome({ user }) {

    // --- DERIVED USER INFO (USATA PER DEFINIZIONE INIZIALE) ---
    const userRole = user?.role_name?.toLowerCase();
    const isAdministrator = userRole === "administrator";
    const isPublicRelations = userRole === "municipal public relations officer";

    const isStaffMember = useMemo(() => {
        return (
            userRole &&
            !isAdministrator &&
            !isPublicRelations
        );
    }, [userRole, isAdministrator, isPublicRelations]);

    const userDepartmentCategory = useMemo(() => {
        return isStaffMember ? getDepartmentCategory(user?.role_name) : null;
    }, [isStaffMember, user?.role_name]);

    const availableStatuses = useMemo(() => {
        return isStaffMember ? STAFF_MEMBER_STATUSES : ALL_STATUSES;
    }, [isStaffMember]);

    // --- STATE ---
    const [categoryFilter, setCategoryFilter] = useState(() => userDepartmentCategory || "");

    const [statusFilter, setStatusFilter] = useState(() => {
        if (isAdministrator || isPublicRelations) {
            return "Pending Approval";
        }
        return ""; // Include "All Statuses"
    });

    const [reports, setReports] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    // --- EFFECT: Sincronizzazione Iniziale Categoria Staff Member ---
    useEffect(() => {
        if (isStaffMember) {
            // Aggiorna il filtro categoria in base al dipartimento dell'utente staff
            if (categoryFilter !== userDepartmentCategory) {
                setCategoryFilter(userDepartmentCategory || "");
            }
            // Assicura che lo stato sia valido per lo staff (evita Pending Approval ecc.)
            if (!STAFF_MEMBER_STATUSES.includes(statusFilter) && statusFilter !== "") {
                setStatusFilter(""); // Reset a "All Statuses"
            }
        } else if (isAdministrator || isPublicRelations) {
            // Se non sono staff, assicuriamoci che la categoria sia generale
            if (categoryFilter !== "") {
                setCategoryFilter("");
            }
        }
    }, [isStaffMember, userDepartmentCategory, isAdministrator, isPublicRelations, categoryFilter, statusFilter]);


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

    // 2. Fetch Reports (Memoized/Cache function)
    const fetchReportsData = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        setApiError(null);

        try {
            // Conversione Filtri per API
            const apiStatusParam = formatStatusForApi(statusFilter);
            const apiCategoryParam = categoryFilter === "" || categoryFilter === "All Categories" ? null : categoryFilter;

            let reportsData;

            if (isStaffMember) {
                // Staff members usano getReportsAssignedToMe
                reportsData = await getReportsAssignedToMe(apiStatusParam, apiCategoryParam);
            } else {
                // Admin e PR usano getReports
                reportsData = await getReports(apiStatusParam, apiCategoryParam);
            }

            const formattedReports = (reportsData || []).map((report) => ({
                ...report,
                createdAt: new Date(report.createdAt),
                images:
                    report.photos?.map((p) =>
                        typeof p === "string" ? p : p.storageUrl
                    ) || [],
            }));

            // Sort by date descending
            formattedReports.sort((a, b) => b.createdAt - a.createdAt);

            setReports(formattedReports);
        } catch (err) {
            console.error("Error fetching reports:", err);
            setApiError("Unable to load data. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, [user, isStaffMember, statusFilter, categoryFilter]); // Dipendenze chiare e minime

    // Trigger fetch when filters change
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
        // Aggiorna anche il report selezionato per consistenza visiva se il modal resta aperto
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

    // --- MAIN RENDER ---
    return (
        <Container className="mu-home-container">
            {/* Header Section */}
            <div className="mu-header-wrapper">
                <div>
                    <h2 className="mu-home-title">Officer Dashboard</h2>
                    <p className="mu-home-subtitle">
                        Manage and validate citizen reports.
                    </p>
                </div>

                {/* Filtri Estratti nel Componente ReportsFilters */}
                <ReportsFilters
                    isStaffMember={isStaffMember}
                    categoryFilter={categoryFilter}
                    statusFilter={statusFilter}
                    allCategories={allCategories}
                    availableStatuses={availableStatuses}
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

                {/* Blocco Caricamento Sostituito: lo spinner e il messaggio sono mostrati solo se isLoading è vero */}
                {isLoading ? (
                    <div className="text-center p-5">
                        {/* <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">Loading reports...</p> */}
                    </div>
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

            {/* Report Detail Modal */}
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
        role_name: PropTypes.string,
    }).isRequired,
};