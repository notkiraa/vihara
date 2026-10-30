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

var ViharaAuth = (() => {

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
    return user.role === 'admin' || user.role === 'superadmin';
  }

  function isUmat() {
    return !isAdmin();
  }

  const DEFAULT_PASSWORD_PLAIN = '123456';
  const DEFAULT_PASSWORD_HASH = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
  let pendingFirstLoginUser = null;
  let pendingRememberMe = true;

  // ==========================================================================
  // HELPER HASHING SHA-256 (WEB CRYPTO STANDAR, HASIL SAMA PERSIS DENGAN PGCRYPTO)
  // ==========================================================================
  async function hashPassword(plainText) {
    if (!plainText) return '';
    try {
      const msgUint8 = new TextEncoder().encode(plainText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.error('Hashing error:', e);
      return '';
    }
  }

  async function verifyPassword(user, plainPassword) {
    if (!user || !plainPassword) return false;
    let storedHash = user.password_hash;
    if (!storedHash && user.phone && typeof ViharaData !== 'undefined' && typeof ViharaData.findUserByPhone === 'function') {
      const full = ViharaData.findUserByPhone(user.phone);
      if (full && full.password_hash) storedHash = full.password_hash;
    }
    if (!storedHash) storedHash = DEFAULT_PASSWORD_HASH;
    const inputHash = await hashPassword(plainPassword);
    return inputHash === storedHash;
  }

  function setPendingFirstLogin(user, rememberMe = true) {
    pendingFirstLoginUser = user;
    pendingRememberMe = rememberMe;
  }

  function getPendingFirstLogin() {
    return { user: pendingFirstLoginUser, rememberMe: pendingRememberMe };
  }

  function clearPendingFirstLogin() {
    pendingFirstLoginUser = null;
    pendingRememberMe = true;
  }

  // ==========================================================================
  // [INDEX: JS-AUTH-02] LOGIN PENGGUNA BERBASIS NOMOR TELEPON & KATA SANDI
  // Fungsi: Verifikasi nomor HP dan kecocokan hash password.
  // ==========================================================================
  async function loginWithCredentials(phone, password, rememberMe = true) {
    const user = ViharaData.findUserByPhone(phone);
    if (!user) {
      return {
        success: false,
        message: 'Nomor telepon belum terdaftar. Silakan hubungi pengurus vihara untuk pembuatan akun.'
      };
    }

    const isMatch = await verifyPassword(user, password);
    if (!isMatch) {
      return {
        success: false,
        message: 'Nomor telepon atau kata sandi tidak cocok. Silakan periksa kembali.'
      };
    }

    // Cek apakah wajib ganti kata sandi (login pertama atau masih menggunakan default)
    const isDefault = !user.password_hash || user.password_hash === DEFAULT_PASSWORD_HASH || user.must_change_password === true;
    if (isDefault) {
      setPendingFirstLogin(user, rememberMe);
      return {
        success: true,
        mustChangePassword: true,
        user: user
      };
    }

    ViharaData.setSession(user, rememberMe);
    return {
      success: true,
      mustChangePassword: false,
      user: user
    };
  }

  function loginWithPhone(phone, rememberMe = true) {
    console.warn('[ViharaAuth] loginWithPhone tanpa verifikasi sandi ditolak demi keamanan.');
    return {
      success: false,
      message: 'Demi keamanan akun Anda, silakan masuk menggunakan nomor telepon dan kata sandi.'
    };
  }

  // ==========================================================================
  // [INDEX: JS-AUTH-03] REGISTRASI AKUN BARU (UMAT TETAP & PENGURUS VIHARA)
  // Fungsi: Validasi input nama, nomor HP, email, role, dan penyimpanan user baru.
  // ==========================================================================
  function register({ name, phone, email, rememberMe = true }) {
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
      // Jika sudah ada, jangan bypass password, arahkan ke login
      return {
        success: false,
        message: 'Nomor telepon ini sudah terdaftar. Silakan masukkan kata sandi akun Anda untuk masuk.'
      };
    }

    const cleanName = name.trim();
    // Keamanan: Pendaftaran publik secara default dan ketat selalu bertaraf 'umat'.
    // Promosi role 'admin' hanya dapat dilakukan oleh Super Administrator via Portal Master Superadmin.
    const newUser = ViharaData.registerUser(cleanName, cleanPhone, 'umat', cleanEmail);
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
    DEFAULT_PASSWORD_PLAIN,
    DEFAULT_PASSWORD_HASH,
    currentUser,
    isLoggedIn,
    isAdmin,
    isUmat,
    hashPassword,
    verifyPassword,
    loginWithCredentials,
    loginWithPhone,
    setPendingFirstLogin,
    getPendingFirstLogin,
    clearPendingFirstLogin,
    register,
    logout,
    checkRouteAccess
  };
})();

if (typeof window !== 'undefined') {
  window.ViharaAuth = ViharaAuth;
}
if (typeof global !== 'undefined') {
  global.ViharaAuth = ViharaAuth;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ViharaAuth };
}
