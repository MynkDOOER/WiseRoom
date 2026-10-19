import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { getMessages, sendMessage } from "../controllers/messageController.js";

// roomId comes from the path used to mount this router in server.js.
const router = express.Router({ mergeParams: true });
router.use(protect);
router.get("/", getMessages);
router.post("/", sendMessage);

export default router;
