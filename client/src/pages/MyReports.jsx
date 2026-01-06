import React, { useState, useEffect, useMemo } from 'react';
import { InputGroup, Dropdown, Tooltip, OverlayTrigger } from "react-bootstrap";
import { getMyReports, getAllCategories } from '../api/reportApi';
import { getMessages } from '../api/chatApi';
import ReportDetails from '../components/ReportDetails';
import '../css/MunicipalityUserList.css';
import { FaCommentAlt, FaCalendarAlt, FaTag, FaSearch, FaUndo, FaChevronDown, FaInfoCircle } from 'react-icons/fa';

const MyReports = () => {
    const [reports, setReports] = useState([]);
    const [chats, setChats] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [openChatDetails, setOpenChatDetails] = useState(false);

    // Filters State
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [reportsData, categoriesData] = await Promise.all([
                    getMyReports(),
                    getAllCategories()
                ]);
                
                setReports(reportsData);
                setCategories(categoriesData);

                // Fetch messages for each report to determine active chats
                const chatsData = [];
                for (const report of reportsData) {
                    try {
                        const messages = await getMessages(report.id);
                        if (messages && messages.length > 0) {
                            chatsData.push({
                                report: report,
                                lastMessage: messages[messages.length - 1]
                            });
                        }
                    } catch (err) {
                        console.error(`Error fetching messages for report ${report.id}`, err);
                    }
                }
                setChats(chatsData);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleReportClick = (report, openChat = false) => {
        setSelectedReport(report);
        setOpenChatDetails(openChat);
        setShowDetails(true);
    };

    const handleResetFilters = () => {
        setFilterCategory("All");
        setFilterStatus("All");
        setSearchText("");
    };

    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            const matchesCategory = filterCategory === "All" || report.category === filterCategory;
            const matchesStatus = filterStatus === "All" || report.status === filterStatus;
            const matchesSearch = searchText === "" || 
                report.title.toLowerCase().includes(searchText.toLowerCase()) ||
                report.description?.toLowerCase().includes(searchText.toLowerCase());
            
            return matchesCategory && matchesStatus && matchesSearch;
        });
    }, [reports, filterCategory, filterStatus, searchText]);

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case "resolved": return "mul-status-resolved";
            case "rejected": return "mul-status-rejected";
            case "assigned": return "mul-status-assigned";
            case "pending approval": return "mul-status-pending";
            case "suspended": return "mul-status-suspended";
            default: return "mul-status-open";
        }
    };

    if (loading) {
        return (
            <div className="mul-loading">
                <div className="mul-loading-spinner"></div>
                <p>Loading your reports...</p>
            </div>
        );
    }

    return (
        <div className="mul-page-wrapper">
            {/* Header Section */}
            <div className="mul-header">
                <div>
                    <h1 className="mul-title">My Reports</h1>
                    <p className="text-muted ms-3 mb-0">Track your contributions and communicate with the municipality.</p>
                </div>
                
                <div className="mul-filters">
                    {/* Search Filter */}
                    <InputGroup className="mul-filter-group" style={{ width: '250px' }}>
                        <InputGroup.Text className="mul-filter-icon"><FaSearch /></InputGroup.Text>
                        <input
                            type="text"
                            className="form-control mul-filter-toggle"
                            placeholder="Search reports..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ borderLeft: 'none', boxShadow: 'none' }}
                        />
                    </InputGroup>

                    {/* Category Filter */}
                    <InputGroup className="mul-filter-group" style={{ width: '200px' }}>
                        <InputGroup.Text className="mul-filter-icon"><FaTag /></InputGroup.Text>
                        <Dropdown onSelect={(k) => setFilterCategory(k)} className="mul-custom-dropdown">
                            <Dropdown.Toggle variant="light" className="mul-filter-toggle">
                                <div className="d-flex align-items-center justify-content-between w-100">
                                    <span className="text-truncate">{filterCategory === "All" ? "All Categories" : filterCategory}</span>
                                    <FaChevronDown className="mul-dropdown-arrow ms-2" />
                                </div>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="modern-dropdown-menu">
                                <Dropdown.Item eventKey="All" active={filterCategory === "All"}>All Categories</Dropdown.Item>
                                {categories.map((cat) => (
                                    <Dropdown.Item key={cat} eventKey={cat} active={filterCategory === cat}>
                                        {cat}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    </InputGroup>

                    {/* Status Filter */}
                    <InputGroup className="mul-filter-group" style={{ width: '200px' }}>
                        <InputGroup.Text className="mul-filter-icon"><FaInfoCircle /></InputGroup.Text>
                        <Dropdown onSelect={(k) => setFilterStatus(k)} className="mul-custom-dropdown">
                            <Dropdown.Toggle variant="light" className="mul-filter-toggle">
                                <div className="d-flex align-items-center justify-content-between w-100">
                                    <span className="text-truncate">{filterStatus === "All" ? "All Statuses" : filterStatus}</span>
                                    <FaChevronDown className="mul-dropdown-arrow ms-2" />
                                </div>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="modern-dropdown-menu">
                                <Dropdown.Item eventKey="All" active={filterStatus === "All"}>All Statuses</Dropdown.Item>
                                {["Resolved", "Assigned", "In Progress", "Suspended", "Rejected", "Pending Approval"].map((status) => (
                                    <Dropdown.Item key={status} eventKey={status} active={filterStatus === status}>
                                        {status}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    </InputGroup>

                    <OverlayTrigger placement="top" overlay={<Tooltip>Reset Filters</Tooltip>}>
                        <button className="mul-btn-reset" onClick={handleResetFilters} disabled={filterCategory === "All" && filterStatus === "All" && !searchText}>
                            <FaUndo />
                        </button>
                    </OverlayTrigger>
                </div>
            </div>

            <div className="mul-content-grid">
                {/* Reports Section */}
                <div className="flex-grow-1">
                    <div className="mul-card">
                            <div className="mul-card-body">
                                <div className="mul-table-wrapper mul-table-wrapper-scrollable">
                                    <table className="mul-table">
                                        <thead>
                                            <tr>
                                                <th>Status</th>
                                                <th>Title</th>
                                                <th>Category</th>
                                                <th>Date</th>
                                                <th>Chat</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReports.length > 0 ? (
                                                filteredReports.map((report) => (
                                                    <tr 
                                                        key={report.id} 
                                                        className="mul-table-row"
                                                        onClick={() => handleReportClick(report)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <td>
                                                            <span className={`mul-status-badge ${getStatusClass(report.status)}`}>
                                                                {report.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="fw-bold">{report.title}</div>
                                                        </td>
                                                        <td>
                                                            <div className="mul-table-meta">
                                                                <FaTag className="mul-meta-icon" />
                                                                {report.category}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="mul-table-meta">
                                                                <FaCalendarAlt className="mul-meta-icon" />
                                                                {new Date(report.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {chats.some(c => c.report.id === report.id) && (
                                                                <button
                                                                    type="button"
                                                                    className="mul-chat-indicator" 
                                                                    title="Active Chat"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleReportClick(report, true);
                                                                    }}
                                                                    style={{ border: 'none' }}
                                                                >
                                                                    <FaCommentAlt />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="mul-empty">
                                                        No reports found matching your filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chats Sidebar */}
                    <div className="mul-sidebar-panel">
                        <div className="mul-sidebar-header">
                            <h2>Active Conversations</h2>
                        </div>
                        <div className="mul-list-group">
                            {chats.length === 0 ? (
                                <div className="mul-empty-small">
                                    <p>No active conversations.</p>
                                </div>
                            ) : (
                                chats.map((chat) => (
                                    <button 
                                        type="button"
                                        key={chat.report.id} 
                                        className="mul-list-item"
                                        onClick={() => handleReportClick(chat.report, true)}
                                        style={{ width: '100%', textAlign: 'left', font: 'inherit' }}
                                    >
                                        <div className="mul-avatar">
                                            <FaCommentAlt />
                                        </div>
                                        <div className="mul-list-info">
                                            <div className="mul-list-title">{chat.report.title}</div>
                                            <div className="mul-list-subtitle">
                                                {chat.lastMessage?.content || "No messages yet"}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            {/* Modal */}
            {selectedReport && (
                <ReportDetails 
                    show={showDetails}
                    onHide={() => setShowDetails(false)}
                    report={selectedReport}
                    user={{}} // Citizen user
                    onApprove={() => {}}
                    onReject={() => {}}
                    onStatusUpdate={() => {}}
                    onReportUpdated={() => {}}
                    openChat={openChatDetails}
                />
            )}
        </div>
    );
};

export default MyReports;
