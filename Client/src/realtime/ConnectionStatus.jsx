import { useRealtime } from "./context";
const labels = {
  connecting: "Connecting…",
  connected: "Live",
  reconnecting: "Reconnecting…",
  "authentication-required": "Session needs attention",
};
export default function ConnectionStatus() {
  const { status } = useRealtime();
  return (
    <span
      className={`connection-status ${status}`}
      role="status"
      title={
        status === "connected"
          ? "Live updates connected"
          : "Live updates are unavailable. Saved data will refresh when the connection returns."
      }
    >
      <i aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
