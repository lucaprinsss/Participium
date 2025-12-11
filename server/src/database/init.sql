/*
 * ====================================
 * INITIALIZATION SCRIPT FOR THE DATABASE - V4.3
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
 * MODIFIED: Replaced ENUM 'role' with 'department_role_id' FK
 */
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- ADDED: Links to the user's "position" (Department + Role).
    -- Application logic will assign the 'Citizen' role to new users.
    department_role_id INT NOT NULL REFERENCES department_roles(id),
    
    email VARCHAR(255) NOT NULL UNIQUE,
    personal_photo_url TEXT,
    telegram_username VARCHAR(100) UNIQUE,
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

/*
 * ====================================
 * DATA POPULATION
 * ====================================
 */

-- 1. Populate the new Departments and Roles tables
-- This data is required to create the default admin user.

INSERT INTO departments (name)
VALUES
    ('Organization'),                                           -- Per ruoli Admin/Citizen
    ('Water and Sewer Services Department'),
    ('Public Infrastructure and Accessibility Department'),
    ('Public Lighting Department'),
    ('Waste Management Department'),
    ('Mobility and Traffic Management Department'),
    ('Parks, Green Areas and Recreation Department'),
    ('General Services Department'),
    ('External Service Providers')                              -- For external maintainers
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description)
VALUES
    ('Citizen', 'Standard citizen user'),
    ('Administrator', 'System Administrator with full access'),
    ('Municipal Public Relations Officer', 'Reviews and approves/rejects citizen reports'),
    ('Department Director', 'Director of a department'),
    ('Water Network staff member', 'Manages water network maintenance'),
    ('Sewer System staff member', 'Manages sewer system maintenance'),
    ('Road Maintenance staff member', 'Maintains road infrastructure'),
    ('Accessibility staff member', 'Ensures accessibility compliance'),
    ('Electrical staff member', 'Manages electrical systems'),
    ('Recycling Program staff member', 'Coordinates recycling programs'),
    ('Traffic management staff member', 'Manages traffic systems'),
    ('Parks Maintenance staff member', 'Maintains parks and green areas'),
    ('Customer Service staff member', 'Provides customer service'),
    ('Building Maintenance staff member', 'Maintains building facilities'),
    ('Support Officer', 'Provides general support services'),
    ('External Maintainer', 'External company contractor specialized in specific report categories')
ON CONFLICT (name) DO NOTHING;

-- 2. Link Departments and Roles to create "Positions"
INSERT INTO department_roles (department_id, role_id)
VALUES
    -- System roles
    ((SELECT id FROM departments WHERE name = 'Organization'), (SELECT id FROM roles WHERE name = 'Citizen')),
    ((SELECT id FROM departments WHERE name = 'Organization'), (SELECT id FROM roles WHERE name = 'Administrator')),
    ((SELECT id FROM departments WHERE name = 'Organization'), (SELECT id FROM roles WHERE name = 'Municipal Public Relations Officer')),

    -- Water and Sewer Services Department
    ((SELECT id FROM departments WHERE name = 'Water and Sewer Services Department'), (SELECT id FROM roles WHERE name = 'Department Director')),
    ((SELECT id FROM departments WHERE name = 'Water and Sewer Services Department'), (SELECT id FROM roles WHERE name = 'Water Network staff member')),
    ((SELECT id FROM departments WHERE name = 'Water and Sewer Services Department'), (SELECT id FROM roles WHERE name = 'Sewer System staff member')),

    -- Public Infrastructure and Accessibility Department
    ((SELECT id FROM departments WHERE name = 'Public Infrastructure and Accessibility Department'), (SELECT id FROM roles WHERE name = 'Department Director')),
    ((SELECT id FROM departments WHERE name = 'Public Infrastructure and Accessibility Department'), (SELECT id FROM roles WHERE name = 'Road Maintenance staff member')),
    ((SELECT id FROM departments WHERE name = 'Public Infrastructure and Accessibility Department'), (SELECT id FROM roles WHERE name = 'Accessibility staff member')),

    -- Public Lighting Department
    ((SELECT id FROM departments WHERE name = 'Public Lighting Department'), (SELECT id FROM roles WHERE name = 'Department Director')),
    ((SELECT id FROM departments WHERE name = 'Public Lighting Department'), (SELECT id FROM roles WHERE name = 'Electrical staff member')),

    -- Waste Management Department
    ((SELECT id FROM departments WHERE name = 'Waste Management Department'), (SELECT id FROM roles WHERE name = 'Department Director')),
    ((SELECT id FROM departments WHERE name = 'Waste Management Department'), (SELECT id FROM roles WHERE name = 'Recycling Program staff member')),

    -- Mobility and Traffic Management Department
    ((SELECT id FROM departments WHERE name = 'Mobility and Traffic Management Department'), (SELECT id FROM roles WHERE name = 'Department Director')),
    ((SELECT id FROM departments WHERE name = 'Mobility and Traffic Management Department'), (SELECT id FROM roles WHERE name = 'Traffic management staff member')),

    -- Parks, Green Areas and Recreation Department
    ((SELECT id FROM departments WHERE name = 'Parks, Green Areas and Recreation Department'), (SELECT id FROM roles WHERE name = 'Department Director')),
    ((SELECT id FROM departments WHERE name = 'Parks, Green Areas and Recreation Department'), (SELECT id FROM roles WHERE name = 'Parks Maintenance staff member')),

    -- General Services Department
    ((SELECT id FROM departments WHERE name = 'General Services Department'), (SELECT id FROM roles WHERE name = 'Department Director')),
    ((SELECT id FROM departments WHERE name = 'General Services Department'), (SELECT id FROM roles WHERE name = 'Customer Service staff member')),
    ((SELECT id FROM departments WHERE name = 'General Services Department'), (SELECT id FROM roles WHERE name = 'Building Maintenance staff member')),
    ((SELECT id FROM departments WHERE name = 'General Services Department'), (SELECT id FROM roles WHERE name = 'Support Officer')),

    -- External Service Providers Department
    ((SELECT id FROM departments WHERE name = 'External Service Providers'), (SELECT id FROM roles WHERE name = 'External Maintainer'))
ON CONFLICT (department_id, role_id) DO NOTHING;


/*
 * 3. Popola la tabella di mapping categoria-dipartimento
 * Associa ogni categoria di report al dipartimento tecnico responsabile
 
INSERT INTO category_department_mapping (category, department_id)
VALUES
    ('Water Supply - Drinking Water', (SELECT id FROM departments WHERE name = 'Water and Sewer Services Department')),
    ('Sewer System', (SELECT id FROM departments WHERE name = 'Water and Sewer Services Department')),
    ('Architectural Barriers', (SELECT id FROM departments WHERE name = 'Public Infrastructure and Accessibility Department')),
    ('Roads and Urban Furnishings', (SELECT id FROM departments WHERE name = 'Public Infrastructure and Accessibility Department')),
    ('Public Lighting', (SELECT id FROM departments WHERE name = 'Public Lighting Department')),
    ('Waste', (SELECT id FROM departments WHERE name = 'Waste Management Department')),
    ('Road Signs and Traffic Lights', (SELECT id FROM departments WHERE name = 'Mobility and Traffic Management Department')),
    ('Public Green Areas and Playgrounds', (SELECT id FROM departments WHERE name = 'Parks, Green Areas and Recreation Department')),
    ('Other', (SELECT id FROM departments WHERE name = 'General Services Department'))
ON CONFLICT (category) DO NOTHING;*/

/*
 * Populate the category-role mapping table
 * Associates each report category with the specific responsible technical role
 */
 
INSERT INTO category_role_mapping (category, role_id)
VALUES
    ('Water Supply - Drinking Water', (SELECT id FROM roles WHERE name = 'Water Network staff member')),
    ('Sewer System', (SELECT id FROM roles WHERE name = 'Sewer System staff member')),
    ('Architectural Barriers', (SELECT id FROM roles WHERE name = 'Accessibility staff member')),
    ('Roads and Urban Furnishings', (SELECT id FROM roles WHERE name = 'Road Maintenance staff member')),
    ('Public Lighting', (SELECT id FROM roles WHERE name = 'Electrical staff member')),
    ('Waste', (SELECT id FROM roles WHERE name = 'Recycling Program staff member')),
    ('Road Signs and Traffic Lights', (SELECT id FROM roles WHERE name = 'Traffic management staff member')),
    ('Public Green Areas and Playgrounds', (SELECT id FROM roles WHERE name = 'Parks Maintenance staff member')),
    ('Other', (SELECT id FROM roles WHERE name = 'Support Officer'))
ON CONFLICT (category) DO NOTHING;

/*
 * 4. Create the default administrator user
 * MODIFIED: Uses the correct 'department_role_id'
 * Username: admin
 * Password: admin (hashed with bcrypt)
 * Note: Change this password in production!
 */
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'admin',
    'System',
    'Administrator',
    '455eb328698d8cb5c8956fa51027dd4b:a93a35cebfb7f7b59c8ebe7720eac36c4ef76ec6d7d19d5e4e179555e57d2695fbbfc34ad8931d6c985fdcf2492f6fe3fc87dc4e7ddc20b9f4c66caa50c36e4d',
    
    -- This subquery finds the ID for the 'Organization' / 'Administrator' position
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Organization' AND r.name = 'Administrator'),
     
    'admin@participium.local',
    true,
    true  -- Admin is already verified
)
ON CONFLICT (username) DO NOTHING;

/*
 * 5. Populate companies table BEFORE creating external maintainer users
 * External maintenance companies that handle specific report categories
 * Each company specializes in one category
 */
INSERT INTO companies (name, category)
VALUES
    ('Enel X', 'Public Lighting'),
    ('Acea', 'Water Supply - Drinking Water'),
    ('Hera', 'Waste'),
    ('ATM', 'Road Signs and Traffic Lights')
ON CONFLICT (name) DO NOTHING;

/*
 * 6. Create users for external maintainers
 * External maintainers are now users with 'External Maintainer' role
 * Default password for all: 'maintainer123'
 * Bcrypt hash: $2b$10$
 * company_id is assigned directly during user creation
 */
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, company_id, email_notifications_enabled, is_verified)
VALUES
    -- Enel X - Specialized in public lighting
    ('enelx',
     'Enel X',
     'Support Team',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'interventions@enelx.com',
     (SELECT id FROM companies WHERE name = 'Enel X'),
     true,
     true),  -- External maintainers are already verified
    
    -- Acea - Specialized in water and sewer systems
    ('acea',
     'Acea',
     'Water Services',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'water@acea.it',
     (SELECT id FROM companies WHERE name = 'Acea'),
     true,
     true),
    
    -- Hera - Specialized in waste management
    ('hera',
     'Hera',
     'Waste Management',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'waste@hera.it',
     (SELECT id FROM companies WHERE name = 'Hera'),
     true,
     true),
    
    -- ATM - Specialized in mobility and traffic
    ('atm',
     'ATM',
     'Traffic Management',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'traffic@atm.it',
     (SELECT id FROM companies WHERE name = 'ATM'),
     true,
     true)
ON CONFLICT (username) DO NOTHING;

/*
 * 7. Create test citizen user
 * Username: user
 * Password: password
 * Status: Verified
 */
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'user',
    'Giulio',
    'Cesare',
    -- Password hash for 'password'
    '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
    
    -- Find the Citizen position in Organization department
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Organization' AND r.name = 'Citizen'),
     
    'user@test.com',
    true,
    true  -- Test citizen already verified
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'user2',
    'Zlatan',
    'Ibrahimovic',
    -- Password hash for 'password'
    '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
    
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Organization' AND r.name = 'Citizen'),
     
    'user2@test.com',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

/*
 * 8. Create test Municipal Public Relations Officer
 * Username: officer
 * Password: officer
 * Status: Verified
 */
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'officer',
    'Public Relations',
    'Officer',
    -- Password hash for 'officer'
    '848572160c1563d131bc2aeeaf0517a7:abfae26e6a0caa22c33c4361e9f2ef71fbe0731e53edd6f508016745ac6d1ecbc8c36f2889c23ba10054fb37f65eb209648feb827bb38cf397aca2f49ce12be0',
    
    -- Find the Municipal Public Relations Officer position in Organization department
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Organization' AND r.name = 'Municipal Public Relations Officer'),
     
    'officer@participium.local',
    true,
    true  -- Officer already verified
)
ON CONFLICT (username) DO NOTHING;

/*
 * 9. Create test Department Directors
 * Username: director_[department]
 * Password: director (for all)
 * Status: Verified
 */

-- Director for Water and Sewer Services Department
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'director_water',
    'Water Services',
    'Director',
    -- Password hash for 'director'
    'f1e1121ec7ae66434c068e02a5c0a133:3226ff94b978b740dc230ce7ec7ea2ca61b0b43b156395175e225e1d9b8eb23404f5afc781213b43cd7608982dbc3082212891b67eec202dce55a0c2332a58c7',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Water and Sewer Services Department' AND r.name = 'Department Director'),
    'director.water@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Director for Public Infrastructure and Accessibility Department
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'director_infra',
    'Infrastructure',
    'Director',
    -- Password hash for 'director'
    'f1e1121ec7ae66434c068e02a5c0a133:3226ff94b978b740dc230ce7ec7ea2ca61b0b43b156395175e225e1d9b8eb23404f5afc781213b43cd7608982dbc3082212891b67eec202dce55a0c2332a58c7',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Public Infrastructure and Accessibility Department' AND r.name = 'Department Director'),
    'director.infra@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Director for Public Lighting Department
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'director_lighting',
    'Lighting Services',
    'Director',
    -- Password hash for 'director'
    'f1e1121ec7ae66434c068e02a5c0a133:3226ff94b978b740dc230ce7ec7ea2ca61b0b43b156395175e225e1d9b8eb23404f5afc781213b43cd7608982dbc3082212891b67eec202dce55a0c2332a58c7',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Public Lighting Department' AND r.name = 'Department Director'),
    'director.lighting@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Director for Waste Management Department
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'director_waste',
    'Waste Management',
    'Director',
    -- Password hash for 'director'
    'f1e1121ec7ae66434c068e02a5c0a133:3226ff94b978b740dc230ce7ec7ea2ca61b0b43b156395175e225e1d9b8eb23404f5afc781213b43cd7608982dbc3082212891b67eec202dce55a0c2332a58c7',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Waste Management Department' AND r.name = 'Department Director'),
    'director.waste@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Director for Mobility and Traffic Management Department
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'director_traffic',
    'Traffic Management',
    'Director',
    -- Password hash for 'director'
    'f1e1121ec7ae66434c068e02a5c0a133:3226ff94b978b740dc230ce7ec7ea2ca61b0b43b156395175e225e1d9b8eb23404f5afc781213b43cd7608982dbc3082212891b67eec202dce55a0c2332a58c7',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Mobility and Traffic Management Department' AND r.name = 'Department Director'),
    'director.traffic@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Director for Parks, Green Areas and Recreation Department
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'director_parks',
    'Parks and Recreation',
    'Director',
    -- Password hash for 'director'
    'f1e1121ec7ae66434c068e02a5c0a133:3226ff94b978b740dc230ce7ec7ea2ca61b0b43b156395175e225e1d9b8eb23404f5afc781213b43cd7608982dbc3082212891b67eec202dce55a0c2332a58c7',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Parks, Green Areas and Recreation Department' AND r.name = 'Department Director'),
    'director.parks@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Director for General Services Department
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'director_services',
    'General Services',
    'Director',
    -- Password hash for 'director'
    'f1e1121ec7ae66434c068e02a5c0a133:3226ff94b978b740dc230ce7ec7ea2ca61b0b43b156395175e225e1d9b8eb23404f5afc781213b43cd7608982dbc3082212891b67eec202dce55a0c2332a58c7',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'General Services Department' AND r.name = 'Department Director'),
    'director.services@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

/*
 * 10. Create test Technical Staff Members
 * Username: staff_[category]
 * Password: staff (for all)
 * Status: Verified
 */

-- Water Network staff member
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff_water',
    'Water Network',
    'Technician',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Water and Sewer Services Department' AND r.name = 'Water Network staff member'),
    'staff.water@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Sewer System staff member
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff_sewer',
    'Sewer System',
    'Technician',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Water and Sewer Services Department' AND r.name = 'Sewer System staff member'),
    'staff.sewer@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Accessibility staff member
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff_access',
    'Accessibility',
    'Technician',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Public Infrastructure and Accessibility Department' AND r.name = 'Accessibility staff member'),
    'staff.access@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Road Maintenance staff member
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff_road',
    'Road Maintenance',
    'Technician',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Public Infrastructure and Accessibility Department' AND r.name = 'Road Maintenance staff member'),
    'staff.road@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Electrical staff member (Public Lighting)
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff_lighting',
    'Public Lighting',
    'Technician',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Public Lighting Department' AND r.name = 'Electrical staff member'),
    'staff.lighting@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Recycling Program staff member (Waste)
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff_waste',
    'Waste Management',
    'Technician',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Waste Management Department' AND r.name = 'Recycling Program staff member'),
    'staff.waste@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Traffic management staff member
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff_traffic',
    'Traffic Management',
    'Technician',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Mobility and Traffic Management Department' AND r.name = 'Traffic management staff member'),
    'staff.traffic@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Parks Maintenance staff member
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff_parks',
    'Parks Maintenance',
    'Technician',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Parks, Green Areas and Recreation Department' AND r.name = 'Parks Maintenance staff member'),
    'staff.parks@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Support Officer (Other category)
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff_support',
    'Support',
    'Officer',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'General Services Department' AND r.name = 'Support Officer'),
    'staff.support@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

/*
 * 11. Create test reports
 */
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Dangerous Road Sign',
    'I am reporting a road sign pole in dangerous conditions on Via Legnano. The pole appears tilted and unstable, representing a potential danger for pedestrians and vehicles. I request urgent intervention to secure the area.',
    'Road Signs and Traffic Lights',
    ST_SetSRID(ST_MakePoint(7.673451, 45.059551), 4326)::geography,
    'Via Legnano, Torino, TO, Italy',
    false,
    'Assigned',
    (SELECT id FROM users WHERE username = 'staff_traffic'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Damaged Traffic Light',
    'I am reporting a damaged traffic light on Corso Duca degli Abbruzzi, 52. Photos attached.',
    'Road Signs and Traffic Lights',
    ST_SetSRID(ST_MakePoint(7.659592, 45.058406), 4326)::geography,
    'Corso Duca degli Abbruzzi, 52, Torino, TO, Italy',
    false,
    'Assigned',
    (SELECT id FROM users WHERE username = 'staff_traffic'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Scattered Waste on Street',
    'I am reporting scattered waste on the street. Photos attached.',
    'Waste',
    ST_SetSRID(ST_MakePoint(7.666404, 45.069951), 4326)::geography,
    'Via Giuseppe Giusti, 3, Torino, TO, Italy',
    false,
    'Assigned',
    (SELECT id FROM users WHERE username = 'staff_waste'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Tilting Street Lamp',
    'I am reporting a tilting street lamp. Photos attached.',
    'Public Lighting',
    ST_SetSRID(ST_MakePoint(7.634984, 45.040559), 4326)::geography,
    'Corso Orbassano, 224a, Torino, TO, Italy',
    false,
    'Pending Approval',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

/*
 * 12. Create photos attached to reports
 */
INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Dangerous Road Sign' LIMIT 1),
    '/seed-data/photos/1/1.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Damaged Traffic Light' LIMIT 1),
    '/seed-data/photos/2/2.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Damaged Traffic Light' LIMIT 1),
    '/seed-data/photos/3/2_2.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Scattered Waste on Street' LIMIT 1),
    '/seed-data/photos/5/5.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Photo from folder 4
INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Tilting Street Lamp' LIMIT 1),
    '/seed-data/photos/4/4.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;