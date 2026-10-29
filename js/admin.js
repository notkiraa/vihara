/**
 * ============================================================================
 * FILE: js/admin.js - Operasi Administrasi & Presensi Vihara Amurwa Bhumi
 * ============================================================================
 * DAFTAR INDEKS & GLOSARIUM SEKSI CEPAT (QUICK LOOKUP GLOSSARY):
 * Gunakan pencarian ID tag [INDEX: JS-ADMIN-XX] untuk langsung menuju baris kode terkait.
 * ----------------------------------------------------------------------------
 * [INDEX: JS-ADMIN-01] Agregasi Statistik Acara & Metrik Kehadiran (Umat & Tamu)
 * [INDEX: JS-ADMIN-02] Filtering, Pencarian & Detail Daftar Hadir Per Acara
 * [INDEX: JS-ADMIN-03] Toggle Presensi Manual & Walk-in Check-in oleh Pengurus
 * [INDEX: JS-ADMIN-04] Manajemen Jadwal Kebaktian Baru, Event Aktif & Ekspor CSV
 * ============================================================================
 */

/**
 * admin.js - Admin Operations: Manajemen Acara, Popup Daftar Hadir & Presensi per Acara
 * Khusus Vihara Amurwa Bhumi Cibinong
 */

const ViharaAdmin = (() => {

  // ==========================================================================
  // [INDEX: JS-ADMIN-01] AGREGASI STATISTIK ACARA & METRIK KEHADIRAN
  // Fungsi: Menghitung total hadir umat tetap, buku tamu, dan persentase presensi.
  // ==========================================================================
  function getEventsWithStats() {
    const events = ViharaData.getEvents();
    const attendance = ViharaData.getAttendanceList();
    const guests = ViharaData.getGuestList();
    const users = ViharaData.getUsers().filter(u => u.role === 'umat');

    return events.map(evt => {
      // Deduplikasi ketat: 1 umat dihitung tepat 1 kali per acara
      const seenUmat = new Set();
      const uniqueHadirUmat = attendance.filter(a => {
        if (a.eventId !== evt.id) return false;
        const uKey = String(a.userId || a.userPhone || a.userName);
        if (seenUmat.has(uKey)) return false;
        seenUmat.add(uKey);
        return true;
      });
      const hadirGuest = guests.filter(g => g.eventId === evt.id);
      return {
        ...evt,
        hadirUmatCount: uniqueHadirUmat.length,
        hadirGuestCount: hadirGuest.length,
        totalHadir: uniqueHadirUmat.length + hadirGuest.length,
        totalUmatTerdaftar: users.length
      };
    });
  }

  // ==========================================================================
  // [INDEX: JS-ADMIN-02] FILTERING, PENCARIAN & DETAIL DAFTAR HADIR PER ACARA
  // Fungsi: Mengambil data absensi per acara dengan query pencarian nama/telepon.
  // ==========================================================================
  function getEventDetailsAndAttendees(eventId, searchQuery = '') {
    const events = ViharaData.getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return null;

    const allUsers = ViharaData.getUsers().filter(u => u.role === 'umat');
    const rawAttendance = ViharaData.getAttendanceList().filter(a => a.eventId === eventId);
    const seenUmat = new Set();
    const attendance = rawAttendance.filter(a => {
      const uKey = String(a.userId || a.userPhone || a.userName);
      if (seenUmat.has(uKey)) return false;
      seenUmat.add(uKey);
      return true;
    });
    const guests = ViharaData.getGuestList().filter(g => g.eventId === eventId);

    const q = (searchQuery || '').toLowerCase().trim();

    // Map umat dengan status presensi pada acara ini
    const umatList = allUsers
      .filter(u => {
        if (!q) return true;
        return u.name.toLowerCase().includes(q) || u.phone.includes(q);
      })
      .map(u => {
        const record = attendance.find(a => a.userId === u.id);
        return {
          ...u,
          alreadyCheckedIn: !!record,
          checkInTime: record ? record.timeStr : null,
          checkInMethod: record ? (record.method === 'manual_admin' ? 'Manual Admin' : 'Mandiri') : null
        };
      });

    // Filter daftar tamu jika ada pencarian
    const guestList = guests.filter(g => {
      if (!q) return true;
      return g.name.toLowerCase().includes(q) || g.phone.includes(q) || (g.domicile || '').toLowerCase().includes(q);
    });

    return {
      event: event,
      hadirUmatCount: attendance.length,
      hadirGuestCount: guests.length,
      totalHadir: attendance.length + guests.length,
      umatList: umatList,
      guestList: guestList
    };
  }

  // ==========================================================================
  // [INDEX: JS-ADMIN-03] TOGGLE PRESENSI MANUAL & WALK-IN CHECK-IN OLEH PENGURUS
  // Fungsi: Menandai kehadiran umat langsung oleh admin dan pendaftaran on-the-spot.
  // ==========================================================================
  function assignUmatPresentToEvent(userId, eventId) {
    if (!ViharaAuth.isAdmin()) {
      return { success: false, message: 'Akses ditolak.' };
    }

    const events = ViharaData.getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return { success: false, message: 'Acara tidak ditemukan.' };
    }

    const user = ViharaData.getUsers().find(u => u.id === userId);
    if (!user) {
      return { success: false, message: 'Data umat tidak ditemukan.' };
    }

    if (ViharaData.isUserCheckedInEvent(userId, eventId)) {
      return { success: false, message: `${user.name} sudah tercatat hadir pada acara ini.` };
    }

    const record = ViharaData.addAttendanceRecord({
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      eventId: eventId,
      method: 'manual_admin'
    });

    return {
      success: true,
      message: `Berhasil menandai ${user.name} hadir pada ${event.name}.`,
      record: record
    };
  }

  // Tambah Umat Baru & Langsung Set Hadir di Acara tersebut
  function registerAndAssignUmatToEvent(name, phone, eventId) {
    if (!ViharaAuth.isAdmin()) {
      return { success: false, message: 'Akses ditolak.' };
    }
    if (!name || !phone) {
      return { success: false, message: 'Nama dan nomor telepon wajib diisi.' };
    }

    const user = ViharaData.registerUser(name, phone, 'umat');
    return assignUmatPresentToEvent(user.id, eventId);
  }

  // ==========================================================================
  // [INDEX: JS-ADMIN-04] MANAJEMEN JADWAL KEBAKTIAN BARU, EVENT AKTIF & EKSPOR CSV
  // Fungsi: CRUD acara kebaktian baru, set jadwal aktif, dan unduh laporan absensi CSV.
  // ==========================================================================
  function createNewEvent({ name, date, startTime, endTime, speaker, speakerTitle, dhammasala }) {
    if (!ViharaAuth.isAdmin()) return { success: false, message: 'Akses ditolak.' };
    if (!name || !speaker) return { success: false, message: 'Nama acara dan nama Bhikkhu/Romo wajib diisi.' };

    const newEvent = ViharaData.createEvent({
      name,
      date,
      startTime,
      endTime,
      speaker,
      speakerTitle,
      dhammasala
    });

    return {
      success: true,
      message: `Jadwal "${newEvent.name}" berhasil dibuat.`,
      event: newEvent
    };
  }

  function setActiveEvent(eventId) {
    if (!ViharaAuth.isAdmin()) return { success: false, message: 'Akses ditolak.' };
    const active = ViharaData.setActiveEvent(eventId);
    return {
      success: true,
      message: `Jadwal aktif diubah ke: ${active.name}`,
      event: active
    };
  }

  function deleteEvent(eventId) {
    if (!ViharaAuth.isAdmin()) return { success: false, message: 'Akses ditolak.' };
    ViharaData.deleteEvent(eventId);
    return {
      success: true,
      message: 'Jadwal kebaktian berhasil dihapus.'
    };
  }

  // Export CSV khusus acara tertentu
  function exportEventToCSV(eventId) {
    const data = getEventDetailsAndAttendees(eventId, '');
    if (!data || !data.event) {
      alert('Data acara tidak ditemukan.');
      return;
    }

    const event = data.event;
    const attendance = ViharaData.getAttendanceList().filter(a => a.eventId === eventId);
    const guests = ViharaData.getGuestList().filter(g => g.eventId === eventId);

    if (attendance.length === 0 && guests.length === 0) {
      alert(`Belum ada daftar hadir untuk acara "${event.name}".`);
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += `Laporan Daftar Hadir Vihara Amurwa Bhumi Cibinong\n`;
    csvContent += `Acara: ${event.name}\n`;
    csvContent += `Penceramah: ${event.speaker} (${event.speakerTitle})\n`;
    csvContent += `Tanggal: ${event.dateText}\n`;
    csvContent += `Waktu: ${event.timeSchedule}\n`;
    csvContent += `Lokasi: ${event.dhammasala}\n\n`;

    csvContent += 'No,Kategori,Nama Lengkap,Nomor Telepon,Jam Masuk,Keterangan\n';

    let count = 1;

    // Masukkan Umat
    attendance.forEach(item => {
      const row = [
        count++,
        '"Umat Tetap"',
        `"${item.userName.replace(/"/g, '""')}"`,
        `"${item.userPhone}"`,
        `"${item.timeStr}"`,
        `"${item.method === 'manual_admin' ? 'Manual Admin' : 'Mandiri'}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    // Masukkan Buku Tamu Real-time
    guests.forEach(item => {
      const row = [
        count++,
        `"Buku Tamu (${item.domicile || '-'})"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.phone}"`,
        `"${item.timeStr}"`,
        `"${(item.purpose || 'Kunjungan').replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeName = event.name.replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `Daftar_Hadir_${safeName}_${event.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    getEventsWithStats,
    getEventDetailsAndAttendees,
    assignUmatPresentToEvent,
    registerAndAssignUmatToEvent,
    createNewEvent,
    setActiveEvent,
    deleteEvent,
    exportEventToCSV
  };
})();
