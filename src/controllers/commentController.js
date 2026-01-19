import Comment from "../models/comment.js";
import Item from "../models/item.js";

// @desc    Add a comment to an item
// @route   POST /api/items/:id/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const itemId = req.params.id;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: "Comment too long (max 1000 chars)" });
    }

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const comment = await Comment.create({
      content,
      item: itemId,
      user: req.user._id,
    });

    // Populate user info to return immediately
    const populatedComment = await Comment.findById(comment._id).populate(
      "user",
      "name email"
    );

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get comments for an item
// @route   GET /api/items/:id/comments
// @access  Public
export const getComments = async (req, res) => {
  try {
    const itemId = req.params.id;

    const comments = await Comment.find({ item: itemId })
      .populate("user", "name email")
      .sort({ createdAt: -1 }); // Newest first

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Server error" });
  }
};
