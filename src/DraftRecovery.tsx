type Snapshot={updatedAt:string};

export default function DraftRecovery({history,onRestore}:{history:Snapshot[];onRestore:(index:number)=>void}){
  if(!history.length)return null;
  return <details className="road-checkpoints"><summary>Récupérer une sauvegarde précédente</summary><div className="actions">{history.map((saved,index)=><button type="button" key={saved.updatedAt+index} onClick={()=>{if(confirm('Restaurer cette sauvegarde ? Les modifications actuelles seront remplacées.'))onRestore(index)}}>{new Date(saved.updatedAt).toLocaleString('fr-FR')}</button>)}</div></details>;
}
