-- ============================================
-- Test Data for E2E Testing - V4.2 (with email verification)
-- ============================================

-- Clear existing data (safety check)
TRUNCATE TABLE users CASCADE;

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
  department_role_id,
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testcitizen',
  'testcitizen@example.com',
  '06823ad32eca25e900d651552cbab5d3:5a565be83f11375d46478da34a525b902bd83974501f229db2baff163a5ab7a397ef440214f0558a1c120f511e7307547577151ca17ac10263d8ab521e8307eb',
  'Test',
  'Citizen',
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'Organization' AND r.name = 'Citizen'),
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
  department_role_id,
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testmunicipality',
  'testmunicipality@example.com',
  'a8157c4cbabc7231d0c471354393d547:86e29403471520224daaec377dfc9c814141708e551957077843fa26cb7a4eabc0da62e82ef6cc204e304da61c12131bbba843319193e275bb79c74ac5cca442',
  'Test',
  'Municipality',
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'Public Infrastructure and Accessibility Department' AND r.name = 'Department Director'),
  true,
  true,  -- Test users are pre-verified
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
  department_role_id,
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testadmin',
  'testadmin@example.com',
  '8fe97f776b7ee432bc26b59685766dde:0a98fd0c723f3ea46e8216ea964d35502e423f7e030329027876931fc26325f0557ae2f6701f8f179fcdf1bbdb44897654e2a7cffb5e87c0d100094b791c3e83',
  'Test',
  'Admin',
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'Organization' AND r.name = 'Administrator'),
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
  department_role_id,
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testuser_nonotif',
  'nonotif@example.com',
  '4c2c3c54743456758e61a087dd614843:f6058f47f69fe0ee4c617bb96d79209727e1f41905f841bb39271ea295bb90294809bddac0651b065f1082d512bc045009a3246220e3b3105606dbf7e3d9e5e7',
  'No',
  'Notifications',
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'Organization' AND r.name = 'Citizen'),
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
  department_role_id,
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'teststaffmember',
  'teststaffmember@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Test',
  'StaffMember',
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'Water and Sewer Services Department' AND r.name = 'Water Network staff member'),
  true,
  true,
  CURRENT_TIMESTAMP
);

-- Username: testroadstaff
-- Password: StaffPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  department_role_id,
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testroadstaff',
  'testroadstaff@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Test',
  'RoadStaff',
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'Public Infrastructure and Accessibility Department' AND r.name = 'Road Maintenance staff member'),
  true,
  true,
  CURRENT_TIMESTAMP
);

-- Username: testsewerstaff
-- Password: StaffPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  department_role_id,
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testsewerstaff',
  'testsewerstaff@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Test',
  'SewerStaff',
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'Water and Sewer Services Department' AND r.name = 'Sewer System staff member'),
  true,
  true,
  CURRENT_TIMESTAMP
);

-- Username: testpro
-- Password: StaffPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  department_role_id,
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testpro',
  'testpro@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Test',
  'PRO',
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'Organization' AND r.name = 'Municipal Public Relations Officer'),
  true,
  true,
  CURRENT_TIMESTAMP
);

-- Username: testexternal
-- Password: StaffPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  department_role_id,
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testexternal',
  'testexternal@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Test',
  'External',
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
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
  department_role_id,
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
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
  (SELECT id FROM companies WHERE name = 'Lighting Solutions SRL'),
  true,
  true,
  CURRENT_TIMESTAMP
);

-- External Maintainer 3: Waste
-- Username: testexternal3
-- Password: StaffPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  department_role_id,
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
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
  (SELECT id FROM companies WHERE name = 'EcoWaste Management'),
  true,
  true,
  CURRENT_TIMESTAMP
);

-- External Maintainer 4: Roads and Urban Furnishings
-- Username: testexternal4
-- Password: StaffPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  department_role_id,
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
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
  (SELECT id FROM companies WHERE name = 'Road Repair Co.'),
  true,
  true,
  CURRENT_TIMESTAMP
);


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
  CURRENT_TIMESTAMP - INTERVAL '2 days'
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
  CURRENT_TIMESTAMP - INTERVAL '3 days'
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
  CURRENT_TIMESTAMP - INTERVAL '5 days'
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
  CURRENT_TIMESTAMP - INTERVAL '7 days'
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
  CURRENT_TIMESTAMP - INTERVAL '10 days'
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
  CURRENT_TIMESTAMP - INTERVAL '1 day'
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
  CURRENT_TIMESTAMP - INTERVAL '4 days'
FROM users citizen, users staff 
WHERE citizen.username = 'testcitizen' 
  AND staff.username = 'teststaffmember';


-- ============================================
-- VERIFY DATA
-- ============================================

-- Display inserted test users (excluding password hash and verification code)
SELECT 
  u.id,
  u.username,
  u.email,
  u.first_name,
  u.last_name,
  r.name AS role_name,
  d.name AS department_name,
  u.email_notifications_enabled,
  u.company_name,
  u.is_verified,
  CASE 
    WHEN u.verification_code IS NOT NULL THEN 'HAS_CODE'
    ELSE NULL
  END AS verification_status,
  CASE 
    WHEN u.verification_code_expires_at IS NOT NULL THEN 
      CASE 
        WHEN u.verification_code_expires_at > CURRENT_TIMESTAMP THEN 'VALID'
        ELSE 'EXPIRED'
      END
    ELSE NULL
  END AS code_validity,
  u.created_at
FROM users u
JOIN department_roles dr ON u.department_role_id = dr.id
JOIN roles r ON dr.role_id = r.id
JOIN departments d ON dr.department_id = d.id
ORDER BY u.id;

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