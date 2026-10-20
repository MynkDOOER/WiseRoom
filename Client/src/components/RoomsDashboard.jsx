import { useState } from "react";
import { Link } from "react-router-dom";
import { useWorkspace } from "../context/workspaceContext";
import Icon from "./Icon";
import RoomAvatar from "./ui/RoomAvatar";
export default function RoomsDashboard() {
  const { rooms, loading, error, refreshRooms, setRoomDialog, unreadByRoom } =
    useWorkspace();
  const [query, setQuery] = useState(""),
    [view, setView] = useState("list");
  const visible = rooms.filter((room) =>
    room.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <section
      className="room-directory"
      id="your-rooms"
      aria-labelledby="rooms-heading"
    >
      <div className="section-heading">
        <div className="heading-with-count">
          <h2 id="rooms-heading">Your rooms</h2>
          <span className="directory-count">{rooms.length}</span>
        </div>
        <div className="directory-controls">
          <button
            type="button"
            className="icon-button"
            onClick={refreshRooms}
            aria-label="Refresh rooms"
          >
            <Icon name="refresh" size={14} />
          </button>
          <div className="view-toggle" aria-label="Room layout">
            <button
              type="button"
              className={view === "list" ? "selected" : ""}
              aria-label="List layout"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <Icon name="menu" size={14} />
            </button>
            <button
              type="button"
              className={view === "grid" ? "selected" : ""}
              aria-label="Grid layout"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
            >
              <Icon name="grid" size={14} />
            </button>
          </div>
        </div>
      </div>
      {rooms.length > 4 && (
        <label className="search-field directory-search">
          <Icon name="search" size={14} />
          <span className="sr-only">Search your rooms</span>
          <input
            placeholder="Find a room…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      )}
      {error ? (
        <div className="notice" role="alert">
          <p>{error}</p>
          <button className="button" onClick={refreshRooms}>
            Retry
          </button>
        </div>
      ) : loading ? (
        <p className="muted" role="status">
          Loading rooms…
        </p>
      ) : !rooms.length ? (
        <div className="empty-state">
          <Icon name="chat" size={28} />
          <h3>No rooms yet.</h3>
          <p>Create a room or join one with an invitation.</p>
          <button
            className="button primary"
            onClick={() => setRoomDialog("create")}
          >
            Create your first room
          </button>
        </div>
      ) : !visible.length ? (
        <p className="muted">No matching rooms.</p>
      ) : (
        <ul
          className={`room-directory-list ${view === "grid" ? "room-grid" : ""}`}
        >
          {visible.map((room) => (
            <li key={room.id}>
              <Link className="room-directory-row" to={`/rooms/${room.id}`}>
                <RoomAvatar name={room.name} src={room.avatarUrl} />
                <span className="room-row-copy">
                  <strong>
                    {room.name}
                    {Boolean(unreadByRoom?.[room.id]) && (
                      <i className="unread-dot" />
                    )}
                  </strong>
                  <span>
                    {room.memberCount}{" "}
                    {room.memberCount === 1 ? "member" : "members"}
                    {room.pendingRequestCount > 0 &&
                      ` · ${room.pendingRequestCount} requests`}
                  </span>
                </span>
                <span className="room-row-preview">
                  {room.latestMessage
                    ? `${room.latestMessage.author.displayName?.split(" ")[0] || "Member"}: ${room.latestMessage.voiceMime ? "Voice message" : room.latestMessage.body.replace(/```[\s\S]*?```/g, "Code note").replace(/\n/g, " ")}`
                    : "Start the conversation"}
                </span>
                <time className="room-row-time">
                  {room.latestMessage
                    ? new Date(
                        room.latestMessage.createdAt,
                      ).toLocaleDateString() === new Date().toLocaleDateString()
                      ? new Date(
                          room.latestMessage.createdAt,
                        ).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : new Date(
                          room.latestMessage.createdAt,
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                    : "New"}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
