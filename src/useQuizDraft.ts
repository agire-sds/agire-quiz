import {useEffect,useRef,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';

export function useQuizDraft<T>(db:SupabaseClient, userId:string, kind:'road'|'poll'|'classic'|'brainstorm', quizId:string|null, value:T, restore:(value:T)=>void){
  const key=`agire-draft:${userId}:${kind}:${quizId||'new'}`;
  const [ready,setReady]=useState(false);
  const [hasDraft,setHasDraft]=useState(false);
  const [status,setStatus]=useState<'local'|'saving'|'saved'|'offline'>('local');
  const historyKey=`${key}:history`;
  const [history,setHistory]=useState<{data:T;updatedAt:string}[]>(()=>{try{return JSON.parse(localStorage.getItem(historyKey)||'[]')}catch{return []}});
  const historyRef=useRef(history);
  historyRef.current=history;
  const current=useRef(value);
  const timerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const cleared=useRef(false);
  const clearedValue=useRef('');
  const restoreRef=useRef(restore);
  current.current=value;
  restoreRef.current=restore;
  useEffect(()=>{
    let active=true;
    cleared.current=false;
    setReady(false);
    const load=async()=>{
      let local:{data:T;updatedAt:string}|null=null;
      try{local=JSON.parse(localStorage.getItem(key)||'null')}catch{}
      const {data}=await db.from('quiz_editor_drafts').select('content,updated_at').eq('owner_id',userId).eq('draft_key',key).maybeSingle();
      if(!active)return;
      const remote=data?{data:data.content as T,updatedAt:data.updated_at as string}:null;
      const chosen=local&&(!remote||Date.parse(local.updatedAt)>Date.parse(remote.updatedAt))?local:remote;
      if(chosen)restoreRef.current(chosen.data);
      setHasDraft(!!chosen);
      setReady(true);
    };
    void load();
    return()=>{active=false};
  },[db,key,userId]);
  useEffect(()=>{try{setHistory(JSON.parse(localStorage.getItem(historyKey)||'[]'))}catch{setHistory([])}},[historyKey]);
  const serialized=JSON.stringify(value);
  useEffect(()=>{
    if(!ready)return;
    if(cleared.current){if(serialized===clearedValue.current)return;cleared.current=false;}
    const updatedAt=new Date().toISOString();
    try{localStorage.setItem(key,JSON.stringify({data:current.current,updatedAt}))}catch{setStatus('offline')}
    setStatus('local');
    const timer=setTimeout(async()=>{
      if(cleared.current)return;
      setStatus('saving');
      const {error}=await db.from('quiz_editor_drafts').upsert({owner_id:userId,draft_key:key,content:current.current,updated_at:updatedAt},{onConflict:'owner_id,draft_key'});
      setStatus(error?'offline':'saved');
    },700);
    timerRef.current=timer;
    return()=>clearTimeout(timer);
  },[db,key,ready,serialized,userId]);
  const saveNow=async()=>{
    if(!ready)return;
    if(timerRef.current)clearTimeout(timerRef.current);
    const snapshot=current.current;
    const updatedAt=new Date().toISOString();
    try{localStorage.setItem(key,JSON.stringify({data:snapshot,updatedAt}))}catch{setStatus('offline')}
    setStatus('saving');
    const {error}=await db.from('quiz_editor_drafts').upsert({owner_id:userId,draft_key:key,content:snapshot,updated_at:updatedAt},{onConflict:'owner_id,draft_key'});
    setStatus(error?'offline':'saved');
  };
  const checkpoint=()=>{
    if(!ready)return;
    const saved={data:structuredClone(current.current),updatedAt:new Date().toISOString()};
    const next=[saved,...historyRef.current].slice(0,10);
    try{localStorage.setItem(historyKey,JSON.stringify(next));setHistory(next)}catch{setStatus('offline')}
    historyRef.current=next;
    void saveNow();
  };
  useEffect(()=>{
    if(!ready||kind==='road')return;
    const timer=setInterval(()=>{
      if(JSON.stringify(current.current)!==JSON.stringify(historyRef.current[0]?.data))checkpoint();
    },30000);
    return()=>clearInterval(timer);
  },[ready,key,kind]);
  const restoreCheckpoint=(position:number)=>{
    const saved=history[position];
    if(saved)restoreRef.current(structuredClone(saved.data));
  };
  const clear=async()=>{
    cleared.current=true;
    clearedValue.current=JSON.stringify(current.current);
    if(timerRef.current)clearTimeout(timerRef.current);
    localStorage.removeItem(key);
    await db.from('quiz_editor_drafts').delete().eq('owner_id',userId).eq('draft_key',key);
  };
  return {ready,hasDraft,status,history,checkpoint,restoreCheckpoint,saveNow,clear};
}
