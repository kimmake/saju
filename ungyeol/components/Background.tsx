export default function Background() {
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden', background: 'radial-gradient(ellipse 40% 30% at 18% 22%,rgba(160,120,60,.10),transparent 70%),radial-gradient(ellipse 35% 25% at 82% 68%,rgba(150,110,55,.10),transparent 70%),radial-gradient(ellipse 25% 20% at 60% 12%,rgba(120,90,50,.07),transparent 70%),radial-gradient(ellipse 30% 22% at 35% 80%,rgba(140,100,50,.08),transparent 70%),radial-gradient(ellipse 120% 90% at 50% 45%,transparent 55%,rgba(110,80,40,.22) 100%)' }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="ukInk" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.018 0.05" numOctaves="4" seed="7" result="t" /><feDisplacementMap in="SourceGraphic" in2="t" scale="38" xChannelSelector="R" yChannelSelector="G" result="d" /><feGaussianBlur in="d" stdDeviation="1.6" /></filter>
          <filter id="ukInkSoft" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed="3" result="t" /><feDisplacementMap in="SourceGraphic" in2="t" scale="30" xChannelSelector="R" yChannelSelector="G" result="d" /><feGaussianBlur in="d" stdDeviation="4" /></filter>
          <linearGradient id="ukMist1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8E897F" stopOpacity=".55" /><stop offset=".75" stopColor="#8E897F" stopOpacity="0" /></linearGradient>
          <linearGradient id="ukMist2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5F5A52" stopOpacity=".6" /><stop offset=".7" stopColor="#5F5A52" stopOpacity="0" /></linearGradient>
          <linearGradient id="ukMist3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#36332E" stopOpacity=".55" /><stop offset=".65" stopColor="#36332E" stopOpacity="0" /></linearGradient>
        </defs>
      </svg>
      <svg viewBox="0 0 600 500" preserveAspectRatio="xMinYMax meet" style={{ position: 'absolute', left: 0, bottom: 0, width: 'min(48vw,680px)', height: 'auto', opacity: 0.75 }}>
        <path filter="url(#ukInkSoft)" fill="url(#ukMist1)" d="M-20 500 L-20 170 L50 110 L100 160 L170 70 L235 150 L300 120 L380 220 L470 250 L620 330 L620 500Z" />
        <path filter="url(#ukInk)" fill="url(#ukMist2)" d="M-20 500 L-20 250 L45 220 L90 160 L145 240 L205 200 L265 275 L335 295 L425 355 L525 395 L620 430 L620 500Z" />
        <path filter="url(#ukInk)" fill="url(#ukMist3)" d="M-20 500 L-20 320 L35 290 L70 230 L115 310 L175 345 L245 395 L335 440 L430 470 L620 500Z" />
      </svg>
      <svg viewBox="0 0 600 500" preserveAspectRatio="xMaxYMax meet" style={{ position: 'absolute', right: 0, bottom: 0, width: 'min(44vw,620px)', height: 'auto', opacity: 0.7, transform: 'scaleX(-1)' }}>
        <path filter="url(#ukInkSoft)" fill="url(#ukMist1)" d="M-20 500 L-20 200 L70 140 L130 190 L200 100 L260 170 L330 150 L410 240 L500 270 L620 340 L620 500Z" />
        <path filter="url(#ukInk)" fill="url(#ukMist2)" d="M-20 500 L-20 280 L60 230 L110 190 L160 260 L230 230 L290 300 L370 320 L460 380 L620 440 L620 500Z" />
        <path filter="url(#ukInk)" fill="url(#ukMist3)" d="M-20 500 L-20 350 L50 310 L90 270 L140 340 L210 380 L300 430 L420 470 L620 500Z" />
      </svg>
      <svg viewBox="0 0 220 80" style={{ position: 'absolute', left: -40, top: 64, width: 170, opacity: 0.4 }} fill="none" stroke="#9C8458" strokeWidth="1.3" strokeLinecap="round">
        <path d="M6 40 H120 a16 16 0 1 0 -16 -16 a9 9 0 1 1 9 9" /><path d="M40 58 H190 a12 12 0 1 0 -12 -12 a7 7 0 1 1 7 7" />
      </svg>
      <svg viewBox="0 0 220 80" style={{ position: 'absolute', right: '2vw', top: 300, width: 180, opacity: 0.5, transform: 'scaleX(-1)' }} fill="none" stroke="#9C8458" strokeWidth="1.3" strokeLinecap="round">
        <path d="M6 40 H120 a16 16 0 1 0 -16 -16 a9 9 0 1 1 9 9" /><path d="M40 58 H190 a12 12 0 1 0 -12 -12 a7 7 0 1 1 7 7" />
      </svg>
      <svg viewBox="0 0 90 90" style={{ position: 'absolute', right: 4, top: 4, width: 36, opacity: 0.5 }} fill="none" stroke="#9C8458" strokeWidth="1.4">
        <path d="M0 4 H86 V90" /><path d="M30 12 H78 V60" /><path d="M54 12 V36 H78" />
      </svg>
      <svg viewBox="0 0 90 90" style={{ position: 'absolute', left: 6, bottom: 6, width: 56, opacity: 0.5, transform: 'rotate(180deg)' }} fill="none" stroke="#9C8458" strokeWidth="1.4">
        <path d="M0 4 H86 V90" /><path d="M30 12 H78 V60" /><path d="M54 12 V36 H78" />
      </svg>
    </div>
  );
}
