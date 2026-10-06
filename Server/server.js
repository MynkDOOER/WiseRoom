import express from "express";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors"
import "dotenv/config";
const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(clerkMiddleware());

app.listen(3000, () => console.log("Server running on port 3000 💮"));