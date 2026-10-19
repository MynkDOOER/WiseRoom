import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspace } from "../context/workspaceContext";
import Icon from "./Icon";
import Modal from "./Modal";

const PAGE_SIZE = 8;

export default function RoomDial({ onClose }) {
  const { rooms, loading, error, refreshRooms, setRoomDialog } = useWorkspace();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const currentIndex = Math.max(0, rooms.findIndex(room => room.id === roomId));
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(Math.floor(currentIndex / PAGE_SIZE));
  const [position, setPosition] = useState(currentIndex % PAGE_SIZE);
  const filtered = rooms.filter(room => room.name.toLowerCase().includes(query.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const selectedIndex = visible.length ? ((position % visible.length) + visible.length) % visible.length : 0;
  const selected = visible[selectedIndex];

  function open(room) { navigate(`/rooms/${room.id}`); onClose(); }
  function rotate(direction) { setPosition(value => value + direction); }
  function changePage(direction) { setPage(currentPage + direction); setPosition(0); }
  function openDialog(kind) { onClose(); setRoomDialog(kind); }

  return <Modal title="A little turn. A new room." className="room-dial-modal" onClose={onClose}>
    <p className="muted dial-description">Choose a circle to switch conversations, or turn the dial.</p>
    <label className="search-field dial-search"><Icon name="search" size={16}/><span className="sr-only">Find a room in the dial</span><input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(0); setPosition(0); }} placeholder="Find your room…"/></label>
    {loading ? <p className="dial-empty" role="status">Loading your rooms…</p>
      : error ? <div className="dial-empty" role="alert"><p>{error}</p><button className="button secondary" onClick={refreshRooms}>Try again</button></div>
        : !visible.length ? <div className="dial-empty"><Icon name="chat" size={28}/><h3>{rooms.length ? "No matching rooms" : "Your first room is a turn away."}</h3><p className="muted">{rooms.length ? "Try another name." : "Create a room or join with an invitation below."}</p></div>
          : <>
            <div className="room-dial" role="group" tabIndex={0} aria-label="Rotary room picker" aria-describedby="dial-help"
              onKeyDown={event => {
                if (event.target !== event.currentTarget) return;
                if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) { event.preventDefault(); rotate(["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1); }
                if (event.key === "Enter" && selected) { event.preventDefault(); open(selected); }
              }}>
              <span className="sr-only" role="status">Selected room: {selected.name}</span><div className="dial-track" aria-hidden="true"/>
              <div className="dial-rotor" key={`${currentPage}:${query}`} style={{ '--dial-turn': `${position * (360 / visible.length)}deg` }}>
              {visible.map((room, index) => {
                const angle = (index * (360 / visible.length) - 90) * Math.PI / 180;
                return <button key={room.id} className={`dial-room ${index === selectedIndex ? "dial-selected" : ""} ${room.id === roomId ? "dial-current" : ""}`}
                  style={{ left: `${50 + Math.cos(angle) * 37}%`, top: `${50 + Math.sin(angle) * 37}%` }}
                  aria-label={`Open ${room.name}${room.id === roomId ? ", current room" : ""}`} aria-current={room.id === roomId ? "page" : undefined} title={room.name} onClick={() => open(room)}>
                  <span className="dial-room-number">{currentPage * PAGE_SIZE + index + 1}</span><span>{room.name.slice(0, 1).toUpperCase()}</span>
                </button>;
              })}
              </div>
              <button className="dial-center" onClick={() => open(selected)} aria-label={`Open selected room: ${selected.name}`}>
                <span className="dial-center-label">{selected.id === roomId ? "CURRENT ROOM" : "SWITCH TO"}</span><strong>{selected.name}</strong><span>{selected.memberCount} {selected.memberCount === 1 ? "member" : "members"}<Icon name="arrow" size={13}/></span>
              </button>
            </div>
            <div className="dial-turn-controls"><button className="icon-button" onClick={() => rotate(-1)} disabled={visible.length < 2} aria-label="Rotate to previous room"><Icon name="chevron" className="rotate-back" size={17}/></button><span id="dial-help" aria-live="polite">{visible.length < 2 ? "Your room, one click away" : "Turn to explore · click to enter"}</span><button className="icon-button" onClick={() => rotate(1)} disabled={visible.length < 2} aria-label="Rotate to next room"><Icon name="chevron" size={17}/></button></div>
            {pages > 1 && <div className="dial-pages"><button className="text-button" disabled={currentPage === 0} onClick={() => changePage(-1)}>Previous rooms</button><span>{currentPage + 1} / {pages}</span><button className="text-button" disabled={currentPage === pages - 1} onClick={() => changePage(1)}>More rooms</button></div>}
          </>}
    <div className="dial-footer"><button className="text-button" onClick={() => openDialog("create")}><Icon name="plus" size={15}/>Create a room</button><button className="text-button" onClick={() => openDialog("join")}><Icon name="join" size={15}/>Join with an invite</button></div>
  </Modal>;
}
