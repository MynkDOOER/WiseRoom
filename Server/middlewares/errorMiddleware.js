import AppError from "../utils/AppError.js";

export default function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Send a valid JSON request body." });
  }
  if (["P1001", "P1002", "P1017", "P2024"].includes(error.code ?? error.errorCode)) {
    return res.status(503).json({ success: false, message: "The database is unavailable. Please try again." });
  }
  if (error.code === "P2003" || error.code === "P2025") {
    return res.status(409).json({ success: false, message: "This room or membership changed. Please refresh and try again." });
  }
  // Avoid printing errors that may include database credentials or Clerk tokens.
  console.error("Room request failed.");
  return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
}
