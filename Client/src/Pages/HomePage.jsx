import { useWorkspace } from "../context/workspaceContext";
import RoomsDashboard from "../components/RoomsDashboard";
import Icon from "../components/Icon";
import Button from "../components/ui/Button";
import MyJoinRequests from "../components/MyJoinRequests";
export default function HomePage() {
  const { account, setRoomDialog } = useWorkspace();
  const firstName = account?.displayName?.trim().split(/\s+/)[0];
  return <main className="directory-page"><section className="welcome-heading"><p className="eyebrow">YOUR WORKSPACE</p><h1>{firstName ? `Welcome back, ${firstName}.` : "Your conversations start here."}</h1><p className="welcome-description">Open a room, catch up, or start something together.</p><div className="button-row"><Button variant="primary" onClick={() => setRoomDialog("create")}><Icon name="plus"/>Create a room</Button><Button onClick={() => setRoomDialog("join")}><Icon name="join"/>Join a room</Button></div></section><RoomsDashboard/><MyJoinRequests/></main>;
}
