import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Bookmark } from 'lucide-react';
import '../../styles/claimcard.css';

const StanceTag = ({ stance }) => (
  <span className={`stance-tag ${stance === 'supporting' ? 'stance-supporting' : 'stance-counter'}`}>
    {stance === 'supporting' ? 'Supporting' : 'Counter Argument'}
  </span>
);

const CredibilityBar = ({ credibility }) => {
  const SEGS = 10;
  const filled = Math.round((credibility / 100) * SEGS);
  const color = credibility >= 80 ? 'var(--accent-true)' : credibility >= 60 ? 'var(--accent-partial)' : 'var(--accent-false)';
  return (
    <div className="cred-row-inline">
      <span className="cred-label-sm">Credibility</span>
      <div className="cred-segs">
        {Array.from({ length: SEGS }).map((_, i) => (
          <div key={i} className="cred-seg" style={{ background: i < filled ? color : 'var(--card-border)' }} />
        ))}
      </div>
      <span className="cred-pct-sm" style={{ color }}>{credibility}%</span>
    </div>
  );
};

const ClaimCard = ({ claim, claimNum, totalClaims }) => {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const verdictClass = claim.verdict.toLowerCase().replace(/ /g, '-');

  return (
    <article className="claim-full">
      {/* ── HEADER ── */}
      <div className="claim-full-header">
        <p className="claim-full-text">{claim.text}</p>
        <div className="claim-full-badges">
          <span className={`verdict-pill pill-${verdictClass}`}>
            <span className="verdict-dot" />
            {claim.verdict}
          </span>
          <span className="confidence-badge">{claim.confidence}%</span>
        </div>
      </div>

      <div className="cf-divider" />

      {/* ── AI ANALYSIS ── */}
      <div className="cf-section">
        <div className="cf-section-label">AI ANALYSIS</div>
        <p className="cf-bold">{claim.summaryBold}</p>
        <p className="cf-regular">{claim.explanation}</p>
        {claim.verdict === 'FALSE' && claim.actualFact && (
          <div className="cf-correction">
            <strong>What actually happened: </strong>{claim.actualFact}
          </div>
        )}
      </div>

      <div className="cf-divider" />

      {/* ── SOURCE SUMMARIES ── */}
      <div className="cf-section">
        <div className="cf-section-header">
          <div className="cf-section-label">SOURCE SUMMARIES ({claim.sources.length} sources)</div>
          <span className="cf-date-muted">Fact-checked on: {new Date().toLocaleDateString()}</span>
        </div>

        <div className="source-cards">
          {claim.sources.map((src, i) => (
            <div key={i} className="source-card">
              <div className="source-card-top">
                <StanceTag stance={src.stance} />
              </div>
              <div className="source-card-body">
                <div className="source-publisher-row">
                  <div className="source-favicon">{src.name[0]}</div>
                  <span className="source-publisher-name">{src.name}</span>
                  <span className="source-title-sep">|</span>
                  <a href={src.url} className="source-article-title">{src.title} ↗</a>
                </div>
                <div className="source-meta-row">
                  <span className="source-date-sm">{src.date}</span>
                  <span className="source-snippet">{src.snippet}</span>
                </div>
                <CredibilityBar credibility={src.credibility} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONFLICT ── */}
      {claim.conflict && (
        <div className="conflict-block">
          <div className="conflict-block-header">
            <span>⚠️</span>
            <strong>Source Conflict Detected</strong>
          </div>
          <p className="conflict-block-text">
            <strong>{claim.conflict.source1.name}</strong> reports "{claim.conflict.source1.claim}" vs{' '}
            <strong>{claim.conflict.source2.name}</strong> "{claim.conflict.source2.claim}" — credibility gap: {claim.conflict.gap}%. {claim.conflict.note}
          </p>
        </div>
      )}

      {/* ── CLAIM FOOTER ── */}
      <div className="cf-footer">
        <span className="category-chip">{claim.category}</span>
        <div className="cf-actions">
          <button className="cf-action-btn">
            <Bookmark size={13} /> Post (+{claim.actions.post})
          </button>
          <button className="cf-action-btn">
            <Share2 size={13} /> Share (+{claim.actions.share})
          </button>
          <button className={`cf-action-btn ${liked ? 'action-up' : ''}`} onClick={() => setLiked(p => !p)}>
            <ThumbsUp size={13} /> (+{liked ? claim.actions.up + 1 : claim.actions.up})
          </button>
          <button className={`cf-action-btn ${disliked ? 'action-down' : ''}`} onClick={() => setDisliked(p => !p)}>
            <ThumbsDown size={13} /> (+{disliked ? claim.actions.down + 1 : claim.actions.down})
          </button>
        </div>
      </div>
    </article>
  );
};

export default ClaimCard;
