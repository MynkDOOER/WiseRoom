import { randomInt } from "node:crypto";
import AppError from "./AppError.js";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export function generateInviteCode() { return Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(""); }
export function normalizeInviteCode(value) {
  if (typeof value !== "string" || !/^[A-Z0-9]{6}$/.test(value.trim().toUpperCase())) throw new AppError(400, "Enter a valid six-character invitation code.");
  return value.trim().toUpperCase();
}
