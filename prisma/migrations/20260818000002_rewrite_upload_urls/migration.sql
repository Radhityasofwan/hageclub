-- Rewrite stored upload URLs: /uploads/ → /api/uploads/.
-- File upload runtime tidak disajikan static layer hosting (404); mulai sekarang
-- dilayani route Next.js /api/uploads/[...path] dari filesystem app.

UPDATE `Media` SET url = REPLACE(url, '/uploads/', '/api/uploads/') WHERE url LIKE '%/uploads/%';
UPDATE `ProductImage` SET url = REPLACE(url, '/uploads/', '/api/uploads/') WHERE url LIKE '%/uploads/%';
UPDATE `Product` SET sizeGuideImageUrl = REPLACE(sizeGuideImageUrl, '/uploads/', '/api/uploads/') WHERE sizeGuideImageUrl LIKE '%/uploads/%';
UPDATE `OrderItem` SET imageUrl = REPLACE(imageUrl, '/uploads/', '/api/uploads/') WHERE imageUrl LIKE '%/uploads/%';
UPDATE `BlogPost` SET featuredImage = REPLACE(featuredImage, '/uploads/', '/api/uploads/') WHERE featuredImage LIKE '%/uploads/%';
UPDATE `BlogPost` SET content = REPLACE(content, '/uploads/', '/api/uploads/') WHERE content LIKE '%/uploads/%';
UPDATE `CmsPage` SET image = REPLACE(image, '/uploads/', '/api/uploads/') WHERE image LIKE '%/uploads/%';
UPDATE `CmsPage` SET content = REPLACE(content, '/uploads/', '/api/uploads/') WHERE content LIKE '%/uploads/%';
UPDATE `SeoSetting` SET ogImage = REPLACE(ogImage, '/uploads/', '/api/uploads/') WHERE ogImage LIKE '%/uploads/%';
UPDATE `SystemSetting` SET value = REPLACE(value, '/uploads/', '/api/uploads/') WHERE value LIKE '%/uploads/%';
-- Assignment string → kolom JSON di-coerce MySQL otomatis (valid di 5.7+/8.x)
UPDATE `HomepageSection`
SET content = REPLACE(CAST(content AS CHAR), '/uploads/', '/api/uploads/')
WHERE content LIKE '%/uploads/%';

-- Hero yang di-upload ulang hari ini (runtime-only, ikut hilang saat deploy
-- berikutnya) adalah file yang sama dengan versi git-tracked (UUID sumber sama);
-- arahkan kembali agar hero langsung tampil tanpa perlu upload ulang.
UPDATE `HomepageSection`
SET content = REPLACE(REPLACE(CAST(content AS CHAR),
  '1787038176186-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg', '1786100069165-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg'),
  '1787038190583-e91043d1-85c0-43a5-a9d0-1d029e179a94.jpg', '1786100063920-e91043d1-85c0-43a5-a9d0-1d029e179a94.jpg')
WHERE content LIKE '%1787038176186-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg%'
   OR content LIKE '%1787038190583-e91043d1-85c0-43a5-a9d0-1d029e179a94.jpg%';

UPDATE `Media`
SET url = REPLACE(url,
  '1787038176186-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg', '1786100069165-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg')
WHERE url LIKE '%1787038176186-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg%';
UPDATE `Media`
SET url = REPLACE(url,
  '1787038190583-e91043d1-85c0-43a5-a9d0-1d029e179a94.jpg', '1786100063920-e91043d1-85c0-43a5-a9d0-1d029e179a94.jpg')
WHERE url LIKE '%1787038190583-e91043d1-85c0-43a5-a9d0-1d029e179a94.jpg%';
