import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { myRequests, cancelMyRequest } from "../api/invites";
import Badge from "./ui/Badge";
import Icon from "./Icon";
export default function MyJoinRequests() {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await myRequests(await getToken(), controller.signal);
        if (!controller.signal.aborted) {
          setRequests(data);
          setError("");
        }
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message);
      }
    }
    load();
    return () => controller.abort();
  }, [getToken, attempt]);
  if (!requests.length && !error) return null;
  async function cancel(id) {
    setBusy(id);
    setError("");
    try {
      await cancelMyRequest(await getToken(), id);
      setRequests((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="my-requests" id="my-requests">
      <div className="section-heading">
        <h2>Your join requests</h2>
        <button
          className="icon-button"
          aria-label="Refresh join requests"
          onClick={() => setAttempt((value) => value + 1)}
        >
          <Icon name="refresh" />
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <ul>
        {requests.map((request) => (
          <li key={request.id}>
            <span>{request.room.name}</span>
            <Badge
              tone={
                request.status === "REJECTED"
                  ? "danger"
                  : request.status === "APPROVED"
                    ? "accent"
                    : "neutral"
              }
            >
              {request.status === "APPROVED"
                ? "Approved"
                : request.status === "REJECTED"
                  ? "Declined"
                  : "Pending"}
            </Badge>
            {request.status === "APPROVED" ? (
              <Link to={`/rooms/${request.roomId}`}>Open room</Link>
            ) : request.status === "PENDING" ? (
              <button
                className="text-button"
                disabled={Boolean(busy)}
                onClick={() => cancel(request.id)}
              >
                {busy === request.id ? "Cancelling…" : "Cancel request"}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
