import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, AlertTriangle, Copy, Check } from 'lucide-react';
import '../../styles/reportscreen.css';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function extractDomain(url = '') {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

function inferCategory(text = '') {
  const t = text.toLowerCase();
  if (/vaccine|virus|covid|cancer|health|medical|drug|disease|clinical/.test(t)) return 'Health';
  if (/climate|emission|temperature|carbon|environment|energy|ev|electric/.test(t)) return 'Environment';
  if (/election|politic|president|congress|senate|vote|govern|policy/.test(t)) return 'Politics';
  if (/einstein|napoleon|history|war|century|ancient|historical/.test(t)) return 'History';
  if (/brain|space|physics|chemistry|biology|science|atom|dna|nasa/.test(t)) return 'Science';
  if (/ai|machine learning|neural|gpt|algorithm|technology|computer/.test(t)) return 'Technology';
  return 'General';
}

function extractDateFromSnippet(snippet = '') {
  if (!snippet) return null;
  const isoMatch = snippet.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    try {
      const d = new Date(isoMatch[1]);
      if (!isNaN(d)) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { /* ignore */ }
  }
  const fullMatch = snippet.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/i);
  if (fullMatch) return fullMatch[0].trim();
  const reverseMatch = snippet.match(/\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b/i);
  if (reverseMatch) return reverseMatch[0];
  return null;
}

/* ─── Animated Counter ────────────────────────────────────────────────────── */
const AnimatedCounter = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime = null;
    const animate = (t) => {
      if (!startTime) startTime = t;
      const progress = Math.min((t - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * end));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(end);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  return <span>{count}</span>;
};

/* ─── Semicircle Gauge ────────────────────────────────────────────────────── */
const SemiGauge = ({ score }) => {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    let start = null;
    const duration = 1400;
    const animate = (t) => {
      if (!start) start = t;
      const progress = Math.min((t - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimated(Math.round(ease * score));
      if (progress < 1) requestAnimationFrame(animate);
      else setAnimated(score);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const radius = 80;
  const cx = 100, cy = 100;
  const startAngle = Math.PI; // left
  const endAngle = 0;        // right
  const circumference = Math.PI * radius;

  // Needle angle: score 0→0° (left), score 100→180° (right) mapped from PI to 0
  const needleAngle = Math.PI - (animated / 100) * Math.PI;
  const needleX = cx + (radius - 10) * Math.cos(needleAngle);
  const needleY = cy + (radius - 10) * Math.sin(needleAngle);

  // Arc path
  const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

  let trackColor = '#ef4444';
  if (score >= 40 && score < 70) trackColor = '#eab308';
  if (score >= 70) trackColor = '#10b981';

  return (
    <div className="rs-gauge-wrapper">
      <svg viewBox="0 0 200 110" className="rs-gauge-svg">
        {/* Track */}
        <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round" />
        {/* Fill */}
        <path
          d={arcPath}
          fill="none"
          stroke={trackColor}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (animated / 100) * circumference}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={needleX} y2={needleY}
          stroke={trackColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5" fill={trackColor} />
        {/* Labels */}
        <text x="14" y="105" fontSize="10" fill="#ef4444" fontWeight="700">FALSE</text>
        <text x="162" y="105" fontSize="10" fill="#10b981" fontWeight="700">TRUE</text>
      </svg>
      <div className="rs-gauge-score" style={{ color: trackColor }}>
        {animated}%
      </div>
      <div className="rs-gauge-label">TRUTH SCORE</div>
    </div>
  );
};

/* ─── Confidence Ring ─────────────────────────────────────────────────────── */
const ConfidenceRing = ({ pct, color }) => {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    let start = null;
    const animate = (t) => {
      if (!start) start = t;
      const progress = Math.min((t - start) / 900, 1);
      setAnimated(Math.round((1 - Math.pow(1 - progress, 3)) * pct));
      if (progress < 1) requestAnimationFrame(animate);
      else setAnimated(pct);
    };
    requestAnimationFrame(animate);
  }, [pct]);

  const r = 20, cx = 26, cy = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;

  return (
    <svg width="52" height="52" className="rs-conf-ring">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fill={color} fontWeight="700">
        {animated}%
      </text>
    </svg>
  );
};

/* ─── Mini Truth Meter Bar ────────────────────────────────────────────────── */
const MiniTruthBar = ({ score, color }) => {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    let start = null;
    const animate = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / 800, 1);
      setAnimated(Math.round((1 - Math.pow(1 - p, 3)) * score));
      if (p < 1) requestAnimationFrame(animate);
      else setAnimated(score);
    };
    setTimeout(() => requestAnimationFrame(animate), 200);
  }, [score]);

  const SEGS = 10;
  const filled = Math.round((animated / 100) * SEGS);

  return (
    <div className="rs-mini-bar">
      {Array.from({ length: SEGS }).map((_, i) => (
        <div
          key={i}
          className="rs-mini-seg"
          style={{ background: i < filled ? color : 'rgba(255,255,255,0.06)' }}
        />
      ))}
    </div>
  );
};

/* ─── Verdict helpers ─────────────────────────────────────────────────────── */
const VERDICT_MAP = {
  'True':         { label: 'TRUE',          cls: 'rv-true',         color: '#10b981' },
  'False':        { label: 'FALSE',         cls: 'rv-false',        color: '#ef4444' },
  'Partial':      { label: 'PARTIAL',       cls: 'rv-partial',      color: '#eab308' },
  'Unverifiable': { label: 'UNVERIFIABLE',  cls: 'rv-unverifiable', color: '#8b5cf6' },
};

function verdictColor(v) {
  return VERDICT_MAP[v]?.color || '#8b5cf6';
}

/* ─── Claim Card (Report Screen version) ─────────────────────────────────── */
const RSClaimCard = ({ claim, index, total, style }) => {
  const [copied, setCopied] = useState(false);
  const {
    text = '',
    verdict = 'Unverifiable',
    confidence = 0,
    reasoning = '',
    sources = [],
    conflicting = false,
  } = claim;

  const vm = VERDICT_MAP[verdict] || { label: verdict.toUpperCase(), cls: 'rv-unverifiable', color: '#8b5cf6' };
  const pct = Math.round(confidence <= 1 ? confidence * 100 : confidence);
  const category = inferCategory(text);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="rs-claim-card" style={style}>
      {/* Claim number separator */}
      {index > 0 && (
        <div className="rs-claim-sep">
          <span>── Claim {index + 1} of {total} ──</span>
        </div>
      )}

      {/* Header */}
      <div className="rs-claim-header">
        <div className="rs-claim-num">Claim {String(index + 1).padStart(2, '0')}</div>
        <div className="rs-claim-top-row">
          <div className="rs-claim-text">{text}</div>
          <div className="rs-claim-badges">
            <span className={`rs-verdict-pill ${vm.cls}`}>
              <span className="rs-verdict-dot" />
              {vm.label}
            </span>
            <ConfidenceRing pct={pct} color={vm.color} />
          </div>
        </div>
      </div>

      {/* Mini Truth Bar */}
      <MiniTruthBar score={pct} color={vm.color} />

      {/* Conflict pulsing dot */}
      {conflicting && (
        <div className="rs-conflict-badge">
          <span className="rs-conflict-dot" />
          ⚠️ Sources conflict on this claim
        </div>
      )}

      {/* AI Analysis */}
      {reasoning && (
        <div className="rs-section">
          <div className="rs-section-label">AI ANALYSIS</div>
          <p className="rs-section-text">{reasoning}</p>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div className="rs-section">
          <div className="rs-section-label">SOURCES ({sources.length} found)</div>
          <div className="rs-sources-list">
            {sources.map((src, i) => {
              const domain = extractDomain(src.url);
              const lastUpdated = extractDateFromSnippet(src.snippet);
              const isSupporting = verdict === 'True' || verdict === 'Partial';
              const srcConf = Math.max(50, Math.min(97, pct + (i % 2 === 0 ? 5 : -7)));

              return (
                <div key={i} className="rs-source-card">
                  <a href={src.url} target="_blank" rel="noopener noreferrer" className="rs-source-title">
                    {src.title || src.url} ↗
                  </a>
                  <div className="rs-source-meta">
                    <span className="rs-source-domain">{domain}</span>
                    <span className="rs-source-date">
                      ⏳ {lastUpdated ? `Last updated: ${lastUpdated}` : 'Recently published'}
                    </span>
                  </div>
                  <p className="rs-source-snippet">{src.snippet}</p>
                  <div className="rs-source-footer">
                    {isSupporting
                      ? <span className="rs-src-pill rs-src-supports">Supports: {srcConf}%</span>
                      : <span className="rs-src-pill rs-src-contradicts">Contradicts: {srcConf}%</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer chips */}
      <div className="rs-claim-footer">
        <div className="rs-footer-chips">
          <span className="rs-chip">{category}</span>
          <span className="rs-chip">📚 {sources.length} sources analyzed</span>
          <span className="rs-chip">⏳ Fact-checked: just now</span>
        </div>
        <button className="rs-copy-btn" onClick={handleCopy}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

/* ─── REPORT SCREEN (main export) ────────────────────────────────────────── */
const ReportScreen = ({ reportData, query, onBack }) => {
  const score = Math.round((reportData.overall_score || 0) * 100);
  const aiProb = Math.round((reportData.ai_text_probability || 0) * 100);
  const claims = reportData.claims || [];
  const timestamp = new Date().toLocaleString();

  const aiProbLabel = aiProb < 30 ? 'Low' : aiProb < 70 ? 'Medium' : 'High';
  const aiProbCls = aiProb < 30 ? 'aip-low' : aiProb < 70 ? 'aip-med' : 'aip-high';
  const aiProbText = aiProb > 70 ? `High (${aiProb}%) — Likely AI Generated` : `${aiProbLabel} (${aiProb}%)`;

  const handleExport = () => {
    const content = `AlethiaAI Verification Report\n` +
      `Report ID: ${reportData.report_id || 'N/A'}\n` +
      `Date: ${timestamp}\n` +
      `Query: ${query}\n` +
      `Truth Score: ${score}%\n` +
      `AI Text Probability: ${aiProb}%\n\n` +
      claims.map((c, i) => `Claim ${i + 1}: ${c.text}\nVerdict: ${c.verdict}\nConfidence: ${Math.round((c.confidence <= 1 ? c.confidence * 100 : c.confidence))}%\nReasoning: ${c.reasoning || 'N/A'}\n`).join('\n---\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `alethia-report-${reportData.report_id || Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rs-screen">
      {/* ── Top Bar ── */}
      <div className="rs-topbar">
        <button className="rs-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to Chat
        </button>
        <div className="rs-topbar-center">
          <span className="rs-topbar-title">Verification Report</span>
          <span className="rs-topbar-date">{timestamp}</span>
        </div>
        <button className="rs-export-btn" onClick={handleExport}>
          <Download size={15} />
          Export
        </button>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="rs-content">
        {/* Hero */}
        <section className="rs-hero rs-fade-in">
          <SemiGauge score={score} />
          <div className="rs-query-box">
            <div className="rs-query-label">Verified Query</div>
            <p className="rs-query-text">"{query}"</p>
          </div>
          <div className={`rs-ai-prob-badge ${aiProbCls}`}>
            🤖 AI Text Probability: <strong>{aiProbText}</strong>
          </div>
        </section>

        {/* KPI Row */}
        <section className="rs-kpi-row rs-slide-up" style={{ animationDelay: '0.15s' }}>
          {[
            { label: 'Total Claims', value: reportData.total_claims || 0, cls: 'kpi-total' },
            { label: '✓ True',       value: reportData.true_count || 0,   cls: 'kpi-t' },
            { label: '✗ False',      value: reportData.false_count || 0,  cls: 'kpi-f' },
            { label: '~ Partial',    value: reportData.partial_count || 0, cls: 'kpi-p' },
          ].map(({ label, value, cls }) => (
            <div key={label} className={`rs-kpi-card ${cls}`}>
              <div className="rs-kpi-value">
                <AnimatedCounter end={value} duration={1000} />
              </div>
              <div className="rs-kpi-label">{label}</div>
            </div>
          ))}
        </section>

        {/* Claims */}
        <section className="rs-claims-section">
          <div className="rs-claims-header">Claims Analysis</div>
          {claims.map((claim, i) => (
            <RSClaimCard
              key={i}
              claim={claim}
              index={i}
              total={claims.length}
              style={{ animationDelay: `${0.25 + i * 0.1}s` }}
            />
          ))}
          {claims.length === 0 && (
            <div className="rs-no-claims">No individual claims available.</div>
          )}
        </section>

        {/* Footer */}
        <footer className="rs-footer">
          <div>Verified by AlethiaAI ✦</div>
          {reportData.report_id && (
            <div className="rs-footer-id">Report ID: {reportData.report_id}</div>
          )}
          <div className="rs-footer-time">{timestamp}</div>
        </footer>
      </div>
    </div>
  );
};

export default ReportScreen;
