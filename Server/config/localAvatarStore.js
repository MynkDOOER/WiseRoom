import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const directory = fileURLToPath(new URL("../data/avatars/", import.meta.url));

const validKey = (key) =>
  typeof key === "string" && /^[0-9a-f-]{36}\.webp$/.test(key);

export async function storeAvatar(key, data) {
  if (!validKey(key)) throw Error("Invalid storage key");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, key), data, { flag: "wx" });
}

export async function loadAvatar(key) {
  if (!validKey(key)) throw Error("Invalid storage key");
  return readFile(join(directory, key));
}

export async function deleteAvatar(key) {
  if (!key || !validKey(key)) return;
  try {
    await unlink(join(directory, key));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
