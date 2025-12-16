import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError.utils.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";
import dotenv from "dotenv";

dotenv.config();

// ============================================
// PROTECT - Verify JWT Token
// ============================================
/**
 * Middleware to protect routes - requires valid JWT
 */
export const authenticate = catchAsynch(async (req, res, next) => {
  let token;

  // 1. Get token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2. Check if token exists
  if (!token) {
    return next(
      new AppError(
        "You are not logged in. Please log in to access this resource.",
        401
      )
    );
  }

  // 3. Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach user info to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(
        new AppError("Your token has expired. Please log in again.", 401)
      );
    }

    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again.", 401));
    }

    return next(new AppError("Authentication failed", 401));
  }
});

// ============================================
// AUTHORIZE - Check user role
// ============================================
/**
 * Middleware to restrict access to specific roles
 * @param  {...string} roles - Allowed roles
 * @example authorize("admin", "staff")
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("You must be logged in", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This resource requires one of these roles: ${roles.join(
            ", "
          )}`,
          403
        )
      );
    }

    next();
  };
};

// ============================================
// IS OWNER OR ADMIN - Check ownership
// ============================================
/**
 * Middleware to check if user is owner of resource or admin
 * Requires req.params.id to be the resource owner's ID
 */
export const isOwnerOrAdmin = (req, res, next) => {
  const resourceOwnerId = req.params.id;

  // Admin can access everything
  if (req.user.role === "admin" || req.user.role === "staff") {
    return next();
  }

  // Check if user is owner
  if (req.user.userId !== resourceOwnerId) {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }

  next();
};
