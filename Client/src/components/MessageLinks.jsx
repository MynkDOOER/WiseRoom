import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import Icon from "./Icon";
import { getMessageLinks } from "../utils/messageLinks";
import { loadLinkPreview, loadLinkImage } from "../api/linkPreviews";

function LinkCard({ url, index, roomId, messageId }) {
  const { getToken, userId } = useAuth();
  const cardRef = useRef(null);
  const [result, setResult] = useState(null);
  const [failedImage, setFailedImage] = useState(null);

  useEffect(() => {
    if (!roomId || !messageId || !userId) return;
    let disposed = false,
      started = false,
      objectUrl;
    const controller = new AbortController();
    async function load() {
      if (started || disposed) return;
      started = true;
      try {
        const token = await getToken();
        if (disposed) return;
        const { preview } = await loadLinkPreview(
          token,
          roomId,
          messageId,
          index,
          controller.signal,
        );
        if (disposed) return;
        const next = { ...preview, href: url.href, userId, image: null };
        setResult(next);
        if (preview.hasImage) {
          const blob = await loadLinkImage(
            token,
            roomId,
            messageId,
            index,
            controller.signal,
          );
          if (disposed || !blob) return;
          objectUrl = URL.createObjectURL(blob);
          setResult({ ...next, image: objectUrl });
        }
      } catch {
        /* A remote preview is optional; the original link stays usable. */
      }
    }
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) {
                observer.disconnect();
                void load();
              }
            },
            { rootMargin: "200px" },
          );
    if (observer) observer.observe(cardRef.current);
    else void load();
    return () => {
      disposed = true;
      controller.abort();
      observer?.disconnect();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [getToken, userId, roomId, messageId, index, url.href]);

  const preview =
    result?.href === url.href && result?.userId === userId ? result : null;
  const image =
    preview?.image && preview.image !== failedImage ? preview.image : null;
  return (
    <a
      ref={cardRef}
      className={`message-link-card${image ? " has-thumbnail" : ""}`}
      href={url.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div>
        <span className="message-link-domain">
          <Icon name="link" size={11} />
          {url.hostname}
        </span>
        <strong>{preview?.title || url.title}</strong>
        {preview?.description && (
          <span className="message-link-description">
            {preview.description}
          </span>
        )}
        <span className="message-link-url">{url.href}</span>
      </div>
      <span className="message-link-art" aria-hidden="true">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailedImage(image)}
          />
        ) : (
          <Icon name="arrow" size={19} />
        )}
      </span>
    </a>
  );
}

export default function MessageLinks({ text, roomId, messageId }) {
  const links = getMessageLinks(text);
  if (!links.length) return null;
  return (
    <div className="message-links">
      {links.map((url, index) => (
        <LinkCard
          key={`${messageId || "demo"}:${url.href}`}
          url={url}
          index={index}
          roomId={roomId}
          messageId={messageId}
        />
      ))}
    </div>
  );
}
