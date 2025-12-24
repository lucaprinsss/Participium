/*
 * ====================================
 * DATA POPULATION - V5.0
 * ====================================
 * 
 * ENUM TYPE REFERENCE (defined in init.sql):
 * ------------------------------------------
 * report_category:
 *   - 'Water Supply - Drinking Water'
 *   - 'Architectural Barriers'
 *   - 'Sewer System'
 *   - 'Public Lighting'
 *   - 'Waste'
 *   - 'Road Signs and Traffic Lights'
 *   - 'Roads and Urban Furnishings'
 *   - 'Public Green Areas and Playgrounds'
 *   - 'Other'
 * 
 * report_status:
 *   - 'Pending Approval'
 *   - 'Assigned'
 *   - 'In Progress'
 *   - 'Suspended'
 *   - 'Rejected'
 *   - 'Resolved'
 * 
 * ROLE NAMES (defined below):
 *   - 'Citizen'
 *   - 'Administrator'
 *   - 'Municipal Public Relations Officer'
 *   - 'Department Director'
 *   - 'Water Network staff member'
 *   - 'Sewer System staff member'
 *   - 'Road Maintenance staff member'
 *   - 'Accessibility staff member'
 *   - 'Electrical staff member'
 *   - 'Recycling Program staff member'
 *   - 'Traffic management staff member'
 *   - 'Parks Maintenance staff member'
 *   - 'Customer Service staff member'
 *   - 'Building Maintenance staff member'
 *   - 'Support Officer'
 *   - 'External Maintainer'
 */

-- 1. Populate the Departments table
INSERT INTO departments (name)
VALUES
    ('Organization'),
    ('Water and Sewer Services Department'),
    ('Public Infrastructure and Accessibility Department'),
    ('Public Lighting Department'),
    ('Waste Management Department'),
    ('Mobility and Traffic Management Department'),
    ('Parks, Green Areas and Recreation Department'),
    ('General Services Department'),
    ('External Service Providers')
ON CONFLICT (name) DO NOTHING;

-- 2. Populate the Roles table
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

-- 3. Link Departments and Roles to create "Positions"
INSERT INTO department_roles (department_id, role_id)
VALUES
    -- System roles (Organization)
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

-- 4. Populate the category-role mapping table
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

-- 5. Populate companies table
INSERT INTO companies (name, category)
VALUES
    ('Enel X', 'Public Lighting'),
    ('Acea', 'Water Supply - Drinking Water'),
    ('Hera', 'Waste'),
    ('ATM', 'Road Signs and Traffic Lights')
ON CONFLICT (name) DO NOTHING;

/*
 * ====================================
 * 6. CREATE USERS (without department_role_id)
 * ====================================
 * Note: Roles are assigned via user_roles table (see section 7)
 */

-- Administrator
INSERT INTO users (username, first_name, last_name, password_hash, email, email_notifications_enabled, is_verified)
VALUES (
    'admin',
    'Andrea',
    'Bianchi',
    '455eb328698d8cb5c8956fa51027dd4b:a93a35cebfb7f7b59c8ebe7720eac36c4ef76ec6d7d19d5e4e179555e57d2695fbbfc34ad8931d6c985fdcf2492f6fe3fc87dc4e7ddc20b9f4c66caa50c36e4d',
    'admin@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

/*
 * 5. Populate companies table BEFORE creating external maintainer users
 * External maintenance companies that handle specific report categories
 * At least 2 companies per category for redundancy
 */
INSERT INTO companies (name, category)
VALUES
    -- Public Lighting companies
    ('Enel X', 'Public Lighting'),
    ('Luce Service', 'Public Lighting'),
    
    -- Water Supply companies
    ('Acea', 'Water Supply - Drinking Water'),
    ('Acqua Tecnica', 'Water Supply - Drinking Water'),
    
    -- Waste Management companies
    ('Hera', 'Waste'),
    ('Eco Service', 'Waste'),
    
    -- Road Signs and Traffic Lights companies
    ('ATM', 'Road Signs and Traffic Lights'),
    ('Segnaletica Moderna', 'Road Signs and Traffic Lights'),
    
    -- Sewer System companies
    ('Fognature Pro', 'Sewer System'),
    ('Idraulica Express', 'Sewer System'),
    
    -- Architectural Barriers companies
    ('Accessibilità Totale', 'Architectural Barriers'),
    ('Barriere Zero', 'Architectural Barriers'),
    
    -- Roads and Urban Furnishings companies  
    ('Strade Sicure', 'Roads and Urban Furnishings'),
    ('Asfalti Nord', 'Roads and Urban Furnishings'),
    
    -- Public Green Areas and Playgrounds companies
    ('Giardini Verdi', 'Public Green Areas and Playgrounds'),
    ('Parchi Belli', 'Public Green Areas and Playgrounds'),
    
    -- Other category companies
    ('Servizi Generali', 'Other'),
    ('Manutenzione Universale', 'Other')
ON CONFLICT (name) DO NOTHING;

/*
 * 6. Create users for external maintainers
 * External maintainers are now users with 'External Maintainer' role
 * At least 2 maintainers per category for redundancy
 * Default password for all: 'maintainer123'
 * Bcrypt hash: $2b$10$
 * company_id is assigned directly during user creation
 */
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, company_id, email_notifications_enabled, is_verified)
VALUES
    -- PUBLIC LIGHTING maintainers
    ('enelx',
     'Mario',
     'Rossi',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'interventions@enelx.com',
     (SELECT id FROM companies WHERE name = 'Enel X'),
     true,
     true),
    
    ('luceservice',
     'Giulia',
     'Lamberti',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'service@luceservice.com',
     (SELECT id FROM companies WHERE name = 'Luce Service'),
     true,
     true),
    
    -- WATER SUPPLY maintainers
    ('acea',
     'Luca',
     'Gialli',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'water@acea.it',
     (SELECT id FROM companies WHERE name = 'Acea'),
     true,
     true),
    
    ('acquatecnica',
     'Alessandro',
     'Fontana',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'info@acquatecnica.it',
     (SELECT id FROM companies WHERE name = 'Acqua Tecnica'),
     true,
     true),
    
    -- WASTE MANAGEMENT maintainers
    ('hera',
     'Christian',
     'Bassi',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'waste@hera.it',
     (SELECT id FROM companies WHERE name = 'Hera'),
     true,
     true),
    
    ('ecoservice',
     'Francesca',
     'Eco',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'raccolta@ecoservice.it',
     (SELECT id FROM companies WHERE name = 'Eco Service'),
     true,
     true),
    
    -- ROAD SIGNS AND TRAFFIC LIGHTS maintainers
    ('atm',
     'Gianni',
     'Maggi',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'traffic@atm.it',
     (SELECT id FROM companies WHERE name = 'ATM'),
     true,
     true),
    
    ('segnaletica',
     'Roberto',
     'Segnali',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'segni@segnaleticamoderna.it',
     (SELECT id FROM companies WHERE name = 'Segnaletica Moderna'),
     true,
     true),
    
    -- SEWER SYSTEM maintainers
    ('fognaturepro',
     'Matteo',
     'Condotti',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'interventi@fognaturepro.it',
     (SELECT id FROM companies WHERE name = 'Fognature Pro'),
     true,
     true),
    
    ('idraulicaexpress',
     'Simone',
     'Tubi',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'servizio@idraulicaexpress.it',
     (SELECT id FROM companies WHERE name = 'Idraulica Express'),
     true,
     true),
    
    -- ARCHITECTURAL BARRIERS maintainers
    ('accessibilita',
     'Laura',
     'Rampe',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'progetti@accessibilitatotale.it',
     (SELECT id FROM companies WHERE name = 'Accessibilità Totale'),
     true,
     true),
    
    ('barrierezero',
     'Paolo',
     'Inclusivo',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'contatti@barrierezero.it',
     (SELECT id FROM companies WHERE name = 'Barriere Zero'),
     true,
     true),
    
    -- ROADS AND URBAN FURNISHINGS maintainers
    ('stradesicure',
     'Andrea',
     'Asfalti',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'lavori@stradesicure.it',
     (SELECT id FROM companies WHERE name = 'Strade Sicure'),
     true,
     true),
    
    ('asfaltinord',
     'Giovanni',
     'Buche',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'manutenzione@asfaltinord.it',
     (SELECT id FROM companies WHERE name = 'Asfalti Nord'),
     true,
     true),
    
    -- PUBLIC GREEN AREAS AND PLAYGROUNDS maintainers
    ('giardinriverdi',
     'Elena',
     'Prati',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'verde@giardinriverdi.it',
     (SELECT id FROM companies WHERE name = 'Giardini Verdi'),
     true,
     true),
    
    ('parchibelli',
     'Marco',
     'Aiuole',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'parchi@parchibelli.it',
     (SELECT id FROM companies WHERE name = 'Parchi Belli'),
     true,
     true),
    
    -- OTHER CATEGORY maintainers
    ('servizigenerali',
     'Stefano',
     'Multitask',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'info@servizigenerali.it',
     (SELECT id FROM companies WHERE name = 'Servizi Generali'),
     true,
     true),
    
    ('manutenzioneuniv',
     'Daniela',
     'Universale',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     (SELECT dr.id FROM department_roles dr
      JOIN departments d ON dr.department_id = d.id
      JOIN roles r ON dr.role_id = r.id
      WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
     'assistenza@manutenzioneuniversale.it',
     (SELECT id FROM companies WHERE name = 'Manutenzione Universale'),
     true,
     true)
ON CONFLICT (username) DO NOTHING;

-- Test Citizens
INSERT INTO users (username, first_name, last_name, password_hash, email, email_notifications_enabled, is_verified)
VALUES
    ('user', 'Giulio', 'Coppi',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     'user@test.com', true, true),
    ('user2', 'Alessia', 'Marroni',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     'user2@test.com', true, true)
ON CONFLICT (username) DO NOTHING;

/*
 * 8. Create test Municipal Public Relations Officers
 * Username: officer, officer2, officer3
 * Password: officer (for all)
 * Status: Verified
 */
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
-- Municipal Public Relations Officer
INSERT INTO users (username, first_name, last_name, password_hash, email, email_notifications_enabled, is_verified)
VALUES (
    'officer',
    'Giada',
    'Grassi',
    '848572160c1563d131bc2aeeaf0517a7:abfae26e6a0caa22c33c4361e9f2ef71fbe0731e53edd6f508016745ac6d1ecbc8c36f2889c23ba10054fb37f65eb209648feb827bb38cf397aca2f49ce12be0',
    'officer@participium.local',
    true,
    true  -- Officer already verified
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'officer2',
    'Marco',
    'Ferretti',
    -- Password hash for 'officer'
    '848572160c1563d131bc2aeeaf0517a7:abfae26e6a0caa22c33c4361e9f2ef71fbe0731e53edd6f508016745ac6d1ecbc8c36f2889c23ba10054fb37f65eb209648feb827bb38cf397aca2f49ce12be0',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Organization' AND r.name = 'Municipal Public Relations Officer'),
    'officer2@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'officer3',
    'Sofia',
    'Moretti',
    -- Password hash for 'officer'
    '848572160c1563d131bc2aeeaf0517a7:abfae26e6a0caa22c33c4361e9f2ef71fbe0731e53edd6f508016745ac6d1ecbc8c36f2889c23ba10054fb37f65eb209648feb827bb38cf397aca2f49ce12be0',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Organization' AND r.name = 'Municipal Public Relations Officer'),
    'officer3@participium.local',
    true,
    true
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
    'Lucia',
    'Bianchi',
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

-- Department Directors
INSERT INTO users (username, first_name, last_name, password_hash, email, email_notifications_enabled, is_verified)
VALUES
    ('director_water', 'Lucia', 'Bianchi',
     'f1e1121ec7ae66434c068e02a5c0a133:3226ff94b978b740dc230ce7ec7ea2ca61b0b43b156395175e225e1d9b8eb23404f5afc781213b43cd7608982dbc3082212891b67eec202dce55a0c2332a58c7',
     'director.water@participium.local', true, true),
    ('director_infra', 'Chiara', 'Rossi',
     'f1e1121ec7ae66434c068e02a5c0a133:3226ff94b978b740dc230ce7ec7ea2ca61b0b43b156395175e225e1d9b8eb23404f5afc781213b43cd7608982dbc3082212891b67eec202dce55a0c2332a58c7',
     'director.infra@participium.local', true, true),
    ('director_lighting', 'Mario', 'Grandi',
     'f1e1121ec7ae66434c068e02a5c0a133:3226ff94b978b740dc230ce7ec7ea2ca61b0b43b156395175e225e1d9b8eb23404f5afc781213b43cd7608982dbc3082212891b67eec202dce55a0c2332a58c7',
     'director.lighting@participium.local', true, true),
    ('director_waste', 'Luca', 'Bossi',
     'f1e1121ec7ae66434c068e02a5c0a133:3226ff94b978b740dc230ce7ec7ea2ca61b0b43b156395175e225e1d9b8eb23404f5afc781213b43cd7608982dbc3082212891b67eec202dce55a0c2332a58c7',
     'director.waste@participium.local', true, true),
    ('director_traffic', 'Andrea', 'Maini',
     'f1e1121ec7ae66434c068e02a5c0a133:3226ff94b978b740dc230ce7ec7ea2ca61b0b43b156395175e225e1d9b8eb23404f5afc781213b43cd7608982dbc3082212891b67eec202dce55a0c2332a58c7',
     'director.traffic@participium.local', true, true),
    ('director_parks', 'Carola', 'Verdi',
     'f1e1121ec7ae66434c068e02a5c0a133:3226ff94b978b740dc230ce7ec7ea2ca61b0b43b156395175e225e1d9b8eb23404f5afc781213b43cd7608982dbc3082212891b67eec202dce55a0c2332a58c7',
     'director.parks@participium.local', true, true),
    ('director_services', 'Pietro', 'Gialli',
     'f1e1121ec7ae66434c068e02a5c0a133:3226ff94b978b740dc230ce7ec7ea2ca61b0b43b156395175e225e1d9b8eb23404f5afc781213b43cd7608982dbc3082212891b67eec202dce55a0c2332a58c7',
     'director.services@participium.local', true, true)
ON CONFLICT (username) DO NOTHING;

-- Technical Staff Members
INSERT INTO users (username, first_name, last_name, password_hash, email, email_notifications_enabled, is_verified)
VALUES
    ('staff_water', 'Pietro', 'Verdi',
     '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
     'staff.water@participium.local', true, true),
    ('staff_sewer', 'Angelo', 'Corradi',
     '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
     'staff.sewer@participium.local', true, true),
    ('staff_access', 'Angelo', 'Rossi',
     '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
     'staff.access@participium.local', true, true),
    ('staff_road', 'Filippo', 'Toscano',
     '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
     'staff.road@participium.local', true, true),
    ('staff_lighting', 'Andrea', 'Pugliese',
     '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
     'staff.lighting@participium.local', true, true),
    ('staff_waste', 'Carolina', 'Lombardi',
     '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
     'staff.waste@participium.local', true, true),
    ('staff_traffic', 'Luca', 'Angeleri',
     '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
     'staff.traffic@participium.local', true, true),
    ('staff_parks', 'Matteo', 'Re',
     '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
     'staff.parks@participium.local', true, true),
    ('staff_support', 'Marco', 'Lolla',
     '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
     'staff.support@participium.local', true, true)
ON CONFLICT (username) DO NOTHING;

/*
 * ====================================
 * 7. ASSIGN ROLES VIA user_roles TABLE (PT10)
 * ====================================
 * This section assigns roles to users using the new many-to-many structure
 */

-- Helper function to get department_role_id
CREATE OR REPLACE FUNCTION get_department_role_id(dept_name VARCHAR, role_name_param VARCHAR)
RETURNS INT AS $$
    SELECT dr.id FROM department_roles dr
    JOIN departments d ON dr.department_id = d.id
    JOIN roles r ON dr.role_id = r.id
    WHERE d.name = dept_name AND r.name = role_name_param;
$$ LANGUAGE SQL;

-- Administrator role
INSERT INTO user_roles (user_id, department_role_id)
SELECT 
    (SELECT id FROM users WHERE username = 'admin'),
    get_department_role_id('Organization', 'Administrator')
ON CONFLICT (user_id, department_role_id) DO NOTHING;

-- External Maintainers roles
INSERT INTO user_roles (user_id, department_role_id)
VALUES
    ((SELECT id FROM users WHERE username = 'enelx'), get_department_role_id('External Service Providers', 'External Maintainer')),
    ((SELECT id FROM users WHERE username = 'acea'), get_department_role_id('External Service Providers', 'External Maintainer')),
    ((SELECT id FROM users WHERE username = 'hera'), get_department_role_id('External Service Providers', 'External Maintainer')),
    ((SELECT id FROM users WHERE username = 'atm'), get_department_role_id('External Service Providers', 'External Maintainer'))
ON CONFLICT (user_id, department_role_id) DO NOTHING;

-- Citizens roles
INSERT INTO user_roles (user_id, department_role_id)
VALUES
    ((SELECT id FROM users WHERE username = 'user'), get_department_role_id('Organization', 'Citizen')),
    ((SELECT id FROM users WHERE username = 'user2'), get_department_role_id('Organization', 'Citizen'))
ON CONFLICT (user_id, department_role_id) DO NOTHING;

-- Municipal Public Relations Officer role
INSERT INTO user_roles (user_id, department_role_id)
SELECT 
    (SELECT id FROM users WHERE username = 'officer'),
    get_department_role_id('Organization', 'Municipal Public Relations Officer')
ON CONFLICT (user_id, department_role_id) DO NOTHING;

-- Department Directors roles
INSERT INTO user_roles (user_id, department_role_id)
VALUES
    ((SELECT id FROM users WHERE username = 'director_water'), get_department_role_id('Water and Sewer Services Department', 'Department Director')),
    ((SELECT id FROM users WHERE username = 'director_infra'), get_department_role_id('Public Infrastructure and Accessibility Department', 'Department Director')),
    ((SELECT id FROM users WHERE username = 'director_lighting'), get_department_role_id('Public Lighting Department', 'Department Director')),
    ((SELECT id FROM users WHERE username = 'director_waste'), get_department_role_id('Waste Management Department', 'Department Director')),
    ((SELECT id FROM users WHERE username = 'director_traffic'), get_department_role_id('Mobility and Traffic Management Department', 'Department Director')),
    ((SELECT id FROM users WHERE username = 'director_parks'), get_department_role_id('Parks, Green Areas and Recreation Department', 'Department Director')),
    ((SELECT id FROM users WHERE username = 'director_services'), get_department_role_id('General Services Department', 'Department Director'))
ON CONFLICT (user_id, department_role_id) DO NOTHING;

-- Technical Staff roles
INSERT INTO user_roles (user_id, department_role_id)
VALUES
    ((SELECT id FROM users WHERE username = 'staff_water'), get_department_role_id('Water and Sewer Services Department', 'Water Network staff member')),
    ((SELECT id FROM users WHERE username = 'staff_sewer'), get_department_role_id('Water and Sewer Services Department', 'Sewer System staff member')),
    ((SELECT id FROM users WHERE username = 'staff_access'), get_department_role_id('Public Infrastructure and Accessibility Department', 'Accessibility staff member')),
    ((SELECT id FROM users WHERE username = 'staff_road'), get_department_role_id('Public Infrastructure and Accessibility Department', 'Road Maintenance staff member')),
    ((SELECT id FROM users WHERE username = 'staff_lighting'), get_department_role_id('Public Lighting Department', 'Electrical staff member')),
    ((SELECT id FROM users WHERE username = 'staff_waste'), get_department_role_id('Waste Management Department', 'Recycling Program staff member')),
    ((SELECT id FROM users WHERE username = 'staff_traffic'), get_department_role_id('Mobility and Traffic Management Department', 'Traffic management staff member')),
    ((SELECT id FROM users WHERE username = 'staff_parks'), get_department_role_id('Parks, Green Areas and Recreation Department', 'Parks Maintenance staff member')),
    ((SELECT id FROM users WHERE username = 'staff_support'), get_department_role_id('General Services Department', 'Support Officer'))
ON CONFLICT (user_id, department_role_id) DO NOTHING;

/*
 * ====================================
 * 8. EXAMPLE: USER WITH MULTIPLE ROLES
 * ====================================
 */

-- Create a multi-role user for testing
INSERT INTO users (username, first_name, last_name, password_hash, email, email_notifications_enabled, is_verified)
VALUES (
    'multirole',
    'Giovanni',
    'Multiruolo',
    '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
    'multirole@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

/*
 * 11. Create SECOND Technical Staff Members for redundancy
 * Username: staff2_[category]
 * Password: staff (for all)
 * Status: Verified
 */

-- Second Water Network staff member
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff2_water',
    'Giuseppe',
    'Acqua',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Water and Sewer Services Department' AND r.name = 'Water Network staff member'),
    'staff2.water@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Second Sewer System staff member
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff2_sewer',
    'Federica',
    'Fogne',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Water and Sewer Services Department' AND r.name = 'Sewer System staff member'),
    'staff2.sewer@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Second Accessibility staff member
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff2_access',
    'Valentina',
    'Barriere',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Public Infrastructure and Accessibility Department' AND r.name = 'Accessibility staff member'),
    'staff2.access@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Second Road Maintenance staff member
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff2_road',
    'Riccardo',
    'Strade',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Public Infrastructure and Accessibility Department' AND r.name = 'Road Maintenance staff member'),
    'staff2.road@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Second Electrical staff member (Public Lighting)
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff2_lighting',
    'Cristina',
    'Lampioni',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Public Lighting Department' AND r.name = 'Electrical staff member'),
    'staff2.lighting@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Second Recycling Program staff member (Waste)
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff2_waste',
    'Davide',
    'Rifiuti',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Waste Management Department' AND r.name = 'Recycling Program staff member'),
    'staff2.waste@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Second Traffic management staff member
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff2_traffic',
    'Isabella',
    'Traffico',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Mobility and Traffic Management Department' AND r.name = 'Traffic management staff member'),
    'staff2.traffic@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Second Parks Maintenance staff member
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff2_parks',
    'Tommaso',
    'Giardini',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'Parks, Green Areas and Recreation Department' AND r.name = 'Parks Maintenance staff member'),
    'staff2.parks@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Second Support Officer (Other category)
INSERT INTO users (username, first_name, last_name, password_hash, department_role_id, email, email_notifications_enabled, is_verified)
VALUES (
    'staff2_support',
    'Alessandra',
    'Servizi',
    -- Password hash for 'staff'
    '2334999626450f0e93bc7f37fb68fd21:8d094d332b9aac31eb603cce7adac984dd49a366f5e51ddeb4cb273549c6fa199b021091378438829fb1732a72a69f39dca1d90436185e07233e21214c2f2e41',
    (SELECT dr.id FROM department_roles dr
     JOIN departments d ON dr.department_id = d.id
     JOIN roles r ON dr.role_id = r.id
     WHERE d.name = 'General Services Department' AND r.name = 'Support Officer'),
    'staff2.support@participium.local',
    true,
    true
)
ON CONFLICT (username) DO NOTHING;

-- Assign multiple roles to the multi-role user
INSERT INTO user_roles (user_id, department_role_id)
VALUES
    ((SELECT id FROM users WHERE username = 'multirole'), get_department_role_id('Water and Sewer Services Department', 'Water Network staff member')),
    ((SELECT id FROM users WHERE username = 'multirole'), get_department_role_id('Public Lighting Department', 'Electrical staff member'))
ON CONFLICT (user_id, department_role_id) DO NOTHING;

-- Drop the helper function
DROP FUNCTION IF EXISTS get_department_role_id(VARCHAR, VARCHAR);

/*
 * ====================================
 * 9. CREATE TEST REPORTS
 * ====================================
 */

INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Dangerous Road Sign',
    'I am reporting a road sign pole in dangerous conditions on Via Legnano. The pole appears tilted and unstable, representing a potential danger for pedestrians and vehicles.',
    'Road Signs and Traffic Lights',
    ST_SetSRID(ST_MakePoint(7.6729845, 45.0597859), 4326)::geography,
    'Via Legnano, 1, Borgo Vittoria, Torino, Città Metropolitana di Torino, Piemonte, 10148, Italia',
    false,
    'Assigned',
    NULL,
    (SELECT id FROM users WHERE username = 'atm'),
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
    ST_SetSRID(ST_MakePoint(7.659568, 45.058586), 4326)::geography,
    'Corso Duca degli Abbruzzi, 52, Centro, Torino, Città Metropolitana di Torino, Piemonte, 10129, Italia',
    false,
    'Assigned',
    (SELECT id FROM users WHERE username = 'staff_traffic'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Scattered Waste on Street',
    'I am reporting scattered waste on the street. Photos attached.',
    'Waste',
    ST_SetSRID(ST_MakePoint(7.6663837, 45.0699145), 4326)::geography,
    'Via Giuseppe Giusti, 3, San Salvario, Torino, Città Metropolitana di Torino, Piemonte, 10133, Italia',
    false,
    'Assigned',
    NULL,
    (SELECT id FROM users WHERE username = 'hera'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Tilting Street Lamp',
    'I am reporting a tilting street lamp. Photos attached.',
    'Public Lighting',
    ST_SetSRID(ST_MakePoint(7.6364474, 45.0414631), 4326)::geography,
    'Corso Orbassano, 224a, Mirafiori Sud, Torino, Città Metropolitana di Torino, Piemonte, 10137, Italia',
    false,
    'Assigned',
    NULL,
    (SELECT id FROM users WHERE username = 'enelx'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Pothole on Via Pietro Giuria',
    'Large pothole in the middle of the road, dangerous for cyclists.',
    'Roads and Urban Furnishings',
    ST_SetSRID(ST_MakePoint(7.6791932, 45.0492381), 4326)::geography,
    'Via Pietro Giuria, 1, Crocetta, Torino, Città Metropolitana di Torino, Piemonte, 10138, Italia',
    false,
    'Assigned',
    (SELECT id FROM users WHERE username = 'staff_road'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Broken Bench in Park',
    'Wooden slats are missing from the bench near the playground.',
    'Public Green Areas and Playgrounds',
    ST_SetSRID(ST_MakePoint(7.6849361, 45.0523928), 4326)::geography,
    'Parco del Valentino, 1, Parco del Valentino, Torino, Città Metropolitana di Torino, Piemonte, 10126, Italia',
    false,
    'Assigned',
    NULL,
    (SELECT id FROM users WHERE username = 'giardinriverdi'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Overflowing Bin',
    'Public trash bin is overflowing and garbage is on the sidewalk.',
    'Waste',
    ST_SetSRID(ST_MakePoint(7.671031, 45.0389857), 4326)::geography,
    'Via Alassio, 1, Lingotto, Torino, Città Metropolitana di Torino, Piemonte, 10126, Italia',
    true,
    'Resolved',
    (SELECT id FROM users WHERE username = 'staff_waste'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Overflowing Bin' LIMIT 1),
    '/seed-data/photos/8/8.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 4
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Water Leak on Street',
    'Significant water leak coming from the pavement, creating a large puddle.',
    'Water Supply - Drinking Water',
    ST_SetSRID(ST_MakePoint(7.6682616, 45.0663784), 4326)::geography,
    'Corso Vittorio Emanuele II, 1, Centro, Torino, Città Metropolitana di Torino, Piemonte, 10123, Italia',
    false,
    'In Progress',
    NULL,
    (SELECT id FROM users WHERE username = 'acea'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Water Leak on Street' LIMIT 1),
    '/seed-data/photos/9/9.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 5
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Graffiti on Wall',
    'Offensive graffiti on the side of the public library.',
    'Other',
    ST_SetSRID(ST_MakePoint(7.687578, 45.0698479), 4326)::geography,
    'Via Po, 1, Centro, Torino, Città Metropolitana di Torino, Piemonte, 10123, Italia',
    false,
    'Assigned',
    NULL,
    (SELECT id FROM users WHERE username = 'servizigenerali'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Graffiti on Wall' LIMIT 1),
    '/seed-data/photos/10/10.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 6
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Broken Traffic Light',
    'Traffic light at the intersection is completely out.',
    'Road Signs and Traffic Lights',
    ST_SetSRID(ST_MakePoint(7.6390878, 45.0685456), 4326)::geography,
    'Corso Peschiera, 1, Borgo San Paolo, Torino, Città Metropolitana di Torino, Piemonte, 10139, Italia',
    false,
    'Assigned',
    (SELECT id FROM users WHERE username = 'staff_traffic'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Broken Traffic Light' LIMIT 1),
    '/seed-data/photos/11/11.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 7
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Fallen Tree Branch',
    'Large branch fell on the path, blocking access.',
    'Public Green Areas and Playgrounds',
    ST_SetSRID(ST_MakePoint(7.665980893996415, 45.09215910802925), 4326)::geography,
    'Parco Dora, 1, Parco Dora, Torino, Città Metropolitana di Torino, Piemonte, 10153, Italia',
    true,
    'Resolved',
    (SELECT id FROM users WHERE username = 'staff_parks'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Fallen Tree Branch' LIMIT 1),
    '/seed-data/photos/12/12.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 8
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Blocked Drain',
    'Storm drain is blocked with leaves and causing flooding.',
    'Sewer System',
    ST_SetSRID(ST_MakePoint(7.6240407, 45.048067), 4326)::geography,
    'Via Guido Reni, 1, Barriera di Milano, Torino, Città Metropolitana di Torino, Piemonte, 10152, Italia',
    false,
    'In Progress',
    NULL,
    (SELECT id FROM users WHERE username = 'fognaturepro'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Blocked Drain' LIMIT 1),
    '/seed-data/photos/13/13.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 9
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Street Light Out',
    'Street light in front of number 15 is not working.',
    'Public Lighting',
    ST_SetSRID(ST_MakePoint(7.6783647, 45.0598692), 4326)::geography,
    'Via Nizza, 15, Centro, Torino, Città Metropolitana di Torino, Piemonte, 10125, Italia',
    false,
    'Suspended',
    (SELECT id FROM users WHERE username = 'staff_lighting'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Street Light Out' LIMIT 1),
    '/seed-data/photos/14/14.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 10
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Damaged Sidewalk',
    'Sidewalk tiles are loose and dangerous.',
    'Architectural Barriers',
    ST_SetSRID(ST_MakePoint(7.6739043, 45.0579166), 4326)::geography,
    'Via Sacchi, 1, Centro, Torino, Città Metropolitana di Torino, Piemonte, 10128, Italia',
    false,
    'Assigned',
    NULL,
    (SELECT id FROM users WHERE username = 'accessibilita'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Damaged Sidewalk' LIMIT 1),
    '/seed-data/photos/15/15.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 11
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Illegal Dumping',
    'Pile of construction waste dumped on the roadside.',
    'Waste',
    ST_SetSRID(ST_MakePoint(7.6184544, 45.0667864), 4326)::geography,
    'Strada della Pronda, 1, Barriera di Milano, Torino, Città Metropolitana di Torino, Piemonte, 10152, Italia',
    true,
    'Resolved',
    (SELECT id FROM users WHERE username = 'staff_waste'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Illegal Dumping' LIMIT 1),
    '/seed-data/photos/16/16.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 12
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Leaking Pipe',
    'Water leaking from a pipe under the street.',
    'Water Supply - Drinking Water',
    ST_SetSRID(ST_MakePoint(7.6872697, 45.048575), 4326)::geography,
    'Corso Moncalieri, 1, Crocetta, Torino, Città Metropolitana di Torino, Piemonte, 10133, Italia',
    false,
    'In Progress',
    (SELECT id FROM users WHERE username = 'staff_water'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Leaking Pipe' LIMIT 1),
    '/seed-data/photos/17/17.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 13
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Damaged Stop Sign',
    'The stop sign is bent and difficult to read.',
    'Road Signs and Traffic Lights',
    ST_SetSRID(ST_MakePoint(7.6737702, 45.071474), 4326)::geography,
    'Via Cernaia, 1, San Salvario, Torino, Città Metropolitana di Torino, Piemonte, 10133, Italia',
    false,
    'Resolved',
    (SELECT id FROM users WHERE username = 'staff_traffic'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Damaged Stop Sign' LIMIT 1),
    '/seed-data/photos/18/18.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 14
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Overgrown Grass',
    'Grass in the park is too high, needs mowing.',
    'Public Green Areas and Playgrounds',
    ST_SetSRID(ST_MakePoint(7.6347541, 45.0569526), 4326)::geography,
    'Parco Ruffini, 1, Parco Ruffini, Torino, Città Metropolitana di Torino, Piemonte, 10127, Italia',
    false,
    'Assigned',
    (SELECT id FROM users WHERE username = 'staff_parks'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Overgrown Grass' LIMIT 1),
    '/seed-data/photos/19/19.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 15
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Flooded Street',
    'Street is flooded after heavy rain due to clogged drains.',
    'Sewer System',
    ST_SetSRID(ST_MakePoint(7.6376228, 45.0446553), 4326)::geography,
    'Via Filadelfia, 1, Mirafiori Nord, Torino, Città Metropolitana di Torino, Piemonte, 10137, Italia',
    true,
    'Resolved',
    NULL,
    (SELECT id FROM users WHERE username = 'idraulicaexpress'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Flooded Street' LIMIT 1),
    '/seed-data/photos/20/20.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 16
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Flickering Street Light',
    'Street light flickers constantly at night.',
    'Public Lighting', 
    ST_SetSRID(ST_MakePoint(7.656828, 45.100761), 4326)::geography,
    'Via Alfredo Oriani, 1, Barriera di Milano, Torino, Città Metropolitana di Torino, Piemonte, 10152, Italia',
    false,
    'In Progress',
    NULL,
    (SELECT id FROM users WHERE username = 'luceservice'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Flickering Street Light' LIMIT 1),
    '/seed-data/photos/21/21.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 17
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Wheelchair Ramp Blocked',
    'Wheelchair ramp is blocked by a plant pot.',
    'Architectural Barriers',
    ST_SetSRID(ST_MakePoint(7.6786074, 45.0734881), 4326)::geography,
    'Via Garibaldi, 1, Centro, Torino, Città Metropolitana di Torino, Piemonte, 10122, Italia',
    false,
    'Assigned',
    NULL,
    (SELECT id FROM users WHERE username = 'barrierezero'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Wheelchair Ramp Blocked' LIMIT 1),
    '/seed-data/photos/22/22.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 18
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Pothole on Corso Francia',
    'Deep pothole causing tire damage.',
    'Roads and Urban Furnishings',
    ST_SetSRID(ST_MakePoint(7.667693, 45.07636), 4326)::geography,
    'Corso Francia, Torino, TO, Italy',
    false,
    'Assigned',
    NULL,
    (SELECT id FROM users WHERE username = 'stradesicure'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Pothole on Corso Francia' LIMIT 1),
    '/seed-data/photos/23/23.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 19
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Broken Fountain',
    'Drinking fountain in the square is not working.',
    'Water Supply - Drinking Water',
    ST_SetSRID(ST_MakePoint(7.6825711, 45.0677154), 4326)::geography,
    'Piazza San Carlo, Torino, TO, Italy',
    true,
    'Resolved',
    (SELECT id FROM users WHERE username = 'staff_water'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Broken Fountain' LIMIT 1),
    '/seed-data/photos/24/24.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 20
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Abandoned Car',
    'Car abandoned for months, tires flat.',
    'Other',
    ST_SetSRID(ST_MakePoint(7.6220059, 45.0433029), 4326)::geography,
    'Via Francesco Saverio Nitti, Torino',
    false,
    'In Progress',
    NULL,
    (SELECT id FROM users WHERE username = 'manutenzioneuniv'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Abandoned Car' LIMIT 1),
    '/seed-data/photos/25/25.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 21
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Traffic Light Stuck on Red',
    'Traffic light at intersection stuck on red for 10 minutes.',
    'Road Signs and Traffic Lights',
    ST_SetSRID(ST_MakePoint(7.6414646, 45.0565656), 4326)::geography,
    'Corso Rosselli, Torino, TO, Italy',
    false,
    'Resolved',
    (SELECT id FROM users WHERE username = 'staff_traffic'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Traffic Light Stuck on Red' LIMIT 1),
    '/seed-data/photos/26/26.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 22
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Litter in Playground',
    'Broken glass and litter in the children''s play area.',
    'Public Green Areas and Playgrounds',
    ST_SetSRID(ST_MakePoint(7.6896722, 45.0631428), 4326)::geography,
    'Giardini Cavour, Torino, TO, Italy',
    false,
    'Assigned',
    NULL,
    (SELECT id FROM users WHERE username = 'parchibelli'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Litter in Playground' LIMIT 1),
    '/seed-data/photos/27/27.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 23
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Sewage Smell',
    'Strong sewage smell coming from the drain.',
    'Sewer System',
    ST_SetSRID(ST_MakePoint(7.6854348, 45.0745761), 4326)::geography,
    'Via XX Settembre, Torino, TO, Italy',
    true,
    'Resolved',
    (SELECT id FROM users WHERE username = 'staff_sewer'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Sewage Smell' LIMIT 1),
    '/seed-data/photos/28/28.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 24
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Dark Street Corner',
    'Street light is broken, corner is very dark and unsafe.',
    'Public Lighting',
    ST_SetSRID(ST_MakePoint(7.681051, 45.102628), 4326)::geography,
    'Via Chiesa della Salute, Torino, TO, Italy',
    false,
    'In Progress',
    (SELECT id FROM users WHERE username = 'staff_lighting'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Dark Street Corner' LIMIT 1),
    '/seed-data/photos/29/29.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 25
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Uneven Pavement',
    'Pavement stones are uneven, tripping hazard.',
    'Architectural Barriers',
    ST_SetSRID(ST_MakePoint(7.6836382, 45.0647839), 4326)::geography,
    'Via Carlo Alberto, Torino, TO, Italy',
    false,
    'Assigned',
    (SELECT id FROM users WHERE username = 'staff_access'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Uneven Pavement' LIMIT 1),
    '/seed-data/photos/30/30.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 26
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Full Recycling Bin',
    'Plastic recycling bin is full and overflowing.',
    'Waste',
    ST_SetSRID(ST_MakePoint(7.6375743, 45.0669992), 4326)::geography,
    'Corso Trapani, Torino, TO, Italy',
    false,
    'Assigned',
    NULL,
    (SELECT id FROM users WHERE username = 'ecoservice'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Full Recycling Bin' LIMIT 1),
    '/seed-data/photos/31/31.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 27
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Water Leak in Park',
    'Irrigation system in the park is leaking water.',
    'Water Supply - Drinking Water',
    ST_SetSRID(ST_MakePoint(7.6849361, 45.0523928), 4326)::geography,
    'Parco del Valentino, Torino, TO, Italy',
    true,
    'Resolved',
    (SELECT id FROM users WHERE username = 'staff_water'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Water Leak in Park' LIMIT 1),
    '/seed-data/photos/32/32.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 28
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Faded Crosswalk',
    'Crosswalk markings are faded and barely visible.',
    'Road Signs and Traffic Lights',
    ST_SetSRID(ST_MakePoint(7.6669738, 45.0641187), 4326)::geography,
    'Corso Stati Uniti, Torino, TO, Italy',
    false,
    'In Progress',
    NULL,
    (SELECT id FROM users WHERE username = 'segnaletica'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Faded Crosswalk' LIMIT 1),
    '/seed-data/photos/33/33.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 29
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Damaged Bus Stop',
    'Glass panel at the bus stop is shattered.',
    'Roads and Urban Furnishings',
    ST_SetSRID(ST_MakePoint(7.6697116, 45.0535332), 4326)::geography,
    'Corso Turati, Torino, TO, Italy',
    false,
    'Pending Approval',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Graffiti on Monument',
    'Defacement of the monument base with spray paint.',
    'Other',
    ST_SetSRID(ST_MakePoint(7.681517568590413, 45.07325605231327), 4326)::geography,
    'Piazza Palazzo di Città, Torino, TO, Italy',
    false,
    'Pending Approval',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

/*
 * ====================================
 * 10. CREATE PHOTOS FOR REPORTS
 * ====================================
 */

INSERT INTO photos (report_id, storage_url, created_at)
SELECT id, '/seed-data/photos/1/1.jpg', CURRENT_TIMESTAMP
FROM reports WHERE title = 'Dangerous Road Sign' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
SELECT id, '/seed-data/photos/2/2.jpg', CURRENT_TIMESTAMP
FROM reports WHERE title = 'Damaged Traffic Light' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Broken Street Lamp' LIMIT 1),
    '/seed-data/photos/37/37.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 33
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Pothole near Station Porta Susa',
    'Deep pothole causing issues for cars turning.',
    'Roads and Urban Furnishings',
    ST_SetSRID(ST_MakePoint(7.666330709817362, 45.07152851905055), 4326)::geography,
    'Corso Bolzano, 87, Torino, TO, Italy',
    false,
    'In Progress',
    NULL,
    (SELECT id FROM users WHERE username = 'asfaltinord'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
SELECT id, '/seed-data/photos/4/4.jpg', CURRENT_TIMESTAMP
FROM reports WHERE title = 'Tilting Street Lamp' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
SELECT id, '/seed-data/photos/6/6.jpg', CURRENT_TIMESTAMP
FROM reports WHERE title = 'Pothole on Via Pietro Giuria' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
SELECT id, '/seed-data/photos/7/7.jpg', CURRENT_TIMESTAMP
FROM reports WHERE title = 'Broken Bench in Park' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
VALUES (
    (SELECT id FROM reports WHERE title = 'Blocked Sidewalk' LIMIT 1),
    '/seed-data/photos/41/41.jpg',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Report 37
INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, external_assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Water Leak',
    'Water bubbling up from the ground.',
    'Water Supply - Drinking Water',
    ST_SetSRID(ST_MakePoint(7.70024735893362, 45.09570501091417), 4326)::geography,
    'Giardino Peppino Impastato, Torino, TO, Italy',
    false,
    'In Progress',
    NULL,
    (SELECT id FROM users WHERE username = 'acquatecnica'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO photos (report_id, storage_url, created_at)
SELECT id, '/seed-data/photos/9/9.jpg', CURRENT_TIMESTAMP
FROM reports WHERE title = 'Water Leak on Street' LIMIT 1
ON CONFLICT DO NOTHING;

/*
 * ====================================
 * END OF SEED DATA
 * ====================================
 * 
 * Default Credentials:
 * - admin/admin (Administrator)
 * - officer/officer (Municipal Public Relations Officer)
 * - director_*/director (Department Directors)
 * - staff_*/staff (Technical Staff)
 * - user/password, user2/password (Citizens)
 * - enelx/password, acea/password, hera/password, atm/password (External Maintainers)
 * - multirole/password (Multi-role user demo - PT10)
 */