-- ============================================================================
-- SCRIPT: supabase/batch_insert_users.sql
-- Batch Input Data Umat Langsung di Supabase SQL Editor
-- Vihara Amurwa Bhumi Cibinong
-- ============================================================================
-- Format ID akan otomatis terisi berurutan (USR_001, USR_002, dst.)
-- Jika nomor HP sudah ada, data nama & email akan otomatis diperbarui (Anti Duplikasi).
-- ============================================================================

INSERT INTO public.profiles (name, phone, email, role)
VALUES
  ('Budi Santoso', '081211112222', 'budi@gmail.com', 'umat'),
  ('Suryani Wijaya', '081233334444', 'suryani@gmail.com', 'umat'),
  ('Hendrik Pratama', '081255556666', 'hendrik@gmail.com', 'umat'),
  ('Vincen Tan', '081277778888', 'vincen@amurwabhumi.or.id', 'admin'),
  ('Meilani Chen', '081299990000', 'meilani@gmail.com', 'umat')
ON CONFLICT (phone) DO UPDATE
SET 
  name = EXCLUDED.name,
  email = COALESCE(EXCLUDED.email, profiles.email),
  role = EXCLUDED.role;
