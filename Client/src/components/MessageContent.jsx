import { lazy, Suspense } from "react";
const CodeNote = lazy(() => import("./CodeNote"));
// Ordinary text remains escaped by React. Only syntax-highlighter output is rendered as HTML.
export default function MessageContent({ body }) {
  return <div className="message-body">{body.split(/(```[\s\S]*?```)/g).map((part, index) => {
    const code = part.match(/^```([^\n`]*)\n([\s\S]*?)```$/);
    return code ? <Suspense key={index} fallback={<pre className="code-loading"><code>{code[2]}</code></pre>}><CodeNote language={code[1].trim().slice(0,30)} source={code[2].replace(/\n$/, "")}/></Suspense> : part ? <span className="message-text" key={index}>{part}</span> : null;
  })}</div>;
}
