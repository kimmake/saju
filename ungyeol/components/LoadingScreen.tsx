const STEPS = ['만세력으로 사주팔자를 계산하고 있어요', '오행과 띠의 관계를 살펴보고 있어요', '이야기를 차분히 엮고 있어요 · 20초쯤 걸려요'];

export default function LoadingScreen({ name, step }: { name: string; step: number }) {
  return (
    <main aria-live="polite" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: '80px 24px 120px', textAlign: 'center' }}>
      <div aria-hidden="true" style={{ position: 'relative', width: 132, height: 132 }}>
        <svg width="132" height="132" viewBox="0 0 132 132" style={{ position: 'absolute', inset: 0, animation: 'ukSpin 9s linear infinite' }}>
          <circle cx="66" cy="66" r="60" fill="none" stroke="#B79A5E" strokeWidth="1" strokeDasharray="2 7" /><circle cx="66" cy="6" r="4" fill="#A8833F" />
        </svg>
        <svg width="132" height="132" viewBox="0 0 132 132" style={{ position: 'absolute', inset: 0, animation: 'ukSpin 5s linear infinite reverse' }}>
          <circle cx="66" cy="66" r="42" fill="none" stroke="#574A86" strokeWidth="1.4" strokeDasharray="90 174" strokeLinecap="round" />
        </svg>
        <div className="serif" style={{ position: 'absolute', inset: 40, borderRadius: '50%', background: '#ECE8F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, color: '#574A86', animation: 'ukBreath 2.4s ease-in-out infinite' }}>運</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <h2 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 800, lineHeight: 1.5 }}>{name ? `${name}님의` : '당신의'} 사주를 차분히 펼쳐 보고 있어요</h2>
        <p style={{ margin: 0, fontSize: 15, color: '#6B645A' }}>잠시만 기다려 주세요.</p>
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
        {STEPS.map((label, i) => (
          <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: i <= step ? '#24211D' : '#8A8378', fontWeight: i === step ? 700 : 500 }}>
            <span aria-hidden="true" style={{ width: 8, height: 8, transform: 'rotate(45deg)', background: i < step ? '#A8833F' : i === step ? '#574A86' : '#D8D1C3' }} />{label}
          </li>
        ))}
      </ol>
    </main>
  );
}
