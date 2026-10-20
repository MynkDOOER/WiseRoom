import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  activity,
  unread,
  readAll,
} from "../controllers/collaborationController.js";
const router = express.Router();
router.use(protect);
router.get("/unread", unread);
router.post("/read", readAll);
router.get("/:kind", activity);
export default router;
