export const catchAsynch = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// utils/appError.js
