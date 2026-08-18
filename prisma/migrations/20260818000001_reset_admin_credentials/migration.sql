-- Reset admin credentials for support@hageclub.com
UPDATE `User`
SET
  passwordHash = '$2a$12$A3riJF7wvWL2Ae4uQOpS/.1O5Hm.prQsARDYmy5fel8W92.ItJdfu',
  emailVerified = 1,
  updatedAt     = NOW()
WHERE email = 'support@hageclub.com' AND role = 'ADMIN';

-- Create Profile for admin if not exists
INSERT INTO `Profile` (id, userId, firstName, lastName, createdAt, updatedAt)
SELECT
  CONCAT('prof_', SUBSTRING(MD5('support@hageclub.com'), 1, 24)),
  u.id,
  'Admin',
  'HAGE CLUB',
  NOW(),
  NOW()
FROM `User` u
WHERE u.email = 'support@hageclub.com'
  AND NOT EXISTS (SELECT 1 FROM `Profile` p WHERE p.userId = u.id);
