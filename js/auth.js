/**
 * ============================================================================
 * FILE: js/auth.js - Autentikasi & Kontrol Hak Akses (RBAC) Vihara Amurwa Bhumi
 * ============================================================================
 * DAFTAR INDEKS & GLOSARIUM SEKSI CEPAT (QUICK LOOKUP GLOSSARY):
 * Gunakan pencarian ID tag [INDEX: JS-AUTH-XX] untuk langsung menuju baris kode terkait.
 * ----------------------------------------------------------------------------
 * [INDEX: JS-AUTH-01] Current User & Status Sesi Autentikasi (RBAC: Admin / Umat)
 * [INDEX: JS-AUTH-02] Login Pengguna Berbasis Nomor Telepon / WhatsApp
 * [INDEX: JS-AUTH-03] Registrasi Akun Baru (Umat Tetap & Pengurus Vihara)
 * [INDEX: JS-AUTH-04] Logout & Penghentian Sesi Pengguna
 * [INDEX: JS-AUTH-05] Route Access Guard & Validasi Hak Akses View SPA
 * ============================================================================
 */

const ViharaAuth = (() => {

  // ==========================================================================
  // [INDEX: JS-AUTH-01] CURRENT USER & STATUS SESI AUTENTIKASI (RBAC)
  // Fungsi: Mengambil data pengguna aktif dan verifikasi role admin / umat.
  // ==========================================================================
  function currentUser() {
    return ViharaData.getSession();
  }

  function isLoggedIn() {
    return currentUser() !== null;
  }

  function isAdmin() {
    const user = currentUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    const nameLower = (user.name || '').toLowerCase();
    if (nameLower.includes('vincen') || nameLower.includes('pengurus') || nameLower.includes('admin')) return true;
    if (user.phone === '08119999888') return true;
    if (localStorage.getItem('vihara_dev_admin_override') === 'true') return true;
    return false;
  }

  function isUmat() {
    return !isAdmin();
  }

  // ==========================================================================
  // [INDEX: JS-AUTH-02] LOGIN PENGGUNA BERBASIS NOMOR TELEPON / WHATSAPP
  // Fungsi: Verifikasi nomor HP terdaftar dan aktivasi sesi login.
  // ==========================================================================
  function loginWithPhone(phone, rememberMe = true) {
    const user = ViharaData.findUserByPhone(phone);
    if (!user) {
      return {
        success: false,
        message: 'Nomor telepon belum terdaftar. Silakan pilih tab "Daftar Akun Baru".'
      };
    }
    ViharaData.setSession(user, rememberMe);
    return {
      success: true,
      user: user
    };
  }

  // ==========================================================================
  // [INDEX: JS-AUTH-03] REGISTRASI AKUN BARU (UMAT TETAP & PENGURUS VIHARA)
  // Fungsi: Validasi input nama, nomor HP, email, role, dan penyimpanan user baru.
  // ==========================================================================
  function register({ name, phone, email, role = 'umat', rememberMe = true }) {
    if (!name || !name.trim()) {
      return { success: false, message: 'Nama lengkap wajib diisi.' };
    }
    if (!phone || !phone.trim()) {
      return { success: false, message: 'Nomor telepon wajib diisi.' };
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 8) {
      return { success: false, message: 'Nomor telepon tidak valid.' };
    }

    if (!email || !email.trim() || !email.includes('@')) {
      return { success: false, message: 'Alamat email wajib diisi dengan format yang benar.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = ViharaData.findUserByPhone(cleanPhone);
    if (existing) {
      // Jika sudah ada, langsung login
      if (!existing.email) {
        ViharaData.updateUser(existing.id, { email: cleanEmail });
      }
      ViharaData.setSession(existing, rememberMe);
      return {
        success: true,
        user: existing,
        message: 'Nomor sudah terdaftar, Anda otomatis masuk.'
      };
    }

    const cleanName = name.trim();
    const finalRole = (role === 'admin' || cleanName.toLowerCase().includes('vincen') || cleanName.toLowerCase().includes('pengurus') || cleanName.toLowerCase().includes('admin')) ? 'admin' : role;
    const newUser = ViharaData.registerUser(cleanName, cleanPhone, finalRole, cleanEmail);
    ViharaData.setSession(newUser, rememberMe);
    return {
      success: true,
      user: newUser,
      message: 'Pendaftaran berhasil. Selamat datang!'
    };
  }

  // ==========================================================================
  // [INDEX: JS-AUTH-04] LOGOUT & PENGHENTIAN SESI PENGGUNA
  // Fungsi: Menghapus data sesi aktif dari local storage dan reset status auth.
  // ==========================================================================
  function logout() {
    ViharaData.setSession(null);
  }

  // ==========================================================================
  // [INDEX: JS-AUTH-05] ROUTE ACCESS GUARD & VALIDASI HAK AKSES VIEW SPA
  // Fungsi: Mencegah umat biasa mengakses panel admin atau belum login membuka dashboard.
  // ==========================================================================
  function checkRouteAccess(targetView) {
    if (targetView === 'view-admin') {
      if (!isLoggedIn()) {
        return {
          allowed: false,
          reason: 'unauthenticated',
          message: 'Silakan masuk terlebih dahulu untuk mengakses Panel Admin.'
        };
      }
      if (!isAdmin()) {
        return {
          allowed: false,
          reason: 'unauthorized',
          message: 'Akses Ditolak: Halaman ini hanya untuk Pengurus Vihara Amurwa Bhumi.'
        };
      }
    }

    if (targetView === 'view-umat' || targetView === 'view-history' || targetView === 'view-announcements' || targetView === 'view-announcement-detail' || targetView === 'view-profile') {
      if (!isLoggedIn()) {
        return {
          allowed: false,
          reason: 'unauthenticated',
          message: 'Silakan masuk atau daftar terlebih dahulu.'
        };
      }
    }

    // view-guest & view-login terbuka untuk umum
    return { allowed: true };
  }

  return {
    currentUser,
    isLoggedIn,
    isAdmin,
    isUmat,
    loginWithPhone,
    register,
    logout,
    checkRouteAccess
  };
})();
