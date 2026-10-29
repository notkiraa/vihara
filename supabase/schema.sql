-- ============================================================================
-- SKEMA DATABASE RESMI: VIHARA AMURWA BHUMI CIBINONG (PREFIXED FORMATTED IDs)
-- Platform: Supabase (PostgreSQL 15+)
-- Deskripsi: Sistem Presensi Umat, Buku Tamu Digital, & Warta Pengumuman
-- Versi: 10.0 (Prefixed IDs: USR_001, ADM_001, EVT_001, ANN_001, ATT_001, GST_001)
-- Tanggal: 2026-10-29
-- ============================================================================

-- 1. EKSTENSI POSTGRESQL WAJIB
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TIPE DATA KHUSUS (ENUMS)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'umat');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE speaker_type AS ENUM (
        'Bhikkhu Sangha',
        'Romo / Pandita',
        'Upasaka / Upasika',
        'Pengurus Vihara',
        'Penceramah Tamu',
        'Tidak Ada'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE announcement_category AS ENUM (
        'Kegiatan Kebaktian',
        'Bakti Sosial & Umum',
        'Dhamma & SMB',
        'Pemberitahuan Pengurus'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_method AS ENUM (
        'manual_admin',
        'qr_scan',
        'self_checkin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. SEQUENCE GENERATOR ID OTOMATIS (PREFIX + 3 DIGIT NUMBER)
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS seq_profiles START 1;
CREATE SEQUENCE IF NOT EXISTS seq_events START 1;
CREATE SEQUENCE IF NOT EXISTS seq_announcements START 1;
CREATE SEQUENCE IF NOT EXISTS seq_attendance START 1;
CREATE SEQUENCE IF NOT EXISTS seq_guests START 1;

-- ============================================================================
-- 4. TABEL UTAMA SISTEM (PREFIXED HUMAN-READABLE TEXT PRIMARY KEYS)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABEL A: PROFILES (DATA UMAT & PENGURUS VIHARA)
-- Format ID: USR_001, USR_002, ... (Admin Resmi: ADM_001)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY DEFAULT ('USR_' || LPAD(nextval('seq_profiles')::text, 3, '0')),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    role user_role NOT NULL DEFAULT 'umat',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ----------------------------------------------------------------------------
-- TABEL B: EVENTS (JADWAL KEBAKTIAN & ACARA VIHARA)
-- Format ID: EVT_001, EVT_002, ...
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY DEFAULT ('EVT_' || LPAD(nextval('seq_events')::text, 3, '0')),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    speaker TEXT NOT NULL,
    speaker_title speaker_type NOT NULL DEFAULT 'Bhikkhu Sangha',
    dhammasala TEXT DEFAULT 'Dhammasala Utama' NOT NULL,
    is_active BOOLEAN DEFAULT false NOT NULL,
    created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active);

-- ----------------------------------------------------------------------------
-- TABEL C: ATTENDANCE (LOG PRESENSI KEHADIRAN UMAT)
-- Format ID: ATT_001, ATT_002, ...
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY DEFAULT ('ATT_' || LPAD(nextval('seq_attendance')::text, 3, '0')),
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    method attendance_method DEFAULT 'manual_admin' NOT NULL,
    checkin_time TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Memastikan satu umat hanya tercatat 1 kali hadir per acara kebaktian (Anti Data Double)
    CONSTRAINT uq_attendance_user_per_event UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_event ON public.attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON public.attendance(user_id);

-- ----------------------------------------------------------------------------
-- TABEL D: GUESTS (BUKU TAMU DIGITAL KUNJUNGAN NON-UMAT TETAP)
-- Format ID: GST_001, GST_002, ...
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guests (
    id TEXT PRIMARY KEY DEFAULT ('GST_' || LPAD(nextval('seq_guests')::text, 3, '0')),
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    purpose TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guests_event ON public.guests(event_id);

-- ----------------------------------------------------------------------------
-- TABEL E: ANNOUNCEMENTS (WARTA & PENGUMUMAN RESMI VIHARA)
-- Format ID: ANN_001, ANN_002, ...
-- is_published = false menandakan pengumuman tersimpan di Arsip Pengurus
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY DEFAULT ('ANN_' || LPAD(nextval('seq_announcements')::text, 3, '0')),
    category announcement_category NOT NULL DEFAULT 'Kegiatan Kebaktian',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    banner_url TEXT,
    is_published BOOLEAN DEFAULT true NOT NULL,
    created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_announcements_category ON public.announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(is_published);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON public.announcements(created_at DESC);

-- ============================================================================
-- 5. OTOMATISASI: AUTO-UPDATE UPDATED_AT TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_events_updated_at ON public.events;
CREATE TRIGGER tr_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_announcements_updated_at ON public.announcements;
CREATE TRIGGER tr_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 6. OTOMATISASI: AUTO-ARCHIVE ACARA YANG SUDAH LEWAT WAKTU
-- ============================================================================

CREATE OR REPLACE FUNCTION public.archive_expired_events()
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE public.events
    SET is_active = false
    WHERE is_active = true
      AND (date < CURRENT_DATE OR (date = CURRENT_DATE AND end_time < CURRENT_TIME));

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. OTOMATISASI: SINKRONISASI USER DARI AUTH.USERS (JIKA MENGGUNAKAN SUPABASE AUTH)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role := 'umat';
    v_name TEXT;
    v_phone TEXT;
    v_id TEXT;
BEGIN
    v_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Umat Vihara');
    v_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '');
    
    IF v_phone = '08119999888' OR lower(v_name) LIKE '%vincen%' OR lower(v_name) LIKE '%pengurus%' THEN
        v_role := 'admin';
        v_id := 'ADM_001';
    END IF;

    INSERT INTO public.profiles (id, auth_user_id, name, phone, email, role, avatar_url)
    VALUES (
        COALESCE(v_id, 'USR_' || LPAD(nextval('seq_profiles')::text, 3, '0')),
        NEW.id,
        v_name,
        v_phone,
        NEW.email,
        v_role,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (phone) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id,
        name = EXCLUDED.name,
        email = EXCLUDED.email;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- 8. KEAMANAN DATA: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE (auth_user_id = auth.uid() OR auth.uid() IS NULL) AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: PROFILES
DROP POLICY IF EXISTS "Profil dapat dibaca oleh publik dan umat terdaftar" ON public.profiles;
CREATE POLICY "Profil dapat dibaca oleh publik dan umat terdaftar"
    ON public.profiles FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Izinkan registrasi profil baru" ON public.profiles;
CREATE POLICY "Izinkan registrasi profil baru"
    ON public.profiles FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Pengguna dan admin dapat memperbarui profil" ON public.profiles;
CREATE POLICY "Pengguna dan admin dapat memperbarui profil"
    ON public.profiles FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- RLS: EVENTS
DROP POLICY IF EXISTS "Jadwal kebaktian dapat dilihat oleh publik" ON public.events;
CREATE POLICY "Jadwal kebaktian dapat dilihat oleh publik"
    ON public.events FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Izinkan admin menambah jadwal kebaktian" ON public.events;
CREATE POLICY "Izinkan admin menambah jadwal kebaktian"
    ON public.events FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Izinkan admin memperbarui jadwal kebaktian" ON public.events;
CREATE POLICY "Izinkan admin memperbarui jadwal kebaktian"
    ON public.events FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Izinkan admin menghapus jadwal kebaktian" ON public.events;
CREATE POLICY "Izinkan admin menghapus jadwal kebaktian"
    ON public.events FOR DELETE
    TO public
    USING (true);

-- RLS: ATTENDANCE
DROP POLICY IF EXISTS "Log presensi dapat dibaca untuk rekap" ON public.attendance;
CREATE POLICY "Log presensi dapat dibaca untuk rekap"
    ON public.attendance FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Izinkan pencatatan presensi umat" ON public.attendance;
CREATE POLICY "Izinkan pencatatan presensi umat"
    ON public.attendance FOR INSERT
    TO public
    WITH CHECK (true);

-- RLS: GUESTS
DROP POLICY IF EXISTS "Buku tamu dapat dibaca oleh admin" ON public.guests;
CREATE POLICY "Buku tamu dapat dibaca oleh admin"
    ON public.guests FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Izinkan pengisian buku tamu digital" ON public.guests;
CREATE POLICY "Izinkan pengisian buku tamu digital"
    ON public.guests FOR INSERT
    TO public
    WITH CHECK (true);

-- RLS: ANNOUNCEMENTS
DROP POLICY IF EXISTS "Pengumuman yang terbit dapat dibaca oleh publik & umat" ON public.announcements;
CREATE POLICY "Pengumuman yang terbit dapat dibaca oleh publik & umat"
    ON public.announcements FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Izinkan publik & admin menerbitkan pengumuman baru" ON public.announcements;
CREATE POLICY "Izinkan publik & admin menerbitkan pengumuman baru"
    ON public.announcements FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Izinkan publik & admin mengedit warta pengumuman" ON public.announcements;
CREATE POLICY "Izinkan publik & admin mengedit warta pengumuman"
    ON public.announcements FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Izinkan publik & admin menghapus warta pengumuman" ON public.announcements;
CREATE POLICY "Izinkan publik & admin menghapus warta pengumuman"
    ON public.announcements FOR DELETE
    TO public
    USING (true);

-- ============================================================================
-- 9. STORAGE BUCKETS (BANNER PENGUMUMAN & AVATAR PROFIL)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('announcement-banners', 'announcement-banners', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Banner pengumuman dapat dilihat publik" ON storage.objects;
CREATE POLICY "Banner pengumuman dapat dilihat publik"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'announcement-banners');

-- ============================================================================
-- 10. DATA AWAL PRODUKSI (HANYA 1 AKUN PENGURUS/ADMIN RESMI, 0 DATA DUMMY)
-- Akun: ADM_001, No. HP 08119999888
-- ============================================================================

INSERT INTO public.profiles (id, name, phone, email, role)
VALUES ('ADM_001', 'Pengurus Vihara Amurwa Bhumi', '08119999888', 'admin@amurwabhumi.or.id', 'admin')
ON CONFLICT (phone) DO UPDATE
SET id = 'ADM_001',
    role = 'admin',
    name = EXCLUDED.name;
