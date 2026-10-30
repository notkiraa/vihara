/**
 * ============================================================================
 * FILE: js/superadmin.js - Portal Master Super Admin Vihara Amurwa Bhumi
 * ============================================================================
 * DAFTAR INDEKS & GLOSARIUM SEKSI CEPAT (QUICK LOOKUP GLOSSARY):
 * Gunakan pencarian ID tag [INDEX: JS-SUPER-XX] untuk langsung menuju baris kode terkait.
 * ----------------------------------------------------------------------------
 * [INDEX: JS-SUPER-01] Autentikasi Super Admin & Verifikasi Kunci PIN Rahasia Database
 * [INDEX: JS-SUPER-02] Dashboard & Agregasi Metrik Statistik Keseluruhan Vihara
 * [INDEX: JS-SUPER-03] Tabel Master Pengguna, Pencarian Real-Time & Filter Role
 * [INDEX: JS-SUPER-04] Tambah Pengguna Baru & Edit Profil Umat (Nama, Telepon, Email)
 * [INDEX: JS-SUPER-05] Hapus Pengguna Permanen dengan Modal Konfirmasi Aman
 * [INDEX: JS-SUPER-06] Ekspor Master Data CSV, Pembersihan Log & Utilitas Modal
 * ============================================================================
 */

/**
 * superadmin.js - Portal Master Super Admin
 * Vihara Amurwa Bhumi Cibinong
 * Manajemen Hak Akses Pengurus/Admin, Hapus Umat, & Master Data
 */

document.addEventListener('DOMContentLoaded', () => {
  ViharaData.init();

  // Sinkronisasi data multi-device langsung dari Supabase
  if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.initSync === 'function') {
    ViharaSupabase.initSync().then(() => {
      if (isSuperAdminAuth()) {
        renderDashboard();
      }
    });
  }

  const SUPERADMIN_SESSION_KEY = 'vihara_superadmin_auth_v5';

  let currentFilterRole = 'all'; // 'all' | 'umat' | 'admin'
  let currentSearchQuery = '';
  let pendingDeleteUserId = null;

  // Elemen DOM
  const gateSection = document.getElementById('super-gate-section');
  const mainSection = document.getElementById('super-main-section');
  const gatePinInput = document.getElementById('super-gate-pin');

  // ==========================================================================
  // [INDEX: JS-SUPER-01] AUTENTIKASI SUPER ADMIN & VERIFIKASI KUNCI PIN DATABASE
  // Fungsi: Pengecekan status login, submit PIN dinamis dari Supabase, dan logout.
  // ==========================================================================
  function isSuperAdminAuth() {
    return sessionStorage.getItem(SUPERADMIN_SESSION_KEY) === 'true';
  }

  function checkAuthState() {
    if (isSuperAdminAuth()) {
      if (gateSection) gateSection.style.display = 'none';
      if (mainSection) mainSection.style.display = 'block';
      renderDashboard();
    } else {
      if (gateSection) gateSection.style.display = 'block';
      if (mainSection) mainSection.style.display = 'none';
      if (gatePinInput) gatePinInput.value = '';
    }
  }

  window.handleSuperAdminLogin = async function(e) {
    if (e) e.preventDefault();
    const pin = (gatePinInput ? gatePinInput.value : '').trim();

    if (!pin) {
      showToast('Harap masukkan PIN Master Super Admin!', 'warning');
      return;
    }

    const loginBtn = document.getElementById('btn-super-login');
    const originalBtnHtml = loginBtn ? loginBtn.innerHTML : '';
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        <span>Memverifikasi Database...</span>
      `;
    }

    try {
      let isVerified = false;
      let dbPin = null;

      // Ambil PIN Master secara aman langsung dari tabel configurations di Supabase
      if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.getConfiguration === 'function') {
        dbPin = await ViharaSupabase.getConfiguration('superadmin_pin');
      }

      if (dbPin !== null && dbPin !== undefined) {
        isVerified = (pin === String(dbPin).trim());
      } else {
        // Jika tabel belum di-create di Supabase atau offline
        showToast('Gagal memverifikasi: Tabel "configurations" belum dibuat di Supabase atau jaringan offline.', 'error');
        return;
      }

      if (isVerified) {
        sessionStorage.setItem(SUPERADMIN_SESSION_KEY, 'true');
        showToast('Akses Super Administrator berhasil diverifikasi.', 'success');
        checkAuthState();
      } else {
        showToast('Kunci Rahasia / PIN Super Admin salah atau tidak sesuai!', 'error');
        if (gatePinInput) {
          gatePinInput.focus();
          gatePinInput.select();
        }
      }
    } catch (err) {
      console.error('Error verifikasi superadmin PIN:', err);
      showToast('Terjadi kesalahan saat verifikasi database.', 'error');
    } finally {
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalBtnHtml;
      }
    }
  };

  window.handleSuperAdminLogout = function() {
    sessionStorage.removeItem(SUPERADMIN_SESSION_KEY);
    showToast('Sesi Super Admin telah diakhiri.', 'warning');
    checkAuthState();
  };

  // ==========================================================================
  // MANAJEMEN PIN MASTER SUPER ADMIN (SIMPAN KE SUPABASE CONFIGURATIONS)
  // ==========================================================================
  window.openChangePinModal = function() {
    const newPinInput = document.getElementById('modal-new-pin');
    const confirmPinInput = document.getElementById('modal-confirm-pin');
    if (newPinInput) newPinInput.value = '';
    if (confirmPinInput) confirmPinInput.value = '';
    openModal('modal-change-pin');
    if (newPinInput) setTimeout(() => newPinInput.focus(), 150);
  };

  window.handleChangeMasterPinSubmit = async function(e) {
    if (e) e.preventDefault();
    const newPin = (document.getElementById('modal-new-pin') ? document.getElementById('modal-new-pin').value : '').trim();
    const confirmPin = (document.getElementById('modal-confirm-pin') ? document.getElementById('modal-confirm-pin').value : '').trim();

    if (!newPin || newPin.length < 4) {
      showToast('PIN Master baru harus minimal 4 karakter!', 'warning');
      return;
    }
    if (newPin !== confirmPin) {
      showToast('Konfirmasi PIN tidak cocok dengan PIN baru!', 'error');
      return;
    }

    const saveBtn = document.getElementById('btn-save-new-pin');
    const originalText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerText = 'Menyimpan ke Supabase...';
    }

    try {
      if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.updateConfiguration === 'function') {
        const success = await ViharaSupabase.updateConfiguration(
          'superadmin_pin',
          newPin,
          'PIN Rahasia Master untuk Akses Vault Super Administrator'
        );
        if (success) {
          showToast('PIN Master Super Admin berhasil diperbarui di Supabase!', 'success');
          closeModal('modal-change-pin');
        } else {
          showToast('Gagal memperbarui PIN di Supabase. Periksa schema atau koneksi.', 'error');
        }
      } else {
        showToast('Koneksi Supabase belum siap.', 'error');
      }
    } catch (err) {
      console.error('Error saat simpan PIN master:', err);
      showToast('Terjadi kesalahan saat memperbarui PIN ke Supabase.', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
      }
    }
  };

  // ==========================================================================
  // MANAJEMEN GEOLOCATION & RADIUS PRESENSI VIHARA (GEOFENCE)
  // ==========================================================================
  window.openGeoConfigModal = function() {
    if (typeof ViharaGeo === 'undefined') {
      showToast('Modul Geolocation belum siap.', 'warning');
      return;
    }

    const config = ViharaGeo.getConfig();
    const latInput = document.getElementById('modal-geo-lat');
    const lngInput = document.getElementById('modal-geo-lng');
    const radiusInput = document.getElementById('modal-geo-radius');

    if (latInput) latInput.value = config.latitude;
    if (lngInput) lngInput.value = config.longitude;
    if (radiusInput) radiusInput.value = config.radiusMeters || 25;

    openModal('modal-geo-config');
  };

  window.handleAutoCalibrateGeo = async function() {
    const btn = document.getElementById('btn-auto-calibrate-geo');
    const originalText = btn ? btn.innerText : '';
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Mendeteksi GPS...';
    }

    try {
      if (typeof ViharaGeo === 'undefined') throw new Error('Modul Geolocation tidak tersedia.');
      const pos = await ViharaGeo.getCurrentPosition();
      const latInput = document.getElementById('modal-geo-lat');
      const lngInput = document.getElementById('modal-geo-lng');
      if (latInput) latInput.value = pos.latitude;
      if (lngInput) lngInput.value = pos.longitude;
      showToast(`Lokasi GPS berhasil diambil! Akurasi: ±${pos.accuracy}m`, 'success');
    } catch (err) {
      showToast(err.message || 'Gagal membaca GPS perangkat.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = originalText;
      }
    }
  };

  window.handleSaveGeoConfig = async function(e) {
    if (e) e.preventDefault();
    const lat = parseFloat(document.getElementById('modal-geo-lat').value);
    const lng = parseFloat(document.getElementById('modal-geo-lng').value);
    const radius = parseInt(document.getElementById('modal-geo-radius').value, 10);

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      showToast('Harap masukkan nilai latitude, longitude, dan radius yang valid!', 'warning');
      return;
    }

    if (lat < -90 || lat > 90) {
      showToast('Nilai Latitude harus berada di antara -90 dan 90 derajat!', 'warning');
      return;
    }

    if (lng < -180 || lng > 180) {
      showToast('Nilai Longitude harus berada di antara -180 dan 180 derajat!', 'warning');
      return;
    }

    const saveBtn = document.getElementById('btn-save-geo-config');
    if (saveBtn) saveBtn.disabled = true;

    try {
      await ViharaGeo.saveConfig({ latitude: lat, longitude: lng, radiusMeters: radius });
      showToast('Konfigurasi Geolocation Vihara berhasil disimpan!', 'success');
      closeModal('modal-geo-config');
    } catch (err) {
      showToast('Gagal menyimpan konfigurasi: ' + err.message, 'error');
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  };

  // ==========================================================================
  // [INDEX: JS-SUPER-02] DASHBOARD & AGREGASI METRIK STATISTIK KESELURUHAN VIHARA
  // Fungsi: Perhitungan total umat, admin, presensi tercatat, dan jadwal kebaktian.
  // ==========================================================================
  function renderDashboard() {
    const allUsers = ViharaData.getUsers();
    const attendance = ViharaData.getAttendanceList();
    const events = ViharaData.getEvents();

    const umatCount = allUsers.filter(u => u.role === 'umat').length;
    const adminCount = allUsers.filter(u => u.role === 'admin').length;

    // Update KPI
    const statUmat = document.getElementById('super-stat-umat');
    const statAdmin = document.getElementById('super-stat-admin');
    const statPresensi = document.getElementById('super-stat-presensi');
    const statAcara = document.getElementById('super-stat-acara');

    if (statUmat) statUmat.innerText = umatCount;
    if (statAdmin) statAdmin.innerText = adminCount;
    if (statPresensi) statPresensi.innerText = attendance.length;
    if (statAcara) statAcara.innerText = events.length;

    renderUsersList();
  }

  // ==========================================================================
  // [INDEX: JS-SUPER-03] TABEL MASTER PENGGUNA, PENCARIAN REAL-TIME & FILTER ROLE
  // Fungsi: Render baris tabel pengguna desktop & kartu mobile dengan link WhatsApp.
  // ==========================================================================
  function renderUsersList() {
    const allUsers = ViharaData.getUsers();
    const q = currentSearchQuery.toLowerCase().trim();

    // Filter
    const filtered = allUsers.filter(user => {
      // Role filter
      if (currentFilterRole !== 'all' && user.role !== currentFilterRole) {
        return false;
      }
      // Query search
      if (!q) return true;
      const matchName = (user.name || '').toLowerCase().includes(q);
      const matchPhone = (user.phone || '').includes(q);
      const matchEmail = (user.email || '').toLowerCase().includes(q);
      const matchId = (user.id || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail || matchId;
    });

    const tbody = document.getElementById('super-users-tbody');
    const mobileList = document.getElementById('super-users-mobile-list');

    if (tbody) tbody.innerHTML = '';
    if (mobileList) mobileList.innerHTML = '';

    if (filtered.length === 0) {
      const emptyMsg = `<div style="text-align: center; padding: 2.5rem; color: var(--color-text-subtle);">Tidak ada pengguna yang cocok dengan kriteria pencarian.</div>`;
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2.5rem; color: var(--color-text-subtle);">Tidak ada pengguna yang cocok.</td></tr>`;
      }
      if (mobileList) mobileList.innerHTML = emptyMsg;
      return;
    }

    filtered.forEach((user, index) => {
      const isAdmin = user.role === 'admin';
      const initials = getInitials(user.name);
      const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');
      const waLink = cleanPhone ? `https://wa.me/62${cleanPhone.replace(/^0/, '')}` : '#';

      // 1. Tampilan Desktop Table Row
      if (tbody) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div class="user-cell">
              <div class="user-avatar-circle ${user.role}">
                ${user.avatar ? `<img src="${user.avatar}" alt="${escapeHTML(user.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : initials}
              </div>
              <div>
                <div class="user-name-title">${escapeHTML(user.name)}</div>
                <div class="user-id-sub">
                  ID: ${escapeHTML(user.id)} &bull; 
                  <span style="display:inline-flex; align-items:center; gap:3px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>${escapeHTML(user.email || '(tanpa email)')}</span>
                  </span>
                </div>
              </div>
            </div>
          </td>
          <td>
            <a href="${waLink}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary); font-weight: 600; text-decoration: none; display:inline-flex; align-items:center; gap:5px;" title="Kirim Pesan WhatsApp">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>${escapeHTML(user.phone)}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </a>
          </td>
          <td>
            <span class="role-badge-pill ${user.role}" style="display:inline-flex; align-items:center; gap:5px;">
              ${isAdmin ? `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Pengurus / Admin</span>
              ` : `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Umat Tetap</span>
              `}
            </span>
          </td>
          <td style="color: var(--color-text-subtle); font-size: 0.8rem;">
            ${escapeHTML(user.registeredAt || '-')}
          </td>
          <td>
            <div class="actions-cell">
              ${isAdmin ? `
                <button onclick="handleToggleRole('${user.id}', 'umat')" class="btn btn-secondary btn-sm" title="Ubah menjadi Umat biasa" style="display:inline-flex; align-items:center; gap:5px;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>Jadikan Umat</span>
                </button>
              ` : `
                <button onclick="handleToggleRole('${user.id}', 'admin')" class="btn btn-gold btn-sm" title="Promosikan menjadi Pengurus / Admin" style="display:inline-flex; align-items:center; gap:5px;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z"/>
                  </svg>
                  <span>Jadikan Admin</span>
                </button>
              `}
              <button onclick="openEditUserModal('${user.id}')" class="btn-action-icon" title="Edit Data Pengguna">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
              <button onclick="openDeleteUserModal('${user.id}')" class="btn-action-icon danger" title="Hapus Pengguna">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      }

      // 2. Tampilan Mobile Card
      if (mobileList) {
        const card = document.createElement('div');
        card.className = 'user-mobile-card';
        card.innerHTML = `
          <div class="user-mobile-top">
            <div class="user-cell">
              <div class="user-avatar-circle ${user.role}">
                ${user.avatar ? `<img src="${user.avatar}" alt="${escapeHTML(user.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : initials}
              </div>
              <div>
                <div class="user-name-title">${escapeHTML(user.name)}</div>
                <div class="user-id-sub" style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
                  <span style="display:inline-flex; align-items:center; gap:3px;">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span>${escapeHTML(user.phone)}</span>
                  </span>
                  &bull;
                  <span style="display:inline-flex; align-items:center; gap:3px;">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>${escapeHTML(user.email || '(tanpa email)')}</span>
                  </span>
                </div>
              </div>
            </div>
            <span class="role-badge-pill ${user.role}">
              ${isAdmin ? 'Admin' : 'Umat'}
            </span>
          </div>

          <div class="user-mobile-actions">
            ${isAdmin ? `
              <button onclick="handleToggleRole('${user.id}', 'umat')" class="btn btn-secondary btn-sm" style="flex: 1; display:inline-flex; align-items:center; justify-content:center; gap:4px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Jadikan Umat</span>
              </button>
            ` : `
              <button onclick="handleToggleRole('${user.id}', 'admin')" class="btn btn-gold btn-sm" style="flex: 1; display:inline-flex; align-items:center; justify-content:center; gap:4px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z"/>
                </svg>
                <span>Jadikan Admin</span>
              </button>
            `}
            <button onclick="openEditUserModal('${user.id}')" class="btn btn-secondary btn-sm" title="Edit" style="display:inline-flex; align-items:center; justify-content:center; gap:4px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>Edit</span>
            </button>
            <button onclick="openDeleteUserModal('${user.id}')" class="btn btn-danger btn-sm" title="Hapus" style="display:inline-flex; align-items:center; justify-content:center; gap:4px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Hapus</span>
            </button>
          </div>
        `;
        mobileList.appendChild(card);
      }
    });
  }

  // ==========================================================================
  // ROLE SWITCHER (SET PENGURUS / ADMIN & UMAT)
  // ==========================================================================
  window.handleToggleRole = async function(userId, targetRole) {
    const users = ViharaData.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Proteksi: jangan hapus atau demote admin bawaan jika itu satu-satunya admin
    if (targetRole === 'umat' && user.role === 'admin') {
      const remainingAdmins = users.filter(u => u.role === 'admin' && u.id !== userId);
      if (remainingAdmins.length === 0) {
        showToast('Tidak bisa mengubah role! Harus ada minimal 1 Pengurus/Admin di Vihara.', 'warning');
        return;
      }
    }

    const updated = ViharaData.updateUserRole(userId, targetRole);
    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.updateProfile === 'function') {
      try {
        await ViharaSupabase.updateProfile(user.id || user.phone, { role: targetRole });
      } catch (err) {
        console.warn('[Supabase] Gagal sync role ke database:', err);
      }
    }

    if (updated) {
      const roleText = targetRole === 'admin' ? 'Pengurus / Admin' : 'Umat Biasa';
      showToast(`Hak akses ${updated.name} berhasil diubah menjadi ${roleText}.`, 'success');
      renderDashboard();
    } else {
      showToast('Gagal mengubah hak akses pengguna.', 'error');
    }
  };

  // ==========================================================================
  // [INDEX: JS-SUPER-04] TAMBAH PENGGUNA BARU & EDIT PROFIL UMAT (NAMA, NO HP, EMAIL)
  // Fungsi: Modal pembuatan akun langsung oleh superadmin dan form edit kontak.
  // ==========================================================================
  window.openCreateUserModal = function() {
    const nameInput = document.getElementById('modal-create-name');
    const phoneInput = document.getElementById('modal-create-phone');
    const emailInput = document.getElementById('modal-create-email');
    const roleSelect = document.getElementById('modal-create-role');

    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (emailInput) emailInput.value = '';
    if (roleSelect) roleSelect.value = 'umat';

    openModal('modal-create-user');
  };

  window.handleCreateUserSubmit = function(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('modal-create-name').value.trim();
    const phone = document.getElementById('modal-create-phone').value.trim();
    const email = document.getElementById('modal-create-email') ? document.getElementById('modal-create-email').value.trim() : '';
    const role = document.getElementById('modal-create-role').value;

    if (!name || !phone) {
      showToast('Nama lengkap dan nomor telepon wajib diisi.', 'warning');
      return;
    }

    const existing = ViharaData.findUserByPhone(phone);
    if (existing) {
      showToast(`Nomor telepon ini sudah terdaftar atas nama ${existing.name}.`, 'warning');
      return;
    }

    const created = ViharaData.registerUser(name, phone, role, email);
    if (created) {
      showToast(`Pengguna baru ${created.name} (${role === 'admin' ? 'Admin' : 'Umat'}) berhasil ditambahkan.`, 'success');
      closeModal('modal-create-user');
      renderDashboard();
    }
  };

  // ==========================================================================
  // EDIT PENGGUNA (HANYA SUPER ADMIN YANG BERWENANG MENGUBAH NAMA, NO HP, & EMAIL)
  // ==========================================================================
  window.openEditUserModal = function(userId) {
    const users = ViharaData.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('modal-edit-id').value = user.id;
    document.getElementById('modal-edit-name').value = user.name;
    document.getElementById('modal-edit-phone').value = user.phone;
    const emailInput = document.getElementById('modal-edit-email');
    if (emailInput) emailInput.value = user.email || '';
    document.getElementById('modal-edit-role').value = user.role;

    openModal('modal-edit-user');
  };

  window.handleEditUserSubmit = async function(e) {
    if (e) e.preventDefault();
    const userId = document.getElementById('modal-edit-id').value;
    const name = document.getElementById('modal-edit-name').value.trim();
    const phone = document.getElementById('modal-edit-phone').value.trim();
    const email = document.getElementById('modal-edit-email') ? document.getElementById('modal-edit-email').value.trim() : '';
    const role = document.getElementById('modal-edit-role').value;

    if (!name || !phone) {
      showToast('Nama dan nomor telepon tidak boleh kosong.', 'warning');
      return;
    }

    // Proteksi: jangan demote admin bawaan jika itu satu-satunya admin
    const users = ViharaData.getUsers();
    const user = users.find(u => u.id === userId);
    if (user && role === 'umat' && user.role === 'admin') {
      const remainingAdmins = users.filter(u => u.role === 'admin' && u.id !== userId);
      if (remainingAdmins.length === 0) {
        showToast('Tidak bisa mengubah role! Harus ada minimal 1 Pengurus/Admin di Vihara.', 'warning');
        return;
      }
    }

    const updated = ViharaData.updateUser(userId, { name, phone, email, role });
    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.updateProfile === 'function') {
      try {
        await ViharaSupabase.updateProfile(user ? (user.id || user.phone) : userId, { name, phone, email, role });
      } catch (err) {
        console.warn('[Supabase] Gagal sync user profile ke database:', err);
      }
    }

    if (updated) {
      showToast(`Data pengguna ${updated.name} berhasil diperbarui oleh Super Admin.`, 'success');
      closeModal('modal-edit-user');
      renderDashboard();
    }
  };

  window.handleResetUserPassword = async function() {
    const userId = document.getElementById('modal-edit-id')?.value;
    if (!userId) return;
    if (!confirm('Apakah Anda yakin ingin me-reset kata sandi pengguna ini ke bawaan (123456)?')) {
      return;
    }

    const defaultHash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
    const users = ViharaData.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.updateProfilePassword === 'function') {
      await ViharaSupabase.updateProfilePassword(user.phone, defaultHash);
    }

    ViharaData.updateUser(userId, {
      password_hash: defaultHash,
      must_change_password: true
    });
    showToast(`Kata sandi akun ${user.name} berhasil di-reset ke default (123456).`, 'success');
  };

  // ==========================================================================
  // [INDEX: JS-SUPER-05] HAPUS PENGGUNA PERMANEN DENGAN MODAL KONFIRMASI AMAN
  // Fungsi: Proteksi minimal 1 admin dan dialog konfirmasi penghapusan akun.
  // ==========================================================================
  window.openDeleteUserModal = function(userId) {
    const users = ViharaData.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.role === 'admin') {
      const remainingAdmins = users.filter(u => u.role === 'admin' && u.id !== userId);
      if (remainingAdmins.length === 0) {
        showToast('Akun ini adalah satu-satunya Admin. Buat Admin lain sebelum menghapus.', 'warning');
        return;
      }
    }

    pendingDeleteUserId = userId;
    document.getElementById('modal-delete-user-name').innerText = user.name;
    document.getElementById('modal-delete-user-role').innerText = user.role === 'admin' ? 'Pengurus / Admin' : 'Umat';
    document.getElementById('modal-delete-user-phone').innerText = user.phone;

    openModal('modal-delete-user');
  };

  window.handleConfirmDeleteUser = function() {
    if (!pendingDeleteUserId) return;
    const success = ViharaData.deleteUser(pendingDeleteUserId);
    if (success) {
      showToast('Pengguna berhasil dihapus secara permanen dari sistem.', 'success');
      closeModal('modal-delete-user');
      pendingDeleteUserId = null;
      renderDashboard();
    } else {
      showToast('Gagal menghapus pengguna.', 'error');
    }
  };

  // ==========================================================================
  // FILTER & SEARCH HANDLER
  // ==========================================================================
  window.setFilterRole = function(role) {
    currentFilterRole = role;
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-role') === role);
    });
    renderUsersList();
  };

  const searchInput = document.getElementById('super-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      renderUsersList();
    });
  }

  // ==========================================================================
  // BATCH IMPORT DATA UMAT (CSV / TEXT INPUT)
  // ==========================================================================
  window.openBatchImportModal = function() {
    const fileInp = document.getElementById('batch-file-input');
    const textInp = document.getElementById('batch-text-input');
    const previewEl = document.getElementById('batch-preview-info');
    if (fileInp) fileInp.value = '';
    if (textInp) {
      textInp.value = '';
      textInp.removeEventListener('input', onBatchTextInput);
      textInp.addEventListener('input', onBatchTextInput);
    }
    if (previewEl) {
      previewEl.style.display = 'none';
      previewEl.innerText = '';
    }
    openModal('modal-batch-import');
  };

  function onBatchTextInput(e) {
    updateBatchPreview(e.target.value);
  }

  window.handleBatchFileSelect = function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      const textInp = document.getElementById('batch-text-input');
      if (textInp) {
        textInp.value = text;
        updateBatchPreview(text);
      }
    };
    reader.readAsText(file);
  };

  function parseClientCSV(content) {
    if (!content) return [];
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];

    const delimiter = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
    const users = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Skip header jika mengandung 'nama' atau 'name' dan 'phone' atau 'hp'
      if (i === 0 && (line.toLowerCase().includes('nama') || line.toLowerCase().includes('name')) && (line.toLowerCase().includes('phone') || line.toLowerCase().includes('hp') || line.toLowerCase().includes('telp'))) {
        continue;
      }

      const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 2) continue;

      const name = cols[0];
      const rawPhone = cols[1];
      const email = cols[2] || '';
      const role = cols[3] || 'umat';

      let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('62')) cleanPhone = '0' + cleanPhone.slice(2);

      if (name && cleanPhone) {
        users.push({
          name: name,
          phone: cleanPhone,
          email: email.includes('@') ? email.toLowerCase() : '',
          password_hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
          must_change_password: true,
          role: role.toLowerCase().includes('admin') ? 'admin' : 'umat'
        });
      }
    }
    return users;
  }

  function updateBatchPreview(text) {
    const previewEl = document.getElementById('batch-preview-info');
    if (!previewEl) return;
    const list = parseClientCSV(text);
    if (list.length > 0) {
      previewEl.style.display = 'block';
      previewEl.innerText = `🔍 Terdeteksi ${list.length} baris data calon umat siap disimpan ke Supabase.`;
    } else {
      previewEl.style.display = 'none';
    }
  }

  window.handleBatchImportSubmit = async function(event) {
    if (event) event.preventDefault();
    const textInp = document.getElementById('batch-text-input');
    const content = textInp ? textInp.value : '';
    const users = parseClientCSV(content);

    if (users.length === 0) {
      showToast('Tidak ada data valid dengan Nama & No. HP untuk diimpor.', 'warning');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-batch-import');
    const origHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        <span>Mengunggah ${users.length} Umat ke Supabase...</span>
      `;
    }

    try {
      if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.batchInsertProfiles === 'function') {
        const result = await ViharaSupabase.batchInsertProfiles(users);
        if (result.success) {
          showToast(`Berhasil menyimpan ${result.count} data umat ke Supabase!`, 'success');
          closeModal('modal-batch-import');
          renderDashboard();
        } else {
          showToast('Gagal impor batch: ' + result.message, 'error');
        }
      } else {
        // Fallback local save jika offline
        users.forEach(u => {
          ViharaData.addUser(u);
        });
        showToast(`Berhasil menyimpan ${users.length} data umat (Lokal).`, 'success');
        closeModal('modal-batch-import');
        renderDashboard();
      }
    } catch (err) {
      console.error('Error batch import:', err);
      showToast('Terjadi kesalahan saat mengunggah batch: ' + err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origHtml;
      }
    }
  };

  // ==========================================================================
  // [INDEX: JS-SUPER-06] EKSPOR MASTER DATA CSV, PEMBERSIHAN LOG & UTILITAS MODAL
  // Fungsi: Unduh CSV database pengguna, purge log presensi/tamu, dan helper modal.
  // ==========================================================================
  window.handleExportMasterUsersCSV = function() {
    const allUsers = ViharaData.getUsers();
    if (allUsers.length === 0) {
      showToast('Tidak ada data pengguna untuk diunduh.', 'warning');
      return;
    }

    let csv = 'data:text/csv;charset=utf-8,\uFEFF';
    csv += 'Laporan Master Pengguna - Vihara Amurwa Bhumi Cibinong\n';
    csv += `Waktu Unduh,${new Date().toLocaleString('id-ID')}\n\n`;
    csv += 'No,ID Pengguna,Nama Lengkap,Nomor Telepon,Role/Hak Akses,Tanggal Terdaftar\n';

    allUsers.forEach((u, i) => {
      const roleStr = u.role === 'admin' ? 'Pengurus / Admin' : 'Umat';
      csv += `${i + 1},"${u.id}","${u.name}","'${u.phone}","${roleStr}","${u.registeredAt || '-'}"\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Umat_Amurwa_Bhumi_${ViharaData.getTodayKey()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Master data pengguna berhasil diunduh (CSV).', 'success');
  };

  // ==========================================================================
  // RESET / BERSIHKAN DATA
  // ==========================================================================
  window.handlePurgeAttendanceLogs = function() {
    if (confirm('Apakah Anda yakin ingin MENGHAPUS SELURUH LOG PRESENSI UMAT? Tindakan ini tidak bisa dibatalkan.')) {
      ViharaData.clearAttendanceLogs();
      showToast('Seluruh riwayat presensi umat telah dibersihkan.', 'success');
      renderDashboard();
    }
  };

  window.handlePurgeGuestLogs = function() {
    if (confirm('Apakah Anda yakin ingin MENGHAPUS SELURUH BUKU TAMU? Tindakan ini tidak bisa dibatalkan.')) {
      ViharaData.clearGuestLogs();
      showToast('Seluruh data buku tamu telah dibersihkan.', 'success');
      renderDashboard();
    }
  };

  // ==========================================================================
  // MODAL UTILITY HELPERS
  // ==========================================================================
  window.openModal = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('show');
  };

  window.closeModal = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
  };

  function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  function getInitials(name) {
    if (!name) return 'VA';
    return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Inisialisasi awal
  checkAuthState();
});
