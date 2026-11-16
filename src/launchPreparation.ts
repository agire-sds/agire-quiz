import type {Session,SupabaseClient} from '@supabase/supabase-js';
import {postQuizApi} from './postQuizApi';

export type QuizKind='classic'|'road'|'poll'|'brainstorm';
export type LaunchablePreparation={id:string;kind:QuizKind;quiz_id:string;screen:string};

export function hostPath(kind:QuizKind,id:string){return kind==='classic'?`#/host/${id}`:`#/${kind}/host/${id}`}
export function projectorPath(kind:QuizKind,id:string){return kind==='classic'?`#/projector/${id}`:`#/${kind}/projector/${id}`}

export async function launchPreparation(prep:LaunchablePreparation,session:Session,db:SupabaseClient,url:string,key:string,onError:(message:string)=>void){
  const projection=prep.screen==='projector'?window.open('','agire-projector','width=1280,height=800'):null;
  try{
    const endpoint=prep.kind==='classic'?'game-api':`${prep.kind}-api`;
    const game=await postQuizApi(url,key,endpoint,'create',{quizId:prep.quiz_id,seriesId:prep.quiz_id,preparationId:prep.id},session,db);
    if(projection)projection.location.href=`${location.origin}${import.meta.env.BASE_URL}${projectorPath(prep.kind,game.id)}`;
    else if(prep.screen==='projector')onError('Fenêtre de projection bloquée : ouvrez-la depuis l’écran animateur.');
    location.hash=hostPath(prep.kind,game.id);
  }catch(error){projection?.close();onError(String(error));throw error}
}
