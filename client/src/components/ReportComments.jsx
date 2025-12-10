import React, { useState, useEffect, useRef } from "react";
import { FaCommentAlt, FaRegCommentDots, FaTrashAlt, FaPaperPlane, FaExclamationTriangle, FaChevronDown } from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";
import { getAllReportComments, addReportComment, deleteReportComment } from "../api/reportApi";

import "../css/ReportComments.css";

// URL placeholder se manca la foto
const DEFAULT_AVATAR = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

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

    const scrollToBottom = (behavior = "smooth") => {
        commentsEndRef.current?.scrollIntoView({ behavior: behavior });
    };

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const data = await getAllReportComments(reportId);
            const oldCommentsCount = comments.length; // Conto i vecchi commenti
            setComments(data || []);
            
            // Logica: Scrolla solo se era già aperto O se sono stati aggiunti nuovi commenti
            if (isExpanded || (data && data.length > oldCommentsCount && oldCommentsCount > 0)) {
                // Scrolla subito 'auto' per un'esperienza più fluida
                setTimeout(() => scrollToBottom("auto"), 50); 
            } else if (isExpanded) {
                // Scrolla 'auto' all'apertura iniziale se non ci sono commenti freschi
                setTimeout(() => scrollToBottom("auto"), 300);
            }
            
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setLoadingComments(false);
        }
    };

    // Carica i commenti all'avvio del componente
    useEffect(() => {
        if (reportId) fetchComments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportId]);

    // Scrolla in basso quando si apre la tendina (transizione da 0 a 1fr) O se la lista è stata inizializzata (caricamento iniziale)
    useEffect(() => {
        if (isExpanded && comments.length > 0 && commentsEndRef.current) {
            // Un breve timeout per permettere all'animazione CSS di finire prima dello scroll
            setTimeout(() => scrollToBottom("smooth"), 300);
        }
    }, [isExpanded]); 

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;
        setSubmittingComment(true);
        try {
            // Aggiungi commento
            await addReportComment(reportId, { content: newCommentText });
            setNewCommentText("");
            
            // Ricarica la lista per includere il nuovo commento
            const data = await getAllReportComments(reportId);
            setComments(data || []);
            
            // Forza lo scroll alla fine (risolve il glitch)
            if (data && data.length > 0) {
                 setTimeout(() => scrollToBottom("smooth"), 50);
            }

            showToast("Comment added successfully!", "success");
            // Se si aggiunge un commento, assicurati che la tendina sia aperta
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

    const confirmDelete = async () => {
        if (!commentToDelete) return;
        setIsDeleting(true);
        try {
            await deleteReportComment(reportId, commentToDelete);
            setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
            setShowDeleteModal(false);
            setCommentToDelete(null);
            showToast("Comment deleted.", "success");
        } catch (error) {
            console.error("Error deleting comment:", error);
            
            // Logica per gestire la risposta non-JSON in caso di successo (frequente nelle API DELETE)
            if (error.message && error.message.includes("JSON")) {
                setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
                setShowDeleteModal(false);
                setCommentToDelete(null);
                showToast("Comment deleted.", "success");
            } else {
                showToast("Error deleting comment. Please try again.", "error"); 
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const formatCommentDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        if (isToday) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
    };

    return (
        <div className="rdm-section mt-4">
            {/* HEADER CLICCABILE */}
            <div 
                className="rdm-section-title interactable d-flex justify-content-between align-items-center" 
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="d-flex align-items-center gap-2">
                    <FaCommentAlt /> 
                    <span>Internal Comments</span>
                    {/* Badge opzionale conteggio commenti */}
                    {comments.length > 0 && <span className="rdm-comment-count-badge">{comments.length}</span>}
                </div>
                
                {/* FRECCETTA CHE RUOTA */}
                <FaChevronDown className={`rdm-chevron-toggle ${isExpanded ? "rotate" : ""}`} />
            </div>

            {/* WRAPPER PER L'ANIMAZIONE "A TENDINA" */}
            <div className={`rdm-collapsible-wrapper ${isExpanded ? "open" : ""}`}>
                <div className="rdm-collapsible-inner">
                    <div className="rdm-comments-container">
                        {loadingComments ? (
                            <div className="text-center py-4 text-muted small">Loading conversation...</div>
                        ) : comments.length === 0 && !loadingComments ? (
                            <div className="rdm-empty-comments">
                                <FaRegCommentDots size={24} className="mb-2" />
                                <p>No internal notes yet.</p>
                            </div>
                        ) : (
                            <div className="rdm-comments-list">
                                {comments.map((comment) => {
                                    const authorId = comment.authorId || comment.author?.id;
                                    const isMyComment = currentUserId && authorId
                                        ? String(authorId) === String(currentUserId)
                                        : false;

                                    const containerClass = isMyComment ? "my-message" : "other-message";
                                    const authorFullName = `${comment.author?.first_name || ''} ${comment.author?.last_name || ''}`.trim() || comment.author?.username || "Unknown";
                                    
                                    // LOGICA AGGIORNATA: Usa l'immagine specifica o il DEFAULT_AVATAR
                                    const avatarSrc = comment.author?.personalPhotoUrl || DEFAULT_AVATAR;

                                    return (
                                        <div key={comment.id} className={`rdm-comment-item ${containerClass}`}>
                                            <div className="rdm-comment-avatar">
                                                {/* Mostra sempre l'immagine, con fallback a DEFAULT_AVATAR se l'URL non carica */}
                                                <img 
                                                    src={avatarSrc} 
                                                    alt={`${authorFullName} avatar`} 
                                                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                                                    // Fallback: se l'immagine non carica, usiamo il DEFAULT_AVATAR.
                                                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
                                                />
                                            </div>

                                            <div className="rdm-comment-body">
                                                <div className="rdm-comment-header">
                                                    {isMyComment ? (
                                                        <span className="rdm-comment-author" style={{ fontWeight: 'bold' }}>You</span>
                                                    ) : (
                                                        <span className="rdm-comment-author">{authorFullName}</span>
                                                    )}
                                                    <span className="rdm-comment-date">{formatCommentDate(comment.createdAt)}</span>
                                                </div>
                                                <div className="rdm-comment-content">{comment.content}</div>
                                            </div>

                                            {isMyComment && (
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
                                })}
                                <div ref={commentsEndRef} />
                            </div>
                        )}

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
                                {submittingComment ? <span className="spinner-border spinner-border-sm" /> : <FaPaperPlane />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <Modal
                show={showDeleteModal}
                onHide={() => !isDeleting && setShowDeleteModal(false)}
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
                            onClick={() => setShowDeleteModal(false)}
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
        </div>
    );
};

export default ReportComments;