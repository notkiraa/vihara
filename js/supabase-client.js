/**
 * ============================================================================
 * FILE: js/supabase-client.js - Client Integrasi Database Supabase
 * ============================================================================
 * Vihara Amurwa Bhumi Cibinong
 * Berfungsi untuk menghubungkan aplikasi web langsung dengan PostgreSQL Supabase.
 * ============================================================================
 */

const ViharaSupabase = (() => {
  // Kunci API Resmi Supabase Vihara Amurwa Bhumi Cibinong
  const CONFIG = {
    url: 'https://fsozsqswkbmjlqdnhozi.supabase.co',
    anonKey: 'sb_publishable_GxKRB6rsN0IVsrGRR8BTfA_yHc-NGYO'
  };

  let client = null;

  function isConfigured() {
    return Boolean(
      CONFIG.url && 
      CONFIG.anonKey && 
      CONFIG.url.startsWith('https://') && 
      CONFIG.anonKey.length > 20
    );
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (!client && window.supabase && typeof window.supabase.createClient === 'function') {
      client = window.supabase.createClient(CONFIG.url, CONFIG.anonKey);
    }
    return client;
  }

  // ==========================================================================
  // SINKRONISASI DATA DARI SUPABASE KE DATA LAYER
  // ==========================================================================

  // 0. Sinkronisasi Data Profil Pengguna (Umat & Admin)
  async function syncProfiles() {
    const sb = getClient();
    if (!sb) return null;
    try {
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      if (data && Array.isArray(data)) {
        const mapped = data.map(p => ({
          id: String(p.id),
          name: p.name,
          phone: p.phone,
          email: p.email || '',
          avatar: p.avatar_url || '',
          password_hash: p.password_hash || '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
          must_change_password: p.must_change_password !== false,
          role: p.role || 'umat',
          registeredAt: p.created_at ? p.created_at.split('T')[0] : (typeof ViharaData !== 'undefined' ? ViharaData.getTodayKey() : '2026-01-01')
        }));

        if (mapped.length > 0) {
          localStorage.setItem('vihara_users', JSON.stringify(mapped));
          // Update active session jika user yang sedang login diperbarui
          const cur = typeof ViharaAuth !== 'undefined' ? ViharaAuth.currentUser() : null;
          if (cur) {
            const updatedCur = mapped.find(u => u.phone === cur.phone);
            if (updatedCur) {
              localStorage.setItem('vihara_session', JSON.stringify(updatedCur));
            }
          }
          return mapped;
        }
      }
    } catch (err) {
      console.warn('[Supabase] Gagal sinkronisasi profiles:', err.message);
    }
    return null;
  }

  // 0b. Tambah / Registrasi Profil Pengguna Baru ke Supabase (Upsert via Nomor HP)
  async function insertProfile(user) {
    const sb = getClient();
    if (!sb) return null;
    try {
      const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');
      if (!cleanPhone) return null;

      const cleanEmail = user.email && user.email.includes('@') ? user.email.trim().toLowerCase() : null;
      const payload = {
        name: (user.name || '').trim(),
        phone: cleanPhone,
        email: cleanEmail,
        password_hash: user.password_hash || '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
        must_change_password: user.must_change_password !== false,
        role: user.role || 'umat',
        avatar_url: user.avatar || null
      };

      if (user.id) {
        payload.id = String(user.id);
      }

      let { data, error } = await sb
        .from('profiles')
        .upsert([payload], { onConflict: 'phone' })
        .select()
        .single();

      if (error && (error.code === 'PGRST204' || error.message.includes('password_hash') || error.message.includes('must_change_password'))) {
        delete payload.password_hash;
        delete payload.must_change_password;
        const retryRes = await sb
          .from('profiles')
          .upsert([payload], { onConflict: 'phone' })
          .select()
          .single();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) throw error;
      console.info('[Supabase] Akun berhasil tersimpan ke database tabel profiles:', data);
      return data;
    } catch (err) {
      console.error('[Supabase] Gagal insert/upsert profile:', err.message);
    }
    return null;
  }

  // 0c. Ambil Profil Berdasarkan Nomor Telepon (Multi-Device Login)
  async function fetchProfileByPhone(phone) {
    const sb = getClient();
    if (!sb) return null;
    try {
      const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
      if (!cleanPhone) return null;

      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        return {
          id: String(data.id),
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          avatar: data.avatar_url || '',
          password_hash: data.password_hash || '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
          must_change_password: data.must_change_password !== false,
          role: data.role || 'umat',
          registeredAt: data.created_at ? data.created_at.split('T')[0] : (typeof ViharaData !== 'undefined' ? ViharaData.getTodayKey() : '2026-01-01')
        };
      }
    } catch (err) {
      console.warn('[Supabase] Gagal fetch profile by phone:', err.message);
    }
    return null;
  }

  // 0d. Batch Input Data Pengguna ke Supabase (Bulk Insert/Upsert)
  async function batchInsertProfiles(usersList) {
    const sb = getClient();
    if (!sb) return { success: false, message: 'Supabase client belum siap.' };
    if (!Array.isArray(usersList) || usersList.length === 0) {
      return { success: false, message: 'Data umat kosong.' };
    }

    try {
      const validProfiles = [];
      for (const u of usersList) {
        const cleanPhone = (u.phone || '').replace(/[^0-9]/g, '');
        const cleanName = (u.name || '').trim();
        if (!cleanPhone || !cleanName) continue;

        const cleanEmail = u.email && u.email.includes('@') ? u.email.trim().toLowerCase() : null;
        const profile = {
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          password_hash: u.password_hash || '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
          must_change_password: u.must_change_password !== false,
          role: u.role === 'admin' ? 'admin' : 'umat',
          avatar_url: u.avatar || null
        };
        if (u.id) profile.id = String(u.id);
        validProfiles.push(profile);
      }

      if (validProfiles.length === 0) {
        return { success: false, message: 'Tidak ada data valid dengan Nama & No. HP.' };
      }

      let { data, error } = await sb
        .from('profiles')
        .upsert(validProfiles, { onConflict: 'phone' })
        .select();

      if (error && (error.code === 'PGRST204' || error.message.includes('password_hash') || error.message.includes('must_change_password'))) {
        const fallback = validProfiles.map(u => ({
          name: u.name,
          phone: u.phone,
          email: u.email,
          role: u.role,
          avatar_url: u.avatar_url
        }));
        const retryRes = await sb
          .from('profiles')
          .upsert(fallback, { onConflict: 'phone' })
          .select();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) throw error;

      await syncProfiles();

      return {
        success: true,
        count: validProfiles.length,
        data: data
      };
    } catch (err) {
      console.error('[Supabase] Gagal batch insert profiles:', err);
      return { success: false, message: err.message };
    }
  }

  // 0e. Update Kata Sandi Pengguna (Hashed SHA-256)
  async function updateProfilePassword(phoneOrId, newPasswordHash) {
    const sb = getClient();
    if (!sb) return false;
    try {
      const cleanPhone = String(phoneOrId).replace(/[^0-9]/g, '');
      const payload = {
        password_hash: newPasswordHash,
        must_change_password: false,
        updated_at: new Date().toISOString()
      };

      let query = sb.from('profiles').update(payload);
      if (cleanPhone.length >= 8) {
        query = query.eq('phone', cleanPhone);
      } else {
        query = query.eq('id', String(phoneOrId));
      }

      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[Supabase] Gagal update password profile:', err.message);
      return false;
    }
  }

  // 0d. Perbarui Profil Pengguna di Supabase
  async function updateProfile(phoneOrId, updates) {
    const sb = getClient();
    if (!sb) return null;
    try {
      const payload = {};
      if (updates.name !== undefined) payload.name = updates.name.trim();
      if (updates.email !== undefined) {
        payload.email = updates.email && updates.email.includes('@') ? updates.email.trim().toLowerCase() : null;
      }
      if (updates.role !== undefined) payload.role = updates.role;
      if (updates.avatar !== undefined) payload.avatar_url = updates.avatar || null;

      let query = sb.from('profiles').update(payload);
      const strId = String(phoneOrId);
      if (strId.startsWith('USR_') || strId.startsWith('ADM_') || /^\d+$/.test(strId)) {
        query = query.eq('id', strId);
      } else {
        query = query.eq('phone', strId.replace(/[^0-9]/g, ''));
      }
      const { data, error } = await query.select().maybeSingle();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[Supabase] Gagal update profile:', err.message);
    }
    return null;
  }

  // 0e. Hapus Profil Pengguna di Supabase
  async function deleteProfile(phoneOrId) {
    const sb = getClient();
    if (!sb) return false;
    try {
      const strId = String(phoneOrId);
      let query = sb.from('profiles').delete();
      if (strId.startsWith('USR_') || strId.startsWith('ADM_') || /^\d+$/.test(strId)) {
        query = query.eq('id', strId);
      } else {
        query = query.eq('phone', strId.replace(/[^0-9]/g, ''));
      }
      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[Supabase] Gagal hapus profile:', err.message);
    }
    return false;
  }

  // 1. Sinkronisasi Acara Kebaktian
  async function syncEvents() {
    const sb = getClient();
    if (!sb) return null;
    try {
      const { data, error } = await sb
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (data && Array.isArray(data)) {
        const mapped = data.map(e => ({
          id: e.id,
          name: e.name,
          date: e.date,
          dateText: ViharaData.formatDateIndonesia(e.date),
          startTime: (e.start_time || '09:00:00').slice(0, 5),
          endTime: (e.end_time || '11:00:00').slice(0, 5),
          timeSchedule: `${(e.start_time || '09:00:00').slice(0, 5)} - ${(e.end_time || '11:00:00').slice(0, 5)} WIB`,
          speaker: e.speaker,
          speakerTitle: e.speaker_title,
          dhammasala: e.dhammasala,
          isActive: e.is_active,
          createdAt: e.created_at
        }));
        localStorage.setItem('vihara_events', JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('[Supabase] Gagal sinkronisasi events:', err.message);
    }
    return null;
  }

  function formatTimeForPostgres(timeStr, defaultTime = '09:00:00') {
    if (!timeStr) return defaultTime;
    const parts = timeStr.trim().split(':');
    const h = String(parts[0] || '09').padStart(2, '0');
    const m = String(parts[1] || '00').padStart(2, '0');
    return `${h}:${m}:00`;
  }

  // 2. Tambah Acara ke Supabase
  async function insertEvent(evt) {
    const sb = getClient();
    if (!sb) return null;
    try {
      const curUser = typeof ViharaAuth !== 'undefined' ? ViharaAuth.currentUser() : null;
      const validSpeakerTypes = ['Bhikkhu Sangha', 'Romo / Pandita', 'Upasaka / Upasika', 'Pengurus Vihara', 'Penceramah Tamu', 'Tidak Ada'];
      let safeSpeakerTitle = 'Bhikkhu Sangha';
      if (validSpeakerTypes.includes(evt.speakerTitle)) {
        safeSpeakerTitle = evt.speakerTitle;
      } else if ((evt.speakerTitle || '').includes('Romo')) {
        safeSpeakerTitle = 'Romo / Pandita';
      }

      const payload = {
        id: evt.id,
        name: evt.name,
        date: evt.date,
        start_time: formatTimeForPostgres(evt.startTime, '09:00:00'),
        end_time: formatTimeForPostgres(evt.endTime, '11:00:00'),
        speaker: evt.speaker,
        speaker_title: safeSpeakerTitle,
        dhammasala: evt.dhammasala || 'Dhammasala Utama',
        is_active: evt.isActive,
        created_by: curUser ? curUser.id : 'ADM_001'
      };
      const { data, error } = await sb.from('events').insert([payload]).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[Supabase] Gagal insert event:', err.message);
    }
    return null;
  }

  // 3. Sinkronisasi Warta Pengumuman
  async function syncAnnouncements() {
    const sb = getClient();
    if (!sb) return null;
    try {
      const { data, error } = await sb
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && Array.isArray(data)) {
        // Abaikan entri auto-generated kehadiran/jadwal jika pernah tersimpan di remote db
        const cleaned = data.filter(a => {
          const t = (a.title || '').toLowerCase();
          return !t.includes('presensi') && !t.includes('jadwal kebaktian baru');
        });
        const mapped = cleaned.map(a => ({
          id: a.id,
          category: a.category,
          title: a.title,
          message: a.message,
          banner: a.banner_url || '',
          date: ViharaData.formatDateIndonesia(a.created_at ? a.created_at.split('T')[0] : ViharaData.getTodayKey()),
          time: 'Baru saja',
          read: false,
          archived: a.is_published === false,
          archivedAt: a.is_published === false ? (a.updated_at || a.created_at) : null
        }));
        localStorage.setItem('vihara_announcements', JSON.stringify(mapped));
        localStorage.setItem('vihara_user_announcements_v5', JSON.stringify(mapped));
        localStorage.setItem('vihara_announcements_list', JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('[Supabase] Gagal sinkronisasi announcements:', err.message);
    }
    return null;
  }

  // 4. Tambah Pengumuman ke Supabase
  async function insertAnnouncement(ann) {
    const sb = getClient();
    if (!sb) return null;
    try {
      const curUser = typeof ViharaAuth !== 'undefined' ? ViharaAuth.currentUser() : null;
      const payload = {
        category: ann.category || 'Kegiatan Kebaktian',
        title: (ann.title || '').trim(),
        message: (ann.message || '').trim(),
        banner_url: (ann.banner && ann.banner.trim() !== '') ? ann.banner : null,
        is_published: !ann.archived,
        created_by: curUser ? curUser.id : 'ADM_001'
      };
      if (ann.id && typeof ann.id === 'string' && ann.id.startsWith('ANN_')) {
        payload.id = ann.id;
      }
      const { data, error } = await sb.from('announcements').insert([payload]).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[Supabase] Gagal insert announcement:', err.message);
      throw err;
    }
  }

  // 4b. Arsipkan Pengumuman ke Supabase (Soft delete)
  async function archiveAnnouncement(annId) {
    const sb = getClient();
    if (!sb) return null;
    try {
      const queryId = String(annId);
      const { data, error } = await sb
        .from('announcements')
        .update({ is_published: false })
        .eq('id', queryId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[Supabase] Gagal arsipkan announcement:', err.message);
    }
    return null;
  }

  // 4c. Pulihkan Pengumuman dari Arsip ke Publik
  async function restoreAnnouncement(annId) {
    const sb = getClient();
    if (!sb) return null;
    try {
      const queryId = String(annId);
      const { data, error } = await sb
        .from('announcements')
        .update({ is_published: true })
        .eq('id', queryId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[Supabase] Gagal pulihkan announcement:', err.message);
    }
    return null;
  }

  // 5. Catat Presensi Umat ke Supabase
  async function insertAttendance(eventId, userId, method = 'self_checkin') {
    const sb = getClient();
    if (!sb) return null;
    try {
      let resolvedUserId = String(userId);
      let resolvedEventId = String(eventId);

      // Resolusi userId jika belum berupa format prefix USR_/ADM_
      if (!resolvedUserId.startsWith('USR_') && !resolvedUserId.startsWith('ADM_') && typeof ViharaData !== 'undefined') {
        const localUser = ViharaData.getUsers().find(u => u.id === userId || u.phone === userId);
        if (localUser && localUser.id) {
          resolvedUserId = String(localUser.id);
        }
      }

      // Resolusi eventId jika belum berupa format prefix EVT_
      if (!resolvedEventId.startsWith('EVT_') && typeof ViharaData !== 'undefined') {
        const localEvent = ViharaData.getEvents().find(e => e.id === eventId || e.name === eventId);
        if (localEvent && localEvent.id) {
          resolvedEventId = String(localEvent.id);
        }
      }

      if (!resolvedUserId || !resolvedEventId) {
        console.info('[Supabase] Presensi dicatat di storage lokal.');
        return null;
      }

      const payload = {
        event_id: resolvedEventId,
        user_id: resolvedUserId,
        method: method
      };
      const { data, error } = await sb.from('attendance').upsert([payload], { onConflict: 'event_id,user_id' }).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[Supabase] Gagal catat presensi:', err.message);
    }
    return null;
  }

  // 6. Catat Tamu ke Supabase
  async function insertGuest(guestData) {
    const sb = getClient();
    if (!sb) return null;
    try {
      const payload = {
        event_id: guestData.eventId || null,
        name: guestData.name,
        phone: guestData.phone,
        city: guestData.domicile || guestData.city,
        purpose: guestData.purpose
      };
      if (guestData.id && typeof guestData.id === 'string' && guestData.id.startsWith('GST_')) {
        payload.id = guestData.id;
      }
      const { data, error } = await sb.from('guests').insert([payload]).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[Supabase] Gagal catat guest:', err.message);
    }
    return null;
  }

  // 7. Hapus Acara di Supabase
  async function deleteEvent(eventId) {
    const sb = getClient();
    if (!sb) return null;
    try {
      const { data, error } = await sb.from('events').delete().eq('id', String(eventId));
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[Supabase] Gagal delete event:', err.message);
    }
    return null;
  }

  // 8. Hapus Pengumuman di Supabase
  async function deleteAnnouncement(annId) {
    const sb = getClient();
    if (!sb) return null;
    try {
      const { data, error } = await sb.from('announcements').delete().eq('id', String(annId));
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[Supabase] Gagal delete announcement:', err.message);
    }
    return null;
  }

  // 9. Sinkronisasi Log Presensi Kehadiran Umat dari Supabase
  async function syncAttendance() {
    const sb = getClient();
    if (!sb) return null;
    try {
      const { data, error } = await sb
        .from('attendance')
        .select(`
          id,
          event_id,
          user_id,
          method,
          checkin_time,
          events (id, name, date, speaker),
          profiles (id, name, phone)
        `)
        .order('checkin_time', { ascending: false });

      if (error) throw error;
      if (data && Array.isArray(data)) {
        const mapped = data.map(a => {
          const evt = a.events || {};
          const prof = a.profiles || {};
          const checkinDate = a.checkin_time ? new Date(a.checkin_time) : new Date();
          const timeStr = `${String(checkinDate.getHours()).padStart(2, '0')}:${String(checkinDate.getMinutes()).padStart(2, '0')} WIB`;
          return {
            id: a.id,
            userId: a.user_id,
            userName: prof.name || 'Umat',
            userPhone: prof.phone || '',
            category: 'umat',
            eventId: a.event_id,
            kebaktianName: evt.name || 'Puja Bakti Vihara Amurwa Bhumi',
            speaker: evt.speaker || '-',
            dateKey: evt.date || (a.checkin_time ? a.checkin_time.split('T')[0] : (typeof ViharaData !== 'undefined' ? ViharaData.getTodayKey() : '2026-01-01')),
            timeStr: timeStr,
            timestamp: a.checkin_time,
            method: a.method === 'self_checkin' ? 'mandiri' : 'manual_admin',
            status: 'Hadir'
          };
        });
        localStorage.setItem('vihara_attendance', JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('[Supabase] Gagal sinkronisasi attendance:', err.message);
    }
    return null;
  }

  // 10. Sinkronisasi Buku Tamu Digital dari Supabase
  async function syncGuests() {
    const sb = getClient();
    if (!sb) return null;
    try {
      const { data, error } = await sb
        .from('guests')
        .select(`
          id,
          event_id,
          name,
          phone,
          city,
          purpose,
          created_at,
          events (id, name, date, speaker)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && Array.isArray(data)) {
        const mapped = data.map(g => {
          const evt = g.events || {};
          const createdDate = g.created_at ? new Date(g.created_at) : new Date();
          const timeStr = `${String(createdDate.getHours()).padStart(2, '0')}:${String(createdDate.getMinutes()).padStart(2, '0')} WIB`;
          return {
            id: g.id,
            name: g.name,
            phone: g.phone,
            domicile: g.city,
            city: g.city,
            purpose: g.purpose || 'Puja Bakti Umum',
            eventId: g.event_id,
            kebaktianName: evt.name || 'Kunjungan Vihara',
            speaker: evt.speaker || '-',
            dateKey: evt.date || (g.created_at ? g.created_at.split('T')[0] : (typeof ViharaData !== 'undefined' ? ViharaData.getTodayKey() : '2026-01-01')),
            timeStr: timeStr,
            timestamp: g.created_at,
            status: 'Hadir'
          };
        });
        localStorage.setItem('vihara_guests', JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('[Supabase] Gagal sinkronisasi guests:', err.message);
    }
    return null;
  }

  // ==========================================================================
  // 6. KONFIGURASI SISTEM (MASTER PIN SUPER ADMIN, DB SETTINGS, DLL.)
  // ==========================================================================

  // 6a. Ambil nilai konfigurasi berdasarkan key dari tabel configurations di Supabase
  async function getConfiguration(key) {
    const sb = getClient();
    if (!sb) return null;
    try {
      const { data, error } = await sb
        .from('configurations')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error) {
        console.warn(`[Supabase] Gagal membaca konfigurasi "${key}":`, error.message);
        return null;
      }
      return data ? data.value : null;
    } catch (err) {
      console.warn(`[Supabase] Exception saat membaca konfigurasi "${key}":`, err.message);
      return null;
    }
  }

  // 6b. Simpan / Perbarui nilai konfigurasi ke tabel configurations di Supabase
  async function updateConfiguration(key, value, description = null) {
    const sb = getClient();
    if (!sb) return false;
    try {
      const payload = {
        key: String(key).trim(),
        value: String(value).trim(),
        updated_at: new Date().toISOString()
      };
      if (description) {
        payload.description = description;
      }

      const { error } = await sb
        .from('configurations')
        .upsert(payload, { onConflict: 'key' });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error(`[Supabase] Gagal menyimpan konfigurasi "${key}":`, err.message);
      return false;
    }
  }

  // Inisialisasi awal saat aplikasi dibuka (Menyinkronkan SELURUH 5 Entitas Database)
  async function initSync() {
    if (!isConfigured()) {
      console.info('[Supabase] Kunci API belum diisi. Berjalan dalam mode penyimpanan lokal (Local Storage).');
      return;
    }
    console.info('[Supabase] Menghubungkan ke database Supabase...');
    await Promise.allSettled([
      syncProfiles(),
      syncEvents(),
      syncAnnouncements(),
      syncAttendance(),
      syncGuests()
    ]);
    // Pastikan akun Admin resmi terdaftar di Supabase profiles jika belum ada
    const adminUser = typeof ViharaData !== 'undefined' ? ViharaData.findUserByPhone('08119999888') : null;
    if (adminUser) {
      insertProfile(adminUser).catch(() => {});
    }
    console.info('[Supabase] Sinkronisasi seluruh database Supabase selesai.');
  }

  return {
    CONFIG,
    isConfigured,
    getClient,
    initSync,
    syncProfiles,
    insertProfile,
    fetchProfileByPhone,
    batchInsertProfiles,
    updateProfile,
    updateProfilePassword,
    deleteProfile,
    syncEvents,
    insertEvent,
    deleteEvent,
    syncAnnouncements,
    insertAnnouncement,
    archiveAnnouncement,
    restoreAnnouncement,
    deleteAnnouncement,
    syncAttendance,
    insertAttendance,
    syncGuests,
    insertGuest,
    getConfiguration,
    updateConfiguration
  };
})();

