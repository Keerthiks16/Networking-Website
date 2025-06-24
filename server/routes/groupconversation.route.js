import express from "express";

import { protectRoute } from "../middlewares/protectRoute.js";
import {
  addGroupParticipants,
  createGroupConversation,
  getGroupDetails,
  getGroupMessages,
  getUserGroups,
  removeGroupParticipant,
  sendGroupMessage,
  updateGroupDetails,
} from "../controllers/groupconversation.controller.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protectRoute);

// Create a new group
router.post("/group", createGroupConversation);

// Get all groups for the current user
router.get("/groups", getUserGroups);

// Get messages from a group
router.get("/group/:groupId/messages", getGroupMessages);

router.get("/groupdetails/:groupId", getGroupDetails);

// Send a message to a group
router.post("/group/:groupId/message", sendGroupMessage);

// Add participants to a group
router.post("/group/:groupId/participants", addGroupParticipants);

// Remove a participant from a group
router.delete(
  "/group/:groupId/participants/:participantId",
  removeGroupParticipant
);

// Update group details
router.put("/group/:groupId", updateGroupDetails);

export default router;
