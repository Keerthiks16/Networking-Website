import express from "express";
import dotenv from "dotenv";
import mongoose, { connect } from "mongoose";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import connectionRoutes from "./routes/connection.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import groupRoutes from "./routes/groupconversation.route.js";
import cookieParser from "cookie-parser";
import http from "http";
import socketManager from "./socket/socket.js";
import { group } from "console";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketManager.initializeSocket(server);

app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

app.get("/", (req, res) => console.log("Welcome to networking site"));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/post", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/conversation", conversationRoutes);
app.use("/api/v1/grp", groupRoutes);

app.listen(process.env.PORT || 5000, () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Database connected: ", process.env.MONGO_URI))
    .catch((err) => console.log("Error in connecting database: ", err));
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
