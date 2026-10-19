import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@clerk/clerk-react";
import { Link, useNavigate, useParams, useOutletContext } from "react-router-dom";
import { getInvite, getMembers, getRoom, leaveRoom } from "../api/rooms";
import { useWorkspace } from "../context/workspaceContext";
import ChatPanel from "../components/ChatPanel";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
export default function RoomPage() {
  const { roomId } = useParams();
  const { userId } = useAuth();
  return <RoomDetails key={`${roomId}:${userId}`} roomId={roomId}/>;
}
function RoomDetails({ roomId }) {
  const { headerSlot } = useOutletContext();
  const { getToken, userId } = useAuth();
  const { refreshRooms } = useWorkspace();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const membersButton = useRef(null);
  const detailsRef = useRef(null);
  useEffect(() => {
    if (!panelOpen) return;
    const panel = detailsRef.current;
    if (!panel) return;
    const isOverlay = () => window.matchMedia("(max-width: 1200px)").matches;
    const controls = () => [...panel.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href]')];
    if (isOverlay()) controls()[0]?.focus();
    function handleKey(event) {
      // A native room/create dialog owns focus while it is open.
      if (document.querySelector('dialog[open]')) return;
      if (event.key === "Escape") {
        event.preventDefault(); setPanelOpen(false); membersButton.current?.focus();
      }
      if (event.key === "Tab" && isOverlay()) {
        const items = controls();
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [panelOpen]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        const [room, members] = await Promise.all([getRoom(token, roomId, controller.signal), getMembers(token, roomId, controller.signal)]);
        if (!controller.signal.aborted) setResult({ room, members });
      } catch (error) { if (!controller.signal.aborted) setResult({ error: error.message }); }
    }
    load();
    return () => controller.abort();
  }, [getToken, roomId, attempt]);
  async function refreshMembers() {
    setBusy("members"); setActionError("");
    try {
      const token = await getToken();
      const members = await getMembers(token, roomId);
      setResult(current => ({ ...current, members }));
      refreshRooms();
    } catch (error) { setActionError(error.message); }
    finally { setBusy(""); }
  }
  async function showInvite() {
    setPanelOpen(true); setBusy("invite"); setActionError("");
    try { setInviteToken(await getInvite(await getToken(), roomId)); }
    catch (error) { setActionError(error.message); }
    finally { setBusy(""); }
  }
  async function copyInvite() {
    try { await navigator.clipboard.writeText(inviteToken); setCopied(true); setActionError(""); }
    catch { setActionError("Couldn’t copy automatically. Select the token and copy it manually."); }
  }
  async function confirmLeaving() {
    if (busy) return;
    setBusy("leave"); setActionError("");
    try { await leaveRoom(await getToken(), roomId); refreshRooms(); navigate("/", { replace: true }); }
    catch (error) { setActionError(error.message); }
    finally { setBusy(""); }
  }
  const room = result?.room;
  return <main className="room-page">
    {result?.error ? <div className="notice room-load-state" role="alert"><h1>Couldn’t open this room</h1><p className="muted">{result.error}</p><div className="button-row"><button className="button secondary" onClick={() => { setResult(null); setAttempt(value => value + 1); }}>Try again</button><Link className="button secondary" to="/">Your rooms</Link></div></div>
      : !room ? <div className="room-load-state muted" role="status">Opening your room…</div> : <>
        {headerSlot && createPortal(<div className="compact-room-heading"><div className="compact-room-title"><h1>{room.name}</h1><span><Icon name="lock" size={10}/>{result.members.length} {result.members.length === 1 ? "member" : "members"}</span></div><div className="room-heading-actions"><button ref={membersButton} aria-label="Members" title="Room members" className={`button secondary members-toggle ${panelOpen ? "selected" : ""}`} aria-expanded={panelOpen} aria-controls="room-details-panel" onClick={() => setPanelOpen(value => !value)}><Icon name="people" size={16}/><span>Members</span></button>{room.role === "OWNER" && <button aria-label="Invite" title="Invite to this room" className="button primary invite-button" onClick={showInvite} disabled={Boolean(busy)}><Icon name="plus" size={16}/><span>Invite</span></button>}</div></div>, headerSlot)}
        <div className={`room-workspace ${panelOpen ? "with-details" : ""}`}>
          <ChatPanel roomId={roomId} roomName={room.name}/>
          {panelOpen && <><button className="details-backdrop" tabIndex={-1} aria-label="Close room details" onClick={() => { setPanelOpen(false); membersButton.current?.focus(); }}/><aside ref={detailsRef} id="room-details-panel" className="room-details-panel" aria-label="Room details">
            <div className="details-title"><h2>Room details</h2><button className="icon-button" aria-label="Close room details" onClick={() => { setPanelOpen(false); membersButton.current?.focus(); }}><Icon name="close" size={17}/></button></div>
            <div className="room-detail-summary"><span className="room-symbol owned-symbol"><Icon name="hash" size={25}/></span><h3>{room.name}</h3><span className={`badge ${room.role === "OWNER" ? "owner" : ""}`}>You’re {room.role === "OWNER" ? "the owner" : "a member"}</span><p className="field-hint">Created {new Date(room.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p></div>
            <section className="members-section" aria-labelledby="members-heading"><div className="section-heading"><h3 id="members-heading">Members <span className="muted">{result.members.length}</span></h3><button className="icon-button" aria-label="Refresh members" onClick={refreshMembers} disabled={Boolean(busy)}><Icon name="refresh" size={15}/></button></div><ul className="member-list">{result.members.map(member => <li key={member.userId}><span className="avatar" aria-hidden="true">{(member.user.displayName || "U").slice(0, 1).toUpperCase()}</span><div className="member-name"><strong>{member.user.displayName || "Unnamed member"}{member.userId === userId && <span className="muted"> (you)</span>}</strong><span>{member.role === "OWNER" ? "Room owner" : "Member"}</span></div>{member.role === "OWNER" && <Icon name="crown" size={14}/>}</li>)}</ul></section>
            <section className="membership-section">{room.role === "OWNER" ? <><h3>A room is better together.</h3><p className="muted">Invite your people. Anyone with the token can join.</p>{inviteToken ? <><label htmlFor="room-invite">Invite token</label><input id="room-invite" className="token-input" value={inviteToken} readOnly/><button className="button secondary full-width" onClick={copyInvite}><Icon name={copied ? "check" : "copy"} size={15}/>{copied ? "Copied!" : "Copy invite token"}</button></> : <button className="button secondary full-width" onClick={showInvite} disabled={Boolean(busy)}><Icon name="plus" size={15}/>{busy === "invite" ? "Loading…" : "Get invite token"}</button>}<p className="field-hint">Owners keep their membership. Ownership transfer isn’t available yet.</p></> : <><h3>Your membership</h3><p className="muted">This is one of your shared spaces.</p><button className="button danger-outline full-width" onClick={() => setConfirmLeave(true)}><Icon name="logout" size={16}/>Leave room</button></>}</section>
            {actionError && <p className="form-error" role="alert">{actionError}</p>}
          </aside></>}
        </div>
        {confirmLeave && <Modal title="Leave this room?" onClose={() => setConfirmLeave(false)} busy={Boolean(busy)}><p className="muted">You’ll need an invitation to rejoin. Your previous messages will stay in the room.</p>{actionError && <p className="form-error" role="alert">{actionError}</p>}<div className="dialog-footer"><button className="button secondary" disabled={Boolean(busy)} onClick={() => setConfirmLeave(false)}>Stay here</button><button className="button danger" disabled={Boolean(busy)} onClick={confirmLeaving}>{busy === "leave" ? "Leaving…" : "Leave room"}</button></div></Modal>}
      </>}
  </main>;
}
