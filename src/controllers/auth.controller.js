import User from "../models/Auth.models.js";
import { AppError } from "../utils/appError.utils.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";
import dotenv from "dotenv";

dotenv.config();

// ============================================
// CREATE A NEW USER (REGISTER)
// ============================================
/**
 * @desc    Create a new user
 * @route   POST /api/users
 * @access  Public
 */
export const register = catchAsynch(async (req, res, next) => {
  const data = req.body;

  const { fullName } = data;

  const sliceName = fullName.trim().split(" ");
  const firstName = sliceName[0];
  const lastName = sliceName.slice(1).join(" ") || "";



  const newUser = await User.create({ ...data, firstName, lastName });

  // Générer token
  const token = jwt.sign(
    { id: newUser._id, role: newUser.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  const refreshToken = jwt.sign(
    { id: newUser._id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: newUser,
    token,
    refreshToken,
  });
});


export const login = catchAsynch(async (req, res, next) => {
  const { email, password } = req.body;

  // Vérifier utilisateur
  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new AppError("Invalid credentials", 401));

  // Vérifier password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new AppError("Invalid credentials", 401));

  // Générer token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    token,
    refreshToken,
    data: user,
  });
});

// ============================================
// GET ALL USERS
// ============================================
/**
 * @desc    Get all users with optional filters
 * @route   GET /api/users
 * @query   role, isActive, isVerified, page, limit
 * @access  Private (Admin/Staff)
 */
export const getAllUsers = catchAsynch(async (req, res, next) => {
  // All query validations are handled by express-validator middleware
  const { role, isActive, isVerified, page = 1, limit = 10 } = req.query;

  // Build filter dynamically
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (isVerified !== undefined) filter.isVerified = isVerified === "true";

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get users with filter and pagination
  const users = await User.find(filter)
    .select("-password")
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  // Get total count for pagination
  const total = await User.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: users,
  });
});

// ============================================
// GET USER BY ID
// ============================================
/**
 * @desc    Get a single user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUserById = catchAsynch(async (req, res, next) => {
  // ID validation is handled by express-validator middleware
  const { id } = req.params;

  // Find user by ID
  const user = await User.findById(id).select("-password");

  // If user doesn't exist
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// ============================================
// UPDATE USER
// ============================================
/**
 * @desc    Update user information
 * @route   PUT /api/users/:id
 * @access  Private
 */
export const updateUser = catchAsynch(async (req, res, next) => {
  // All validations are handled by express-validator middleware
  const { id } = req.params;
  const updates = req.body;

  // Update user
  const user = await User.findByIdAndUpdate(id, updates, {
    new: true, // Return updated document
    runValidators: true, // Run schema validators
  }).select("-password");

  // If user doesn't exist
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: user,
  });
});

// ============================================
// SOFT DELETE USER
// ============================================
/**
 * @desc    Deactivate user (soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
export const deleteUser = catchAsynch(async (req, res, next) => {
  // ID validation is handled by express-validator middleware
  const { id } = req.params;

  // Soft delete: deactivate user instead of deleting
  const user = await User.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).select("-password");

  // If user doesn't exist
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "User deactivated successfully",
    data: user,
  });
});

// ============================================
// HARD DELETE USER
// ============================================
/**
 * @desc    Permanently delete user
 * @route   DELETE /api/users/:id/hard
 * @access  Private (Admin only)
 */
export const hardDeleteUser = catchAsynch(async (req, res, next) => {
  // ID validation is handled by express-validator middleware
  const { id } = req.params;

  // Permanently delete user
  const user = await User.findByIdAndDelete(id);

  // If user doesn't exist
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "User permanently deleted",
  });
});

// ============================================
// GET USERS BY ROLE
// ============================================
/**
 * @desc    Get all users with specific role
 * @route   GET /api/users/role/:role
 * @access  Private (Admin/Staff)
 */
export const getUsersByRole = catchAsynch(async (req, res, next) => {
  // Role validation is handled by express-validator middleware
  const { role } = req.params;

  // Get users with this role
  const users = await User.find({ role, isActive: true }).select("-password");

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// ============================================
// SEARCH USERS
// ============================================
/**
 * @desc    Search users by name or email
 * @route   GET /api/users/search?query=searchTerm
 * @access  Private (Admin/Staff)
 */
export const searchUsers = catchAsynch(async (req, res, next) => {
  // Query validation is handled by express-validator middleware
  const { query } = req.query;

  // Search in firstName, lastName and email
  const users = await User.find({
    $or: [
      { firstName: { $regex: query, $options: "i" } },
      { lastName: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ],
    isActive: true,
  }).select("-password");

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});
