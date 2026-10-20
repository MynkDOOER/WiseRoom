import {useCallback,useEffect,useState} from "react";
import {useAuth} from "@clerk/clerk-react";
import {useNavigate} from "react-router-dom";
import {getActivity,markAllRead,notifyActivity} from "../api/collaboration";
import MessageItem from "../components/MessageItem";
import Icon from "../components/Icon";
const titles={inbox:["Inbox","Unread messages across your rooms."],threads:["Threads","Focused conversations from your rooms."],saved:["Saved","Messages you want to come back to."]};
export default function ActivityPage({kind}) {
  const {getToken}=useAuth();const navigate=useNavigate();
  const [data,setData]=useState(null),[error,setError]=useState(""),[attempt,setAttempt]=useState(0),[busy,setBusy]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();let pending=false;
    async function load(){if(pending)return;pending=true;try{const page=await getActivity(await getToken(),kind,null,controller.signal);if(!controller.signal.aborted){setData(page);setError("");}}catch(cause){if(!controller.signal.aborted)setError(cause.message);}finally{pending=false;}}
    load();const timer=setInterval(()=>{if(!document.hidden)load();},15000);
    return()=>{controller.abort();clearInterval(timer);};
  },[kind,attempt,getToken]);
  const updated=useCallback(message=>setData(current=>current?{...current,messages:current.messages.map(row=>row.id===message.id?{...row,...message}:row).filter(row=>kind!=="saved"||row.savedBy?.length)}:current),[kind]);
  async function readAll(){setBusy(true);try{await markAllRead(await getToken());notifyActivity();setAttempt(value=>value+1);}catch(cause){setError(cause.message);}finally{setBusy(false);}}
  async function more(){if(busy||!data?.pagination.hasMore)return;setBusy(true);try{const page=await getActivity(await getToken(),kind,data.pagination.nextCursor);setData(current=>({...page,messages:[...current.messages,...page.messages.filter(row=>!current.messages.some(item=>item.id===row.id))]}));}catch(cause){setError(cause.message);}finally{setBusy(false);}}
  return <main className="activity-page"><header><div><p className="eyebrow">YOUR WORKSPACE</p><h1>{titles[kind][0]}</h1><p>{titles[kind][1]}</p></div><div className="activity-header-actions"><button className="icon-button" onClick={()=>setAttempt(value=>value+1)} aria-label={`Refresh ${titles[kind][0]}`}><Icon name="refresh" size={16}/></button>{kind==="inbox"&&Boolean(data?.messages.length)&&<button className="button" disabled={busy} onClick={readAll}>Mark all read</button>}</div></header>{error&&<p className="form-error" role="alert">{error}</p>}{!data&&!error&&<p className="muted" role="status">Loading…</p>}{data?.messages.length===0&&<div className="activity-page-empty"><Icon name={kind==="saved"?"bookmark":kind==="threads"?"chat":"inbox"} size={28}/><h2>{kind==="saved"?"Keep something worth returning to.":kind==="threads"?"A little focus goes a long way.":"You’re all caught up."}</h2><p>{kind==="saved"?"Save a message from its actions menu.":kind==="threads"?"Use Reply in thread on any message to start a focused conversation.":"New messages from your rooms will appear here."}</p></div>}{data&&<div className="activity-feed">{data.messages.map(message=><div className="activity-message" key={message.id}><button className="activity-room-link" onClick={()=>navigate(`/rooms/${message.roomId}?thread=${message.parentId||message.id}`)}>{message.room.name}<Icon name="arrow" size={12}/></button><MessageItem message={message} onUpdated={updated} onThread={id=>navigate(`/rooms/${message.roomId}?thread=${id}`)}/></div>)}{data.pagination.hasMore&&<button className="button" disabled={busy} onClick={more}>{busy?"Loading…":"Load more"}</button>}</div>}</main>;
}
