/*
 * ====================================
 * INITIALIZATION SCRIPT FOR THE DATABASE - V1
 * ====================================
 */

-- Enable PostGIS extension for geographical data support
CREATE EXTENSION IF NOT EXISTS postgis;

/*
 * ====================================
 * ENUMERATED TYPES
 * ====================================
 */

-- MODIFIED ENUMS TO ADD 'administrator' ROLE AND 'Rejected' STATUS
CREATE TYPE user_role AS ENUM (
    'citizen',
    'organization_staff',
    'technical_staff',
    'administrator' -- For the private statistics
);

CREATE TYPE report_category AS ENUM (
    'Water Supply - Drinking Water',
    'Architectural Barriers',
    'Sewer System',
    'Public Lighting',
    'Waste',
    'Road Signs and Traffic Lights',
    'Roads and Urban Furnishings',
    'Public Green Areas and Playgrounds',
    'Other'
);

CREATE TYPE report_status AS ENUM (
    'Pending Approval',
    'Assigned',
    'In Progress',
    'Suspended',
    'Rejected',
    'Resolved'
);

/*
 * ====================================
 * MAIN TABLES
 * ====================================
 */

/*
 * User tables (users)
 */
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'citizen',
    
    email VARCHAR(255) NOT NULL UNIQUE,
    personal_photo_url TEXT,
    telegram_username VARCHAR(100) UNIQUE,
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


/*
 * Reports table (reports)
 */
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    reporter_id INT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category report_category NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    status report_status NOT NULL DEFAULT 'Pending Approval',
    rejection_reason TEXT,
    assignee_id INT REFERENCES users(id), 
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_rejection_reason 
        CHECK ( (status <> 'Rejected') OR (rejection_reason IS NOT NULL) )
);


/*
 * Images table (photos)
 */
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    report_id INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    storage_url TEXT NOT NULL, 
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


/*
 * Comments table (comments)
 */
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    report_id INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    author_id INT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


/*
 * Notifications tables (notifications)
 */
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_id INT REFERENCES reports(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


/*
 * Messages table (messages)
 */
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    report_id INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    sender_id INT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);