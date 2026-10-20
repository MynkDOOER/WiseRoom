export default function Badge({ children, tone = "neutral", className = "" }) {
  return <span className={`badge ${tone === "accent" ? "owner" : tone === "danger" ? "badge-danger" : ""} ${className}`}>{children}</span>;
}
