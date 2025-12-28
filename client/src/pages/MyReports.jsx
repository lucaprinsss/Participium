import React, { useState, useEffect, useMemo } from 'react';
import { getMyReports, getAllCategories } from '../api/reportApi';
import { getMessages } from '../api/chatApi';
import ReportDetails from '../components/ReportDetails';
import MapFiltersBar from '../components/MapFiltersBar';
import '../css/MyReports.css';
import { FaCommentAlt, FaTimes, FaCalendarAlt, FaTag } from 'react-icons/fa';

const MyReports = () => {
    const [reports, setReports] = useState([]);
    const [chats, setChats] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

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

    const handleReportClick = (report) => {
        setSelectedReport(report);
        setShowDetails(true);
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
            case "resolved": return "mr-status-resolved";
            case "rejected": return "mr-status-rejected";
            case "assigned": return "mr-status-assigned";
            case "pending approval": return "mr-status-pending";
            case "suspended": return "mr-status-suspended";
            default: return "mr-status-open";
        }
    };

    if (loading) {
        return (
            <div className="mr-loading-container">
                <div className="mr-spinner"></div>
                <p>Loading your reports...</p>
            </div>
        );
    }

    return (
        <div className="mr-page-wrapper">
            <div className="mr-container">
                
                {/* Header Section */}
                <div className="mr-header">
                    <h1 className="mr-title">My Reports</h1>
                    <p className="mr-subtitle">Track your contributions and communicate with the municipality.</p>
                </div>

                <div className="mr-content-grid">
                    {/* Reports Section */}
                    <div className="mr-reports-section">
                        <div className="mr-section-header">
                            <h2>Submitted Reports</h2>
                            <span className="mr-badge-count">{filteredReports.length}</span>
                        </div>

                        <div className="mr-filters-container">
                            <MapFiltersBar
                                categories={categories}
                                filterCategory={filterCategory}
                                setFilterCategory={setFilterCategory}
                                filterStatus={filterStatus}
                                setFilterStatus={setFilterStatus}
                                onSearch={setSearchText}
                                // Props non usate in questa pagina ma richieste dal componente
                                viewMode="map" 
                                setViewMode={() => {}}
                                hideReports={false}
                                setHideReports={() => {}}
                                // Hide unnecessary filters
                                showUserFilter={false}
                                showVisibilityToggle={false}
                            />
                        </div>
                        
                        <div className="mr-card">
                            <div className="mr-card-body">
                                <div className="mr-table-wrapper">
                                    <table className="mr-table">
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
                                                        className="mr-table-row"
                                                        onClick={() => handleReportClick(report)}
                                                    >
                                                        <td>
                                                            <span className={`mr-status-badge ${getStatusClass(report.status)}`}>
                                                                {report.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="mr-table-title">{report.title}</div>
                                                        </td>
                                                        <td>
                                                            <div className="mr-table-meta">
                                                                <FaTag className="mr-meta-icon" />
                                                                {report.category}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="mr-table-meta">
                                                                <FaCalendarAlt className="mr-meta-icon" />
                                                                {new Date(report.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {chats.some(c => c.report.id === report.id) && (
                                                                <div className="mr-chat-indicator-table" title="Active Chat">
                                                                    <FaCommentAlt />
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="mr-empty-state">
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
                    <div className="mr-chats-sidebar">
                        <div className="mr-sidebar-header">
                            <h2>Active Conversations</h2>
                        </div>
                        <div className="mr-chats-list">
                            {chats.length === 0 ? (
                                <div className="mr-no-chats">
                                    <p>No active conversations.</p>
                                </div>
                            ) : (
                                chats.map((chat) => (
                                    <div 
                                        key={chat.report.id} 
                                        className="mr-chat-item"
                                        onClick={() => handleReportClick(chat.report)}
                                    >
                                        <div className="mr-chat-avatar">
                                            <FaCommentAlt />
                                        </div>
                                        <div className="mr-chat-info">
                                            <div className="mr-chat-title">{chat.report.title}</div>
                                            <div className="mr-chat-preview">
                                                {chat.lastMessage?.content || "No messages yet"}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
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
                />
            )}
        </div>
    );
};

export default MyReports;
