-- ============================================================================
-- MIGRATION: PENAMBAHAN PASSWORD HASH & GANTI PASSWORD PERTAMA KALI
-- Platform: Supabase SQL Editor (PostgreSQL)
-- Vihara Amurwa Bhumi Cibinong
-- ============================================================================

-- 1. Pastikan ekstensi pgcrypto aktif untuk enkripsi hash
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tambahkan kolom password_hash dan must_change_password ke tabel profiles
-- Password default adalah '123456' yang di-hash dengan SHA-256
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT encode(digest('123456', 'sha256'), 'hex'),
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true NOT NULL;

-- 3. Update data seluruh akun yang sudah ada agar memiliki password default '123456'
-- dan status wajib ganti password (must_change_password = true)
UPDATE public.profiles
SET 
  password_hash = encode(digest('123456', 'sha256'), 'hex'),
  must_change_password = true
WHERE password_hash IS NULL;

-- 4. Tambahkan konfigurasi password default ke tabel configurations
INSERT INTO public.configurations (key, value, description)
VALUES ('default_user_password', '123456', 'Kata Sandi Default Akun Umat Baru (Wajib diganti saat login pertama)')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description;
