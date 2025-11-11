-- ============================================
-- Test Data for E2E Testing
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
  role,
  email_notifications_enabled,
  created_at
) VALUES (
  'testcitizen',
  'testcitizen@example.com',
  '06823ad32eca25e900d651552cbab5d3:5a565be83f11375d46478da34a525b902bd83974501f229db2baff163a5ab7a397ef440214f0558a1c120f511e7307547577151ca17ac10263d8ab521e8307eb',
  'Test',
  'Citizen',
  'Citizen',
  true,
  CURRENT_TIMESTAMP
);

-- Test User 2: Municipality User
-- Username: testmunicipality
-- Password: MuniPass123!
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  role,
  email_notifications_enabled,
  created_at
) VALUES (
  'testmunicipality',
  'testmunicipality@example.com',
  'a8157c4cbabc7231d0c471354393d547:86e29403471520224daaec377dfc9c814141708e551957077843fa26cb7a4eabc0da62e82ef6cc204e304da61c12131bbba843319193e275bb79c74ac5cca442',
  'Test',
  'Municipality',
  'Municipal Administrator',
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
  role,
  email_notifications_enabled,
  created_at
) VALUES (
  'testadmin',
  'testadmin@example.com',
  '8fe97f776b7ee432bc26b59685766dde:0a98fd0c723f3ea46e8216ea964d35502e423f7e030329027876931fc26325f0557ae2f6701f8f179fcdf1bbdb44897654e2a7cffb5e87c0d100094b791c3e83',
  'Test',
  'Admin',
  'Administrator',
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
  role,
  email_notifications_enabled,
  created_at
) VALUES (
  'testuser_nonotif',
  'nonotif@example.com',
  '4c2c3c54743456758e61a087dd614843:f6058f47f69fe0ee4c617bb96d79209727e1f41905f841bb39271ea295bb90294809bddac0651b065f1082d512bc045009a3246220e3b3105606dbf7e3d9e5e7',
  'No',
  'Notifications',
  'Citizen',
  false,
  CURRENT_TIMESTAMP
);


-- ============================================
-- VERIFY DATA
-- ============================================

-- Display inserted test users (excluding password hash)
SELECT 
  id,
  username,
  email,
  first_name,
  last_name,
  role,
  email_notifications_enabled,
  created_at
FROM users
ORDER BY id;