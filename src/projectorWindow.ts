type Display={availLeft:number;availTop:number;availWidth:number;availHeight:number};
type DisplayDetails={screens:Display[];currentScreen:Display};

export function openProjectorWindow(name:string,url=''){
  const projection=window.open(url,name,'popup,width=1280,height=800');
  if(!projection)return null;
  const getDetails=(window as Window&{getScreenDetails?:()=>Promise<DisplayDetails>}).getScreenDetails;
  if(getDetails){
    void getDetails.call(window).then(details=>{
      const target=details.screens.find(screen=>screen.availLeft!==details.currentScreen.availLeft||screen.availTop!==details.currentScreen.availTop);
      if(!target||projection.closed)return;
      projection.moveTo(target.availLeft,target.availTop);
      projection.resizeTo(target.availWidth,target.availHeight);
      projection.focus();
    }).catch(()=>{});
  }
  return projection;
}
