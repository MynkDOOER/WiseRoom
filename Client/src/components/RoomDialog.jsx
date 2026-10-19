import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { createRoom, joinRoom } from "../api/rooms";
import { useWorkspace } from "../context/workspaceContext";
import Icon from "./Icon";
import Modal from "./Modal";
export default function RoomDialog({ kind, onClose }) {
  const { getToken } = useAuth();
  const { refreshRooms } = useWorkspace();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { if (!busy && error) inputRef.current?.focus(); }, [busy, error]);
  const creating = kind === "create";
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const token = await getToken();
      const room = creating ? await createRoom(token, value.trim()) : await joinRoom(token, value.trim());
      refreshRooms();
      navigate(`/rooms/${room.id}`);
      onClose();
    } catch (error) { setError(error.message); setBusy(false); }
  }
  return <Modal title={creating ? "Make room for an idea." : "Your team saved you a seat."} onClose={onClose} busy={busy}>
    <span className="dialog-symbol"><Icon name={creating ? "plus" : "join"} size={24}/></span>
    <p className="muted">{creating ? "A private place to talk, think, and build together." : "Paste the invitation token shared by your room’s owner."}</p>
    <form onSubmit={submit}>
      <label htmlFor="room-dialog-input">{creating ? "Room name" : "Invite token"}</label>
      <input ref={inputRef} data-dialog-autofocus="" id="room-dialog-input" value={value} onChange={event => setValue(event.target.value)} placeholder={creating ? "e.g. The thinking room" : "Paste your 64-character token"} required
        minLength={creating ? 3 : undefined} maxLength={creating ? 80 : undefined}
        pattern={creating ? undefined : "\\s*[0-9a-f]{64}\\s*"}
        title={creating ? "Use 3–80 characters." : "Paste the 64-character token from the owner."}
        className={creating ? "" : "token-input"} autoComplete="off" spellCheck={creating} disabled={busy}/>
      <p className="field-hint">{creating ? "3–80 characters. You’ll be the room owner." : "An invitation gives you member access to the room."}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="dialog-footer"><button type="button" className="button secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="button primary" disabled={busy}>{busy ? creating ? "Creating…" : "Joining…" : creating ? "Create room" : "Join room"}<Icon name="arrow" size={16}/></button></div>
    </form>
  </Modal>;
}

