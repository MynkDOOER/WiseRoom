import { useId, useRef, useState } from "react";
import MemberAvatar from "./MemberAvatar";
import MemberTooltip from "./MemberTooltip";

// Adapted from VengeanceUI's ElasticStack for React/JS and WiseRoom's real members.
// https://www.vengenceui.com/components/elastic-stack
export default function ElasticStack({
  items,
  itemSize = 34,
  overlap = 13,
  pushForce = 9,
  maxVisible = 3,
  onSelect,
  onMore,
  selectedId,
  expanded = false,
  showTooltips = true,
  label = "Room members",
  className = "",
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const root = useRef(null);
  const activeAnchor = useRef(null);
  const tooltipId = useId();
  const visible = items.slice(0, Math.max(1, maxVisible));
  const remaining = items.length - visible.length;
  const entries =
    remaining > 0 ? [...visible, { id: "overflow", remaining }] : visible;
  const total = entries.length;

  return (
    <div
      ref={root}
      className={`elastic-stack ${className}`}
      role="group"
      aria-label={label}
      onPointerLeave={() => {
        if (!root.current?.contains(document.activeElement))
          setHoveredIndex(null);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setHoveredIndex(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && hoveredIndex !== null && showTooltips) {
          event.preventDefault();
          event.stopPropagation();
          setHoveredIndex(null);
        }
      }}
    >
      {entries.map((item, index) => {
        const active = hoveredIndex === index;
        let translateX = 0;
        if (hoveredIndex !== null) {
          if (index > hoveredIndex)
            translateX = Math.max(
              Math.min(pushForce * (total - index - 1), overlap),
              overlap - pushForce * (index - hoveredIndex - 1),
            );
          else if (index < hoveredIndex)
            translateX = -Math.min(pushForce * index, overlap);
        }
        const tooltip = item.remaining
          ? `View all ${items.length} members`
          : `${item.name}${item.isYou ? " (you)" : ""}`;
        return (
          <button
            type="button"
            key={item.id}
            className={`elastic-item ${active ? "elastic-hovered" : ""} ${selectedId === item.id ? "elastic-selected" : ""}`}
            aria-label={
              item.remaining
                ? tooltip
                : `View ${tooltip}, ${item.role === "OWNER" ? "room owner" : "member"}`
            }
            aria-haspopup={expanded ? undefined : "dialog"}
            aria-pressed={expanded ? selectedId === item.id : undefined}
            aria-describedby={
              active && showTooltips ? `${tooltipId}-${index}` : undefined
            }
            onPointerEnter={(event) => {
              if (event.pointerType !== "touch") {
                activeAnchor.current = event.currentTarget;
                setHoveredIndex(index);
              }
            }}
            onFocus={(event) => {
              activeAnchor.current = event.currentTarget;
              setHoveredIndex(index);
            }}
            onClick={() => {
              setHoveredIndex(null);
              if (item.remaining) onMore?.();
              else onSelect?.(item.id);
            }}
            style={{
              width: itemSize,
              height: itemSize,
              marginLeft: index === 0 ? 0 : -overlap,
              transform: `translateX(${translateX}px) scale(${active ? 1.2 : 1})`,
              zIndex: active ? 100 : index,
              "--elastic-delay": active ? "150ms" : "0ms",
            }}
          >
            {item.remaining ? (
              <span className="elastic-overflow">+{item.remaining}</span>
            ) : (
              <MemberAvatar
                key={`${item.id}:${item.image || "initials"}`}
                item={item}
                size={itemSize - 4}
              />
            )}
            {active && showTooltips && (
              <MemberTooltip
                anchorRef={activeAnchor}
                id={`${tooltipId}-${index}`}
              >
                <strong>{tooltip}</strong>
                {!item.remaining && (
                  <span>{item.role === "OWNER" ? "Room owner" : "Member"}</span>
                )}
              </MemberTooltip>
            )}
          </button>
        );
      })}
      {items.length === 0 && (
        <button className="text-button" onClick={onMore}>
          Members
        </button>
      )}
    </div>
  );
}
