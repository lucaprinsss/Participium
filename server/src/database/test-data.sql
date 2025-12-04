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

-- Test User 6: Technical Manager
-- Username: testtechmanager
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
  'testtechmanager',
  'testtechmanager@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Tech',
  'Manager',
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'Public Infrastructure and Accessibility Department' AND r.name = 'Technical Manager'),
  true,
  true,
  CURRENT_TIMESTAMP
);

-- Test User 7: Technical Assistant
-- Username: testtechasst
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
  'testtechasst',
  'testtechasst@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'Tech',
  'Assistant',
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'Public Infrastructure and Accessibility Department' AND r.name = 'Technical Assistant'),
  true,
  true,
  CURRENT_TIMESTAMP
);

-- Test User 8: Public Relations Officer
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
  'Public',
  'Relations',
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'Organization' AND r.name = 'Municipal Public Relations Officer'),
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
  department_role_id,
  email_notifications_enabled,
  is_verified,
  created_at
) VALUES (
  'testexternal',
  'testexternal@example.com',
  'e997619942c87f77eee0c8efbe26f0c2:c8bc8cce60ee1dbacbaed68218a1e341622a7a3591e3b1d9b8f432110d2dfc6f25b9b3868b5fbc30f8bd98f6e4341a344113491cd28602652ce91ba07ac45469',
  'External',
  'Maintainer',
  (SELECT dr.id FROM department_roles dr
   JOIN departments d ON dr.department_id = d.id
   JOIN roles r ON dr.role_id = r.id
   WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'),
  true,
  true,
  CURRENT_TIMESTAMP
);


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