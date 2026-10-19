import { useState } from "react";
import { UserButton } from "@clerk/clerk-react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { useWorkspace } from "../context/workspaceContext";
import Icon from "./Icon";
import Modal from "./Modal";
import RoomDialog from "./RoomDialog";
import RoomDial from "./RoomDial";

function Sidebar({ onNavigate = () => {}, inDrawer = false, collapsed = false, onCollapse }) {
  const { rooms, account, loading, error, refreshRooms, setRoomDialog } = useWorkspace();
  const [query, setQuery] = useState("");
  const visibleRooms = rooms.filter(room => room.name.toLowerCase().includes(query.trim().toLowerCase()));
  function open(kind) { onNavigate(); setRoomDialog(kind); }
  return <>
    <div className="sidebar-brand-row"><NavLink to="/" className="brand" onClick={onNavigate} aria-label="WiseRoom home"><img src="/favicon.svg" alt="" width="36" height="36"/><span>WiseRoom<span className="brand-dot">.</span></span></NavLink>{onCollapse && <button className="icon-button sidebar-collapse" onClick={onCollapse} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}><Icon name="chevron" className={collapsed ? "" : "rotate-back"} size={15}/></button>}</div>
    <div className="workspace-label"><span className="workspace-monogram">W</span><div>Your workspace<span>Private by invitation</span></div><Icon name="lock" size={12}/></div>
    <nav aria-label="Workspace navigation" className="workspace-nav">
      <NavLink end to="/" aria-label="All rooms" title="All rooms" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={onNavigate}><Icon name="grid"/><span>All rooms</span><span className="nav-count">{rooms.length}</span></NavLink>
      <div className="sidebar-section-heading"><span>Your rooms</span><button className="icon-button" aria-label="Create a room" onClick={() => open("create")}><Icon name="plus" size={15}/></button></div>
      <label className="sidebar-search"><Icon name="search" size={14}/><span className="sr-only">Search sidebar rooms</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a room…"/></label>
      <div className="sidebar-rooms">
        {loading ? <p className="sidebar-hint" role="status">Loading rooms…</p> : error ? <div className="sidebar-hint" role="alert"><p>Rooms couldn’t load.</p><button className="text-button" onClick={refreshRooms}>Try again</button></div> : visibleRooms.length ? visibleRooms.map(room =>
          <NavLink key={room.id} to={`/rooms/${room.id}`} title={room.name} aria-label={room.name} className={({ isActive }) => `nav-link room-nav-link ${isActive ? "active" : ""}`} onClick={onNavigate}><span className="sidebar-room-avatar" aria-hidden="true">{room.name.slice(0, 1).toUpperCase()}</span><div className="sidebar-room-copy"><strong>{room.name}</strong><span>{room.memberCount} {room.memberCount === 1 ? "member" : "members"} · Private</span></div>{room.role === "OWNER" && <Icon className="nav-owner" name="crown" size={12}/>}</NavLink>
        ) : <p className="sidebar-hint">{rooms.length ? "No matching rooms." : <>A new conversation starts<br/>with a little room.</>}</p>}
      </div>
    </nav>
    <div className="sidebar-actions"><button className="button primary full-width" onClick={() => open("create")} aria-label="Create a room" title="Create a room"><Icon name="plus" size={17}/><span>Create a room</span></button><button className="button secondary full-width" onClick={() => open("join")} aria-label="Join with an invite" title="Join with an invite"><Icon name="join" size={17}/><span>Join with an invite</span></button></div>
    <div className="sidebar-bottom"><div className="privacy-note"><Icon name="lock" size={13}/><span>Small rooms. Big possibilities.</span></div><div className="account-control">{inDrawer ? <span className="avatar" aria-hidden="true">{(account?.displayName || "U").slice(0, 1).toUpperCase()}</span> : <UserButton/>}<div><strong>{account?.displayName || "Your account"}</strong><span>Personal workspace</span></div></div></div>
  </>;
}

export default function WorkspaceLayout() {
  const { roomId } = useParams();
  const { roomDialog, setRoomDialog } = useWorkspace();
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dialOpen, setDialOpen] = useState(false);
  const [headerSlot, setHeaderSlot] = useState(null);
  return <div className={`workspace-shell ${collapsed ? "sidebar-collapsed" : ""} ${roomId ? "in-room" : ""}`}>
    <a className="skip-link" href="#workspace-main">Skip to content</a>
    <aside className="sidebar"><Sidebar collapsed={collapsed} onCollapse={() => setCollapsed(value => !value)}/></aside>
    {drawer && <Modal title="Your workspace" className="navigation-drawer" onClose={() => setDrawer(false)}><Sidebar inDrawer onNavigate={() => setDrawer(false)}/></Modal>}
    <div className="workspace-main" id="workspace-main" tabIndex={-1}>
      <header className="workspace-topbar">
        <div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setDrawer(true)}><Icon name="menu"/></button><button className="workspace-switcher" aria-label="Workspace: switch rooms" aria-haspopup="dialog" onClick={() => setDialOpen(true)} title="Open the room dial"><Icon name="dial" size={18}/><span>Workspace</span></button><Icon name="chevron" className="breadcrumb-divider" size={12}/>{!roomId && <span className="breadcrumb-current">All rooms</span>}</div>
        {roomId && <div className="room-header-slot" ref={setHeaderSlot}/>}
        {!roomId && <span className="private-label"><Icon name="lock" size={12}/>Invite-only workspace</span>}
        <div className="mobile-account"><UserButton/></div>
      </header>
      <Outlet context={{headerSlot}}/>
    </div>
    {dialOpen && <RoomDial onClose={() => setDialOpen(false)}/>}
    {roomDialog && <RoomDialog key={roomDialog} kind={roomDialog} onClose={() => setRoomDialog(null)}/>}
  </div>;
}
