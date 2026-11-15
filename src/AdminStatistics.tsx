import {useEffect,useState} from 'react';
import type {Session} from '@supabase/supabase-js';

type Login={userId:string;email:string;name:string;at:string};
type Usage={kind:string;title:string;starts:number;players:number;lastAt:string};
type Stats={logins:Login[];usage:Usage[];totalSessions:number;totalPlayers:number};
const labels:Record<string,string>={classic:'Classique',road:'Code de la route',poll:'Sondage',brainstorm:'Brainstorming'};
const date=(value:string)=>new Date(value).toLocaleString('fr-FR');

export default function AdminStatistics({session,onError,url,keyValue}:{session:Session;onError:(message:string)=>void;url:string;keyValue:string}){
  const[data,setData]=useState<Stats|null>(null),[loading,setLoading]=useState(false);
  const load=async()=>{setLoading(true);try{const response=await fetch(url+'/functions/v1/admin-api',{method:'POST',headers:{'Content-Type':'application/json',apikey:keyValue,Authorization:'Bearer '+session.access_token},body:JSON.stringify({action:'statistics'})});const result=await response.json();if(!response.ok||result.error)throw Error(result.error||'Statistiques indisponibles');setData(result)}catch(error){onError(String(error))}finally{setLoading(false)}};
  useEffect(()=>{void load()},[session.user.id]);
  return <section className="panel"><div className="actions"><h2>Statistiques</h2><button disabled={loading} onClick={()=>void load()}>{loading?'Actualisation…':'Actualiser'}</button></div>{data&&<><p>{data.totalSessions} parties lancées · {data.totalPlayers} participations</p><h3>Quiz utilisés</h3>{data.usage.length?<div className="user-list">{data.usage.map((item,i)=><div key={item.kind+item.title+i}><span><strong>{item.title}</strong> · {labels[item.kind]||item.kind}</span><span>{item.starts} partie(s) · {item.players} participation(s) · dernière utilisation {date(item.lastAt)}</span></div>)}</div>:<p>Aucune partie lancée.</p>}<h3>Connexions des animateurs</h3>{data.logins.length?<div className="user-list">{data.logins.map((item,i)=><div key={i}><span>{item.name||item.email||item.userId}</span><span>{date(item.at)}</span></div>)}</div>:<p>Aucune connexion enregistrée depuis l’activation du suivi.</p>}</>}</section>;
}
