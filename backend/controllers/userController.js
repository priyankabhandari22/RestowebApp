import mongoose from "mongoose";
import User from "../models/User.js";

const sendNotFound = (res, message) => res.status(404).json({ message });

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load users.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return sendNotFound(res, "User not found.");
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load the user.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { fullName, phone, address, landmark = "", deliveryTime = "asap" } = req.body || {};

    if (!fullName || !phone || !address) {
      return res.status(400).json({
        message: "fullName, phone, and address are required.",
      });
    }

    const user = await User.create({
      fullName,
      phone,
      address,
      landmark,
      deliveryTime,
    });

    res.status(201).json({
      message: "User created successfully.",
      user,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "A user with this phone number already exists.",
      });
    }

    res.status(500).json({
      message: "Unable to create user.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return sendNotFound(res, "User not found.");
    }

    res.json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A user with this phone number already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to update user.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return sendNotFound(res, "User not found.");
    }

    res.json({
      message: "User deleted successfully.",
      user: deletedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to delete user.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};