import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspace } from "../context/workspaceContext";
import Icon from "./Icon";
import Modal from "./Modal";
import RoomAvatar from "./ui/RoomAvatar";
import Button from "./ui/Button";

const PAGE_SIZE = 5;
function position(box) {
  const top = Math.min((box?.bottom || 64) + 10, Math.max(12, window.innerHeight - 300));
  return { '--switcher-top': `${top}px`, '--switcher-left': `${Math.max(12, Math.min(box?.left || 12, window.innerWidth - 330))}px`, '--switcher-height': `${window.innerHeight - top - 18}px` };
}
export default function RoomDial({ onClose, anchorBox }) {
  const { rooms, loading, error, refreshRooms, setRoomDialog } = useWorkspace();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(() => Math.floor(Math.max(0, rooms.findIndex(room => room.id === roomId)) / PAGE_SIZE));
  const [placement, setPlacement] = useState(() => position(anchorBox));
  const wheelTime = useRef(0);
  useEffect(() => { const update = () => setPlacement(position(anchorBox)); window.addEventListener("resize", update); return () => window.removeEventListener("resize", update); }, [anchorBox]);
  const filtered = rooms.filter(room => room.name.toLowerCase().includes(query.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  function step(direction) { setPage(Math.max(0, Math.min(pages - 1, currentPage + direction))); }
  function open(room) { navigate(`/rooms/${room.id}`); onClose(); }
  function openDialog(kind) { onClose(); setRoomDialog(kind); }
  return <Modal title="Switch room" className="room-switcher-modal" style={placement} onClose={onClose}>
    <label className="search-field switcher-search"><Icon name="search" size={16}/><span className="sr-only">Find a room in the switcher</span><input data-dialog-autofocus="" type="search" placeholder="Find a room…" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }}/></label>
    {loading ? <p className="switcher-empty" role="status">Loading rooms…</p> : error ? <div className="switcher-empty" role="alert"><p>{error}</p><Button onClick={refreshRooms}>Try again</Button></div> : !visible.length ? <p className="switcher-empty">{rooms.length ? "No matching rooms." : "Create or join your first room."}</p> : <div className="room-arc" role="group" aria-label="Room switcher" onWheel={event => { if (pages <= 1 || Math.abs(event.deltaY) < 5 || Date.now() - wheelTime.current < 300) return; wheelTime.current = Date.now(); step(event.deltaY > 0 ? 1 : -1); }} onKeyDown={event => {
      const buttons = [...event.currentTarget.querySelectorAll("button")];
      const index = buttons.indexOf(document.activeElement);
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length; buttons[next]?.focus(); }
    }}>{visible.map(room => <button className="arc-room" key={room.id} aria-current={room.id === roomId ? "page" : undefined} onClick={() => open(room)}><RoomAvatar name={room.name} src={room.avatarUrl}/><span className="arc-room-copy"><strong>{room.name}</strong><small>{room.id === roomId ? "Current room" : `${room.memberCount} ${room.memberCount === 1 ? "member" : "members"}`}</small></span>{room.id === roomId && <Icon name="check" size={15}/>}</button>)}</div>}
    {pages > 1 && <div className="switcher-controls"><button className="icon-button" aria-label="Previous rooms" disabled={currentPage === 0} onClick={() => step(-1)}><Icon name="chevron" className="rotate-back"/></button><span aria-live="polite">{currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span><button className="icon-button" aria-label="More rooms" disabled={currentPage === pages - 1} onClick={() => step(1)}><Icon name="chevron"/></button></div>}
    <div className="switcher-footer"><Button onClick={() => openDialog("create")}><Icon name="plus" size={15}/>Create</Button><Button onClick={() => openDialog("join")}><Icon name="join" size={15}/>Join</Button></div>
  </Modal>;
}
