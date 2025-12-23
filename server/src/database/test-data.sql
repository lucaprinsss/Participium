-- ============================================
-- Test Data for E2E Testing - V5.0 (Multi-Role Support)
-- ============================================

-- Clear existing data (safety check)
TRUNCATE TABLE users CASCADE;

-- Reset sequences to ensure consistent IDs
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE companies_id_seq RESTART WITH 1;
ALTER SEQUENCE reports_id_seq RESTART WITH 1;
ALTER SEQUENCE photos_id_seq RESTART WITH 1;

-- ============================================
-- INSERT REFERENCE DATA (Extracted from seed.sql)
-- ============================================

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

-- ============================================
-- INSERT TEST USERS
-- ============================================

-- Test User 1: Citizen
-- Username: testcitizen
-- Password: TestPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testcitizen',
  'testcitizen@example.com',
  '06823ad32eca25e900d651552cbab5d3:5a565be83f11375d46478da34a525b902bd83974501f229db2baff163a5ab7a397ef440214f0558a1c120f511e7307547577151ca17ac10263d8ab521e8307eb',
  'Test',
  'Citizen',
  true,
  true,
  CURRENT_TIMESTAMP
);

-- Test User 2: Municipality User (Department Director)
-- Username: testmunicipality
-- Password: MuniPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testmunicipality',
  'testmunicipality@example.com',
  'a8157c4cbabc7231d0c471354393d547:86e29403471520224daaec377dfc9c814141708e551957077843fa26cb7a4eabc0da62e82ef6cc204e304da61c12131bbba843319193e275bb79c74ac5cca442',
  'Test',
  'Municipality',
  true,
  true,
  CURRENT_TIMESTAMP
);

-- Test User 3: Admin
-- Username: testadmin
-- Password: AdminPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testadmin',
  'testadmin@example.com',
  '8fe97f776b7ee432bc26b59685766dde:0a98fd0c723f3ea46e8216ea964d35502e423f7e030329027876931fc26325f0557ae2f6701f8f179fcdf1bbdb44897654e2a7cffb5e87c0d100094b791c3e83',
  'Test',
  'Admin',
  true,
  true,
  CURRENT_TIMESTAMP
);

-- Test User 4: Citizen without notifications
-- Username: testuser_nonotif
-- Password: NoNotif123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testuser_nonotif',
  'nonotif@example.com',
  '4c2c3c54743456758e61a087dd614843:f6058f47f69fe0ee4c617bb96d79209727e1f41905f841bb39271ea295bb90294809bddac0651b065f1082d512bc045009a3246220e3b3105606dbf7e3d9e5e7',
  'No',
  'Notifications',
  false,
  true,
  CURRENT_TIMESTAMP
);

-- Test User 5: Municipality Staff Member (Water Network)
-- Username: teststaffmember
-- Password: StaffPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'teststaffmember',
  'teststaffmember@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Test',
  'StaffMember',
  true,
  true,
  CURRENT_TIMESTAMP
);

-- Test User 6: Road Staff
-- Username: testroadstaff
-- Password: StaffPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testroadstaff',
  'testroadstaff@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Test',
  'RoadStaff',
  true,
  true,
  CURRENT_TIMESTAMP
);

-- Test User 7: Sewer Staff
-- Username: testsewerstaff
-- Password: StaffPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testsewerstaff',
  'testsewerstaff@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Test',
  'SewerStaff',
  true,
  true,
  CURRENT_TIMESTAMP
);

-- Test User 8: PRO
-- Username: testpro
-- Password: StaffPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testpro',
  'testpro@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Test',
  'PRO',
  true,
  true,
  CURRENT_TIMESTAMP
);

-- Test User 9: External Maintainer
-- Username: testexternal
-- Password: StaffPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testexternal',
  'testexternal@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Test',
  'External',
  true,
  true,
  CURRENT_TIMESTAMP
);


-- ============================================
-- INSERT TEST COMPANIES
-- ============================================

-- Company 1: Public Lighting company
INSERT INTO companies (name, category, created_at)
VALUES ('Lighting Solutions SRL', 'Public Lighting', CURRENT_TIMESTAMP);

-- Company 2: Waste Management company
INSERT INTO companies (name, category, created_at)
VALUES ('EcoWaste Management', 'Waste', CURRENT_TIMESTAMP);

-- Company 3: Roads Maintenance company
INSERT INTO companies (name, category, created_at)
VALUES ('Road Repair Co.', 'Roads and Urban Furnishings', CURRENT_TIMESTAMP);


-- ============================================
-- ASSIGN ROLES TO USERS (V5.0 Multi-Role)
-- ============================================

-- Assign Citizen role to testcitizen
INSERT INTO user_roles (user_id, department_role_id, created_at)
SELECT 
  u.id,
  dr.id,
  CURRENT_TIMESTAMP
FROM users u
CROSS JOIN department_roles dr
INNER JOIN departments d ON dr.department_id = d.id
INNER JOIN roles r ON dr.role_id = r.id
WHERE u.username = 'testcitizen'
  AND d.name = 'Organization' 
  AND r.name = 'Citizen';

-- Assign Department Director role to testmunicipality
INSERT INTO user_roles (user_id, department_role_id, created_at)
SELECT 
  u.id,
  dr.id,
  CURRENT_TIMESTAMP
FROM users u
CROSS JOIN department_roles dr
INNER JOIN departments d ON dr.department_id = d.id
INNER JOIN roles r ON dr.role_id = r.id
WHERE u.username = 'testmunicipality'
  AND d.name = 'Public Infrastructure and Accessibility Department' 
  AND r.name = 'Department Director';

-- Assign Administrator role to testadmin
INSERT INTO user_roles (user_id, department_role_id, created_at)
SELECT 
  u.id,
  dr.id,
  CURRENT_TIMESTAMP
FROM users u
CROSS JOIN department_roles dr
INNER JOIN departments d ON dr.department_id = d.id
INNER JOIN roles r ON dr.role_id = r.id
WHERE u.username = 'testadmin'
  AND d.name = 'Organization' 
  AND r.name = 'Administrator';

-- Assign Citizen role to testuser_nonotif
INSERT INTO user_roles (user_id, department_role_id, created_at)
SELECT 
  u.id,
  dr.id,
  CURRENT_TIMESTAMP
FROM users u
CROSS JOIN department_roles dr
INNER JOIN departments d ON dr.department_id = d.id
INNER JOIN roles r ON dr.role_id = r.id
WHERE u.username = 'testuser_nonotif'
  AND d.name = 'Organization' 
  AND r.name = 'Citizen';

-- Assign Water Network staff member role to teststaffmember
INSERT INTO user_roles (user_id, department_role_id, created_at)
SELECT 
  u.id,
  dr.id,
  CURRENT_TIMESTAMP
FROM users u
CROSS JOIN department_roles dr
INNER JOIN departments d ON dr.department_id = d.id
INNER JOIN roles r ON dr.role_id = r.id
WHERE u.username = 'teststaffmember'
  AND d.name = 'Water and Sewer Services Department' 
  AND r.name = 'Water Network staff member';

-- Assign Road Maintenance staff member role to testroadstaff
INSERT INTO user_roles (user_id, department_role_id, created_at)
SELECT 
  u.id,
  dr.id,
  CURRENT_TIMESTAMP
FROM users u
CROSS JOIN department_roles dr
INNER JOIN departments d ON dr.department_id = d.id
INNER JOIN roles r ON dr.role_id = r.id
WHERE u.username = 'testroadstaff'
  AND d.name = 'Public Infrastructure and Accessibility Department' 
  AND r.name = 'Road Maintenance staff member';

-- Assign Sewer System staff member role to testsewerstaff
INSERT INTO user_roles (user_id, department_role_id, created_at)
SELECT 
  u.id,
  dr.id,
  CURRENT_TIMESTAMP
FROM users u
CROSS JOIN department_roles dr
INNER JOIN departments d ON dr.department_id = d.id
INNER JOIN roles r ON dr.role_id = r.id
WHERE u.username = 'testsewerstaff'
  AND d.name = 'Water and Sewer Services Department' 
  AND r.name = 'Sewer System staff member';

-- Assign PRO role to testpro
INSERT INTO user_roles (user_id, department_role_id, created_at)
SELECT 
  u.id,
  dr.id,
  CURRENT_TIMESTAMP
FROM users u
CROSS JOIN department_roles dr
INNER JOIN departments d ON dr.department_id = d.id
INNER JOIN roles r ON dr.role_id = r.id
WHERE u.username = 'testpro'
  AND d.name = 'Organization' 
  AND r.name = 'Municipal Public Relations Officer';

-- Assign External Maintainer role to testexternal
INSERT INTO user_roles (user_id, department_role_id, created_at)
SELECT 
  u.id,
  dr.id,
  CURRENT_TIMESTAMP
FROM users u
CROSS JOIN department_roles dr
INNER JOIN departments d ON dr.department_id = d.id
INNER JOIN roles r ON dr.role_id = r.id
WHERE u.username = 'testexternal'
  AND d.name = 'External Service Providers' 
  AND r.name = 'External Maintainer';


-- ============================================
-- UPDATE EXTERNAL MAINTAINER WITH COMPANY
-- ============================================

-- Update testexternal user to belong to Lighting Solutions SRL
UPDATE users
SET company_id = (SELECT id FROM companies WHERE name = 'Lighting Solutions SRL')
WHERE username = 'testexternal';


-- ============================================
-- ADD MORE EXTERNAL MAINTAINERS
-- ============================================

-- External Maintainer 2: Public Lighting
-- Username: testexternal2
-- Password: StaffPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  company_id,
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testexternal2',
  'testexternal2@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Mario',
  'Rossi',
  (SELECT id FROM companies WHERE name = 'Lighting Solutions SRL'),
  true,
  true,
  CURRENT_TIMESTAMP
);

INSERT INTO user_roles (user_id, department_role_id, created_at)
SELECT 
  u.id,
  dr.id,
  CURRENT_TIMESTAMP
FROM users u
CROSS JOIN department_roles dr
INNER JOIN departments d ON dr.department_id = d.id
INNER JOIN roles r ON dr.role_id = r.id
WHERE u.username = 'testexternal2'
  AND d.name = 'External Service Providers' 
  AND r.name = 'External Maintainer';

-- External Maintainer 3: Waste
-- Username: testexternal3
-- Password: StaffPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  company_id,
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testexternal3',
  'testexternal3@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Giuseppe',
  'Verdi',
  (SELECT id FROM companies WHERE name = 'EcoWaste Management'),
  true,
  true,
  CURRENT_TIMESTAMP
);

INSERT INTO user_roles (user_id, department_role_id, created_at)
SELECT 
  u.id,
  dr.id,
  CURRENT_TIMESTAMP
FROM users u
CROSS JOIN department_roles dr
INNER JOIN departments d ON dr.department_id = d.id
INNER JOIN roles r ON dr.role_id = r.id
WHERE u.username = 'testexternal3'
  AND d.name = 'External Service Providers' 
  AND r.name = 'External Maintainer';

-- External Maintainer 4: Roads and Urban Furnishings
-- Username: testexternal4
-- Password: StaffPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  company_id,
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testexternal4',
  'testexternal4@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Luigi',
  'Bianchi',
  (SELECT id FROM companies WHERE name = 'Road Repair Co.'),
  true,
  true,
  CURRENT_TIMESTAMP
);

INSERT INTO user_roles (user_id, department_role_id, created_at)
SELECT 
  u.id,
  dr.id,
  CURRENT_TIMESTAMP
FROM users u
CROSS JOIN department_roles dr
INNER JOIN departments d ON dr.department_id = d.id
INNER JOIN roles r ON dr.role_id = r.id
WHERE u.username = 'testexternal4'
  AND d.name = 'External Service Providers' 
  AND r.name = 'External Maintainer';


-- ============================================
-- INSERT TEST REPORTS
-- ============================================

-- Report 1: Pending Approval - Public Lighting
INSERT INTO reports (
  reporter_id,
  title,
  description,
  category,
  location,
  address,
  is_anonymous,
  status,
  created_at
)
SELECT 
  u.id,
  'Street light broken',
  'The street light on Via Roma is not working properly and needs maintenance',
  'Public Lighting',
  ST_GeogFromText('POINT(7.6869005 45.0703393)'),
  'Via Roma 15, 10121 Torino',
  false,
  'Pending Approval',
  CURRENT_TIMESTAMP - INTERVAL '2 days' AS created_at
FROM users u WHERE u.username = 'testcitizen';

-- Report 2: Assigned - Roads and Urban Furnishings
INSERT INTO reports (
  reporter_id,
  title,
  description,
  category,
  location,
  address,
  is_anonymous,
  status,
  assignee_id,
  created_at
)
SELECT 
  citizen.id,
  'Broken sidewalk',
  'The sidewalk near the central park has a large crack and poses a safety hazard',
  'Roads and Urban Furnishings',
  ST_GeogFromText('POINT(7.6932941 45.0692403)'),
  'Corso Vittorio Emanuele II 45, 10125 Torino',
  false,
  'Assigned',
  staff.id,
  CURRENT_TIMESTAMP - INTERVAL '3 days' AS created_at
FROM users citizen, users staff 
WHERE citizen.username = 'testcitizen' 
  AND staff.username = 'teststaffmember';

-- Report 3: In Progress - Water Supply
INSERT INTO reports (
  reporter_id,
  title,
  description,
  category,
  location,
  address,
  is_anonymous,
  status,
  assignee_id,
  created_at
)
SELECT 
  citizen.id,
  'Water leak on street',
  'There is a significant water leak from the main pipe causing flooding',
  'Water Supply - Drinking Water',
  ST_GeogFromText('POINT(7.6782069 45.0625748)'),
  'Via Po 25, 10124 Torino',
  false,
  'In Progress',
  staff.id,
  CURRENT_TIMESTAMP - INTERVAL '5 days' AS created_at
FROM users citizen, users staff 
WHERE citizen.username = 'testcitizen' 
  AND staff.username = 'teststaffmember';

-- Report 4: Resolved - Waste
INSERT INTO reports (
  reporter_id,
  title,
  description,
  category,
  location,
  address,
  is_anonymous,
  status,
  assignee_id,
  created_at
)
SELECT 
  citizen.id,
  'Trash overflow',
  'The trash bin is completely full and garbage is overflowing onto the street',
  'Waste',
  ST_GeogFromText('POINT(7.6950000 45.0700000)'),
  'Piazza Castello 1, 10121 Torino',
  false,
  'Resolved',
  staff.id,
  CURRENT_TIMESTAMP - INTERVAL '7 days' AS created_at
FROM users citizen, users staff 
WHERE citizen.username = 'testcitizen' 
  AND staff.username = 'teststaffmember';

-- Report 5: Rejected - Other
INSERT INTO reports (
  reporter_id,
  title,
  description,
  category,
  location,
  address,
  is_anonymous,
  status,
  rejection_reason,
  created_at
)
SELECT 
  u.id,
  'Test rejected report',
  'This is a test report that was rejected',
  'Other',
  ST_GeogFromText('POINT(7.6800000 45.0650000)'),
  'Via Garibaldi 10, 10122 Torino',
  false,
  'Rejected',
  'Duplicate report - already exists',
  CURRENT_TIMESTAMP - INTERVAL '10 days' AS created_at
FROM users u WHERE u.username = 'testcitizen';

-- Report 6: Anonymous Pending - Architectural Barriers
INSERT INTO reports (
  reporter_id,
  title,
  description,
  category,
  location,
  address,
  is_anonymous,
  status,
  created_at
)
SELECT 
  u.id,
  'Wheelchair access blocked',
  'The entrance ramp for wheelchair access is blocked by parked bicycles',
  'Architectural Barriers',
  ST_GeogFromText('POINT(7.6850000 45.0680000)'),
  'Via Milano 8, 10123 Torino',
  true,
  'Pending Approval',
  CURRENT_TIMESTAMP - INTERVAL '1 day' AS created_at
FROM users u WHERE u.username = 'testcitizen';

-- Report 7: Suspended - Sewer System
INSERT INTO reports (
  reporter_id,
  title,
  description,
  category,
  location,
  address,
  is_anonymous,
  status,
  assignee_id,
  created_at
)
SELECT 
  citizen.id,
  'Sewer blockage',
  'The sewer is blocked causing bad smell and potential overflow',
  'Sewer System',
  ST_GeogFromText('POINT(7.6900000 45.0710000)'),
  'Via Nizza 30, 10126 Torino',
  false,
  'Suspended',
  staff.id,
  CURRENT_TIMESTAMP - INTERVAL '4 days' AS created_at
FROM users citizen, users staff 
WHERE citizen.username = 'testcitizen' 
  AND staff.username = 'teststaffmember';


-- ============================================
-- INSERT PHOTOS FOR TEST REPORTS
-- ============================================

-- Foto per Report 1
INSERT INTO photos (report_id, storage_url, created_at)
VALUES (1, '/uploads/reports/1/1.jpg', CURRENT_TIMESTAMP - INTERVAL '2 days');

-- Foto per Report 2
INSERT INTO photos (report_id, storage_url, created_at)
VALUES (2, '/uploads/reports/2/2.jpg', CURRENT_TIMESTAMP - INTERVAL '3 days');

-- Foto per Report 3
INSERT INTO photos (report_id, storage_url, created_at)
VALUES (3, '/uploads/reports/3/2_2.jpg', CURRENT_TIMESTAMP - INTERVAL '4 days');

-- Foto per Report 4
INSERT INTO photos (report_id, storage_url, created_at)
VALUES (4, '/uploads/reports/4/3.jpg', CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Foto per Report 5
INSERT INTO photos (report_id, storage_url, created_at)
VALUES (5, '/uploads/reports/5/4.jpg', CURRENT_TIMESTAMP - INTERVAL '6 days');

-- Foto per Report 6
INSERT INTO photos (report_id, storage_url, created_at)
VALUES (6, '/uploads/reports/6/5.jpg', CURRENT_TIMESTAMP - INTERVAL '1 day');


-- ============================================
-- VERIFY DATA (V5.0 Multi-Role)
-- ============================================

-- Display inserted test users with their roles
SELECT 
  u.id,
  u.username,
  u.email,
  u.first_name,
  u.last_name,
  STRING_AGG(DISTINCT r.name, ', ') AS roles,
  STRING_AGG(DISTINCT d.name, ', ') AS departments,
  u.email_notifications_enabled,
  c.name AS company_name,
  u.is_verified,
  u.created_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN department_roles dr ON ur.department_role_id = dr.id
LEFT JOIN roles r ON dr.role_id = r.id
LEFT JOIN departments d ON dr.department_id = d.id
LEFT JOIN companies c ON u.company_id = c.id
GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.email_notifications_enabled, c.name, u.is_verified, u.created_at
ORDER BY u.id ASC;

-- Display inserted test reports
SELECT 
  r.id,
  r.title,
  r.category,
  r.status,
  r.address,
  ST_AsText(r.location::geometry) AS location_text,
  r.is_anonymous,
  u.username AS reporter,
  a.username AS assignee,
  r.created_at
FROM reports r
JOIN users u ON r.reporter_id = u.id
LEFT JOIN users a ON r.assignee_id = a.id
ORDER BY r.created_at DESC;

-- Display inserted test photos
SELECT 
  p.id,
  p.report_id,
  r.title AS report_title,
  p.storage_url,
  p.created_at
FROM photos p
JOIN reports r ON p.report_id = r.id
ORDER BY p.report_id ASC;
