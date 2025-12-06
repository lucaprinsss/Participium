import { useEffect, useState } from "react";
import { Row, Col, Form, Button, Alert, InputGroup, Dropdown } from "react-bootstrap";
import { createCompany } from "../api/companyApi";
import { FaBuilding, FaTag, FaSave, FaTimes, FaChevronDown } from "react-icons/fa";
import "../css/MunicipalityUserForm.css"; // Riutilizza lo stesso CSS

import { getAllCategories } from "../api/reportApi";

// --- Utility Helper ---
const getLabelClass = (hasError) => hasError ? "muf-label text-danger" : "muf-label";

export default function CompanyForm({ refreshTrigger }) {
    const initialFormState = { name: "", category: "" };

    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState({ loading: false, error: "", success: "" });
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        async function fetchCategories() {
            const categories = await getAllCategories();
            setCategories(categories);
        }
        fetchCategories();
    }, []); // Or [] if effect doesn't need props or state

    // --- Helper Updates ---
    const updateField = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (status.error) setStatus(prev => ({ ...prev, error: "" }));
    };

    // --- Validation ---
    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Company Name is required";
        if (!formData.category.trim()) newErrors.category = "Category is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus(prev => ({ ...prev, error: "", success: "" }));

        if (!validate()) return;

        setStatus(prev => ({ ...prev, loading: true }));
        try {
            const payload = {
                name: formData.name,
                category: formData.category
            };

            const newCompany = await createCompany(payload);

            setStatus(prev => ({
                ...prev,
                success: `Company "${newCompany.name}" created successfully!`,
                loading: false
            }));

            // Reset form
            setFormData(initialFormState);

            // Callback al genitore
            if (refreshTrigger) refreshTrigger();

        } catch (err) {
            const errorMessage = err.message || "Creation failed. Name might already exist.";
            setStatus(prev => ({ ...prev, error: errorMessage, loading: false }));
        }
    };

    return (
        <div className="muf-container-styled fade-in">
            {/* Header */}
            <div className="muf-header-styled">
                <h4 className="muf-title">
                    <FaBuilding className="me-2" />New Company
                </h4>
                <div className="muf-header-actions d-flex align-items-center gap-3">
                    <button
                        type="button"
                        className="muf-btn-text"
                        onClick={() => refreshTrigger && refreshTrigger()}
                        disabled={status.loading}
                    >
                        <FaTimes /> Cancel
                    </button>
                </div>
            </div>

            {/* Body */}
            <Form noValidate onSubmit={handleSubmit} className="muf-body-styled">
                {/* Alerts */}
                {(status.error || status.success) && (
                    <Alert variant={status.error ? "danger" : "success"} className="muf-alert mb-4">
                        {status.error || status.success}
                    </Alert>
                )}

                <Row className="g-4">
                    {/* Left Column: Company Name */}
                    <Col md={6} className="muf-col-left">
                        <h6 className="muf-section-header">Company Details</h6>

                        <Form.Group className="mb-3">
                            <Form.Label className={getLabelClass(errors.name)}>
                                Company Name <span className="req">*</span>
                            </Form.Label>
                            <InputGroup className={`muf-input-group ${errors.name ? 'has-error' : ''}`}>
                                <InputGroup.Text className="muf-icon"><FaBuilding /></InputGroup.Text>
                                <Form.Control
                                    placeholder="e.g. Acme Construction Ltd."
                                    value={formData.name}
                                    onChange={e => updateField('name', e.target.value)}
                                    className={`muf-input ${errors.name ? 'muf-input-error' : ''}`}
                                />
                            </InputGroup>
                            {errors.name && <div className="muf-field-error">{errors.name}</div>}
                        </Form.Group>
                    </Col>

                    {/* Right Column: Category (Dropdown) */}
                    <Col md={6}>
                        <h6 className="muf-section-header">Classification</h6>

                        <Form.Group className="mb-3">
                            <Form.Label className={getLabelClass(errors.category)}>
                                Category <span className="req">*</span>
                            </Form.Label>
                            <InputGroup className={`muf-input-group ${errors.category ? 'has-error' : ''}`}>
                                <InputGroup.Text className="muf-icon"><FaTag /></InputGroup.Text>

                                <Dropdown
                                    onSelect={(val) => updateField('category', val)}
                                    className="muf-custom-dropdown"
                                >
                                    <Dropdown.Toggle
                                        variant="light"
                                        className={`muf-input muf-dropdown-toggle ${errors.category ? 'muf-input-error' : ''}`}
                                    >
                                        <div className="d-flex align-items-center justify-content-between w-100">
                                            <span
                                                className={`text-truncate ${!formData.category ? 'muf-placeholder-text' : ''}`}
                                                style={{ flex: 1, textAlign: 'left' }}
                                            >
                                                {formData.category || "Select Category"}
                                            </span>
                                            <FaChevronDown className="muf-dropdown-arrow ms-2" />
                                        </div>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu className="muf-dropdown-menu">
                                        {categories.map((cat, idx) => (
                                            <Dropdown.Item
                                                key={idx}
                                                eventKey={cat}
                                                active={formData.category === cat}
                                                className="muf-dropdown-item"
                                            >
                                                {cat}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>

                            </InputGroup>
                            {errors.category && <div className="muf-field-error">{errors.category}</div>}
                        </Form.Group>
                    </Col>
                </Row>

                {/* Footer Actions */}
                <div className="muf-footer-actions">
                    <Button type="submit" className="muf-btn-primary" disabled={status.loading}>
                        {status.loading ? "Creating..." : <><FaSave className="me-2" /> Create Company</>}
                    </Button>
                </div>
            </Form>
        </div>
    );
}