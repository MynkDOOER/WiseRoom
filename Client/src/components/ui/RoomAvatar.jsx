import { useState } from "react";
export default function RoomAvatar({ name = "Room", src, className = "" }) {
  const [failedSource, setFailedSource] = useState(null);
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 1)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "R";
  const palette = ["#49315F", "#5A2926", "#07535C", "#214E2C", "#543309"];
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (
    <span
      className={`room-avatar ${className}`}
      style={{ "--room-color": palette[hash % palette.length] }}
      aria-hidden="true"
    >
      {src && failedSource !== src ? (
        <img src={src} alt="" onError={() => setFailedSource(src)} />
      ) : (
        initials
      )}
    </span>
  );
}
