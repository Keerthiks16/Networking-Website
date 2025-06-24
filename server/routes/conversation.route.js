import express from "express";
import {
  sendMessage,
  getMessages,
  getUserConversations,
} from "../controllers/conversation.controller.js";
import { protectRoute } from "../middlewares/protectRoute.js";

const router = express.Router();

// Send a new message
router.post("/send/:receiverId", protectRoute, sendMessage);

// Get messages between two users
router.get("/messages/:receiverId", protectRoute, getMessages);

// Get all conversations for the current user
router.get("/conversations", protectRoute, getUserConversations);

export default router;
