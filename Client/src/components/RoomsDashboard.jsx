import { useState } from "react";
import { Link } from "react-router-dom";
import { useWorkspace } from "../context/workspaceContext";
import Icon from "./Icon";
export default function RoomsDashboard() {
  const { rooms, loading, error, refreshRooms, setRoomDialog } = useWorkspace();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const visible = rooms.filter(room => room.name.toLowerCase().includes(query.toLowerCase().trim()) &&
    (filter === "all" || (filter === "owned" ? room.role === "OWNER" : room.role !== "OWNER")));
  return <section className="room-directory" aria-labelledby="rooms-heading">
    <div className="section-heading"><div className="heading-with-count"><h2 id="rooms-heading">Your rooms</h2><span className="count-pill">{rooms.length}</span></div><button className="icon-button" onClick={refreshRooms} aria-label="Refresh rooms" title="Refresh rooms"><Icon name="refresh" size={16}/></button></div>
    <div className="directory-toolbar"><div className="filter-buttons" role="group" aria-label="Filter rooms">{[["all", "All rooms"], ["owned", "Created by you"], ["joined", "Joined"]].map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div><label className="search-field"><Icon name="search" size={16}/><span className="sr-only">Search your rooms</span><input type="search" placeholder="Find a room…" value={query} onChange={event => setQuery(event.target.value)}/></label></div>
    {error ? <div className="notice" role="alert"><h3>We couldn’t load your workspace.</h3><p className="muted">{error}</p><button className="button secondary" onClick={refreshRooms}>Try again</button></div>
      : loading ? <div className="room-card-grid" role="status" aria-label="Loading rooms">{[0, 1, 2].map(value => <div className="room-card skeleton-card" key={value}><span/><span/><span/></div>)}</div>
        : rooms.length === 0 ? <div className="empty-state"><span className="empty-icon"><Icon name="chat" size={26}/></span><h3>Your next conversation starts here.</h3><p>Create a private room for your people, or join one with an invitation.</p><button className="button primary" onClick={() => setRoomDialog("create")}><Icon name="plus" size={16}/>Create your first room</button></div>
          : visible.length === 0 ? <div className="empty-state compact"><Icon name="search" size={24}/><h3>No rooms found</h3><p>Try a different name or filter.</p><button className="text-button" onClick={() => { setQuery(""); setFilter("all"); }}>Show all rooms</button></div>
            : <ul className="room-card-grid">{visible.map(room => <li key={room.id}><Link className="room-card" to={`/rooms/${room.id}`}>
              <div className="room-card-top"><span className={`room-symbol ${room.role === "OWNER" ? "owned-symbol" : ""}`}><Icon name="hash" size={23}/></span><span className={`badge ${room.role === "OWNER" ? "owner" : ""}`}>{room.role === "OWNER" && <Icon name="crown" size={12}/>}{room.role === "OWNER" ? "Owner" : "Member"}</span></div>
              <h3>{room.name}</h3><p className="room-card-description"><Icon name="lock" size={12}/>Private room · A shared space to think</p>
              <div className="room-card-bottom"><span><Icon name="people" size={14}/>{room.memberCount} {room.memberCount === 1 ? "member" : "members"}</span><time dateTime={room.createdAt}>Created {new Date(room.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time><span className="room-card-arrow"><Icon name="arrow" size={17}/></span></div>
            </Link></li>)}</ul>}
  </section>;
}
