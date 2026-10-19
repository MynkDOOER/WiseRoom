import { useWorkspace } from "../context/workspaceContext";
import RoomsDashboard from "../components/RoomsDashboard";
import Icon from "../components/Icon";
export default function HomePage() {
  const { account, setRoomDialog } = useWorkspace();
  const firstName = account?.displayName?.trim().split(/\s+/)[0];
  return <main className="directory-page">
    <section className="welcome-heading">
      <div className="welcome-copy"><p className="eyebrow">YOUR PEOPLE. YOUR IDEAS. YOUR SPACE.</p><h1>Good ideas need<br/>a little <span>room.</span></h1><p className="welcome-description">{firstName ? `Welcome back, ${firstName}. ` : ""}Pick up a conversation or make space for a new one.</p><div className="button-row"><button className="button primary" onClick={() => setRoomDialog("create")}><Icon name="plus" size={17}/>Create a room</button><button className="button secondary" onClick={() => setRoomDialog("join")}><Icon name="join" size={17}/>Join a room</button></div></div>
      <div className="brand-art" aria-hidden="true"><div className="brand-art-orbit orbit-one"/><div className="brand-art-orbit orbit-two"/><img src="/favicon.svg" alt=""/><span className="brand-art-caption">A shared space.<br/><strong>A clearer mind.</strong></span></div>
    </section>
    <RoomsDashboard/>
    <footer className="directory-footer"><img src="/favicon.svg" width="22" height="22" alt=""/><span>Less noise. More conversation.</span><span className="footer-wordmark">Made for thinking together.</span></footer>
  </main>;
}
