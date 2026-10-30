/**
 * ============================================================================
 * FILE: js/data.js - Data Layer & Persistence Vihara Amurwa Bhumi Cibinong
 * ============================================================================
 * DAFTAR INDEKS & GLOSARIUM SEKSI CEPAT (QUICK LOOKUP GLOSSARY):
 * Gunakan pencarian ID tag [INDEX: JS-DATA-XX] untuk langsung menuju baris kode terkait.
 * ----------------------------------------------------------------------------
 * [INDEX: JS-DATA-01] Konfigurasi, Skema Storage Keys & Versi Data
 * [INDEX: JS-DATA-02] Seed Data Awal & Inisialisasi Database Persisten (Local Storage)
 * [INDEX: JS-DATA-03] Manajemen Acara Kebaktian (Get, Create, Delete, Active Event)
 * [INDEX: JS-DATA-04] Manajemen Pengguna & Hak Akses (Umat, Pengurus Admin, Profil)
 * [INDEX: JS-DATA-05] Sistem Rekam Jejak Presensi Kehadiran Umat (Attendance Logs)
 * [INDEX: JS-DATA-06] Sistem Buku Tamu Digital (Guestbook Logs & Persistence)
 * [INDEX: JS-DATA-07] Manajemen Sesi Pengguna Aktif & Reset Database Sistem
 * ============================================================================
 */

/**
 * data.js - Data Layer & Persistence for Vihara Amurwa Bhumi Cibinong
 * Tanpa data dummy - Siap digunakan secara nyata di lapangan.
 */

const ViharaData = (() => {

  // ==========================================================================
  // [INDEX: JS-DATA-01] KONFIGURASI, SKEMA STORAGE KEYS & VERSI DATA
  // Fungsi: Kunci penyimpanan localStorage, versi skema, format tanggal, & nama vihara.
  // ==========================================================================
  const DATA_VERSION = 'v12.0_amurwa_db_sync_final';

  const STORAGE_KEYS = {
    VERSION: 'vihara_version',
    USERS: 'vihara_users',
    EVENTS: 'vihara_events',
    ATTENDANCE: 'vihara_attendance',
    GUESTS: 'vihara_guests',
    ANNOUNCEMENTS: 'vihara_announcements',
    SESSION: 'vihara_session',
    REMEMBER_ME: 'vihara_remember_me',
    CONFIG: 'vihara_config'
  };

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  function formatDateIndonesia(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // Konfigurasi Resmi
  const DEFAULT_CONFIG = {
    viharaName: 'Vihara Amurwa Bhumi Cibinong',
    address: 'Cibinong, Bogor, Jawa Barat'
  };

  // Akun Awal Pengurus/Admin Bawaan (Hanya 1 Akun Resmi Admin)
  const INITIAL_USERS = [
    {
      id: 'ADM_001',
      name: 'Pengurus Vihara Amurwa Bhumi',
      phone: '08119999888',
      email: 'admin@amurwabhumi.or.id',
      avatar: '',
      role: 'admin',
      registeredAt: getTodayKey()
    }
  ];

  // ==========================================================================
  // [INDEX: JS-DATA-02] SEED DATA AWAL & INISIALISASI DATABASE PERSISTEN
  // Fungsi: Migrasi versi data, inisialisasi akun pengurus bawaan, dan default config.
  // ==========================================================================
  function init() {
    const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (currentVersion !== DATA_VERSION) {
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.EVENTS);
      localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
      localStorage.removeItem(STORAGE_KEYS.GUESTS);
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      localStorage.removeItem('vihara_announcements_list');
      localStorage.removeItem('vihara_announcements');
      localStorage.removeItem('vihara_announcements_archive');
      localStorage.removeItem('vihara_notifications');
      // Bersihkan sesi aktif bawaan agar saat pertama kali membuka web wajib lewat halaman login
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.setItem(STORAGE_KEYS.VERSION, DATA_VERSION);
    }

    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    } else {
      // Pastikan semua user memiliki properti email dan avatar
      try {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        let modified = false;
        users.forEach(u => {
          if (u.email === undefined) { u.email = u.role === 'admin' ? 'admin@amurwabhumi.or.id' : ''; modified = true; }
          if (u.avatar === undefined) { u.avatar = ''; modified = true; }
        });
        if (modified) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
      } catch (e) {}
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.GUESTS)) {
      localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify([]));
    }
  }

  // ==========================================================================
  // [INDEX: JS-DATA-03] MANAJEMEN ACARA KEBAKTIAN (CRUD, AUTO-ARSIP & EVENT AKTIF)
  // Fungsi: Mendapatkan acara aktif, auto-arsip acara kedaluwarsa, buat, & hapus.
  // ==========================================================================
  function isEventExpired(evt) {
    if (!evt || !evt.date) return false;
    const timeStr = evt.endTime || '23:59';
    const parts = timeStr.split(':').map(Number);
    const endH = !isNaN(parts[0]) ? parts[0] : 23;
    const endM = !isNaN(parts[1]) ? parts[1] : 59;
    
    // Bandingkan waktu selesai acara dengan waktu saat ini (WIB / Local)
    const eventEnd = new Date(`${evt.date}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`);
    const now = new Date();
    return now > eventEnd;
  }

  function checkAndArchiveExpiredEvents() {
    init();
    const rawEvents = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
    let updated = false;

    rawEvents.forEach(evt => {
      // Jika acara sedang aktif namun waktunya sudah lewat, otomatis arsipkan
      if (evt.isActive && isEventExpired(evt)) {
        evt.isActive = false;
        evt.archived = true;
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(rawEvents));
    }
    return rawEvents;
  }

  function getEvents() {
    return checkAndArchiveExpiredEvents();
  }

  function getActiveEvent() {
    const events = getEvents();
    // Hanya ambil acara yang ditandai aktif DAN belum kedaluwarsa
    const active = events.find(e => e.isActive && !isEventExpired(e));
    return active || null;
  }

  // Menemukan acara yang sedang berlangsung berdasarkan jam saat ini
  function findEventForCurrentTime() {
    const events = getEvents();
    if (events.length === 0) return null;

    const today = getTodayKey();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // 1. Cek acara hari ini yang jam mulainya <= sekarang <= jam berakhir (+ 30 menit toleransi)
    const matched = events.find(e => {
      if (e.date !== today) return false;
      const [startH, startM] = (e.startTime || '09:00').split(':').map(Number);
      const [endH, endM] = (e.endTime || '11:00').split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM + 30; // 30 menit setelah selesai masih tercakup
      return currentMinutes >= (startMin - 30) && currentMinutes <= endMin;
    });

    if (matched) return matched;

    // 2. Fallback ke acara aktif yang belum expired
    return getActiveEvent();
  }

  function setActiveEvent(eventId) {
    const events = getEvents();
    events.forEach(e => {
      if (e.id === eventId) {
        e.isActive = true;
        e.archived = false;
        // Jika admin mengaktifkan kembali acara dari masa lampau, perbarui tanggal ke hari ini
        if (isEventExpired(e)) {
          e.date = getTodayKey();
          e.dateText = formatDateIndonesia(getTodayKey());
        }
      } else {
        e.isActive = false;
      }
    });
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    return getActiveEvent();
  }

  function createEvent({ name, date, startTime, endTime, speaker, speakerTitle, dhammasala }) {
    const events = getEvents();
    const newId = 'EVT_' + String(events.length + 1).padStart(3, '0');

    // Nonaktifkan acara lain
    events.forEach(e => { e.isActive = false; });

    const targetDate = date || getTodayKey();
    const targetEndTime = endTime || '11:00';
    const tempEvt = { date: targetDate, endTime: targetEndTime };
    const willBeActive = !isEventExpired(tempEvt);

    const newEvent = {
      id: newId,
      name: name.trim(),
      date: targetDate,
      dateText: formatDateIndonesia(targetDate),
      startTime: startTime || '09:00',
      endTime: targetEndTime,
      timeSchedule: `${startTime || '09:00'} - ${targetEndTime} WIB`,
      speaker: speaker.trim(),
      speakerTitle: speakerTitle || 'Bhikkhu / Romo',
      dhammasala: dhammasala ? dhammasala.trim() : 'Dhammasala Utama',
      isActive: willBeActive, // Otomatis aktif jika belum kedaluwarsa
      archived: !willBeActive,
      createdAt: new Date().toISOString()
    };

    events.unshift(newEvent);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.insertEvent === 'function') {
      ViharaSupabase.insertEvent(newEvent);
    }
    return newEvent;
  }

  function deleteEvent(eventId) {
    let events = getEvents();
    events = events.filter(e => e.id !== eventId);
    // Jika tidak ada acara aktif, jangan paksa acara kedaluwarsa jadi aktif
    const hasActiveUnexpired = events.some(e => e.isActive && !isEventExpired(e));
    if (!hasActiveUnexpired) {
      const firstValid = events.find(e => !isEventExpired(e));
      if (firstValid) firstValid.isActive = true;
    }
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.deleteEvent === 'function') {
      ViharaSupabase.deleteEvent(eventId);
    }
    return events;
  }

  // ==========================================================================
  // [INDEX: JS-DATA-04] MANAJEMEN PENGGUNA & HAK AKSES (UMAT, PENGURUS ADMIN)
  // Fungsi: Cari user via HP, registrasi, pembaruan data kontak/email, dan role RBAC.
  // ==========================================================================
  function getUsers() {
    init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  function findUserByPhone(phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const users = getUsers();
    return users.find(u => u.phone.replace(/[^0-9]/g, '') === cleanPhone);
  }

  function registerUser(name, phone, role = 'umat', email = '', avatar = '') {
    const users = getUsers();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanEmail = (email || '').trim().toLowerCase();
    const existing = users.find(u => u.phone.replace(/[^0-9]/g, '') === cleanPhone);
    if (existing) {
      if (cleanEmail && !existing.email) existing.email = cleanEmail;
      if (avatar && !existing.avatar) existing.avatar = avatar;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      // Sinkronisasi update ke database Supabase
      if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.insertProfile === 'function') {
        ViharaSupabase.insertProfile(existing).catch(err => console.warn('[Supabase] Gagal upsert user:', err));
      }
      return existing;
    }

    const prefix = role === 'admin' ? 'ADM_' : 'USR_';
    const newUser = {
      id: prefix + String(users.length + 1).padStart(3, '0'),
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      avatar: avatar || '',
      password_hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
      must_change_password: true,
      role: role,
      registeredAt: getTodayKey()
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Kirim langsung ke tabel profiles di database Supabase (Real-Time Cloud Persistence)
    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.insertProfile === 'function') {
      ViharaSupabase.insertProfile(newUser).then(saved => {
        if (saved && saved.id) {
          newUser.id = String(saved.id);
          const currentUsers = getUsers();
          const target = currentUsers.find(u => u.phone === cleanPhone);
          if (target) {
            target.id = String(saved.id);
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(currentUsers));
          }
          const session = getSession();
          if (session && session.phone === cleanPhone) {
            session.id = String(saved.id);
            setSession(session);
          }
        }
      }).catch(err => {
        console.warn('[Supabase] Warning saat simpan profil ke cloud:', err);
      });
    }

    return newUser;
  }

  function updateUserRole(userId, newRole) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    user.role = newRole;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Update active session jika user yang sedang login diubah
    const session = getSession();
    if (session && (session.id === userId || session.phone === user.phone)) {
      const isRem = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
      setSession({ ...session, role: newRole }, isRem);
    }

    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.updateProfile === 'function') {
      ViharaSupabase.updateProfile(user.id || user.phone, { role: newRole }).catch(err => {
        console.warn('[Supabase] Gagal update role profile:', err);
      });
    }
    return user;
  }

  function updateUser(userId, { name, phone, email, avatar, role, password_hash, must_change_password }) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.replace(/[^0-9]/g, '');
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (avatar !== undefined) user.avatar = avatar;
    if (role !== undefined) user.role = role;
    if (password_hash !== undefined) user.password_hash = password_hash;
    if (must_change_password !== undefined) user.must_change_password = must_change_password;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Update active session jika user yang sedang login diubah
    const session = getSession();
    if (session && (session.id === userId || session.phone === user.phone)) {
      const isRem = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
      setSession({ ...session, ...user }, isRem);
    }

    // Sinkronisasi pembaruan profil ke database Supabase
    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.updateProfile === 'function') {
      ViharaSupabase.updateProfile(user.id || user.phone, { name, phone, email, avatar, role, password_hash, must_change_password }).catch(err => {
        console.warn('[Supabase] Warning saat update profil di cloud:', err);
      });
    }

    return user;
  }

  function deleteUser(userId) {
    let users = getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return false;
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.deleteProfile === 'function') {
      ViharaSupabase.deleteProfile(target.id || target.phone).catch(err => {
        console.warn('[Supabase] Warning saat hapus user di cloud:', err);
      });
    }
    return true;
  }

  function clearAttendanceLogs() {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    return true;
  }

  function clearGuestLogs() {
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify([]));
    return true;
  }

  function resetAllData() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
    return true;
  }

  // ==========================================================================
  // [INDEX: JS-DATA-05] SISTEM REKAM JEJAK PRESENSI KEHADIRAN UMAT (ATTENDANCE LOGS)
  // Fungsi: Pengecekan status sudah check-in, penambahan log presensi mandiri / admin.
  // ==========================================================================
  function getAttendanceList() {
    init();
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
    // Deduplikasi otomatis: 1 umat hanya boleh tercatat 1 kali per acara kebaktian
    const seen = new Set();
    const deduped = [];
    raw.forEach(item => {
      const uKey = String(item.userId || item.userPhone || '');
      const eKey = String(item.eventId || item.dateKey || '');
      const combo = `${uKey}_${eKey}`;
      if (!seen.has(combo)) {
        seen.add(combo);
        deduped.push(item);
      }
    });
    if (deduped.length !== raw.length) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(deduped));
    }
    return deduped;
  }

  function isUserCheckedInEvent(userId, eventId) {
    if (!eventId || !userId) return false;
    const list = getAttendanceList();
    const targetUserId = String(userId);
    const targetEventId = String(eventId);
    return list.some(item => String(item.userId) === targetUserId && String(item.eventId) === targetEventId);
  }

  function isUserCheckedInActiveEvent(userId) {
    const activeEvent = getActiveEvent();
    if (!activeEvent) return false;
    return isUserCheckedInEvent(userId, activeEvent.id);
  }

  function addAttendanceRecord({ userId, userName, userPhone, eventId = null, method = 'mandiri' }) {
    const list = getAttendanceList();
    const events = getEvents();
    const targetEvent = eventId ? events.find(e => String(e.id) === String(eventId)) : getActiveEvent();
    const targetEventId = targetEvent ? targetEvent.id : 'EVT_001';

    // Cek pencegahan data double: jika user sudah tercatat hadir pada event ini, jangan masukkan duplikat
    const existing = list.find(item => 
      (String(item.userId) === String(userId) || (userPhone && item.userPhone === userPhone)) &&
      String(item.eventId) === String(targetEventId)
    );
    if (existing) {
      return existing;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    const record = {
      id: 'ATT_' + String(list.length + 1).padStart(3, '0'),
      userId: userId,
      userName: userName,
      userPhone: userPhone,
      category: 'umat',
      eventId: targetEventId,
      kebaktianName: targetEvent ? targetEvent.name : 'Puja Bakti Vihara Amurwa Bhumi',
      speaker: targetEvent ? targetEvent.speaker : '-',
      dateKey: targetEvent ? targetEvent.date : getTodayKey(),
      timeStr: timeStr,
      timestamp: now.toISOString(),
      method: method, // 'mandiri' | 'manual_admin'
      status: 'Hadir'
    };

    list.unshift(record);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.insertAttendance === 'function' && targetEvent) {
      ViharaSupabase.insertAttendance(targetEvent.id, userId, method === 'mandiri' ? 'self_checkin' : 'manual_admin');
    }
    return record;
  }

  // ==========================================================================
  // [INDEX: JS-DATA-06] SISTEM BUKU TAMU DIGITAL (GUESTBOOK LOGS & PERSISTENCE)
  // Fungsi: Riwayat tamu luar dan pencatatan kedatangan walk-in ke jadwal aktif.
  // ==========================================================================
  function getGuestList() {
    init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GUESTS) || '[]');
  }

  function addGuestRecord({ name, phone, domicile, purpose }) {
    const list = getGuestList();
    const targetEvent = findEventForCurrentTime();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    const record = {
      id: 'GST_' + String(list.length + 1).padStart(3, '0'),
      name: name.trim(),
      phone: phone.trim(),
      domicile: domicile.trim(),
      purpose: purpose || 'Puja Bakti Umum',
      eventId: targetEvent ? targetEvent.id : null,
      kebaktianName: targetEvent ? targetEvent.name : 'Kunjungan Vihara',
      speaker: targetEvent ? targetEvent.speaker : '-',
      dateKey: targetEvent ? targetEvent.date : getTodayKey(),
      timeStr: timeStr,
      timestamp: now.toISOString(),
      status: 'Hadir'
    };

    list.unshift(record);
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(list));
    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.insertGuest === 'function' && targetEvent) {
      ViharaSupabase.insertGuest(record);
    }
    return record;
  }

  // ==========================================================================
  // [INDEX: JS-DATA-07] MANAJEMEN SESI PENGGUNA AKTIF & RESET DATABASE SISTEM
  // Fungsi: Penyimpanan session aktif login, pembersihan log, dan reset pabrik data.
  // ==========================================================================
  function getSession() {
    // 1. Cek sesi aktif tab saat ini di sessionStorage
    const sessionRaw = sessionStorage.getItem(STORAGE_KEYS.SESSION);
    if (sessionRaw) {
      try { return JSON.parse(sessionRaw); } catch (e) {}
    }

    // 2. Cek sesi tersimpan di localStorage bila pengguna memilih 'Ingat Saya'
    const isRemembered = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
    if (isRemembered) {
      const localRaw = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (localRaw) {
        try { return JSON.parse(localRaw); } catch (e) {}
      }
    }

    return null;
  }

  function setSession(user, rememberMe = true) {
    if (user) {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
        sessionStorage.removeItem(STORAGE_KEYS.SESSION);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }

  return {
    init,
    getTodayKey,
    formatDateIndonesia,
    formatDateDisplay: formatDateIndonesia,
    getEvents,
    getActiveEvent,
    isEventExpired,
    checkAndArchiveExpiredEvents,
    findEventForCurrentTime,
    setActiveEvent,
    createEvent,
    deleteEvent,
    getUsers,
    findUserByPhone,
    registerUser,
    updateUserRole,
    updateUser,
    deleteUser,
    clearAttendanceLogs,
    clearGuestLogs,
    resetAllData,
    getAttendanceList,
    isUserCheckedInEvent,
    isUserCheckedInActiveEvent,
    addAttendanceRecord,
    getGuestList,
    addGuestRecord,
    getSession,
    setSession
  };
})();
