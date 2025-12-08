import * as userService from "../services/auth.service.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";

export const register = catchAsynch(async (req, res) => {
  const { user, token, refreshToken } = await userService.registerUser(
    req.body
  );
  res
    .status(201)
    .json({
      success: true,
      message: "User created successfully",
      data: user,
      token,
      refreshToken,
    });
});

export const login = catchAsynch(async (req, res) => {
  const { email, password } = req.body;
  const { user, token, refreshToken } = await userService.loginUser(
    email,
    password
  );
  res
    .status(200)
    .json({
      success: true,
      message: "Logged in successfully",
      data: user,
      token,
      refreshToken,
    });
});

export const getAllUsers = catchAsynch(async (req, res) => {
  const result = await userService.getAllUsers(req.query);
  res.status(200).json({ success: true, ...result, data: result.users });
});

export const getUserById = catchAsynch(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({ success: true, data: user });
});

export const updateUser = catchAsynch(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res
    .status(200)
    .json({ success: true, message: "User updated successfully", data: user });
});

export const deleteUser = catchAsynch(async (req, res) => {
  const user = await userService.softDeleteUser(req.params.id);
  res
    .status(200)
    .json({
      success: true,
      message: "User deactivated successfully",
      data: user,
    });
});

export const hardDeleteUser = catchAsynch(async (req, res) => {
  await userService.hardDeleteUser(req.params.id);
  res.status(200).json({ success: true, message: "User permanently deleted" });
});

export const getUsersByRole = catchAsynch(async (req, res) => {
  const users = await userService.getUsersByRole(req.params.role);
  res.status(200).json({ success: true, count: users.length, data: users });
});

export const searchUsers = catchAsynch(async (req, res) => {
  const users = await userService.searchUsers(req.query.query);
  res.status(200).json({ success: true, count: users.length, data: users });
});
