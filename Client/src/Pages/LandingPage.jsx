import { useEffect, useRef } from "react";
import WiseRoomLogo from "../components/WiseRoomLogo";
import {
  LandingAccount,
  LandingDemo,
  LandingMarquee,
  ChatStepVisual,
} from "../components/landing/LandingSections";

export default function LandingPage() {
  const page = useRef(null);
  useEffect(() => {
    document.title = "WiseRoom — Think together. Go further.";
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              entry.target.classList.contains("chat-steps") ? "go" : "on",
            );
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    page.current
      .querySelectorAll(".reveal, .chat-steps")
      .forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      document.title = "WiseRoom";
    };
  }, []);
  return (
    <main ref={page} className="landing-page" id="top">
      <a className="skip-link" href="#how">
        Skip to content
      </a>

      <div className="grain" aria-hidden="true" />

      <nav className="top">
        <a className="brand" href="#top">
          <WiseRoomLogo />
          WiseRoom.
        </a>
        <div className="links">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#security">Security</a>
        </div>
        <a className="btn btn-g" href="#start" style={{ height: "38px" }}>
          Sign in
        </a>
        <a className="btn btn-o" href="#start" style={{ height: "38px" }}>
          Get started <span className="arr">→</span>
        </a>
      </nav>

      <header role="banner" className="hero" data-screen-label="Hero">
        <div className="gridbg" />
        <div className="glow" />
        <div className="wrap" style={{ position: "relative" }}>
          <span className="eyebrow fade-in" style={{ animationDelay: ".1s" }}>
            <b>LIVE</b> Your people. Your rooms. One conversation at a time.
          </span>
          <h1 className="big">
            <span className="word">
              <span>Great</span>
            </span>{" "}
            <span className="word">
              <span style={{ animationDelay: ".06s" }}>things</span>
            </span>{" "}
            <span className="word">
              <span style={{ animationDelay: ".12s" }} className="ghost">
                start
              </span>
            </span>
            <br />
            <span className="word">
              <span style={{ animationDelay: ".2s" }}>with</span>
            </span>{" "}
            <span className="word">
              <span style={{ animationDelay: ".26s" }}>a</span>
            </span>{" "}
            <span className="word">
              <span style={{ animationDelay: ".32s" }} className="it">
                conversation.
              </span>
            </span>
          </h1>
          <div className="hero-row fade-in">
            <p>
              Private chat rooms for <em>your people and your projects.</em>{" "}
              Share messages, voice notes, code, and ideas — together in real
              time.
            </p>
            <div className="cta">
              <a
                className="btn btn-o"
                href="#start"
                style={{ height: "52px", padding: "0 26px", fontSize: "15px" }}
              >
                Open a room — it's free <span className="arr">→</span>
              </a>
              <a
                className="btn btn-g"
                href="#how"
                style={{ height: "52px", padding: "0 22px", fontSize: "15px" }}
              >
                See how it works
              </a>
            </div>
          </div>

          <LandingDemo />
        </div>
      </header>

      <div className="marq">
        <LandingMarquee />
      </div>

      <section className="s" id="how" data-screen-label="How it works">
        <div className="wrap">
          <div className="sh reveal">
            <div className="mono">01 — Make room</div>
            <div>
              <h2>
                Your people, together.{" "}
                <span className="dim">A room for every conversation.</span>
              </h2>
              <p>
                Start a private room, invite your group, and get talking. Keep
                each project, class, and side quest in its own space.
              </p>
            </div>
          </div>
          <div className="chat-steps">
            {[
              [
                "Create",
                "Name your room and make a space for your group.",
                "rooms",
              ],
              [
                "Invite",
                "Share a link or code. The owner approves who joins.",
                "invite",
              ],
              [
                "Chat",
                "Send messages, voice notes, code, and links in real time.",
                "chat",
              ],
              [
                "Come back",
                "Pick up with threads, saved messages, and unread activity.",
                "saved",
              ],
            ].map(([title, description, kind], index) => (
              <div className="stage" key={kind}>
                <div className="num">0{index + 1}</div>
                <h3>{title}</h3>
                <p>{description}</p>
                <ChatStepVisual kind={kind} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="s"
        id="features"
        style={{ paddingTop: "0" }}
        data-screen-label="Features"
      >
        <div className="wrap">
          <div className="sh reveal">
            <div className="mono">02 — The rooms</div>
            <div>
              <h2>
                One space per idea.{" "}
                <span className="dim">As many as you need.</span>
              </h2>
            </div>
          </div>
          <div className="bento">
            <div className="card c-a reveal">
              <div className="mono" style={{ marginBottom: "18px" }}>
                Multi-room
              </div>
              <h3>A room for every project, class, and side quest.</h3>
              <p>
                Each room keeps its own people and conversation history, with
                membership controls for every space.
              </p>
              <div className="rooms-viz">
                <span>#launch-plan</span>
                <span>#dsa-prep</span>
                <span>#research</span>
                <span>#thesis-group</span>
                <span>#design-crit</span>
                <span>#hackathon</span>
                <span>+ new room</span>
              </div>
            </div>
            <div className="card c-b reveal">
              <div className="mono" style={{ marginBottom: "18px" }}>
                Real-time
              </div>
              <h3>Everyone, live.</h3>
              <p>Presence, typing, and replies the instant they happen.</p>
              <div className="cursors">
                <div className="cur" style={{ left: "8%", top: "10%" }}>
                  <svg viewBox="0 0 16 16">
                    <path d="M1 1l5 14 2-6 6-2z" fill="#ffb38a" />
                  </svg>
                  <b style={{ background: "#ffb38a" }}>Arya</b>
                </div>
                <div
                  className="cur"
                  style={{ left: "46%", top: "46%", animationDelay: "-2s" }}
                >
                  <svg viewBox="0 0 16 16">
                    <path d="M1 1l5 14 2-6 6-2z" fill="#c9b8ff" />
                  </svg>
                  <b style={{ background: "#c9b8ff" }}>Jun</b>
                </div>
                <div
                  className="cur"
                  style={{ left: "20%", top: "62%", animationDelay: "-4s" }}
                >
                  <svg viewBox="0 0 16 16">
                    <path d="M1 1l5 14 2-6 6-2z" fill="#9be3c4" />
                  </svg>
                  <b style={{ background: "#9be3c4" }}>Sana</b>
                </div>
              </div>
            </div>
            <div id="security" className="card c-c reveal">
              <div className="mono" style={{ marginBottom: "18px" }}>
                Private by default
              </div>
              <h3>Your conversations stay in your room.</h3>
              <div className="lock">
                <div>
                  <span>auth</span>
                  <b>Clerk SSO</b>
                </div>
                <div>
                  <span>scope</span>
                  <b>room membership</b>
                </div>
                <div>
                  <span>access</span>
                  <b>invite only</b>
                </div>
              </div>
            </div>
            <div className="card c-d reveal">
              <div className="mono" style={{ marginBottom: "18px" }}>
                Keep the context
              </div>
              <h3>Good conversations deserve a follow-up.</h3>
              <p>
                Reply in threads, react to a great idea, and save messages you
                want to return to. Keep the details close to the conversation.
              </p>
              <div className="quote-viz" style={{ marginTop: "28px" }}>
                “The new homepage is ready for feedback.”
                <div className="demo-reactions">
                  <span>🔥 3</span>
                  <span>3 replies</span>
                  <span>Saved ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="signin" id="start" data-screen-label="Sign in">
        <div className="wrap inner">
          <div className="reveal">
            <div className="mono" style={{ marginBottom: "24px" }}>
              03 — Step inside
            </div>
            <h2>
              Pull up
              <br />a chair<span>.</span>
            </h2>
            <p>
              Your people, your ideas, and a little room to bring them together.
            </p>
            <div className="steps">
              <div>
                <b>01</b>Sign in with Google, GitHub, or email
              </div>
              <div>
                <b>02</b>Create a room and invite your people
              </div>
              <div>
                <b>03</b>Send a message and start the conversation
              </div>
            </div>
          </div>
          <div className="clerk-host reveal">
            <LandingAccount />
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="row">
            <div>
              <a className="brand" href="#top">
                <WiseRoomLogo />
                WiseRoom.
              </a>
              <p className="mono" style={{ marginTop: "16px" }}>
                A shared space. A clearer mind.
              </p>
            </div>
            <div className="cols">
              <div>
                <span className="mono">Product</span>
                <a href="#how">How it works</a>
                <a href="#features">Features</a>
                <a href="#start">Sign in</a>
              </div>
              <div>
                <span className="mono">Elsewhere</span>
                <a href="https://github.com/MynkDOOER/WiseRoom">GitHub</a>
                <a href="https://github.com/MynkDOOER/WiseRoom/commits">
                  Changelog
                </a>
                <a href="https://github.com/MynkDOOER/WiseRoom/issues/new">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="wordmark">
          WiseRoom<span>.</span>
        </div>
      </footer>
    </main>
  );
}
