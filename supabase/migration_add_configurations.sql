-- ============================================================================
-- MIGRATION: PEMBUATAN TABEL CONFIGURATIONS & KUNCI MASTER SUPER ADMIN
-- Platform: Supabase SQL Editor (PostgreSQL)
-- Vihara Amurwa Bhumi Cibinong
-- ============================================================================

-- 1. Sequence generator ID otomatis CFG_001, CFG_002, dst.
CREATE SEQUENCE IF NOT EXISTS seq_configurations START 1;

-- 2. Buat tabel configurations
CREATE TABLE IF NOT EXISTS public.configurations (
    id TEXT PRIMARY KEY DEFAULT ('CFG_' || LPAD(nextval('seq_configurations')::text, 3, '0')),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Index pencarian cepat berdasarkan key
CREATE INDEX IF NOT EXISTS idx_configurations_key ON public.configurations(key);

-- 4. Trigger auto-update timestamp updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_configurations_updated_at ON public.configurations;
CREATE TRIGGER tr_configurations_updated_at
    BEFORE UPDATE ON public.configurations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Aktifkan Row Level Security (RLS)
ALTER TABLE public.configurations ENABLE ROW LEVEL SECURITY;

-- 6. Kebijakan RLS (Izin Baca & Izin Update)
DROP POLICY IF EXISTS "Konfigurasi dapat dibaca oleh publik & sistem" ON public.configurations;
CREATE POLICY "Konfigurasi dapat dibaca oleh publik & sistem"
    ON public.configurations FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Konfigurasi dapat diperbarui oleh sistem" ON public.configurations;
CREATE POLICY "Konfigurasi dapat diperbarui oleh sistem"
    ON public.configurations FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 7. Seed Kunci Rahasia / PIN Master Super Administrator Pertama
-- Anda dapat mengganti nilai '9999' dengan PIN rahasia pilihan Anda kapan saja!
INSERT INTO public.configurations (id, key, value, description)
VALUES ('CFG_001', 'superadmin_pin', '9999', 'PIN Rahasia Master untuk Akses Vault Super Administrator')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description;

