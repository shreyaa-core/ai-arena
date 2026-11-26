import crypto from "node:crypto";
import { env } from "../config/env.js";

const rooms = new Map();

function generateCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

export function registerSocketHandlers(io) {
  if (!env.multiplayerEnabled) return;

  io.on("connection", (socket) => {
    socket.on("room:create", ({ alias = "Operator", mode = "duel", challengeId = "brief-research-assistant" } = {}, cb) => {
      const code = generateCode();
      const room = {
        code,
        mode,
        challengeId,
        status: "waiting",
        players: [{ socketId: socket.id, alias: String(alias).slice(0, 32), score: null, submitted: false, isBot: false }],
        createdAt: Date.now(),
      };
      rooms.set(code, room);
      socket.join(code);
      if (typeof cb === "function") cb({ ok: true, room });
      io.to(code).emit("room:update", room);
    });

    socket.on("room:join", ({ code, alias = "Challenger" } = {}, cb) => {
      const upper = String(code || "").trim().toUpperCase();
      const room = rooms.get(upper);
      if (!room) {
        if (typeof cb === "function") cb({ ok: false, error: "Room not found" });
        return;
      }
      if (room.players.length >= 2) {
        if (typeof cb === "function") cb({ ok: false, error: "Room is full" });
        return;
      }
      room.players.push({ socketId: socket.id, alias: String(alias).slice(0, 32), score: null, submitted: false, isBot: false });
      room.status = "active";
      socket.join(upper);
      if (typeof cb === "function") cb({ ok: true, room });
      io.to(upper).emit("room:update", room);
    });

    socket.on("room:submit", ({ code, score = 0, efficiency = 0 } = {}) => {
      const upper = String(code || "").trim().toUpperCase();
      const room = rooms.get(upper);
      if (!room) return;
      const player = room.players.find((p) => p.socketId === socket.id);
      if (player) {
        player.score = Number(score);
        player.efficiency = Number(efficiency);
        player.submitted = true;
      }
      if (room.players.length === 2 && room.players.every((p) => p.submitted)) {
        room.status = "finished";
      }
      io.to(upper).emit("room:update", room);
    });

    socket.on("disconnect", () => {
      for (const [code, room] of rooms.entries()) {
        const idx = room.players.findIndex((p) => p.socketId === socket.id);
        if (idx !== -1) {
          room.players.splice(idx, 1);
          if (room.players.length === 0) {
            rooms.delete(code);
          } else {
            room.status = "abandoned";
            io.to(code).emit("room:update", room);
          }
        }
      }
    });
  });
}
