// middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // 1. Log l'erreur (important pour le debugging)
  console.error("🚨 Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req?.method,
    body: req.body || {},
    timestamp: new Date().toISOString(),
  });

  // 2. Erreurs de validation Mongoose
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: "Validation Error",
      message: errors,
    });
  }

  // 3. Duplication de clé unique (MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: "Duplicate Field",
      message: `${field} already exists`,
    });
  }

  // 4. JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  // 5. JWT expired
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // 6. Cast Error (MongoDB invalid ID)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  // 7. Erreur personnalisée avec status code
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // 8. 🎯 ERREUR GÉNÉRIQUE (fallback)
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong!"
        : err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
