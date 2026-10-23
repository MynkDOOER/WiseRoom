import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  getMessages,
  sendMessage,
  deleteMessage,
  deletedMessages,
  syncMessages,
} from "../controllers/messageController.js";

import { sendVoice, getVoice } from "../controllers/voiceController.js";
import {
  linkPreview,
  linkImage,
} from "../controllers/linkPreviewController.js";

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
router.get("/:messageId/link-preview", linkPreview);
router.get("/:messageId/link-image", linkImage);
router.post("/", sendMessage);
router.post("/deleted", deletedMessages);
router.post("/sync", syncMessages);
router.delete("/:messageId", deleteMessage);

export default router;
