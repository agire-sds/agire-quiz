import {useState} from 'react';
import type {Session,SupabaseClient} from '@supabase/supabase-js';

export function ForgotPassword({db,onBack,onError}:{db:SupabaseClient;onBack:()=>void;onError:(message:string)=>void}){
  const[email,setEmail]=useState(''),[sent,setSent]=useState(false),[busy,setBusy]=useState(false);
  const send=async(event:React.FormEvent)=>{event.preventDefault();setBusy(true);try{const redirectTo=location.origin+import.meta.env.BASE_URL+'?reset=1';const{error}=await db.auth.resetPasswordForEmail(email.trim(),{redirectTo});if(error)throw error;setSent(true)}catch(error){onError(String(error))}finally{setBusy(false)}};
  return <div className="panel narrow"><h2>Mot de passe oublié ?</h2>{sent?<p>Si cette adresse possède un compte, un lien de réinitialisation vient d’être envoyé. Vérifiez aussi les courriers indésirables.</p>:<form onSubmit={e=>void send(e)}><label>Adresse e-mail<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><button className="primary" disabled={busy}>{busy?'Envoi…':'Envoyer le lien'}</button></form>}<button type="button" onClick={onBack}>Retour à la connexion</button></div>;
}

export function ResetPassword({db,session,ready,onError}:{db:SupabaseClient;session:Session|null;ready:boolean;onError:(message:string)=>void}){
  const[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
  const save=async(event:React.FormEvent)=>{event.preventDefault();if(password!==confirmation){onError('Les mots de passe ne correspondent pas.');return}setBusy(true);try{const{error}=await db.auth.updateUser({password});if(error)throw error;await db.auth.signOut();setDone(true)}catch(error){onError(String(error))}finally{setBusy(false)}};
  return <section className="panel narrow"><h1>Nouveau mot de passe</h1>{!ready?<p>Vérification du lien…</p>:done?<><p>Mot de passe modifié.</p><a href={import.meta.env.BASE_URL+'#/'}>Se connecter</a></>:!session?<><p>Ce lien est invalide ou a expiré.</p><a href={import.meta.env.BASE_URL+'#/'}>Retour à la connexion</a></>:<form onSubmit={e=>void save(e)}><label>Nouveau mot de passe<input type="password" minLength={8} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirmer le mot de passe<input type="password" minLength={8} required autoComplete="new-password" value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label><button className="primary" disabled={busy||password!==confirmation}>{busy?'Enregistrement…':'Enregistrer le mot de passe'}</button></form>}</section>;
}
