import Post from "../models/Post.js";
import User from "../models/User.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* CREATE */
export const createPost = async (req, res) => {
  try {
    let { userId, description, picturePath, videoPath, tags = [] } = req.body;
    tags = JSON.parse(tags);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath: user.picturePath,
      picturePath,
      videoPath,
      likes: {},
      comments: [],
    });

    await newPost.save();

    // Fetch user's friends
    const friends = user.friends;

    // Send a notification to each friend
    friends.forEach(async (friendId) => {
      const friend = await User.findById(friendId);

      if (friend && friend.socketId) {
        req.io.to(friend.socketId).emit("notification", {
          message: `${user.firstName} ${user.lastName} has created a new post`,
          postId: newPost._id,
          userId: user._id,
          userName: `${user.firstName} ${user.lastName}`,
        });
      }
    });

    // Send a notification to each tag
    tags?.forEach(async (friendId) => {
      const friend = await User.findById(friendId);
      if (friend && friend.socketId && friendId !== userId) {
        req.io.to(friend.socketId).emit("notification", {
          message: `${user.firstName} ${user.lastName} has taged you on a new post`,
          postId: newPost._id,
          userId: user._id,
          userName: `${user.firstName} ${user.lastName}`,
        });
      }
    });

    const posts = await Post.find().populate({
      path: "comments",
      populate: {
        path: "user",
        select: "firstName lastName picturePath location",
      },
    });
    res.status(201).json(posts);
  } catch (err) {
    console.log(err.message);
    res.status(409).json({ message: err.message });
  }
};

export const createPostProfile = async (req, res) => {
  try {
    let { userId, description, picturePath, videoPath, tags } = req.body;
    const user = await User.findById(userId);
    tags = JSON.parse(tags);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath: user.picturePath,
      picturePath,
      videoPath,
      likes: {},
      comments: [],
    });

    await newPost.save();

    // Fetch user's friends
    const friends = user.friends;

    // Send a notification to each friend
    friends.forEach(async (friendId) => {
      const friend = await User.findById(friendId);

      if (friend && friend.socketId) {
        req.io.to(friend.socketId).emit("notification", {
          message: `${user.firstName} ${user.lastName} has created a new post`,
          postId: newPost._id,
          userId: user._id,
          userName: `${user.firstName} ${user.lastName}`,
        });
      }
    });

    tags?.forEach(async (friendId) => {
      const friend = await User.findById(friendId);
      if (friend && friend.socketId && friendId !== userId) {
        req.io.to(friend.socketId).emit("notification", {
          message: `${user.firstName} ${user.lastName} has taged you on a new post`,
          postId: newPost._id,
          userId: user._id,
          userName: `${user.firstName} ${user.lastName}`,
        });
      }
    });

    const posts = await Post.find({ userId }).populate({
      path: "comments",
      populate: {
        path: "user",
        select: "firstName lastName picturePath location",
      },
    });
    res.status(201).json(posts);
  } catch (err) {
    console.log(err.message);
    res.status(409).json({ message: err.message });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate({
      path: "comments",
      populate: {
        path: "user",
        select: "firstName lastName picturePath location",
      },
    });

    res.status(200).json(posts);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ userId }).populate({
      path: "comments",
      populate: {
        path: "user",
        select: "firstName lastName picturePath location",
      },
    });

    res.status(200).json(posts);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
    const isLiked = post.likes.get(userId);

    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { likes: post.likes },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* ADD COMMENT */
export const addComment = async (req, res) => {
  try {
    const { id } = req.params; // Post ID
    const { userId, comment } = req.body; // User ID and comment text

    // Find the post by ID
    const post = await Post.findById(id);

    // Create the new comment object
    const newComment = {
      user: userId,
      comment: comment,
    };

    // Add the new comment to the comments array
    post.comments.push(newComment);

    // Save the updated post
    await post.save();

    // Populate the comments with user details
    const updatedPost = await Post.findById(id).populate({
      path: "comments",
      populate: {
        path: "user",
        select: "firstName lastName picturePath location",
      },
    });

    // Return the updated post with populated comments
    res.status(200).json(updatedPost);
  } catch (err) {
    console.log(err.message);
    res.status(404).json({ message: err.message });
  }
};

/* EDIT COMMENT */
export const editComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params; // Post ID and Comment ID
    const { comment } = req.body; // New comment text
    // Find the post by ID
    const post = await Post.findById(postId);
    // Find the comment by ID
    const commentToEdit = post.comments.id(commentId);

    if (!commentToEdit) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Update the comment text
    commentToEdit.comment = comment;

    // Save the updated post
    await post.save();

    // Return the updated post with populated comments
    const updatedPost = await Post.findById(postId).populate({
      path: "comments",
      populate: {
        path: "user",
        select: "firstName lastName picturePath location",
      },
    });

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* DELETE COMMENT */
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params; // Post ID and Comment ID

    // Find the post by ID
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Remove the comment from the post
    post.comments = post.comments.filter(
      (comment) => comment._id.toString() !== commentId
    );

    // Save the updated post
    await post.save();

    // Return the updated post with populated comments
    const updatedPost = await Post.findById(postId).populate({
      path: "comments",
      populate: {
        path: "user",
        select: "firstName lastName picturePath location",
      },
    });

    res.status(200).json(updatedPost);
  } catch (err) {
    console.log(err.message);
    res.status(404).json({ message: err.message });
  }
};

/* Delete post */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "You are not authorized" });
    }

    if (post.picturePath) {
      const filePath = path.join(
        __dirname,
        "..",
        "public",
        "assets",
        post.picturePath || post.videoPath
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    console.log("Deleted post");
    await Post.findByIdAndDelete(id);
    const posts = await Post.find().populate({
      path: "comments",
      populate: {
        path: "user",
        select: "firstName lastName picturePath location",
      },
    });

    res.status(200).json(posts);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: err.message });
  }
};

/* DELETE POST AND RESEND POST OF THE USERID */

export const deletePostProfile = async (req, res) => {
  try {
    const { postId, userId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "You are not authorized" });
    }

    if (post.picturePath) {
      const filePath = path.join(
        __dirname,
        "..",
        "public",
        "assets",
        post.picturePath || post.videoPath
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    console.log("Deleted post");
    await Post.findByIdAndDelete(postId);
    const posts = await Post.find({ userId: userId }).populate({
      path: "comments",
      populate: {
        path: "user",
        select: "firstName lastName picturePath location",
      },
    });

    res.status(200).json(posts);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: err.message });
  }
};

/* Get one post */
export const getOnePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate({
      path: "comments",
      populate: {
        path: "user",
        select: "firstName lastName picturePath location",
      },
    });

    res.status(200).json(post);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: err.message });
  }
};

/* Reseach */

// Route to handle search
export const searchFun = async (req, res) => {
  const query = req.query.query;

  try {
    // Ensure query is properly sanitized and handled as a string
    const sanitizedQuery = query ? query.toString().toLowerCase() : "";

    // Search users by first or last name
    const users = await User.find({
      $or: [
        { firstName: { $regex: sanitizedQuery, $options: "i" } },
        { lastName: { $regex: sanitizedQuery, $options: "i" } },
      ],
    }).limit(5); // Limit to top 5 results

    // Search posts by description
    const posts = await Post.find({
      description: { $regex: sanitizedQuery, $options: "i" },
    }).limit(5); // Limit to top 5 results

    res.json({ users, posts });
  } catch (error) {
    console.error("Error during search:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};
