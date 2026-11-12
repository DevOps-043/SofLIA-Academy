import type { AvatarExpression } from './avatar-model';
import { mouthContour } from './avatar-voice';

/** Señales planas del visor, basadas en la lámina de expresiones aprobada. */
export function AvatarFace({ expression }: { expression: AvatarExpression }) {
  let content;
  switch (expression) {
    case 'idle': content = <g className="avatar-face__blink"><path d="M12 50h21M67 50h21" /></g>; break;
    case 'listening': content = <g className="avatar-face__wave">{[26, 38, 50, 62, 74].map((x, index) => <path key={x} className={`avatar-face__bar avatar-face__bar--${index}`} d={`M${x} ${index === 2 ? 20 : index % 2 ? 29 : 40}V${index === 2 ? 80 : index % 2 ? 71 : 60}`} />)}</g>; break;
    case 'thinking': content = <g><circle className="avatar-face__thinking" cx="50" cy="50" r="29" /><g className="avatar-face__orbit"><circle cx="50" cy="16" r="3.5" fill="currentColor" strokeWidth="1" /><circle cx="81" cy="67" r="2.5" fill="currentColor" strokeWidth="1" /></g><g className="avatar-face__thought-dots"><circle cx="40" cy="50" r="2" /><circle cx="50" cy="50" r="2" /><circle cx="60" cy="50" r="2" /></g></g>; break;
    case 'speaking': content = <g className="avatar-face__speaking"><g className="avatar-face__blink"><rect className="avatar-face__open-eye" x="20" y="26" width="9" height="23" rx="4.5" /><rect className="avatar-face__open-eye" x="71" y="26" width="9" height="23" rx="4.5" /><path className="avatar-face__eyebrow" d="M17 17q7-4 14 0M69 17q7-4 14 0" /></g><path className="avatar-face__mouth" d={mouthContour(0, 0, .5)} /></g>; break;
    case 'success': content = <path className="avatar-face__confirm" d="m17 49 23 23 44-48" />; break;
    case 'warning': content = <g className="avatar-face__warning"><path d="M50 17v43" /><circle cx="50" cy="80" r="3" fill="currentColor" strokeWidth="4" /></g>; break;
    case 'curious': content = <g><g className="avatar-face__blink"><ellipse className="avatar-face__open-eye" cx="25" cy="48" rx="4.5" ry="9" /><ellipse className="avatar-face__open-eye" cx="75" cy="45" rx="5.5" ry="12" /><path className="avatar-face__eyebrow" d="M16 27q9-3 18 0M65 20q10-9 20-2" /></g><path className="avatar-face__fine" d="M43 70q8 4 15-3" /></g>; break;
    case 'happy': content = <g><g className="avatar-face__blink"><path d="M9 48q14-25 28 0M63 48q14-25 28 0" /></g><path className="avatar-face__fine" d="M37 67q13 12 26 0" /></g>; break;
    case 'confused': content = <g className="avatar-face__doubt"><path d="M31 30c0-24 40-24 40 0 0 17-21 15-21 31" /><circle cx="50" cy="80" r="3" fill="currentColor" strokeWidth="4" /></g>; break;
    case 'focused': content = <g><g className="avatar-face__blink"><path d="m12 43 23 5M65 48l23-5" /></g><path className="avatar-face__fine" d="M44 66h12" /></g>; break;
    case 'acknowledging': content = <g><g className="avatar-face__blink"><path d="M12 46q11-15 22 0M65 46q11-15 22 0" /></g><path className="avatar-face__fine" d="M40 66q10 7 20 0" /></g>; break;
    case 'sleeping': content = <g className="avatar-face__sleeping"><path d="M10 43q14 17 28 0M62 43q14 17 28 0" /><ellipse className="avatar-face__sleep-mouth" cx="50" cy="74" rx="4" ry="2.5" /></g>; break;
    case 'surprised': content = <g><g className="avatar-face__blink"><ellipse className="avatar-face__open-eye" cx="25" cy="38" rx="5.5" ry="13" /><ellipse className="avatar-face__open-eye" cx="75" cy="38" rx="5.5" ry="13" /><path className="avatar-face__eyebrow" d="M15 15q10-9 20 0M65 15q10-9 20 0" /></g><ellipse className="avatar-face__surprise-mouth" cx="50" cy="73" rx="7" ry="11" /></g>; break;
    case 'concerned': content = <g><g className="avatar-face__blink"><ellipse className="avatar-face__open-eye" cx="25" cy="45" rx="4.5" ry="9" /><ellipse className="avatar-face__open-eye" cx="75" cy="45" rx="4.5" ry="9" /><path className="avatar-face__eyebrow" d="m15 24 20-9M65 15l20 9" /></g><path className="avatar-face__fine" d="M38 76q12-13 24 0" /></g>; break;
  }
  return <svg className={`avatar-face avatar-face--${expression}`} viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{content}</svg>;
}
