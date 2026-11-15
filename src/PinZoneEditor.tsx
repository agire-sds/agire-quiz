import {useRef,useState} from 'react';

type Props={url:string;zone:number[][];onChange:(points:number[][])=>void};
const clamp=(value:number)=>Math.max(0,Math.min(1,value));
const rectangle=(start:number[],end:number[])=>[[start[0],start[1]],[end[0],start[1]],[end[0],end[1]],[start[0],end[1]]];

export default function PinZoneEditor({url,zone,onChange}:Props){
  const[tool,setTool]=useState<'rectangle'|'freehand'>('rectangle');const start=useRef<number[]|null>(null);const draft=useRef<number[][]>([]);
  const position=(event:React.PointerEvent<SVGSVGElement>)=>{const rect=event.currentTarget.getBoundingClientRect();return[clamp((event.clientX-rect.left)/rect.width),clamp((event.clientY-rect.top)/rect.height)]};
  const down=(event:React.PointerEvent<SVGSVGElement>)=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);const point=position(event);start.current=point;draft.current=[point];onChange(tool==='rectangle'?rectangle(point,point):[point])};
  const move=(event:React.PointerEvent<SVGSVGElement>)=>{if(!start.current)return;const point=position(event);if(tool==='rectangle')onChange(rectangle(start.current,point));else{const last=draft.current[draft.current.length-1];if(Math.hypot(point[0]-last[0],point[1]-last[1])>.008&&draft.current.length<200){draft.current=[...draft.current,point];onChange(draft.current)}}};
  const up=(event:React.PointerEvent<SVGSVGElement>)=>{if(!start.current)return;move(event);if(tool==='rectangle'){const point=position(event);if(Math.abs(point[0]-start.current[0])<.01||Math.abs(point[1]-start.current[1])<.01)onChange([])}else if(draft.current.length<3)onChange([]);start.current=null};
  return <div className="pin-zone-editor"><div className="actions"><button type="button" className={tool==='rectangle'?'primary':''} onClick={()=>setTool('rectangle')}>Rectangle</button><button type="button" className={tool==='freehand'?'primary':''} onClick={()=>setTool('freehand')}>Forme libre</button><button type="button" disabled={!zone.length} onClick={()=>onChange([])}>Effacer la zone</button></div><p>Sur l’image, maintenez le clic et tracez la zone acceptée.</p><div className="pin-zone-canvas"><img src={url} alt="Définir la zone correcte" draggable={false}/><svg viewBox="0 0 100 100" preserveAspectRatio="none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{start.current=null}} aria-label="Tracer la zone correcte sur l’image"><polygon points={zone.map(point=>`${point[0]*100},${point[1]*100}`).join(' ')} /></svg></div>{zone.length>=3&&<p className="pin-zone-confirmation">Zone correcte définie.</p>}</div>;
}
