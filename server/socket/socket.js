import { Server } from "socket.io";
import http from "http";
import express from "express";

class SocketManager {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = null;
    this.userSocketMap = new Map();
  }

  initializeSocket(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*", // Add your frontend URLs
        methods: ["GET", "POST"],
      },
    });

    this.setupSocketEvents();
    return this.io;
  }

  setupSocketEvents() {
    this.io.on("connection", (socket) => {
      console.log("New socket connection:", socket.id);

      // User setup
      socket.on("setup", (userId) => {
        if (userId) {
          this.userSocketMap.set(userId, socket.id);
          socket.emit("connected");
        }
      });

      // Join a chat room
      socket.on("join-chat", (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
      });

      // Send message
      socket.on("send-message", (messageData) => {
        const receiverSocketId = this.getReceiverSocketId(
          messageData.receiverId
        );
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit("receive-message", messageData);
        }
      });

      // Typing indicators
      socket.on("typing", (room) => {
        socket.to(room).emit("typing");
      });

      socket.on("stop-typing", (room) => {
        socket.to(room).emit("stop-typing");
      });

      // Disconnect handling
      socket.on("disconnect", () => {
        this.removeUserSocket(socket.id);
      });
    });
  }

  getReceiverSocketId(userId) {
    return this.userSocketMap.get(userId);
  }

  removeUserSocket(socketId) {
    for (const [userId, id] of this.userSocketMap.entries()) {
      if (id === socketId) {
        this.userSocketMap.delete(userId);
        break;
      }
    }
    console.log("User disconnected", socketId);
  }

  // Method to get all connected sockets
  getConnectedSockets() {
    return this.userSocketMap;
  }
}

// Create a singleton instance
const socketManager = new SocketManager();

export default socketManager;
