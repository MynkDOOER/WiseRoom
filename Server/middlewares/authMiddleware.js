import { getAuth } from "@clerk/express";
import AppError from "../utils/AppError.js";

export default function protect(req, res, next) {
  res.set("Cache-Control", "no-store");
  try {
    const { userId } = getAuth(req);
    if (!userId) throw new AppError(401, "Please sign in.");
    req.userId = userId;
    next();
  } catch (error) {
    next(error);
  }
}
