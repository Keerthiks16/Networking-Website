import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import {
  acceptConnectionRequest,
  getConnectionRequests,
  getConnectionStatus,
  getSentConnectionRequests,
  getUserConnections,
  rejectConnectionRequest,
  removeConnection,
  sendConnectionRequest,
} from "../controllers/connection.controller.js";
const router = express.Router();

router.post("/:id/request", protectRoute, sendConnectionRequest);
router.put("/:requestId/accept", protectRoute, acceptConnectionRequest);
router.put("/:requestId/reject", protectRoute, rejectConnectionRequest);
router.delete("/:id/remove", protectRoute, removeConnection);
router.get("/requests", protectRoute, getConnectionRequests);
router.get("/sentrequests", protectRoute, getSentConnectionRequests);
router.get("/", protectRoute, getUserConnections);
router.get("/:id/status", protectRoute, getConnectionStatus);

export default router;
