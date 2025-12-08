// services/user.service.js
import User from "../models/Auth.models.js";
import { AppError } from "../utils/appError.utils.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const registerUser = async (data) => {
  const sliceName = data.fullName.trim().split(" ");
  const firstName = sliceName[0];
  const lastName = sliceName.slice(1).join(" ") || "";

  const newUser = await User.create({ ...data, firstName, lastName });

  const token = jwt.sign(
    { id: newUser._id, role: newUser.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  const refreshToken = jwt.sign(
    { id: newUser._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { user: newUser, token, refreshToken };
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new AppError("Invalid credentials", 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { user, token, refreshToken };
};

export const getAllUsers = async ({
  role,
  isActive,
  isVerified,
  page = 1,
  limit = 10,
}) => {
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (isVerified !== undefined) filter.isVerified = isVerified === "true";

  const skip = (page - 1) * limit;
  const users = await User.find(filter)
    .select("-password")
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });
  const total = await User.countDocuments(filter);

  return { users, total, page, pages: Math.ceil(total / limit) };
};

export const getUserById = async (id) => {
  const user = await User.findById(id).select("-password");
  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const updateUser = async (id, updates) => {
  const user = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");
  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const softDeleteUser = async (id) => {
  const user = await User.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).select("-password");
  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const hardDeleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new AppError("User not found", 404);
  return true;
};

export const getUsersByRole = async (role) => {
  const users = await User.find({ role, isActive: true }).select("-password");
  return users;
};

export const searchUsers = async (query) => {
  const users = await User.find({
    $or: [
      { firstName: { $regex: query, $options: "i" } },
      { lastName: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ],
    isActive: true,
  }).select("-password");

  return users;
};
