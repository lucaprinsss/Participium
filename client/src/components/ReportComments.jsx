import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { FaCommentAlt, FaRegCommentDots, FaTrashAlt, FaPaperPlane, FaExclamationTriangle, FaChevronDown } from "react-icons/fa";
import { Modal, Button, /* Spinner */ } from "react-bootstrap";
import { getAllReportComments, addReportComment, deleteReportComment } from "../api/reportApi";

import "../css/ReportComments.css";

// URL placeholder se manca la foto
const DEFAULT_AVATAR = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

// --- SUB-COMPONENTI ESTRATTI ---

/**
 * 1. Logica e rendering del singolo commento.
 */
const CommentItem = React.memo(({ comment, isMyComment, currentUserId, requestDelete, formatCommentDate }) => {
    const authorId = comment.authorId || comment.author?.id;
    const isOwner = isMyComment && currentUserId && authorId && String(authorId) === String(currentUserId);

    const containerClass = isOwner ? "my-message" : "other-message";
    const authorFullName = `${comment.author?.first_name || ''} ${comment.author?.last_name || ''}`.trim() || comment.author?.username || "Unknown";
    const avatarSrc = comment.author?.personalPhotoUrl || DEFAULT_AVATAR;

    return (
        <div key={comment.id} className={`rdm-comment-item ${containerClass}`}>
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
                    <span className="rdm-comment-date">{formatCommentDate(comment.createdAt)}</span>
                </div>
                <div className="rdm-comment-content">{comment.content}</div>
            </div>

            {isOwner && (
                <button
                    className="rdm-comment-delete"
                    onClick={() => requestDelete(comment.id)}
                    title="Delete message"
                >
                    <FaTrashAlt />
                </button>
            )}
        </div>
    );
});

CommentItem.propTypes = {
    comment: PropTypes.object.isRequired,
    isMyComment: PropTypes.bool.isRequired,
    currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    requestDelete: PropTypes.func.isRequired,
    formatCommentDate: PropTypes.func.isRequired,
};


/**
 * 2. Modale di conferma cancellazione
 */
const DeleteConfirmationModal = React.memo(({ show, onHide, confirmDelete, isDeleting }) => (
    <Modal
        show={show}
        onHide={onHide}
        centered
        className="rdm-delete-modal"
        backdrop="static"
    >
        <Modal.Body className="text-center p-4">
            <div className="rdm-delete-icon-wrapper mb-3">
                <FaExclamationTriangle size={32} />
            </div>
            <h5 className="mb-2">Delete Comment?</h5>
            <p className="text-muted mb-4 small">
                This action cannot be undone. Are you sure you want to remove this message?
            </p>
            <div className="d-flex justify-content-center gap-2">
                <Button
                    variant="secondary"
                    className="rdm-btn-cancel"
                    onClick={onHide}
                    disabled={isDeleting}
                >
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    className="rdm-btn-confirm"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                >
                    {isDeleting ? "Deleting..." : "Delete"}
                </Button>
            </div>
        </Modal.Body>
    </Modal>
));

DeleteConfirmationModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    confirmDelete: PropTypes.func.isRequired,
    isDeleting: PropTypes.bool.isRequired,
};

// --- COMPONENTE PRINCIPALE ---

const ReportComments = ({ reportId, currentUserId, showToast }) => { 
    // Stato per gestire l'apertura/chiusura
    const [isExpanded, setIsExpanded] = useState(false);

    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newCommentText, setNewCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const commentsEndRef = useRef(null);

    // --- UTILITY ---
    const scrollToBottom = useCallback((behavior = "smooth") => {
        commentsEndRef.current?.scrollIntoView({ behavior: behavior });
    }, []);

    const formatCommentDate = useCallback((dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        if (isToday) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
    }, []);

    // --- FETCH LOGIC ---
    const fetchComments = useCallback(async (isInitialLoad = false) => {
        setLoadingComments(true);
        const oldCommentsCount = comments.length; 
        let data = [];

        try {
            data = await getAllReportComments(reportId);
            setComments(data || []);
            
            // Logica Semplificata di Scroll:
            const newCommentAdded = data.length > oldCommentsCount && oldCommentsCount > 0;
            
            if (newCommentAdded) {
                // Smooth scroll only when a comment is added FROM OUTSIDE (e.g. reload)
                setTimeout(() => scrollToBottom("smooth"), 50); 
            } else if (isInitialLoad && isExpanded) {
                 // Scrolla subito 'auto' all'apertura iniziale se non ci sono commenti freschi
                setTimeout(() => scrollToBottom("auto"), 300);
            }
            
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setLoadingComments(false);
        }
        return data;
    }, [reportId, comments.length, isExpanded, scrollToBottom]);

    // Carica i commenti all'avvio del componente (dipendenza corretta)
    useEffect(() => {
        if (reportId) fetchComments(true);
    }, [reportId, fetchComments]);

    // Scroll down when the dropdown opens (handles animation)
    useEffect(() => {
        // Scroll only if open AND there are comments
        if (isExpanded && comments.length > 0) {
            // A brief timeout to allow the CSS animation to finish before scrolling
            setTimeout(() => scrollToBottom("smooth"), 300);
        }
    }, [isExpanded, comments.length, scrollToBottom]); 

    // --- HANDLERS ---
    const handlePostComment = async (e) => {
        e.preventDefault();
        const content = newCommentText.trim();
        if (!content) return;
        
        setSubmittingComment(true);
        try {
            await addReportComment(reportId, { content });
            setNewCommentText("");
            
            // Reload the list and handle scroll internally in the fetch call
            const data = await fetchComments(); 
            
            // Force scroll to the end (fixes post-send glitch)
            if (data && data.length > 0) {
                 setTimeout(() => scrollToBottom("smooth"), 50);
            }

            showToast("Comment added successfully!", "success");
            if (!isExpanded) setIsExpanded(true);
            
        } catch (error) { 
            console.error("Error posting comment:", error); 
            showToast("Failed to post comment. Please try again.", "error");
        }
        finally { setSubmittingComment(false); }
    };

    const requestDelete = (commentId) => {
        setCommentToDelete(commentId);
        setShowDeleteModal(true);
    };
    
    const hideDeleteModal = () => {
        if (!isDeleting) {
            setShowDeleteModal(false);
            setCommentToDelete(null);
        }
    };

    const confirmDelete = async () => {
        if (!commentToDelete) return;
        setIsDeleting(true);
        try {
            await deleteReportComment(reportId, commentToDelete);
            
            // Update state based on response, even for non-JSON expected response (DELETE API)
            setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
            
            showToast("Comment deleted.", "success");
            hideDeleteModal();

        } catch (error) {
            console.error("Error deleting comment:", error);
             // Explicit success handling even if response is not JSON (common in DELETE APIs)
            if (error.message && error.message.includes("JSON")) {
                 setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
                 showToast("Comment deleted.", "success");
                 hideDeleteModal();
            } else {
                 showToast("Error deleting comment. Please try again.", "error"); 
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const isCommentOwner = useCallback((comment) => {
        const authorId = comment.authorId || comment.author?.id;
        return currentUserId && authorId ? String(authorId) === String(currentUserId) : false;
    }, [currentUserId]);


    // --- RENDERING ---
    
    // Lista di commenti o stato vuoto/caricamento
    const renderCommentList = useMemo(() => {
        if (loadingComments) {
            //return <div className="text-center py-4 text-muted small"><Spinner animation="border" size="sm" className="me-2" /> Loading conversation...</div>;
        } 
        if (comments.length === 0) {
            return (
                <div className="rdm-empty-comments">
                    <FaRegCommentDots size={24} className="mb-2" />
                    <p>No internal notes yet.</p>
                </div>
            );
        }

        return (
            <div className="rdm-comments-list">
                {comments.map((comment) => (
                    <CommentItem 
                        key={comment.id} 
                        comment={comment}
                        isMyComment={isCommentOwner(comment)}
                        currentUserId={currentUserId}
                        requestDelete={requestDelete}
                        formatCommentDate={formatCommentDate}
                    />
                ))}
                <div ref={commentsEndRef} />
            </div>
        );
    }, [loadingComments, comments, currentUserId, formatCommentDate, isCommentOwner, requestDelete]);

    return (
        <div className="rdm-section mt-4">
            {/* HEADER CLICCABILE CORRETTO PER A11Y (S6848, S1082) */}
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
                    <span>Internal Comments</span>
                    {/* Badge conteggio commenti */}
                    {comments.length > 0 && <span className="rdm-comment-count-badge">{comments.length}</span>}
                </div>
                
                {/* FRECCETTA CHE RUOTA */}
                <FaChevronDown className={`rdm-chevron-toggle ${isExpanded ? "rotate" : ""}`} />
            </div>

            {/* WRAPPER PER L'ANIMAZIONE "A TENDINA" */}
            <div className={`rdm-collapsible-wrapper ${isExpanded ? "open" : ""}`}>
                <div className="rdm-collapsible-inner">
                    <div className="rdm-comments-container">
                        
                        {renderCommentList}

                        <form className="rdm-comment-input-area" onSubmit={handlePostComment}>
                            <input
                                type="text"
                                className="rdm-comment-input"
                                placeholder="Type a message..."
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                disabled={submittingComment}
                            />
                            <button type="submit" className="rdm-comment-submit" disabled={submittingComment || !newCommentText.trim()}>
                                {submittingComment ? 
                                    // Correzione S6848 (Rigo 355): Rimosso role="status"
                                    <span className="spinner-border spinner-border-sm" aria-hidden="true" /> 
                                    : <FaPaperPlane />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <DeleteConfirmationModal 
                show={showDeleteModal}
                onHide={hideDeleteModal}
                confirmDelete={confirmDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
};

ReportComments.propTypes = {
    reportId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    showToast: PropTypes.func.isRequired,
};

export default ReportComments;