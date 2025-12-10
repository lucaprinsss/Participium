import React, { useState, useEffect, useRef } from "react";
import { FaCommentAlt, FaRegCommentDots, FaTrashAlt, FaPaperPlane, FaExclamationTriangle } from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";
import { getAllReportComments, addReportComment, deleteReportComment } from "../api/reportApi";

import "../css/ReportComments.css";

// URL per l'immagine di default se l'utente non ha una foto
const DEFAULT_AVATAR = "Profile_avatar_placeholder_large.png";

const ReportComments = ({ reportId, currentUserId }) => {
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newCommentText, setNewCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);

    // Stati per la Modale di Eliminazione
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const commentsEndRef = useRef(null);

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const data = await getAllReportComments(reportId);
            setComments(data || []);
            setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setLoadingComments(false);
        }
    };

    useEffect(() => {
        if (reportId) fetchComments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportId]);

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;
        setSubmittingComment(true);
        try {
            await addReportComment(reportId, { content: newCommentText });
            await fetchComments();
            setNewCommentText("");
        } catch (error) { console.error("Error posting comment:", error); }
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
        } catch (error) {
            console.error("Error deleting comment:", error);
            if (error.message && error.message.includes("JSON")) {
                setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
                setShowDeleteModal(false);
                setCommentToDelete(null);
            } else {
                alert("Error deleting comment. Please try again.");
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
            <h3 className="rdm-section-title"><FaCommentAlt /> Internal Comments</h3>

            <div className="rdm-comments-container">
                {loadingComments ? (
                    <div className="text-center py-4 text-muted small">Loading conversation...</div>
                ) : comments.length === 0 ? (
                    <div className="rdm-empty-comments">
                        <FaRegCommentDots size={24} className="mb-2" />
                        <p>No internal notes yet.</p>
                    </div>
                ) : (
                    <div className="rdm-comments-list">
                        {comments.map((comment) => {
                            const authorId = comment.authorId || comment.author?.id;
                            
                            // Controllo robusto: converte entrambi in stringa per evitare mismatch numero/stringa
                            const isMyComment = currentUserId && authorId 
                                ? String(authorId) === String(currentUserId) 
                                : false;

                            const containerClass = isMyComment ? "my-message" : "other-message";
                            
                            // Determina nome da visualizzare
                            const authorUsername = comment.author?.username || "Unknown";

                            // Determina immagine da visualizzare
                            const avatarSrc = comment.author?.personalPhotoUrl || DEFAULT_AVATAR;

                            return (
                                <div key={comment.id} className={`rdm-comment-item ${containerClass}`}>
                                    
                                    {/* SEZIONE AVATAR */}
                                    <div className="rdm-comment-avatar">
                                        <img 
                                            src={avatarSrc} 
                                            alt="user avatar" 
                                            // Stili inline per assicurarsi che sia rotonda se il CSS non lo prevede
                                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                                        />
                                    </div>

                                    <div className="rdm-comment-body">
                                        <div className="rdm-comment-header">
                                            <span className="rdm-comment-author">
                                                {isMyComment ? "You" : authorUsername}
                                            </span>
                                            <span className="rdm-comment-date">
                                                {formatCommentDate(comment.createdAt)}
                                            </span>
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