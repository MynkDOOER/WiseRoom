import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Link, useNavigate, useParams, useOutletContext } from "react-router-dom";
import { getInvite, getMembers, getRoom, leaveRoom } from "../api/rooms";
import { useWorkspace } from "../context/workspaceContext";
import ChatPanel from "../components/ChatPanel";
import ElasticStack from "../components/ElasticStack";
import MembersPopover from "../components/MembersPopover";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import RoomSettingsDialog from "../components/RoomSettingsDialog";
import RoomPeopleDialog from "../components/RoomPeopleDialog";
import RoomAvatar from "../components/ui/RoomAvatar";

function subscribeToCompactHeader(onChange) {
  const media = window.matchMedia("(max-width: 480px)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
const compactHeaderSnapshot = () => window.matchMedia("(max-width: 480px)").matches;

export default function RoomPage() {
  const { roomId } = useParams();
  const { userId } = useAuth();
  return <RoomDetails key={`${roomId}:${userId}`} roomId={roomId}/>;
}

function RoomDetails({ roomId }) {
  const compactHeader = useSyncExternalStore(subscribeToCompactHeader, compactHeaderSnapshot, () => false);
  const { headerSlot } = useOutletContext();
  const { getToken, userId } = useAuth();
  const { user } = useUser();
  const { refreshRooms } = useWorkspace();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersPosition, setMembersPosition] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [inviteToken, setInviteToken] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const membersAnchor = useRef(null);

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

  function openMembers(id = null) { setMembersPosition(membersAnchor.current?.getBoundingClientRect()); setSelectedMemberId(id); setMembersOpen(true); }
  async function refreshRoomDetails() {
    const token = await getToken();
    const [room, members] = await Promise.all([getRoom(token, roomId), getMembers(token, roomId)]);
    setResult({ room, members }); refreshRooms();
  }
  async function refreshMembers() {
    setBusy("members"); setActionError("");
    try {
      await refreshRoomDetails();
    } catch (error) { setActionError(error.message); }
    finally { setBusy(""); }
  }
  async function showInvite() {
    setMembersPosition(membersAnchor.current?.getBoundingClientRect());
    setMembersOpen(true); setBusy("invite"); setActionError("");
    try { const invite = await getInvite(await getToken(), roomId); setInviteToken(new URL(invite.path, window.location.origin).href); }
    catch (error) { setActionError(error.message); }
    finally { setBusy(""); }
  }
  async function copyInvite() {
    try { await navigator.clipboard.writeText(inviteToken); setCopied(true); setActionError(""); }
    catch { setActionError("Couldn’t copy automatically. Select the invitation link and copy it manually."); }
  }
  async function confirmLeaving() {
    if (busy) return;
    setBusy("leave"); setActionError("");
    try { await leaveRoom(await getToken(), roomId); refreshRooms(); navigate("/", { replace: true }); }
    catch (error) { setActionError(error.message); }
    finally { setBusy(""); }
  }
  const room = result?.room;
  const memberItems = (result?.members || []).map(member => ({
    id: member.userId, name: member.user.displayName || "Unnamed member", role: member.role,
    isYou: member.userId === userId,
    image: member.userId === userId ? user?.imageUrl : member.user.imageUrl,
  }));

  return <main className="room-page">
    {result?.error ? <div className="notice room-load-state" role="alert"><h1>Couldn’t open this room</h1><p className="muted">{result.error}</p><div className="button-row"><button className="button secondary" onClick={() => { setResult(null); setAttempt(value => value + 1); }}>Try again</button><Link className="button secondary" to="/">Your rooms</Link></div></div>
      : !room ? <div className="room-load-state muted" role="status">Opening your room…</div> : <>
        {headerSlot && createPortal(<div className="compact-room-heading"><div className="compact-room-title"><RoomAvatar name={room.name} src={room.avatarUrl}/><div className="room-title-copy"><h1>{room.name}</h1><span>{result.members.length} {result.members.length === 1 ? "member" : "members"}</span></div></div><div className="room-heading-actions">
          <div ref={membersAnchor} className="members-stack-control"><ElasticStack items={memberItems} itemSize={compactHeader ? 28 : 32} overlap={compactHeader ? 12 : 13} pushForce={9} maxVisible={compactHeader ? 2 : 3} onSelect={openMembers} onMore={() => openMembers()} label="Open room member details"/>{result.members.length <= 3 && <button className="members-count-trigger" aria-label={`View all ${result.members.length} members`} title="View all members" onClick={() => openMembers()}>{result.members.length}<Icon name="chevron" size={12}/></button>}</div>
          {room.role === "OWNER" && <button aria-label="Invite" title="Invite to this room" className="button primary invite-button" onClick={showInvite} disabled={Boolean(busy)}><Icon name="plus" size={16}/><span>Invite</span></button>}
          <button className="icon-button" aria-label="Room settings" title="Room settings" onClick={() => setSettingsOpen(true)}><Icon name="more"/></button>
        </div></div>, headerSlot)}
        <div className="room-workspace"><ChatPanel roomId={roomId} roomName={room.name}/></div>
        {membersOpen && <MembersPopover room={room} members={result.members} items={memberItems} anchorRef={membersAnchor} anchorBox={membersPosition} selectedId={selectedMemberId} onSelect={setSelectedMemberId} onClose={() => setMembersOpen(false)} busy={busy} onRefresh={refreshMembers} inviteToken={inviteToken} copied={copied} onInvite={showInvite} onCopy={copyInvite} onLeave={() => setConfirmLeave(true)} onManage={() => { setMembersOpen(false); setPeopleOpen(true); }} error={actionError}/>}
        {settingsOpen && <RoomSettingsDialog room={room} onClose={() => setSettingsOpen(false)} onChanged={refreshRoomDetails}/>}
        {peopleOpen && room.role === "OWNER" && <RoomPeopleDialog room={room} onClose={() => setPeopleOpen(false)} onChanged={refreshRoomDetails}/>}
        {confirmLeave && <Modal title="Leave this room?" onClose={() => setConfirmLeave(false)} busy={Boolean(busy)}><p className="muted">You’ll need an invitation to rejoin. Your previous messages will stay in the room.</p>{actionError && <p className="form-error" role="alert">{actionError}</p>}<div className="dialog-footer"><button className="button secondary" disabled={Boolean(busy)} onClick={() => setConfirmLeave(false)}>Stay here</button><button className="button danger" disabled={Boolean(busy)} onClick={confirmLeaving}>{busy === "leave" ? "Leaving…" : "Leave room"}</button></div></Modal>}
      </>}
  </main>;
}
