import { useState } from "react";

const shades = [
  ["#422054", "#F7F5FF"],
  ["#302444", "#F7F5FF"],
  ["#213449", "#F7F5FF"],
  ["#36233F", "#F7F5FF"],
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
