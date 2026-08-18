-- Ensure email SMTP settings rows exist in SystemSetting.
-- Uses INSERT IGNORE so re-running is safe; existing values are NOT overwritten.

INSERT IGNORE INTO `SystemSetting` (`id`, `key`, `value`, `group`, `label`, `hint`, `isSecret`, `updatedAt`)
VALUES
  (CONCAT('set_', SUBSTRING(MD5('email_host'), 1, 24)),         'email_host',         NULL,  'email', 'SMTP Host',             'Server SMTP untuk kirim email. Contoh: mail.domain.com atau smtp.gmail.com',                                            0, NOW()),
  (CONCAT('set_', SUBSTRING(MD5('email_port'), 1, 24)),         'email_port',         '465', 'email', 'SMTP Port',             'Port SMTP. Gunakan 465 untuk SSL, 587 untuk TLS/STARTTLS, atau 25 (tidak direkomendasikan)',                           0, NOW()),
  (CONCAT('set_', SUBSTRING(MD5('email_secure'), 1, 24)),       'email_secure',       'true','email', 'Gunakan SSL/TLS',       'true = koneksi SSL langsung (port 465). false = STARTTLS atau plain (port 587/25)',                                    0, NOW()),
  (CONCAT('set_', SUBSTRING(MD5('email_user'), 1, 24)),         'email_user',         NULL,  'email', 'Username SMTP',         'Alamat email atau username akun SMTP yang digunakan untuk autentikasi',                                                0, NOW()),
  (CONCAT('set_', SUBSTRING(MD5('email_pass'), 1, 24)),         'email_pass',         NULL,  'email', 'Password SMTP',         'Password atau App Password untuk akun SMTP. Untuk Gmail: buat App Password di Google Account → Security',              1, NOW()),
  (CONCAT('set_', SUBSTRING(MD5('email_from_name'), 1, 24)),    'email_from_name',    NULL,  'email', 'Nama Pengirim',         'Nama yang tampil di inbox penerima sebagai pengirim. Contoh: HAGE CLUB',                                               0, NOW()),
  (CONCAT('set_', SUBSTRING(MD5('email_from_address'), 1, 24)), 'email_from_address', NULL,  'email', 'Alamat Email Pengirim', 'Alamat email yang tampil sebagai pengirim (From). Harus sama atau alias dari Username SMTP',                           0, NOW());
