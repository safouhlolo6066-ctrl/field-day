/* Jena field app — data layer (Supabase). Screens call only these functions. */
(function () {
  var URL_ = 'https://numskybulgqlhyusttye.supabase.co';
  var KEY = 'sb_publishable_cAUGQ16fBwdjrcSyd4bmnA_nll_4SR2'; // public by design; access is enforced by row-level security
  var FN = URL_ + '/functions/v1/tg-auth';
  var sb = window.supabase.createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'jena-field-auth' } });

  function timed(p, ms) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); })]); }

  var D = {
    ROLES: { rep: 'مندوب', sup_retail: 'مشرف مفرق', sup_wholesale: 'مشرف جملة', sup_key: 'مشرف كبار عملاء', area_manager: 'مشرف مبيعات مناطق', sales_manager: 'مدير مبيعات', admin: 'إدارة' },
    SUP_ROLES: ['sup_retail', 'sup_wholesale', 'sup_key', 'area_manager', 'sales_manager', 'admin'],

    /** Can this phone reach the server? → {ok, ms, err} */
    ping: function () {
      var t = Date.now();
      return timed(fetch(FN, { method: 'GET' }).then(function (r) { return r.json(); }), 12000)
        .then(function (j) { return { ok: !!(j && j.ok), ms: Date.now() - t }; })
        .catch(function (e) { return { ok: false, ms: Date.now() - t, err: String(e && e.message || e) }; });
    },

    /** Telegram initData → Supabase session. → {ok, err} */
    login: function (initData) {
      return timed(fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData: initData }) }).then(function (r) { return r.json(); }), 20000)
        .then(function (j) {
          if (!j || !j.ok) return { ok: false, err: (j && j.err) || 'server' };
          return sb.auth.verifyOtp({ token_hash: j.token_hash, type: 'magiclink' }).then(function (res) { return res.error ? { ok: false, err: 'otp' } : { ok: true }; });
        })
        .catch(function (e) { return { ok: false, err: String(e && e.message || e) }; });
    },

    session: function () { return sb.auth.getSession().then(function (r) { return r.data.session; }); },
    logout: function () { return sb.auth.signOut(); },

    /** my own profile (any status) */
    me: function () {
      return sb.auth.getUser().then(function (u) {
        if (!u.data.user) return null;
        return sb.from('profiles').select('*').eq('id', u.data.user.id).maybeSingle().then(function (r) { return r.data || null; });
      });
    },
    pending: function () { return sb.rpc('pending_requests').then(function (r) { if (r.error) throw r.error; return r.data || []; }); },
    members: function () { return sb.from('profiles').select('*').neq('status', 'pending').order('name').then(function (r) { if (r.error) throw r.error; return r.data || []; }); },
    audit: function () { return sb.from('audit_log').select('*').order('at', { ascending: false }).limit(30).then(function (r) { if (r.error) throw r.error; return r.data || []; }); },
    approve: function (target, role, region, supervisor) {
      return sb.rpc('approve_user', { target: target, new_role: role, new_region: region || '', new_supervisor: supervisor || null }).then(function (r) { if (r.error) throw r.error; });
    },
    setStatus: function (target, status) { return sb.rpc('set_status', { target: target, new_status: status }).then(function (r) { if (r.error) throw r.error; }); }
  };
  window.JD = D;
})();
