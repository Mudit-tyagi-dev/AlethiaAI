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
    <div className="truth-meter-container">
      <div className="truth-meter-labels" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span className="tm-label-false" style={{ color: '#ef4444', fontWeight: 'bold' }}>FALSE</span>
        <span className="tm-label-true" style={{ color: '#10b981', fontWeight: 'bold' }}>TRUE</span>
      </div>
      <div className="truth-meter-bar">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className="tm-segment"
            style={{
              background: i < filledCount ? color : 'var(--card-border)',
              opacity: i < filledCount ? 1 : 1
            }}
          />
        ))}
      </div>
      <div className="truth-score-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '12px' }}>
        <span className="truth-score-pct" style={{ color, fontSize: '1.4rem', fontWeight: 'bold', lineHeight: '1.2' }}>{animatedScore}%</span>
        <span className="truth-meter-label" style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 'bold', marginTop: '2px', letterSpacing: '0.5px' }}>TRUTH SCORE</span>
      </div>
    </div>
  );
};

export default TruthMeter;
