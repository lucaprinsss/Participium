import React from "react";
import { InputGroup } from "react-bootstrap";
import { FaUser, FaEnvelope, FaUserShield } from "react-icons/fa";

export default function UserDetail({ formData, onChange, onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit} className="mul-edit-form">
      <div className="name-row">
        <div className="mul-field">
          <label className="mul-label">
            <span className="mul-required">First Name</span>
          </label>
          <InputGroup className="mul-input-group">
            <InputGroup.Text className="mul-icon">
              <FaUser />
            </InputGroup.Text>
            <input
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
          <label className="mul-label">
            <span className="mul-required">Last Name</span>
          </label>
          <InputGroup className="mul-input-group">
            <InputGroup.Text className="mul-icon">
              <FaUser />
            </InputGroup.Text>
            <input
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
        <label className="mul-label">Username</label>
        <InputGroup className="mul-input-group">
          <InputGroup.Text className="mul-icon">
            <FaUser />
          </InputGroup.Text>
          <input
            type="text"
            className="form-control mul-input mul-readonly"
            value={formData.username}
            disabled
          />
        </InputGroup>
        <small className="mul-help-text">Username cannot be changed</small>
      </div>

      <div className="mul-field">
        <label className="mul-label">
          <span className="mul-required">Email</span>
        </label>
        <InputGroup className="mul-input-group">
          <InputGroup.Text className="mul-icon">
            <FaEnvelope />
          </InputGroup.Text>
          <input
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
        <label className="mul-label">Role</label>
        <InputGroup className="mul-input-group">
          <InputGroup.Text className="mul-icon">
            <FaUserShield />
          </InputGroup.Text>
          <input
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