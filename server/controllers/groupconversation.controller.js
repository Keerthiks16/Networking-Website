import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import socketManager from "../socket/socket.js";

export const createGroupConversation = async (req, res) => {
  try {
    const { id: creatorId } = req.user;
    const { name, participants, initialMessage } = req.body;

    // Validate input
    if (
      !name ||
      !participants ||
      !Array.isArray(participants) ||
      participants.length < 2
    ) {
      return res.status(400).json({
        error: "Group name and at least 2 other participants are required",
      });
    }

    // Make sure creator is included in participants
    if (!participants.includes(creatorId)) {
      participants.push(creatorId);
    }

    // Verify all participants exist
    const users = await User.find({ _id: { $in: participants } });
    if (users.length !== participants.length) {
      return res.status(404).json({
        error: "One or more participants were not found",
      });
    }

    // Create new group conversation
    const newGroupConversation = await Conversation.create({
      participants: participants,
      isGroupChat: true,
      groupName: name,
      groupAdmin: creatorId,
      messages: initialMessage
        ? [
            {
              sender: creatorId,
              content: initialMessage.trim(),
              timestamp: new Date(),
              readBy: [creatorId],
            },
          ]
        : [],
    });

    // Populate the conversation with user details
    await newGroupConversation.populate([
      {
        path: "participants",
        select: "name username profilePicture headline",
      },
      {
        path: "groupAdmin",
        select: "name username profilePicture headline",
      },
      {
        path: "messages.sender",
        select: "name username profilePicture headline",
      },
    ]);

    // Notify all participants via socket
    participants.forEach((participantId) => {
      if (participantId !== creatorId) {
        const receiverSocketId =
          socketManager.getReceiverSocketId(participantId);
        if (receiverSocketId) {
          socketManager.io.to(receiverSocketId).emit("newGroupConversation", {
            conversation: newGroupConversation,
          });
        }
      }
    });

    res.status(201).json(newGroupConversation);
  } catch (error) {
    console.error("Error in createGroupConversation controller:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    // Extract sender ID from authenticated user
    const { id: senderId } = req.user;

    // Extract group ID and message content from request
    const { groupId } = req.params;
    const { message } = req.body;

    // Validate input
    if (!groupId || !message) {
      return res.status(400).json({
        error: "Group ID and message are required",
      });
    }

    // Find the group conversation
    const conversation = await Conversation.findById(groupId);

    // Check if group exists and is a group chat
    if (!conversation || !conversation.isGroupChat) {
      return res.status(404).json({
        error: "Group conversation not found",
      });
    }

    // Verify that sender is a participant in the group
    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({
        error: "Not authorized to send messages in this group",
      });
    }

    // Create new message object
    const newMessage = {
      sender: senderId,
      content: message.trim(),
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

    // Socket.IO real-time message sending to all participants except sender
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== senderId) {
        const receiverSocketId = socketManager.getReceiverSocketId(
          participantId.toString()
        );
        if (receiverSocketId) {
          socketManager.io.to(receiverSocketId).emit("newGroupMessage", {
            conversationId: conversation._id,
            message: savedMessage,
            sender: {
              _id: senderId,
              name: req.user.name,
              profilePicture: req.user.profilePicture,
            },
            groupName: conversation.groupName,
          });
        }
      }
    });

    // Respond with the saved message
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage controller:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { groupId } = req.params;

    // Find the group conversation
    const conversation = await Conversation.findById(groupId);

    // Check if group exists and is a group chat
    if (!conversation || !conversation.isGroupChat) {
      return res.status(404).json({
        error: "Group conversation not found",
      });
    }

    // Verify that user is a participant in the group
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        error: "Not authorized to view messages in this group",
      });
    }

    // Populate messages with sender details
    await conversation.populate({
      path: "messages.sender",
      select: "name username profilePicture",
    });

    // Mark all messages as read by the current user
    conversation.messages.forEach((message) => {
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
      }
    });
    await conversation.save();

    // Return messages
    res.status(200).json({
      groupId: conversation._id,
      groupName: conversation.groupName,
      isAdmin: conversation.groupAdmin.toString() === userId,
      participants: conversation.participants,
      messages: conversation.messages,
    });
  } catch (error) {
    console.error("Error in getGroupMessages controller:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export const addGroupParticipants = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { groupId } = req.params;
    const { participants } = req.body;

    // Validate input
    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length === 0
    ) {
      return res.status(400).json({
        error: "Participants array is required",
      });
    }

    // Find the group conversation
    const conversation = await Conversation.findById(groupId);

    // Check if group exists and is a group chat
    if (!conversation || !conversation.isGroupChat) {
      return res.status(404).json({
        error: "Group conversation not found",
      });
    }

    // Check if user is admin
    if (conversation.groupAdmin.toString() !== userId) {
      return res.status(403).json({
        error: "Only group admin can add participants",
      });
    }

    // Verify all participants exist
    const users = await User.find({ _id: { $in: participants } });
    if (users.length !== participants.length) {
      return res.status(404).json({
        error: "One or more participants were not found",
      });
    }

    // Filter out users who are already in the group
    const newParticipants = participants.filter(
      (p) => !conversation.participants.includes(p)
    );

    if (newParticipants.length === 0) {
      return res.status(400).json({
        error: "All users are already in the group",
      });
    }

    // Add system message about new participants
    const newUsernames = users
      .filter((user) => newParticipants.includes(user._id.toString()))
      .map((user) => user.name)
      .join(", ");

    const systemMessage = {
      sender: userId,
      content: `${req.user.name} added ${newUsernames} to the group`,
      timestamp: new Date(),
      isSystemMessage: true,
      readBy: [userId],
    };

    // Update the conversation
    conversation.participants.push(...newParticipants);
    conversation.messages.push(systemMessage);
    await conversation.save();

    await conversation.populate([
      {
        path: "participants",
        select: "name username profilePicture",
      },
      {
        path: "messages.sender",
        select: "name username profilePicture",
      },
    ]);

    // Notify all participants via socket
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== userId) {
        const receiverSocketId = socketManager.getReceiverSocketId(
          participantId.toString()
        );
        if (receiverSocketId) {
          socketManager.io.to(receiverSocketId).emit("groupUpdated", {
            conversation: conversation,
          });
        }
      }
    });

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in addGroupParticipants controller:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export const removeGroupParticipant = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { groupId, participantId } = req.params;

    // Find the group conversation
    const conversation = await Conversation.findById(groupId);

    // Check if group exists and is a group chat
    if (!conversation || !conversation.isGroupChat) {
      return res.status(404).json({
        error: "Group conversation not found",
      });
    }

    // Check if user is admin or is removing themselves
    if (
      conversation.groupAdmin.toString() !== userId &&
      userId !== participantId
    ) {
      return res.status(403).json({
        error: "Only group admin can remove other participants",
      });
    }

    // Check if participant is in the group
    if (!conversation.participants.includes(participantId)) {
      return res.status(404).json({
        error: "Participant not found in the group",
      });
    }

    // Cannot remove the admin (unless admin is removing themselves)
    if (
      participantId === conversation.groupAdmin.toString() &&
      userId !== participantId
    ) {
      return res.status(403).json({
        error: "Cannot remove the group admin",
      });
    }

    // If admin is leaving, assign a new admin if other participants exist
    let newAdminAssigned = false;
    if (
      participantId === conversation.groupAdmin.toString() &&
      conversation.participants.length > 1
    ) {
      // Find another participant to make admin
      const newAdminId = conversation.participants.find(
        (p) => p.toString() !== participantId
      );
      conversation.groupAdmin = newAdminId;
      newAdminAssigned = true;
    }

    // Get user details for system message
    const removedUser = await User.findById(participantId).select("name");
    const removerUser = await User.findById(userId).select("name");

    // Add system message
    let systemMessage;
    if (userId === participantId) {
      systemMessage = {
        sender: userId,
        content: `${removedUser.name} left the group`,
        timestamp: new Date(),
        isSystemMessage: true,
        readBy: [userId],
      };
    } else {
      systemMessage = {
        sender: userId,
        content: `${removerUser.name} removed ${removedUser.name} from the group`,
        timestamp: new Date(),
        isSystemMessage: true,
        readBy: [userId],
      };
    }

    // If new admin was assigned, add another system message
    let adminSystemMessage;
    if (newAdminAssigned) {
      const newAdmin = await User.findById(conversation.groupAdmin).select(
        "name"
      );
      adminSystemMessage = {
        sender: userId,
        content: `${newAdmin.name} is now the group admin`,
        timestamp: new Date(),
        isSystemMessage: true,
        readBy: [userId],
      };
    }

    // Update the conversation
    conversation.participants = conversation.participants.filter(
      (p) => p.toString() !== participantId
    );
    conversation.messages.push(systemMessage);

    if (adminSystemMessage) {
      conversation.messages.push(adminSystemMessage);
    }

    // If no participants left, delete the conversation
    if (conversation.participants.length === 0) {
      await Conversation.findByIdAndDelete(groupId);
      return res.status(200).json({
        message: "Group deleted as no participants remain",
      });
    }

    await conversation.save();

    await conversation.populate([
      {
        path: "participants",
        select: "name username profilePicture",
      },
      {
        path: "messages.sender",
        select: "name username profilePicture",
      },
    ]);

    // Notify all participants via socket
    conversation.participants.forEach((participantId) => {
      const receiverSocketId = socketManager.getReceiverSocketId(
        participantId.toString()
      );
      if (receiverSocketId) {
        socketManager.io.to(receiverSocketId).emit("groupUpdated", {
          conversation: conversation,
        });
      }
    });

    // Also notify the removed participant
    const removedSocketId = socketManager.getReceiverSocketId(participantId);
    if (removedSocketId) {
      socketManager.io.to(removedSocketId).emit("removedFromGroup", {
        groupId: conversation._id,
        groupName: conversation.groupName,
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in removeGroupParticipant controller:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export const updateGroupDetails = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { groupId } = req.params;
    const { groupName } = req.body;

    // Validate input
    if (!groupName) {
      return res.status(400).json({
        error: "Group name is required",
      });
    }

    // Find the group conversation
    const conversation = await Conversation.findById(groupId);

    // Check if group exists and is a group chat
    if (!conversation || !conversation.isGroupChat) {
      return res.status(404).json({
        error: "Group conversation not found",
      });
    }

    // Check if user is admin
    if (conversation.groupAdmin.toString() !== userId) {
      return res.status(403).json({
        error: "Only group admin can update group details",
      });
    }

    // Add system message about the name change
    const systemMessage = {
      sender: userId,
      content: `${req.user.name} changed the group name to "${groupName}"`,
      timestamp: new Date(),
      isSystemMessage: true,
      readBy: [userId],
    };

    // Update group details
    conversation.groupName = groupName;
    conversation.messages.push(systemMessage);
    await conversation.save();

    await conversation.populate([
      {
        path: "participants",
        select: "name username profilePicture headline",
      },
      {
        path: "messages.sender",
        select: "name username profilePicture headline",
      },
    ]);

    // Notify all participants via socket
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== userId) {
        const receiverSocketId = socketManager.getReceiverSocketId(
          participantId.toString()
        );
        if (receiverSocketId) {
          socketManager.io.to(receiverSocketId).emit("groupUpdated", {
            conversation: conversation,
          });
        }
      }
    });

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in updateGroupDetails controller:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const { id: userId } = req.user;

    // Find all group conversations where the user is a participant
    const groupConversations = await Conversation.find({
      participants: userId,
      isGroupChat: true,
    })
      .populate({
        path: "participants",
        select: "name username profilePicture headline",
      })
      .populate({
        path: "groupAdmin",
        select: "name username profilePicture  headline",
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
      .sort({ updatedAt: -1 });

    // Transform conversations for frontend
    const formattedGroups = groupConversations.map((group) => {
      const lastMessage = group.messages[0];

      return {
        id: group._id,
        name: group.groupName,
        isAdmin: group.groupAdmin.toString() === userId,
        admin: {
          _id: group.groupAdmin._id,
          name: group.groupAdmin.name,
          username: group.groupAdmin.username,
          profilePicture: group.groupAdmin.profilePicture,
        },
        participants: group.participants.map((participant) => ({
          _id: participant._id,
          name: participant.name,
          username: participant.username,
          profilePicture: participant.profilePicture,
        })),
        lastMessage: lastMessage
          ? {
              text: lastMessage.content,
              sender: lastMessage.sender?.name || "Unknown",
              timestamp: lastMessage.timestamp,
              isSystemMessage: lastMessage.isSystemMessage || false,
            }
          : null,
      };
    });

    res.status(200).json(formattedGroups);
  } catch (error) {
    console.error("Error in getUserGroups controller:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export const getGroupDetails = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { groupId } = req.params;

    // Find the group conversation
    const conversation = await Conversation.findById(groupId);

    // Check if group exists and is a group chat
    if (!conversation || !conversation.isGroupChat) {
      return res.status(404).json({
        error: "Group conversation not found",
      });
    }

    // Verify that user is a participant in the group
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        error: "Not authorized to view this group",
      });
    }

    // Populate group details with participant and admin information
    await conversation.populate([
      {
        path: "participants",
        select: "name username profilePicture headline",
      },
      {
        path: "groupAdmin",
        select: "name username profilePicture headline",
      },
      {
        path: "messages",
        options: {
          limit: 1,
          sort: { timestamp: -1 },
        },
        populate: {
          path: "sender",
          select: "name",
        },
      },
    ]);

    // Format group details for frontend
    const groupDetails = {
      id: conversation._id,
      name: conversation.groupName,
      isAdmin: conversation.groupAdmin._id.toString() === userId, // Updated isAdmin check
      createdAt: conversation.createdAt,
      admin: {
        _id: conversation.groupAdmin._id,
        name: conversation.groupAdmin.name,
        username: conversation.groupAdmin.username,
        profilePicture: conversation.groupAdmin.profilePicture,
        headline: conversation.groupAdmin.headline,
      },
      participants: conversation.participants.map((participant) => ({
        _id: participant._id,
        name: participant.name,
        username: participant.username,
        profilePicture: participant.profilePicture,
        headline: participant.headline,
      })),
      participantCount: conversation.participants.length,
      lastMessage: conversation.messages[0]
        ? {
            text: conversation.messages[0].content,
            sender: conversation.messages[0].sender?.name || "Unknown",
            timestamp: conversation.messages[0].timestamp,
            isSystemMessage: conversation.messages[0].isSystemMessage || false,
          }
        : null,
    };

    res.status(200).json(groupDetails);
  } catch (error) {
    console.error("Error in getGroupDetails controller:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export default {
  createGroupConversation,
  sendGroupMessage,
  getGroupMessages,
  addGroupParticipants,
  removeGroupParticipant,
  updateGroupDetails,
  getUserGroups,
  getGroupDetails,
};
