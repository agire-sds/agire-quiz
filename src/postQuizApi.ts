import type {Session,SupabaseClient} from '@supabase/supabase-js';

export async function postQuizApi(url:string,key:string,endpoint:string,action:string,payload:Record<string,unknown>,session?:Session|null,db?:SupabaseClient){
  const send=async(token?:string)=>{
    const response=await fetch(`${url}/functions/v1/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json',apikey:key,...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({action,...payload})});
    const raw=await response.text();let data:any;try{data=JSON.parse(raw)}catch{data={message:raw.trim().slice(0,180)}}
    return {response,data};
  };
  const current=session&&db?(await db.auth.getSession()).data.session:session;
  let {response,data}=await send(current?.access_token);
  const invalid=response.status===401||data.error==='Session invalide'||data.message==='Invalid JWT';
  if(session&&db&&invalid){
    const refreshed=await db.auth.refreshSession();
    if(refreshed.data.session)({response,data}=await send(refreshed.data.session.access_token));
  }
  if(!response.ok||data.error)throw Error(data.error||data.message||data.code||'Connexion impossible');
  return data;
}
