import User from "../models/user.model.js";
import bycrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const EmailRegex = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
    if (!EmailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const UserExistByEmail = await User.findOne({ email: email });
    if (UserExistByEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const UserExistByUsername = await User.findOne({ username: username });
    if (UserExistByUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password should be atleast 6 characters long" });
    }

    const salt = await bycrypt.genSalt(10);
    const hashpassword = await bycrypt.hash(password, salt);
    const user = new User({
      name,
      username,
      email,
      password: hashpassword,
    });
    await user.save();
    generateToken(user._id, res);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.log(`Error in signup: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bycrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);
    res.status(200).json({ message: "Login successfully" });
  } catch (error) {
    console.log(`Error in login: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("jwt-networking-token");
    res.status(200).json({ message: "Logout successfully" });
  } catch (error) {
    console.log(`Error in logout: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    console.log(`Error in getCurrentUser: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};
