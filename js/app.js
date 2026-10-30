/**
 * ============================================================================
 * FILE: js/app.js - Aplikasi Utama Vihara Amurwa Bhumi Cibinong
 * ============================================================================
 * DAFTAR INDEKS & GLOSARIUM SEKSI CEPAT (QUICK LOOKUP GLOSSARY):
 * Gunakan pencarian ID tag [INDEX: JS-APP-XX] untuk langsung menuju baris kode terkait.
 * ----------------------------------------------------------------------------
 * [INDEX: JS-APP-01] Inisialisasi Aplikasi, State Global & View Controller (Router)
 * [INDEX: JS-APP-02] View 2: Dashboard Umat, Status Hari Ini & Glass Stats Grid
 * [INDEX: JS-APP-03] View 3: Riwayat Kehadiran Umat, Filter Bulan & Kalender
 * [INDEX: JS-APP-04] View 6: Panel Pengurus / Admin (Manajemen Acara & Kartu Stat)
 * [INDEX: JS-APP-05] Popup Modal Daftar Hadir Per Acara & Presensi Manual Admin
 * [INDEX: JS-APP-06] View 6: Formulir Pembuatan Acara Kebaktian Baru (Admin)
 * [INDEX: JS-APP-07] View 1: Auth Tab Switcher (Masuk vs Daftar Umat Baru)
 * [INDEX: JS-APP-08] Mutiara Dhamma & Petikan Dhammapada Harian (Login Page)
 * [INDEX: JS-APP-09] View 5: Buku Tamu Digital (Kunjungan Umat Luar / Walk-in)
 * [INDEX: JS-APP-10] View 7: Profil Umat (Halaman Dedikasi Akun Pengguna)
 * [INDEX: JS-APP-11] View 4: Sistem Pengumuman Vihara (Feed, Form, Detail Modal & Banner)
 * [INDEX: JS-APP-12] Sliding Desktop Navbar Glider (Silky Smooth Expo Motion)
 * [INDEX: JS-APP-13] Preloader Sakral Roda Dhamma (Dharmachakra Loading Controller)
 * ============================================================================
 */

/**
 * app.js - Main Application Controller
 * Vihara Amurwa Bhumi Cibinong
 * Redesign: Maroon -> Putih Glassmorphism, Ringan, Mobile & Desktop Responsive
 * Matching Image 1 (Dashboard Umat & Aksi Cepat), Image 2 (Connected Timeline Riwayat), Image 3 (Buat Acara)
 */

document.addEventListener('DOMContentLoaded', () => {
  ViharaData.init();

  let activeView = 'view-login';
  let currentPopupEventId = null;
  let currentPopupTab = 'umat'; // 'umat' | 'guest'
  let currentPopupSearch = '';
  let currentHistoryFilter = 'semua';

  const views = {
    login: document.getElementById('view-login'),
    umat: document.getElementById('view-umat'),
    history: document.getElementById('view-history'),
    announcements: document.getElementById('view-announcements'),
    announcementDetail: document.getElementById('view-announcement-detail'),
    guest: document.getElementById('view-guest'),
    admin: document.getElementById('view-admin'),
    profile: document.getElementById('view-profile')
  };

  // ==========================================================================
  // [INDEX: JS-APP-01] INISIALISASI APLIKASI, STATE GLOBAL & VIEW CONTROLLER (ROUTER)
  // Fungsi: Mengatur routing SPA antar-view, guard autentikasi, dan animasi geser.
  // ==========================================================================
  // Urutan indeks tampilan untuk arah animasi geser kanan-kiri (Slide Left / Slide Right)
  const VIEW_ORDER = {
    'view-login': 0,
    'view-guest': 0.5,
    'view-umat': 1,
    'view-history': 2,
    'view-announcements': 3,
    'view-announcement-detail': 3.5,
    'view-admin': 4,
    'view-profile': 5
  };

  function navigateTo(targetViewId) {
    const access = ViharaAuth.checkRouteAccess(targetViewId);
    if (!access.allowed) {
      showToast(access.message, 'warning');
      targetViewId = access.reason === 'unauthorized' ? 'view-umat' : 'view-login';
    }

    const prevView = activeView;
    const prevOrder = (prevView && VIEW_ORDER[prevView] !== undefined) ? VIEW_ORDER[prevView] : 1;
    const nextOrder = (VIEW_ORDER[targetViewId] !== undefined) ? VIEW_ORDER[targetViewId] : 1;
    const isSlideLeft = nextOrder < prevOrder;
    const animationClass = isSlideLeft ? 'slide-in-left' : 'slide-in-right';

    Object.values(views).forEach(v => {
      if (v) {
        v.classList.remove('active', 'slide-in-right', 'slide-in-left', 'page-in');
      }
    });

    const targetEl = document.getElementById(targetViewId);
    if (targetEl) {
      targetEl.classList.remove('slide-in-right', 'slide-in-left', 'page-in');
      // Force DOM reflow agar animasi geser mulus selalu berjalan setiap ganti menu
      void targetEl.offsetWidth;
      targetEl.classList.add('active', animationClass);
      activeView = targetViewId;
      window.scrollTo(0, 0);
    }

    updateNavigationUI(targetViewId);

    if (targetViewId === 'view-umat') {
      renderUmatDashboard();
    } else if (targetViewId === 'view-history') {
      renderUmatHistory();
    } else if (targetViewId === 'view-announcements') {
      renderAnnouncementsPage();
    } else if (targetViewId === 'view-admin') {
      renderAdminDashboard();
    } else if (targetViewId === 'view-profile') {
      renderUserProfile();
    }
  }

  // Navigasi Responsif: Di PC hanya navbar atas, di HP hanya navbar icon bawah
  function updateNavigationUI(currentViewId) {
    const user = ViharaAuth.currentUser();
    const isAdmin = ViharaAuth.isAdmin();
    const isLoggedIn = ViharaAuth.isLoggedIn();

    const userProfileEl = document.getElementById('header-user-profile');

    if (isLoggedIn) {
      document.body.classList.remove('user-logged-out');
      document.body.classList.add('user-logged-in');

      if (userProfileEl) userProfileEl.style.display = 'flex';

      // Update profil di header desktop & badge role mobile
      const nameEl = document.getElementById('header-user-name');
      if (nameEl) nameEl.innerText = user.name;
      const rolePill = document.getElementById('header-user-role');
      if (rolePill) {
        rolePill.innerText = user.role === 'admin' ? 'Pengurus' : 'Umat';
        rolePill.className = `user-role-pill ${user.role}`;
      }
      const mobileRolePill = document.getElementById('umat-mobile-role');
      if (mobileRolePill) {
        mobileRolePill.innerText = user.role === 'admin' ? 'Pengurus' : 'Umat';
        mobileRolePill.className = `mobile-role-pill ${user.role}`;
      }
      const avatarEl = document.getElementById('header-user-avatar');
      if (avatarEl) renderUserAvatar(avatarEl, user);

      // Menu Admin HANYA muncul jika role == admin
      document.querySelectorAll('.admin-nav-item').forEach(el => {
        el.style.display = isAdmin ? 'inline-flex' : 'none';
      });
      document.querySelectorAll('.admin-bottom-nav-item').forEach(el => {
        el.style.display = isAdmin ? 'flex' : 'none';
      });

      // Bottom Nav Tab 2: 'Histori' untuk Admin, 'Riwayat' untuk Umat Biasa
      const histText = document.getElementById('bottom-nav-history-text');
      if (histText) {
        histText.innerText = isAdmin ? 'Histori' : 'Riwayat';
      }

      // FAB '+' untuk Buat Acara HANYA untuk Admin (Hilang di Umat Biasa)
      const fab = document.getElementById('bottom-nav-fab-btn');
      if (fab) {
        fab.style.display = isAdmin ? 'flex' : 'none';
      }

      // Sembunyikan Aksi Cepat 'Isi Buku Tamu' & 'Buat Acara' untuk Umat Biasa
      document.querySelectorAll('.admin-only-action').forEach(el => {
        el.style.display = isAdmin ? 'flex' : 'none';
      });

      // Update badge unread notifikasi
      if (typeof updateNotificationsBadge === 'function') {
        updateNotificationsBadge();
      }

      // Update link aktif desktop
      document.querySelectorAll('.desktop-nav .nav-link').forEach(btn => {
        const target = btn.getAttribute('data-target');
        const isMatch = target === currentViewId || (currentViewId === 'view-announcement-detail' && target === 'view-announcements');
        btn.classList.toggle('active', isMatch);
      });

      // Update link aktif desktop guest
      document.querySelectorAll('.desktop-nav-guest .nav-link').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-target') === currentViewId);
      });

      // Update link aktif mobile bottom bar
      document.querySelectorAll('.bottom-nav .bottom-nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-target') === currentViewId);
      });

      // Update pill profil desktop jika aktif
      const profilePill = document.querySelector('.profile-menu-pill');
      if (profilePill) {
        profilePill.classList.toggle('active', currentViewId === 'view-profile');
      }

      // Sinkronkan glider indikator geser desktop navbar
      syncDesktopNavGliders(true);

    } else {
      // BELUM LOGIN: Semua navbar disembunyikan total kecuali navigasi guest PC
      document.body.classList.remove('user-logged-in');
      document.body.classList.add('user-logged-out');

      if (userProfileEl) userProfileEl.style.display = 'none';

      // Update link aktif desktop guest saat belum login
      document.querySelectorAll('.desktop-nav-guest .nav-link').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-target') === currentViewId);
      });

      // Sinkronkan glider desktop guest jika aktif
      syncDesktopNavGliders(true);
    }
  }

  // ==========================================================================
  // [INDEX: JS-APP-02] VIEW 2: DASHBOARD UMAT, STATUS HARI INI & GLASS STATS GRID
  // Fungsi: Render kartu status presensi hari ini, tombol check-in, dan metrik umat.
  // ==========================================================================
  function renderUmatDashboard(skipRemoteSync = false) {
    const user = ViharaAuth.currentUser();
    if (!user) return;

    if (!skipRemoteSync && typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.isConfigured === 'function' && ViharaSupabase.isConfigured()) {
      Promise.allSettled([
        ViharaSupabase.syncEvents(),
        ViharaSupabase.syncAttendance()
      ]).then(() => {
        renderUmatDashboard(true);
      }).catch(() => {});
    }

    const activeEvent = ViharaData.getActiveEvent();
    const initials = getInitials(user.name);

    // Update greeting name, mobile avatar & badge role
    const greetingEl = document.getElementById('umat-greeting-name');
    if (greetingEl) greetingEl.innerText = user.name;
    const mobileAvatar = document.getElementById('umat-mobile-avatar');
    if (mobileAvatar) renderUserAvatar(mobileAvatar, user);
    const mobileRolePill = document.getElementById('umat-mobile-role');
    if (mobileRolePill) {
      mobileRolePill.innerText = user.role === 'admin' ? 'Pengurus' : 'Umat';
      mobileRolePill.className = `mobile-role-pill ${user.role}`;
    }

    // Sembunyikan 'Isi Buku Tamu' & 'Buat Acara' jika user biasa (Permintaan 1)
    const isAdmin = ViharaAuth.isAdmin();
    document.querySelectorAll('.admin-only-action').forEach(el => {
      el.style.display = isAdmin ? 'flex' : 'none';
    });

    // Render Mutiara Dhamma Lebar pada Beranda Umat
    renderHomeDhammaQuote();

    if (typeof updateNotificationsBadge === 'function') {
      updateNotificationsBadge();
    }

    const checkinBtn = document.getElementById('btn-umat-checkin');
    const myLogs = ViharaData.getAttendanceList().filter(a => a.userId === user.id);
    const allEvents = ViharaData.getEvents();

    // 3 Metrik di Glass Card (Image 1)
    const statTotal = document.getElementById('stat-umat-total');
    if (statTotal) statTotal.innerText = myLogs.length;

    const statActiveEvents = document.getElementById('stat-umat-active-events');
    if (statActiveEvents) statActiveEvents.innerText = allEvents.length;

    const statRate = document.getElementById('stat-umat-rate');
    if (statRate) {
      statRate.innerText = allEvents.length > 0
        ? `${Math.min(100, Math.round((myLogs.length / Math.max(allEvents.length, 1)) * 100))}%`
        : '100%';
    }

    // Tanggal Hari Ini di Hero Card
    const dateHero = document.getElementById('umat-kebaktian-date');
    if (dateHero) {
      dateHero.innerText = activeEvent ? activeEvent.dateText : ViharaData.formatDateIndonesia(new Date());
    }

    // Status Title Hero Card (Image 1)
    const titleHero = document.getElementById('umat-kebaktian-title');

    if (!activeEvent) {
      if (titleHero) titleHero.innerText = 'Tidak Ada Acara Aktif';
      if (checkinBtn) {
        checkinBtn.disabled = true;
        checkinBtn.innerHTML = `<span>Tidak Ada Jadwal Buka</span>`;
        checkinBtn.className = 'btn btn-ghost btn-lg btn-block disabled';
      }
    } else {
      // Hidden compatibility values
      const speakerEl = document.getElementById('umat-kebaktian-speaker');
      if (speakerEl) speakerEl.innerText = `${activeEvent.speaker} (${activeEvent.speakerTitle})`;
      const timeEl = document.getElementById('umat-kebaktian-time');
      if (timeEl) timeEl.innerText = activeEvent.timeSchedule;
      const dhammasalaEl = document.getElementById('umat-kebaktian-dhammasala');
      if (dhammasalaEl) dhammasalaEl.innerText = activeEvent.dhammasala;

      const isCheckedIn = ViharaData.isUserCheckedInActiveEvent(user.id);
      if (isCheckedIn) {
        if (titleHero) titleHero.innerText = 'Sudah Hadir';
        if (checkinBtn) {
          checkinBtn.disabled = true;
          checkinBtn.innerHTML = `
            <span style="display:inline-flex; align-items:center; justify-content:center; gap:6px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Anda Sudah Tercatat Hadir</span>
            </span>
          `;
          checkinBtn.className = 'btn btn-ghost btn-lg btn-block disabled';
        }
      } else {
        if (titleHero) titleHero.innerText = 'Belum Absen';
        if (checkinBtn) {
          checkinBtn.disabled = false;
          checkinBtn.innerHTML = `<span>Presensi Hadir Sekarang (${escapeHTML(activeEvent.name)})</span>`;
          checkinBtn.className = 'btn btn-primary btn-lg btn-block';
        }
      }
    }

    // Render "Aktivitas Terakhir" on Dashboard (Image 1)
    renderUmatRecentActivity(myLogs, activeEvent);
  }

  // Render 3 Aktivitas Terakhir pada Dashboard Umat (Image 1)
  function renderUmatRecentActivity(myLogs, activeEvent) {
    const container = document.getElementById('umat-recent-activity-container');
    if (!container) return;

    container.innerHTML = '';

    if (myLogs.length === 0 && !activeEvent) {
      container.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: var(--ink-50); font-size: 0.85rem; background: var(--maroon-50); border-radius: var(--r-md); border: 1px dashed var(--maroon-100);">
          Belum ada aktivitas presensi terbaru.
        </div>
      `;
      return;
    }

    const recent = myLogs.slice(-3).reverse();
    if (recent.length > 0) {
      recent.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.style.marginBottom = '10px';
        div.innerHTML = `
          <div class="timeline-icon-box" style="background: var(--success-bg); color: var(--success); width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div class="timeline-content">
            <div class="timeline-top-row">
              <div class="timeline-title">${escapeHTML(item.kebaktianName)}</div>
              <div class="timeline-date">${item.dateKey === ViharaData.getTodayKey() ? 'Hari ini' : item.dateKey}</div>
            </div>
            <div class="timeline-sub">
              <span style="display:inline-flex; align-items:center; gap:4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span>Dhammasala Utama</span>
              </span>
              <span style="margin: 0 4px;">&bull;</span>
              <span>${item.timeStr}</span>
            </div>
          </div>
        `;
        container.appendChild(div);
      });
    } else if (activeEvent) {
      const div = document.createElement('div');
      div.className = 'timeline-item';
      div.innerHTML = `
        <div class="timeline-icon-box" style="background: var(--maroon-50); color: var(--maroon-700); width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="timeline-content">
          <div class="timeline-top-row">
            <div class="timeline-title">${escapeHTML(activeEvent.name)}</div>
            <div class="timeline-date">Sedang Dibuka</div>
          </div>
          <div class="timeline-sub">
            <span style="display:inline-flex; align-items:center; gap:4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span>${escapeHTML(activeEvent.dhammasala)}</span>
            </span>
            <span style="margin: 0 4px;">&bull;</span>
            <span>${activeEvent.timeSchedule}</span>
          </div>
        </div>
      `;
      container.appendChild(div);
    }
  }

  // Handler Tombol Presensi Umat Langsung
  window.handleUmatCheckIn = function() {
    const user = ViharaAuth.currentUser();
    const activeEvent = ViharaData.getActiveEvent();

    if (!user) return;
    if (!activeEvent) {
      showToast('Tidak ada jadwal kebaktian yang sedang dibuka.', 'warning');
      return;
    }

    if (ViharaData.isUserCheckedInActiveEvent(user.id)) {
      showToast('Anda sudah tercatat hadir pada acara kebaktian ini.', 'info');
      return;
    }

    const record = ViharaData.addAttendanceRecord({
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      method: 'mandiri'
    });

    document.getElementById('modal-checkin-event').innerText = record.kebaktianName;
    document.getElementById('modal-checkin-speaker').innerText = record.speaker;
    document.getElementById('modal-checkin-time').innerText = record.timeStr;
    openModal('modal-success-checkin');

    renderUmatDashboard();
    showToast(`Presensi berhasil! Selamat beribadah di ${record.kebaktianName}.`, 'success');
  };

  // ==========================================================================
  // [INDEX: JS-APP-03] VIEW 3: RIWAYAT KEHADIRAN UMAT, FILTER BULAN & KALENDER
  // Fungsi: Render kartu rekam jejak presensi umat per bulan tanpa garis kisi.
  // ==========================================================================
  const INDO_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function formatMonthYearIndo(ym) {
    if (!ym || ym === 'all' || ym === 'Lainnya') return ym;
    const parts = ym.split('-');
    if (parts.length >= 2) {
      const mIdx = parseInt(parts[1], 10) - 1;
      const mName = INDO_MONTHS[mIdx] || parts[1];
      return `${mName} ${parts[0]}`;
    }
    return ym;
  }

  let currentHistoryMonthFilter = 'all';

  window.filterHistoryByMonth = function(monthVal) {
    currentHistoryMonthFilter = monthVal;
    renderUmatHistory();
  };

  // Backwards compatibility alias
  window.filterHistoryByType = function(type, btnEl) {
    renderUmatHistory();
  };

  function renderUmatHistory(skipRemoteSync = false) {
    const user = ViharaAuth.currentUser();
    if (!user) return;

    if (!skipRemoteSync && typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.isConfigured === 'function' && ViharaSupabase.isConfigured()) {
      ViharaSupabase.syncAttendance().then(() => {
        renderUmatHistory(true);
      }).catch(() => {});
    }

    const allUserLogs = ViharaData.getAttendanceList().filter(a => a.userId === user.id);
    const totalCount = allUserLogs.length;

    // Header 3 stats (Image 2)
    const monthEl = document.getElementById('history-metric-month');
    if (monthEl) monthEl.innerText = allUserLogs.filter(a => a.dateKey && a.dateKey.startsWith(ViharaData.getTodayKey().slice(0, 7))).length;

    const totalEl = document.getElementById('history-metric-total');
    if (totalEl) totalEl.innerText = totalCount;

    const rateEl = document.getElementById('history-metric-rate');
    if (rateEl) {
      const allEvents = ViharaData.getEvents();
      rateEl.innerText = allEvents.length > 0 ? `${Math.min(100, Math.round((totalCount / Math.max(allEvents.length, 1)) * 100))}%` : '100%';
    }

    // Populate dropdown opsi bulan secara dinamis
    const monthFilterSelect = document.getElementById('history-month-filter');
    if (monthFilterSelect) {
      const uniqueMonths = new Set();
      allUserLogs.forEach(a => {
        if (a.dateKey && a.dateKey.length >= 7) {
          uniqueMonths.add(a.dateKey.slice(0, 7));
        }
      });
      // Selalu sertakan bulan ini
      uniqueMonths.add(ViharaData.getTodayKey().slice(0, 7));

      const sortedMonths = Array.from(uniqueMonths).sort().reverse();
      const currentSelected = currentHistoryMonthFilter;

      let selectHtml = `<option value="all">Semua Bulan</option>`;
      sortedMonths.forEach(ym => {
        selectHtml += `<option value="${ym}" ${ym === currentSelected ? 'selected' : ''}>${formatMonthYearIndo(ym)}</option>`;
      });
      monthFilterSelect.innerHTML = selectHtml;
    }

    // Filter logs berdasarkan bulan yang dipilih
    let filteredLogs = allUserLogs.slice();
    if (currentHistoryMonthFilter !== 'all') {
      filteredLogs = filteredLogs.filter(a => a.dateKey && a.dateKey.startsWith(currentHistoryMonthFilter));
    }

    // Urutkan logs dari yang paling baru
    filteredLogs.sort((a, b) => (b.dateKey || '').localeCompare(a.dateKey || ''));

    const tbody = document.getElementById('umat-history-tbody');
    const mobileList = document.getElementById('umat-history-mobile-list');

    tbody.innerHTML = '';
    mobileList.innerHTML = '';

    if (filteredLogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2.5rem; color: var(--ink-50);">Belum ada riwayat kehadiran pada periode ini.</td></tr>`;
      mobileList.innerHTML = `<div style="text-align:center; padding: 2.5rem; color: var(--ink-50); background: #ffffff; border-radius: var(--r-md); border: 1.5px dashed var(--line);">Belum ada riwayat kehadiran tercatat pada bulan ini.</div>`;
      return;
    }

    // Kelompokkan per bulan (YYYY-MM)
    const monthGroups = {};
    filteredLogs.forEach(item => {
      const ym = (item.dateKey && item.dateKey.length >= 7) ? item.dateKey.slice(0, 7) : 'Lainnya';
      if (!monthGroups[ym]) monthGroups[ym] = [];
      monthGroups[ym].push(item);
    });

    let overallIndex = 1;
    Object.keys(monthGroups).forEach(ym => {
      const groupItems = monthGroups[ym];
      const monthLabel = formatMonthYearIndo(ym);

      // Section Header per Bulan di Mobile Timeline (Sesuai Permintaan)
      const monthBadge = document.createElement('div');
      monthBadge.className = 'history-month-badge';
      monthBadge.innerHTML = `
        <span style="display:inline-flex; align-items:center; gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-svg">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>${monthLabel}</span>
        </span>
        <span class="badge-count">(${groupItems.length} Kehadiran)</span>
      `;
      mobileList.appendChild(monthBadge);

      // Section Header per Bulan di Desktop Table
      const trHeader = document.createElement('tr');
      trHeader.style.backgroundColor = 'var(--maroon-50)';
      trHeader.innerHTML = `
        <td colspan="5" style="font-weight: 800; color: var(--maroon-900); padding: 10px 14px;">
          <span style="display:inline-flex; align-items:center; gap:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-svg">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>${monthLabel} (${groupItems.length} Kehadiran)</span>
          </span>
        </td>
      `;
      tbody.appendChild(trHeader);

      // Container khusus untuk item timeline bulan ini (mencegah garis konektor tembus keluar)
      const groupContainer = document.createElement('div');
      groupContainer.className = 'timeline-items-group';

      // Render riwayat di bawah bulan tersebut
      groupItems.forEach(item => {
        // Desktop Table Row
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${overallIndex++}</td>
          <td>
            <strong>${escapeHTML(item.kebaktianName)}</strong>
            <div style="font-size: 0.75rem; color: var(--ink-50);">Penceramah: ${escapeHTML(item.speaker || '-')}</div>
          </td>
          <td>${item.dateKey}</td>
          <td>${item.timeStr}</td>
          <td>
            <span class="pill-status hadir">${item.status}</span>
            <span style="font-size: 0.75rem; color: var(--ink-50); margin-left: 6px;">(${item.method === 'manual_admin' ? 'Manual Admin' : 'Mandiri'})</span>
          </td>
        `;
        tbody.appendChild(tr);

        // Connected Timeline Item (Image 2)
        const tItem = document.createElement('div');
        tItem.className = 'timeline-item';
        
        const dateParts = (item.dateKey || '').split('-');
        const formattedDate = dateParts.length === 3 ? `${dateParts[2]} ${getMonthShortName(parseInt(dateParts[1]))}` : item.dateKey;

        tItem.innerHTML = `
          <div class="timeline-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div class="timeline-content">
            <div class="timeline-top-row">
              <div class="timeline-title">${escapeHTML(item.kebaktianName)}</div>
              <div class="timeline-date">${formattedDate}<br><span style="font-size: 0.7rem; color: var(--ink-50);">${item.timeStr}</span></div>
            </div>
            <div class="timeline-sub">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>Dhammasala Utama</span>
            </div>
            <div>
              <span class="timeline-tag-verified">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="margin-right:3px; display:inline-block; vertical-align:middle;">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Terverifikasi
              </span>
            </div>
          </div>
        `;
        groupContainer.appendChild(tItem);
      });
      mobileList.appendChild(groupContainer);
    });
  }

  function getMonthShortName(monthNum) {
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[monthNum] || '';
  }

  // ==========================================================================
  // [INDEX: JS-APP-04] VIEW 6: PANEL PENGURUS / ADMIN (MANAJEMEN ACARA & KARTU STAT)
  // Fungsi: Render kartu ringkasan acara admin beserta metrik kehadiran dan aksi.
  // ==========================================================================
  function renderAdminDashboard(skipRemoteSync = false) {
    if (!ViharaAuth.isAdmin()) {
      navigateTo('view-umat');
      return;
    }

    if (!skipRemoteSync && typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.isConfigured === 'function' && ViharaSupabase.isConfigured()) {
      Promise.allSettled([
        ViharaSupabase.syncEvents(),
        ViharaSupabase.syncAttendance(),
        ViharaSupabase.syncGuests(),
        ViharaSupabase.syncProfiles()
      ]).then(() => {
        renderAdminDashboard(true);
      }).catch(() => {});
    }

    const eventsWithStats = ViharaAdmin.getEventsWithStats();
    const allUsers = ViharaData.getUsers().filter(u => u.role === 'umat');

    // Stats ringkasan atas
    const totalUmatEl = document.getElementById('admin-stat-total-umat');
    if (totalUmatEl) totalUmatEl.innerText = allUsers.length;
    const totalEventsEl = document.getElementById('admin-stat-total-events');
    if (totalEventsEl) totalEventsEl.innerText = eventsWithStats.length;

    // Render daftar acara kebaktian
    renderAdminEventsList(eventsWithStats);
  }

  // Helper membuat DOM Card untuk Jadwal Kebaktian (Aktif maupun Arsip)
  function createAdminEventCard(evt, isArchive = false) {
    const card = document.createElement('div');
    card.className = `event-manage-card ${evt.isActive ? 'active-event' : 'archived-event'}`;

    const statusBadge = evt.isActive
      ? `<span class="pill-status hadir" style="display:inline-flex; align-items:center; gap:5px;"><span class="live-pulse-dot" style="width:6px; height:6px;"></span>SEDANG AKTIF</span>`
      : `<span class="pill-status" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; font-size:0.68rem; font-weight:700; padding:2px 8px; border-radius:var(--r-full);">ARSIP</span>`;

    card.innerHTML = `
      <div class="event-card-top">
        <div class="event-title-wrap">
          <h4 class="event-card-title">${escapeHTML(evt.name)}</h4>
          ${statusBadge}
        </div>
        <div class="event-stats-pills">
          <span class="pill-stat-umat" style="display:inline-flex; align-items:center; gap:5px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-svg">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>${evt.hadirUmatCount} Umat</span>
          </span>
          <span class="pill-stat-guest" style="display:inline-flex; align-items:center; gap:5px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-svg">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span>${evt.hadirGuestCount} Tamu</span>
          </span>
        </div>
      </div>

      <div class="event-speaker-line">
        <span style="display:inline-flex; align-items:center; gap:5px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-svg">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
          <span>${escapeHTML(evt.speaker || 'Tidak Ada')}</span>
        </span>
        <span style="font-weight: 500; color: var(--ink-50);">(${escapeHTML(evt.speakerTitle || 'Tidak Ada')})</span>
      </div>

      <div class="event-meta-line">
        <span style="display:inline-flex; align-items:center; gap:4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>${evt.dateText || evt.date}</span>
        </span>
        <span style="display:inline-flex; align-items:center; gap:4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>${evt.timeSchedule || (evt.startTime + ' - ' + evt.endTime + ' WIB')}</span>
        </span>
        <span style="display:inline-flex; align-items:center; gap:4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>${escapeHTML(evt.dhammasala || 'Dhammasala Utama')}</span>
        </span>
      </div>

      <div class="event-card-actions">
        <button onclick="openEventAttendanceModal('${evt.id}')" class="btn ${evt.isActive ? 'btn-primary' : 'btn-ghost'} btn-event-primary" style="display:inline-flex; align-items:center; justify-content:center; gap:6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-svg">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          </svg>
          <span>Daftar Hadir & Set Hadir</span>
        </button>
        <button onclick="handleAdminDeleteEvent('${evt.id}')" class="btn btn-danger-icon" title="Hapus Jadwal Acara" aria-label="Hapus Jadwal Acara">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    `;
    return card;
  }

  // Render Kartu Jadwal Kebaktian (Terpisah: Sedang Aktif & Arsip Riwayat)
  function renderAdminEventsList(events) {
    const activeContainer = document.getElementById('admin-active-events-container');
    const archiveContainer = document.getElementById('admin-archived-events-container');
    const legacyContainer = document.getElementById('admin-events-list-container');
    const archiveCountBadge = document.getElementById('admin-archive-count-badge');

    const activeEvents = events.filter(e => e.isActive && !ViharaData.isEventExpired(e));
    const archiveEvents = events.filter(e => !e.isActive || ViharaData.isEventExpired(e));

    if (archiveCountBadge) {
      archiveCountBadge.textContent = archiveEvents.length;
    }

    if (activeContainer && archiveContainer) {
      // 1. Render Jadwal yang Sedang Aktif
      activeContainer.innerHTML = '';
      if (activeEvents.length === 0) {
        activeContainer.innerHTML = `
          <div class="empty-event-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:var(--ink-50); margin-bottom:6px;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div style="font-weight:700; color:var(--maroon-900); margin-bottom:2px;">Tidak Ada Jadwal Aktif</div>
            <p style="margin:0; font-size:0.775rem;">Saat ini belum ada kebaktian yang sedang aktif. Silakan pilih dari arsip di bawah atau buat jadwal baru di atas.</p>
          </div>
        `;
      } else {
        activeEvents.forEach(evt => {
          activeContainer.appendChild(createAdminEventCard(evt, false));
        });
      }

      // 2. Render Arsip & Riwayat Jadwal Kebaktian
      archiveContainer.innerHTML = '';
      if (archiveEvents.length === 0) {
        archiveContainer.innerHTML = `
          <div class="empty-event-box">
            <p style="margin:0; font-size:0.775rem;">Belum ada arsip / riwayat jadwal kebaktian sebelumnya.</p>
          </div>
        `;
      } else {
        archiveEvents.forEach(evt => {
          archiveContainer.appendChild(createAdminEventCard(evt, true));
        });
      }
    } else if (legacyContainer) {
      legacyContainer.innerHTML = '';
      if (events.length === 0) {
        legacyContainer.innerHTML = `<div class="empty-event-box">Belum ada jadwal kebaktian.</div>`;
      } else {
        events.forEach(evt => {
          legacyContainer.appendChild(createAdminEventCard(evt, !evt.isActive));
        });
      }
    }
  }

  // ==========================================================================
  // [INDEX: JS-APP-05] POPUP MODAL DAFTAR HADIR PER ACARA & PRESENSI MANUAL ADMIN
  // Fungsi: Render modal daftar hadir umat & tamu per acara, pencarian, dan assign.
  // ==========================================================================
  window.openEventAttendanceModal = function(eventId) {
    currentPopupEventId = eventId;
    currentPopupSearch = '';
    currentPopupTab = 'umat';

    const searchInput = document.getElementById('modal-event-search-input');
    if (searchInput) searchInput.value = '';

    renderEventAttendanceModalContent();
    openModal('modal-event-attendance');
  };

  window.switchEventModalTab = function(tabName) {
    currentPopupTab = tabName;
    const btnUmat = document.getElementById('modal-tab-btn-umat');
    const btnGuest = document.getElementById('modal-tab-btn-guest');

    if (btnUmat) btnUmat.classList.toggle('active', tabName === 'umat');
    if (btnGuest) btnGuest.classList.toggle('active', tabName === 'guest');

    renderEventAttendanceModalContent();
  };

  function renderEventAttendanceModalContent() {
    if (!currentPopupEventId) return;

    const data = ViharaAdmin.getEventDetailsAndAttendees(currentPopupEventId, currentPopupSearch);
    if (!data || !data.event) return;

    const event = data.event;

    // Header Popup
    document.getElementById('modal-event-title').innerText = event.name;
    document.getElementById('modal-event-meta').innerText = `${event.dateText} • ${event.timeSchedule} • Penceramah: ${event.speaker}`;
    document.getElementById('modal-event-tab-umat-count').innerText = data.hadirUmatCount;
    document.getElementById('modal-event-tab-guest-count').innerText = data.hadirGuestCount;

    const contentBox = document.getElementById('modal-event-body-content');
    contentBox.innerHTML = '';

    if (currentPopupTab === 'umat') {
      // TAB UMAT: List Umat dengan Tombol "Set Hadir"
      if (data.umatList.length === 0) {
        contentBox.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--ink-50);">Tidak ada nama umat yang sesuai pencarian "${escapeHTML(currentPopupSearch)}".</div>`;
        return;
      }

      const listContainer = document.createElement('div');
      listContainer.style.display = 'flex';
      listContainer.style.flexDirection = 'column';
      listContainer.style.gap = '8px';

      data.umatList.forEach(umat => {
        const item = document.createElement('div');
        item.className = `admin-umat-card ${umat.alreadyCheckedIn ? 'is-present' : ''}`;

        const actionBtn = umat.alreadyCheckedIn
          ? `<span class="pill-status hadir" style="display:inline-flex; align-items:center; gap:4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Hadir (${umat.checkInTime})</span>
            </span>`
          : `<button onclick="handleAssignUmatInModal('${umat.id}')" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem; font-weight: 700; width: auto;">
              Set Hadir
             </button>`;

        item.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
            <div class="mobile-item-avatar">${getInitials(umat.name)}</div>
            <div style="min-width: 0; flex: 1;">
              <div style="font-weight: 700; font-size: 0.875rem; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(umat.name)}</div>
              <div style="font-size: 0.725rem; color: var(--ink-50); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${umat.phone} &bull; ID: ${umat.id}</div>
            </div>
          </div>
          <div style="flex-shrink: 0; margin-left: 8px;">${actionBtn}</div>
        `;
        listContainer.appendChild(item);
      });

      contentBox.appendChild(listContainer);

    } else {
      // TAB BUKU TAMU: Real-time Guest List yang masuk pada acara ini
      if (data.guestList.length === 0) {
        contentBox.innerHTML = `<div style="text-align:center; padding: 2.5rem; color: var(--ink-50);">Belum ada tamu luar yang mengisi buku tamu untuk acara ini. Tamu yang mengisi formulir akan otomatis muncul secara real-time di sini.</div>`;
        return;
      }

      const guestListContainer = document.createElement('div');
      guestListContainer.style.display = 'flex';
      guestListContainer.style.flexDirection = 'column';
      guestListContainer.style.gap = '8px';

      data.guestList.forEach((guest, idx) => {
        const item = document.createElement('div');
        item.className = 'admin-umat-card is-present';
        item.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="mobile-item-avatar" style="background: var(--maroon-100); color: var(--maroon-800);">${idx + 1}</div>
            <div>
              <div style="font-weight: 700; font-size: 0.9rem; color: var(--ink);">${escapeHTML(guest.name)}</div>
              <div style="font-size: 0.75rem; color: var(--ink-50);">
                ${guest.phone} &bull; Domisili: <strong>${escapeHTML(guest.domicile || '-')}</strong>
              </div>
              <div style="font-size: 0.725rem; color: var(--maroon-700); margin-top: 2px;">
                Keperluan: ${escapeHTML(guest.purpose || 'Puja Bakti')}
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="pill-status hadir">Jam Masuk: ${guest.timeStr}</span>
          </div>
        `;
        guestListContainer.appendChild(item);
      });

      contentBox.appendChild(guestListContainer);
    }
  }

  // Handler Set Hadir Umat di dalam Modal Popup
  window.handleAssignUmatInModal = function(userId) {
    if (!currentPopupEventId) return;
    const res = ViharaAdmin.assignUmatPresentToEvent(userId, currentPopupEventId);
    if (res.success) {
      showToast(res.message, 'success');
      renderEventAttendanceModalContent();
      renderAdminDashboard();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handler Tambah Umat Baru Langsung Set Hadir di dalam Modal
  window.handleAddNewUmatInModal = function() {
    if (!currentPopupEventId) return;
    const nameInput = document.getElementById('modal-new-umat-name');
    const phoneInput = document.getElementById('modal-new-umat-phone');
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !phone) {
      showToast('Nama dan nomor telepon wajib diisi.', 'warning');
      return;
    }

    const res = ViharaAdmin.registerAndAssignUmatToEvent(name, phone, currentPopupEventId);
    if (res.success) {
      showToast(res.message, 'success');
      nameInput.value = '';
      phoneInput.value = '';
      renderEventAttendanceModalContent();
      renderAdminDashboard();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Unduh CSV Khusus Acara yang Sedang Dibuka di Popup
  window.handleExportCurrentEventCSV = function() {
    if (!currentPopupEventId) return;
    ViharaAdmin.exportEventToCSV(currentPopupEventId);
  };

  // Event Listener Pencarian di dalam Modal Popup
  const modalSearchInput = document.getElementById('modal-event-search-input');
  if (modalSearchInput) {
    modalSearchInput.addEventListener('input', (e) => {
      currentPopupSearch = e.target.value;
      renderEventAttendanceModalContent();
    });
  }

  // ==========================================================================
  // [INDEX: JS-APP-06] VIEW 6: FORMULIR PEMBUATAN ACARA KEBAKTIAN BARU (ADMIN)
  // Fungsi: Validasi dan submit pembuatan acara kebaktian baru oleh pengurus.
  // ==========================================================================
  window.selectSpeakerType = function(type, btnEl) {
    const selectEl = document.getElementById('event-input-title');
    if (selectEl) selectEl.value = type;

    document.querySelectorAll('#speaker-type-chips .chip').forEach(c => c.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const speakerInput = document.getElementById('event-input-speaker');
    if (speakerInput) {
      if (type === 'Tidak Ada') {
        speakerInput.disabled = true;
        speakerInput.value = 'Tidak Ada';
        speakerInput.style.backgroundColor = 'var(--maroon-50)';
        speakerInput.style.opacity = '0.65';
        speakerInput.placeholder = 'Tanpa Pembicara / Meditasi Mandiri';
      } else {
        speakerInput.disabled = false;
        speakerInput.style.backgroundColor = '#ffffff';
        speakerInput.style.opacity = '1';
        if (speakerInput.value === 'Tidak Ada') speakerInput.value = '';
        if (type === 'Bhikkhu Sangha') speakerInput.placeholder = 'Bhikkhu Dhammavaro';
        else if (type === 'Romo / Pandita') speakerInput.placeholder = 'Romo Pandita Sukarto';
        else speakerInput.placeholder = 'Nama Penceramah Tamu';
      }
    }
  };

  window.handleAdminCreateEventSubmit = function(event) {
    event.preventDefault();
    const name = document.getElementById('event-input-name').value.trim();
    const date = document.getElementById('event-input-date').value;
    const startTime = document.getElementById('event-input-start').value;
    const endTime = document.getElementById('event-input-end').value;
    const speakerTitle = document.getElementById('event-input-title').value;
    let speaker = document.getElementById('event-input-speaker').value.trim();

    if (speakerTitle === 'Tidak Ada' || !speaker) {
      speaker = 'Tidak Ada';
    }

    const dhammasala = document.getElementById('event-input-dhammasala') ? document.getElementById('event-input-dhammasala').value : 'Dhammasala Utama';

    const res = ViharaAdmin.createNewEvent({
      name,
      date,
      startTime,
      endTime,
      speaker,
      speakerTitle,
      dhammasala
    });

    if (res.success) {
      showToast(res.message, 'success');
      document.getElementById('form-create-event').reset();
      document.getElementById('event-input-date').value = ViharaData.getTodayKey();

      const speakerInput = document.getElementById('event-input-speaker');
      if (speakerInput) {
        speakerInput.disabled = false;
        speakerInput.style.backgroundColor = '#ffffff';
        speakerInput.style.opacity = '1';
      }
      const firstChip = document.querySelector('#speaker-type-chips .chip');
      if (firstChip) selectSpeakerType('Bhikkhu Sangha', firstChip);

      renderAdminDashboard();
      const activeContainer = document.getElementById('admin-active-events-container');
      if (activeContainer) {
        activeContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      showToast(res.message, 'error');
    }
  };

  window.handleAdminSetActiveEvent = function(eventId) {
    const res = ViharaAdmin.setActiveEvent(eventId);
    if (res.success) {
      showToast(res.message, 'success');
      renderAdminDashboard();
    } else {
      showToast(res.message, 'error');
    }
  };

  window.handleAdminDeleteEvent = function(eventId) {
    if (confirm('Yakin ingin menghapus jadwal kebaktian ini?')) {
      const res = ViharaAdmin.deleteEvent(eventId);
      if (res.success) {
        showToast(res.message, 'info');
        renderAdminDashboard();
      }
    }
  };

  // ==========================================================================
  // [INDEX: JS-APP-07] VIEW 1: AUTH TAB SWITCHER (MASUK VS DAFTAR UMAT BARU)
  // Fungsi: Toggle tab Masuk vs Daftar Akun Baru dan handler submit autentikasi.
  // ==========================================================================
  window.switchAuthTab = function(tabName) {
    const btnLogin = document.getElementById('tab-btn-login');
    const btnReg = document.getElementById('tab-btn-register');
    const formLogin = document.getElementById('auth-form-login');
    const formReg = document.getElementById('auth-form-register');

    if (tabName === 'login') {
      if (btnLogin) btnLogin.classList.add('active');
      if (btnReg) btnReg.classList.remove('active');
      if (formLogin) formLogin.style.display = 'block';
      if (formReg) formReg.style.display = 'none';
    } else {
      if (btnReg) btnReg.classList.add('active');
      if (btnLogin) btnLogin.classList.remove('active');
      if (formReg) formReg.style.display = 'block';
      if (formLogin) formLogin.style.display = 'none';
    }
  };

  // ==========================================================================
  // [INDEX: JS-APP-08] MUTIARA DHAMMA & PETIKAN DHAMMAPADA HARIAN (LOGIN PAGE)
  // Fungsi: Database petikan suci Dhammapada beserta teks Pali & fitur refresh kutipan.
  // ==========================================================================
  const DHAMMAPADA_QUOTES = [
    {
      translation: "Pikiran adalah pelopor dari segala sesuatu, pikiran adalah pemimpin, pikiran adalah pembentuk. Bila seseorang berbicara atau bertindak dengan pikiran murni, kebahagiaan akan menyertainya laksana bayang-bayang yang tak pernah meninggalkan badannya.",
      pali: "\"Manopubbaṅgamā dhammā, manoseṭṭhā manomayā; Manasā ce pasannena, bhāsati vā karoti vā; Tato naṁ sukhamanveti, chāyāva anapāyinī.\"",
      source: "Dhammapada: Yamakavagga (Bait 2)"
    },
    {
      translation: "Kebencian tidak akan pernah berakhir apabila dibalas dengan kebencian. Hanya dengan cinta kasih dan tanpa kebencian, permusuhan akan padam. Inilah hukum abadi yang berlaku sepanjang masa.",
      pali: "\"Na hi verena verāni, sammantīdha kudācanaṁ; Averena ca sammanti, esa dhammo sanantano.\"",
      source: "Dhammapada: Yamakavagga (Bait 5)"
    },
    {
      translation: "Kewaspadaan dan kesadaran penuh adalah jalan menuju kedamaian abadi. Kelengahan adalah jalan menuju kematian. Mereka yang waspada tidak akan mati, tetapi mereka yang lengah sama seperti orang yang telah mati.",
      pali: "\"Appamādo amatapadaṁ, pamādo maccuno padaṁ; Appamattā na mīyanti, ye pamattā yathā matā.\"",
      source: "Dhammapada: Appamādavagga (Bait 21)"
    },
    {
      translation: "Janganlah berbuat jahat, perbanyaklah perbuatan bajik, dan sucikan hati serta pikiran sendiri. Inilah intisari ajaran dari semua Buddha.",
      pali: "\"Sabbapāpassa akaraṇaṁ, kusalassa upasampadā; Sacittapariyodapanaṁ, etaṁ buddhāna sāsanaṁ.\"",
      source: "Dhammapada: Buddhavagga (Bait 183)"
    },
    {
      translation: "Walaupun seseorang dapat menaklukkan ribuan musuh dalam ribuan kali pertempuran, namun sesungguhnya penakluk terbesar dan termulia adalah orang yang mampu menaklukkan dirinya sendiri.",
      pali: "\"Yo sahassaṁ sahassena, saṅgāme mānuse jine; Ekañca jeyyamattānaṁ, sa ve saṅgāmajuttamo.\"",
      source: "Dhammapada: Sahassavagga (Bait 103)"
    },
    {
      translation: "Bagaikan batu karang yang kokoh teguh dan tidak tergoncang oleh badai angin, demikian pula orang bijaksana tidak akan pernah goyah oleh celaan maupun pujian duniawi.",
      pali: "\"Selo yathā ekaghano, vātena na samīrati; Evaṁ nindāpasaṁsāsu, na samiñjanti paṇḍitā.\"",
      source: "Dhammapada: Paṇṇitavagga (Bait 81)"
    },
    {
      translation: "Segala sesuatu yang berkondisi adalah tidak kekal (Anicca). Ketika seseorang melihat kebenaran ini dengan kebijaksanaan, ia akan terbebas dari penderitaan. Inilah jalan menuju kesucian batin.",
      pali: "\"Sabbe saṅkhārā aniccā'ti, yadā paññāya passati; Atha nibbindatī dukkhe, esa maggo visuddhiyā.\"",
      source: "Dhammapada: Maggavagga (Bait 277)"
    }
  ];

  let currentQuoteIndex = 0;

  window.cycleDhammapadaQuote = function() {
    currentQuoteIndex = (currentQuoteIndex + 1) % DHAMMAPADA_QUOTES.length;
    renderDhammapadaQuote();
    renderHomeDhammaQuote();
  };

  window.cycleHomeDhammaQuote = function() {
    currentQuoteIndex = (currentQuoteIndex + 1) % DHAMMAPADA_QUOTES.length;
    renderDhammapadaQuote();
    renderHomeDhammaQuote();
  };

  function renderHomeDhammaQuote() {
    const quote = DHAMMAPADA_QUOTES[currentQuoteIndex];
    const textEl = document.getElementById('home-quote-text');
    const paliEl = document.getElementById('home-quote-pali');
    const sourceEl = document.getElementById('home-quote-source');

    if (textEl && quote) {
      textEl.style.opacity = '0';
      if (paliEl) paliEl.style.opacity = '0';
      setTimeout(() => {
        textEl.innerText = quote.translation;
        if (paliEl) paliEl.innerText = quote.pali;
        if (sourceEl) sourceEl.innerText = quote.source;
        textEl.style.opacity = '1';
        if (paliEl) paliEl.style.opacity = '1';
      }, 150);
    }
  }

  function renderDhammapadaQuote() {
    const quote = DHAMMAPADA_QUOTES[currentQuoteIndex];
    const textEl = document.getElementById('dhammapada-quote-text');
    const paliEl = document.getElementById('dhammapada-quote-pali');
    const sourceEl = document.getElementById('dhammapada-quote-source');

    if (textEl && quote) {
      textEl.style.opacity = '0';
      if (paliEl) paliEl.style.opacity = '0';
      setTimeout(() => {
        textEl.innerText = quote.translation;
        if (paliEl) paliEl.innerText = quote.pali;
        if (sourceEl) sourceEl.innerText = quote.source;
        textEl.style.opacity = '1';
        if (paliEl) paliEl.style.opacity = '1';
      }, 150);
    }
  }

  function initDhammapadaQuotes() {
    const dayIndex = new Date().getDay() % DHAMMAPADA_QUOTES.length;
    currentQuoteIndex = dayIndex;
    renderDhammapadaQuote();
    renderHomeDhammaQuote();
  }

  window.toggleLoginPasswordVisibility = function() {
    const inp = document.getElementById('login-input-password');
    if (inp) {
      inp.type = inp.type === 'password' ? 'text' : 'password';
    }
  };

  window.handleLoginSubmit = async function(event) {
    event.preventDefault();
    const phone = (document.getElementById('login-input-phone')?.value || '').trim();
    const password = (document.getElementById('login-input-password')?.value || '').trim();
    const rememberCheckbox = document.getElementById('login-remember-me');
    const rememberMe = rememberCheckbox ? rememberCheckbox.checked : true;

    if (!phone) {
      showToast('Masukkan nomor telepon Anda.', 'warning');
      return;
    }
    if (!password) {
      showToast('Masukkan kata sandi akun Anda (Default: 123456).', 'warning');
      return;
    }

    const submitBtn = document.getElementById('btn-login-submit');
    const origHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Memeriksa Akun...';
    }

    try {
      // 1. Cek profil pengguna di lokal
      let user = ViharaData.findUserByPhone(phone);

      // 2. Jika belum ada di lokal, ambil data terbaru langsung dari Supabase
      if (!user && typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.fetchProfileByPhone === 'function') {
        const remoteUser = await ViharaSupabase.fetchProfileByPhone(phone);
        if (remoteUser) {
          const users = ViharaData.getUsers();
          const existingIdx = users.findIndex(u => u.phone === remoteUser.phone);
          if (existingIdx !== -1) {
            users[existingIdx] = remoteUser;
          } else {
            users.push(remoteUser);
          }
          localStorage.setItem('vihara_users', JSON.stringify(users));
          user = remoteUser;
        }
      }

      if (!user) {
        showToast('Nomor telepon belum terdaftar. Silakan hubungi pengurus vihara untuk pembuatan akun.', 'error');
        return;
      }

      // 3. Verifikasi Hash Kata Sandi
      const isPasswordValid = await ViharaAuth.verifyPassword(user, password);
      if (!isPasswordValid) {
        showToast('Nomor telepon atau kata sandi tidak cocok. Silakan periksa kembali.', 'error');
        return;
      }

      // 4. Deteksi apakah ini login pertama / kata sandi bawaan yang wajib diganti
      const isDefault = !user.password_hash || 
                        user.password_hash === ViharaAuth.DEFAULT_PASSWORD_HASH || 
                        user.must_change_password === true;

      if (isDefault) {
        ViharaAuth.setPendingFirstLogin(user, rememberMe);
        openModal('modal-force-change-password');
        showToast('Login awal berhasil! Silakan buat kata sandi baru untuk melanjutkan.', 'warning');
        return;
      }

      // 5. Login berhasil langsung ke Beranda
      ViharaData.setSession(user, rememberMe);
      showToast(`Selamat datang, ${user.name}!`, 'success');
      navigateTo('view-umat');
    } catch (err) {
      console.error('Login error:', err);
      showToast('Terjadi kesalahan saat masuk. Periksa jaringan Anda.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origHtml;
      }
    }
  };

  // Handler Ganti Password Wajib (Login Pertama)
  window.handleForceChangePasswordSubmit = async function(event) {
    if (event) event.preventDefault();
    const newPass = (document.getElementById('force-new-password')?.value || '').trim();
    const confPass = (document.getElementById('force-confirm-password')?.value || '').trim();

    if (!newPass || newPass.length < 6) {
      showToast('Kata sandi baru harus minimal 6 karakter!', 'warning');
      return;
    }
    if (newPass !== confPass) {
      showToast('Konfirmasi kata sandi tidak cocok dengan kata sandi baru!', 'error');
      return;
    }
    if (newPass === ViharaAuth.DEFAULT_PASSWORD_PLAIN) {
      showToast('Kata sandi baru tidak boleh sama dengan kata sandi bawaan (123456)!', 'warning');
      return;
    }

    const pending = ViharaAuth.getPendingFirstLogin();
    if (!pending || !pending.user) {
      showToast('Sesi autentikasi telah kedaluwarsa. Silakan masuk kembali.', 'error');
      closeModal('modal-force-change-password');
      return;
    }

    const saveBtn = document.getElementById('btn-save-force-password');
    const origText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerText = 'Menyimpan ke Database...';
    }

    try {
      const newHash = await ViharaAuth.hashPassword(newPass);

      // Simpan ke Supabase jika terhubung
      if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.updateProfilePassword === 'function') {
        await ViharaSupabase.updateProfilePassword(pending.user.phone, newHash);
      }

      // Perbarui user lokal
      const updatedUser = {
        ...pending.user,
        password_hash: newHash,
        must_change_password: false
      };
      ViharaData.updateUser(pending.user.id, {
        password_hash: newHash,
        must_change_password: false
      });

      // Aktifkan sesi login resmi
      ViharaData.setSession(updatedUser, pending.rememberMe);
      ViharaAuth.clearPendingFirstLogin();

      closeModal('modal-force-change-password');
      showToast(`Kata sandi baru berhasil disimpan! Selamat datang, ${updatedUser.name}.`, 'success');
      navigateTo('view-umat');
    } catch (err) {
      console.error('Error simpan password baru:', err);
      showToast('Gagal menyimpan kata sandi baru ke database.', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = origText;
      }
    }
  };

  // Handler Ganti Password Sukarela dari Profil
  window.openUserChangePasswordModal = function() {
    const oldInp = document.getElementById('user-old-password');
    const newInp = document.getElementById('user-new-password');
    const confInp = document.getElementById('user-confirm-password');
    if (oldInp) oldInp.value = '';
    if (newInp) newInp.value = '';
    if (confInp) confInp.value = '';
    openModal('modal-user-change-password');
  };

  window.handleUserChangePasswordSubmit = async function(event) {
    if (event) event.preventDefault();
    const cur = ViharaAuth.currentUser();
    if (!cur) {
      showToast('Silakan masuk terlebih dahulu.', 'warning');
      return;
    }

    const oldPass = (document.getElementById('user-old-password')?.value || '').trim();
    const newPass = (document.getElementById('user-new-password')?.value || '').trim();
    const confPass = (document.getElementById('user-confirm-password')?.value || '').trim();

    if (!oldPass) {
      showToast('Masukkan kata sandi saat ini.', 'warning');
      return;
    }
    const isOldValid = await ViharaAuth.verifyPassword(cur, oldPass);
    if (!isOldValid) {
      showToast('Kata sandi saat ini salah!', 'error');
      return;
    }

    if (!newPass || newPass.length < 6) {
      showToast('Kata sandi baru minimal 6 karakter.', 'warning');
      return;
    }
    if (newPass !== confPass) {
      showToast('Konfirmasi kata sandi tidak cocok!', 'error');
      return;
    }

    const saveBtn = document.getElementById('btn-save-user-password');
    const origText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerText = 'Menyimpan...';
    }

    try {
      const newHash = await ViharaAuth.hashPassword(newPass);
      if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.updateProfilePassword === 'function') {
        await ViharaSupabase.updateProfilePassword(cur.phone, newHash);
      }

      const updatedUser = {
        ...cur,
        password_hash: newHash,
        must_change_password: false
      };
      ViharaData.updateUser(cur.id, {
        password_hash: newHash,
        must_change_password: false
      });
      ViharaData.setSession(updatedUser, true);

      closeModal('modal-user-change-password');
      showToast('Kata sandi akun Anda berhasil diperbarui!', 'success');
    } catch (err) {
      console.error('Error ganti password user:', err);
      showToast('Gagal memperbarui kata sandi.', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = origText;
      }
    }
  };

  window.handleRegisterSubmit = function(event) {
    if (event) event.preventDefault();
    showToast('Pendaftaran mandiri dinonaktifkan. Hubungi pengurus vihara.', 'info');
  };

  window.toggleAdminCodeField = function() {
    // Legacy helper kept for compatibility
  };

  window.handleLogout = function() {
    closeModal('modal-user-profile');
    ViharaAuth.logout();
    updateNotificationsBadge();
    showToast('Anda telah keluar.', 'success');
    navigateTo('view-login');
  };

  // ==========================================================================
  // [INDEX: JS-APP-09] VIEW 5: BUKU TAMU DIGITAL (KUNJUNGAN UMAT LUAR / WALK-IN)
  // Fungsi: Handler formulir buku tamu bagi pengunjung luar non-anggota tetap.
  // ==========================================================================
  window.handleGuestFormSubmit = function(event) {
    event.preventDefault();
    const name = document.getElementById('guest-input-name').value.trim();
    const phone = document.getElementById('guest-input-phone').value.trim();
    const domicile = document.getElementById('guest-input-domicile').value.trim();
    const purpose = document.getElementById('guest-input-purpose').value;

    if (!name || !phone || !domicile) {
      showToast('Mohon lengkapi data buku tamu.', 'warning');
      return;
    }

    const record = ViharaData.addGuestRecord({ name, phone, domicile, purpose });

    document.getElementById('guest-input-name').value = '';
    document.getElementById('guest-input-phone').value = '';
    document.getElementById('guest-input-domicile').value = '';

    document.getElementById('modal-guest-name').innerText = record.name;
    document.getElementById('modal-guest-event').innerText = record.kebaktianName;
    document.getElementById('modal-guest-time').innerText = record.timeStr;
    openModal('modal-guest-success');

    if (currentPopupEventId && currentPopupEventId === record.eventId) {
      renderEventAttendanceModalContent();
    }

    showToast(`Buku Tamu tercatat pada ${record.kebaktianName} (${record.timeStr}).`, 'success');
  };

  // ==========================================================================
  // [INDEX: JS-APP-10] VIEW 7: PROFIL UMAT (HALAMAN DEDIKASI AKUN PENGGUNA)
  // Fungsi: Render kartu profil pengguna aktif, nama, telepon, email, role, & avatar.
  // ==========================================================================
  function renderUserProfile() {
    const user = ViharaAuth.currentUser();
    if (!user) return;

    // Render Elemen Halaman Profil
    const nameEl = document.getElementById('page-profile-name');
    if (nameEl) nameEl.innerText = user.name;
    const phoneEl = document.getElementById('page-profile-phone');
    if (phoneEl) phoneEl.innerText = user.phone;
    const emailEl = document.getElementById('page-profile-email');
    if (emailEl) emailEl.innerText = user.email || '(Belum didaftarkan)';

    const roleEl = document.getElementById('page-profile-role');
    if (roleEl) {
      roleEl.innerText = user.role === 'admin' ? 'Pengurus Vihara (Admin)' : 'Umat Tetap';
      roleEl.className = `user-role-pill ${user.role}`;
    }

    const avatarEl = document.getElementById('page-profile-avatar');
    if (avatarEl) renderUserAvatar(avatarEl, user);

    const btnRemove = document.getElementById('page-btn-remove-avatar');
    if (btnRemove) {
      btnRemove.style.display = user.avatar ? 'inline-flex' : 'none';
    }

    const btnSuper = document.getElementById('btn-profile-superadmin');
    if (btnSuper) {
      btnSuper.style.display = ViharaAuth.isAdmin() ? 'flex' : 'none';
    }
  }

  window.openProfileModal = function() {
    navigateTo('view-profile');
  };

  // Handler Upload Foto Profil (Hanya Foto Profil yang dapat diubah sendiri oleh pengguna)
  window.handleProfilePhotoUpload = function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Mohon pilih file gambar (JPG, PNG, atau WebP).', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const maxDim = 200;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        const user = ViharaAuth.currentUser();
        if (!user) return;

        const updated = ViharaData.updateUser(user.id, { avatar: dataUrl });
        if (updated) {
          ViharaData.setSession(updated);
          renderUmatDashboard();
          renderUserProfile();
          updateNavigationUI(activeView || 'view-profile');
          showToast('Foto profil berhasil diperbarui!', 'success');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  window.handleRemoveProfilePhoto = function() {
    const user = ViharaAuth.currentUser();
    if (!user) return;
    const updated = ViharaData.updateUser(user.id, { avatar: '' });
    if (updated) {
      ViharaData.setSession(updated);
      renderUmatDashboard();
      renderUserProfile();
      updateNavigationUI(activeView || 'view-profile');
      showToast('Foto profil dihapus (menggunakan inisial).', 'info');
    }
  };

  function renderUserAvatar(el, user) {
    if (!el || !user) return;
    if (user.avatar) {
      el.innerHTML = `<img src="${user.avatar}" alt="${escapeHTML(user.name)}">`;
    } else {
      el.innerText = getInitials(user.name);
    }
  }

  // ==========================================================================
  // [INDEX: JS-APP-11] VIEW 4: SISTEM PENGUMUMAN VIHARA (FEED, FORM, DETAIL & BANNER)
  // Fungsi: Feed 2 kolom, detail modal, form admin, upload banner & Roda Dhamma SVG.
  // ==========================================================================
  const ANNOUNCEMENT_STORAGE_KEY = 'vihara_announcements';
  let currentAnnouncementFilter = 'all';
  let currentAnnouncementBanner = '';

  const BANNER_KATHINA_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 450" width="1000" height="450" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bgKathina" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a050e"/>
      <stop offset="50%" stop-color="#5a1322"/>
      <stop offset="100%" stop-color="#190308"/>
    </linearGradient>
    <radialGradient id="sunGlow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#ffd54f" stop-opacity="0.48"/>
      <stop offset="50%" stop-color="#ffb300" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#2a050e" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff3b0"/>
      <stop offset="40%" stop-color="#ffd54f"/>
      <stop offset="100%" stop-color="#e65100"/>
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3.5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect width="1000" height="450" fill="url(#bgKathina)"/>
  <circle cx="500" cy="200" r="260" fill="url(#sunGlow)"/>

  <!-- Golden Stars & Dhamma Light Particles -->
  <circle cx="240" cy="110" r="2.2" fill="#ffe082" opacity="0.6"/>
  <circle cx="760" cy="125" r="2" fill="#ffe082" opacity="0.55"/>
  <circle cx="180" cy="250" r="1.8" fill="#ffe082" opacity="0.45"/>
  <circle cx="820" cy="270" r="2.4" fill="#ffe082" opacity="0.65"/>
  <circle cx="340" cy="330" r="1.5" fill="#ffe082" opacity="0.4"/>
  <circle cx="670" cy="320" r="1.8" fill="#ffe082" opacity="0.5"/>

  <!-- Center Roda Dhamma (Dharmachakra 8 Jari-Jari Ariya Atthangika Magga) -->
  <g transform="translate(500, 195)" filter="url(#softGlow)">
    <!-- Outer Dual Rim -->
    <circle cx="0" cy="0" r="88" fill="none" stroke="url(#goldGradient)" stroke-width="4.5"/>
    <circle cx="0" cy="0" r="76" fill="none" stroke="#ffe082" stroke-width="1.8" opacity="0.8"/>

    <!-- 8 Sacred Jewels on Outer Rim -->
    <circle cx="0" cy="-88" r="3.8" fill="#fff" stroke="#ff8f00" stroke-width="1.2"/>
    <circle cx="62.2" cy="-62.2" r="3.8" fill="#fff" stroke="#ff8f00" stroke-width="1.2"/>
    <circle cx="88" cy="0" r="3.8" fill="#fff" stroke="#ff8f00" stroke-width="1.2"/>
    <circle cx="62.2" cy="62.2" r="3.8" fill="#fff" stroke="#ff8f00" stroke-width="1.2"/>
    <circle cx="0" cy="88" r="3.8" fill="#fff" stroke="#ff8f00" stroke-width="1.2"/>
    <circle cx="-62.2" cy="62.2" r="3.8" fill="#fff" stroke="#ff8f00" stroke-width="1.2"/>
    <circle cx="-88" cy="0" r="3.8" fill="#fff" stroke="#ff8f00" stroke-width="1.2"/>
    <circle cx="-62.2" cy="-62.2" r="3.8" fill="#fff" stroke="#ff8f00" stroke-width="1.2"/>

    <!-- Central Hub (Nabhi) -->
    <circle cx="0" cy="0" r="24" fill="none" stroke="url(#goldGradient)" stroke-width="3.5"/>
    <circle cx="0" cy="0" r="14" fill="none" stroke="#ffe082" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="7" fill="url(#goldGradient)"/>

    <!-- 8 Spokes (Ara) Equidistant 45 Degrees -->
    <line x1="0" y1="-24" x2="0" y2="-76" stroke="url(#goldGradient)" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="0" y1="24" x2="0" y2="76" stroke="url(#goldGradient)" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="-24" y1="0" x2="-76" y2="0" stroke="url(#goldGradient)" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="24" y1="0" x2="76" y2="0" stroke="url(#goldGradient)" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="-17" y1="-17" x2="-53.7" y2="-53.7" stroke="url(#goldGradient)" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="17" y1="-17" x2="53.7" y2="-53.7" stroke="url(#goldGradient)" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="-17" y1="17" x2="-53.7" y2="53.7" stroke="url(#goldGradient)" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="17" y1="17" x2="53.7" y2="53.7" stroke="url(#goldGradient)" stroke-width="3.5" stroke-linecap="round"/>
  </g>

  <!-- Lotus Base Pedestal -->
  <path d="M420 310 C460 274, 500 268, 500 268 C500 268, 540 274, 580 310 C535 320, 465 320, 420 310 Z" fill="#ffd54f" opacity="0.38"/>

  <!-- Elegant Banner Typography -->
  <text x="500" y="365" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="800" letter-spacing="4" fill="#ffe082" opacity="0.95">PERAYAAN KATHINA &amp; SANGHADANA 2026</text>
  <text x="500" y="390" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="11" font-weight="600" letter-spacing="2" fill="#ffecb3" opacity="0.7">VIHARA AMURWA BHUMI CIBINONG</text>
</svg>`);

  const BANNER_SMB_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 450" width="1000" height="450" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bgSMB" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#451a03"/>
      <stop offset="50%" stop-color="#9a3412"/>
      <stop offset="100%" stop-color="#2c0c02"/>
    </linearGradient>
    <radialGradient id="warmAura" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#9a3412" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1000" height="450" fill="url(#bgSMB)"/>
  <circle cx="500" cy="200" r="230" fill="url(#warmAura)"/>
  <circle cx="280" cy="110" r="2.2" fill="#fef08a" opacity="0.8"/>
  <circle cx="720" cy="100" r="2.2" fill="#fef08a" opacity="0.7"/>
  <circle cx="200" cy="260" r="2" fill="#fef08a" opacity="0.6"/>
  <circle cx="800" cy="280" r="2" fill="#fef08a" opacity="0.75"/>
  <g transform="translate(500, 190)">
    <path d="M0 -75 C45 -38, 60 12, 32 55 C16 75, -16 75, -32 55 C-60 12, -45 -38, 0 -75 Z" fill="none" stroke="#fef08a" stroke-width="3" opacity="0.88"/>
    <path d="M0 -75 L0 65" stroke="#fef08a" stroke-width="2" opacity="0.65"/>
    <circle cx="0" cy="10" r="16" fill="none" stroke="#fef08a" stroke-width="2.4"/>
    <circle cx="0" cy="10" r="5" fill="#fef08a"/>
  </g>
  <text x="500" y="365" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="800" letter-spacing="4" fill="#fef08a" opacity="0.95">SEKOLAH MINGGU BUDDHIS (SMB) 2026</text>
  <text x="500" y="390" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="11" font-weight="600" letter-spacing="2" fill="#fef9c3" opacity="0.7">VIHARA AMURWA BHUMI CIBINONG</text>
</svg>`);

  // ==========================================================================
  // SISTEM PELACAKAN STATUS BACA PENGUMUMAN PER-PENGGUNA (PER-USER READ TRACKING)
  // Setiap user memiliki daftar warta yang sudah dibacanya sendiri secara terpisah.
  // ==========================================================================
  function getUserReadStorageKey() {
    const cur = typeof ViharaAuth !== 'undefined' ? ViharaAuth.currentUser() : null;
    if (cur && (cur.id || cur.phone)) {
      return `vihara_read_announcements_${cur.id || cur.phone}`;
    }
    return 'vihara_read_announcements_guest';
  }

  function getUserReadAnnouncementIds() {
    try {
      const raw = localStorage.getItem(getUserReadStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  function isAnnouncementReadByUser(annId) {
    if (!annId) return false;
    const readIds = getUserReadAnnouncementIds();
    return readIds.includes(String(annId));
  }

  function markAnnouncementAsReadByUser(annId) {
    if (!annId) return;
    const key = getUserReadStorageKey();
    const readIds = getUserReadAnnouncementIds();
    const strId = String(annId);
    if (!readIds.includes(strId)) {
      readIds.push(strId);
      localStorage.setItem(key, JSON.stringify(readIds));
    }
  }

  function getStoredAnnouncements() {
    const defaultAnnouncements = []; // Data awal bersih tanpa dummy sesuai permintaan produksi

    try {
      let data = localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
      if (!data) {
        data = localStorage.getItem('vihara_user_announcements_v5') || localStorage.getItem('vihara_announcements_list');
      }
      if (data) {
        let parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Bersihkan notifikasi otomatis kehadiran/jadwal sesuai instruksi:
          // "ini gaperlu, kalo ada kebaktian ato berhasil absensi gaperlu dibikin"
          const cleaned = parsed.filter(item => {
            if (item.type === 'attendance' || item.type === 'event') return false;
            const t = (item.title || '').toLowerCase();
            if (t.includes('presensi') || t.includes('jadwal kebaktian baru')) return false;
            return true;
          });
          if (cleaned.length !== parsed.length || !localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY)) {
            localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(cleaned));
            localStorage.setItem('vihara_user_announcements_v5', JSON.stringify(cleaned));
            localStorage.setItem('vihara_announcements_list', JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
    } catch (e) {}

    localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(defaultAnnouncements));
    localStorage.setItem('vihara_user_announcements_v5', JSON.stringify(defaultAnnouncements));
    localStorage.setItem('vihara_announcements_list', JSON.stringify(defaultAnnouncements));
    return defaultAnnouncements;
  }

  function getCategoryBadgeClass(category) {
    if (!category) return 'badge-kebaktian';
    const c = category.toLowerCase();
    if (c.includes('kebaktian')) return 'badge-kebaktian';
    if (c.includes('sosial') || c.includes('donor')) return 'badge-sosial';
    if (c.includes('dhamma') || c.includes('smb')) return 'badge-dhamma';
    return 'badge-pengurus';
  }

  window.openAnnouncementDetail = function(annId) {
    const list = getStoredAnnouncements();
    const item = list.find(n => n.id === annId);
    if (!item) return;

    // Tandai sudah dibaca khusus untuk user yang sedang login saat ini (Per-User Read Tracking)
    markAnnouncementAsReadByUser(annId);

    // Hilangkan efek glow aura merah dan badge "Baru" dari kartu ini seketika di DOM
    const cardEl = document.querySelector(`[data-announcement-id="${annId}"]`);
    if (cardEl) {
      cardEl.classList.remove('unread');
      const unreadBadges = cardEl.querySelectorAll('.announcement-unread-badge');
      unreadBadges.forEach(b => b.remove());
    }

    updateNotificationsBadge();

    // 1. POPULATE DEDICATED PAGE VIEW (#view-announcement-detail - Anti-Popup)
    const pageBadge = document.getElementById('page-detail-badge');
    const pageDate = document.getElementById('page-detail-date');
    const pageTitle = document.getElementById('page-detail-title');
    const pageContent = document.getElementById('page-detail-content');
    const pageBannerWrap = document.getElementById('page-detail-banner-wrap');
    const pageBannerImg = document.getElementById('page-detail-banner-img');
    const pageShareBtn = document.getElementById('page-detail-btn-share');
    const pageDeleteBtn = document.getElementById('page-detail-btn-delete');

    const badgeClass = getCategoryBadgeClass(item.category);
    if (pageBadge) {
      pageBadge.className = `announcement-badge ${badgeClass}`;
      pageBadge.textContent = item.category || 'Warta Vihara';
    }
    if (pageDate) {
      pageDate.textContent = item.time || item.date || 'Hari ini';
    }
    if (pageTitle) {
      pageTitle.textContent = item.title;
    }
    if (pageContent) {
      const paragraphs = (item.message || '').split(/\n\s*\n/);
      pageContent.innerHTML = paragraphs
        .map(p => `<p>${escapeHTML(p.trim()).replace(/\n/g, '<br>')}</p>`)
        .join('');
    }
    if (pageBannerWrap && pageBannerImg) {
      if (item.banner && item.banner.trim() !== '') {
        pageBannerImg.src = item.banner;
        pageBannerWrap.style.display = 'block';
      } else {
        pageBannerWrap.style.display = 'none';
      }
    }
    if (pageShareBtn) {
      pageShareBtn.onclick = () => handleShareAnnouncement(item.id);
    }
    if (pageDeleteBtn) {
      const isAdmin = typeof ViharaAuth !== 'undefined' && ViharaAuth.isAdmin && ViharaAuth.isAdmin();
      pageDeleteBtn.style.display = isAdmin ? 'inline-flex' : 'none';
      if (item.archived) {
        pageDeleteBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          <span>Pulihkan ke Beranda</span>
        `;
        pageDeleteBtn.onclick = () => {
          handleRestoreAnnouncement(item.id);
          navigateTo('view-announcements');
        };
      } else {
        pageDeleteBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>Arsipkan Pengumuman</span>
        `;
        pageDeleteBtn.onclick = () => {
          handleArchiveAnnouncement(item.id);
          navigateTo('view-announcements');
        };
      }
    }

    // Navigasi ke halaman detail warta utuh (Bukan popup modal)
    navigateTo('view-announcement-detail');
  };

  function renderAnnouncementsPage(skipRemoteSync = false) {
    const feed = document.getElementById('page-announcements-feed');
    if (!feed) return;

    // Sinkronisasi background dari Supabase untuk update multi-device real-time
    if (!skipRemoteSync && typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.syncAnnouncements === 'function') {
      ViharaSupabase.syncAnnouncements().then(synced => {
        if (synced && Array.isArray(synced)) {
          renderAnnouncementsPage(true);
        }
      }).catch(() => {});
    }

    const list = getStoredAnnouncements();
    const isAdmin = typeof ViharaAuth !== 'undefined' && ViharaAuth.isAdmin && ViharaAuth.isAdmin();

    // Tampilkan tombol '+ Buat Pengumuman' hanya jika admin
    const toggleBtn = document.getElementById('btn-toggle-create-announcement');
    if (toggleBtn) {
      toggleBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    }

    // Tampilkan / perbarui filter chip Arsip Pengurus (Khusus Admin)
    const chipArchived = document.getElementById('chip-filter-archived-announcements');
    const badgeArchived = document.getElementById('announcement-archive-count-badge');
    const archivedCount = list.filter(item => item.archived).length;
    if (chipArchived) {
      chipArchived.style.display = isAdmin ? 'inline-flex' : 'none';
    }
    if (badgeArchived) {
      badgeArchived.innerText = archivedCount;
    }

    // Jika bukan admin, pastikan panel form tertutup dan filter bukan 'archived'
    if (!isAdmin) {
      const panel = document.getElementById('panel-create-announcement');
      if (panel) panel.style.display = 'none';
      if (currentAnnouncementFilter === 'archived') {
        currentAnnouncementFilter = 'all';
      }
    }

    // Filter daftar pengumuman (Arsip vs Warta Aktif)
    const isArchiveTab = currentAnnouncementFilter === 'archived' && isAdmin;
    let filteredList = [];

    if (isArchiveTab) {
      filteredList = list.filter(item => item.archived === true);
    } else {
      // Umat dan publik hanya melihat pengumuman aktif (TIDAK terarsip)
      filteredList = list.filter(item => !item.archived);
      if (currentAnnouncementFilter !== 'all') {
        filteredList = filteredList.filter(item => (item.category || '').toLowerCase() === currentAnnouncementFilter.toLowerCase());
      }
    }

    feed.innerHTML = '';

    if (filteredList.length === 0) {
      if (isArchiveTab) {
        feed.innerHTML = `
          <div class="announcement-empty-state">
            <div class="announcement-empty-icon" style="background: rgba(100, 116, 139, 0.1); color: #64748b;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <rect x="1" y="3" width="22" height="5"></rect>
                <line x1="10" y1="12" x2="14" y2="12"></line>
              </svg>
            </div>
            <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--maroon-900); margin-bottom: 4px;">Arsip Pengurus Kosong</h4>
            <p style="font-size: 0.825rem; color: var(--ink-70); max-width: 340px; margin: 0 auto;">Belum ada pengumuman yang diarsipkan. Saat pengurus menghapus pengumuman, pengumuman akan aman tersimpan di sini dan hanya dapat diakses oleh admin.</p>
          </div>
        `;
      } else {
        feed.innerHTML = `
          <div class="announcement-empty-state">
            <div class="announcement-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--maroon-900); margin-bottom: 4px;">Belum Ada Pengumuman</h4>
            <p style="font-size: 0.825rem; color: var(--ink-70); max-width: 320px; margin: 0 auto;">Belum ada kabar pengumuman dalam kategori ini. Silakan periksa kategori lain atau kembali lagi nanti.</p>
          </div>
        `;
      }
      return;
    }

    filteredList.forEach(item => {
      // Cek status baca spesifik per-user (Per-User Read Tracking)
      const isReadByUser = isAnnouncementReadByUser(item.id);
      const isUnread = !isReadByUser && !item.archived;
      const card = document.createElement('article');
      card.className = 'announcement-card' + (isUnread ? ' unread' : '') + (item.archived ? ' card-archived' : '');
      card.setAttribute('data-announcement-id', item.id);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Buka pengumuman: ${item.title}`);
      card.onclick = function() {
        openAnnouncementDetail(item.id);
      };
      card.onkeydown = function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openAnnouncementDetail(item.id);
        }
      };

      const badgeClass = item.archived ? 'badge-archived-pill' : getCategoryBadgeClass(item.category);
      const categoryLabel = item.archived ? 'Arsip Pengurus' : (item.category || 'Warta Vihara');
      const timeLabel = item.time || item.date || 'Hari ini';

      // Banner Header (Jika ada banner)
      let bannerHtml = '';
      const unreadBadgeBanner = (isUnread && !item.archived)
        ? `<span class="announcement-unread-badge" style="background: rgba(225, 29, 72, 0.92); color: #ffffff; border-color: rgba(255,255,255,0.4);"><span class="announcement-unread-dot" style="background: #ffffff; box-shadow: 0 0 6px #ffffff;"></span>Baru</span>`
        : '';

      if (item.banner && item.banner.trim() !== '') {
        bannerHtml = `
          <div class="announcement-banner-wrap">
            <img src="${item.banner}" alt="${escapeHTML(item.title)}" class="announcement-banner-img" loading="lazy">
            <div class="announcement-banner-overlay"></div>
            <div class="announcement-banner-badge" style="display: flex; align-items: center; gap: 6px;">
              <span class="announcement-badge ${badgeClass}">${escapeHTML(categoryLabel)}</span>
              ${unreadBadgeBanner}
            </div>
          </div>
        `;
      }

      // Meta Top
      let metaTopHtml = '';
      const unreadBadgeMeta = (isUnread && !item.archived)
        ? `<span class="announcement-unread-badge"><span class="announcement-unread-dot"></span>Baru</span>`
        : '';

      if (!item.banner || item.banner.trim() === '') {
        metaTopHtml = `
          <div class="announcement-card-meta">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span class="announcement-badge ${badgeClass}">${escapeHTML(categoryLabel)}</span>
              ${unreadBadgeMeta}
            </div>
            <span class="announcement-date-text">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ${escapeHTML(timeLabel)}
            </span>
          </div>
        `;
      } else {
        metaTopHtml = `
          <div class="announcement-date-text" style="margin-bottom: 4px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${escapeHTML(timeLabel)}
          </div>
        `;
      }

      // Tombol Aksi Admin (Arsipkan vs Pulihkan & Hapus Permanen)
      let actionButtonsHtml = '';
      if (isAdmin) {
        if (item.archived) {
          actionButtonsHtml = `
            <button type="button" class="btn-announcement-restore" onclick="event.stopPropagation(); handleRestoreAnnouncement('${item.id}')" title="Pulihkan pengumuman ini ke beranda publik">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              <span>Pulihkan</span>
            </button>
            <button type="button" class="btn-announcement-delete-perm" onclick="event.stopPropagation(); handlePermanentDeleteAnnouncement('${item.id}')" title="Hapus permanen warta ini">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Hapus Permanen</span>
            </button>
          `;
        } else {
          actionButtonsHtml = `
            <button type="button" class="btn-announcement-delete" onclick="event.stopPropagation(); handleArchiveAnnouncement('${item.id}')" title="Pindahkan ke Arsip Pengurus">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <rect x="1" y="3" width="22" height="5"></rect>
                <line x1="10" y1="12" x2="14" y2="12"></line>
              </svg>
              <span>Arsipkan</span>
            </button>
          `;
        }
      }

      card.innerHTML = `
        ${bannerHtml}
        <div class="announcement-card-body">
          ${metaTopHtml}
          <h3 class="announcement-card-title">${escapeHTML(item.title)}</h3>
          <p class="announcement-card-message">${escapeHTML(item.message)}</p>
          <div class="announcement-card-footer">
            <button type="button" class="btn-announcement-share" onclick="event.stopPropagation(); handleShareAnnouncement('${item.id}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              <span>Bagikan Info</span>
            </button>
            ${actionButtonsHtml}
          </div>
        </div>
      `;

      feed.appendChild(card);
    });
  }

  window.handleFilterAnnouncements = function(category) {
    currentAnnouncementFilter = category;
    document.querySelectorAll('.announcement-filter-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-category') === category);
    });
    renderAnnouncementsPage();
  };

  window.toggleCreateAnnouncementPanel = function(forceOpen) {
    const panel = document.getElementById('panel-create-announcement');
    if (!panel) return;

    if (!ViharaAuth.isAdmin()) {
      showToast('Hanya pengurus/admin yang dapat membuat pengumuman.', 'error');
      return;
    }

    const isVisible = panel.style.display === 'block' || (panel.style.display !== 'none' && window.getComputedStyle(panel).display !== 'none');
    const nextState = forceOpen !== undefined ? forceOpen : !isVisible;
    panel.style.display = nextState ? 'block' : 'none';

    const btnText = document.getElementById('btn-create-announcement-text');
    if (btnText) {
      btnText.textContent = nextState ? 'Tutup Formulir' : 'Buat Pengumuman';
    }

    if (nextState) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => {
        const titleInput = document.getElementById('page-announcement-title');
        if (titleInput) titleInput.focus();
      }, 150);
    }
  };

  window.handleAnnouncementBannerUpload = function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Pilih file gambar valid (JPG, PNG, atau WebP).', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const maxDim = 960;
        let width = img.width;
        let height = img.height;

        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.84);
        currentAnnouncementBanner = compressedDataUrl;

        const previewImg = document.getElementById('banner-preview-img');
        const previewWrap = document.getElementById('banner-preview-wrap');
        const dropzoneEmpty = document.getElementById('banner-dropzone-empty');

        if (previewImg) previewImg.src = compressedDataUrl;
        if (previewWrap) previewWrap.style.display = 'block';
        if (dropzoneEmpty) dropzoneEmpty.style.display = 'none';

        showToast('Foto banner berhasil dimuat.', 'info');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  function resetAnnouncementBannerState() {
    currentAnnouncementBanner = '';
    const input = document.getElementById('page-announcement-banner-input');
    if (input) input.value = '';
    const previewWrap = document.getElementById('banner-preview-wrap');
    const dropzoneEmpty = document.getElementById('banner-dropzone-empty');
    if (previewWrap) previewWrap.style.display = 'none';
    if (dropzoneEmpty) dropzoneEmpty.style.display = 'block';
  }

  window.handleRemoveAnnouncementBanner = function() {
    const hadBanner = Boolean(currentAnnouncementBanner);
    resetAnnouncementBannerState();
    if (hadBanner) {
      showToast('Banner dihapus (pengumuman akan tanpa banner).', 'info');
    }
  };

  window.handlePageCreateAnnouncementSubmit = async function(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!ViharaAuth.isAdmin()) {
      showToast('Hanya pengurus/admin yang dapat menerbitkan pengumuman.', 'error');
      return;
    }

    try {
      const titleInput = document.getElementById('page-announcement-title');
      const catInput = document.getElementById('page-announcement-category');
      const msgInput = document.getElementById('page-announcement-message');

      const title = titleInput ? titleInput.value.trim() : '';
      const category = catInput ? catInput.value : 'Kegiatan Kebaktian';
      const message = msgInput ? msgInput.value.trim() : '';

      if (!title || !message) {
        showToast('Judul dan rincian pengumuman wajib diisi.', 'error');
        return;
      }

      const todayKey = typeof ViharaData !== 'undefined' ? ViharaData.getTodayKey() : new Date().toISOString().split('T')[0];
      const dateText = typeof ViharaData !== 'undefined' && typeof ViharaData.formatDateIndonesia === 'function'
        ? ViharaData.formatDateIndonesia(todayKey)
        : 'Hari ini';

      const list = getStoredAnnouncements();
      const newAnnouncement = {
        id: 'ANN_' + String(list.length + 1).padStart(3, '0'),
        type: 'announcement',
        category: category,
        title: title,
        message: message,
        banner: currentAnnouncementBanner || '', // BISA ADA PICTURE BISA JUGA ENGGA
        date: dateText,
        time: 'Baru saja',
        read: false,
        archived: false
      };

      // Simpan langsung ke Supabase terlebih dahulu
      if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.insertAnnouncement === 'function') {
        try {
          const saved = await ViharaSupabase.insertAnnouncement(newAnnouncement);
          if (saved && saved.id) {
            newAnnouncement.id = saved.id;
          }
        } catch (err) {
          console.warn('[Supabase] Warning saat insert announcement:', err);
        }
      }

      list.unshift(newAnnouncement);
      localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(list));
      localStorage.setItem('vihara_user_announcements_v5', JSON.stringify(list));
      localStorage.setItem('vihara_announcements_list', JSON.stringify(list));

      // Reset Form & Banner State tanpa memunculkan popup hapus banner
      if (titleInput) titleInput.value = '';
      if (msgInput) msgInput.value = '';
      resetAnnouncementBannerState();
      toggleCreateAnnouncementPanel(false);

      showToast('Pengumuman berhasil diterbitkan!', 'success');
      renderAnnouncementsPage(true);
      updateNotificationsBadge();
    } catch (err) {
      console.error('[Announcement] Error submit announcement:', err);
      showToast('Gagal menerbitkan pengumuman: ' + err.message, 'error');
    }
  };

  // 1. Pindahkan ke Arsip Pengurus (Soft Delete - Hanya Admin yang Bisa Mengakses)
  window.handleArchiveAnnouncement = function(annId) {
    if (!ViharaAuth.isAdmin()) {
      showToast('Hanya pengurus/admin yang dapat mengarsipkan pengumuman.', 'error');
      return;
    }
    const list = getStoredAnnouncements();
    const item = list.find(n => n.id === annId);
    if (!item) return;

    item.archived = true;
    item.archivedAt = new Date().toISOString();
    localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(list));

    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.archiveAnnouncement === 'function') {
      ViharaSupabase.archiveAnnouncement(annId);
    }
    updateNotificationsBadge();
    showToast('Pengumuman berhasil dipindahkan ke Arsip Pengurus.', 'info');
    renderAnnouncementsPage();
  };

  // 2. Pulihkan Pengumuman dari Arsip ke Beranda Warta Aktif
  window.handleRestoreAnnouncement = function(annId) {
    if (!ViharaAuth.isAdmin()) {
      showToast('Hanya pengurus/admin yang dapat memulihkan pengumuman.', 'error');
      return;
    }
    const list = getStoredAnnouncements();
    const item = list.find(n => n.id === annId);
    if (!item) return;

    item.archived = false;
    delete item.archivedAt;
    localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(list));

    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.restoreAnnouncement === 'function') {
      ViharaSupabase.restoreAnnouncement(annId);
    }
    updateNotificationsBadge();
    showToast('Pengumuman berhasil dipulihkan ke warta utama!', 'success');
    renderAnnouncementsPage();
  };

  // 3. Hapus Permanen Pengumuman dari Database
  window.handlePermanentDeleteAnnouncement = function(annId) {
    if (!ViharaAuth.isAdmin()) {
      showToast('Hanya pengurus/admin yang dapat menghapus pengumuman permanen.', 'error');
      return;
    }
    if (!confirm('Hapus permanen warta pengumuman ini? Data yang terhapus tidak dapat dipulihkan kembali.')) {
      return;
    }
    const list = getStoredAnnouncements().filter(n => n.id !== annId);
    localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(list));
    if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.deleteAnnouncement === 'function') {
      ViharaSupabase.deleteAnnouncement(annId);
    }
    updateNotificationsBadge();
    showToast('Pengumuman dihapus secara permanen.', 'info');
    renderAnnouncementsPage();
  };

  // Kompatibilitas mundur: handleDeleteAnnouncement mengarsipkan data (bukan merusak/destroy)
  window.handleDeleteAnnouncement = function(annId) {
    window.handleArchiveAnnouncement(annId);
  };

  window.handleShareAnnouncement = function(annId) {
    const list = getStoredAnnouncements();
    const item = list.find(n => n.id === annId);
    if (!item) return;

    const shareText = `*${item.title}*\n_${item.category || 'Pengumuman Vihara'} • ${item.time || item.date || ''}_\n\n${item.message}\n\n— *Vihara Amurwa Bhumi Cibinong*`;

    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: shareText
      }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast('Teks pengumuman disalin ke clipboard!', 'success');
      }).catch(() => {
        showToast('Gagal menyalin teks.', 'error');
      });
    } else {
      showToast('Teks pengumuman siap dibagikan.', 'info');
    }
  };

  // Dinonaktifkan: Tidak membuat pengumuman/notifikasi dari aksi presensi atau jadwal baru
  function addNotification() {
    return;
  }

  function updateNotificationsBadge() {
    const list = getStoredAnnouncements().filter(n => !n.archived);
    const unreadCount = list.filter(n => !isAnnouncementReadByUser(n.id)).length;

    // Titik unread pada Bottom Nav
    const dot = document.getElementById('bell-unread-dot');
    if (dot) {
      dot.style.display = unreadCount > 0 ? 'block' : 'none';
    }

    // Indikator unread pada Top Desktop Nav
    const desktopBtn = document.getElementById('desktop-nav-announcement-btn');
    if (desktopBtn) {
      if (unreadCount > 0) {
        desktopBtn.classList.add('has-unread');
      } else {
        desktopBtn.classList.remove('has-unread');
      }
    }

    // Aura unread pada Quick Action Card Beranda
    const quickCard = document.getElementById('quick-action-announcement-card');
    if (quickCard) {
      if (unreadCount > 0) {
        quickCard.classList.add('has-unread');
      } else {
        quickCard.classList.remove('has-unread');
      }
    }
  }

  window.openNotificationsModal = function() {
    // Alihkan langsung ke halaman Pengumuman sesuai permintaan pengguna: "jangan popup mau dijadiin page juga"
    navigateTo('view-announcements');
  };

  window.openAddAnnouncementModal = function() {
    navigateTo('view-announcements');
    setTimeout(() => {
      toggleCreateAnnouncementPanel(true);
    }, 200);
  };

  window.handleNotificationClick = function() {
    navigateTo('view-announcements');
  };

  // Floating Action Button (FAB) Handler
  // Admin: Khusus untuk buat acara baru '+' (Permintaan Admin 2)
  const fabBtn = document.getElementById('bottom-nav-fab-btn');
  if (fabBtn) {
    fabBtn.addEventListener('click', () => {
      if (ViharaAuth.isAdmin()) {
        navigateTo('view-admin');
      }
    });
  }

  // Modal Animation Helpers (Smooth Lift-Up on open + Drop Fade Out on close)
  window.openModal = function(id) {
    const m = document.getElementById(id);
    if (m) {
      m.classList.remove('closing');
      m.classList.add('show');
    }
  };

  window.closeModal = function(id) {
    const m = document.getElementById(id);
    if (m) {
      m.classList.add('closing');
      setTimeout(() => {
        m.classList.remove('show');
        m.classList.remove('closing');
      }, 220);
    }
  };

  window.showToast = function(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  function getInitials(name) {
    if (!name) return 'V';
    const parts = name.trim().split(' ');
    return (parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Setup Nav Event Listeners
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(el.getAttribute('data-nav'));
    });
  });

  const dateInput = document.getElementById('event-input-date');
  if (dateInput) {
    dateInput.value = ViharaData.getTodayKey();
  }

  // ==========================================================================
  // [INDEX: JS-APP-12] SLIDING DESKTOP NAVBAR GLIDER (SILKY SMOOTH EXPO MOTION)
  // Fungsi: Glider indikator geser kapsul navbar desktop dengan fisika bezier halus.
  // ==========================================================================
  function initDesktopNavGlider() {
    const navConfigs = [
      { navId: 'desktop-nav-menu', pillId: 'desktop-nav-sliding-pill' },
      { navId: 'desktop-nav-guest', pillId: 'desktop-nav-guest-sliding-pill' }
    ];

    navConfigs.forEach(({ navId, pillId }) => {
      const nav = document.getElementById(navId);
      const pill = document.getElementById(pillId);
      if (!nav || !pill) return;

      nav.classList.add('has-glider');
      let isFirstSync = true;

      function syncPillTo(targetEl, animate = true) {
        if (!targetEl || targetEl.offsetParent === null) {
          pill.style.opacity = '0';
          return;
        }

        const left = targetEl.offsetLeft;
        const width = targetEl.offsetWidth;

        if (!animate || isFirstSync) {
          pill.style.transition = 'none';
          pill.style.transform = `translate3d(${left}px, 0, 0)`;
          pill.style.width = `${width}px`;
          pill.style.opacity = '1';
          void pill.offsetWidth;
          pill.style.transition = '';
          isFirstSync = false;
        } else {
          pill.style.transform = `translate3d(${left}px, 0, 0)`;
          pill.style.width = `${width}px`;
          pill.style.opacity = '1';
        }
      }

      function syncToActive(animate = true) {
        const activeBtn = nav.querySelector('.nav-link.active');
        syncPillTo(activeBtn, animate);
      }

      window.addEventListener('resize', () => {
        syncToActive(false);
      }, { passive: true });

      nav._syncGlider = syncToActive;
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => syncDesktopNavGliders(false));
    }
  }

  function syncDesktopNavGliders(animate = true) {
    requestAnimationFrame(() => {
      ['desktop-nav-menu', 'desktop-nav-guest'].forEach(id => {
        const nav = document.getElementById(id);
        if (nav && typeof nav._syncGlider === 'function') {
          nav._syncGlider(animate);
        }
      });
    });
  }

  // Mulai Aplikasi
  initDhammapadaQuotes();
  initDesktopNavGlider();

  // Sinkronisasi data real-time dengan Supabase
  if (typeof ViharaSupabase !== 'undefined' && typeof ViharaSupabase.initSync === 'function') {
    ViharaSupabase.initSync().then(() => {
      if (typeof ViharaSupabase.isConfigured === 'function' && ViharaSupabase.isConfigured()) {
        const cur = ViharaAuth.currentUser();
        if (cur) {
          if (activeView === 'view-umat') renderUmatDashboard();
          if (activeView === 'view-announcements') renderAnnouncementsPage();
          if (activeView === 'view-admin') renderAdminDashboard();
        }
      }
    });
  }

  const session = ViharaAuth.currentUser();
  if (session) {
    // Buka index.html pertama kali langsung di Beranda, bukan di Buat Acara
    navigateTo('view-umat');
  } else {
    navigateTo('view-login');
  }

  // ==========================================================================
  // [INDEX: JS-APP-13] PRELOADER SAKRAL RODA DHAMMA (DHARMACHAKRA LOADING CONTROLLER)
  // Fungsi: Pengendali durasi tayang preloader dan transisi keluar saat DOM siap.
  // ==========================================================================
  function hideDhammaPreloader() {
    const preloader = document.getElementById('dhamma-preloader');
    if (!preloader || preloader.classList.contains('loaded')) return;
    preloader.classList.add('loaded');
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 550);
  }

  window.showDhammaLoading = function(message = 'Memuat...') {
    const preloader = document.getElementById('dhamma-preloader');
    if (!preloader) return;
    const sub = preloader.querySelector('.dhamma-preloader-subtitle');
    if (sub) sub.innerText = message;
    preloader.style.display = 'flex';
    void preloader.offsetWidth;
    preloader.classList.remove('loaded');
  };

  window.hideDhammaLoading = function() {
    hideDhammaPreloader();
  };

  // Tutup preloader secara anggun begitu aplikasi dan aset selesai di-render
  if (document.readyState === 'complete') {
    setTimeout(hideDhammaPreloader, 400);
  } else {
    window.addEventListener('load', () => {
      setTimeout(hideDhammaPreloader, 400);
    });
  }
  // Safety timeout jika jaringan lambat
  setTimeout(hideDhammaPreloader, 3200);
});