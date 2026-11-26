/* Sternik Morski – konta i synchronizacja postępu (Supabase).
 * Gdy biblioteka lub konfiguracja jest niedostępna (np. podgląd offline), Cloud.enabled = false
 * i aplikacja działa w trybie lokalnym (postęp tylko w tej przeglądarce). */
(function () {
  'use strict';
  const cfg = window.SM_CONFIG;
  const enabled = !!(cfg && window.supabase && window.supabase.createClient && !window.__PREVIEW__);
  const client = enabled ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'sm-auth' }
  }) : null;

  let user = null;      // { id, name }
  const pendKey = () => `sm-pending-${user && user.id}`;

  // „Maciek” → „maciek@sternik-morski.app” (bez polskich znaków i spacji)
  function loginToEmail(login) {
    const base = String(login).trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9._-]/g, '');
    return `${base}@${cfg.loginDomain}`;
  }

  const memberKey = (id) => `sm-member-${id}`;
  async function loadMember(u, allowCached) {
    const { data, error } = await client.from('members').select('display_name').eq('user_id', u.id).maybeSingle();
    if (error) {
      // brak internetu: użyj zapamiętanego członka rodziny (tryb offline)
      let cached = null; try { cached = localStorage.getItem(memberKey(u.id)); } catch (e) { /* */ }
      if (allowCached && cached) { user = { id: u.id, name: cached, offline: true }; return user; }
      throw error;
    }
    try { if (data) localStorage.setItem(memberKey(u.id), data.display_name); } catch (e) { /* */ }
    if (!data) { await client.auth.signOut(); throw new Error('To konto nie ma dostępu do aplikacji.'); }
    user = { id: u.id, name: data.display_name };
    return user;
  }

  async function restore() {
    if (!enabled) return null;
    const { data } = await client.auth.getSession();
    if (!data.session) return null;
    try { return await loadMember(data.session.user, true); } catch (e) { return null; }
  }

  async function signIn(login, password) {
    const { data, error } = await client.auth.signInWithPassword({ email: loginToEmail(login), password });
    if (error) {
      if (/invalid/i.test(error.message)) throw new Error('Nieprawidłowe imię lub hasło.');
      throw new Error('Nie udało się zalogować: ' + error.message);
    }
    return loadMember(data.user);
  }

  async function signOut() {
    if (client) await client.auth.signOut();
    user = null;
  }

  async function changePassword(pw) {
    const { error } = await client.auth.updateUser({ password: pw });
    if (error) {
      if (/at least|short|6/i.test(error.message)) throw new Error('Hasło musi mieć co najmniej 6 znaków.');
      if (/same|different/i.test(error.message)) throw new Error('Nowe hasło musi być inne niż obecne.');
      throw new Error(error.message);
    }
  }

  /* ---- postęp fiszek ---- */
  async function loadProgress() {
    const { data, error } = await client.from('card_progress').select('card_id,box,seen,last_at,due_at,ivl').range(0, 9999);
    if (error) throw error;
    const out = {};
    data.forEach((r) => { out[r.card_id] = { box: r.box, seen: r.seen, last: Date.parse(r.last_at), due: r.due_at ? Date.parse(r.due_at) : null, ivl: r.ivl || 0 }; });
    return out;
  }

  // Zapisy trafiają do kolejki (w localStorage), więc nic nie ginie bez internetu.
  function readPending() { try { return JSON.parse(localStorage.getItem(pendKey()) || '{"cards":{},"sessions":[]}'); } catch (e) { return { cards: {}, sessions: [] }; } }
  function writePending(p) { try { localStorage.setItem(pendKey(), JSON.stringify(p)); } catch (e) { /* trudno */ } }
  let flushing = null;
  let flushTimer = null;
  function queueCard(id, p) {
    if (!user) return;
    const q = readPending(); q.cards[id] = p; writePending(q); scheduleFlush();
  }
  function queueSession(s) {
    if (!user) return;
    const q = readPending(); q.sessions.push(s); writePending(q); scheduleFlush(0);
  }
  function scheduleFlush(ms) {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, ms === undefined ? 1500 : ms);
  }
  async function flush() {
    if (!user || flushing) return flushing;
    flushing = (async () => {
      const q = readPending();
      const ids = Object.keys(q.cards);
      try {
        if (ids.length) {
          const rows = ids.map((id) => ({ user_id: user.id, card_id: id, box: q.cards[id].box, seen: q.cards[id].seen, last_at: new Date(q.cards[id].last || Date.now()).toISOString(),
            due_at: q.cards[id].due ? new Date(q.cards[id].due).toISOString() : null, ivl: q.cards[id].ivl || 0 }));
          const { error } = await client.from('card_progress').upsert(rows, { onConflict: 'user_id,card_id' });
          if (error) throw error;
        }
        if (q.sessions.length) {
          const rows = q.sessions.map((s) => ({ ...s, user_id: user.id }));
          const { error } = await client.from('study_sessions').insert(rows);
          if (error) throw error;
        }
        // usuń z kolejki tylko to, co wysłaliśmy (w międzyczasie mogło dojść coś nowego)
        const now = readPending();
        ids.forEach((id) => { if (now.cards[id] && now.cards[id].last === q.cards[id].last) delete now.cards[id]; });
        now.sessions = now.sessions.slice(q.sessions.length);
        writePending(now);
        setStatus('ok');
      } catch (e) {
        setStatus('offline');
        flushTimer = setTimeout(flush, 30000);
      } finally { flushing = null; }
    })();
    return flushing;
  }
  window.addEventListener('online', () => scheduleFlush(0));

  async function loadSessions(limit) {
    const { data, error } = await client.from('study_sessions')
      .select('id,mode,title,lesson_id,started_at,finished_at,total,ok,mid,bad')
      .order('finished_at', { ascending: false }).limit(limit || 200);
    if (error) throw error;
    return data;
  }

  async function loadFamily() {
    const { data, error } = await client.rpc('family_progress');
    if (error) throw error;
    return data;
  }

  let statusCb = null;
  function setStatus(s) { if (statusCb) statusCb(s); }

  window.Cloud = {
    enabled, restore, signIn, signOut, changePassword, loadProgress, queueCard, queueSession, flush, loadSessions, loadFamily,
    pendingSessions: () => (user ? readPending().sessions : []),
    get user() { return user; },
    onStatus(cb) { statusCb = cb; }
  };
})();
