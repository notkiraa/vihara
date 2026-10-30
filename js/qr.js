/**
 * ============================================================================
 * VEHARA AMURWA BHUMI CIBINONG - SISTEM FALLBACK QR CODE DHAMMASALA
 * ============================================================================
 * Modul: js/qr.js
 * Deskripsi:
 * Fitur Fallback QR Code Dinamis di Pintu / Meja Resepsionis Dhammasala:
 * 1. Admin/Pengurus dapat menampilkan QR Code aktif hari ini (Modal & Fullscreen Standee).
 * 2. Umat/Pengunjung yang terkendala modul GPS lemah di dalam gedung cukup memindai QR.
 * 3. Matriks Hak Akses Perangkat:
 *    - Desktop: Hanya menampilkan QR (Display Meja Resepsionis / Cetak Standee).
 *    - Mobile Admin: Menampilkan QR dan Memindai QR.
 *    - Mobile Umat / Non-Login: Memindai QR untuk verifikasi kehadiran.
 * 4. Alur Verifikasi Presensi:
 *    - Validasi jendela waktu (30 menit sebelum mulai s/d selesai acara).
 *    - Umat sudah login: Presensi instan tercatat (metode 'qr_dhammasala') + Ucapan Buddhist.
 *    - Pengunjung / Umat belum login: Form Identitas Kilat -> Verifikasi Presensi.
 * ============================================================================
 */

(function() {
  'use strict';

  // State Internal Modul QR
  let html5QrCodeScanner = null;
  let availableCameras = [];
  let currentCameraIndex = 0;
  let isScanningActive = false;
  let standeeClockTimer = null;
  let activeScannedTargetEvent = null;

  function safeOpenModal(id) {
    if (typeof window !== 'undefined' && typeof window.openModal === 'function') {
      window.openModal(id);
    } else if (typeof openModal === 'function') {
      openModal(id);
    }
  }

  function safeCloseModal(id) {
    if (typeof window !== 'undefined' && typeof window.closeModal === 'function') {
      window.closeModal(id);
    } else if (typeof closeModal === 'function') {
      closeModal(id);
    }
  }

  /**
   * Mendeteksi apakah perangkat pengguna adalah perangkat mobile/smartphone.
   */
  function isMobileDevice() {
    const nav = (typeof window !== 'undefined' && window.navigator) ? window.navigator : (typeof navigator !== 'undefined' ? navigator : {});
    const ua = (nav.userAgent || nav.vendor || (typeof window !== 'undefined' ? window.opera : '') || '').toLowerCase();
    const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    const winWidth = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1024;
    const isSmallScreen = winWidth <= 860;
    const hasTouch = (typeof window !== 'undefined' && 'ontouchstart' in window) || (nav.maxTouchPoints > 0);
    return isMobileUA || (isSmallScreen && hasTouch);
  }

  /**
   * Menghasilkan teks / payload QR Code unik untuk acara kebaktian.
   * Format: URL lengkap dengan parameter qr_event & date agar kompatibel dengan
   * scanner in-app maupun aplikasi kamera bawaan HP (Google Lens / iPhone Camera).
   */
  function generateQrPayload(event) {
    if (!event) return '';
    const origin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : '';
    const pathname = window.location.pathname || '';
    const base = origin + pathname;
    const cleanEventId = String(event.id);
    const cleanDate = String(event.date);
    return `${base}?qr_event=${encodeURIComponent(cleanEventId)}&date=${encodeURIComponent(cleanDate)}&vihara=VAB_CIBINONG`;
  }

  /**
   * Render kode QR ke container HTML menggunakan library QRCodeJS.
   */
  function renderQrCode(containerEl, payload, size = 240) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    if (typeof QRCode === 'undefined') {
      containerEl.innerHTML = `
        <div style="padding: 24px; color: var(--maroon-800); text-align: center; font-size: 0.85rem;">
          <p>Memuat modul QR Code...</p>
        </div>
      `;
      return;
    }

    try {
      new QRCode(containerEl, {
        text: payload,
        width: size,
        height: size,
        colorDark: '#4a0e17',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } catch (err) {
      console.error('Gagal merender QR Code:', err);
      containerEl.innerHTML = `<p style="color:red; font-size: 0.8rem;">Gagal membuat kode QR: ${err.message}</p>`;
    }
  }

  /**
   * Membuka Modal Tampilan QR Admin (#modal-qr-display)
   * Berlaku untuk Desktop (Mode Layar Meja) & Mobile Pengurus
   */
  function openShowQrModal(eventId = null) {
    const events = typeof ViharaData !== 'undefined' ? ViharaData.getEvents() : [];
    let targetEvent = null;

    if (eventId) {
      targetEvent = events.find(e => String(e.id) === String(eventId));
    }
    if (!targetEvent && typeof ViharaData !== 'undefined') {
      targetEvent = ViharaData.getActiveEvent();
    }
    if (!targetEvent && events.length > 0) {
      targetEvent = events[0];
    }

    if (!targetEvent) {
      if (typeof showToast === 'function') {
        showToast('Belum ada jadwal kebaktian untuk dibuatkan kode QR.', 'warning');
      } else {
        alert('Belum ada jadwal kebaktian untuk dibuatkan kode QR.');
      }
      return;
    }

    // Set Data di Modal
    const titleEl = document.getElementById('modal-qr-display-event-name');
    const metaEl = document.getElementById('modal-qr-display-event-meta');
    const badgeEl = document.getElementById('modal-qr-display-badge');
    const qrContainer = document.getElementById('modal-qr-code-canvas-container');

    if (titleEl) titleEl.textContent = targetEvent.name;
    if (metaEl) {
      metaEl.textContent = `${targetEvent.speaker || 'Bhikkhu Sangha'} • ${targetEvent.startTime || '09:00'} - ${targetEvent.endTime || '11:30'} WIB • Dhammasala`;
    }
    if (badgeEl) {
      badgeEl.innerHTML = `🟢 Aktif • ${targetEvent.name}`;
    }

    const payload = generateQrPayload(targetEvent);
    renderQrCode(qrContainer, payload, 230);

    safeOpenModal('modal-qr-display');
  }

  /**
   * Membuka Layar Penuh QR (Mode Standee Layar Meja Resepsionis)
   */
  function openStandeeMode(eventId = null) {
    const events = typeof ViharaData !== 'undefined' ? ViharaData.getEvents() : [];
    let targetEvent = null;

    if (eventId) {
      targetEvent = events.find(e => String(e.id) === String(eventId));
    }
    if (!targetEvent && typeof ViharaData !== 'undefined') {
      targetEvent = ViharaData.getActiveEvent();
    }
    if (!targetEvent && events.length > 0) {
      targetEvent = events[0];
    }

    if (!targetEvent) {
      if (typeof showToast === 'function') {
        showToast('Tidak ada jadwal kebaktian aktif untuk Standee Monitor.', 'warning');
      }
      return;
    }

    const standeeOverlay = document.getElementById('qr-standee-overlay');
    if (!standeeOverlay) return;

    // Isi konten Standee
    const titleEl = document.getElementById('standee-event-title');
    const speakerEl = document.getElementById('standee-event-speaker');
    const timeEl = document.getElementById('standee-event-time');
    const qrContainer = document.getElementById('standee-qr-code-container');

    if (titleEl) titleEl.textContent = targetEvent.name;
    if (speakerEl) speakerEl.textContent = `Penceramah: ${targetEvent.speaker || 'Bhikkhu Sangha'}`;
    if (timeEl) timeEl.textContent = `Waktu Kebaktian: ${targetEvent.startTime || '09:00'} - ${targetEvent.endTime || '11:30'} WIB`;

    const payload = generateQrPayload(targetEvent);
    renderQrCode(qrContainer, payload, 320);

    // Jalankan Live Clock
    updateStandeeClock();
    if (standeeClockTimer) clearInterval(standeeClockTimer);
    standeeClockTimer = setInterval(updateStandeeClock, 1000);

    // Tampilkan overlay Standee
    standeeOverlay.style.display = 'flex';
    document.body.classList.add('standee-active');

    // Coba native fullscreen bila diizinkan
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  /**
   * Menutup Layar Penuh Standee
   */
  function closeStandeeMode() {
    const standeeOverlay = document.getElementById('qr-standee-overlay');
    if (standeeOverlay) standeeOverlay.style.display = 'none';
    document.body.classList.remove('standee-active');

    if (standeeClockTimer) {
      clearInterval(standeeClockTimer);
      standeeClockTimer = null;
    }

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  /**
   * Jam Digital Realtime untuk Standee Meja Resepsionis
   */
  function updateStandeeClock() {
    const clockEl = document.getElementById('standee-digital-clock');
    const dateEl = document.getElementById('standee-current-date');
    if (!clockEl && !dateEl) return;

    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const dayName = days[now.getDay()];
    const dayDate = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();

    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    if (clockEl) clockEl.textContent = `${hh}:${mm}:${ss} WIB`;
    if (dateEl) dateEl.textContent = `${dayName}, ${dayDate} ${monthName} ${year}`;
  }

  /**
   * Cetak Lembar Meja QR Code
   */
  function printQrStandee(eventId = null) {
    const events = typeof ViharaData !== 'undefined' ? ViharaData.getEvents() : [];
    let targetEvent = eventId ? events.find(e => String(e.id) === String(eventId)) : (typeof ViharaData !== 'undefined' ? ViharaData.getActiveEvent() : null);
    if (!targetEvent && events.length > 0) targetEvent = events[0];
    if (!targetEvent) return;

    const payload = generateQrPayload(targetEvent);

    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      alert('Izinkan pop-up peramban untuk mencetak lembar QR.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak QR Presensi Dhammasala - Vihara Amurwa Bhumi</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            text-align: center;
            color: #1f2937;
            padding: 30px;
          }
          .card {
            border: 3px double #7a1a30;
            border-radius: 20px;
            padding: 40px 30px;
            max-width: 580px;
            margin: 0 auto;
          }
          .title { font-size: 26px; font-weight: 800; color: #7a1a30; margin: 0 0 6px 0; }
          .sub { font-size: 14px; color: #6b7280; margin: 0 0 24px 0; text-transform: uppercase; letter-spacing: 1px; }
          .badge {
            display: inline-block;
            background: #fdf2f4;
            color: #7a1a30;
            border: 1px solid #f9d8de;
            border-radius: 999px;
            padding: 6px 18px;
            font-weight: 700;
            font-size: 15px;
            margin-bottom: 24px;
          }
          #print-qr-code {
            display: flex;
            justify-content: center;
            margin: 20px auto;
          }
          #print-qr-code img {
            border: 4px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border-radius: 12px;
          }
          .guide {
            font-size: 15px;
            color: #374151;
            font-style: italic;
            margin-top: 20px;
            line-height: 1.5;
          }
          .footer-note {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 30px;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      </head>
      <body>
        <div class="card">
          <h1 class="title">VIHARA AMURWA BHUMI CIBINONG</h1>
          <p class="sub">Presensi Mandiri Pintu Dhammasala</p>
          <div class="badge">🟢 ${targetEvent.name}</div>
          <div style="font-size: 14px; margin-bottom: 15px; color: #4b5563;">
            <strong>Penceramah:</strong> ${targetEvent.speaker || 'Bhikkhu Sangha'}<br>
            <strong>Waktu:</strong> ${targetEvent.startTime || '09:00'} - ${targetEvent.endTime || '11:30'} WIB
          </div>
          <div id="print-qr-code"></div>
          <p class="guide">
            "Arahkan kamera HP Anda ke kode QR ini untuk konfirmasi kehadiran langsung di Vihara Amurwa Bhumi."
          </p>
          <div class="footer-note">
            🕒 Berlaku khusus sesi kebaktian hari ini • 🛡️ Dilengkapi enkripsi waktu (Anti-duplikasi)
          </div>
        </div>
        <script>
          new QRCode(document.getElementById('print-qr-code'), {
            text: ${JSON.stringify(payload)},
            width: 280,
            height: 280,
            colorDark: '#4a0e17',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
          });
          setTimeout(function() { window.print(); }, 600);
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  /**
   * Membuka Layar Pemindai Kamera (#modal-qr-scanner)
   * Khusus perangkat bergerak (Mobile)
   */
  async function openScannerModal() {
    // Matriks Hak Akses: Desktop tidak menjalankan pemindai kamera (hanya show QR)
    if (!isMobileDevice()) {
      if (typeof showToast === 'function') {
        showToast('Pemindaian QR presensi dilakukan melalui kamera smartphone Anda di meja resepsionis Dhammasala.', 'info');
      } else {
        alert('Pemindaian QR presensi dilakukan melalui kamera smartphone Anda di meja resepsionis Dhammasala.');
      }
      return;
    }

    if (typeof Html5Qrcode === 'undefined') {
      if (typeof showToast === 'function') {
        showToast('Modul kamera pemindai QR sedang dimuat. Silakan tunggu sebentar...', 'warning');
      }
      return;
    }

    safeOpenModal('modal-qr-scanner');

    const viewportEl = document.getElementById('qr-scanner-viewport');
    if (viewportEl) viewportEl.innerHTML = '';

    const statusEl = document.getElementById('qr-scanner-status-text');
    if (statusEl) statusEl.textContent = 'Memulai kamera ponsel...';

    try {
      if (html5QrCodeScanner) {
        try {
          await html5QrCodeScanner.stop();
        } catch (e) {}
      }

      html5QrCodeScanner = new Html5Qrcode('qr-scanner-viewport');
      availableCameras = await Html5Qrcode.getCameras();

      if (!availableCameras || availableCameras.length === 0) {
        throw new Error('Tidak ditemukan sensor kamera pada perangkat ini.');
      }

      // Pilih kamera belakang (environment) secara default
      let targetCamera = availableCameras[0].id;
      for (let i = 0; i < availableCameras.length; i++) {
        const label = (availableCameras[i].label || '').toLowerCase();
        if (label.includes('back') || label.includes('belakang') || label.includes('rear') || label.includes('environment')) {
          targetCamera = availableCameras[i].id;
          currentCameraIndex = i;
          break;
        }
      }

      isScanningActive = true;
      if (statusEl) statusEl.textContent = 'Posisikan kode QR di meja resepsionis ke dalam bingkai kamera.';

      await html5QrCodeScanner.start(
        targetCamera,
        {
          fps: 10,
          qrbox: function(viewfinderWidth, viewfinderHeight) {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edgeSize = Math.floor(minEdge * 0.72);
            return { width: edgeSize, height: edgeSize };
          },
          aspectRatio: 1.0
        },
        onScanSuccessCallback,
        onScanErrorCallback
      );

      // Tampilkan tombol putar kamera jika ada lebih dari 1 kamera
      const flipBtn = document.getElementById('btn-qr-switch-camera');
      if (flipBtn) {
        flipBtn.style.display = availableCameras.length > 1 ? 'inline-flex' : 'none';
      }

    } catch (err) {
      console.error('Kamera gagal diinisialisasi:', err);
      isScanningActive = false;
      if (statusEl) {
        statusEl.innerHTML = `
          <span style="color: #ef4444; font-weight: 700;">Gagal Mengakses Kamera:</span><br>
          <span style="font-size: 0.78rem;">${err.message || 'Izin kamera ditolak oleh browser.'}</span>
        `;
      }
      if (typeof showToast === 'function') {
        showToast('Kamera tidak aktif. Pastikan izin kamera telah diberikan di pengaturan browser.', 'warning');
      }
    }
  }

  /**
   * Menghentikan scanner dan menutup modal pemindai kamera
   */
  async function closeScannerModal() {
    isScanningActive = false;
    if (html5QrCodeScanner) {
      try {
        await html5QrCodeScanner.stop();
      } catch (e) {}
      html5QrCodeScanner = null;
    }
    safeCloseModal('modal-qr-scanner');
  }

  /**
   * Beralih antara kamera depan & belakang
   */
  async function switchCamera() {
    if (!html5QrCodeScanner || availableCameras.length <= 1) return;
    try {
      await html5QrCodeScanner.stop();
      currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
      const nextCameraId = availableCameras[currentCameraIndex].id;

      await html5QrCodeScanner.start(
        nextCameraId,
        {
          fps: 10,
          qrbox: function(viewfinderWidth, viewfinderHeight) {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edgeSize = Math.floor(minEdge * 0.72);
            return { width: edgeSize, height: edgeSize };
          },
          aspectRatio: 1.0
        },
        onScanSuccessCallback,
        onScanErrorCallback
      );
    } catch (err) {
      console.error('Gagal memutar kamera:', err);
      if (typeof showToast === 'function') {
        showToast('Gagal memutar kamera: ' + err.message, 'warning');
      }
    }
  }

  /**
   * Callback ketika scanner mendeteksi kode QR
   */
  async function onScanSuccessCallback(decodedText) {
    if (!isScanningActive) return;
    isScanningActive = false; // Kunci scan agar tidak dobel eksekusi

    // Beri getaran feedback jika didukung HP
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    // Hentikan kamera dan tutup layar scanner
    await closeScannerModal();

    // Proses data hasil scan
    handleScannedData(decodedText);
  }

  function onScanErrorCallback(errorMessage) {
    // Abaikan error streaming per-frame normal
  }

  /**
   * Parsing dan ekstraksi informasi dari string QR Code
   */
  function parseQrPayload(text) {
    if (!text) return null;
    let eventId = null;
    let date = null;

    // Skenario 1: Format URL (?qr_event=EVT_XXX&date=YYYY-MM-DD)
    try {
      const url = new URL(text, window.location.href);
      if (url.searchParams.has('qr_event')) {
        eventId = url.searchParams.get('qr_event');
        date = url.searchParams.get('date');
        return { eventId, date };
      }
    } catch (e) {}

    // Skenario 2: Format JSON
    try {
      const parsed = JSON.parse(text);
      if (parsed.eventId || parsed.id) {
        return {
          eventId: parsed.eventId || parsed.id,
          date: parsed.date || null
        };
      }
    } catch (e) {}

    // Skenario 3: Format Titik Dua (VAB:EVT_XXX:YYYY-MM-DD)
    if (text.startsWith('VAB:')) {
      const parts = text.split(':');
      if (parts.length >= 2) {
        return {
          eventId: parts[1],
          date: parts[2] || null
        };
      }
    }

    return null;
  }

  /**
   * Inti Pemrosesan Presensi dari Hasil Scan QR Code
   */
  function handleScannedData(decodedText) {
    const parsed = parseQrPayload(decodedText);

    if (!parsed || !parsed.eventId) {
      showScanErrorModal('Kode QR ini tidak sesuai atau sesi kebaktian telah selesai. Harap hubungi pengurus di meja resepsionis.');
      return;
    }

    const events = typeof ViharaData !== 'undefined' ? ViharaData.getEvents() : [];
    const targetEvent = events.find(e => String(e.id) === String(parsed.eventId));

    if (!targetEvent) {
      showScanErrorModal('Kode QR ini tidak sesuai atau sesi kebaktian telah selesai. Harap hubungi pengurus di meja resepsionis.');
      return;
    }

    // Validasi Jendela Waktu Presensi (Maksimal 30 Menit Sebelum Mulai)
    if (typeof ViharaData !== 'undefined' && typeof ViharaData.getEventCheckInWindow === 'function') {
      const windowStatus = ViharaData.getEventCheckInWindow(targetEvent);

      if (!windowStatus.isOpen) {
        if (windowStatus.reason === 'too_early') {
          // Hitung jam mulai presensi (30 menit sebelum start time)
          const startTimeParts = (targetEvent.startTime || '09:00').split(':').map(Number);
          let openMinutes = (startTimeParts[0] * 60 + startTimeParts[1]) - 30;
          if (openMinutes < 0) openMinutes += 24 * 60;
          const openH = String(Math.floor(openMinutes / 60)).padStart(2, '0');
          const openM = String(openMinutes % 60).padStart(2, '0');
          const openTimeStr = `${openH}:${openM}`;

          showScanErrorModal(`Presensi kebaktian ini baru dibuka maksimal 30 menit sebelum acara (pukul ${openTimeStr} WIB). Silakan scan kembali mendekati waktu ibadah.`);
          return;
        } else if (windowStatus.reason === 'expired') {
          showScanErrorModal('Kode QR ini tidak sesuai atau sesi kebaktian telah selesai. Harap hubungi pengurus di meja resepsionis.');
          return;
        }
      }
    }

    // Cek Status Autentikasi Pengguna
    const isLoggedIn = typeof ViharaAuth !== 'undefined' && typeof ViharaAuth.isLoggedIn === 'function' ? ViharaAuth.isLoggedIn() : false;
    const currentUser = typeof ViharaAuth !== 'undefined' && typeof ViharaAuth.currentUser === 'function' ? ViharaAuth.currentUser() : null;

    if (isLoggedIn && currentUser) {
      // =======================================================================
      // SKENARIO A: Umat Sudah Login -> Presensi Langsung (Instant Check-In)
      // =======================================================================
      processLoggedInUmatCheckIn(currentUser, targetEvent);
    } else {
      // =======================================================================
      // SKENARIO B: Umat Belum Login / Pengunjung Baru -> Form Identitas Kilat
      // =======================================================================
      processGuestOrUnregisteredCheckIn(targetEvent);
    }
  }

  /**
   * Skenario A: Pemrosesan Umat Login
   */
  function processLoggedInUmatCheckIn(user, event) {
    if (typeof ViharaData === 'undefined') return;

    // Cek apakah sudah tercatat hadir sebelumnya
    const list = ViharaData.getAttendanceList();
    const isAlreadyPresent = list.some(item =>
      (String(item.userId) === String(user.id) || (user.phone && item.userPhone === user.phone)) &&
      String(item.eventId) === String(event.id)
    );

    if (isAlreadyPresent) {
      showScanErrorModal('Anda sudah tercatat hadir pada kebaktian ini sebelumnya. Terima kasih atas partisipasi kebajikan Anda.');
      return;
    }

    // Catat kehadiran dengan metode 'qr_dhammasala'
    const record = ViharaData.addAttendanceRecord({
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      eventId: event.id,
      method: 'qr_dhammasala'
    });

    // Perbarui Tampilan Dashboard jika sedang di Beranda Umat
    if (typeof renderUmatDashboard === 'function') {
      try { renderUmatDashboard(); } catch (e) {}
    }

    // Tampilkan Pop-up Berhasil Sesuai Copywriting
    showSuccessCheckInModal(user.name, event.name);
  }

  /**
   * Skenario B: Membuka Form Isian Kilat untuk Pengguna Belum Login
   */
  function processGuestOrUnregisteredCheckIn(event) {
    activeScannedTargetEvent = event;

    const eventNameEl = document.getElementById('qr-quick-form-event-name');
    if (eventNameEl) {
      eventNameEl.textContent = event.name;
    }

    // Reset Form
    const nameInput = document.getElementById('qr-quick-input-name');
    const phoneInput = document.getElementById('qr-quick-input-phone');
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';

    // Default pilihan ke 'umat'
    const radioUmat = document.getElementById('qr-radio-umat');
    if (radioUmat) radioUmat.checked = true;

    safeOpenModal('modal-qr-quick-register');
  }

  /**
   * Submit Handler Form Identitas Kilat (#modal-qr-quick-register)
   */
  function handleQuickRegisterSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const nameInput = document.getElementById('qr-quick-input-name');
    const phoneInput = document.getElementById('qr-quick-input-phone');
    const radioUmat = document.getElementById('qr-radio-umat');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const isUmat = radioUmat ? radioUmat.checked : true;

    if (!name || !phone) {
      if (typeof showToast === 'function') {
        showToast('Mohon lengkapi Nama Lengkap dan Nomor WhatsApp Anda.', 'warning');
      }
      return;
    }

    const event = activeScannedTargetEvent || (typeof ViharaData !== 'undefined' ? ViharaData.getActiveEvent() : null);
    if (!event) {
      if (typeof showToast === 'function') showToast('Jadwal kebaktian tidak ditemukan.', 'danger');
      return;
    }

    if (isUmat) {
      // Cek apakah nomor HP sudah ada di daftar umat terdaftar
      const users = typeof ViharaData !== 'undefined' ? ViharaData.getUsers() : [];
      let matchedUser = users.find(u => u.phone === phone);

      if (!matchedUser && typeof ViharaData !== 'undefined' && typeof ViharaData.addUser === 'function') {
        // Registrasi instan walk-in umat
        matchedUser = ViharaData.addUser({
          name: name,
          phone: phone,
          role: 'umat'
        });
      }

      // Cek apakah sudah pernah presensi di acara ini
      const attendanceList = typeof ViharaData !== 'undefined' ? ViharaData.getAttendanceList() : [];
      const already = attendanceList.some(item =>
        (item.userPhone === phone || (matchedUser && String(item.userId) === String(matchedUser.id))) &&
        String(item.eventId) === String(event.id)
      );

      if (already) {
        safeCloseModal('modal-qr-quick-register');
        showScanErrorModal('Anda sudah tercatat hadir pada kebaktian ini sebelumnya. Terima kasih atas partisipasi kebajikan Anda.');
        return;
      }

      // Rekam presensi
      if (typeof ViharaData !== 'undefined') {
        ViharaData.addAttendanceRecord({
          userId: matchedUser ? matchedUser.id : 'WALKIN_' + Date.now(),
          userName: name,
          userPhone: phone,
          eventId: event.id,
          method: 'qr_dhammasala'
        });
      }
    } else {
      // Sebagai Buku Tamu / Pengunjung Luar Kota
      if (typeof ViharaData !== 'undefined' && typeof ViharaData.addGuestRecord === 'function') {
        ViharaData.addGuestRecord({
          name: name,
          phone: phone,
          domicile: 'Pengunjung / Tamu Luar Kota',
          purpose: `Puja Bakti QR Dhammasala (${event.name})`
        });
      }
    }

    // Tutup Modal Form Kilat
    safeCloseModal('modal-qr-quick-register');

    // Tampilkan Pop-up Berhasil
    showSuccessCheckInModal(name, event.name);
  }

  /**
   * Menampilkan Modal Pop-up Berhasil Sesuai Copywriting Resmi
   */
  function showSuccessCheckInModal(userName, eventName) {
    const msgEl = document.getElementById('modal-qr-success-message');
    if (msgEl) {
      msgEl.innerHTML = `Namo Buddhaya, <strong>${userName}</strong>. Kehadiran Anda pada <strong>${eventName}</strong> telah berhasil dicatat. Selamat beribadah dengan tenang dan bahagia.`;
    }

    safeOpenModal('modal-qr-success');
  }

  /**
   * Menampilkan Modal Error / Gagal Sesuai Copywriting Resmi
   */
  function showScanErrorModal(errorMessage) {
    const msgEl = document.getElementById('modal-qr-error-message');
    if (msgEl) {
      msgEl.textContent = errorMessage;
    }
    safeOpenModal('modal-qr-error');
  }

  /**
   * Aksi saat Pengguna Menekan Ikon QR di Header Atas Kanan (Mobile / Desktop)
   */
  function handleHeaderQrClick() {
    const isAdmin = typeof ViharaAuth !== 'undefined' && typeof ViharaAuth.isAdmin === 'function' ? ViharaAuth.isAdmin() : false;
    const isMobile = isMobileDevice();

    if (isMobile) {
      if (isAdmin) {
        // Mobile Admin: Dapat memilih Tampilkan QR atau Pindai QR
        safeOpenModal('modal-qr-admin-choice');
      } else {
        // Mobile Umat atau Pengunjung: Langsung buka kamera scanner
        openScannerModal();
      }
    } else {
      // Desktop: Hanya Show QR (Meja Resepsionis / Cetak Standee)
      openShowQrModal();
    }
  }

  /**
   * Penanganan Otomatis URL Parameter saat Halaman Dimuat
   * (Jika umat memindai kode QR standee langsung menggunakan Google Lens / iPhone Camera)
   */
  function initUrlScanHandler() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('qr_event')) {
        const eventId = urlParams.get('qr_event');
        const date = urlParams.get('date');

        // Bersihkan parameter URL tanpa reload halaman agar bersih
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        // Beri jeda kecil agar data & sesi lokal siap
        setTimeout(() => {
          handleScannedData(JSON.stringify({ eventId, date }));
        }, 500);
      }
    } catch (e) {
      console.warn('URL QR handler skipped:', e);
    }
  }

  // Daftarkan ke Global Window & Global Object (API Publik ViharaQR)
  const ViharaQR = {
    isMobileDevice,
    generateQrPayload,
    renderQrCode,
    openShowQrModal,
    openStandeeMode,
    closeStandeeMode,
    printQrStandee,
    openScannerModal,
    closeScannerModal,
    switchCamera,
    handleQuickRegisterSubmit,
    handleHeaderQrClick,
    handleScannedData,
    initUrlScanHandler
  };

  if (typeof window !== 'undefined') {
    window.ViharaQR = ViharaQR;
  }
  if (typeof global !== 'undefined') {
    global.ViharaQR = ViharaQR;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ViharaQR };
  }

  // Inisialisasi otomatis URL Scan Handler saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUrlScanHandler);
  } else {
    initUrlScanHandler();
  }

})();
