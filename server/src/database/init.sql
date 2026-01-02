/*
 * ====================================
 * INITIALIZATION SCRIPT FOR THE DATABASE - V5.0
 * Multi-Role Support (PT10)
 * ====================================
 */

-- Enable PostGIS extension for geographical data support
CREATE EXTENSION IF NOT EXISTS postgis;

/*
 * ====================================
 * ENUMERATED TYPES
 * ====================================
 */

-- REMOVED: The 'user_role' type is now managed by relational tables.
-- CREATE TYPE user_role AS ENUM (...);

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
 * NEW TABLES FOR ROLES & DEPARTMENTS
 * ====================================
 */

/*
 * Departments Table
 * Lists municipal departments (e.g., Technical Office, Urban Planning)
 */
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

/*
 * Roles Table
 * Lists generic permission levels (e.g., Manager, Staff Member)
 */
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

/*
 * Department Roles Table (Join Table)
 * Defines valid "positions" by linking departments to roles.
 * Allows the Admin UI to filter roles by department.
 */
CREATE TABLE department_roles (
    id SERIAL PRIMARY KEY,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    
    -- Ensures no duplicate Department/Role pairs
    CONSTRAINT uq_department_role UNIQUE (department_id, role_id)
);


/*
 * ====================================
 * MAIN TABLES
 * ====================================
 */

/*
 * Companies table (companies)
 * Stores information about external maintenance companies
 * NEW in V4.3: Separates company entities from user accounts
 * Each company specializes in one report category, but multiple companies can handle the same category
 * MUST be created BEFORE users table because users.company_id references this table
 */
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category report_category NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

/*
 * Users table (users)
 * V5.0: Roles are now managed via user_roles table (many-to-many)
 * Supports multiple roles per user (PT10)
 */
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    personal_photo_url TEXT,
    telegram_username VARCHAR(100) UNIQUE,
    telegram_link_code VARCHAR(6),
    telegram_link_code_expires_at TIMESTAMPTZ,
    telegram_link_confirmed BOOLEAN NOT NULL DEFAULT false,
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Field for external maintainers (reference to company)
    company_id INT REFERENCES companies(id) ON DELETE SET NULL,
    
    -- Email verification fields 
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verification_code VARCHAR(6),
    verification_code_expires_at TIMESTAMPTZ,

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
    address VARCHAR(500),
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    status report_status NOT NULL DEFAULT 'Pending Approval',
    rejection_reason TEXT,
    assignee_id INT REFERENCES users(id),
    external_assignee_id INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_rejection_reason
        CHECK ( (status <> 'Rejected') OR (rejection_reason IS NOT NULL) )
);


/*
 * Photos table (photos)
 * Stores photos attached to reports
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
 * Notifications table (notifications)
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

/*
 * Category Role Mapping table (category_role_mapping)
 * Maps report categories to specific technical roles for automatic assignment
 * When a report is approved, the system assigns it to a staff member with the mapped role
 */
CREATE TABLE category_role_mapping (
    id SERIAL PRIMARY KEY,
    category report_category NOT NULL UNIQUE,
    role_id INT NOT NULL REFERENCES roles(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Crea una nuova tabella di join many-to-many
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_role_id INT NOT NULL REFERENCES department_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Evita duplicati: uno user non può avere lo stesso ruolo due volte
    CONSTRAINT uq_user_department_role UNIQUE (user_id, department_role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_department_role_id ON user_roles(department_role_id);
/*
 * ====================================
 * INDEXES
 * ====================================
 */

/*
 * Indexes for Telegram columns
 */
CREATE INDEX idx_users_telegram_link_code 
ON users(telegram_link_code) 
WHERE telegram_link_code IS NOT NULL;

CREATE INDEX idx_users_telegram_username 
ON users(telegram_username) 
WHERE telegram_username IS NOT NULL;

