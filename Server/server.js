import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import prisma from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import errorHandler from "./middlewares/errorMiddleware.js";

const app = express();
const PORT = 3000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(clerkMiddleware());

app.use("/api/users", userRoutes);
app.use("/api/rooms/:roomId/messages", messageRoutes);
app.use("/api/rooms", roomRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 💮`);
});
