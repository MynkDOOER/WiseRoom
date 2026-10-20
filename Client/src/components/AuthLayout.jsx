import { Link } from "react-router-dom";
import WiseRoomLogo from "./WiseRoomLogo";

export default function AuthLayout({ children }) {
  return (
    <main className="landing-page auth-entry">
      <div className="grain" aria-hidden="true" />
      <nav className="top" aria-label="Main navigation">
        <Link to="/" className="brand auth-home">
          <WiseRoomLogo />
          WiseRoom.
        </Link>
        <Link to="/#how" className="btn btn-g">
          How it works
        </Link>
      </nav>
      <section className="signin">
        <div className="wrap inner">
          <div>
            <div className="mono" style={{ marginBottom: 24 }}>
              STEP INSIDE
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
                <b>01</b>Sign in securely to your workspace
              </div>
              <div>
                <b>02</b>Create a room and invite your people
              </div>
              <div>
                <b>03</b>Keep every conversation in good company
              </div>
            </div>
          </div>
          <div className="clerk-host" aria-label="Account access">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
