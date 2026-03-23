import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, ChevronUp, Copy, AlertTriangle, Check, 
  Search, ExternalLink, Info, Shield, CheckCircle2, 
  XCircle, AlertCircle, FileText, Hash, Award 
} from 'lucide-react';
import '../../styles/claimcard.css';

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

const VERDICT_MAP = {
  'True':         { label: 'TRUE',          cls: 'rv-true',         color: '#10b981', icon: <CheckCircle2 size={12} /> },
  'False':        { label: 'FALSE',         cls: 'rv-false',        color: '#ef4444', icon: <XCircle size={12} /> },
  'Partial':      { label: 'PARTIAL',       cls: 'rv-partial',      color: '#eab308', icon: <AlertCircle size={12} /> },
  'Unverifiable': { label: 'UNVERIFIABLE',  cls: 'rv-unverifiable', color: '#8b5cf6', icon: <Shield size={12} /> },
};

/* ─── Internal Components ─────────────────────────────────────────────────── */

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

  const r = 16, cx = 20, cy = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;

  return (
    <div className="chat-conf-ring">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fill="white" fontWeight="800">
          {animated}<tspan fontSize="6">%</tspan>
        </text>
      </svg>
    </div>
  );
};

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
    setTimeout(() => requestAnimationFrame(animate), 100);
  }, [score]);

  const SEGS = 15;
  const filled = Math.round((animated / 100) * SEGS);

  return (
    <div className="chat-mini-bar">
      {Array.from({ length: SEGS }).map((_, i) => (
        <div
          key={i}
          className="chat-mini-seg"
          style={{ background: i < filled ? color : 'rgba(255,255,255,0.06)' }}
        />
      ))}
    </div>
  );
};

/* ─── Main Claim Card (Chat Version; Expandable) ───────────────────────────── */

const ClaimCard = ({ claim, index = 0 }) => {
  const [expanded, setExpanded] = useState(index === 0); // Expand first by default
  const [copied, setCopied] = useState(false);

  const {
    text = '',
    status = 'pending',
    verdict = null,
    confidence = 0,
    reasoning = '',
    sources = [],
    conflicting = false,
    search_query = '',
  } = claim;

  const vm = verdict ? (VERDICT_MAP[verdict] || VERDICT_MAP['Unverifiable']) : null;
  const confidencePct = Math.round((confidence <= 1 ? confidence * 100 : confidence));
  const category = inferCategory(text);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <article
      className={`premium-chat-claim-card ${expanded ? 'is-expanded' : 'is-collapsed'} ${vm ? vm.cls : 'is-pending'}`}
      style={{ animationDelay: `${index * 100}ms`, borderLeftColor: vm ? vm.color : 'rgba(255,255,255,0.1)' }}
      onClick={() => status === 'verified' && setExpanded(!expanded)}
    >
      {/* ── Header / Collapsed View ── */}
      <div className="chat-card-header">
        <div className="chat-card-top-row">
          <div className="chat-card-badges">
            <span className="chat-claim-id">CLAIM {String(index + 1).padStart(2, '0')}</span>
            {vm && (
              <span className="chat-verdict-tag" style={{ color: vm.color, background: `${vm.color}15`, borderColor: `${vm.color}30` }}>
                {vm.icon} {vm.label}
              </span>
            )}
            {!vm && status !== 'verified' && (
              <span className="chat-verdict-tag is-loading">
                <span className="chat-spinner-small" /> {status.toUpperCase()}
              </span>
            )}
          </div>
          <div className="chat-card-actions">
            {vm && <ConfidenceRing pct={confidencePct} color={vm.color} />}
            <span className="chat-expand-icon">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </div>
        </div>

        <h4 className="chat-claim-text-main">{text || 'Factual analysis in progress...'}</h4>
        
        {vm && !expanded && (
          <div className="chat-card-mini-meter">
            <MiniTruthBar score={confidencePct} color={vm.color} />
          </div>
        )}
      </div>

      {/* ── Expanded Content ── */}
      <div className={`chat-card-expanded-content ${expanded ? 'show' : 'hide'}`}>
        <div className="chat-expanded-divider" />
        
        {search_query && (
          <div className="chat-metadata-row" onClick={(e) => e.stopPropagation()}>
            🔍 Search Query: "{search_query}" • {sources.length} sources found
          </div>
        )}

        {vm && (
           <div className="chat-card-visual-meter">
              <MiniTruthBar score={confidencePct} color={vm.color} />
           </div>
        )}

        {conflicting && (
          <div className="chat-conflict-alert">
            <AlertTriangle size={14} />
            <span>Contradicting evidence found among sources</span>
          </div>
        )}

        <div className="chat-premium-sections">
          {reasoning && (
            <div className="chat-premium-section">
              <div className="chat-section-label">
                <Info size={12} /> AI ANALYSIS
              </div>
              <p className="chat-analysis-text">{reasoning}</p>
            </div>
          )}

          {sources.length > 0 && (
            <div className="chat-premium-section">
              <div className="chat-section-label">
                <Search size={12} /> SOURCES ({sources.length})
              </div>
              <div className="chat-source-stack">
                {sources.map((src, i) => {
                  const domain = extractDomain(src.url);
                  const isSupporting = verdict === 'True' || verdict === 'Partial';
                  return (
                    <div key={i} className="chat-source-item">
                      <div className="chat-source-head">
                        <span className="chat-source-pub">
                          <div className="chat-favicon-mini" style={{ background: vm?.color || '#525866' }}>{domain.charAt(0).toUpperCase()}</div>
                          {domain}
                        </span>
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className="chat-source-link">
                          <ExternalLink size={12} />
                        </a>
                      </div>
                      <h5 className="chat-source-title">{src.title || "Reference Source"}</h5>
                      <p className="chat-source-snippet">{src.snippet}</p>
                      <div className={`chat-stance-tag ${isSupporting ? 'is-up' : 'is-down'}`}>
                        {isSupporting ? 'Supports' : 'Contradicts'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="chat-card-footer-premium">
          <div className="chat-footer-meta">
             <span className="chat-meta-chip"><Hash size={10} /> {category}</span>
             <span className="chat-meta-chip"><Award size={10} /> Verified</span>
          </div>
          <button className="chat-copy-btn-v2" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default ClaimCard;
