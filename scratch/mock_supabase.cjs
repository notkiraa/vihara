function createSupabaseClient(url, key) {
  return {
    from: (table) => {
      let queryParams = [];
      let method = 'GET';
      let bodyData = null;
      let headers = {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      const builder = {
        select: (cols = '*') => {
          queryParams.push(`select=${encodeURIComponent(cols)}`);
          return builder;
        },
        order: (col, { ascending = true } = {}) => {
          queryParams.push(`order=${encodeURIComponent(col)}.${ascending ? 'asc' : 'desc'}`);
          return builder;
        },
        eq: (col, val) => {
          queryParams.push(`${encodeURIComponent(col)}=eq.${encodeURIComponent(val)}`);
          return builder;
        },
        neq: (col, val) => {
          queryParams.push(`${encodeURIComponent(col)}=neq.${encodeURIComponent(val)}`);
          return builder;
        },
        limit: (n) => {
          queryParams.push(`limit=${n}`);
          return builder;
        },
        single: async () => {
          const res = await builder.then();
          if (res.error) return res;
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          return { data, error: null };
        },
        maybeSingle: async () => {
          const res = await builder.then();
          if (res.error) return res;
          const data = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
          return { data, error: null };
        },
        insert: (rows) => {
          method = 'POST';
          bodyData = Array.isArray(rows) ? rows : [rows];
          return builder;
        },
        upsert: (rows, { onConflict } = {}) => {
          method = 'POST';
          if (onConflict) queryParams.push(`on_conflict=${encodeURIComponent(onConflict)}`);
          headers['Prefer'] = 'resolution=merge-duplicates,return=representation';
          bodyData = Array.isArray(rows) ? rows : [rows];
          return builder;
        },
        update: (payload) => {
          method = 'PATCH';
          bodyData = payload;
          return builder;
        },
        delete: () => {
          method = 'DELETE';
          return builder;
        },
        then: async (resolve, reject) => {
          const qs = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
          const fullUrl = `${url}/rest/v1/${table}${qs}`;
          try {
            const res = await fetch(fullUrl, {
              method,
              headers,
              body: bodyData ? JSON.stringify(bodyData) : undefined
            });
            const text = await res.text();
            let json = null;
            try { json = JSON.parse(text); } catch (_) { json = text; }

            if (!res.ok) {
              const errObj = { message: (json && json.message) || text || res.statusText };
              if (resolve) return resolve({ data: null, error: errObj });
              return { data: null, error: errObj };
            }

            const result = { data: json, error: null };
            if (resolve) return resolve(result);
            return result;
          } catch (err) {
            const errObj = { message: err.message };
            if (resolve) return resolve({ data: null, error: errObj });
            return { data: null, error: errObj };
          }
        }
      };

      return builder;
    }
  };
}

module.exports = createSupabaseClient;

