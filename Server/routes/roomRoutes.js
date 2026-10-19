import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  createRoom, listMyRooms, getRoom, joinRoom,
  leaveRoom, listMembers, getRoomInvite,
} from "../controllers/roomController.js";

const router = express.Router();

router.use(protect);
router.post("/", createRoom);
router.get("/", listMyRooms);
router.post("/join", joinRoom);
router.get("/:roomId", getRoom);
router.get("/:roomId/members", listMembers);
router.delete("/:roomId/members/me", leaveRoom);
router.get("/:roomId/invite", getRoomInvite);

export default router;
