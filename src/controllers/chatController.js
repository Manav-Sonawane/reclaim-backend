import Chat from "../models/chat.js";
import Item from "../models/item.js";

// @desc    Get user's chats
// @route   GET /api/chats
// @access  Private
export const getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "name email profilePicture")
      .populate("item", "title images")
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get or create a chat for an item
// @route   POST /api/chats
// @access  Private
export const createOrGetChat = async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: "ItemId is required" });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Check if chat already exists between these users for this item
    // Assuming 2 participants: current user and item owner
    const existingChat = await Chat.findOne({
      item: itemId,
      participants: { $all: [req.user._id, item.user] },
    })
      .populate("participants", "name profilePicture")
      .populate("item", "title");

    if (existingChat) {
      return res.json(existingChat);
    }

    // Create new chat
    const chat = new Chat({
      item: itemId,
      participants: [req.user._id, item.user],
      messages: [],
    });

    const createdChat = await chat.save();

    // Populate before returning
    const fullChat = await Chat.findById(createdChat._id)
      .populate("participants", "name profilePicture")
      .populate("item", "title");

    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get chat details
// @route   GET /api/chats/:id
// @access  Private
export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate("participants", "name email profilePicture")
      .populate("item", "title images type")
      .populate("messages.sender", "name");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Check if user has unread messages
// @route   GET /api/chats/unread
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const hasUnread = await Chat.exists({
      participants: req.user._id,
      messages: {
        $elemMatch: {
          sender: { $ne: req.user._id },
          read: false
        }
      }
    });

    res.json({ hasUnread: !!hasUnread });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Mark chat messages as read
// @route   PUT /api/chats/:id/read
// @access  Private
export const markChatRead = async (req, res) => {
  try {
    await Chat.updateOne(
      { _id: req.params.id },
      {
        $set: {
          "messages.$[elem].read": true,
        },
      },
      {
        arrayFilters: [{ "elem.sender": { $ne: req.user._id }, "elem.read": false }],
      }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
