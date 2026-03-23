import React, { useEffect, useState } from 'react';

const TruthMeter = ({ score }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let startTime = null;
    const duration = 1200;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      setAnimatedScore(Math.min(Math.floor(ease * score), score));
      if (progress < 1) requestAnimationFrame(animate);
      else setAnimatedScore(score);
    };
    requestAnimationFrame(animate);
  }, [score]);

  let color = 'var(--accent-false)';
  if (score >= 40 && score < 70) color = 'var(--accent-partial)';
  if (score >= 70) color = 'var(--accent-true)';

  const SEGMENTS = 10;
  const filledCount = Math.round((animatedScore / 100) * SEGMENTS);

  return (
    <div className="truth-meter-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="truth-meter-labels" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '4px' }}>
        <span className="tm-label-false" style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.75rem' }}>FALSE</span>
        <span className="tm-label-true" style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.75rem' }}>TRUE</span>
      </div>
      <div className="truth-meter-bar" style={{ display: 'flex', gap: '3px', width: '100%' }}>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className="tm-segment"
            style={{
              flex: 1,
              height: '8px',
              borderRadius: '2px',
              background: i < filledCount ? color : 'var(--card-border, rgba(255,255,255,0.1))',
              transition: 'background 0.4s ease'
            }}
          />
        ))}
      </div>
      <div className="truth-score-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '12px' }}>
        <div className="truth-score-pct" style={{ color, fontSize: '1.6rem', fontWeight: '800', lineHeight: '1.2' }}>{animatedScore}%</div>
        <div className="truth-meter-label" style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: '700', marginTop: '2px', letterSpacing: '1px', textTransform: 'uppercase' }}>TRUTH SCORE</div>
      </div>
    </div>
  );
};

export default TruthMeter;
