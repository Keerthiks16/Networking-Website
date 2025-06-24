import express from "express";
import {
  deleteNotification,
  getUserNotifications,
  readNotification,
} from "../controllers/notification.controller.js";
import { protectRoute } from "../middlewares/protectRoute.js";
const router = express.Router();

router.get("/", protectRoute, getUserNotifications);
router.put("/:id/read", protectRoute, readNotification);
router.delete("/:id/delete", protectRoute, deleteNotification);

export default router;
