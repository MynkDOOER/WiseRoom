import { getAuth } from "@clerk/express";
import { syncClerkUser } from "../services/userService.js";

export const syncUser = async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in.",
      });
    }

    const user = await syncClerkUser(userId);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch {
    console.error("User sync failed.");

    return res.status(503).json({
      success: false,
      message: "Couldn't load your account. Please try again.",
    });
  }
};
