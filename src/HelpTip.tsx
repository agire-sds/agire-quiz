export default function HelpTip({text}:{text:string}){
  return <details className="field-help"><summary aria-label="Afficher l’aide">?</summary><p>{text}</p></details>;
}
