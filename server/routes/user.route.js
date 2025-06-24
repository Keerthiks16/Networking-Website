import express from "express";
import {
  getAllUsers,
  getPublicProfile,
  getSuggestedUsers,
  updateProfile,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middlewares/protectRoute.js";
const router = express.Router();
router.get("/usersuggestions", protectRoute, getSuggestedUsers);
router.get("/getallusers", protectRoute, getAllUsers);
router.get("/:username", protectRoute, getPublicProfile);
router.put("/profile", protectRoute, updateProfile);

export default router;
