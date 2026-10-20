import { useEffect, useRef, useState } from "react";

const MAX_MS = 120000;
const MAX_BYTES = 5 * 1024 * 1024;
const release = session => {
  clearTimeout(session.timer);
  cancelAnimationFrame(session.frame);
  session.stream?.getTracks().forEach(track => track.stop());
  session.context?.close().catch(() => {});
};

export default function useVoiceRecorder() {
  const current = useRef(null);
  const [state, setState] = useState({ status: "idle", elapsed: 0, bars: [] });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  function stop(discard = false) {
    const session = current.current;
    if (!session) return;
    session.discard ||= discard;
    session.ended = true;
    clearTimeout(session.timer);
    if (session.recorder?.state === "recording") {
      session.duration = Math.min(MAX_MS, Math.round(performance.now() - session.started));
      session.recorder.stop();
      setState(value => ({ ...value, status: "stopping" }));
    } else {
      current.current = null;
      release(session);
      setState({ status: "idle", elapsed: 0, bars: [] });
    }
    session.stream?.getTracks().forEach(track => track.stop());
  }

  async function start() {
    if (current.current || preview) return;
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Voice recording needs a supported browser on HTTPS or localhost."); return;
    }
    const session = { chunks: [], bytes: 0, discard: false, ended: false };
    current.current = session;
    setState({ status: "requesting", elapsed: 0, bars: [] });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (current.current !== session || session.ended) { stream.getTracks().forEach(track => track.stop()); return; }
      session.stream = stream;
      const mimeType = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error("This browser cannot record a supported audio format.");
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 });
      session.recorder = recorder;
      recorder.ondataavailable = event => {
        if (event.data.size) { session.chunks.push(event.data); session.bytes += event.data.size; }
        if (session.bytes > MAX_BYTES) { setError("Recording exceeded 5 MB. Try a shorter message."); stop(true); }
      };
      recorder.onerror = () => { setError("Recording interrupted. Please try again."); stop(true); };
      recorder.onstop = () => {
        release(session);
        if (current.current !== session) return;
        current.current = null;
        setState({ status: "idle", elapsed: 0, bars: [] });
        if (session.discard) return;
        const blob = new Blob(session.chunks, { type: recorder.mimeType });
        if (!blob.size || session.duration < 300) { setError("That was a little short. Record at least a moment of audio."); return; }
        setPreview({ blob, url: URL.createObjectURL(blob), duration: session.duration });
      };
      // One microphone stream feeds both recording and the real waveform.
      const Context = window.AudioContext || window.webkitAudioContext;
      if (Context) {
        try {
          session.context = new Context();
          await session.context.resume();
          if (current.current !== session || session.ended) { release(session); return; }
          session.analyser = session.context.createAnalyser(); session.analyser.fftSize = 256;
          session.context.createMediaStreamSource(stream).connect(session.analyser);
          session.samples = new Uint8Array(session.analyser.frequencyBinCount);
        } catch { /* Recording still works if audio visualization is unavailable. */ }
      }
      if (current.current !== session || session.ended) { release(session); return; }
      session.started = performance.now();
      recorder.start(250);
      const tick = () => {
        if (current.current !== session || session.ended) return;
        session.analyser?.getByteFrequencyData(session.samples);
        const bars = session.samples ? Array.from({ length: 12 }, (_, i) => Math.max(3, Math.min(24, session.samples[i * 4 + 1] / 9))) : [];
        setState({ status: "recording", elapsed: performance.now() - session.started, bars });
        session.frame = requestAnimationFrame(tick);
      };
      tick(); session.timer = setTimeout(() => stop(), MAX_MS);
    } catch (cause) {
      release(session);
      if (current.current !== session) return;
      current.current = null;
      setState({ status: "idle", elapsed: 0, bars: [] });
      setError(cause.name === "NotAllowedError" ? "Microphone access was denied. Allow it in your browser settings to record." : cause.name === "NotFoundError" ? "No microphone was found." : "Couldn’t start recording. Check your microphone and try again.");
    }
  }

  function discard() { setPreview(null); }
  useEffect(() => {
    const url = preview?.url;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [preview]);
  useEffect(() => {
    const cancel = () => {
      const session = current.current;
      if (!session) return;
      session.discard = true; session.ended = true;
      if (session.recorder?.state === "recording") session.recorder.stop();
      release(session); current.current = null;
      setState({ status: "idle", elapsed: 0, bars: [] });
    };
    const visibility = () => { if (document.hidden) cancel(); };
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", cancel); document.removeEventListener("visibilitychange", visibility);
      const session = current.current;
      current.current = null;
      if (session) { session.discard = true; session.ended = true; if (session.recorder?.state === "recording") session.recorder.stop(); release(session); }
    };
  }, []);
  return { ...state, preview, error, start, stop, discard };
}

