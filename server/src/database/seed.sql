/*
 * ====================================
 * DATA POPULATION - V5.0
 * ====================================
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

-- External Maintainers (with company_id)
INSERT INTO users (username, first_name, last_name, password_hash, email, company_id, email_notifications_enabled, is_verified)
VALUES
    ('enelx', 'Mario', 'Rossi',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     'interventions@enelx.com', (SELECT id FROM companies WHERE name = 'Enel X'), true, true),
    ('acea', 'Luca', 'Gialli',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     'water@acea.it', (SELECT id FROM companies WHERE name = 'Acea'), true, true),
    ('hera', 'Christian', 'Bassi',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     'waste@hera.it', (SELECT id FROM companies WHERE name = 'Hera'), true, true),
    ('atm', 'Gianni', 'Maggi',
     '7020171912e5505c6f0f738d4ebef2ed:d9287860544ca95295a2941079f6531267fe2c3d85c6555d033c04a262ad44ffdcc4ef551f92f7000fc40a28a779839108b6b4e2b7b332ee2165c6b7d17b216a',
     'traffic@atm.it', (SELECT id FROM companies WHERE name = 'ATM'), true, true)
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

-- Municipal Public Relations Officer
INSERT INTO users (username, first_name, last_name, password_hash, email, email_notifications_enabled, is_verified)
VALUES (
    'officer',
    'Giada',
    'Grassi',
    '848572160c1563d131bc2aeeaf0517a7:abfae26e6a0caa22c33c4361e9f2ef71fbe0731e53edd6f508016745ac6d1ecbc8c36f2889c23ba10054fb37f65eb209648feb827bb38cf397aca2f49ce12be0',
    'officer@participium.local',
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

INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Dangerous Road Sign',
    'I am reporting a road sign pole in dangerous conditions on Via Legnano. The pole appears tilted and unstable, representing a potential danger for pedestrians and vehicles.',
    'Road Signs and Traffic Lights',
    ST_SetSRID(ST_MakePoint(7.6729845, 45.0597859), 4326)::geography,
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
    ST_SetSRID(ST_MakePoint(7.659568, 45.058586), 4326)::geography,
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
    ST_SetSRID(ST_MakePoint(7.6663837, 45.0699145), 4326)::geography,
    'Via Giuseppe Giusti, 3, Torino, TO, Italy',
    false,
    'Assigned',
    (SELECT id FROM users WHERE username = 'staff_waste'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user'),
    'Tilting Street Lamp',
    'I am reporting a tilting street lamp. Photos attached.',
    'Public Lighting',
    ST_SetSRID(ST_MakePoint(7.6364474, 45.0414631), 4326)::geography,
    'Corso Orbassano, 224a, Torino, TO, Italy',
    false,
    'Assigned',
    (SELECT id FROM users WHERE username = 'staff_lighting'),
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
    'Via Pietro Giuria, Torino, TO, Italy',
    false,
    'Assigned',
    (SELECT id FROM users WHERE username = 'staff_road'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Broken Bench in Park',
    'Wooden slats are missing from the bench near the playground.',
    'Public Green Areas and Playgrounds',
    ST_SetSRID(ST_MakePoint(7.6849361, 45.0523928), 4326)::geography,
    'Parco del Valentino, Torino, TO, Italy',
    false,
    'Assigned',
    (SELECT id FROM users WHERE username = 'staff_parks'),
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
    'Via Alassio, Torino, TO, Italy',
    true,
    'Resolved',
    (SELECT id FROM users WHERE username = 'staff_waste'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

INSERT INTO reports (reporter_id, title, description, category, location, address, is_anonymous, status, assignee_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE username = 'user2'),
    'Water Leak on Street',
    'Significant water leak coming from the pavement, creating a large puddle.',
    'Water Supply - Drinking Water',
    ST_SetSRID(ST_MakePoint(7.6682616, 45.0663784), 4326)::geography,
    'Corso Vittorio Emanuele II, Torino, TO, Italy',
    false,
    'In Progress',
    (SELECT id FROM users WHERE username = 'staff_water'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

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
SELECT id, '/seed-data/photos/5/5.jpg', CURRENT_TIMESTAMP
FROM reports WHERE title = 'Scattered Waste on Street' LIMIT 1
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
SELECT id, '/seed-data/photos/8/8.jpg', CURRENT_TIMESTAMP
FROM reports WHERE title = 'Overflowing Bin' LIMIT 1
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