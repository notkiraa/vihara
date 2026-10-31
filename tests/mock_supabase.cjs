/**
 * In-Memory Mock Supabase Client for Tests
 * Ensures test runs NEVER make network requests to the live Supabase database
 * and prevents polluting production data with test events/attendance.
 */

function createSupabaseClient(url, key) {
  // Shared or isolated table storage
  const tables = {
    events: [],
    profiles: [
      { id: 'ADM_001', name: 'Pengurus Vihara Amurwa Bhumi', phone: '08119999888', role: 'admin' },
      { id: 'USR_002', name: 'Vin Cen', phone: '0895355301519', role: 'admin' }
    ],
    attendance: [],
    guests: [],
    announcements: [],
    configurations: []
  };

  return {
    from: (tableName) => {
      if (!tables[tableName]) {
        tables[tableName] = [];
      }

      const filters = [];
      const sorts = [];
      let limitCount = null;
      let isSingle = false;
      let isMaybeSingle = false;
      let action = 'SELECT';
      let payload = null;
      let onConflictKey = null;

      const builder = {
        select: (cols = '*') => {
          return builder;
        },
        order: (col, { ascending = true } = {}) => {
          sorts.push({ col, ascending });
          return builder;
        },
        eq: (col, val) => {
          filters.push(row => String(row[col]) === String(val));
          return builder;
        },
        neq: (col, val) => {
          filters.push(row => String(row[col]) !== String(val));
          return builder;
        },
        limit: (n) => {
          limitCount = n;
          return builder;
        },
        single: () => {
          isSingle = true;
          return builder;
        },
        maybeSingle: () => {
          isMaybeSingle = true;
          return builder;
        },
        insert: (rows) => {
          action = 'INSERT';
          payload = Array.isArray(rows) ? rows : [rows];
          return builder;
        },
        upsert: (rows, { onConflict } = {}) => {
          action = 'UPSERT';
          onConflictKey = onConflict || 'id';
          payload = Array.isArray(rows) ? rows : [rows];
          return builder;
        },
        update: (data) => {
          action = 'UPDATE';
          payload = data;
          return builder;
        },
        delete: () => {
          action = 'DELETE';
          return builder;
        },
        then: (resolve, reject) => {
          const execute = () => {
            if (action === 'INSERT') {
              const inserted = [];
              for (const item of payload) {
                const copy = { ...item };
                if (!copy.id) {
                  copy.id = tableName.toUpperCase().slice(0, 3) + '_' + Date.now() + Math.random().toString(36).substring(2, 6);
                }
                tables[tableName].push(copy);
                inserted.push(copy);
              }
              const res = { data: isSingle ? inserted[0] : inserted, error: null };
              return res;
            }

            if (action === 'UPSERT') {
              const conflictKeys = (onConflictKey || 'id').split(',').map(s => s.trim());
              const upserted = [];
              for (const item of payload) {
                const copy = { ...item };
                const matchIdx = tables[tableName].findIndex(r =>
                  conflictKeys.every(k => String(r[k]) === String(copy[k]))
                );
                if (matchIdx >= 0) {
                  tables[tableName][matchIdx] = { ...tables[tableName][matchIdx], ...copy };
                  upserted.push(tables[tableName][matchIdx]);
                } else {
                  if (!copy.id) {
                    copy.id = tableName.toUpperCase().slice(0, 3) + '_' + Date.now() + Math.random().toString(36).substring(2, 6);
                  }
                  tables[tableName].push(copy);
                  upserted.push(copy);
                }
              }
              const res = { data: isSingle ? upserted[0] : upserted, error: null };
              return res;
            }

            if (action === 'UPDATE') {
              const updated = [];
              for (let i = 0; i < tables[tableName].length; i++) {
                const r = tables[tableName][i];
                if (filters.every(f => f(r))) {
                  tables[tableName][i] = { ...r, ...payload };
                  updated.push(tables[tableName][i]);
                }
              }
              const res = { data: isSingle ? updated[0] : updated, error: null };
              return res;
            }

            if (action === 'DELETE') {
              const deleted = [];
              tables[tableName] = tables[tableName].filter(r => {
                const match = filters.every(f => f(r));
                if (match) deleted.push(r);
                return !match;
              });
              const res = { data: deleted, error: null };
              return res;
            }

            // SELECT
            let filtered = tables[tableName].filter(r => filters.every(f => f(r)));

            for (const s of sorts) {
              filtered.sort((a, b) => {
                const valA = a[s.col];
                const valB = b[s.col];
                if (valA === valB) return 0;
                if (s.ascending) return valA > valB ? 1 : -1;
                return valA < valB ? 1 : -1;
              });
            }

            // Foreign relation population for attendance table if joined
            if (tableName === 'attendance') {
              filtered = filtered.map(a => {
                const ev = (tables.events || []).find(e => String(e.id) === String(a.event_id));
                const pr = (tables.profiles || []).find(p => String(p.id) === String(a.user_id));
                return {
                  ...a,
                  events: ev ? { id: ev.id, name: ev.name, date: ev.date, speaker: ev.speaker } : null,
                  profiles: pr ? { id: pr.id, name: pr.name, phone: pr.phone } : null
                };
              });
            }

            if (limitCount !== null) {
              filtered = filtered.slice(0, limitCount);
            }

            let data = filtered;
            if (isSingle) {
              data = filtered.length > 0 ? filtered[0] : null;
            } else if (isMaybeSingle) {
              data = filtered.length > 0 ? filtered[0] : null;
            }

            return { data, error: null };
          };

          const result = execute();
          if (resolve) {
            return Promise.resolve(result).then(resolve, reject);
          }
          return Promise.resolve(result);
        }
      };

      return builder;
    },
    channel: () => ({
      on: () => ({
        subscribe: () => ({
          unsubscribe: () => {}
        })
      })
    })
  };
}

module.exports = createSupabaseClient;
