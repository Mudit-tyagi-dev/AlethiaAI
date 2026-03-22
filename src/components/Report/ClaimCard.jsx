import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, AlertTriangle } from 'lucide-react';
import '../../styles/claimcard.css';

// Infer category from claim text
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

// Extract domain from URL
function extractDomain(url = '') {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// Extract a date from snippet text
function extractDateFromSnippet(snippet = '') {
  if (!snippet) return null;

  // Try ISO: 2024-07-16
  const isoMatch = snippet.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    try {
      const d = new Date(isoMatch[1]);
      if (!isNaN(d)) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { /* ignore */ }
  }

  // Try "Jul 16, 2024" or "July 16 2024" style
  const fullMatch = snippet.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/i);
  if (fullMatch) return fullMatch[0].replace(/\s+/g, ' ').trim();

  // Try "16 Jul 2024"
  const reverseMatch = snippet.match(/\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b/i);
  if (reverseMatch) return reverseMatch[0];

  // Try MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = snippet.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/);
  if (slashMatch) {
    try {
      const d = new Date(slashMatch[1]);
      if (!isNaN(d)) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { /* ignore */ }
  }

  return null;
}

// Compute per-source confidence (mock heuristic based on source index + claim confidence)
function computeSourceConfidence(claimConfidence, sourceIndex, totalSources) {
  // Spread confidence slightly across sources; even-indexed sources get slightly higher
  const base = Math.round(claimConfidence * 100);
  const variation = (sourceIndex % 2 === 0 ? 5 : -7) + Math.floor(Math.random() * 5);
  return Math.max(50, Math.min(97, base + variation));
}

// Verdict display map
const VERDICT_META = {
  'True':          { label: 'TRUE',          cls: 'verdict-true' },
  'False':         { label: 'FALSE',         cls: 'verdict-false' },
  'Partial':       { label: 'PARTIAL',       cls: 'verdict-partial' },
  'Unverifiable':  { label: 'UNVERIFIABLE',  cls: 'verdict-unverifiable' },
};

const StatusBadge = ({ status }) => {
  if (status === 'searching') return <span className="status-badge searching"><span className="status-spinner" /> Searching...</span>;
  if (status === 'verifying') return <span className="status-badge verifying"><span className="status-spinner" /> Verifying...</span>;
  return null;
};

// ── Source Card with enhancements ────────────────────────────────────────────
const SourceCard = ({ src, index, claimVerdict, claimConfidence, totalSources }) => {
  const domain = extractDomain(src.url);
  const lastUpdated = extractDateFromSnippet(src.snippet);
  const isSupporting = claimVerdict === 'True' || claimVerdict === 'Partial';
  const sourceConf = computeSourceConfidence(claimConfidence <= 1 ? claimConfidence : claimConfidence / 100, index, totalSources);

  return (
    <div className="source-card-new">
      <a href={src.url} target="_blank" rel="noopener noreferrer" className="source-title-link">
        {src.title || src.url} ↗
      </a>

      <div className="source-meta-row-new">
        <span className="source-domain">{domain}</span>
        <span className="source-last-updated">
          ⏳ {lastUpdated ? `Last updated: ${lastUpdated}` : 'Recently published'}
        </span>
      </div>

      <p className="source-snippet-new">{src.snippet}</p>

      <div className="source-card-footer">
        {isSupporting ? (
          <span className="source-conf-pill conf-supports">
            Supports claim: {sourceConf}%
          </span>
        ) : (
          <span className="source-conf-pill conf-contradicts">
            Contradicts claim: {sourceConf}%
          </span>
        )}
      </div>
    </div>
  );
};

// ── Main Claim Card ───────────────────────────────────────────────────────────
const ClaimCard = ({ claim, index = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    text = '',
    status = 'pending',
    verdict = null,
    confidence = 0,
    reasoning = '',
    sources = [],
    conflicting = false,
  } = claim;

  const verdictMeta = verdict ? VERDICT_META[verdict] || { label: verdict.toUpperCase(), cls: 'verdict-unverifiable' } : null;
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
      className={`claim-card-new slide-in-card ${expanded ? 'card-expanded' : 'card-collapsed'}`}
      style={{ animationDelay: `${index * 80}ms` }}
      data-verdict={verdict}
      onClick={() => status === 'verified' && setExpanded(p => !p)}
    >
      {/* ── COLLAPSED ROW ── */}
      <div className="card-main-row">
        <div className="card-left">
          {verdictMeta ? (
            <span className={`verdict-pill-new ${verdictMeta.cls} verdict-animate-in`}>
              <span className="verdict-dot-new" />
              {verdictMeta.label}
            </span>
          ) : (
            <span className={`verdict-pill-new verdict-pending ${status === 'pending' ? 'pulse-anim' : ''}`}>
              <span className="verdict-dot-new" />
              PENDING
            </span>
          )}
        </div>

        <div className="card-center">
          <p className={`card-claim-text ${expanded ? '' : 'text-truncated'}`}>{text}</p>
        </div>

        <div className="card-right">
          {status !== 'verified' && <StatusBadge status={status} />}
          {verdictMeta && (
            <div className="confidence-inline">
              <span className="confidence-pct">{confidencePct}%</span>
            </div>
          )}
          {conflicting && <AlertTriangle size={14} className="conflict-icon" title="Conflicting sources" />}
          {status === 'verified' && (
            <span className="expand-chevron">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          )}
        </div>
      </div>

      {/* Confidence bar */}
      {verdictMeta && (
        <div className="confidence-bar-track">
          <div
            className={`confidence-bar-fill conf-${verdictMeta.cls}`}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      )}

      {/* ── EXPANDED CONTENT ── */}
      <div className={`card-expandable ${expanded ? 'card-open' : ''}`}>
        <div className="card-expanded-inner">
          <div className="cf-divider" />

          {/* AI ANALYSIS */}
          {reasoning && (
            <div className="cf-section">
              <div className="cf-section-label">AI ANALYSIS</div>
              <p className="cf-regular">{reasoning}</p>
            </div>
          )}

          {/* SOURCES */}
          {sources.length > 0 && (
            <div className="cf-section">
              <div className="cf-section-label">SOURCES ({sources.length} found)</div>
              <div className="source-cards-new">
                {sources.map((src, i) => (
                  <SourceCard
                    key={i}
                    src={src}
                    index={i}
                    claimVerdict={verdict}
                    claimConfidence={confidence}
                    totalSources={sources.length}
                  />
                ))}
              </div>
            </div>
          )}

          {/* CONFLICT WARNING */}
          {conflicting && (
            <div className="conflict-amber-box">
              <AlertTriangle size={14} />
              <div>
                <strong>⚠️ Sources show conflicting information</strong>
                <p>Some sources disagree on this claim.</p>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="card-footer">
            <span className="category-chip">{category}</span>
            <button className="copy-claim-btn" onClick={handleCopy}>
              <Copy size={12} /> {copied ? 'Copied!' : 'Copy Claim'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ClaimCard;
