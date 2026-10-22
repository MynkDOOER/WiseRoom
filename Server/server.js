import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { createRealtime } from "./realtime/server.js";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import prisma from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import inviteRoutes from "./routes/inviteRoutes.js";
import collaborationRoutes from "./routes/collaborationRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import errorHandler from "./middlewares/errorMiddleware.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const httpServer = createServer(app);
createRealtime(httpServer, origin);

app.use(
  cors({
    origin,
    credentials: true,
  }),
);

app.use(express.json());
app.use(clerkMiddleware());

app.use("/api/users", userRoutes);
app.use("/api/rooms/:roomId", collaborationRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/rooms/:roomId/messages", messageRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/invites", inviteRoutes);

// Check the database connection through Prisma.
app.get("/test-db", async (req, res) => {
  try {
    await prisma.$connect();

    return res.status(200).json({
      message: "Database connected successfully",
    });
  } catch {
    console.error("Database connection failed.");

    return res.status(500).json({
      message: "Database connection failed",
    });
  }
});

app.use(errorHandler);

httpServer.listen(PORT, process.env.HOST || "127.0.0.1", () => {
  console.log(`Server running on port ${PORT} 💮`);
});
