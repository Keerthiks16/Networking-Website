import cloudinary from "../lib/cloudinary.js";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";

export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: { $in: req.user.connections } })
      .populate("author", "name username headline profilePicture")
      .populate("comments.user", "name profilePicture")
      .populate("contributors", "name username headline profilePicture")
      .populate("mentors", "name username headline profilePicture")
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.log(`Error in getFeedPosts: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content, image, date, skills, venue, contributors, mentors } =
      req.body;
    let newPost;
    if (!content && !image) {
      return res.status(400).json({ message: "Content or image is required" });
    }
    if (image) {
      const imgResult = await cloudinary.uploader.upload(image);
      newPost = new Post({
        author: req.user._id,
        content,
        image: imgResult.secure_url,
        date: date || null,
        skills: skills || [],
        venue: venue || null,
        contributors: contributors || [],
        mentors: mentors || [],
      });
    } else {
      newPost = new Post({
        author: req.user._id,
        content,
        date: date || null,
        skills: skills || [],
        venue: venue || null,
        contributors: contributors || [],
        mentors: mentors || [],
      });
    }
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.log(`Error in createPost: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== userId.toString())
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this post" });

    if (post.image) {
      const imgId = post.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }
    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log(`Error in deletePost: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId)
      .populate("author", "name username headline profilePicture")
      .populate("comments.user", "name username headline profilePicture")
      .populate("contributors", "name username headline profilePicture")
      .populate("mentors", "name username headline profilePicture");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post);
  } catch (error) {
    console.log(`Error in getPostById: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;

    if (!content)
      return res.status(400).json({ message: "Content is required" });

    const post = await Post.findByIdAndUpdate(postId, {
      $push: { comments: { content, user: req.user._id } },
    }).populate("author", "name username email headline profilePicture");

    if (post.author._id.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        recipient: post.author._id,
        type: "comment",
        relatedUser: req.user._id,
        relatedPost: post._id,
      });
      await notification.save();
    }
    res.status(200).json(post);
  } catch (error) {
    console.log(`Error in createComment: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.likes.includes(userId)) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();

    if (post.author._id.toString() !== userId.toString()) {
      const notification = new Notification({
        recipient: post.author._id,
        type: "like",
        relatedUser: userId,
        relatedPost: post._id,
      });
      await notification.save();
    }

    res.status(200).json(post);
  } catch (error) {
    console.log(`Error in likePost: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const myPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const posts = await Post.find({ author: userId })
      .populate("author", "name username headline profilePicture")
      .populate("comments.user", "name profilePicture")
      .populate("contributors", "name username headline profilePicture")
      .populate("mentors", "name username headline profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.log(`Error in myPosts: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

// New endpoints for contributors and mentors

export const addContributor = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the author can add contributors" });
    }

    // Check if user is already a contributor
    if (post.contributors.includes(userId)) {
      return res.status(400).json({ message: "User is already a contributor" });
    }

    post.contributors.push(userId);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log(`Error in addContributor: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeContributor = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the author can remove contributors" });
    }

    post.contributors.pull(userId);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log(`Error in removeContributor: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addMentor = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the author can add mentors" });
    }

    // Check if user is already a mentor
    if (post.mentors.includes(userId)) {
      return res.status(400).json({ message: "User is already a mentor" });
    }

    post.mentors.push(userId);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log(`Error in addMentor: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeMentor = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the author can remove mentors" });
    }

    post.mentors.pull(userId);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log(`Error in removeMentor: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePostSkills = async (req, res) => {
  try {
    const postId = req.params.id;
    const { skills } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the author can update skills" });
    }

    post.skills = skills;
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log(`Error in updatePostSkills: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePostDetails = async (req, res) => {
  try {
    const postId = req.params.id;
    const { date, venue } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the author can update post details" });
    }

    if (date !== undefined) post.date = date;
    if (venue !== undefined) post.venue = venue;

    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log(`Error in updatePostDetails: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchLikedPosts = async (req, res) => {
  try {
    const userId = req.user._id;

    const likedPosts = await Post.find({ likes: userId })
      .populate("author", "name username headline profilePicture")
      .populate("comments.user", "name profilePicture")
      .populate("contributors", "name username headline profilePicture")
      .populate("mentors", "name username headline profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(likedPosts);
  } catch (error) {
    console.log(`Error in fetchLikedPosts: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};
