import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { BsClipboardCheck } from 'react-icons/bs';

export default function MunicipalityUserHome() {
  return (
    <Container 
      style={{ 
        maxWidth: '1400px',
        padding: '3rem',
        minHeight: '100vh'
      }}
    >
      <h2 
          className="mb-3"
          style={{ 
            color: 'var(--primary)',
            fontWeight: 'var(--font-bold)',
            fontSize: 'var(--font-xxxl)'
          }}
        >
          Municipality Staff Dashboard
        </h2>

        <p 
          className="mb-4" 
          style={{ 
            fontSize: 'var(--font-lg)',
            color: 'var(--text-secondary)',
            lineHeight: '1.6'
          }}
        >
          As a municipality staff member, you have access to manage and process citizen reports based on your role.
        </p>

        <Card 
          className="shadow-lg" 
          style={{ 
            borderRadius: 'var(--radius-xl)',
            border: 'none'
          }}
        >
          <Card.Body className="p-4">
            <h5 style={{ color: 'var(--primary)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--spacing-md)' }}>
              <BsClipboardCheck className="me-2" />
              Quick Info
            </h5>
            <ul style={{ color: 'var(--text-secondary)', marginBottom: 0, paddingLeft: '1.5rem' }}>
              <li className="mb-2">View and manage citizen reports</li>
              <li className="mb-2">Update report status and add comments</li>
            </ul>
          </Card.Body>
        </Card>
      </Container>
  );
}
