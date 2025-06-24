import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getSuggestedUsers = async (req, res) => {
  try {
    const currentuser = await User.findById(req.user._id).select("connections");
    const suggestedUsers = await User.find({
      _id: {
        $ne: req.user._id,
        $nin: currentuser.connections,
      },
    })
      .select("name username headline profilePicture")
      .limit(4);
    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log(`Error in getSuggestedUsers: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const allusers = await User.find().select(
      "name username headline profilePicture"
    );
    res.status(200).json(allusers);
  } catch (error) {
    console.log(`Error in getAllUsers: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      "-password"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log(`Error in getPublicProfile: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "headline",
      "profilePicture",
      "bannerImg",
      "location",
      "about",
      "skills",
      "experience",
      "education",
      "projects",
      "interests",
    ];
    const fieldsToUpdate = {};
    allowedFields.forEach((field) => {
      if (req.body[field]) fieldsToUpdate[field] = req.body[field];
    });

    if (req.body.profilePicture) {
      const result = await cloudinary.uploader.upload(req.body.profilePicture);
      fieldsToUpdate.profilePicture = result.secure_url;
    }

    if (req.body.bannerImg) {
      const result = await cloudinary.uploader.upload(req.body.bannerImg);
      fieldsToUpdate.bannerImg = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
    });
    res.status(200).json(user);
  } catch (error) {
    console.log(`Error in updateProfile: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};
