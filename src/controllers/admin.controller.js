import userService from "../services/user.service.js";

// ============================================
// REGISTER
// ============================================
export const register = async (req, res, next) => {
  try {
    const result = await userService.register(req.body);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LOGIN
// ============================================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await userService.login(email, password);

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REFRESH TOKEN
// ============================================
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await userService.refreshAccessToken(refreshToken);

    res.status(200).json({
      status: "success",
      message: "Token refreshed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LOGOUT
// ============================================
export const logout = async (req, res, next) => {
  try {
    const uid = req.user.user || req.user.userId;
    const result = await userService.logout(uid);

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// FORGOT PASSWORD
// ============================================
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await userService.forgotPassword(email);

    res.status(200).json({
      status: "success",
      message: result.message,
      data: { resetToken: result.resetToken },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// RESET PASSWORD
// ============================================
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const result = await userService.resetPassword(token, newPassword);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CHANGE PASSWORD
// ============================================
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const uid = req.user.user || req.user.userId;
    const result = await userService.changePassword(
      uid,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET CURRENT USER
// ============================================
export const getCurrentUser = async (req, res, next) => {
  try {
    const uid = req.user.user || req.user.userId;
    const user = await userService.getUserById(uid);

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET USER BY ID
// ============================================
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE PROFILE
// ============================================
export const updateProfile = async (req, res, next) => {
  try {
    const uid = req.user.user || req.user.userId;
    const user = await userService.updateProfile(uid, req.body);

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET ALL USERS
// ============================================
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, search, page, limit } = req.query;
    const filters = { role, isActive, search };
    const result = await userService.getAllUsers(filters, page, limit);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET USERS BY ROLE
// ============================================
export const getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.params;
    const users = await userService.getUsersByRole(role);

    res.status(200).json({
      status: "success",
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// SUSPEND USER
// ============================================
export const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.suspendUser(id);

    res.status(200).json({
      status: "success",
      message: "User suspended successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ACTIVATE USER
// ============================================
export const activateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.activateUser(id);

    res.status(200).json({
      status: "success",
      message: "User activated successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// DELETE USER
// ============================================
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await userService.deleteUser(id);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE REALTOR BANK DETAILS
// ============================================
export const updateRealtorBankDetails = async (req, res, next) => {
  try {
    const user = await userService.updateRealtorBankDetails(
      req.user.userId,
      req.body
    );

    res.status(200).json({
      status: "success",
      message: "Bank details updated successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET USER STATISTICS
// ============================================
export const getUserStatistics = async (req, res, next) => {
  try {
    const stats = await userService.getUserStatistics();

    res.status(200).json({
      status: "success",
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GENERATE EMAIL VERIFICATION TOKEN
// ============================================
export const generateEmailVerificationToken = async (req, res, next) => {
  try {
    const token = await userService.generateEmailVerificationToken(
      req.user.userId
    );

    res.status(200).json({
      status: "success",
      message: "Verification token generated",
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// VERIFY EMAIL
// ============================================
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await userService.verifyEmail(token);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
