import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { previewInvite, requestAccess, cancelAccess } from "../api/invites";
import { useWorkspace } from "../context/workspaceContext";
import Button from "../components/ui/Button";
import RoomAvatar from "../components/ui/RoomAvatar";
import Badge from "../components/ui/Badge";
import Icon from "../components/Icon";
export default function JoinRoomPage() {
  const { code } = useParams();
  return <JoinRoomDetails key={code} code={code} />;
}
function JoinRoomDetails({ code }) {
  const { getToken } = useAuth();
  const { refreshRooms } = useWorkspace();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await previewInvite(
          await getToken(),
          code,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        if (data.memberRoomId) {
          refreshRooms();
          navigate(`/rooms/${data.memberRoomId}`, { replace: true });
        } else setResult(data);
      } catch (error) {
        if (!controller.signal.aborted) setResult({ error: error.message });
      }
    }
    load();
    return () => controller.abort();
  }, [code, attempt, getToken, navigate, refreshRooms]);
  async function act(kind) {
    setBusy(true);
    setError("");
    try {
      const token = await getToken();
      if (kind === "cancel") {
        await cancelAccess(token, code);
        setResult((current) => ({ ...current, request: null }));
      } else {
        const data = await requestAccess(token, code);
        if (data.memberRoomId) {
          refreshRooms();
          navigate(`/rooms/${data.memberRoomId}`, { replace: true });
        } else setResult((current) => ({ ...current, request: data.request }));
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  const pending = result?.request?.status === "PENDING";
  return (
    <main className="join-page">
      <section className="join-card">
        {!result ? (
          <p role="status">Opening invitation…</p>
        ) : result.error ? (
          <>
            <h1>Invitation unavailable</h1>
            <p className="muted">{result.error}</p>
            <Button
              onClick={() => {
                setResult(null);
                setAttempt((value) => value + 1);
              }}
            >
              Try again
            </Button>
            <Link className="back-link" to="/">
              Back to workspace
            </Link>
          </>
        ) : (
          <>
            <RoomAvatar name={result.room.name} className="join-avatar" />
            <Badge>{pending ? "Request pending" : "Room invitation"}</Badge>
            <h1>{result.room.name}</h1>
            <p className="muted">
              {pending
                ? "Your request is with the owner. Refresh to check their decision."
                : result.request?.status === "REJECTED"
                  ? "Your previous request was declined. You can request again after a short wait."
                  : "The room owner approves new members."}
            </p>
            {pending ? (
              <div className="join-actions">
                <Button
                  variant="primary"
                  onClick={() => {
                    setResult(null);
                    setAttempt((value) => value + 1);
                  }}
                  disabled={busy}
                >
                  <Icon name="refresh" />
                  Refresh status
                </Button>
                <Button onClick={() => act("cancel")} disabled={busy}>
                  Cancel request
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={() => act("request")}
                disabled={busy}
              >
                {busy ? "Sending request…" : "Request to join"}
              </Button>
            )}
            <p className="field-hint">
              Messages stay private until you’re approved.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Link className="back-link" to="/">
              Back to workspace
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
