import { useState } from "react";

const shades = [
  ["#FFB38A", "#24120C"],
  ["#C9B8FF", "#24120C"],
  ["#9BE3C4", "#24120C"],
  ["#FBEFE2", "#24120C"],
];

export default function MemberAvatar({ item, size = 32 }) {
  const [imageFailed, setImageFailed] = useState(false);
  const name = item.name?.trim() || "Unnamed member";
  const words = name.split(/\s+/);
  const initials = (
    words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")
  ).toUpperCase();
  const hash = [...String(item.id)].reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
  const [background, color] = shades[hash % shades.length];
  return (
    <span
      className="member-avatar-art"
      aria-hidden="true"
      style={{ width: size, height: size, background, color }}
    >
      {item.image && !imageFailed ? (
        <img
          src={item.image}
          alt=""
          onError={() => setImageFailed(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}
