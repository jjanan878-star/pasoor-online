// سرور آنلاین پاسور ۳۵۰ - مچ‌میکینگ تصادفی ۴ نفره
// هر ۴ نفری که وارد صف شوند یک اتاق می‌سازند. صندلی ۰ و ۲ هم‌تیمی‌اند، ۱ و ۳ هم‌تیمی.

export class Lobby {
  constructor(state, env) {
    this.queue = [];
    this.rooms = new Map();
    this.nextId = 1;
    this.nextRoom = 1;
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket", { status: 426 });
    }
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    const p = { id: this.nextId++, ws: server, name: "بازیکن", room: null, seat: -1 };

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
    } else if (m.type === "ping") {
      this.send(p, { type: "pong" });
    }
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
      const room = { id: roomId, players: four };
      this.rooms.set(roomId, room);
      const names = four.map((x) => x.name);
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
    if (url.pathname === "/ws") {
      const id = env.LOBBY.idFromName("main");
      return env.LOBBY.get(id).fetch(request);
    }
    return new Response("Pasoor online server OK", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
