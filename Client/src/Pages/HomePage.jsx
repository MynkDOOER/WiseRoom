import { useWorkspace } from "../context/workspaceContext";
import RoomsDashboard from "../components/RoomsDashboard";
import Icon from "../components/Icon";
import Button from "../components/ui/Button";
import ForYou from "../components/ForYou";
import InlineJoin from "../components/InlineJoin";
export default function HomePage() {
  const { account, rooms, unreadTotal, unreadByRoom, setRoomDialog }=useWorkspace();
  const firstName=account?.displayName?.trim().split(/\s+/)[0] || "there";
  const now=new Date();
  const hour=Number(new Intl.DateTimeFormat("en",{timeZone:"Asia/Kolkata",hour:"numeric",hour12:false}).format(now));
  const greeting=hour<12 ? "morning" : hour<18 ? "afternoon" : "evening";
  const pending=rooms.filter(room=>room.role==="OWNER" && room.pendingRequestCount>0);
  const unreadRooms=rooms.filter(room=>unreadByRoom?.[room.id]>0).length;
  const total=pending.reduce((sum,room)=>sum+room.pendingRequestCount,0);
  return <main className="directory-page reference-home"><section className="welcome-heading"><p className="eyebrow home-date">{now.toLocaleDateString("en-US",{timeZone:"Asia/Kolkata",weekday:"long",month:"long",day:"numeric"})}</p><h1>Good {greeting}, {firstName}.</h1><p className="welcome-description">{total ? <>You have <strong>{total} join {total===1 ? "request" : "requests"}</strong> waiting for your review.</> : <>You have <strong>{unreadTotal || 0} unread {(unreadTotal || 0) === 1 ? "message" : "messages"}</strong> in <strong>{unreadRooms} {unreadRooms===1 ? "room" : "rooms"}</strong>.</>}</p><div className="home-actions"><Button variant="primary" onClick={()=>setRoomDialog("create")}><Icon name="plus" size={16}/>Create room</Button><InlineJoin/></div></section><div className="home-columns"><RoomsDashboard/><ForYou/></div></main>;
}
