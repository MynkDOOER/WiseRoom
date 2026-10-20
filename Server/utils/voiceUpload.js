import AppError from "./AppError.js";
export const MAX_VOICE_BYTES = 5 * 1024 * 1024;
export function validateVoiceUpload(data, contentType, duration) {
  const mime = contentType?.split(";")[0].trim().toLowerCase();
  const formats = {
    "audio/webm": ["webm", buffer => buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))],
    "audio/ogg": ["ogg", buffer => buffer.toString("ascii", 0, 4) === "OggS"],
    "audio/mp4": ["mp4", buffer => buffer.toString("ascii", 4, 8) === "ftyp"],
  };
  if (!Buffer.isBuffer(data) || data.length < 32) throw new AppError(400, "Record a voice message before sending.");
  if (data.length > MAX_VOICE_BYTES) throw new AppError(413, "Voice messages can be up to 5 MB.");
  const format = formats[mime];
  if (!format || !format[1](data)) throw new AppError(415, "Use a WebM, Ogg, or MP4 audio recording.");
  // Duration is client metadata, not a security boundary. Bytes are bounded independently.
  if (typeof duration !== "string" || !/^\d{3,6}$/.test(duration) || +duration < 300 || +duration > 120000) throw new AppError(400, "Record between a moment and two minutes of audio.");
  return { mime, extension: format[0], durationMs: Number(duration) };
}
