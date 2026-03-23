/* src/components/GaugeMeter.jsx */
import React, { useState, useEffect } from 'react';
import '../styles/gaugemeter.css';

const GaugeMeter = ({ value = 0, result = 'uncertain' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const radius = 80;
  const circumference = Math.PI * radius; // 251.32
  const offset = circumference - (value / 100) * circumference;

  const colors = {
    ai_generated: '#ff3366',
    uncertain: '#ffbb00',
    human_written: '#00ff88'
  };
  const activeColor = colors[result] || colors.uncertain;

  useEffect(() => {
    setIsMounted(true);
    
    let start = 0;
    const end = value;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuad = progress * (2 - progress);
      setDisplayValue(Math.round(easeOutQuad * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className="gauge-wrapper">
      <svg
        width="180"
        height="110"
        viewBox="0 0 180 110"
        className="gauge-svg"
      >
        <defs>
          <filter id="gaugeGlowSimple" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Track */}
        <path
          d="M 10 100 A 80 80 0 0 1 170 100"
          strokeWidth="12"
          strokeLinecap="round"
          className="gauge-bg-track"
        />

        <path
          d="M 10 100 A 80 80 0 0 1 170 100"
          strokeWidth="12"
          strokeLinecap="round"
          stroke={activeColor}
          strokeDasharray={circumference}
          strokeDashoffset={isMounted ? offset : circumference}
          className="gauge-fill"
          filter="url(#gaugeGlowSimple)"
        />

        {/* Needle */}
        <g 
          className="gauge-needle-group" 
          style={{ 
            transform: `rotate(${isMounted ? ((value / 100) * 180 - 90) : -90}deg)`, 
            transformOrigin: '90px 100px',
            transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <line x1="90" y1="100" x2="90" y2="35" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }} />
          <circle cx="90" cy="100" r="3.5" fill="#fff" style={{ filter: 'drop-shadow(0 0 4px #fff)' }} />
        </g>
      </svg>

      {/* Center Content */}
      <div className="gauge-center-content">
        <div 
          className="gauge-number" 
          style={{ fontSize: '28px', color: activeColor }}
        >
          {displayValue}%
        </div>
        <div className="gauge-label">PROBABILITY</div>
      </div>
    </div>
  );
};

export default GaugeMeter;
