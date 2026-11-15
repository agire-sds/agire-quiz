import {useRef,useState} from 'react';
import HelpTip from './HelpTip';

type Props={url:string;zone:number[][];onChange:(points:number[][])=>void};
type Tool='rectangle'|'circle'|'points';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const rectangle=(a:number[],b:number[])=>[[a[0],a[1]],[b[0],a[1]],[b[0],b[1]],[a[0],b[1]]];
const circle=(a:number[],b:number[],w:number,h:number)=>{const r=Math.hypot((b[0]-a[0])*w,(b[1]-a[1])*h);return Array.from({length:48},(_,i)=>{const angle=i*2*Math.PI/48;return[clamp(a[0]+r*Math.cos(angle)/w),clamp(a[1]+r*Math.sin(angle)/h)]})};

export default function PinZoneEditor({url,zone,onChange}:Props){
  const[tool,setTool]=useState<Tool>('rectangle');
  const[points,setPoints]=useState<number[][]>([]);
  const start=useRef<number[]|null>(null);
  const position=(event:React.PointerEvent<SVGSVGElement>)=>{const rect=event.currentTarget.getBoundingClientRect();return[clamp((event.clientX-rect.left)/rect.width),clamp((event.clientY-rect.top)/rect.height)]};
  const shape=(event:React.PointerEvent<SVGSVGElement>,a:number[],b:number[])=>{const rect=event.currentTarget.getBoundingClientRect();return tool==='rectangle'?rectangle(a,b):circle(a,b,rect.width,rect.height)};
  const down=(event:React.PointerEvent<SVGSVGElement>)=>{event.preventDefault();const p=position(event);if(tool==='points'){if(points.length<200)setPoints(old=>[...old,p]);return}event.currentTarget.setPointerCapture(event.pointerId);start.current=p;onChange(shape(event,p,p))};
  const move=(event:React.PointerEvent<SVGSVGElement>)=>{if(start.current)onChange(shape(event,start.current,position(event)))};
  const up=(event:React.PointerEvent<SVGSVGElement>)=>{if(!start.current)return;const end=position(event),rect=event.currentTarget.getBoundingClientRect();if(Math.hypot((end[0]-start.current[0])*rect.width,(end[1]-start.current[1])*rect.height)<5)onChange([]);else onChange(shape(event,start.current,end));start.current=null};
  const choose=(next:Tool)=>{setTool(next);setPoints([])};
  const shown=points.length?points:zone;
  return <div className="pin-zone-editor"><div className="field-with-help"><div className="actions"><button type="button" className={tool==='rectangle'?'primary':''} onClick={()=>choose('rectangle')}>Rectangle</button><button type="button" className={tool==='circle'?'primary':''} onClick={()=>choose('circle')}>Cercle</button><button type="button" className={tool==='points'?'primary':''} onClick={()=>choose('points')}>Points reliés</button>{tool==='points'&&<><button type="button" disabled={!points.length} onClick={()=>setPoints(old=>old.slice(0,-1))}>Annuler le dernier point</button><button type="button" className="primary" disabled={points.length<3} onClick={()=>{onChange(points);setPoints([])}}>Fermer la zone</button></>}<button type="button" disabled={!zone.length&&!points.length} onClick={()=>{setPoints([]);onChange([])}}>Effacer la zone</button></div><HelpTip text={tool==='points'?'Cliquez sur l’image pour poser chaque point du contour. Les points se relient dans l’ordre. Posez au moins trois points, puis cliquez sur Fermer la zone. Annuler le dernier point permet de corriger le tracé.':tool==='circle'?'Cliquez au centre de la zone correcte, maintenez puis étirez jusqu’au bord souhaité.':'Cliquez à un angle de la zone correcte, maintenez puis étirez le rectangle.'}/></div><div className="pin-zone-canvas"><img src={url} alt="Définir la zone correcte" draggable={false}/><svg viewBox="0 0 100 100" preserveAspectRatio="none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{start.current=null}} aria-label="Définir la zone correcte sur l’image">{shown.length>=3?<polygon points={shown.map(p=>`${p[0]*100},${p[1]*100}`).join(' ')}/>:shown.length>=2?<polyline points={shown.map(p=>`${p[0]*100},${p[1]*100}`).join(' ')} fill="none" stroke="#7ca127" strokeWidth=".6"/>:null}{tool==='points'&&points.map((p,i)=><circle key={i} cx={p[0]*100} cy={p[1]*100} r="1" fill="#7ca127" stroke="white" strokeWidth=".3"/>)}</svg></div>{zone.length>=3&&<p className="pin-zone-confirmation">Zone correcte définie.</p>}</div>;
}
