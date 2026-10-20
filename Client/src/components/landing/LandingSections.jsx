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
      text: <>Okay who remembers what we decided for student pricing? 😅</>,
    },
    {
      user: "JL",
      text: (
        <>
          It was in the brief somewhere… <span className="at">@wise</span> can
          you check?
        </>
      ),
    },
    {
      ai: true,
      docs: [1, 2],
      text: (
        <>
          Student pricing was set at <b>₹199/month</b>{" "}
          <sup className="cite">1</sup>, about 40% below the standard plan,
          based on the survey showing most students cap spend under ₹250{" "}
          <sup className="cite">2</sup>.
        </>
      ),
      sources: ["Q3 Launch Brief · p.12", "Pricing research · p.3"],
    },
    { user: "SN", text: <>Perfect, adding that to the landing copy now 🙌</> },
  ],
  research: [
    { user: "SN", text: <>How many beta signups came from colleges?</> },
    {
      ai: true,
      docs: [3],
      text: (
        <>
          <b>812 of 1,240</b> signups used a college email domain — roughly 65%{" "}
          <sup className="cite">1</sup>.
        </>
      ),
      sources: ["beta-signups.csv · rows 1–1240"],
    },
    { user: "MK", text: <>That’s way more than I expected</> },
  ],
  "thesis-group": [
    {
      user: "MK",
      text: (
        <>
          <span className="at">@wise</span> what did we assign for chapter 3?
        </>
      ),
    },
    {
      ai: true,
      docs: [4],
      text: (
        <>
          Arya owns the literature review, Jun drafts the methodology, and the
          first draft is due <b>Nov 4</b> <sup className="cite">1</sup>.
        </>
      ),
      sources: ["Meeting notes — Sep 30"],
    },
  ],
  "design-crit": [
    { user: "JL", text: <>Homepage v2 is up, roast it 🔥</> },
    { user: "AR", text: <>The hero finally feels alive. Type is 🔥</> },
    { user: "SN", text: <>Ship it.</> },
  ],
};
const documents = [
  ["PDF", "Q3 Launch Brief.pdf", "24 pages · indexed"],
  ["DOC", "Pricing research notes", "8 pages · indexed"],
  ["CSV", "beta-signups.csv", "1,240 rows · indexed"],
  ["MD", "Meeting notes — Sep 30", "3 pages · indexed"],
];

function DemoConversation({ name, onSource }) {
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
      {messages.slice(0, visible).map((message, index) => {
        const person = message.ai ? ["Wise", "#ff5a1f"] : people[message.user];
        return (
          <div className={`m in ${message.ai ? "ai" : ""}`} key={index}>
            <span className="av" style={{ background: person[1] }}>
              {message.ai ? "W" : message.user}
            </span>
            <div className="body">
              <div className="who">
                {person[0]} <time>just now</time>
              </div>
              <div className={message.ai ? "bubble" : undefined}>
                <div className="txt">{message.text}</div>
                {message.sources && (
                  <div className="srcs">
                    {message.sources.map((source, i) => (
                      <button
                        key={source}
                        className="src"
                        onClick={() => onSource(message.docs[i])}
                        title={`Highlight ${source}`}
                      >
                        <i>[{i + 1}]</i>
                        {source}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LandingDemo() {
  const [room, setRoom] = useState("launch-plan");
  const [source, setSource] = useState(null);
  const highlighted = source
    ? [source]
    : scripts[room].find((message) => message.ai)?.docs || [];
  return (
    <>
      <div
        className="demo fade-in"
        style={{ animationDelay: "1s" }}
        aria-label="Interactive product preview"
      >
        <aside className="side" aria-label="Preview rooms">
          <div className="mono">Rooms</div>
          {Object.keys(scripts).map((name, index) => (
            <button
              type="button"
              key={name}
              className={`room ${room === name ? "on" : index === 1 ? "unread" : ""}`}
              aria-pressed={room === name}
              onClick={() => {
                setRoom(name);
                setSource(null);
              }}
            >
              <span className="hash">#</span>
              {name}
              <span className="dot" />
            </button>
          ))}
          <div className="you">
            <span className="av" style={{ background: "#fbefe2" }}>
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
              4 docs indexed
            </span>
            <div className="presence" aria-label="Example participants">
              {["AR", "JL", "SN"].map((id) => (
                <span
                  key={id}
                  className="av"
                  style={{ background: people[id][1] }}
                >
                  {id}
                </span>
              ))}
              <span
                className="av"
                style={{ background: "#ff5a1f", borderRadius: 8 }}
              >
                W
              </span>
            </div>
          </div>
          <DemoConversation key={room} name={room} onSource={setSource} />
          <a href="#start" className="composer">
            <span style={{ color: "var(--orange)", fontFamily: "var(--mono)" }}>
              @wise
            </span>
            ask anything about this room’s docs… <span className="k">⏎</span>
          </a>
        </div>
        <aside className="docs" aria-label="Example room knowledge">
          <div className="mono" style={{ padding: "0 2px 6px" }}>
            Room knowledge
          </div>
          {documents.map(([type, name, detail], index) => (
            <div
              key={name}
              className={`doc ${highlighted.includes(index + 1) ? "hit" : ""}`}
            >
              <div className="ic">
                <b>{type}</b>
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="n">{name}</div>
                <div className="s">{detail}</div>
              </div>
            </div>
          ))}
          <div className="drop">Drop files to teach this room</div>
        </aside>
      </div>
      <p className="preview-caption">
        Interactive preview · AI document answers are coming to WiseRoom.
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

export function ChunkVisualization() {
  return (
    <div className="viz v2" aria-hidden="true">
      {Array.from({ length: 30 }, (_, i) => (
        <i
          key={i}
          className="k"
          style={{
            "--d": `${0.5 + i * 0.03}s`,
            gridColumn: i % 7 === 3 ? "span 2" : undefined,
          }}
        />
      ))}
    </div>
  );
}
const points = [
  [12, 20],
  [24, 70],
  [38, 30],
  [46, 58],
  [58, 36],
  [62, 22],
  [70, 64],
  [82, 30],
  [88, 74],
  [30, 48],
  [52, 80],
  [76, 48],
  [18, 86],
  [92, 12],
  [44, 14],
];
export function RetrievalVisualization() {
  return (
    <div className="viz v3" aria-hidden="true">
      <div className="ring" />
      <div className="q" />
      {points.map(([x, y], i) => (
        <span
          key={i}
          className={`pt ${Math.hypot(x - 52, (y - 42) * 0.6) < 16 ? "nn" : ""}`}
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}
    </div>
  );
}
