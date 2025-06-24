import { request } from "express";
import ConnectionRequest from "../models/connectionRequest.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const sendConnectionRequest = async (req, res) => {
  const requestedUserId = req.params.id;
  const senderId = req.user._id;
  try {
    if (senderId.toString() === requestedUserId) {
      return res
        .status(400)
        .json({ message: "You cannot send a connection request to yourself" });
    }
    if (req.user.connections.includes(requestedUserId)) {
      return res
        .status(400)
        .json({ message: "You are already connected with this user" });
    }
    const existingRequest = await ConnectionRequest.findOne({
      sender: senderId,
      recipient: requestedUserId,
      status: "pending",
    });
    if (existingRequest) {
      return res.status(400).json({
        message: "You have already sent a connection request to this user",
      });
    }
    const newRequest = new ConnectionRequest({
      sender: senderId,
      recipient: requestedUserId,
    });
    await newRequest.save();
    res.status(201).json({ message: "Connection request sent successfully" });
  } catch (error) {
    console.log(`Error in sendConnectionRequest: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptConnectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    const request = await ConnectionRequest.findById(requestId)
      .populate("sender", "name username profilePicture")
      .populate("recipient", "name username profilePicture");
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.recipient._id.toString() !== userId.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Connection request already processed" });
    }
    request.status = "accepted";
    await request.save();

    await User.findByIdAndUpdate(request.sender._id, {
      $push: { connections: request.recipient._id },
    });
    await User.findByIdAndUpdate(request.recipient._id, {
      $push: { connections: request.sender._id },
    });

    const notification = new Notification({
      recipient: request.sender._id,
      type: "connectionAccepted",
      relatedUser: request.recipient._id,
      relatedPost: null,
      read: false,
    });
    await notification.save();

    res.json({ message: "Connection request accepted successfully" });
  } catch (error) {
    console.log(`Error in acceptConnectionRequest: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectConnectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    const request = await ConnectionRequest.findById(requestId);
    if (request.recipient._id.toString() !== userId.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Connection request already processed" });
    }
    request.status = "rejected";
    await request.save();
    res.json({ message: "Connection request rejected" });
  } catch (error) {
    console.log(`Error in rejectConnectionRequest: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getConnectionRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const requests = await ConnectionRequest.find({
      recipient: userId,
      status: "pending",
    }).populate("sender", "name username profilePicture headline connections");
    res.status(200).json(requests);
  } catch (error) {
    console.log(`Error in getConnectionRequests: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserConnections = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate(
      "connections",
      "name username profilePicture headline connections"
    );
    res.status(200).json(user.connections);
  } catch (error) {
    console.log(`Error in getUserConnections: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeConnection = async (req, res) => {
  try {
    const userId = req.user._id;
    const connectionId = req.params.id;
    await User.findByIdAndUpdate(userId, {
      $pull: { connections: connectionId },
    });
    await User.findByIdAndUpdate(connectionId, {
      $pull: { connections: userId },
    });
    res.json({ message: "Connection removed successfully" });
  } catch (error) {
    console.log(`Error in removeConnection: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getConnectionStatus = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;
    const currentUser = req.user;

    if (currentUser.connections.includes(targetUserId))
      return res.status(200).json({ status: "connected" });

    const pendingRequest = await ConnectionRequest.findOne({
      $or: [
        { sender: currentUserId, recipient: targetUserId, status: "pending" },
        { sender: targetUserId, recipient: currentUserId, status: "pending" },
      ],
    });

    if (pendingRequest) {
      if (pendingRequest.sender.toString() === currentUserId.toString()) {
        return res.status(200).json({ status: "pending" });
      } else {
        return res
          .status(200)
          .json({ status: "received", requestId: pendingRequest._id });
      }
    }

    if (currentUser.connections.includes(targetUserId))
      return res.status(200).json({ status: "connected" });

    return res.status(200).json({ status: "Not Connected" });
  } catch (error) {
    console.log(`Error in getConnectionStatus: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSentConnectionRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const requests = await ConnectionRequest.find({
      sender: userId,
      status: "pending",
    }).populate(
      "recipient",
      "name username profilePicture headline connections"
    );
    res.status(200).json(requests);
  } catch (error) {
    console.log(`Error in getConnectionRequests: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};
