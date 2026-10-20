import { Link } from "react-router-dom";
export default function AuthLayout({ children }) {
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link to="/" className="brand">
          <img src="/favicon.svg" alt="" width="48" height="48" />
          <span>
            WiseRoom<span className="brand-dot">.</span>
          </span>
        </Link>
        <div>
          <p className="eyebrow">THINK TOGETHER. GO FURTHER.</p>
          <h1>
            Great things start
            <br />
            with a conversation.
          </h1>
          <p className="muted">
            Your people, your ideas, and a little room to bring them together.
          </p>
          <img
            className="auth-brand-image"
            src="/favicon.svg"
            alt="WiseRoom’s overlapping orange and ivory conversation bubbles"
          />
        </div>
        <p className="auth-caption">A shared space. A clearer mind.</p>
      </section>
      <section className="auth-form-area" aria-label="Account access">
        {children}
      </section>
    </main>
  );
}
