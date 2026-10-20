import { useState } from "react";
import { UserButton } from "@clerk/clerk-react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { useWorkspace } from "../context/workspaceContext";
import Icon from "./Icon";
import Modal from "./Modal";
import RoomDialog from "./RoomDialog";
import RoomDial from "./RoomDial";
import RoomAvatar from "./ui/RoomAvatar";
import useSidebarPreference from "../hooks/useSidebarPreference";

function Sidebar({
  onNavigate = () => {},
  inDrawer = false,
  collapsed = false,
  onCollapse,
}) {
  const { rooms, account, loading, error, refreshRooms, setRoomDialog } =
    useWorkspace();
  const [query, setQuery] = useState("");
  const visibleRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  function open(kind) {
    onNavigate();
    setRoomDialog(kind);
  }
  return (
    <>
      <div className="sidebar-brand-row">
        <NavLink
          to="/"
          className="brand"
          onClick={onNavigate}
          aria-label="WiseRoom home"
        >
          <span className="brand-monogram">W.</span>
          <span className="brand-wordmark">
            WiseRoom<span className="brand-dot">.</span>
          </span>
        </NavLink>
        {onCollapse && (
          <button
            className="icon-button sidebar-collapse"
            onClick={onCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon
              name="chevron"
              className={collapsed ? "" : "rotate-back"}
              size={15}
            />
          </button>
        )}
      </div>
      <nav aria-label="Workspace navigation" className="workspace-nav">
        <NavLink
          end
          to="/"
          aria-label="Home"
          title="Home"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          onClick={onNavigate}
        >
          <Icon name="grid" />
          <span>Home</span>
          <span className="nav-count">{rooms.length}</span>
        </NavLink>
        <div className="sidebar-section-heading">
          <span>Your rooms</span>
          <button
            className="icon-button"
            aria-label="Create a room"
            onClick={() => open("create")}
          >
            <Icon name="plus" size={15} />
          </button>
        </div>
        <label className="sidebar-search">
          <Icon name="search" size={14} />
          <span className="sr-only">Search sidebar rooms</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a room…"
          />
        </label>
        <div className="sidebar-rooms">
          {loading ? (
            <p className="sidebar-hint" role="status">
              Loading rooms…
            </p>
          ) : error ? (
            <div className="sidebar-hint" role="alert">
              <p>Rooms couldn’t load.</p>
              <button className="text-button" onClick={refreshRooms}>
                Try again
              </button>
            </div>
          ) : visibleRooms.length ? (
            visibleRooms.map((room) => (
              <NavLink
                key={room.id}
                to={`/rooms/${room.id}`}
                title={room.name}
                aria-label={room.name}
                className={({ isActive }) =>
                  `nav-link room-nav-link ${isActive ? "active" : ""}`
                }
                onClick={onNavigate}
              >
                <RoomAvatar name={room.name} src={room.avatarUrl} />
                <div className="sidebar-room-copy">
                  <strong>{room.name}</strong>
                  <span>
                    {room.memberCount}{" "}
                    {room.memberCount === 1 ? "member" : "members"}
                    {room.pendingRequestCount > 0 &&
                      ` · ${room.pendingRequestCount} pending`}
                  </span>
                </div>
                {room.role === "OWNER" && (
                  <Icon className="nav-owner" name="crown" size={12} />
                )}
              </NavLink>
            ))
          ) : (
            <p className="sidebar-hint">
              {rooms.length ? (
                "No matching rooms."
              ) : (
                <>
                  A new conversation starts
                  <br />
                  with a little room.
                </>
              )}
            </p>
          )}
        </div>
      </nav>
      <div className="sidebar-actions">
        <button
          className="button primary full-width"
          onClick={() => open("create")}
          aria-label="Create a room"
          title="Create a room"
        >
          <Icon name="plus" size={17} />
          <span>Create a room</span>
        </button>
        <button
          className="button secondary full-width"
          onClick={() => open("join")}
          aria-label="Join with an invite"
          title="Join with an invite"
        >
          <Icon name="join" size={17} />
          <span>Join with an invite</span>
        </button>
      </div>
      <div className="sidebar-bottom">
        <div className="account-control">
          {inDrawer ? (
            <span className="avatar" aria-hidden="true">
              {(account?.displayName || "U").slice(0, 1).toUpperCase()}
            </span>
          ) : (
            <UserButton />
          )}
          <div>
            <strong>{account?.displayName || "Your account"}</strong>
            <span>Your workspace</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function WorkspaceLayout() {
  const { roomId } = useParams();
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
            {!roomId && <span className="breadcrumb-current">Home</span>}
          </div>
          {roomId && <div className="room-header-slot" ref={setHeaderSlot} />}
          <div className="mobile-account">
            <UserButton />
          </div>
        </header>
        <Outlet context={{ headerSlot }} />
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
