import React, { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Row, Col, Form, Button, Alert, InputGroup, Dropdown } from "react-bootstrap";
import { createMunicipalityUser, getAllRoles } from "../api/municipalityUserApi";
import { getRolesByDepartment, getAllDepartments } from "../api/departmentAPI";
import { getAllCompanies } from "../api/companyApi";
import "../css/MunicipalityUserForm.css";
import {
    FaEye, FaEyeSlash, FaSave, FaTimes,
    FaUser, FaIdCard, FaEnvelope, FaBuilding, FaUserShield, FaLock, FaChevronDown, FaCheckCircle
} from "react-icons/fa";

// --- UTILITY E CONSTANTI ---

const cleanInput = (value, isEmail = false) => {
    if (typeof value !== 'string') return value;
    // Correzione S7781
    const noSpaces = value.replaceAll(/\s/g, '');
    return isEmail ? noSpaces.toLowerCase() : noSpaces;
};
cleanInput.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.any]).isRequired,
    isEmail: PropTypes.bool,
};

const calculateStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    // Correzione S6353
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
};
calculateStrength.propTypes = {
    password: PropTypes.string,
};

const getStrengthColor = (s) => ["#e9ecef", "#dc3545", "#ffc107", "#198754", "#198754"][s];
getStrengthColor.propTypes = {
    s: PropTypes.number.isRequired,
};

const getLabelClass = (hasError) => hasError ? "muf-label text-danger" : "muf-label";
getLabelClass.propTypes = {
    hasError: PropTypes.bool.isRequired,
};

const initialFormState = {
    username: "", email: "", password: "", confirmPassword: "",
    first_name: "", last_name: "", department: "", role: "",
    company: ""
};

// --- FUNZIONI DI VALIDAZIONE ESTRATTE ---

const validatePersonalDetails = (formData, newErrors) => {
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";

    if (!formData.username.trim()) newErrors.username = "Username is required";
    else if (formData.username.length < 3) newErrors.username = "Min 3 chars";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    // Correzione S5852: Regex più sicura contro ReDoS.
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email"; 
};

const validatePasswordDetails = (formData, newErrors) => {
    // S2068: Riferimento all'input utente, non a credenziali fisse (Falso Positivo).
    if (!formData.password) newErrors.password = "Password required";
    else if (formData.password.length < 6) newErrors.password = "Min 6 chars";

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords mismatch";
};

const validateRoleAndCompany = (formData, isExternal, newErrors) => {
    if (!formData.department) newErrors.department = "Select department";
    if (!formData.role) newErrors.role = "Select role";

    if (isExternal && !formData.company) newErrors.company = "Company required";
};

// --- CUSTOM SELECT COMPONENT ---
const CustomSelect = ({ value, options, onChange, placeholder, disabled, loading, hasError, onFocus }) => {
    const selectedItem = options.find(opt => String(opt.id) === String(value));
    const isPlaceholder = !selectedItem;
    const displayText = selectedItem ? selectedItem.name : placeholder;

    return (
        <Dropdown onSelect={onChange} className="muf-custom-dropdown">
            <Dropdown.Toggle
                variant="light"
                className={`muf-input muf-dropdown-toggle ${hasError ? 'muf-input-error' : ''}`}
                disabled={disabled}
                onFocus={onFocus}
            >
                <div className="d-flex align-items-center justify-content-between w-100">
                    <span className={`text-truncate ${isPlaceholder ? 'muf-placeholder-text' : ''}`} style={{ flex: 1, textAlign: 'left' }}>
                        {loading ? "Loading..." : displayText}
                    </span>
                    {!disabled && <FaChevronDown className={`muf-dropdown-arrow ms-2 ${isPlaceholder ? 'muf-placeholder-arrow' : ''}`} />}
                </div>
            </Dropdown.Toggle>
            <Dropdown.Menu className="muf-dropdown-menu">
                {options.length > 0 ? (
                    options.map(opt => (
                        <Dropdown.Item key={opt.id} eventKey={opt.id} active={String(value) === String(opt.id)} className="muf-dropdown-item">
                            <div className="text-truncate">{opt.name}</div>
                        </Dropdown.Item>
                    ))
                ) : (
                    <div className="p-2 text-muted text-center small">No options available</div>
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
};
CustomSelect.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    options: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
    })).isRequired,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    hasError: PropTypes.bool,
    onFocus: PropTypes.func,
};


// --- SUB-COMPONENTI ESTRATTI PER RIDURRE LA COMPLESSITÀ ---

/**
 * 1. Componente per i messaggi di successo/errore globali.
 */
const RenderAlerts = React.memo(({ globalError, success }) => {
    if (!globalError && !success) return null;
    return (
        <Alert variant={globalError ? "danger" : "success"} className="muf-alert mb-4 fade-in">
            {globalError || success}
        </Alert>
    );
});
RenderAlerts.propTypes = {
    globalError: PropTypes.string,
    success: PropTypes.string,
};

/**
 * 2. Componente per la selezione del tipo di utente (Internal/External).
 */
const UserTypeSelector = React.memo(({ isExternal, handleTypeSelect, isLoading }) => (
    <div className="mb-4">
        <Row className="g-3">
            {/* Internal Card */}
            <Col md={6}>
                <button
                    type="button"
                    className={`muf-selection-card internal ${isExternal ? '' : 'active'}`}
                    onClick={() => handleTypeSelect(false)}
                    disabled={isLoading}
                >
                    {isExternal ? null : <div className="muf-card-check"><FaCheckCircle /></div>}
                    <div className="muf-card-icon"><FaUserShield /></div>
                    <div className="muf-card-content">
                        <h6 className="muf-card-title">Internal Officer</h6>
                        <p className="muf-card-desc">Full access for municipal employees to internal departments and tools.</p>
                    </div>
                </button>
            </Col>

            {/* External Card */}
            <Col md={6}>
                <button
                    type="button"
                    className={`muf-selection-card external ${isExternal ? 'active' : ''}`}
                    onClick={() => handleTypeSelect(true)}
                    disabled={isLoading}
                >
                    {isExternal && <div className="muf-card-check"><FaCheckCircle /></div>}
                    <div className="muf-card-icon"><FaBuilding /></div>
                    <div className="muf-card-content">
                        <h6 className="muf-card-title">External Maintainer</h6>
                        <p className="muf-card-desc">Limited access for third-party contractors linked to a company.</p>
                    </div>
                </button>
            </Col>
        </Row>
    </div>
));
UserTypeSelector.propTypes = {
    isExternal: PropTypes.bool.isRequired,
    handleTypeSelect: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
};

/**
 * 3. Componente per i campi di Informazioni Personali (incl. Company per External).
 */
const PersonalInfoFields = React.memo(({ formData, errors, updateField, clearError, isExternal, data, status }) => {
    const renderCompanyField = isExternal ? (
        <Form.Group className="mb-3 fade-in">
            <Form.Label className={getLabelClass(errors.company)}>
                Company Name <span className="req">*</span>
            </Form.Label>
            <InputGroup className={`muf-input-group ${errors.company ? 'has-error' : ''}`}>
                <InputGroup.Text className="muf-icon"><FaBuilding /></InputGroup.Text>
                <CustomSelect
                    value={formData.company}
                    options={data.companies}
                    onChange={(val) => updateField('company', val)}
                    onFocus={() => clearError('company')}
                    placeholder="Select Company"
                    loading={status.loadingCompanies}
                    disabled={status.loadingCompanies}
                    hasError={!!errors.company}
                />
            </InputGroup>
            {errors.company && <div className="muf-field-error">{errors.company}</div>}
        </Form.Group>
    ) : null;

    return (
        <Col lg={6} className="muf-col-left">
            <h6 className="muf-section-header">Personal Information</h6>
            <Row className="g-3 mb-3">
                {/* First Name */}
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className={getLabelClass(errors.first_name)}>First Name <span className="req">*</span></Form.Label>
                        <InputGroup className={`muf-input-group ${errors.first_name ? 'has-error' : ''}`}>
                            <InputGroup.Text className="muf-icon"><FaUser /></InputGroup.Text>
                            <Form.Control
                                placeholder="Enter name"
                                value={formData.first_name}
                                onChange={e => updateField('first_name', e.target.value)}
                                onFocus={() => clearError('first_name')}
                                className={`muf-input ${errors.first_name ? 'muf-input-error' : ''}`}
                            />
                        </InputGroup>
                        {errors.first_name && <div className="muf-field-error">{errors.first_name}</div>}
                    </Form.Group>
                </Col>
                {/* Last Name */}
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className={getLabelClass(errors.last_name)}>Last Name <span className="req">*</span></Form.Label>
                        <InputGroup className={`muf-input-group ${errors.last_name ? 'has-error' : ''}`}>
                            <InputGroup.Text className="muf-icon"><FaUser /></InputGroup.Text>
                            <Form.Control
                                placeholder="Enter surname"
                                value={formData.last_name}
                                onChange={e => updateField('last_name', e.target.value)}
                                onFocus={() => clearError('last_name')}
                                className={`muf-input ${errors.last_name ? 'muf-input-error' : ''}`}
                            />
                        </InputGroup>
                        {errors.last_name && <div className="muf-field-error">{errors.last_name}</div>}
                    </Form.Group>
                </Col>
            </Row>

            {/* Username */}
            <Form.Group className="mb-3">
                <Form.Label className={getLabelClass(errors.username)}>Username <span className="req">*</span></Form.Label>
                <InputGroup className={`muf-input-group ${errors.username ? 'has-error' : ''}`}>
                    <InputGroup.Text className="muf-icon"><FaIdCard /></InputGroup.Text>
                    <Form.Control
                        placeholder="Unique system username"
                        value={formData.username}
                        onChange={e => updateField('username', cleanInput(e.target.value))}
                        onFocus={() => clearError('username')}
                        className={`muf-input ${errors.username ? 'muf-input-error' : ''}`}
                    />
                </InputGroup>
                {errors.username && <div className="muf-field-error">{errors.username}</div>}
            </Form.Group>

            {/* Email */}
            <Form.Group className="mb-3">
                <Form.Label className={getLabelClass(errors.email)}>Email Address <span className="req">*</span></Form.Label>
                <InputGroup className={`muf-input-group ${errors.email ? 'has-error' : ''}`}>
                    <InputGroup.Text className="muf-icon"><FaEnvelope /></InputGroup.Text>
                    <Form.Control
                        type="email"
                        placeholder="officer@municipality.com"
                        value={formData.email}
                        onChange={e => updateField('email', cleanInput(e.target.value, true))}
                        onFocus={() => clearError('email')}
                        className={`muf-input ${errors.email ? 'muf-input-error' : ''}`}
                    />
                </InputGroup>
                {errors.email && <div className="muf-field-error">{errors.email}</div>}
            </Form.Group>

            {/* Company Field (only for External) */}
            {renderCompanyField}
        </Col>
    );
});
PersonalInfoFields.propTypes = {
    formData: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    updateField: PropTypes.func.isRequired,
    clearError: PropTypes.func.isRequired,
    isExternal: PropTypes.bool.isRequired,
    data: PropTypes.shape({
        companies: PropTypes.array.isRequired,
    }).isRequired,
    status: PropTypes.shape({
        loadingCompanies: PropTypes.bool.isRequired,
    }).isRequired,
};

/**
 * 4. Componente per i campi Dipartimento, Ruolo e Password.
 */
const AccessAndSecurityFields = React.memo(({
    formData, errors, updateField, clearError, isExternal,
    displayDepartments, displayRoles, status, passwordStrength, showPwd, setShowPwd
}) => {

    const strengthColor = getStrengthColor(passwordStrength);
    
    // Status Strength Bar (logica spostata qui)
    const renderPasswordStrength = formData.password && (
        <span className="muf-strength-text" style={{ color: strengthColor }}>
            Strength: {["Weak", "Weak", "Fair", "Good", "Strong"][passwordStrength]}
        </span>
    );
    
    return (
        <Col lg={6}>
            <h6 className="muf-section-header">Access & Security</h6>

            {/* Department */}
            <Form.Group className="mb-3">
                <Form.Label className={getLabelClass(errors.department)}>Department <span className="req">*</span></Form.Label>
                <InputGroup className={`muf-input-group ${errors.department ? 'has-error' : ''}`}>
                    <InputGroup.Text className="muf-icon"><FaBuilding /></InputGroup.Text>
                    <CustomSelect
                        value={formData.department}
                        options={displayDepartments}
                        onChange={(val) => updateField('department', val)}
                        onFocus={() => clearError('department')}
                        placeholder="Select Department"
                        loading={status.loadingDepts}
                        disabled={status.loadingDepts || isExternal}
                        hasError={!!errors.department}
                    />
                </InputGroup>
                {errors.department && <div className="muf-field-error">{errors.department}</div>}
            </Form.Group>

            {/* Role */}
            <Form.Group className="mb-3">
                <Form.Label className={getLabelClass(errors.role)}>Role <span className="req">*</span></Form.Label>
                <InputGroup className={`muf-input-group ${errors.role ? 'has-error' : ''}`}>
                    <InputGroup.Text className="muf-icon"><FaUserShield /></InputGroup.Text>
                    <CustomSelect
                        value={formData.role}
                        options={displayRoles}
                        onChange={(val) => updateField('role', val)}
                        onFocus={() => clearError('role')}
                        // Correzione S7735: Invertita la condizione per chiarezza
                        placeholder={formData.department ? "Select Role" : "Waiting Department"}
                        loading={status.loadingRoles}
                        disabled={!formData.department || status.loadingRoles || isExternal}
                        hasError={!!errors.role}
                    />
                </InputGroup>
                {errors.role && <div className="muf-field-error">{errors.role}</div>}
            </Form.Group>

            {/* Password */}
            <Form.Group className="mb-3">
                <div className="d-flex justify-content-between">
                    <Form.Label className={getLabelClass(errors.password)}>Password <span className="req">*</span></Form.Label>
                    {renderPasswordStrength}
                </div>
                <InputGroup className={`muf-input-group muf-pwd-group ${errors.password ? 'has-error' : ''}`}>
                    <InputGroup.Text className="muf-icon"><FaLock /></InputGroup.Text>
                    <Form.Control
                        type={showPwd.main ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={formData.password}
                        onChange={e => updateField('password', e.target.value)}
                        onFocus={() => clearError('password')}
                        className={`muf-input ${errors.password ? 'muf-input-error' : ''}`}
                    />
                    <button type="button" className="muf-pwd-toggle" onClick={() => setShowPwd(p => ({ ...p, main: !p.main }))}>
                        {showPwd.main ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </InputGroup>
                {errors.password && <div className="muf-field-error">{errors.password}</div>}
                <div className="muf-strength-line">
                    <div className="fill" style={{ width: `${(passwordStrength / 5) * 100}%`, backgroundColor: strengthColor }}></div>
                </div>
            </Form.Group>

            {/* Confirm Password */}
            <Form.Group className="mb-3">
                <Form.Label className={getLabelClass(errors.confirmPassword)}>Confirm Password <span className="req">*</span></Form.Label>
                <InputGroup className={`muf-input-group muf-pwd-group ${errors.confirmPassword ? 'has-error' : ''}`}>
                    <InputGroup.Text className="muf-icon"><FaLock /></InputGroup.Text>
                    <Form.Control
                        type={showPwd.confirm ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={e => updateField('confirmPassword', e.target.value)}
                        onFocus={() => clearError('confirmPassword')}
                        className={`muf-input ${errors.confirmPassword ? 'muf-input-error' : ''}`}
                    />
                    <button type="button" className="muf-pwd-toggle" onClick={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))}>
                        {showPwd.confirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </InputGroup>
                {errors.confirmPassword && <div className="muf-field-error">{errors.confirmPassword}</div>}
            </Form.Group>
        </Col>
    );
});
AccessAndSecurityFields.propTypes = {
    formData: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    updateField: PropTypes.func.isRequired,
    clearError: PropTypes.func.isRequired,
    isExternal: PropTypes.bool.isRequired,
    displayDepartments: PropTypes.array.isRequired,
    displayRoles: PropTypes.array.isRequired,
    status: PropTypes.shape({
        loadingDepts: PropTypes.bool.isRequired,
        loadingRoles: PropTypes.bool.isRequired,
    }).isRequired,
    passwordStrength: PropTypes.number.isRequired,
    showPwd: PropTypes.shape({
        main: PropTypes.bool.isRequired,
        confirm: PropTypes.bool.isRequired,
    }).isRequired,
    setShowPwd: PropTypes.func.isRequired,
};

// --- COMPONENTE PRINCIPALE ---

export default function MunicipalityUserForm({ onSuccess, onCancel, refreshTrigger }) {
    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});
    const [data, setData] = useState({ departments: [], roles: [], companies: [] });
    const [status, setStatus] = useState({
        loading: false, globalError: "", success: "",
        loadingDepts: true, loadingRoles: false, loadingCompanies: true
    });
    const [showPwd, setShowPwd] = useState({ main: false, confirm: false });
    const [isExternal, setIsExternal] = useState(false);

    const passwordStrength = useMemo(() => calculateStrength(formData.password), [formData.password]);

    const clearError = (name) => {
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const updateField = useCallback((name, value) => {
        setFormData(prev => {
            if (name === 'department') return { ...prev, department: value, role: "" };
            return { ...prev, [name]: value };
        });
        clearError(name);
        if (status.globalError) setStatus(prev => ({ ...prev, globalError: "" }));
    }, [status.globalError, errors]);

    // --- 1. Load Departments & Companies ---
    useEffect(() => {
        let isMounted = true;

        const initData = async () => {
            try {
                const [depts, comps] = await Promise.all([
                    getAllDepartments(),
                    getAllCompanies()
                ]);
                if (isMounted) {
                    setData(prev => ({ ...prev, departments: depts, companies: comps }));
                    setStatus(prev => ({ ...prev, loadingDepts: false, loadingCompanies: false }));
                }
            } catch (err) {
                console.error("Failed loading initial data:", err);
                if (isMounted) {
                    setStatus(prev => ({ ...prev, loadingDepts: false, loadingCompanies: false }));
                }
            }
        };

        initData();
        return () => { isMounted = false; };
    }, [refreshTrigger]);

    // --- 2. Load Roles ---
    useEffect(() => {
        if (!formData.department) {
            setData(prev => ({ ...prev, roles: [] }));
            return;
        }
        const fetchRoles = async () => {
            setStatus(prev => ({ ...prev, loadingRoles: true }));
            try {
                const deptId = Number.parseInt(formData.department);
                let rolesList = await getRolesByDepartment(deptId);
                setData(prev => ({ ...prev, roles: rolesList }));
            } catch {
                try {
                    const allRoles = await getAllRoles();
                    setData(prev => ({ ...prev, roles: allRoles }));
                } catch (e) {
                    console.error("Failed to fetch roles after fallback:", e);
                }
            } finally {
                setStatus(prev => ({ ...prev, loadingRoles: false }));
            }
        };
        fetchRoles();
    }, [formData.department]);

    // Nasconde il messaggio di successo dopo 3 secondi
    useEffect(() => {
        let timer;
        if (status.success) {
            timer = setTimeout(() => {
                setStatus(prev => ({ ...prev, success: "" }));
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [status.success]);

    // --- Derived Data ---
    const displayDepartments = useMemo(() => {
        if (isExternal) return data.departments;
        return data.departments.filter(d => d.name.toLowerCase() !== "external service providers");
    }, [data.departments, isExternal]);

    const displayRoles = useMemo(() => {
        if (isExternal) return data.roles;
        return data.roles.filter(r => r.name.toLowerCase() !== "external maintainer");
    }, [data.roles, isExternal]);

    // --- Handle User Type Selection (Card Click) ---
    const handleTypeSelect = (targetIsExternal) => {
        if (isExternal === targetIsExternal) return;
        setIsExternal(targetIsExternal);
        setErrors({});

        if (targetIsExternal) {
            const extDept = data.departments.find(d => d.name.toLowerCase() === "external service providers");
            setFormData(prev => ({ ...prev, company: "", department: extDept ? extDept.id : "", role: "" }));
        } else {
            setFormData(prev => ({ ...prev, department: "", role: "", company: "" }));
        }
    };

    // --- Auto Select Role for External ---
    useEffect(() => {
        if (isExternal && data.roles.length > 0) {
            const extRole = data.roles.find(r => r.name.toLowerCase() === "external maintainer");
            if (extRole && String(formData.role) !== String(extRole.id)) {
                setFormData(prev => ({ ...prev, role: extRole.id }));
                clearError('role');
            }
        }
    }, [isExternal, data.roles, formData.role]);

    // --- Validation Aggregator ---
    const validate = () => {
        let newErrors = {};

        validatePersonalDetails(formData, newErrors);
        validateRoleAndCompany(formData, isExternal, newErrors);
        validatePasswordDetails(formData, newErrors);

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus(prev => ({ ...prev, globalError: "", success: "" }));

        if (!validate()) return;

        setStatus(prev => ({ ...prev, loading: true }));
        try {
            const selectedDept = data.departments.find(d => String(d.id) === String(formData.department));
            const selectedRole = data.roles.find(r => String(r.id) === String(formData.role));

            let selectedCompanyName = "";
            if (isExternal && formData.company) {
                const selectedCompObj = data.companies.find(c => String(c.id) === String(formData.company));
                selectedCompanyName = selectedCompObj ? selectedCompObj.name : "";
            }

            const payload = {
                username: formData.username, email: formData.email, password: formData.password,
                first_name: formData.first_name, last_name: formData.last_name,
                department_name: selectedDept?.name || "",
                role_name: selectedRole?.name || "",
                company_name: selectedCompanyName,
            };

            const newUser = await createMunicipalityUser(payload);
            setStatus(prev => ({ ...prev, success: `Officer "${newUser.username}" created!`, loading: false }));

            setFormData(initialFormState);
            setIsExternal(false);

            if (onSuccess) {
                setTimeout(() => onSuccess(isExternal), 1500);
            }

        } catch (err) {
            const errorMessage = err.message || "Creation failed. Error or duplicate.";
            setStatus(prev => ({ ...prev, globalError: errorMessage, loading: false }));
            console.error("Error creating user:", err);
        }
    };


    return (
        <div className="muf-container-styled fade-in">
            <div className="muf-header-styled">
                <h4 className="muf-title"><FaUserShield className="me-2" />New Officer</h4>
                <div className="muf-header-actions">
                    <button type="button" className="muf-btn-text" onClick={onCancel} disabled={status.loading}>
                        <FaTimes /> Cancel
                    </button>
                </div>
            </div>

            <Form noValidate onSubmit={handleSubmit} className="muf-body-styled">

                {/* Componente Estratto 2: Selezione Tipo Utente */}
                <UserTypeSelector
                    isExternal={isExternal}
                    handleTypeSelect={handleTypeSelect}
                    isLoading={status.loading}
                />

                {/* Componente Estratto 1: Alert Messaggi */}
                <RenderAlerts globalError={status.globalError} success={status.success} />

                <Row className="g-4">
                    {/* Componente Estratto 3: Campi Personali (Nome, Cognome, Username, Email, Company) */}
                    <PersonalInfoFields
                        formData={formData}
                        errors={errors}
                        updateField={updateField}
                        clearError={clearError}
                        isExternal={isExternal}
                        data={data}
                        status={status}
                    />

                    {/* Componente Estratto 4: Campi Accesso e Sicurezza (Dipartimento, Ruolo, Password) */}
                    <AccessAndSecurityFields
                        formData={formData}
                        errors={errors}
                        updateField={updateField}
                        clearError={clearError}
                        isExternal={isExternal}
                        displayDepartments={displayDepartments}
                        displayRoles={displayRoles}
                        status={status}
                        passwordStrength={passwordStrength}
                        showPwd={showPwd}
                        setShowPwd={setShowPwd}
                    />
                </Row>

                <div className="muf-footer-actions">
                    <Button type="submit" className="muf-btn-primary" disabled={status.loading}>
                        {status.loading ? "Creating..." : <><FaSave className="me-2" /> Create Officer</>}
                    </Button>
                </div>
            </Form>
        </div>
    );
}

// Validazione delle props per il componente principale
MunicipalityUserForm.propTypes = {
    onSuccess: PropTypes.func,
    onCancel: PropTypes.func.isRequired,
    refreshTrigger: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.number,
        PropTypes.string,
    ]),
};