import React, { useState, useEffect, useRef } from "react";
import { FaCommentAlt, FaRegCommentDots, FaTrashAlt, FaPaperPlane, FaExclamationTriangle } from "react-icons/fa";
import { Modal, Button } from "react-bootstrap"; // Import necessario
import { getAllReportComments, addReportComment, deleteReportComment } from "../api/reportApi";

import "../css/ReportComments.css";

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

    // 1. Apre la modale invece di window.confirm
    const requestDelete = (commentId) => {
        setCommentToDelete(commentId);
        setShowDeleteModal(true);
    };

    // 2. Esegue l'eliminazione effettiva
    const confirmDelete = async () => {
    if (!commentToDelete) return;
    
    setIsDeleting(true);
    try {
        await deleteReportComment(reportId, commentToDelete);
        
        // SUCCESSO STANDARD
        setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
        setShowDeleteModal(false);
        setCommentToDelete(null);

    } catch (error) {
        console.error("Error deleting comment:", error);
        
        // WORKAROUND: Se l'errore è di parsing JSON ma il server ha fatto il suo lavoro
        if (error.message && error.message.includes("JSON")) {
            // Assumiamo sia andato tutto bene e aggiorniamo la UI
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
                            const isMyComment = currentUserId && authorId
                                ? Number(authorId) === Number(currentUserId)
                                : false;
                            
                            const containerClass = isMyComment ? "my-message" : "other-message";

                            return (
                                <div key={comment.id} className={`rdm-comment-item ${containerClass}`}>
                                    <div className="rdm-comment-avatar">
                                        {comment.author?.first_name?.charAt(0) || "?"}{comment.author?.last_name?.charAt(0) || ""}
                                    </div>

                                    <div className="rdm-comment-body">
                                        <div className="rdm-comment-header">
                                            {!isMyComment && (
                                                <span className="rdm-comment-author">
                                                    {comment.author?.username || `${comment.author?.first_name} ${comment.author?.last_name}`}
                                                </span>
                                            )}
                                            <span className="rdm-comment-date">{formatCommentDate(comment.createdAt)}</span>
                                        </div>
                                        <div className="rdm-comment-content">{comment.content}</div>
                                    </div>

                                    {/* Delete Button trigger */}
                                    {isMyComment && (
                                        <button 
                                            className="rdm-comment-delete" 
                                            onClick={() => requestDelete(comment.id)} // Chiama la modale
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

            {/* --- CUSTOM DELETE MODAL --- */}
            <Modal 
                show={showDeleteModal} 
                onHide={() => !isDeleting && setShowDeleteModal(false)} 
                centered 
                className="rdm-delete-modal"
                backdrop="static" // Impedisce la chiusura cliccando fuori durante l'eliminazione
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