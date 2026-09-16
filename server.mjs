import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 5177);
const rooms = new Map();
const memberTimeoutMs = 30000;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
};

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    await handleApi(request, response, url);
    return;
  }

  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = normalize(join(root, requested));

  if (!filePath.startsWith(root) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, { "content-type": types[extname(filePath)] || "application/octet-stream" });
  createReadStream(filePath).pipe(response);
}).listen(port, "0.0.0.0", () => {
  console.log(`Agricola Mobile Table: http://localhost:${port}`);
});

async function handleApi(request, response, url) {
  pruneRooms();

  if (request.method === "POST" && url.pathname === "/api/room/create") {
    const body = await readJson(request);
    const room = createRoom(body.clientId, body.name);
    sendJson(response, roomPublic(room, body.clientId));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/room/join") {
    const body = await readJson(request);
    const room = rooms.get(normalizeCode(body.code));
    if (!room) return sendJson(response, { error: "방을 찾을 수 없습니다." }, 404);
    touchMember(room, body.clientId, body.name);
    broadcast(room);
    sendJson(response, roomPublic(room, body.clientId));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/room/leave") {
    const body = await readJson(request);
    const room = rooms.get(normalizeCode(body.code));
    if (room) {
      removeMember(room, body.clientId);
      broadcast(room);
    }
    sendJson(response, { ok: true });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/room/heartbeat") {
    const body = await readJson(request);
    const room = rooms.get(normalizeCode(body.code));
    if (!room) return sendJson(response, { error: "방을 찾을 수 없습니다." }, 404);
    touchMember(room, body.clientId, body.name);
    broadcast(room);
    sendJson(response, roomPublic(room, body.clientId));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/room/state") {
    const room = rooms.get(normalizeCode(url.searchParams.get("code")));
    if (!room) return sendJson(response, { error: "방을 찾을 수 없습니다." }, 404);
    sendJson(response, { state: room.state || null, room: roomPublic(room, url.searchParams.get("clientId")) });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/room/state") {
    const body = await readJson(request, "20mb");
    const room = rooms.get(normalizeCode(body.code));
    if (!room) return sendJson(response, { error: "방을 찾을 수 없습니다." }, 404);
    if (room.hostId !== body.clientId) return sendJson(response, { error: "방장만 진행할 수 있습니다." }, 403);
    room.state = body.state || null;
    room.updatedAt = Date.now();
    touchMember(room, body.clientId, body.name);
    broadcast(room, { type: "state", state: room.state, room: roomPublic(room, body.clientId) });
    sendJson(response, { ok: true, room: roomPublic(room, body.clientId) });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/room/events") {
    const room = rooms.get(normalizeCode(url.searchParams.get("code")));
    if (!room) {
      response.writeHead(404, { "content-type": "text/event-stream; charset=utf-8" });
      response.end();
      return;
    }
    const clientId = String(url.searchParams.get("clientId") || "");
    touchMember(room, clientId, url.searchParams.get("name") || "");
    response.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });
    const client = { id: clientId, response };
    room.clients.add(client);
    sendEvent(response, { type: "room", room: roomPublic(room, clientId), state: room.state || null });
    broadcast(room);
    request.on("close", () => {
      room.clients.delete(client);
      const member = room.members.get(clientId);
      if (member) member.lastSeen = Date.now();
    });
    return;
  }

  sendJson(response, { error: "Not found" }, 404);
}

function createRoom(clientId, name) {
  let code = "";
  do {
    code = Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (rooms.has(code));
  const room = {
    code,
    hostId: String(clientId),
    members: new Map(),
    clients: new Set(),
    state: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  rooms.set(code, room);
  touchMember(room, clientId, name);
  return room;
}

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

function touchMember(room, clientId, name) {
  const id = String(clientId || "");
  if (!id) return;
  const existing = room.members.get(id);
  room.members.set(id, {
    id,
    name: String(name || existing?.name || "플레이어").slice(0, 24),
    joinedAt: existing?.joinedAt || Date.now(),
    lastSeen: Date.now(),
  });
  if (!room.hostId || !room.members.has(room.hostId)) promoteHost(room);
}

function removeMember(room, clientId) {
  const id = String(clientId || "");
  room.members.delete(id);
  for (const client of [...room.clients]) {
    if (client.id === id) {
      client.response.end();
      room.clients.delete(client);
    }
  }
  if (room.hostId === id) promoteHost(room);
  if (room.members.size === 0) rooms.delete(room.code);
}

function promoteHost(room) {
  const next = [...room.members.values()].sort((a, b) => a.joinedAt - b.joinedAt)[0];
  room.hostId = next?.id || "";
}

function pruneRooms() {
  const now = Date.now();
  for (const room of rooms.values()) {
    for (const member of [...room.members.values()]) {
      if (now - member.lastSeen > memberTimeoutMs) removeMember(room, member.id);
    }
    if (room.members.size === 0 || now - room.updatedAt > 1000 * 60 * 60 * 8) rooms.delete(room.code);
  }
}

function roomPublic(room, clientId = "") {
  return {
    code: room.code,
    hostId: room.hostId,
    isHost: room.hostId === String(clientId || ""),
    members: [...room.members.values()]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((member) => ({ id: member.id, name: member.name, isHost: member.id === room.hostId })),
  };
}

function broadcast(room, payload) {
  const message = payload || { type: "room" };
  for (const client of [...room.clients]) {
    try {
      const personalized = { ...message, room: roomPublic(room, client.id) };
      sendEvent(client.response, personalized);
    } catch {
      room.clients.delete(client);
    }
  }
}

function sendEvent(response, payload) {
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function sendJson(response, data, status = 200) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function readJson(request) {
  return new Promise((resolveBody, rejectBody) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 20 * 1024 * 1024) {
        request.destroy();
        rejectBody(new Error("Body too large"));
      }
    });
    request.on("end", () => {
      try {
        resolveBody(raw ? JSON.parse(raw) : {});
      } catch {
        resolveBody({});
      }
    });
  });
}
