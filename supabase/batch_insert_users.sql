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

INSERT INTO public.profiles (name, phone, email, gender, tempat_lahir, tanggal_lahir, alamat, role, password_hash, must_change_password)
VALUES
  ('Budi Santoso', '081211112222', 'budi@gmail.com', 'Laki-laki', 'Bogor', '1990-05-12', 'Jl. Mayor Oking No. 12, Cibinong', 'umat', encode(digest('123456', 'sha256'), 'hex'), true),
  ('Suryani Wijaya', '081233334444', 'suryani@gmail.com', 'Perempuan', 'Jakarta', '1992-08-20', 'Jl. Raya Jakarta-Bogor KM 43, Cibinong', 'umat', encode(digest('123456', 'sha256'), 'hex'), true),
  ('Hendrik Pratama', '081255556666', 'hendrik@gmail.com', 'Laki-laki', 'Depok', '1988-11-04', 'Ciriung, Cibinong, Bogor', 'umat', encode(digest('123456', 'sha256'), 'hex'), true),
  ('Vincen Tan', '081277778888', 'vincen@amurwabhumi.or.id', 'Laki-laki', 'Bogor', '1995-02-14', 'Cibinong, Bogor, Jawa Barat', 'admin', encode(digest('123456', 'sha256'), 'hex'), true),
  ('Meilani Chen', '081299990000', 'meilani@gmail.com', 'Perempuan', 'Bandung', '1996-07-25', 'Pabuaran, Cibinong, Bogor', 'umat', encode(digest('123456', 'sha256'), 'hex'), true)
ON CONFLICT (phone) DO UPDATE
SET 
  name = EXCLUDED.name,
  email = COALESCE(EXCLUDED.email, profiles.email),
  gender = COALESCE(EXCLUDED.gender, profiles.gender),
  tempat_lahir = COALESCE(EXCLUDED.tempat_lahir, profiles.tempat_lahir),
  tanggal_lahir = COALESCE(EXCLUDED.tanggal_lahir, profiles.tanggal_lahir),
  alamat = COALESCE(EXCLUDED.alamat, profiles.alamat),
  role = EXCLUDED.role;
