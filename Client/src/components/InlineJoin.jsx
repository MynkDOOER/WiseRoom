import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseInvitation } from "../api/invites";
import Icon from "./Icon";
export default function InlineJoin() {
  const [value,setValue]=useState(""); const [error,setError]=useState(""); const navigate=useNavigate();
  return <div className="inline-join-wrap"><form className="inline-join" onSubmit={event=>{event.preventDefault();try{navigate(`/join/${parseInvitation(value)}`);}catch(cause){setError(cause.message);}}}><Icon name="link" size={15}/><label className="sr-only" htmlFor="home-invitation">Invitation link or code</label><input id="home-invitation" placeholder="Paste invite link or code" value={value} onChange={event=>{setValue(event.target.value);setError("");}} maxLength={500}/><button type="submit" disabled={!value.trim()}>Join <Icon name="arrow" size={14}/></button></form>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
