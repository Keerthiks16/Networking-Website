import Notification from "../models/notification.model.js";

export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("relatedUser", "name username profilePicture")
      .populate("relatedPost", "content image comments");
    res.status(200).json(notifications);
  } catch (error) {
    console.log(`Error in getUserNotifications: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const readNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id,
      },
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    console.log(`Error in readNotification: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user._id,
    });
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.log(`Error in deleteNotification: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};
