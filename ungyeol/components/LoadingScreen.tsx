const STEPS = ['만세력으로 사주팔자를 계산하고 있어요', '오행과 띠의 관계를 살펴보고 있어요', '이야기를 차분히 엮고 있어요 · 20초쯤 걸려요'];

export default function LoadingScreen({ name, step }: { name: string; step: number }) {
  return (
    <main aria-live="polite" className="loading">
      <div aria-hidden="true" className="loading__mark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/art/enso.webp" alt="" width={640} height={640} />
        <span>運</span>
      </div>
      <div>
        <h2>{name ? `${name}님의` : '당신의'} 사주를 차분히 펼쳐 보고 있어요</h2>
        <p>잠시만 기다려 주세요.</p>
      </div>
      <ol>
        {STEPS.map((label, i) => (
          <li key={label} data-state={i < step ? 'done' : i === step ? 'current' : 'todo'}>
            <i aria-hidden="true" />{label}
          </li>
        ))}
      </ol>
    </main>
  );
}
