import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { neon } from "@neondatabase/serverless";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(clerkMiddleware());

// Neon PostgreSQL connection
const sql = neon(process.env.DATABASE_URL);

// Test database connection
app.get("/test-db", async (req, res) => {
  try {
    const result = await sql`SELECT version()`;

    res.status(200).json({
      message: "Database connected successfully",
      version: result[0].version
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      message: "Database connection failed"
    });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 💮`);
});