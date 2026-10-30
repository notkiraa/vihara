-- ============================================================================
-- MIGRATION: PENAMBAHAN PASSWORD HASH & GANTI PASSWORD PERTAMA KALI (SOLUSI FIX)
-- Platform: Supabase SQL Editor (PostgreSQL)
-- Vihara Amurwa Bhumi Cibinong
-- ============================================================================

-- 1. Sinkronkan sequence penghitung nomor CFG_ agar otomatis lompat ke nomor berikutnya
SELECT setval('seq_configurations', COALESCE((
    SELECT MAX(SUBSTRING(id FROM 5)::integer) 
    FROM public.configurations 
    WHERE id ~ '^CFG_[0-9]+$'
), 0));

-- 2. Pastikan ekstensi pgcrypto aktif untuk enkripsi hash
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. Tambahkan kolom password_hash dan must_change_password ke tabel profiles
-- Password default adalah '123456' yang di-hash dengan SHA-256
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT encode(digest('123456', 'sha256'), 'hex'),
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true NOT NULL;

-- 4. Update data seluruh akun yang sudah ada agar memiliki password default '123456'
-- dan status wajib ganti password (must_change_password = true)
UPDATE public.profiles
SET 
  password_hash = encode(digest('123456', 'sha256'), 'hex'),
  must_change_password = true
WHERE password_hash IS NULL;

-- 5. Tambahkan konfigurasi password default (ID otomatis lanjut ke CFG_002 tanpa bentrok)
INSERT INTO public.configurations (id, key, value, description)
VALUES (
  ('CFG_' || LPAD((nextval('seq_configurations'))::text, 3, '0')),
  'default_user_password',
  '123456',
  'Kata Sandi Default Akun Umat Baru (Wajib diganti saat login pertama)'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description;


