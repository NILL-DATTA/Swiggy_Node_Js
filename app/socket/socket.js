const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }

  return io;
}

module.exports = {
  initSocket,
  getIO,
};