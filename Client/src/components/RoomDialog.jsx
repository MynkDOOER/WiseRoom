import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../api/rooms";
import { parseInvitation } from "../api/invites";
import { useWorkspace } from "../context/workspaceContext";
import Icon from "./Icon";
import Modal from "./Modal";
import Button from "./ui/Button";
import TextField from "./ui/TextField";
export default function RoomDialog({ kind, onClose }) {
  const { getToken } = useAuth();
  const { refreshRooms } = useWorkspace();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    if (!busy && error) inputRef.current?.focus();
  }, [busy, error]);
  const creating = kind === "create";
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (creating) {
        const room = await createRoom(await getToken(), value.trim());
        refreshRooms();
        navigate(`/rooms/${room.id}`);
      } else navigate(`/join/${parseInvitation(value)}`);
      onClose();
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  return (
    <Modal
      title={creating ? "Create a room" : "Join a room"}
      onClose={onClose}
      busy={busy}
    >
      <p className="muted">
        {creating
          ? "Give your conversation a name. You’ll be the owner."
          : "Open an invitation to request access. The owner approves new members."}
      </p>
      <form onSubmit={submit}>
        <TextField
          ref={inputRef}
          data-dialog-autofocus=""
          label={creating ? "Room name" : "Invitation link or code"}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={
            creating ? "e.g. Design studio" : "Paste a link or enter A7K2PX"
          }
          required
          minLength={creating ? 3 : undefined}
          maxLength={creating ? 80 : 500}
          autoComplete="off"
          spellCheck={creating}
          disabled={busy}
          hint={
            creating
              ? "3–80 characters."
              : "Existing members go straight to the room."
          }
          error={error}
        />
        <div className="dialog-footer">
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy
              ? creating
                ? "Creating…"
                : "Opening…"
              : creating
                ? "Create room"
                : "Continue"}
            <Icon name="arrow" size={16} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
