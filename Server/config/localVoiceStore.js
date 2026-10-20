import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const directory = fileURLToPath(new URL("../data/voice/", import.meta.url));
const validKey = key => typeof key === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\.(webm|ogg|mp4)$/.test(key);
export async function storeVoice(key, data) {
  if (!validKey(key)) throw Error("Invalid voice key");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, key), data, { flag: "wx" });
}
export async function loadVoice(key) {
  if (!validKey(key)) throw Error("Invalid voice key");
  return readFile(join(directory, key));
}
export async function deleteVoice(key) {
  if (!validKey(key)) return;
  try { await unlink(join(directory, key)); } catch (error) { if (error.code !== "ENOENT") throw error; }
}
