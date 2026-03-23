import React, { useId } from 'react';
import '../../styles/truthmeter.css';

const TruthMeter = ({ score }) => {
  const uniqueId = useId().replace(/:/g, '');
  const gradientId = `gaugeGradient-${uniqueId}`;
  const glowId = `glow-${uniqueId}`;

  const isAvailable = score !== null && score !== undefined && !isNaN(score);
  const displayScore = isAvailable ? Math.round(score) : 50;
  
  // Angle: -90 (0%) to 90 (100%)
  const needleAngle = isAvailable ? -90 + (displayScore / 100) * 180 : 0;

  // Gradient colors
  const getColor = (val) => {
    if (!isAvailable) return 'var(--text-tertiary)'; // Gray
    if (val < 40) return 'var(--accent-false)'; // Red
    if (val < 70) return 'var(--accent-partial)'; // Yellow
    return 'var(--accent-true)'; // Green
  };

  const currentColor = getColor(displayScore);

  return (
    <div className="truth-meter-wrapper">
      <div className="truth-meter-svg-container">
        <svg viewBox="0 0 200 130" className="truth-meter-svg">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-false)" />
              <stop offset="50%" stopColor="var(--accent-partial)" />
              <stop offset="100%" stopColor="var(--accent-true)" />
            </linearGradient>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke="var(--card-border)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Color Gradient Track */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="14"
            strokeLinecap="round"
            opacity={isAvailable ? 1 : 0.2}
          />

          {/* Pivot Point Shadow/Base */}
          <circle cx="100" cy="110" r="8" fill="var(--overlay-bg)" opacity="0.4" />
          
          {/* Needle - Using SVG transform attribute for maximum compatibility */}
          <g 
            className="truth-meter-needle-group"
            transform={`rotate(${needleAngle} 100 110)`}
          >
            <line
              x1="100" y1="110"
              x2="100" y2="30"
              stroke={currentColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              filter={`url(#${glowId})`}
              style={{ stroke: currentColor }}
            />
          </g>

          {/* Pivot Dot - Rendered on top of needle base */}
          <circle 
            cx="100" cy="110" r="5" 
            fill={currentColor} 
            filter={`url(#${glowId})`} 
            style={{ fill: currentColor }}
          />

          {/* Corner Labels (Muted, bottom edges) */}
          <text x="15" y="125" className="meter-tick-label" textAnchor="start" fill="var(--text-tertiary)">FALSE</text>
          <text x="185" y="125" className="meter-tick-label" textAnchor="end" fill="var(--text-tertiary)">TRUE</text>
        </svg>

        {/* Text outside/below the semicircle */}
        <div className="meter-external-stats">
          <div 
            className="meter-score-external" 
            style={{ color: currentColor, textShadow: isAvailable ? `0 0 20px ${currentColor}50` : 'none' }}
          >
            {isAvailable ? `${displayScore}%` : '—'}
          </div>
          <div className="meter-label-external">TRUTH SCORE</div>
        </div>
      </div>
    </div>
  );
};

export default TruthMeter;
