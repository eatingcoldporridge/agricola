const http = require("node:http");
const crypto = require("node:crypto");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const httpServer = http.createServer(app);
const port = Number(process.env.PORT || 5177);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 5e6,
});

// This starter keeps room data in memory. Use Redis or a database for production.
const rooms = new Map();

app.disable("x-powered-by");
app.use(express.json({ limit: "5mb" }));
app.use(express.static(__dirname));

app.get("/health", (_request, response) => {
  response.json({ ok: true, rooms: rooms.size });
});

io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.on("create-room", (payload = {}, acknowledge) => {
    leaveCurrentRoom(socket);

    const roomCode = createRoomCode();
    const player = createPlayer(socket, payload.playerName);
    const room = {
      code: roomCode,
      hostId: socket.id,
      players: new Map([[socket.id, player]]),
      state: payload.initialState ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    rooms.set(roomCode, room);
    joinSocketToRoom(socket, roomCode, player.name);

    const result = { ok: true, room: serializeRoom(room, socket.id) };
    reply(acknowledge, result);
    io.to(roomCode).emit("room-updated", result.room);
  });

  socket.on("join-room", (payload = {}, acknowledge) => {
    const roomCode = normalizeRoomCode(payload.roomCode || payload.code);
    const room = rooms.get(roomCode);

    if (!room) {
      return reply(acknowledge, { ok: false, error: "존재하지 않는 방입니다." });
    }

    if (socket.data.roomCode && socket.data.roomCode !== roomCode) {
      leaveCurrentRoom(socket);
    }

    const existingPlayer = room.players.get(socket.id);
    const player = existingPlayer || createPlayer(socket, payload.playerName);
    player.name = sanitizePlayerName(payload.playerName || player.name);
    room.players.set(socket.id, player);
    room.updatedAt = Date.now();
    joinSocketToRoom(socket, roomCode, player.name);

    const result = { ok: true, room: serializeRoom(room, socket.id), state: room.state };
    reply(acknowledge, result);
    emitRoomUpdate(room);
  });

  socket.on("game-state", (payload = {}, acknowledge) => {
    const roomCode = normalizeRoomCode(payload.roomCode || payload.code || socket.data.roomCode);
    const room = rooms.get(roomCode);

    if (!room || !room.players.has(socket.id)) {
      return reply(acknowledge, { ok: false, error: "먼저 방에 입장해야 합니다." });
    }

    if (room.hostId !== socket.id) {
      return reply(acknowledge, { ok: false, error: "방장만 게임 상태를 변경할 수 있습니다." });
    }

    if (!("state" in payload)) {
      return reply(acknowledge, { ok: false, error: "공유할 state가 없습니다." });
    }

    room.state = payload.state;
    room.updatedAt = Date.now();

    const message = {
      roomCode,
      state: room.state,
      updatedBy: socket.id,
      updatedAt: room.updatedAt,
    };
    socket.to(roomCode).emit("game-state", message);
    reply(acknowledge, { ok: true, ...message });
  });

  socket.on("leave-room", (_payload, acknowledge) => {
    const roomCode = socket.data.roomCode;
    leaveCurrentRoom(socket);
    reply(acknowledge, { ok: true, roomCode });
  });

  socket.on("disconnect", (reason) => {
    console.log(`[socket] disconnected: ${socket.id} (${reason})`);
    leaveCurrentRoom(socket, false);
  });
});

function createRoomCode() {
  let code;
  do {
    code = crypto.randomBytes(3).toString("hex").toUpperCase();
  } while (rooms.has(code));
  return code;
}

function normalizeRoomCode(value) {
  return String(value || "").trim().toUpperCase();
}

function sanitizePlayerName(value) {
  const name = String(value || "플레이어").trim().slice(0, 24);
  return name || "플레이어";
}

function createPlayer(socket, playerName) {
  return {
    id: socket.id,
    name: sanitizePlayerName(playerName),
    joinedAt: Date.now(),
  };
}

function joinSocketToRoom(socket, roomCode, playerName) {
  socket.join(roomCode);
  socket.data.roomCode = roomCode;
  socket.data.playerName = playerName;
}

function leaveCurrentRoom(socket, leaveSocketIoRoom = true) {
  const roomCode = socket.data.roomCode;
  const room = rooms.get(roomCode);

  if (!room) {
    delete socket.data.roomCode;
    delete socket.data.playerName;
    return;
  }

  room.players.delete(socket.id);
  if (leaveSocketIoRoom) socket.leave(roomCode);

  if (room.players.size === 0) {
    rooms.delete(roomCode);
  } else {
    if (room.hostId === socket.id) {
      const nextHost = [...room.players.values()].sort((a, b) => a.joinedAt - b.joinedAt)[0];
      room.hostId = nextHost.id;
      io.to(roomCode).emit("host-changed", {
        roomCode,
        hostId: room.hostId,
        hostName: nextHost.name,
      });
    }
    room.updatedAt = Date.now();
    emitRoomUpdate(room);
  }

  delete socket.data.roomCode;
  delete socket.data.playerName;
}

function serializeRoom(room, viewerId = "") {
  return {
    code: room.code,
    hostId: room.hostId,
    isHost: room.hostId === viewerId,
    players: [...room.players.values()]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((player) => ({
        id: player.id,
        name: player.name,
        isHost: player.id === room.hostId,
      })),
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

function emitRoomUpdate(room) {
  for (const player of room.players.values()) {
    io.to(player.id).emit("room-updated", serializeRoom(room, player.id));
  }
}

function reply(acknowledge, payload) {
  if (typeof acknowledge === "function") acknowledge(payload);
}

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Agricola multiplayer server: http://localhost:${port}`);
});
