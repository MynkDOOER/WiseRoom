import { useState } from "react";
export default function RoomAvatar({ name = "Room", src, className = "" }) {
  const [failedSource, setFailedSource] = useState(null);
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "R";
  return (
    <span className={`room-avatar ${className}`} aria-hidden="true">
      {src && failedSource !== src ? (
        <img src={src} alt="" onError={() => setFailedSource(src)} />
      ) : (
        initials
      )}
    </span>
  );
}
