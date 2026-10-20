// Text stays escaped by React; fenced code uses the code font without injecting HTML.
export default function MessageContent({ body, createdAt }) {
  const parts = body.split(/(```[\s\S]*?```)/g);
  return (
    <div className="message-body">
      {parts.map((part, index) => {
        const code = part.match(/^```([^\n`]*)\n([\s\S]*?)```$/);
        return code ? (
          <div className="code-block" key={index}>
            <span className="code-language">
              {code[1].trim().slice(0, 30) || "code"}
            </span>
            <pre>
              <code>{code[2].replace(/\n$/, "")}</code>
            </pre>
          </div>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
      <time
        className="message-time"
        dateTime={createdAt}
        title={new Date(createdAt).toLocaleString()}
      >
        {new Date(createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </time>
    </div>
  );
}
