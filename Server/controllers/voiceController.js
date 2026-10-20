import { sendVoiceForMember, getVoiceForMember } from "../services/voiceService.js";
export async function sendVoice(req, res, next) {
  try {
    const message = await sendVoiceForMember(req.userId, req.params.roomId, req.body, req.get("Content-Type"), req.query.durationMs);
    return res.status(201).json({ success: true, message });
  } catch (error) { next(error); }
}
export async function getVoice(req, res, next) {
  try {
    const { data, mime } = await getVoiceForMember(req.userId, req.params.roomId, req.params.messageId);
    res.set({ "Content-Type": mime, "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline", "Cache-Control": "no-store" });
    return res.send(data);
  } catch (error) { next(error); }
}
