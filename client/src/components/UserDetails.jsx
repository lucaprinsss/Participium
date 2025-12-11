import React from "react";
import PropTypes from "prop-types";
import { InputGroup } from "react-bootstrap";
import { FaUser, FaEnvelope, FaUserShield } from "react-icons/fa";

export default function UserDetail({ formData, onChange, onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit} className="mul-edit-form">
      <div className="name-row">
        <div className="mul-field">
          <label className="mul-label" htmlFor="firstNameInput">
            <span className="mul-required">First Name</span>
          </label>
          <InputGroup className="mul-input-group">
            <InputGroup.Text className="mul-icon">
              <FaUser />
            </InputGroup.Text>
            <input
              id="firstNameInput" // Aggiunto ID (Riga 11)
              type="text"
              name="firstName"
              className="form-control mul-input"
              value={formData.firstName}
              onChange={onChange}
              required
              disabled={loading}
            />
          </InputGroup>
        </div>
        <div className="mul-field">
          <label className="mul-label" htmlFor="lastNameInput">
            <span className="mul-required">Last Name</span>
          </label>
          <InputGroup className="mul-input-group">
            <InputGroup.Text className="mul-icon">
              <FaUser />
            </InputGroup.Text>
            <input
              id="lastNameInput" // Aggiunto ID (Riga 30)
              type="text"
              name="lastName"
              className="form-control mul-input"
              value={formData.lastName}
              onChange={onChange}
              required
              disabled={loading}
            />
          </InputGroup>
        </div>
      </div>

      <div className="mul-field">
        <label className="mul-label" htmlFor="usernameInput">Username</label>
        <InputGroup className="mul-input-group">
          <InputGroup.Text className="mul-icon">
            <FaUser />
          </InputGroup.Text>
          <input
            id="usernameInput" // Aggiunto ID (Riga 51)
            type="text"
            className="form-control mul-input mul-readonly"
            value={formData.username}
            disabled
          />
        </InputGroup>
        <small className="mul-help-text">Username cannot be changed</small>
      </div>

      <div className="mul-field">
        <label className="mul-label" htmlFor="emailInput">
          <span className="mul-required">Email</span>
        </label>
        <InputGroup className="mul-input-group">
          <InputGroup.Text className="mul-icon">
            <FaEnvelope />
          </InputGroup.Text>
          <input
            id="emailInput" // Aggiunto ID (Riga 67)
            type="email"
            name="email"
            className="form-control mul-input"
            value={formData.email}
            onChange={onChange}
            required
            disabled={loading}
          />
        </InputGroup>
      </div>

      <div className="mul-field">
        <label className="mul-label" htmlFor="roleInput">Role</label>
        <InputGroup className="mul-input-group">
          <InputGroup.Text className="mul-icon">
            <FaUserShield />
          </InputGroup.Text>
          <input
            id="roleInput" // Aggiunto ID (Riga 87)
            type="text"
            className="form-control mul-input mul-readonly"
            value={formData.role}
            disabled
          />
        </InputGroup>
      </div>
    </form>
  );
}

UserDetail.propTypes = {
  // Oggetto che contiene i dati del modulo
  formData: PropTypes.shape({
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }).isRequired,
  // Funzione gestore per l'input change
  onChange: PropTypes.func.isRequired,
  // Funzione gestore per il form submission
  onSubmit: PropTypes.func.isRequired,
  // Stato di caricamento, disabilita gli input modificabili
  loading: PropTypes.bool,
};