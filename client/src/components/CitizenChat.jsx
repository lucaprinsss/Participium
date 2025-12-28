import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { FaCommentAlt, FaChevronDown, FaPaperPlane } from "react-icons/fa";
import { getMessages, sendMessage } from "../api/chatApi";
import "../css/ReportComments.css"; // Reuse styles

const DEFAULT_AVATAR = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

const CitizenChat = ({ reportId, currentUserId, isCitizen }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newMessageText, setNewMessageText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const messagesEndRef = useRef(null);

    const canSend = !isCitizen || (isCitizen && messages.length > 0);

    const scrollToBottom = useCallback((behavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior: behavior });
    }, []);

    const fetchMessages = useCallback(async (isInitialLoad = false) => {
        setLoading(true);
        const oldMessagesCount = messages.length;
        let data = [];
        try {
            data = await getMessages(reportId);
            setMessages(data || []);

            const newMessageAdded = data.length > oldMessagesCount && oldMessagesCount > 0;
            if (newMessageAdded) {
                setTimeout(() => scrollToBottom("smooth"), 50);
            } else if (isInitialLoad && isExpanded) {
                setTimeout(() => scrollToBottom("auto"), 300);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
        return data;
    }, [reportId, messages.length, isExpanded, scrollToBottom]);

    useEffect(() => {
        if (reportId) fetchMessages(true);
    }, [reportId, fetchMessages]);

    useEffect(() => {
        if (isExpanded && messages.length > 0) {
            setTimeout(() => scrollToBottom("smooth"), 300);
        }
    }, [isExpanded, messages.length, scrollToBottom]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const content = newMessageText.trim();
        if (!content) return;

        setSubmitting(true);
        try {
            await sendMessage(reportId, { content });
            setNewMessageText("");
            const data = await fetchMessages();
            if (data && data.length > 0) {
                setTimeout(() => scrollToBottom("smooth"), 50);
            }
            if (!isExpanded) setIsExpanded(true);
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const formatCommentDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        if (isToday) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
    };

    const renderMessageList = useMemo(() => {
        if (messages.length === 0) {
            return (
                <div className="rdm-empty-comments">
                    <p>No messages yet.</p>
                </div>
            );
        }

        return (
            <div className="rdm-comments-list">
                {messages.map((msg) => {
                    const isOwner = currentUserId && msg.author?.id && String(msg.author.id) === String(currentUserId);
                    const containerClass = isOwner ? "my-message" : "other-message";
                    const authorFullName = `${msg.author?.first_name || ''} ${msg.author?.last_name || ''}`.trim() || msg.author?.username || "Unknown";
                    const avatarSrc = msg.author?.personalPhotoUrl || DEFAULT_AVATAR;

                    return (
                        <div key={msg.id} className={`rdm-comment-item ${containerClass}`}>
                            <div className="rdm-comment-avatar">
                                <img 
                                    src={avatarSrc} 
                                    alt={`${authorFullName} avatar`} 
                                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
                                />
                            </div>

                            <div className="rdm-comment-body">
                                <div className="rdm-comment-header">
                                    {isOwner ? (
                                        <span className="rdm-comment-author" style={{ fontWeight: 'bold' }}>You</span>
                                    ) : (
                                        <span className="rdm-comment-author">{authorFullName}</span>
                                    )}
                                    <span className="rdm-comment-date">{formatCommentDate(msg.createdAt)}</span>
                                </div>
                                <div className="rdm-comment-content">{msg.content}</div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
        );
    }, [messages, currentUserId]);

    return (
        <div className="rdm-section mt-4">
            <div 
                className="rdm-section-title interactable d-flex justify-content-between align-items-center" 
                onClick={() => setIsExpanded(!isExpanded)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsExpanded(!isExpanded);
                    }
                }}
            >
                <div className="d-flex align-items-center gap-2">
                    <FaCommentAlt /> 
                    <span>Citizen Chat</span>
                    {messages.length > 0 && <span className="rdm-comment-count-badge">{messages.length}</span>}
                </div>
                
                <FaChevronDown className={`rdm-chevron-toggle ${isExpanded ? "rotate" : ""}`} />
            </div>

            <div className={`rdm-collapsible-wrapper ${isExpanded ? "open" : ""}`}>
                <div className="rdm-collapsible-inner">
                    <div className="rdm-comments-container">
                        
                        {renderMessageList}

                        <form className="rdm-comment-input-area" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                className="rdm-comment-input"
                                placeholder={canSend ? "Type a message..." : "Waiting for officer to start the chat..."}
                                value={newMessageText}
                                onChange={(e) => setNewMessageText(e.target.value)}
                                disabled={submitting || !canSend}
                            />
                            <button type="submit" className="rdm-comment-submit" disabled={submitting || !newMessageText.trim() || !canSend}>
                                {submitting ? 
                                    <span className="spinner-border spinner-border-sm" aria-hidden="true" /> 
                                    : <FaPaperPlane />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

CitizenChat.propTypes = {
    reportId: PropTypes.number.isRequired,
    currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isCitizen: PropTypes.bool,
};

export default CitizenChat;
