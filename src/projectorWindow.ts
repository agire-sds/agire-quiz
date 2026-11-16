type Display={availLeft:number;availTop:number;availWidth:number;availHeight:number};
type DisplayDetails={screens:Display[];currentScreen:Display};

export function openProjectorWindow(name:string,url='',onIssue?:(message:string)=>void){
  let position='';
  try{const saved=JSON.parse(localStorage.getItem('agire-projector-display')||'null') as Display|null;if(saved&&Number.isFinite(saved.availLeft)&&Number.isFinite(saved.availTop))position=`,left=${saved.availLeft},top=${saved.availTop},width=${saved.availWidth},height=${saved.availHeight}`}catch{}
  const projection=window.open(url,name,`popup,width=1280,height=800${position}`);
  if(!projection)return null;
  const getDetails=(window as Window&{getScreenDetails?:()=>Promise<DisplayDetails>}).getScreenDetails;
  if(getDetails){
    void getDetails.call(window).then(details=>{
      const target=details.screens.find(screen=>screen.availLeft!==details.currentScreen.availLeft||screen.availTop!==details.currentScreen.availTop);
      if(!target||projection.closed){if(!target)onIssue?.('Aucun deuxième écran détecté. Vérifiez le mode Étendre dans Windows.');return;}
      localStorage.setItem('agire-projector-display',JSON.stringify(target));
      const place=()=>{if(projection.closed)return;projection.moveTo(target.availLeft,target.availTop);projection.resizeTo(target.availWidth,target.availHeight)};
      place();setTimeout(place,500);
      setTimeout(()=>{if(!projection.closed&&Math.abs(projection.screenX-target.availLeft)>120)onIssue?.('Chrome n’a pas déplacé la fenêtre. Autorisez la gestion des fenêtres pour ce site, puis rouvrez la projection.')},1000);
      projection.focus();
    }).catch(()=>onIssue?.('Autorisez la gestion des fenêtres pour AGIRE Quiz dans Chrome, puis rouvrez la projection.'));
  }else onIssue?.('Ce navigateur ne permet pas le placement automatique. Utilisez Chrome pour la projection.');
  return projection;
}
