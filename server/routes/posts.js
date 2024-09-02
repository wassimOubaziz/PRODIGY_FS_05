import express from "express";
import {
  getFeedPosts,
  getUserPosts,
  likePost,
  addComment,
  editComment,
  deleteComment,
  deletePost,
  deletePostProfile,
  getOnePost,
  searchFun,
} from "../controllers/posts.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/", verifyToken, getFeedPosts);
router.get("/:userId/posts", verifyToken, getUserPosts);
router.get("/:id", verifyToken, getOnePost);

/* UPDATE */
router.patch("/:id/like", verifyToken, likePost);
router.post("/:id/comment", verifyToken, addComment); // Add a comment to a post
router.patch("/:postId/comments/:commentId", verifyToken, editComment); // Edit a comment

/* DELETE COMMENT */
router.delete("/:postId/comments/:commentId", verifyToken, deleteComment);

/* DELETE POST */
router.delete("/:id", verifyToken, deletePost);
router.delete("/:postId/:userId", verifyToken, deletePostProfile);

/* Search */
router.get("/best/search", verifyToken, searchFun);

export default router;
