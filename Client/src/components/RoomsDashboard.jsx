import { useState } from "react";
import { Link } from "react-router-dom";
import { useWorkspace } from "../context/workspaceContext";
import Icon from "./Icon";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import RoomAvatar from "./ui/RoomAvatar";
export default function RoomsDashboard() {
  const { rooms, loading, error, refreshRooms, setRoomDialog } = useWorkspace();
  const [query, setQuery] = useState("");
  const visible = rooms.filter((room) =>
    room.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <section className="room-directory" aria-labelledby="rooms-heading">
      <div className="section-heading">
        <div className="heading-with-count">
          <h2 id="rooms-heading">Your rooms</h2>
          <Badge>{rooms.length}</Badge>
        </div>
        <button
          className="icon-button"
          onClick={refreshRooms}
          aria-label="Refresh rooms"
        >
          <Icon name="refresh" />
        </button>
      </div>
      {rooms.length > 4 && (
        <label className="search-field directory-search">
          <Icon name="search" />
          <span className="sr-only">Search your rooms</span>
          <input
            type="search"
            placeholder="Find a room…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      )}
      {error ? (
        <div className="notice" role="alert">
          <h3>Rooms couldn’t load.</h3>
          <p className="muted">{error}</p>
          <Button onClick={refreshRooms}>Try again</Button>
        </div>
      ) : loading ? (
        <div className="room-list-loading" role="status">
          Loading your rooms…
        </div>
      ) : !rooms.length ? (
        <div className="empty-state">
          <Icon name="chat" size={30} />
          <h3>No rooms yet.</h3>
          <p>Create a room or join one with an invitation.</p>
          <Button variant="primary" onClick={() => setRoomDialog("create")}>
            Create your first room
          </Button>
        </div>
      ) : !visible.length ? (
        <div className="empty-state compact">
          <h3>No matching rooms</h3>
          <Button onClick={() => setQuery("")}>Clear search</Button>
        </div>
      ) : (
        <ul className="room-directory-list">
          {visible.map((room) => (
            <li key={room.id}>
              <Link className="room-directory-row" to={`/rooms/${room.id}`}>
                <RoomAvatar name={room.name} src={room.avatarUrl} />
                <span className="room-row-copy">
                  <strong>{room.name}</strong>
                  <span>
                    {room.memberCount}{" "}
                    {room.memberCount === 1 ? "member" : "members"}
                  </span>
                </span>
                {room.role === "OWNER" && <Badge tone="accent">Owner</Badge>}
                <Icon name="arrow" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
