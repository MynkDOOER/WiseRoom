import { useEffect, useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import ElasticStack from "./ElasticStack";
import MemberAvatar from "./MemberAvatar";

function getPosition(box) {
  const width = Math.min(328, window.innerWidth - 24);
  const top = Math.max(12, Math.min((box?.bottom || 60) + 10, window.innerHeight - 240));
  return {
    '--members-left': `${Math.max(12, Math.min((box?.right || window.innerWidth - 12) - width, window.innerWidth - width - 12))}px`,
    '--members-top': `${top}px`, '--members-height': `${Math.max(200, window.innerHeight - top - 12)}px`,
  };
}

export default function MembersPopover({ room, members, items, anchorRef, anchorBox, selectedId, onSelect,
  onClose, busy, onRefresh, inviteToken, copied, onInvite, onCopy, onLeave, onManage, error }) {
  const [position, setPosition] = useState(() => getPosition(anchorBox));
  const [query, setQuery] = useState("");
  useEffect(() => {
    const update = () => setPosition(getPosition(anchorRef.current?.getBoundingClientRect()));
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [anchorRef]);
  const visible = members.filter(member => (member.user.displayName || "Unnamed member").toLowerCase().includes(query.trim().toLowerCase()));
  const choose = id => { setQuery(""); onSelect(id); };

  return <Modal title={`Members · ${members.length}`} className="members-popover" style={position} onClose={onClose} busy={Boolean(busy)}
    headingActions={<button className="icon-button" title="Refresh members" aria-label="Refresh members" onClick={onRefresh} disabled={Boolean(busy)}><Icon name="refresh" size={15}/></button>}>
    <p className="members-room-caption"><Icon name="lock" size={11}/><span>{room.name}</span><span className="badge">{room.role === "OWNER" ? "Owner" : "Member"}</span></p>
    <div className="members-stack-preview"><ElasticStack items={items} itemSize={42} overlap={15} pushForce={10} maxVisible={6} selectedId={selectedId} onSelect={choose} onMore={() => document.getElementById("member-search")?.focus()} expanded showTooltips={false} label="Choose a member"/></div>
    {members.length > 5 && <label className="search-field member-search"><Icon name="search" size={14}/><span className="sr-only">Search members</span><input id="member-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a member…"/></label>}
    <ul className="compact-member-list" aria-label="Member details">
      {visible.map(member => {
        const item = items.find(entry => entry.id === member.userId);
        const selected = member.userId === selectedId;
        return <li key={member.userId} className={selected ? "member-row-selected" : ""}>
          <button className="member-row-button" onClick={() => onSelect(selected ? null : member.userId)} aria-expanded={selected}>
            <MemberAvatar key={`${item.id}:${item.image || "initials"}`} item={item} size={31}/>
            <span className="compact-member-name"><strong>{item.name}{item.isYou && <span> (you)</span>}</strong><span>{member.role === "OWNER" ? "Room owner" : "Member"}</span></span>
            {member.role === "OWNER" && <Icon className="member-owner-icon" name="crown" size={13}/>}
            <Icon name="chevron" className={selected ? "member-chevron-open" : ""} size={13}/>
          </button>
          {selected && <div className="member-joined-detail"><span>Joined this room</span><time dateTime={member.joinedAt}>{new Date(member.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time></div>}
        </li>;
      })}
      {visible.length === 0 && <li className="member-empty">No matching members.</li>}
    </ul>
    <div className="compact-member-actions">
      {room.role === "OWNER" ? <>
        <button className="button secondary full-width manage-people-action" onClick={onManage} disabled={Boolean(busy)}><Icon name="people" size={15}/>Manage people{room.pendingRequestCount > 0 ? ` · ${room.pendingRequestCount} pending` : ""}</button>
        {inviteToken && <div className="compact-invite"><label htmlFor="room-invite">Invitation link</label><input id="room-invite" className="token-input" readOnly value={inviteToken} onFocus={event => event.target.select()}/><p>New members need your approval.</p></div>}
        <button className="button secondary full-width" onClick={inviteToken ? onCopy : onInvite} disabled={Boolean(busy)}><Icon name={copied ? "check" : inviteToken ? "copy" : "plus"} size={15}/>{busy === "invite" ? "Loading invitation…" : copied ? "Copied!" : inviteToken ? "Copy invitation link" : "Invite people"}</button>
      </> : <button className="button danger-outline full-width" onClick={onLeave} disabled={Boolean(busy)}><Icon name="logout" size={15}/>Leave room</button>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  </Modal>;
}
