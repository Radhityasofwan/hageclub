-- Rewrite stored upload URLs: /uploads/ → /api/uploads/.
-- File upload runtime tidak disajikan static layer hosting (404); mulai sekarang
-- dilayani route Next.js /api/uploads/[...path] dari filesystem app
-- (UPLOAD_DIR persisten, atau public/uploads bila UPLOAD_DIR tidak diset).

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

-- Semua batch hero upload runtime (file sementara di direktori build yang sudah
-- dibersihkan hosting) adalah gambar yang sama dengan versi git-tracked
-- (UUID sumber sama); arahkan ke file tracked agar tampil tanpa upload ulang.
UPDATE `Media`
SET url = REPLACE(url,
  '1787038176186-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg', '1786100069165-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg')
WHERE url LIKE '%1787038176186-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg%';
UPDATE `Media`
SET url = REPLACE(url,
  '1787038190583-e91043d1-85c0-43a5-a9d0-1d029e179a94.jpg', '1786100063920-e91043d1-85c0-43a5-a9d0-1d029e179a94.jpg')
WHERE url LIKE '%1787038190583-e91043d1-85c0-43a5-a9d0-1d029e179a94.jpg%';
UPDATE `Media`
SET url = REPLACE(url,
  '1787039584127-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg', '1786100069165-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg')
WHERE url LIKE '%1787039584127-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg%';
UPDATE `Media`
SET url = REPLACE(url,
  '1787039603279-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg', '1786100069165-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg')
WHERE url LIKE '%1787039603279-042e4696-ab7e-4a4b-92c6-9f8192c9c524.jpg%';
UPDATE `Media`
SET url = REPLACE(url,
  '1787039612820-e91043d1-85c0-43a5-a9d0-1d029e179a94.jpg', '1786100063920-e91043d1-85c0-43a5-a9d0-1d029e179a94.jpg')
WHERE url LIKE '%1787039612820-e91043d1-85c0-43a5-a9d0-1d029e179a94.jpg%';
