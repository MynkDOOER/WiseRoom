import { useEffect, useState } from "react";
import { SignIn, useAuth, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { authAppearance } from "../../styles/authAppearance";

const people = {
  MK: ["Mayank", "#fbefe2"],
  AR: ["Arya", "#ffb38a"],
  JL: ["Jun", "#c9b8ff"],
  SN: ["Sana", "#9be3c4"],
};
const scripts = {
  "launch-plan": [
    {
      user: "AR",
      text: "The launch page is ready. Can we do one last review?",
    },
    { user: "JL", text: "On it! The mobile layout looks great 🙌" },
    {
      user: "MK",
      text: "I’ll check the sign-up flow. Let’s keep feedback in this thread.",
    },
    { user: "SN", text: "All clear from me. Ready when you are 🚀" },
  ],
  research: [
    {
      user: "SN",
      text: "Anyone free to compare interview notes this afternoon?",
    },
    {
      user: "AR",
      text: "I can join at 3. There were some useful patterns in the last session.",
    },
    {
      user: "JL",
      text: "Same here. I saved the discussion so we can pick up where we left off.",
    },
  ],
  "thesis-group": [
    { user: "MK", text: "Quick check-in: how is chapter 3 going?" },
    {
      user: "AR",
      text: "Literature review is done. Jun, want to take the next section?",
    },
    { user: "JL", text: "Yes! I’ll share an update here after class." },
    { user: "SN", text: "Perfect. See you both at the study session 📚" },
  ],
  "design-crit": [
    { user: "JL", text: "Homepage v2 is up, roast it 🔥" },
    { user: "AR", text: "The hero finally feels alive. Type is 🔥" },
    {
      user: "MK",
      text: "Saved this. Let’s try a little more space around the buttons.",
    },
    { user: "SN", text: "That feels right. Ship it." },
  ],
};

function DemoConversation({ name }) {
  const messages = scripts[name];
  const [visible, setVisible] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? messages.length
      : 0,
  );
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers = messages.map((_, index) =>
      setTimeout(() => setVisible(index + 1), 600 + index * 900),
    );
    return () => timers.forEach(clearTimeout);
  }, [messages]);
  return (
    <div className="msgs" aria-label={`Illustrative ${name} conversation`}>
      {messages.slice(0, visible).map((message, index) => (
        <div className="m in" key={index}>
          <span className="av" style={{ background: people[message.user][1] }}>
            {message.user}
          </span>
          <div className="body">
            <div className="who">
              {people[message.user][0]} <time>just now</time>
            </div>
            <div className="txt">{message.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LandingDemo() {
  const [room, setRoom] = useState("launch-plan");
  return (
    <>
      <div
        className="demo fade-in"
        style={{ animationDelay: "1s" }}
        aria-label="Interactive chat preview"
      >
        <aside className="side" aria-label="Preview rooms">
          <div className="mono">Rooms</div>
          {Object.keys(scripts).map((name, index) => (
            <button
              type="button"
              key={name}
              className={`room ${room === name ? "on" : index === 1 ? "unread" : ""}`}
              aria-pressed={room === name}
              onClick={() => setRoom(name)}
            >
              <span className="hash">#</span>
              {name}
              <span className="dot" />
            </button>
          ))}
          <div className="you">
            <span className="av" style={{ background: people.MK[1] }}>
              MK
            </span>
            Mayank · online
          </div>
        </aside>
        <div className="chat">
          <div className="chat-h">
            <div className="t">
              <span>#</span>
              <span className="demo-room-name">{room}</span>
            </div>
            <span className="mono" style={{ fontSize: 10 }}>
              4 members
            </span>
            <div className="presence" aria-label="Example participants">
              {Object.entries(people).map(([id, person]) => (
                <span key={id} className="av" style={{ background: person[1] }}>
                  {id}
                </span>
              ))}
            </div>
          </div>
          <DemoConversation key={room} name={room} />
          <a href="#start" className="composer">
            Message #{room}… <span className="k">⏎</span>
          </a>
        </div>
        <aside className="demo-people" aria-label="Example room members">
          <div className="mono">Room people</div>
          {Object.entries(people).map(([id, person]) => (
            <div className="demo-person" key={id}>
              <span className="av" style={{ background: person[1] }}>
                {id}
              </span>
              <div>
                <strong>{person[0]}</strong>
                <small>{id === "MK" ? "Room owner" : "Member"} · online</small>
              </div>
            </div>
          ))}
          <div className="demo-foot">
            A private space for your people.
            <br />
            <a href="#start">Start your own room →</a>
          </div>
        </aside>
      </div>
      <p className="preview-caption">
        Illustrative conversations · Sign in to create your own rooms.
      </p>
    </>
  );
}

export function LandingAccount() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  if (!isLoaded)
    return (
      <div className="landing-account" role="status">
        Loading secure sign in…
      </div>
    );
  if (isSignedIn)
    return (
      <div className="landing-account">
        <span className="mono">YOUR SEAT IS READY</span>
        <h3>Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.</h3>
        <p>Your rooms and conversations are right where you left them.</p>
        <Link to="/workspace" className="btn btn-o">
          Open your workspace <span className="arr">→</span>
        </Link>
      </div>
    );
  return (
    <SignIn
      routing="hash"
      signUpUrl="/sign-up"
      forceRedirectUrl="/workspace"
      appearance={authAppearance}
    />
  );
}

const marqueeWords = [
  "Study groups",
  "Startup teams",
  "Research labs",
  "Hackathon squads",
  "Book clubs",
  "Thesis partners",
  "Design crits",
];
export function LandingMarquee() {
  const [paused, setPaused] = useState(false);
  return (
    <>
      <div
        className="track"
        style={{ animationPlayState: paused ? "paused" : "running" }}
        aria-hidden="true"
      >
        {[...marqueeWords, ...marqueeWords].map((word, i) => (
          <span key={i}>{word}</span>
        ))}
      </div>
      <span className="sr-only">For {marqueeWords.join(", ")}.</span>
      <button
        className="marquee-toggle"
        onClick={() => setPaused((value) => !value)}
        aria-label={paused ? "Play scrolling text" : "Pause scrolling text"}
      >
        {paused ? "▶" : "Ⅱ"}
      </button>
    </>
  );
}

export function ChatStepVisual({ kind }) {
  return (
    <div className={`chat-step-visual step-${kind}`} aria-hidden="true">
      {kind === "rooms" && (
        <>
          <span># launch-plan</span>
          <span># study-group</span>
          <span className="accent">+ Create room</span>
        </>
      )}
      {kind === "invite" && (
        <>
          <small>YOUR INVITATION</small>
          <strong>ROOM42</strong>
          <span className="accent">Approve request ✓</span>
        </>
      )}
      {kind === "chat" && (
        <>
          <span>Ready for the review?</span>
          <span className="accent">Let’s do it 🙌</span>
          <small>Jun is typing…</small>
        </>
      )}
      {kind === "saved" && (
        <>
          <span>3 replies in launch-plan</span>
          <span className="accent">Message saved ✓</span>
          <small>You’re all caught up.</small>
        </>
      )}
    </div>
  );
}
