import React, { useState, useEffect } from 'react';
import { getMyReports } from '../api/reportApi';
import { getMessages } from '../api/chatApi';
import ReportDetails from '../components/ReportDetails';
import '../css/MyReports.css';
import { FaCommentAlt } from 'react-icons/fa';

const MyReports = () => {
    const [reports, setReports] = useState([]);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const reportsData = await getMyReports();
                setReports(reportsData);

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
                console.error("Error fetching reports:", error);
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

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case "resolved": return "status-resolved";
            case "rejected": return "status-rejected";
            case "assigned": return "status-assigned";
            case "pending approval": return "status-pending";
            case "suspended": return "status-suspended";
            default: return "status-open";
        }
    };

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    return (
        <div className="my-reports-container">
            <div className="reports-column">
                <div className="reports-header">
                    <h1>My Reports</h1>
                </div>
                <div className="reports-list">
                    {reports.map((report) => (
                        <div 
                            key={report.id} 
                            className="report-card"
                            onClick={() => handleReportClick(report)}
                        >
                            <div className="report-card-header">
                                <span className={`report-status ${getStatusClass(report.status)}`}>
                                    {report.status}
                                </span>
                                {chats.some(c => c.report.id === report.id) && <FaCommentAlt color="#666" />}
                            </div>
                            <div className="report-card-title">{report.title}</div>
                            <div className="report-card-info">{report.category}</div>
                            <div className="report-card-info">{new Date(report.createdAt).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="chats-column">
                <div className="chats-header">
                    <h2>Active Chats</h2>
                </div>
                {chats.length === 0 ? (
                    <div className="no-chats">No active chats</div>
                ) : (
                    chats.map((chat) => (
                        <div 
                            key={chat.report.id} 
                            className="chat-item"
                            onClick={() => handleReportClick(chat.report)}
                        >
                            <div className="chat-report-title">{chat.report.title}</div>
                            <div className="chat-last-message">
                                {chat.lastMessage.content}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedReport && (
                <ReportDetails
                    show={showDetails}
                    onHide={() => setShowDetails(false)}
                    report={selectedReport}
                    user={{}} // Pass user if needed, or let ReportDetails fetch it
                    onApprove={() => {}} // Dummy functions as citizen can't approve/reject
                    onReject={() => {}}
                    onStatusUpdate={() => {}}
                    onReportUpdated={() => {}} // Maybe refresh list?
                />
            )}
        </div>
    );
};

export default MyReports;
