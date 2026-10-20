import { useEffect, useRef, useState } from "react";
import { UserButton } from "@clerk/clerk-react";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { useWorkspace } from "../context/workspaceContext";
import Icon from "./Icon";
import Modal from "./Modal";
import RoomDialog from "./RoomDialog";
import RoomDial from "./RoomDial";
import RoomAvatar from "./ui/RoomAvatar";
import useSidebarPreference from "../hooks/useSidebarPreference";

function Sidebar({onNavigate=()=>{},inDrawer=false,collapsed=false,onCollapse}) {
  const {rooms,account,loading,error,refreshRooms,setRoomDialog,unreadTotal,unreadByRoom}=useWorkspace();
  const [query,setQuery]=useState(""); const input=useRef(null);
  const visible=rooms.filter(room=>room.name.toLowerCase().includes(query.trim().toLowerCase()));
  const pinned=visible.filter(room=>room.pinned), others=visible.filter(room=>!room.pinned);
  function open(kind){onNavigate();setRoomDialog(kind);}
  useEffect(()=>{
    function shortcut(event){if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"&&!collapsed&&(inDrawer||!document.querySelector(".navigation-drawer[open]"))){event.preventDefault();input.current?.focus();}}
    document.addEventListener("keydown",shortcut);return()=>document.removeEventListener("keydown",shortcut);
  },[collapsed,inDrawer]);
  function roomLink(room){return <NavLink key={room.id} to={`/rooms/${room.id}`} title={room.name} aria-label={room.name} className={({isActive})=>`nav-link room-nav-link ${isActive?"active":""}`} onClick={onNavigate}><RoomAvatar name={room.name} src={room.avatarUrl}/><div className="sidebar-room-copy"><strong>{room.name}</strong><span>{room.latestMessage?`${room.latestMessage.author.displayName?.split(" ")[0]||"Member"}: ${room.latestMessage.voiceMime?"Voice message":room.latestMessage.body.replace(/\n/g," ").replace(/```[\s\S]*?```/g,"Code note")}`:`${room.memberCount} ${room.memberCount===1?"member":"members"}`}</span></div>{Boolean(unreadByRoom?.[room.id])&&<span className="sidebar-unread">{unreadByRoom[room.id]}</span>}</NavLink>;}
  return <><div className="sidebar-brand-row"><NavLink to="/" className="brand" onClick={onNavigate} aria-label="WiseRoom home"><span className="brand-monogram">W.</span><span className="brand-wordmark">WiseRoom<span className="brand-dot">.</span></span></NavLink>{onCollapse&&<button className="icon-button sidebar-collapse" onClick={onCollapse} aria-label={collapsed?"Expand sidebar":"Collapse sidebar"} title={collapsed?"Expand sidebar":"Collapse sidebar"}><Icon name="panel" size={15}/></button>}</div>
    <nav aria-label="Workspace navigation" className="workspace-nav"><label className="sidebar-search"><Icon name="search" size={14}/><span className="sr-only">Search sidebar rooms</span><input ref={input} type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search rooms"/><kbd>⌘K</kbd></label>
    <div className="primary-navigation">{[["/","home","Home"],["/inbox","inbox","Inbox"],["/threads","chat","Threads"],["/saved","bookmark","Saved"]].map(([path,icon,label])=><NavLink key={path} end={path==="/"} to={path} className={({isActive})=>`nav-link ${isActive?"active":""}`} aria-label={label} title={label} onClick={onNavigate}><Icon name={icon} size={16}/><span>{label}</span>{path==="/inbox"&&unreadTotal>0&&<span className="nav-count">{unreadTotal}</span>}</NavLink>)}</div>
    <div className="sidebar-rooms">{loading?<p className="sidebar-hint" role="status">Loading rooms…</p>:error?<div className="sidebar-hint" role="alert"><p>Rooms couldn’t load.</p><button className="text-button" onClick={refreshRooms}>Retry</button></div>:<>{pinned.length>0&&<><div className="sidebar-section-heading"><span>Pinned</span></div>{pinned.map(roomLink)}</>}<div className="sidebar-section-heading"><span>Rooms <small>{others.length}</small></span><div className="sidebar-room-actions"><button className="icon-button" aria-label="Join with an invite" title="Join with an invite" onClick={()=>open("join")}><Icon name="join" size={14}/></button><button className="icon-button" aria-label="Create a room" title="Create a room" onClick={()=>open("create")}><Icon name="plus" size={15}/></button></div></div>{others.map(roomLink)}{!visible.length&&<p className="sidebar-hint">{rooms.length?"No matching rooms.":"Create or join your first room."}</p>}</>}</div></nav>
    <div className="sidebar-bottom"><div className="account-control">{inDrawer?<span className="avatar" aria-hidden="true">{(account?.displayName||"U").slice(0,1).toUpperCase()}</span>:<UserButton/>}<div><strong>{account?.displayName||"Your account"}</strong><span>Your workspace</span></div></div></div></>;
}

export default function WorkspaceLayout() {
  const { roomId } = useParams();
  const location = useLocation();
  const pageTitle = location.pathname === "/inbox" ? "Inbox" : location.pathname === "/threads" ? "Threads" : location.pathname === "/saved" ? "Saved" : "Home";
  const { roomDialog, setRoomDialog } = useWorkspace();
  const [drawer, setDrawer] = useState(false);
  const sidebar = useSidebarPreference();
  const { collapsed } = sidebar;
  const [dialPosition, setDialPosition] = useState(null);
  const [dialOpen, setDialOpen] = useState(false);
  const [headerSlot, setHeaderSlot] = useState(null);
  return (
    <div
      className={`workspace-shell ${collapsed ? "sidebar-collapsed" : ""} ${sidebar.resizing ? "sidebar-resizing" : ""} ${roomId ? "in-room" : ""}`}
      style={{ "--sidebar-width": `${sidebar.width}px` }}
    >
      <a className="skip-link" href="#workspace-main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Sidebar collapsed={collapsed} onCollapse={sidebar.toggleCollapsed} />
      </aside>
      {!collapsed && (
        <div
          role="separator"
          tabIndex={0}
          aria-label="Resize sidebar"
          aria-orientation="vertical"
          aria-valuemin={200}
          aria-valuemax={320}
          aria-valuenow={Math.round(sidebar.width)}
          className="sidebar-resizer"
          onPointerDown={sidebar.startResize}
          onPointerMove={sidebar.moveResize}
          onPointerUp={sidebar.finishResize}
          onPointerCancel={sidebar.finishResize}
          onLostPointerCapture={sidebar.finishResize}
          onKeyDown={sidebar.keyboardResize}
          onDoubleClick={sidebar.resetWidth}
        />
      )}
      {drawer && (
        <Modal
          title="Your workspace"
          className="navigation-drawer"
          onClose={() => setDrawer(false)}
        >
          <Sidebar inDrawer onNavigate={() => setDrawer(false)} />
        </Modal>
      )}
      <div className="workspace-main" id="workspace-main" tabIndex={-1}>
        <header className="workspace-topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setDrawer(true)}
            >
              <Icon name="menu" />
            </button>
            <button
              className="workspace-switcher"
              aria-label="Workspace: switch rooms"
              aria-haspopup="dialog"
              aria-expanded={dialOpen}
              onClick={(event) => {
                setDialPosition(event.currentTarget.getBoundingClientRect());
                setDialOpen(true);
              }}
              title="Switch rooms"
            >
              <Icon name="dial" size={18} />
              <span>Workspace</span>
            </button>
            <Icon name="chevron" className="breadcrumb-divider" size={12} />
            {!roomId && <span className="breadcrumb-current">{pageTitle}</span>}
          </div>
          {roomId && <div className="room-header-slot" ref={setHeaderSlot} />}
          {!roomId && <NavLink className="icon-button header-inbox" to="/inbox" aria-label="Open Inbox" title="Open Inbox"><Icon name="bell" size={16}/></NavLink>}
          <div className="mobile-account">
            <UserButton />
          </div>
        </header>
        <Outlet context={{ headerSlot, openSwitcher: event => { setDialPosition(event.currentTarget.getBoundingClientRect()); setDialOpen(true); } }} />
      </div>
      {dialOpen && (
        <RoomDial anchorBox={dialPosition} onClose={() => setDialOpen(false)} />
      )}
      {roomDialog && (
        <RoomDialog
          key={roomDialog}
          kind={roomDialog}
          onClose={() => setRoomDialog(null)}
        />
      )}
    </div>
  );
}
