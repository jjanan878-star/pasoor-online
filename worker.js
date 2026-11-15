// سرور آنلاین پاسور ۳۵۰ - مچ‌میکینگ تصادفی ۴ نفره
// هر ۴ نفری که وارد صف شوند یک اتاق می‌سازند. صندلی ۰ و ۲ هم‌تیمی‌اند، ۱ و ۳ هم‌تیمی.

const TEST_PAGE = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>تست سرور پاسور</title>
<style>
  body { font-family: sans-serif; padding: 14px; background: #1b2a1f; color: #fff; }
  input, button { font-size: 16px; padding: 10px; margin: 4px 0; width: 100%; box-sizing: border-box; border-radius: 8px; border: 0; }
  button { background: #e0a526; font-weight: bold; }
  #log { background: #000; color: #8f8; padding: 8px; height: 260px; overflow: auto; font-size: 13px; direction: ltr; text-align: left; border-radius: 8px; white-space: pre-wrap; }
</style>
</head>
<body>
<h3>تست سرور پاسور ۳۵۰</h3>
<input id="name" placeholder="نام شما">
<button onclick="connect()">اتصال و ورود به صف</button>
<button onclick="sendTest()">ارسال پیام تست به بقیه</button>
<div id="log"></div>
<script>
  var ws = null;
  var logEl = document.getElementById('log');
  function log(t) { logEl.textContent += t + String.fromCharCode(10); logEl.scrollTop = logEl.scrollHeight; }
  function connect() {
    var proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
    var u = proto + location.host + '/ws';
    if (ws) { try { ws.close(); } catch (e) {} }
    log('در حال اتصال به ' + u);
    ws = new WebSocket(u);
    ws.onopen = function () {
      log('وصل شد ✅');
      ws.send(JSON.stringify({ type: 'join', name: document.getElementById('name').value || 'بازیکن' }));
    };
    ws.onmessage = function (e) { log('← ' + e.data); };
    ws.onclose = function () { log('اتصال قطع شد'); };
    ws.onerror = function () { log('خطا در اتصال ❌'); };
  }
  function sendTest() {
    if (!ws || ws.readyState !== 1) { log('وصل نیستید'); return; }
    ws.send(JSON.stringify({ type: 'msg', data: { hello: 'سلام', t: Date.now() } }));
    log('→ پیام تست فرستاده شد');
  }
</script>
</body>
</html>
`;

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

// صفحه‌ی مدیریت کد هدیه (فقط با کلید مخفی ADMIN_KEY کار می‌کند)
const ADMIN_PAGE = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>مدیریت کد هدیه</title>
<style>
  body { font-family: sans-serif; padding: 14px; background: #1b2a1f; color: #fff; }
  h3 { margin: 6px 0; }
  input, button { font-size: 16px; padding: 10px; margin: 4px 0; width: 100%; box-sizing: border-box; border-radius: 8px; border: 0; }
  button { background: #e0a526; font-weight: bold; }
  button.s { background: #3b5a42; color: #fff; }
  #out { background: #000; color: #8f8; padding: 8px; min-height: 120px; font-size: 14px; border-radius: 8px; white-space: pre-wrap; margin-top: 8px; }
  label { font-size: 13px; color: #cfe8cf; }
</style>
</head>
<body>
<h3>مدیریت کد هدیه</h3>
<label>کلید مدیریت</label>
<input id="key" type="password" placeholder="ADMIN_KEY" dir="ltr">
<label>کد (حروف انگلیسی، عدد، - و _)</label>
<input id="code" placeholder="مثلاً NOROOZ" dir="ltr">
<button class="s" onclick="rnd()">ساخت کد تصادفی</button>
<label>تعداد سکه‌ی هر نفر</label>
<input id="coins" type="number" value="50">
<label>حداکثر تعداد نفراتی که می‌توانند استفاده کنند</label>
<input id="max" type="number" value="100">
<label>اعتبار به روز (۰ = بدون محدودیت زمانی)</label>
<input id="days" type="number" value="7">
<button onclick="send('/admin/code',{code:v('code'),coins:+v('coins'),max:+v('max'),days:+v('days')})">ساخت کد</button>
<button class="s" onclick="send('/admin/list',{})">فهرست کدها</button>
<button class="s" onclick="send('/admin/delete',{code:v('code')})">حذف کد بالا</button>
<div id="out"></div>
<script>
  function v(id) { return document.getElementById(id).value.trim(); }
  function rnd() {
    var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = '';
    for (var i = 0; i < 8; i++) r += c.charAt(Math.floor(Math.random() * c.length));
    document.getElementById('code').value = r;
  }
  function send(path, body) {
    body.key = v('key');
    var out = document.getElementById('out');
    out.textContent = '...';
    fetch(path, { method: 'POST', body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.codes) {
          out.textContent = d.codes.length ? d.codes.map(function (c) {
            return c.code + '  |  ' + c.coins + ' سکه  |  استفاده: ' + c.used + '/' + c.max + '  |  ' + (c.exp ? 'تا ' + new Date(c.exp).toLocaleDateString('fa-IR') : 'بدون انقضا');
          }).join('\\n') : 'هیچ کدی وجود ندارد';
        } else {
          out.textContent = d.msg || JSON.stringify(d);
        }
      })
      .catch(function () { out.textContent = 'خطا در ارتباط با سرور'; });
  }
</script>
</body>
</html>`;

const START_COINS = 100; // سکه‌ی اولیه‌ی هر بازیکن جدید
const WIN_COINS = 20;    // سکه‌ی برنده‌ها بعد از هر بازی
const LOSE_COINS = 10;   // سکه‌ای که از بازنده‌ها کم می‌شود (کمتر از صفر نمی‌شود)

export class Lobby {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.codes = {};
    this.fails = new Map();
    this.queue = [];
    this.rooms = new Map();
    this.nextId = 1;
    this.nextRoom = 1;
    this.board = {};
    // لیگ از حافظه‌ی دائمی خوانده می‌شود
    state.blockConcurrencyWhile(async () => {
      this.board = (await state.storage.get("board")) || {};
      this.codes = (await state.storage.get("codes")) || {};
    });
  }

  save() {
    const ids = Object.keys(this.board);
    if (ids.length > 3000) {
      ids.sort((a, b) => this.board[b].c - this.board[a].c);
      const keep = {};
      for (const id of ids.slice(0, 2000)) keep[id] = this.board[id];
      this.board = keep;
    }
    this.state.storage.put("board", this.board).catch(() => {});
  }

  league(url) {
    const pid = (url.searchParams.get("pid") || "").slice(0, 64);
    const rows = Object.entries(this.board)
      .map(([id, v]) => ({ id, n: v.n, c: v.c }))
      .sort((a, b) => b.c - a.c || String(a.n).localeCompare(String(b.n)));
    const top = rows.slice(0, 50).map((r) => ({ n: r.n, c: r.c, m: r.id === pid ? 1 : 0 }));
    let me = null;
    const i = rows.findIndex((r) => r.id === pid);
    if (i >= 0) me = { rank: i + 1, c: rows[i].c };
    return new Response(JSON.stringify({ top, me, total: rows.length }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        ...CORS,
      },
    });
  }

  json(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        ...CORS,
      },
    });
  }

  saveCodes() {
    this.state.storage.put("codes", this.codes).catch(() => {});
  }

  // بازیکن کد هدیه را وارد می‌کند
  async redeem(request) {
    let b;
    try { b = JSON.parse(await request.text()); } catch { return this.json({ ok: false, msg: "درخواست نامعتبر است" }); }
    const pid = typeof b.pid === "string" && /^[a-z0-9]{8,64}$/i.test(b.pid) ? b.pid : null;
    const code = String(b.code || "").trim().toUpperCase();
    if (!pid || !/^[A-Z0-9_-]{3,32}$/.test(code)) {
      return this.json({ ok: false, msg: "کد نامعتبر است" });
    }

    // جلوگیری از حدس زدن کد: بیش از ۸ تلاش ناموفق در ۱۰ دقیقه مجاز نیست
    const ip = request.headers.get("cf-connecting-ip") || "?";
    const key = ip + "|" + pid;
    let f = this.fails.get(key) || { n: 0, t: Date.now() };
    if (Date.now() - f.t > 600000) f = { n: 0, t: Date.now() };
    if (f.n >= 8) return this.json({ ok: false, msg: "تلاش بیش از حد. چند دقیقه بعد دوباره امتحان کنید" });
    const fail = (msg) => {
      f.n++;
      this.fails.set(key, f);
      return this.json({ ok: false, msg });
    };

    const c = this.codes[code];
    if (!c) return fail("کد نامعتبر است");
    if (c.exp && Date.now() > c.exp) return fail("مهلت استفاده از این کد تمام شده است");
    if (c.used.includes(pid)) return this.json({ ok: false, msg: "شما قبلاً از این کد استفاده کرده‌اید" });
    if (c.used.length >= c.max) return fail("ظرفیت این کد تمام شده است");

    c.used.push(pid);
    let e = this.board[pid];
    if (!e) {
      const name = typeof b.name === "string" && b.name.trim() ? b.name.trim().slice(0, 20) : "بازیکن";
      e = this.board[pid] = { n: name, c: START_COINS };
    }
    e.c += c.coins;
    this.save();
    this.saveCodes();
    return this.json({ ok: true, added: c.coins, coins: e.c });
  }

  // مدیریت کدها (فقط با ADMIN_KEY)
  async admin(request, url) {
    if (request.method !== "POST") return this.json({ ok: false, msg: "فقط POST" }, 405);
    let b;
    try { b = JSON.parse(await request.text()); } catch { return this.json({ ok: false, msg: "درخواست نامعتبر است" }, 400); }
    const secret = this.env && this.env.ADMIN_KEY;
    if (!secret) return this.json({ ok: false, msg: "ADMIN_KEY هنوز در Cloudflare تنظیم نشده است" }, 500);
    if (b.key !== secret) return this.json({ ok: false, msg: "کلید اشتباه است" }, 403);

    const code = String(b.code || "").trim().toUpperCase();

    if (url.pathname === "/admin/list") {
      const codes = Object.entries(this.codes).map(([k, v]) => ({
        code: k, coins: v.coins, max: v.max, used: v.used.length, exp: v.exp,
      }));
      return this.json({ ok: true, codes });
    }
    if (url.pathname === "/admin/delete") {
      if (!this.codes[code]) return this.json({ ok: false, msg: "چنین کدی وجود ندارد" });
      delete this.codes[code];
      this.saveCodes();
      return this.json({ ok: true, msg: "کد حذف شد: " + code });
    }
    if (url.pathname === "/admin/code") {
      const coins = Math.floor(Number(b.coins));
      const max = Math.floor(Number(b.max));
      const days = Math.floor(Number(b.days) || 0);
      if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return this.json({ ok: false, msg: "کد باید ۳ تا ۳۲ حرف انگلیسی/عدد باشد" });
      if (!(coins >= 1 && coins <= 100000)) return this.json({ ok: false, msg: "تعداد سکه باید بین ۱ تا ۱۰۰۰۰۰ باشد" });
      if (!(max >= 1 && max <= 10000)) return this.json({ ok: false, msg: "حداکثر نفرات باید بین ۱ تا ۱۰۰۰۰ باشد" });
      const exp = days > 0 ? Date.now() + Math.min(days, 365) * 86400000 : 0;
      this.codes[code] = { coins, max, used: [], exp };
      this.saveCodes();
      return this.json({
        ok: true,
        msg: "ساخته شد ✅\nکد: " + code + "\nسکه: " + coins + "\nظرفیت: " + max + " نفر\n" + (exp ? "اعتبار: " + days + " روز" : "بدون محدودیت زمانی"),
      });
    }
    return this.json({ ok: false, msg: "مسیر نامعتبر" }, 404);
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === "/league") return this.league(url);
    if (url.pathname === "/redeem") return this.redeem(request);
    if (url.pathname.startsWith("/admin/")) return this.admin(request, url);

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket", { status: 426 });
    }
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    const p = { id: this.nextId++, ws: server, name: "بازیکن", pid: null, room: null, seat: -1 };

    server.addEventListener("message", (e) => {
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      this.onMessage(p, m);
    });
    server.addEventListener("close", () => this.onClose(p));
    server.addEventListener("error", () => this.onClose(p));

    this.send(p, { type: "hello", id: p.id });
    return new Response(null, { status: 101, webSocket: client });
  }

  send(p, obj) {
    try { p.ws.send(JSON.stringify(obj)); } catch {}
  }

  onMessage(p, m) {
    if (m.type === "join") {
      if (p.room) return;
      if (typeof m.name === "string" && m.name.trim()) {
        p.name = m.name.trim().slice(0, 20);
      }
      if (typeof m.pid === "string" && /^[a-z0-9]{8,64}$/i.test(m.pid)) {
        p.pid = m.pid;
        const e = this.board[p.pid];
        if (!e) this.board[p.pid] = { n: p.name, c: START_COINS };
        else e.n = p.name;
        this.save();
      }
      if (!this.queue.includes(p)) this.queue.push(p);
      this.tryMatch();
      this.sendWaiting();
    } else if (m.type === "cancel") {
      this.removeFromQueue(p);
      this.sendWaiting();
    } else if (m.type === "msg") {
      const room = p.room && this.rooms.get(p.room);
      if (!room) return;
      for (const q of room.players) {
        if (q && q !== p) this.send(q, { type: "msg", from: p.seat, data: m.data });
      }
    } else if (m.type === "result") {
      // هر بازیکن برنده‌ی بازی را اعلام می‌کند (۰ = صندلی‌های ۰ و ۲، ۱ = صندلی‌های ۱ و ۳)
      const room = p.room && this.rooms.get(p.room);
      if (!room || room.settled) return;
      if (m.winner !== 0 && m.winner !== 1) return;
      room.reports[p.seat] = m.winner;
      this.trySettle(room);
    } else if (m.type === "ping") {
      this.send(p, { type: "pong" });
    }
  }

  // سکه‌ها فقط وقتی ثبت می‌شوند که حداقل ۳ نفر از ۴ نفر برنده‌ی یکسانی را اعلام کنند
  trySettle(room) {
    const votes = [0, 0];
    for (const s in room.reports) votes[room.reports[s]]++;
    const winner = votes[0] >= 3 ? 0 : votes[1] >= 3 ? 1 : -1;
    if (winner < 0) return;
    room.settled = true;

    for (let seat = 0; seat < 4; seat++) {
      const pid = room.pids[seat];
      if (!pid) continue;
      const entry = this.board[pid] || (this.board[pid] = { n: room.names[seat], c: START_COINS });
      const want = seat % 2 === winner ? WIN_COINS : -LOSE_COINS;
      const next = Math.max(0, entry.c + want);
      const delta = next - entry.c;
      entry.c = next;
      const q = room.players[seat];
      if (q) this.send(q, { type: "coins", coins: next, delta });
    }
    this.save();
  }

  removeFromQueue(p) {
    const i = this.queue.indexOf(p);
    if (i >= 0) this.queue.splice(i, 1);
  }

  sendWaiting() {
    for (const q of this.queue) {
      this.send(q, { type: "waiting", count: this.queue.length, need: 4 });
    }
  }

  tryMatch() {
    while (this.queue.length >= 4) {
      const four = this.queue.splice(0, 4);
      const roomId = "r" + this.nextRoom++;
      const names = four.map((x) => x.name);
      const room = {
        id: roomId,
        players: four,
        pids: four.map((x) => x.pid),
        names,
        reports: {},
        settled: false,
      };
      this.rooms.set(roomId, room);
      four.forEach((x, i) => {
        x.room = roomId;
        x.seat = i;
      });
      four.forEach((x) => {
        this.send(x, { type: "start", room: roomId, seat: x.seat, names });
      });
    }
  }

  onClose(p) {
    if (p.closed) return;
    p.closed = true;
    this.removeFromQueue(p);
    this.sendWaiting();
    const room = p.room && this.rooms.get(p.room);
    if (room) {
      room.players[p.seat] = null;
      for (const q of room.players) {
        if (q) this.send(q, { type: "left", seat: p.seat });
      }
      if (room.players.every((x) => !x)) this.rooms.delete(room.id);
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/admin") {
      return new Response(ADMIN_PAGE, {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      });
    }
    if (
      url.pathname === "/ws" ||
      url.pathname === "/league" ||
      url.pathname === "/redeem" ||
      url.pathname.startsWith("/admin/")
    ) {
      const id = env.LOBBY.idFromName("main");
      return env.LOBBY.get(id).fetch(request);
    }
    if (url.pathname === "/test") {
      return new Response(TEST_PAGE, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    return new Response("Pasoor online server OK", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
