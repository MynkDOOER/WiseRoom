import { getMessagesForMember, sendMessageForMember } from "../services/messageService.js";

export const sendMessage = async (req, res, next) => {
  try {
    const message = await sendMessageForMember(req.userId, req.params.roomId, req.body?.body);
    return res.status(201).json({ success: true, message });
  } catch (error) { next(error); }
};

export const getMessages = async (req, res, next) => {
  try {
    const page = await getMessagesForMember(req.userId, req.params.roomId, {
      limit: req.query.limit, before: req.query.before,
    });
    return res.json({ success: true, ...page });
  } catch (error) { next(error); }
};
