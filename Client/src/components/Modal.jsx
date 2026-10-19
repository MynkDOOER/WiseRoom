import { useEffect, useRef } from "react";
import Icon from "./Icon";
// Native dialogs contain keyboard focus and return it to the opener on close.
export default function Modal({ title, children, onClose, busy = false, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    dialog.showModal();
    dialog.querySelector('[data-dialog-autofocus]')?.focus();
    return () => { dialog.close(); if (opener?.isConnected) opener.focus(); };
  }, []);
  return <dialog ref={ref} className={`modal ${className}`} aria-labelledby="dialog-title"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="modal-content">
      <div className="modal-heading"><h2 id="dialog-title">{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose} disabled={busy}><Icon name="close"/></button></div>
      {children}
    </div>
  </dialog>;
}
