-- ============================================================================
-- SKRIP RESET & MIGRASI SEMUA TABEL KE AUTO-INCREMENT (1, 2, 3...)
-- Jalankan skrip ini langsung di Supabase SQL Editor:
-- 1. Buka dashboard Supabase (https://supabase.com/dashboard)
-- 2. Pilih menu "SQL Editor" di bilah kiri
-- 3. Klik "New Query", paste skrip ini, lalu klik tombol hijau "Run"
-- ============================================================================

-- A. Hapus tabel lama dengan aman (CASCADE untuk membersihkan relasi foreign key)
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.guests CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- B. Buat ENUM jika belum ada
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
-- C. BUAT TABEL BARU DENGAN AUTO-INCREMENT IDENTITY (1, 2, 3, 4...)
-- ============================================================================

-- 1. TABEL PROFILES (ID Auto-increment: 1, 2, 3...)
CREATE TABLE public.profiles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    role user_role NOT NULL DEFAULT 'umat',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABEL EVENTS (ID Auto-increment: 1, 2, 3...)
CREATE TABLE public.events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    speaker TEXT NOT NULL,
    speaker_title speaker_type NOT NULL DEFAULT 'Bhikkhu Sangha',
    dhammasala TEXT DEFAULT 'Dhammasala Utama' NOT NULL,
    is_active BOOLEAN DEFAULT false NOT NULL,
    created_by BIGINT REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL ATTENDANCE (ID Auto-increment: 1, 2, 3...)
CREATE TABLE public.attendance (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    method attendance_method DEFAULT 'manual_admin' NOT NULL,
    checkin_time TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_attendance_user_per_event UNIQUE (event_id, user_id)
);

-- 4. TABEL GUESTS (ID Auto-increment: 1, 2, 3...)
CREATE TABLE public.guests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    purpose TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL ANNOUNCEMENTS (ID Auto-increment: 1, 2, 3...)
CREATE TABLE public.announcements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category announcement_category NOT NULL DEFAULT 'Kegiatan Kebaktian',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    banner_url TEXT,
    is_published BOOLEAN DEFAULT true NOT NULL,
    created_by BIGINT REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. AKTIFKAN RLS (ROW LEVEL SECURITY)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- E. POLICIES SUPABASE AKSES FLEKSIBEL (WEB APP + ADMIN)
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "profiles_insert_all" ON public.profiles FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "profiles_update_all" ON public.profiles FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "events_select_all" ON public.events FOR SELECT TO public USING (true);
CREATE POLICY "events_insert_all" ON public.events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "events_update_all" ON public.events FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "events_delete_all" ON public.events FOR DELETE TO public USING (true);

CREATE POLICY "attendance_select_all" ON public.attendance FOR SELECT TO public USING (true);
CREATE POLICY "attendance_insert_all" ON public.attendance FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "guests_select_all" ON public.guests FOR SELECT TO public USING (true);
CREATE POLICY "guests_insert_all" ON public.guests FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "announcements_select_all" ON public.announcements FOR SELECT TO public USING (true);
CREATE POLICY "announcements_insert_all" ON public.announcements FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "announcements_update_all" ON public.announcements FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "announcements_delete_all" ON public.announcements FOR DELETE TO public USING (true);

-- F. DATA AWAL BERSIH: HANYA 1 AKUN PENGURUS/ADMIN RESMI (ID: 1)
INSERT INTO public.profiles (name, phone, email, role)
VALUES ('Pengurus Vihara Amurwa Bhumi', '08119999888', 'admin@amurwabhumi.or.id', 'admin');

-- Verifikasi hasil
SELECT 'Sukses! Semua tabel berhasil dibuat dengan ID Auto-Increment.' as status;
