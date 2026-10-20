import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { loadVoiceMessage } from "../api/messages";
import Icon from "./Icon";
const clock = value => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2,"0")}`;
export default function VoiceMessage({ message, roomId }) {
  const { getToken } = useAuth();
  const audio = useRef(null);
  const request = useRef(null);
  const objectUrl = useRef(null);
  const context = useRef(null);
  const [ready,setReady]=useState(false);
  const [status, setStatus] = useState("idle");
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(message.voiceDurationMs / 1000 || 1);
  const [bars, setBars] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => () => {
    request.current?.abort();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    context.current?.close().catch(() => {});
  }, []);
  async function play() {
    if (status === "loading") return;
    setError("");
    if (status === "playing") { audio.current.pause(); return; }
    if (objectUrl.current) {
      try { await audio.current.play(); } catch { setError("Playback was blocked. Try playing again."); }
      return;
    }
    const controller = new AbortController(); request.current = controller;
    setStatus("loading");
    try {
      const token = await getToken();
      if (controller.signal.aborted) return;
      const blob = await loadVoiceMessage(token, roomId, message.id, controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob); objectUrl.current = url;
      audio.current.src = url; setReady(true);
      await audio.current.play();
      // Decode the actual recording for its waveform. No simulated speech is shown.
      const Context = window.AudioContext || window.webkitAudioContext;
      if (Context) {
        try {
          const ctx = new Context(); context.current = ctx;
          const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
          if (controller.signal.aborted) return;
          const data = decoded.getChannelData(0);
          const step = Math.max(1,Math.floor(data.length / 44));
          const levels = Array.from({ length:44 }, (_, i) => {
            let sum=0,count=0;
            for(let j=i*step;j<Math.min(data.length,(i+1)*step);j+=Math.max(1,Math.floor(step/120))) { sum+=data[j]*data[j]; count++; }
            return Math.sqrt(sum/Math.max(1,count));
          });
          const peak=Math.max(...levels,.001);
          setBars(levels.map(value=>4+value/peak*22)); setDuration(decoded.duration);
          await ctx.close(); context.current=null;
        } catch { /* The native player may support a codec the Web Audio decoder does not. */ }
      }
    } catch (cause) {
      if (!controller.signal.aborted) { setStatus("idle"); setError(cause.message || "Couldn’t load this recording."); }
    }
  }
  const progress = Math.min(100,position / duration * 100);
  return <div className="voice-note-wrap"><div className="voice-note">
    <button type="button" className="voice-play" aria-label={status === "playing" ? "Pause voice message" : "Play voice message"} disabled={status === "loading"} onClick={play}><Icon name={status === "playing" ? "pause" : status === "loading" ? "refresh" : "play"} size={17}/></button>
    <div className={`audio-waveform ${bars ? "decoded" : "not-loaded"}`} aria-hidden="true">{(bars || Array(44).fill(4)).map((height,index)=><i key={index} className={index/44*100<=progress ? "played" : ""} style={{height}}/>)}</div>
    <input type="range" className="voice-seek" min="0" max={duration} step="0.1" value={Math.min(position,duration)} disabled={!ready} aria-label="Seek voice message" onChange={event=>{ const time=Number(event.target.value); audio.current.currentTime=time; setPosition(time); }}/>
    <time>{clock(position > 0 ? position : duration)}</time>
    <audio ref={audio} preload="none" onPlay={()=>setStatus("playing")} onPause={()=>setStatus("paused")} onEnded={()=>{setStatus("paused");setPosition(0);}} onTimeUpdate={event=>setPosition(event.currentTarget.currentTime)} onError={()=>{setStatus("idle");setError("Your browser couldn’t play this audio format.");}}/>
  </div>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
