import Icon from "./Icon";
import { getMessageLinks } from "../utils/messageLinks";
export default function MessageLinks({ text }) {
  const links = getMessageLinks(text);
  if (!links.length) return null;
  return (
    <div className="message-links">
      {links.map((url) => (
        <a
          className="message-link-card"
          key={url.href}
          href={url.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div>
            <span className="message-link-domain">
              <Icon name="link" size={11} />
              {url.hostname}
            </span>
            <strong>{url.title}</strong>
            <span className="message-link-url">{url.href}</span>
          </div>
          <span className="message-link-art" aria-hidden="true">
            <Icon name="arrow" size={19} />
          </span>
        </a>
      ))}
    </div>
  );
}
