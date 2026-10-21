import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  getMessages,
  sendMessage,
  deleteMessage,
  deletedMessages,
} from "../controllers/messageController.js";

import { sendVoice, getVoice } from "../controllers/voiceController.js";

// roomId comes from the path used to mount this router in server.js.
const router = express.Router({ mergeParams: true });
router.use(protect);
router.get("/", getMessages);
router.post(
  "/voice",
  express.raw({ type: ["audio/webm", "audio/ogg", "audio/mp4"], limit: "5mb" }),
  sendVoice,
);
router.get("/:messageId/voice", getVoice);
router.post("/", sendMessage);
router.post("/deleted", deletedMessages);
router.delete("/:messageId", deleteMessage);

export default router;
