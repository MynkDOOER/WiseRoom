import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

/** A viewport-positioned tooltip escapes avatar/header stacking and clipping. */
export default function MemberTooltip({ anchorRef, id, children }) {
  const tooltipRef = useRef(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const tooltip = tooltipRef.current;
    if (!anchor || !tooltip) return;
    let frame = 0;
    function position() {
      if (!anchor.isConnected) {
        tooltip.style.visibility = "hidden";
        return;
      }
      const box = anchor.getBoundingClientRect();
      const margin = 12;
      const gap = 10;
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      const size = tooltip.getBoundingClientRect();
      const below = box.bottom + gap;
      const preferredTop =
        below + size.height <= height - margin
          ? below
          : box.top - size.height - gap;
      tooltip.style.left = `${Math.max(margin, Math.min(box.right - size.width, width - size.width - margin))}px`;
      tooltip.style.top = `${Math.max(margin, Math.min(preferredTop, height - size.height - margin))}px`;
      tooltip.style.visibility = "visible";
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(position);
    }
    position();
    const observer = new ResizeObserver(schedule);
    observer.observe(anchor);
    observer.observe(tooltip);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    anchor.addEventListener("transitionend", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      anchor.removeEventListener("transitionend", schedule);
    };
  }, [anchorRef, id]);

  return createPortal(
    <span
      ref={tooltipRef}
      className="elastic-tooltip member-tooltip-overlay"
      role="tooltip"
      id={id}
    >
      {children}
    </span>,
    document.body,
  );
}
