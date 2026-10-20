import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { uploadRoomAvatar } from "../api/rooms";
import Modal from "./Modal";
import Button from "./ui/Button";
import Icon from "./Icon";

const clamp = (value) => Math.max(-1, Math.min(1, value));
export default function RoomAvatarCropDialog({ roomId, onClose, onSaved }) {
  const { getToken } = useAuth();
  const [source, setSource] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState(280);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const viewport = useRef(null);
  const image = useRef(null);
  const drag = useRef(null);
  useEffect(() => {
    if (!source) return;
    return () => URL.revokeObjectURL(source);
  }, [source]);
  useEffect(() => {
    const node = viewport.current;
    const observer = new ResizeObserver((entries) =>
      setSize(entries[0].contentRect.width),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const scale = dimensions
    ? Math.max(size / dimensions.width, size / dimensions.height) * zoom
    : 1;
  const width = dimensions ? dimensions.width * scale : size;
  const height = dimensions ? dimensions.height * scale : size;
  const offset = {
    x: (pan.x * Math.max(0, width - size)) / 2,
    y: (pan.y * Math.max(0, height - size)) / 2,
  };
  function choose(event) {
    const file = event.target.files[0];
    if (!file) return;
    setError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Choose a JPEG, PNG, or WebP image up to 5 MB.");
      event.target.value = "";
      return;
    }
    setDimensions(null);
    setSource(URL.createObjectURL(file));
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }
  async function save() {
    if (!dimensions || busy) return;
    setBusy(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 512;
      const context = canvas.getContext("2d");
      const sourceSize = size / scale;
      const sx = Math.max(
        0,
        Math.min(
          dimensions.width - sourceSize,
          (dimensions.width - sourceSize) / 2 - offset.x / scale,
        ),
      );
      const sy = Math.max(
        0,
        Math.min(
          dimensions.height - sourceSize,
          (dimensions.height - sourceSize) / 2 - offset.y / scale,
        ),
      );
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, 512, 512);
      context.drawImage(
        image.current,
        sx,
        sy,
        sourceSize,
        sourceSize,
        0,
        0,
        512,
        512,
      );
      const blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          (result) =>
            result
              ? resolve(result)
              : reject(new Error("Couldn’t crop this image.")),
          "image/jpeg",
          0.9,
        ),
      );
      await uploadRoomAvatar(await getToken(), roomId, blob);
      await onSaved();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Room picture"
      onClose={onClose}
      busy={busy}
      className="avatar-crop-modal"
    >
      <p className="muted">
        Choose a picture, then drag or use the arrows to frame it.
      </p>
      <label className="crop-file">
        Image file
        <input
          data-dialog-autofocus=""
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={choose}
          disabled={busy}
        />
      </label>
      <div
        className={`avatar-crop-viewport ${dimensions ? "has-image" : ""}`}
        ref={viewport}
        aria-label="Square picture crop preview"
        onPointerDown={(event) => {
          if (!dimensions || busy) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, pan };
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          setPan({
            x:
              width > size
                ? clamp(
                    drag.current.pan.x +
                      (2 * (event.clientX - drag.current.x)) / (width - size),
                  )
                : 0,
            y:
              height > size
                ? clamp(
                    drag.current.pan.y +
                      (2 * (event.clientY - drag.current.y)) / (height - size),
                  )
                : 0,
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {source ? (
          <img
            ref={image}
            src={source}
            alt="Picture being cropped"
            draggable="false"
            onError={() => {
              setError("This image couldn’t be opened.");
              setDimensions(null);
            }}
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              if (naturalWidth * naturalHeight > 20000000) {
                setError("Use an image smaller than 20 megapixels.");
                setSource(null);
                setDimensions(null);
                return;
              }
              setDimensions({ width: naturalWidth, height: naturalHeight });
            }}
            style={{
              width,
              height,
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
            }}
          />
        ) : (
          <span>Choose an image to preview</span>
        )}
        {dimensions && <span className="crop-grid" aria-hidden="true" />}
      </div>
      <label className="crop-zoom">
        Zoom <span>{Math.round(zoom * 100)}%</span>
        <input
          aria-label="Picture zoom"
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={zoom}
          disabled={!dimensions || busy}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
      </label>
      <div className="crop-pan" role="group" aria-label="Reposition picture">
        {[
          ["left", -0.1, 0],
          ["up", 0, -0.1],
          ["down", 0, 0.1],
          ["right", 0.1, 0],
        ].map(([direction, x, y]) => (
          <button
            key={direction}
            type="button"
            className="icon-button"
            aria-label={`Move picture ${direction}`}
            disabled={!dimensions || busy}
            onClick={() =>
              setPan((current) => ({
                x: clamp(current.x + x),
                y: clamp(current.y + y),
              }))
            }
          >
            <Icon name="arrow" className={`pan-${direction}`} />
          </button>
        ))}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="dialog-footer">
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save} disabled={!dimensions || busy}>
          {busy ? "Saving…" : "Save picture"}
        </Button>
      </div>
    </Modal>
  );
}
