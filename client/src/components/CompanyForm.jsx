import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Row, Col, Form, Button, Alert, InputGroup, Dropdown } from "react-bootstrap";
import { createCompany } from "../api/companyApi";
import { getAllCategories } from "../api/reportApi";
import { FaBuilding, FaTag, FaSave, FaTimes, FaChevronDown } from "react-icons/fa";
import "../css/CompanyForm.css"; // Assicurati che il nome del file CSS corrisponda

// Updated helper with cf- classes
const getLabelClass = (hasError) => hasError ? "cf-label text-danger" : "cf-label";

getLabelClass.propTypes = {
    hasError: PropTypes.bool,
};

export default function CompanyForm({ onSuccess, onCancel }) {
    const initialFormState = { name: "", category: "" };

    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState({ loading: false, error: "", success: "" });
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        let mounted = true;
        async function fetchCategories() {
            try {
                const data = await getAllCategories();
                if (mounted) setCategories(data);
            } catch (e) { console.error(e); }
        }
        fetchCategories();
        return () => { mounted = false; };
    }, []);

    const updateField = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (status.error) setStatus(prev => ({ ...prev, error: "" }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Company Name is required";
        if (!formData.category.trim()) newErrors.category = "Category is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

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

            setFormData(initialFormState);

            if (onSuccess) {
                setTimeout(() => onSuccess(), 1000);
            }

        } catch (err) {
            const errorMessage = err.message || "Creation failed. Name might already exist.";
            setStatus(prev => ({ ...prev, error: errorMessage, loading: false }));
        }
    };

    return (
        <div className="cf-container-styled fade-in">
            <div className="cf-header-styled">
                <h4 className="cf-title">
                    <FaBuilding className="me-2" />New Company
                </h4>
                <div className="cf-header-actions d-flex align-items-center gap-3">
                    <button
                        type="button"
                        className="cf-btn-text"
                        onClick={onCancel}
                        disabled={status.loading}
                    >
                        <FaTimes /> Cancel
                    </button>
                </div>
            </div>

            <Form noValidate onSubmit={handleSubmit} className="cf-body-styled">
                {(status.error || status.success) && (
                    <Alert variant={status.error ? "danger" : "success"} className="cf-alert mb-4">
                        {status.error || status.success}
                    </Alert>
                )}

                <Row className="g-4">
                    <Col md={6} className="cf-col-left">
                        <h6 className="cf-section-header">Company Details</h6>
                        <Form.Group className="mb-3">
                            <Form.Label className={getLabelClass(errors.name)}>
                                Company Name <span className="req">*</span>
                            </Form.Label>
                            <InputGroup className={`cf-input-group ${errors.name ? 'has-error' : ''}`}>
                                <InputGroup.Text className="cf-icon"><FaBuilding /></InputGroup.Text>
                                <Form.Control
                                    placeholder="e.g. Acme Construction Ltd."
                                    value={formData.name}
                                    onChange={e => updateField('name', e.target.value)}
                                    className={`cf-input ${errors.name ? 'cf-input-error' : ''}`}
                                />
                            </InputGroup>
                            {errors.name && <div className="cf-field-error">{errors.name}</div>}
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <h6 className="cf-section-header">Classification</h6>
                        <Form.Group className="mb-3">
                            <Form.Label className={getLabelClass(errors.category)}>
                                Category <span className="req">*</span>
                            </Form.Label>
                            <InputGroup className={`cf-input-group ${errors.category ? 'has-error' : ''}`}>
                                <InputGroup.Text className="cf-icon"><FaTag /></InputGroup.Text>
                                <Dropdown
                                    onSelect={(val) => updateField('category', val)}
                                    className="cf-custom-dropdown"
                                >
                                    <Dropdown.Toggle
                                        variant="light"
                                        className={`cf-input cf-dropdown-toggle ${errors.category ? 'cf-input-error' : ''}`}
                                    >
                                        <div className="d-flex align-items-center justify-content-between w-100">
                                            <span
                                                className={`text-truncate ${formData.category ? '' : 'cf-placeholder-text'}`}
                                                style={{ flex: 1, textAlign: 'left' }}
                                            >
                                                {formData.category || "Select Category"}
                                            </span>
                                            <FaChevronDown className="cf-dropdown-arrow ms-2" />
                                        </div>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="cf-dropdown-menu">
                                        {categories.map((cat) => (
                                            <Dropdown.Item
                                                key={cat}
                                                eventKey={cat}
                                                active={formData.category === cat}
                                                className="cf-dropdown-item"
                                            >
                                                {cat}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </InputGroup>
                            {errors.category && <div className="cf-field-error">{errors.category}</div>}
                        </Form.Group>
                    </Col>
                </Row>

                <div className="cf-footer-actions">
                    <Button type="submit" className="cf-btn-primary" disabled={status.loading}>
                        {status.loading ? "Creating..." : <><FaSave className="me-2" /> Create Company</>}
                    </Button>
                </div>
            </Form>
        </div>
    );
}

CompanyForm.propTypes = {
    onSuccess: PropTypes.func,
    onCancel: PropTypes.func.isRequired,
};