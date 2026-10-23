import AppError from "../utils/AppError.js";
import {
  authorizedLink,
  getLinkPreview,
  getLinkImage,
  limitPreviewRequests,
} from "../services/linkPreviewService.js";

function endpoint(image) {
  return async (req, res, next) => {
    try {
      limitPreviewRequests(req.userId);
      const args = [
        req.userId,
        req.params.roomId,
        req.params.messageId,
        req.query.index,
      ];
      const url = await authorizedLink(...args);
      const result = image
        ? await getLinkImage(url)
        : await getLinkPreview(url);
      // Fetching a remote site takes time: check access/deletion again before sending.
      if ((await authorizedLink(...args)) !== url)
        throw new AppError(404, "Link not found.");
      if (image) {
        if (!result) return res.status(204).end();
        return res
          .set({
            "Content-Type": "image/webp",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store",
          })
          .send(result);
      }
      return res.json({
        success: true,
        preview: {
          title: result.title,
          description: result.description,
          hasImage: Boolean(result.imageUrl),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
export const linkPreview = endpoint(false);
export const linkImage = endpoint(true);
