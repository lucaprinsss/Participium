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

-- RIMOSSO: Il tipo 'user_role' è ora gestito da tabelle relazionali.
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
 * Tabella Dipartimenti
 * Elenca i dipartimenti municipali (es. Ufficio Tecnico, Urbanistica)
 */
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

/*
 * Tabella Ruoli
 * Elenca i livelli di permesso generici (es. Manager, Staff Member)
 */
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

/*
 * Tabella Ruoli Dipartimento (Join Table)
 * Definisce le "posizioni" valide collegando dipartimenti a ruoli.
 * Permette all'UI Admin di filtrare i ruoli per dipartimento.
 */
CREATE TABLE department_roles (
    id SERIAL PRIMARY KEY,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    
    -- Assicura che non ci siano coppie Dipartimento/Ruolo duplicate
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
 * User tables (users)
 * MODIFICATA: Sostituito ENUM 'role' con 'department_role_id' FK
 */
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- RIMOSSO: role user_role NOT NULL DEFAULT 'Citizen',
    
    -- AGGIUNTO: Collega alla "posizione" (Dipartimento + Ruolo) dell'utente.
    -- La logica applicativa assegnerà il ruolo 'Citizen' ai nuovi utenti.
    department_role_id INT NOT NULL REFERENCES department_roles(id),
    
    email VARCHAR(255) NOT NULL UNIQUE,
    personal_photo_url TEXT,
    telegram_username VARCHAR(100) UNIQUE,
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Campo per manutentori esterni (riferimento all'azienda)
    company_id INT REFERENCES companies(id) ON DELETE SET NULL,
    
    -- Campi per verifica email 
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
 * Images table (photos)
 * (Nessuna modifica)
 */
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    report_id INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    storage_url TEXT NOT NULL, 
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


/*
 * Comments table (comments)
 * (Nessuna modifica)
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
 * (Nessuna modifica)
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
 * (Nessuna modifica)
 */
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    report_id INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    sender_id INT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


/*
 * Category Department Mapping table (category_department_mapping)
 * Maps report categories to responsible departments for automatic assignment
 
CREATE TABLE category_department_mapping (
    id SERIAL PRIMARY KEY,
    category report_category NOT NULL UNIQUE,
    department_id INT NOT NULL REFERENCES departments(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);*/



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

-- 1. Popola le nuove tabelle Dipartimenti e Ruoli
-- Questi dati sono necessari per creare l'utente admin di default.

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
    ('External Service Providers')                              -- Per manutentori esterni
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

-- 2. Collega Dipartimenti e Ruoli per creare "Posizioni"
INSERT INTO department_roles (department_id, role_id)
VALUES
    -- Ruoli di sistema
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
 * Popola la tabella di mapping categoria-ruolo
 * Associa ogni categoria di report al ruolo tecnico specifico responsabile
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
 * 4. Crea l'utente amministratore di default
 * MODIFICATO: Usa il 'department_role_id' corretto
 * Username: admin
 * Password: admin (hashed con bcrypt)
 * Note: Change this password in production!
 */
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'admin',
    'System',
    'Administrator',
    '455eb328698d8cb5c8956fa51027dd4b:a93a35cebfb7f7b59c8ebe7720eac36c4ef76ec6d7d19d5e4e179555e57d2695fbbfc34ad8931d6c985fdcf2492f6fe3fc87dc4e7ddc20b9f4c66caa50c36e4d',
    
    -- Questa subquery trova l'ID per la posizione 'Organization' / 'Administrator'
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Organization' AND r.name = 'Administrator'),
     
    'admin@participium.local',
    true,
    true  -- Admin è già verificato
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
 * 6. Crea utenti per i manutentori esterni
 * I manutentori esterni sono ora utenti con ruolo 'External Maintainer'
 * Password di default per tutti: 'maintainer123'
 * Hash bcrypt: $2b$10$
 * company_id is assigned directly during user creation
 */
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, company_id, email_notifications_enabled, is_verified)
VALUES
    -- Enel X - Specializzato in illuminazione pubblica
    ('enelx',
     'Enel X',
     'Support Team',
     '455eb328698d8cb5c8956fa51027dd4b:a93a35cebfb7f7b59c8ebe7720eac36c4ef76ec6d7d19d5e4e179555e57d2695fbbfc34ad8931d6c985fdcf2492f6fe3fc87dc4e7ddc20b9f4c66caa50c36e4d',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'interventions@enelx.com',
     (SELECT id FROM companies WHERE name = 'Enel X'),
     true,
     true),  -- Manutentori esterni sono già verificati
    
    -- Acea - Specializzato in acqua e fognature
    ('acea',
     'Acea',
     'Water Services',
     '455eb328698d8cb5c8956fa51027dd4b:a93a35cebfb7f7b59c8ebe7720eac36c4ef76ec6d7d19d5e4e179555e57d2695fbbfc34ad8931d6c985fdcf2492f6fe3fc87dc4e7ddc20b9f4c66caa50c36e4d',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'water@acea.it',
     (SELECT id FROM companies WHERE name = 'Acea'),
     true,
     true),
    
    -- Hera - Specializzato in gestione rifiuti
    ('hera',
     'Hera',
     'Waste Management',
     '455eb328698d8cb5c8956fa51027dd4b:a93a35cebfb7f7b59c8ebe7720eac36c4ef76ec6d7d19d5e4e179555e57d2695fbbfc34ad8931d6c985fdcf2492f6fe3fc87dc4e7ddc20b9f4c66caa50c36e4d',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'waste@hera.it',
     (SELECT id FROM companies WHERE name = 'Hera'),
     true,
     true),
    
    -- ATM - Specializzato in mobilità e traffico
    ('atm',
     'ATM',
     'Traffic Management',
     '455eb328698d8cb5c8956fa51027dd4b:a93a35cebfb7f7b59c8ebe7720eac36c4ef76ec6d7d19d5e4e179555e57d2695fbbfc34ad8931d6c985fdcf2492f6fe3fc87dc4e7ddc20b9f4c66caa50c36e4d',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'traffic@atm.it',
     (SELECT id FROM companies WHERE name = 'ATM'),
     true,
     true)
ON CONFLICT (username) DO NOTHING;