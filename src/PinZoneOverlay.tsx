type Point={x:number;y:number};
type Key={zone?:number[][];x?:number;y?:number;radius?:number};

export default function PinZoneOverlay({answerKey,points=[]}:{answerKey?:Key;points?:Point[]}){
  if(!answerKey)return null;
  const zone=answerKey.zone;
  return <svg className="classic-zone-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Zone correcte et points placés">
    {Array.isArray(zone)&&zone.length>=3?<polygon className="classic-zone-correct" points={zone.map(point=>`${point[0]*100},${point[1]*100}`).join(' ')}/>:typeof answerKey.x==='number'&&<circle className="classic-zone-correct" cx={answerKey.x*100} cy={(answerKey.y||0)*100} r={(answerKey.radius||.1)*100}/>}
    {points.filter(point=>Number.isFinite(point.x)&&Number.isFinite(point.y)).map((point,i)=><circle className="classic-zone-answer" key={i} cx={point.x*100} cy={point.y*100} r="1.4"/>)}
  </svg>;
}
