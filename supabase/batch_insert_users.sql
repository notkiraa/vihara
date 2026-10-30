-- ============================================================================
-- SCRIPT: supabase/batch_insert_users.sql
-- Batch Input Data Umat Langsung di Supabase SQL Editor
-- Vihara Amurwa Bhumi Cibinong
-- ============================================================================
-- Catatan:
-- 1. Format ID otomatis terisi berurutan (USR_001, USR_002, dst.)
-- 2. Kata sandi otomatis diset ke default '123456' (dalam format HASH SHA-256)
-- 3. Pengguna akan otomatis diminta membuat kata sandi baru saat login pertama
-- 4. Jika nomor HP sudah ada, data nama & email diperbarui tanpa duplikasi
-- ============================================================================

INSERT INTO public.profiles (name, phone, email, role, password_hash, must_change_password)
VALUES
  ('Budi Santoso', '081211112222', 'budi@gmail.com', 'umat', encode(digest('123456', 'sha256'), 'hex'), true),
  ('Suryani Wijaya', '081233334444', 'suryani@gmail.com', 'umat', encode(digest('123456', 'sha256'), 'hex'), true),
  ('Hendrik Pratama', '081255556666', 'hendrik@gmail.com', 'umat', encode(digest('123456', 'sha256'), 'hex'), true),
  ('Vincen Tan', '081277778888', 'vincen@amurwabhumi.or.id', 'admin', encode(digest('123456', 'sha256'), 'hex'), true),
  ('Meilani Chen', '081299990000', 'meilani@gmail.com', 'umat', encode(digest('123456', 'sha256'), 'hex'), true)
ON CONFLICT (phone) DO UPDATE
SET 
  name = EXCLUDED.name,
  email = COALESCE(EXCLUDED.email, profiles.email),
  role = EXCLUDED.role;
