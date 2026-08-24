const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  // Client connected
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Restaurant owner joins restaurant room
    socket.on("restaurant:join", (restaurantId) => {
      if (!restaurantId) {
        console.log("Restaurant ID missing");
        return;
      }

      const room = `restaurant_${restaurantId}`;

      socket.join(room);

      console.log(
        `Socket ${socket.id} joined room: ${room}`,
      );
    });

    socket.on("disconnect", () => {
      console.log(
        "Socket disconnected:",
        socket.id,
      );
    });
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