import MemberAvatar from "./MemberAvatar";
import Icon from "./Icon";

export default function RoomContextPanel({
  room,
  members,
  onlineIds,
  onMember,
  onManage,
  onSettings,
}) {
  return (
    <aside className="room-context-panel" aria-label="Room people and details">
      <div className="room-context-heading">
        <span>ROOM PEOPLE</span>
        <span>{members.length}</span>
      </div>
      <div className="context-member-list">
        {members.map((member) => (
          <button
            key={member.id}
            className="context-member"
            onClick={() => onMember(member.id)}
          >
            <MemberAvatar item={member} size={34} />
            <span className="context-member-copy">
              <strong>
                {member.name}
                {member.isYou ? " (you)" : ""}
              </strong>
              <span>
                {member.role === "OWNER" ? "Room owner" : "Member"}
                {onlineIds.includes(member.id) ? " · online" : ""}
              </span>
            </span>
            {member.role === "OWNER" && <Icon name="crown" size={13} />}
          </button>
        ))}
      </div>
      <div className="context-room-note">
        <span className="context-label">YOUR SHARED SPACE</span>
        <h2>{room.name}</h2>
        <p>One room for your people, ideas, and conversations.</p>
        <button className="context-settings" onClick={onSettings}>
          Room settings <Icon name="arrow" size={13} />
        </button>
      </div>
      <button className="context-manage" onClick={onManage}>
        <Icon name="people" size={15} />
        {room.role === "OWNER" ? "Manage members" : "View all members"}
      </button>
    </aside>
  );
}
