import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  renameRoom,
  removeMember,
  resetInvite,
  saveAvatar,
  resetAvatar,
  showAvatar,
} from "../controllers/roomManagementController.js";
import {
  listRequests,
  decideRequest,
} from "../controllers/joinRequestController.js";
import {
  createRoom,
  listMyRooms,
  getRoom,
  joinRoom,
  leaveRoom,
  listMembers,
  getRoomInvite,
} from "../controllers/roomController.js";

const router = express.Router();

router.get("/:roomId/avatar", showAvatar);
router.use(protect);
router.post("/", createRoom);
router.get("/", listMyRooms);
router.post("/join", joinRoom);
router.get("/:roomId", getRoom);
router.get("/:roomId/members", listMembers);
router.delete("/:roomId/members/me", leaveRoom);
router.get("/:roomId/invite", getRoomInvite);
router.patch("/:roomId", renameRoom);
router.delete("/:roomId/members/:userId", removeMember);
router.post("/:roomId/invite/reset", resetInvite);
router.put(
  "/:roomId/avatar",
  express.raw({
    type: ["image/jpeg", "image/png", "image/webp"],
    limit: "2mb",
  }),
  saveAvatar,
);
router.delete("/:roomId/avatar", resetAvatar);
router.get("/:roomId/join-requests", listRequests);
router.patch("/:roomId/join-requests/:requestId", decideRequest);

export default router;
