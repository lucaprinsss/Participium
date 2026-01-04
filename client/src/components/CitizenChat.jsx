import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { FaCommentAlt, FaChevronDown, FaPaperPlane } from "react-icons/fa";
import { getMessages, sendMessage } from "../api/chatApi";
import "../css/ReportComments.css"; // Reuse styles

const DEFAULT_AVATAR = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

const CitizenChat = ({ reportId, currentUserId, isCitizen, initiallyExpanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newMessageText, setNewMessageText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const scrollContainerRef = useRef(null);
    
    // Ref to track messages for comparison without triggering re-renders/dependency changes
    const messagesRef = useRef(messages);
    useEffect(() => { messagesRef.current = messages; }, [messages]);

    const canSend = !isCitizen || (isCitizen && messages.length > 0);

    const scrollToBottom = useCallback((behavior = "smooth") => {
        if (scrollContainerRef.current) {
            const { scrollHeight, clientHeight } = scrollContainerRef.current;
            scrollContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: behavior
            });
        }
    }, []);

    const fetchMessages = useCallback(async (isInitialLoad = false, isPolling = false) => {
        if (!isPolling) setLoading(true);
        
        const currentMessages = messagesRef.current;
        const oldMessagesCount = currentMessages.length;
        let data = [];
        try {
            data = await getMessages(reportId);
            
            const hasChanges = data.length !== currentMessages.length || 
                (data.length > 0 && currentMessages.length > 0 && data[data.length-1].id !== currentMessages[currentMessages.length-1].id);

            if (!isPolling || hasChanges) {
                setMessages(data || []);

                const newMessageAdded = data.length > oldMessagesCount && oldMessagesCount > 0;
                if (newMessageAdded) {
                    setTimeout(() => scrollToBottom("smooth"), 50);
                } else if (isInitialLoad && isExpanded) {
                    setTimeout(() => scrollToBottom("auto"), 300);
                }
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            if (!isPolling) setLoading(false);
        }
        return data;
    }, [reportId, isExpanded, scrollToBottom]); // Removed 'messages' dependency

    useEffect(() => {
        if (reportId) fetchMessages(true);
    }, [reportId, fetchMessages]);

    // Polling for new messages
    useEffect(() => {
        let interval;
        if (isExpanded && reportId) {
            interval = setInterval(() => {
                fetchMessages(false, true);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isExpanded, reportId, fetchMessages]);

    useEffect(() => {
        if (isExpanded && messages.length > 0) {
            // Only scroll to bottom if we are near the bottom or it's the first open
            // For now, let's just scroll on open.
            setTimeout(() => scrollToBottom("smooth"), 300);
        }
        // Removed messages.length dependency to prevent auto-scroll on every poll if length changes but user is scrolling up
        // Actually, if length changes, we DO want to scroll if it's a new message.
        // But the fetchMessages logic already handles "newMessageAdded" scrolling.
        // This useEffect is mainly for when the user expands the chat.
    }, [isExpanded, scrollToBottom]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const content = newMessageText.trim();
        if (!content) return;

        setSubmitting(true);
        try {
            const newMessage = await sendMessage(reportId, { content });
            setNewMessageText("");
            
            // Optimistically update UI with the returned message
            if (newMessage) {
                setMessages(prev => [...prev, newMessage]);
                setTimeout(() => scrollToBottom("smooth"), 50);
            } else {
                // Fallback if no message returned (shouldn't happen based on API)
                await fetchMessages();
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
        return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
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
            <div className="rdm-comments-list" ref={scrollContainerRef}>
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
            </div>
        );
    }, [messages, currentUserId]);

    // If user is citizen and there are no messages, hide the component entirely
    // (But keep it mounted so polling works)
    if (isCitizen && messages.length === 0) {
        return null;
    }

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
    initiallyExpanded: PropTypes.bool,
};

export default CitizenChat;
