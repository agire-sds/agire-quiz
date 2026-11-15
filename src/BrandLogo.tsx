import './brand-logo.css';

export default function BrandLogo({className = ''}:{className?:string}) {
  return <img className={`quiz-logo ${className}`} src={`${import.meta.env.BASE_URL}logo-agire-quiz.png`} alt="AGIRE Quiz" />;
}
