-- ============================================================================
-- SKRIP MIGRASI LENGKAP (GABUNGAN: BIODATA UMAT & SECURITY HARDENING)
-- Platform: Supabase SQL Editor (PostgreSQL 15+)
-- Proyek: Vihara Amurwa Bhumi Cibinong
-- ============================================================================
-- Petunjuk:
-- 1. Buka dashboard Supabase (https://supabase.com/dashboard)
-- 2. Pilih project Vihara Amurwa Bhumi Cibinong
-- 3. Masuk ke menu "SQL Editor" di bilah navigasi kiri
-- 4. Buka "New query", paste seluruh kode di bawah ini, lalu klik "Run"
-- ============================================================================

-- ----------------------------------------------------------------------------
-- BAGIAN 1: PENAMBAHAN KOLOM BIODATA UMAT (GENDER, TTL, ALAMAT)
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS alamat TEXT,
ADD COLUMN IF NOT EXISTS tempat_lahir TEXT,
ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;

-- Index pencarian & filter cepat
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_tempat_lahir ON public.profiles(tempat_lahir);

-- Dokumentasi keterangan kolom
COMMENT ON COLUMN public.profiles.gender IS 'Jenis Kelamin Umat (Laki-laki / Perempuan)';
COMMENT ON COLUMN public.profiles.alamat IS 'Alamat domisili lengkap umat';
COMMENT ON COLUMN public.profiles.tempat_lahir IS 'Kota / tempat lahir umat';
COMMENT ON COLUMN public.profiles.tanggal_lahir IS 'Tanggal lahir umat (YYYY-MM-DD)';


-- ----------------------------------------------------------------------------
-- BAGIAN 2: ISOLASI RLS KUNCI PIN MASTER SUPER ADMIN
-- ----------------------------------------------------------------------------

-- Menghapus policy lama dan membuat policy baru yang menyembunyikan superadmin_pin dari select publik
DROP POLICY IF EXISTS "Konfigurasi dapat dibaca oleh publik & sistem" ON public.configurations;
DROP POLICY IF EXISTS "Konfigurasi dapat dibaca publik" ON public.configurations;

CREATE POLICY "Konfigurasi dapat dibaca publik"
ON public.configurations FOR SELECT
TO public, anon, authenticated
USING (key != 'superadmin_pin');


-- ----------------------------------------------------------------------------
-- BAGIAN 3: RPC VERIFIKASI & PEMBARUAN PIN MASTER (SECURITY DEFINER)
-- ----------------------------------------------------------------------------

-- 3a. Fungsi Verifikasi PIN Super Admin (Zero-Leakage: Nilai PIN tidak pernah dikirim ke browser)
CREATE OR REPLACE FUNCTION public.verify_master_pin(p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actual_pin TEXT;
BEGIN
    IF p_pin IS NULL OR length(trim(p_pin)) < 4 THEN
        RETURN false;
    END IF;

    SELECT value INTO v_actual_pin
    FROM public.configurations
    WHERE key = 'superadmin_pin'
    LIMIT 1;

    IF v_actual_pin IS NULL THEN
        RETURN false;
    END IF;

    -- Mendukung pengecekan plaintext maupun hash SHA-256
    IF trim(v_actual_pin) = trim(p_pin) OR v_actual_pin = encode(digest(trim(p_pin), 'sha256'), 'hex') THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

-- 3b. Fungsi Ubah PIN Master secara Terproteksi (Wajib verifikasi PIN lama)
CREATE OR REPLACE FUNCTION public.update_master_pin(p_old_pin TEXT, p_new_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.verify_master_pin(p_old_pin) THEN
        RETURN false;
    END IF;

    IF p_new_pin IS NULL OR length(trim(p_new_pin)) < 4 THEN
        RETURN false;
    END IF;

    UPDATE public.configurations
    SET value = trim(p_new_pin),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE key = 'superadmin_pin';

    IF NOT FOUND THEN
        INSERT INTO public.configurations (key, value, description)
        VALUES ('superadmin_pin', trim(p_new_pin), 'PIN Rahasia Master Vault Super Administrator');
    END IF;

    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_master_pin(TEXT) TO public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_master_pin(TEXT, TEXT) TO public, anon, authenticated;


-- ----------------------------------------------------------------------------
-- BAGIAN 4: TRIGGER PENCEGAH ESKALASI HAK AKSES ADMIN DARI KLIEN ANONIM
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Jika role diubah menjadi admin dari role non-admin
    IF NEW.role = 'admin' AND COALESCE(OLD.role, 'umat') != 'admin' THEN
        -- Cegah elevasi jika pemanggil adalah anonim / tanpa token auth admin
        IF current_setting('request.jwt.claim.role', true) = 'anon' 
           OR current_setting('request.jwt.claim.role', true) IS NULL 
           OR auth.role() IS NULL 
           OR auth.role() = 'anon' THEN
            NEW.role := 'umat';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
BEFORE INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_escalation();
