import prisma from "../config/db.js";
import AppError from "./AppError.js";
export async function transaction(operation) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { return await prisma.$transaction(operation, { isolationLevel: "Serializable", maxWait: 5000, timeout: 10000 }); }
    catch (error) { if (!["P2034", "P2002"].includes(error.code)) throw error; }
  }
  throw new AppError(409, "Room activity changed. Please try again.");
}
