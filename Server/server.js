import express from "express";
import { clerkMiddleware } from "@clerk/express";
import "dotenv/config";

const app = express();

app.use(express.json());
app.use(clerkMiddleware()); // reads CLERK_SECRET_KEY from .env automatically

// routes go here...

app.listen(3000, () => console.log("Server running on port 3000"));