import express from "express";
import protect from "../middlewares/authMiddleware.js";
import inviteRateLimit from "../middlewares/inviteRateLimit.js";
import {
  previewInvite,
  requestAccess,
  cancelAccess,
  myRequests,
  cancelMyRequest,
} from "../controllers/joinRequestController.js";
const router = express.Router();
router.use(protect);
router.get("/requests/me", myRequests);
router.delete("/requests/:requestId/me", inviteRateLimit, cancelMyRequest);
router.use(inviteRateLimit);
router.get("/:code", previewInvite);
router.post("/:code/requests", requestAccess);
router.delete("/:code/requests/me", cancelAccess);
export default router;
