import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import socketManager from "../socket/socket.js";

/**
 * Send a new message in a conversation
 * @route POST /api/conversations/send/:receiverId
 * @access Private
 */
export const sendMessage = async (req, res) => {
  try {
    // Extract sender ID from authenticated user
    const { id: senderId } = req.user;

    // Extract receiver ID and message content from request body
    const { receiverId } = req.params;
    const { message } = req.body;

    // Validate input
    if (!receiverId || !message) {
      return res.status(400).json({
        error: "Receiver ID and message are required",
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        error: "Receiver not found",
      });
    }
    // Find or create a conversation between two users
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    // If no existing conversation, create a new one
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        messages: [], // Initialize empty messages array
      });
    }

    // Create new message object
    const newMessage = {
      sender: senderId,
      content: message.trim(), // Remove leading/trailing whitespace
      timestamp: new Date(),
      readBy: [senderId], // Mark as read by sender
    };

    // Add message to conversation
    conversation.messages.push(newMessage);

    // Save the conversation with new message
    await conversation.save();

    // Populate sender details for the new message
    await conversation.populate({
      path: "messages.sender",
      select: "name username profilePicture",
    });

    // Get the most recently added message
    const savedMessage =
      conversation.messages[conversation.messages.length - 1];

    // Socket.IO real-time message sending
    const receiverSocketId = socketManager.getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      socketManager.io.to(receiverSocketId).emit("newMessage", {
        conversationId: conversation._id,
        message: savedMessage,
        sender: {
          _id: senderId,
          name: req.user.name,
          profilePicture: req.user.profilePicture,
        },
      });
    }
    // Respond with the saved message
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error in sendMessage controller:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * Get messages for a specific conversation
 * @route GET /api/conversations/messages/:receiverId
 * @access Private
 */
export const getMessages = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { receiverId } = req.params;

    // Find conversation between two users
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, receiverId] },
    })
      .populate({
        path: "messages.sender",
        select: "name username profilePicture",
      })
      .sort({ "messages.timestamp": 1 });

    // If no conversation exists, return empty array
    if (!conversation) {
      return res.status(200).json([]);
    }

    // Mark all messages as read by the current user
    conversation.messages.forEach((message) => {
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
      }
    });
    await conversation.save();

    // Return messages
    res.status(200).json(conversation.messages);
  } catch (error) {
    console.error("Error in getMessages controller:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * Get all conversations for the current user
 * @route GET /api/conversations
 * @access Private
 */
export const getUserConversations = async (req, res) => {
  try {
    const { id: userId } = req.user;

    // Find conversations where the user is a participant
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "name username profilePicture headline",
        match: { _id: { $ne: userId } }, // Exclude the current user
      })
      .populate({
        path: "messages",
        options: {
          limit: 1,
          sort: { timestamp: -1 },
        },
        populate: {
          path: "sender",
          select: "name",
        },
      })
      .sort({ "messages.timestamp": -1 });

    // Transform conversations for frontend
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants[0];
      const lastMessage = conv.messages[0];

      return {
        id: conv._id,
        user: {
          _id: otherParticipant._id,
          name: otherParticipant.name,
          username: otherParticipant.username,
          profilePicture: otherParticipant.profilePicture,
          headline: otherParticipant.headline,
        },
        lastMessage: lastMessage
          ? {
              text: lastMessage.content,
              sender: lastMessage.sender.name,
              timestamp: lastMessage.timestamp,
            }
          : null,
      };
    });

    res.status(200).json(formattedConversations);
  } catch (error) {
    console.error("Error in getUserConversations controller:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * Delete a specific message
 * @route DELETE /api/conversations/messages/:messageId
 * @access Private
 */
export const deleteMessage = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { messageId } = req.params;

    // Find the conversation containing the message
    const conversation = await Conversation.findOne({
      "messages._id": messageId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation or message not found",
      });
    }

    // Find the specific message
    const message = conversation.messages.id(messageId);

    // Check if the user is the sender of the message
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        error: "Not authorized to delete this message",
      });
    }

    // Remove the message
    message.remove();
    await conversation.save();

    res.status(200).json({
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteMessage controller:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export default {
  sendMessage,
  getMessages,
  getUserConversations,
  deleteMessage,
};
