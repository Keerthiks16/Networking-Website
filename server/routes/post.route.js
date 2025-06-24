import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import {
  createComment,
  createPost,
  deletePost,
  fetchLikedPosts,
  getFeedPosts,
  getPostById,
  likePost,
  myPosts,
} from "../controllers/post.controller.js";
const router = express.Router();

router.get("/", protectRoute, getFeedPosts);
router.post("/create", protectRoute, createPost);
router.get("/myposts", protectRoute, myPosts);
router.get("/likedposts", protectRoute, fetchLikedPosts);
router.delete("/delete/:id", protectRoute, deletePost);
router.get("/:id", protectRoute, getPostById);
router.post("/:id/comment", protectRoute, createComment);
router.post("/:id/like", protectRoute, likePost);

export default router;
