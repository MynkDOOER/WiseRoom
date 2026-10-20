import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  getInvite,
  resetInvite,
  renameRoom,
  resetRoomAvatar,
} from "../api/rooms";
import Modal from "./Modal";
import Button from "./ui/Button";
import TextField from "./ui/TextField";
import RoomAvatar from "./ui/RoomAvatar";
import RoomAvatarCropDialog from "./RoomAvatarCropDialog";
import Icon from "./Icon";

export default function RoomSettingsDialog({ room, onClose, onChanged }) {
  const { getToken } = useAuth();
  const owner = room.role === "OWNER";
  const [name, setName] = useState(room.name);
  const [invite, setInvite] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [crop, setCrop] = useState(false);
  const [confirm, setConfirm] = useState(null);
  useEffect(() => {
    if (!owner) return;
    let active = true;
    async function load() {
      try {
        const value = await getInvite(await getToken(), room.id);
        if (active) setInvite(value);
      } catch (error) {
        if (active) setError(error.message);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [room.id, owner, getToken]);
  async function action(kind) {
    if (busy) return;
    setBusy(kind);
    setError("");
    setFeedback("");
    try {
      const token = await getToken();
      if (kind === "rename") {
        await renameRoom(token, room.id, name.trim());
        await onChanged();
        setFeedback("Room name updated.");
      }
      if (kind === "reset-invite") {
        setInvite(await resetInvite(token, room.id));
        setConfirm(null);
        setFeedback("The previous invitation is no longer valid.");
      }
      if (kind === "reset-avatar") {
        await resetRoomAvatar(token, room.id);
        await onChanged();
        setConfirm(null);
        setFeedback("Room picture removed.");
      }
      if (kind === "load-invite") setInvite(await getInvite(token, room.id));
      if (kind === "copy") {
        await navigator.clipboard.writeText(
          new URL(invite.path, window.location.origin).href,
        );
        setFeedback("Invitation link copied.");
      }
    } catch (error) {
      setError(
        kind === "copy"
          ? "Couldn’t copy automatically. Select the invitation link and copy it manually."
          : error.message,
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <Modal
        title="Room settings"
        onClose={onClose}
        busy={Boolean(busy)}
        className="room-settings-modal"
      >
        <section className="settings-section">
          <h3>Room picture</h3>
          <div className="settings-picture">
            <RoomAvatar name={room.name} src={room.avatarUrl} />
            <div>
              <Button onClick={() => setCrop(true)} disabled={Boolean(busy)}>
                Change picture
              </Button>
              <p className="field-hint">Any room member can update this.</p>
            </div>
          </div>
          {room.avatarUrl && (
            <button
              className="text-button"
              onClick={() => setConfirm("reset-avatar")}
              disabled={Boolean(busy)}
            >
              Remove picture
            </button>
          )}
        </section>
        <section className="settings-section">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              action("rename");
            }}
          >
            <TextField
              label="Room name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={3}
              maxLength={80}
              required
              readOnly={!owner}
              disabled={Boolean(busy)}
              hint={
                owner
                  ? "3–80 characters."
                  : "Only the room owner can rename this room."
              }
            />
            {owner && (
              <Button
                type="submit"
                variant="primary"
                className="settings-save"
                disabled={Boolean(busy) || name.trim() === room.name}
              >
                {busy === "rename" ? "Saving…" : "Save name"}
              </Button>
            )}
          </form>
        </section>
        {owner && (
          <section className="settings-section">
            <h3>Invitation</h3>
            {invite ? (
              <>
                <TextField
                  label="Shareable link"
                  readOnly
                  value={new URL(invite.path, window.location.origin).href}
                  onFocus={(event) => event.target.select()}
                />
                <div className="invite-code-row">
                  <span>Room code</span>
                  <code>{invite.code}</code>
                </div>
                <p className="field-hint">
                  New members must be approved by you.
                </p>
                <div className="button-row">
                  <Button
                    onClick={() => action("copy")}
                    disabled={Boolean(busy)}
                  >
                    <Icon name="copy" />
                    Copy link
                  </Button>
                  <Button
                    onClick={() => setConfirm("reset-invite")}
                    disabled={Boolean(busy)}
                  >
                    Reset invitation
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={() => action("load-invite")}
                disabled={Boolean(busy)}
              >
                {busy === "load-invite" ? "Loading…" : "Load invitation"}
              </Button>
            )}
          </section>
        )}
        {feedback && (
          <p className="action-feedback" role="status">
            {feedback}
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </Modal>
      {crop && (
        <RoomAvatarCropDialog
          roomId={room.id}
          onClose={() => setCrop(false)}
          onSaved={onChanged}
        />
      )}
      {confirm && (
        <Modal
          title={
            confirm === "reset-invite"
              ? "Reset invitation?"
              : "Remove room picture?"
          }
          onClose={() => setConfirm(null)}
          busy={Boolean(busy)}
        >
          <p className="muted">
            {confirm === "reset-invite"
              ? "The existing link and code will stop accepting requests. Current members and pending requests stay unchanged."
              : "The room will use its initials. Any member can upload a new picture."}
          </p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="dialog-footer">
            <Button disabled={Boolean(busy)} onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="danger-outline"
              disabled={Boolean(busy)}
              onClick={() => action(confirm)}
            >
              {busy ? "Updating…" : "Confirm"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
