import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { getActivity } from "../api/collaboration";
import { useWorkspace } from "../context/workspaceContext";
import MyJoinRequests from "./MyJoinRequests";
import Icon from "./Icon";
export default function ForYou() {
  const { getToken } = useAuth();
  const { rooms, unreadTotal, activityVersion } = useWorkspace();
  const [messages, setMessages] = useState(null),
    [error, setError] = useState("");
  const pending = rooms.filter(
    (room) => room.role === "OWNER" && room.pendingRequestCount > 0,
  );
  useEffect(() => {
    const controller = new AbortController();
    getToken()
      .then((token) => getActivity(token, "inbox", null, controller.signal))
      .then((page) => {
        if (!controller.signal.aborted) {
          setMessages(page.messages.slice(0, 4));
          setError("");
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message);
      });
    return () => controller.abort();
  }, [getToken, unreadTotal, activityVersion]);
  return (
    <aside className="home-for-you" id="for-you">
      <div className="section-heading">
        <h2>For you</h2>
        <Link className="text-button" to="/inbox">
          Open Inbox
        </Link>
      </div>
      {error && (
        <p className="field-hint" role="alert">
          {error}
        </p>
      )}
      {messages === null && !error && (
        <p className="field-hint" role="status">
          Loading activity…
        </p>
      )}
      <ul>
        {pending.map((room) => (
          <li key={room.id}>
            <span className="activity-icon">
              <Icon name="people" size={16} />
            </span>
            <div>
              <strong>
                {room.pendingRequestCount}{" "}
                {room.pendingRequestCount === 1
                  ? "person wants"
                  : "people want"}{" "}
                to join
              </strong>
              <p>{room.name}</p>
              <Link to={`/rooms/${room.id}?panel=requests`}>
                Review requests <Icon name="arrow" size={12} />
              </Link>
            </div>
          </li>
        ))}
        {messages?.map((message) => (
          <li key={message.id}>
            <span className="activity-person-avatar">
              {(message.author.displayName || "U").slice(0, 1)}
            </span>
            <div>
              <p>
                <strong>{message.author.displayName || "Member"}</strong> in{" "}
                {message.room.name}
              </p>
              <Link
                to={`/rooms/${message.roomId}?thread=${message.parentId || message.id}`}
              >
                {message.voiceMime
                  ? "Sent a voice message"
                  : message.body
                      .replace(/```[\s\S]*?```/g, "Shared a code note")
                      .slice(0, 100)}
              </Link>
            </div>
            <span className="unread-dot" />
          </li>
        ))}
      </ul>
      {messages?.length === 0 && pending.length === 0 && (
        <div className="activity-empty">
          <Icon name="check" size={20} />
          <h3>You’re all caught up.</h3>
          <p>New messages and room requests will appear here.</p>
        </div>
      )}
      <MyJoinRequests />
    </aside>
  );
}
