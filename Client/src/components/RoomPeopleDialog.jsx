import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getMembers, removeMember } from "../api/rooms";
import { getJoinRequests, decideJoinRequest } from "../api/joinRequests";
import Modal from "./Modal";
import Button from "./ui/Button";
import Icon from "./Icon";

export default function RoomPeopleDialog({ room, onClose, onChanged }) {
  const { getToken, userId } = useAuth();
  const [tab, setTab] = useState("requests");
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [target, setTarget] = useState(null);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const token = await getToken();
        const [people, page] = await Promise.all([
          getMembers(token, room.id),
          getJoinRequests(token, room.id),
        ]);
        if (active) {
          setMembers(people);
          setRequests(page.requests);
          setCursor(page.nextCursor);
          setLoaded(true);
        }
      } catch (error) {
        if (active) {
          setError(error.message);
          setLoaded(true);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [room.id, getToken, attempt]);
  async function action(kind, request) {
    if (busy) return;
    setBusy(kind);
    setError("");
    setFeedback("");
    try {
      const token = await getToken();
      if (kind === "more") {
        const page = await getJoinRequests(token, room.id, cursor);
        setRequests((current) => [
          ...current,
          ...page.requests.filter(
            (item) => !current.some((old) => old.id === item.id),
          ),
        ]);
        setCursor(page.nextCursor);
      } else if (kind === "remove") {
        await removeMember(token, room.id, target.userId);
        setMembers((current) =>
          current.filter((item) => item.userId !== target.userId),
        );
        setTarget(null);
        await onChanged();
        setFeedback("Member removed. Their earlier messages remain.");
      } else {
        await decideJoinRequest(token, room.id, request.id, kind);
        setRequests((current) =>
          current.filter((item) => item.id !== request.id),
        );
        const people = await getMembers(token, room.id);
        setMembers(people);
        await onChanged();
        setFeedback(
          kind === "APPROVED"
            ? "Request approved. The member can now open the room."
            : "Request declined.",
        );
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <Modal
        title="Manage people"
        onClose={onClose}
        busy={Boolean(busy)}
        className="people-modal"
        headingActions={
          <button
            className="icon-button"
            aria-label="Refresh people and requests"
            disabled={Boolean(busy)}
            onClick={() => {
              setError("");
              setAttempt((value) => value + 1);
            }}
          >
            <Icon name="refresh" />
          </button>
        }
      >
        <p className="muted">{room.name}</p>
        <div className="people-tabs" role="group" aria-label="People view">
          <button
            aria-pressed={tab === "members"}
            onClick={() => setTab("members")}
          >
            Members {members.length}
          </button>
          <button
            aria-pressed={tab === "requests"}
            onClick={() => setTab("requests")}
          >
            Requests {requests.length}
            {cursor ? "+" : ""}
          </button>
        </div>
        {!loaded ? (
          <p className="people-empty" role="status">
            Loading people…
          </p>
        ) : tab === "requests" ? (
          <>
            <ul className="people-list">
              {requests.map((request) => (
                <li key={request.id}>
                  <span className="avatar" aria-hidden="true">
                    {(request.user.displayName || "U")[0].toUpperCase()}
                  </span>
                  <div className="person-copy">
                    <strong>
                      {request.user.displayName || "Unnamed member"}
                    </strong>
                    <time dateTime={request.createdAt}>
                      Requested{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </time>
                  </div>
                  <div className="person-actions">
                    <Button
                      onClick={() => action("REJECTED", request)}
                      disabled={Boolean(busy)}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => action("APPROVED", request)}
                      disabled={Boolean(busy)}
                    >
                      Approve
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            {!requests.length && (
              <p className="people-empty">No pending requests.</p>
            )}
            {cursor && (
              <Button onClick={() => action("more")} disabled={Boolean(busy)}>
                {busy === "more" ? "Loading…" : "Load more requests"}
              </Button>
            )}
          </>
        ) : (
          <ul className="people-list">
            {members.map((member) => (
              <li key={member.userId}>
                <span className="avatar" aria-hidden="true">
                  {(member.user.displayName || "U")[0].toUpperCase()}
                </span>
                <div className="person-copy">
                  <strong>
                    {member.user.displayName || "Unnamed member"}
                    {member.userId === userId ? " (you)" : ""}
                  </strong>
                  <span>{member.role === "OWNER" ? "Owner" : "Member"}</span>
                </div>
                {member.role !== "OWNER" && member.userId !== userId && (
                  <Button
                    variant="danger-outline"
                    onClick={() => setTarget(member)}
                    disabled={Boolean(busy)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
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
        <p className="field-hint">
          Only the owner can approve requests or remove members.
        </p>
      </Modal>
      {target && (
        <Modal
          title="Remove this member?"
          onClose={() => setTarget(null)}
          busy={Boolean(busy)}
        >
          <p className="muted">
            {target.user.displayName || "This member"} will lose room access.
            Their previous messages will remain.
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-footer">
            <Button disabled={Boolean(busy)} onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger-outline"
              disabled={Boolean(busy)}
              onClick={() => action("remove")}
            >
              {busy ? "Removing…" : "Remove member"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
