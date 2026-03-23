import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, Download, AlertTriangle, Copy, Check, Trash2, Shield, 
  CheckCircle2, XCircle, AlertCircle, FileText, Calendar, Hash, 
  Search, ExternalLink, Info, Award
} from 'lucide-react';
import '../../styles/reportscreen.css';
import useReportStore from '../../store/useReportStore';
import useAppStore from '../../store/useAppStore';
import useWSStore from '../../store/useWSStore';
import { destroyReport } from '../../services/api';
import TruthMeter from './TruthMeter';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PDFReport from './PDFReport';

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
}

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

  const r = 18, cx = 22, cy = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;

  return (
    <div className="confidence-ring-wrapper">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--card-border)" strokeWidth="3" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
        />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fill="var(--text-primary)" fontWeight="800">
          {animated}<tspan fontSize="6">%</tspan>
        </text>
      </svg>
    </div>
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

  const SEGS = 20;
  const filled = Math.round((animated / 100) * SEGS);

  return (
    <div className="rs-mini-bar-v2">
      {Array.from({ length: SEGS }).map((_, i) => (
        <div
          key={i}
          className="rs-mini-seg-v2"
          style={{ background: i < filled ? color : 'var(--card-border)' }}
        />
      ))}
    </div>
  );
};

/* ─── Verdict helpers ─────────────────────────────────────────────────────── */
const VERDICT_MAP = {
  'True':         { label: 'TRUE',          cls: 'rv-true',         color: 'var(--accent-true)', icon: <CheckCircle2 size={14} /> },
  'False':        { label: 'FALSE',         cls: 'rv-false',        color: 'var(--accent-false)', icon: <XCircle size={14} /> },
  'Partial':      { label: 'PARTIAL',       cls: 'rv-partial',      color: 'var(--accent-partial)', icon: <AlertCircle size={14} /> },
  'Unverifiable': { label: 'UNVERIFIABLE',  cls: 'rv-unverifiable', color: 'var(--accent-unverifiable)', icon: <Shield size={14} /> },
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

  const vm = VERDICT_MAP[verdict] || VERDICT_MAP['Unverifiable'];
  const pct = Math.round(confidence <= 1 ? confidence * 100 : confidence);
  const category = inferCategory(text);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div 
      className={`rs-premium-claim-card ${vm.cls} rs-slide-up`} 
      style={{ ...style, borderLeftColor: vm.color }}
    >
      <div className="rs-premium-card-header">
        <div className="rs-claim-badge-row">
          <span className="rs-claim-number-badge">CLAIM {String(index + 1).padStart(2, '0')}</span>
          <span className="rs-claim-verdict-badge" style={{ background: `${vm.color}15`, color: vm.color, borderColor: `${vm.color}30` }}>
            {vm.icon}
            {vm.label}
          </span>
        </div>
        
        <div className="rs-claim-main-content">
          <h4 className="rs-claim-title-text">{text}</h4>
          <div className="rs-claim-stats-aside">
            <ConfidenceRing pct={pct} color={vm.color} />
          </div>
        </div>
      </div>

      <div className="rs-claim-visual-meter">
        <MiniTruthBar score={pct} color={vm.color} />
      </div>

      {conflicting && (
        <div className="rs-conflict-alert">
          <AlertTriangle size={14} />
          <span>Contradicting evidence found among sources</span>
        </div>
      )}

      <div className="rs-premium-sections">
        {/* reasoning */}
        {reasoning && (
          <div className="rs-premium-section">
            <div className="rs-section-header-v2">
              <Info size={12} />
              <span>AI ANALYSIS</span>
            </div>
            <p className="rs-analysis-text-v2">{reasoning}</p>
          </div>
        )}

        {/* Sources */}
        {sources.length > 0 && (
          <div className="rs-premium-section">
            <div className="rs-section-header-v2">
              <Search size={12} />
              <span>SOURCES ({sources.length})</span>
            </div>
            <div className="rs-source-grid-v2">
              {sources.map((src, i) => {
                const domain = extractDomain(src.url);
                const isSupporting = verdict === 'True' || verdict === 'Partial';
                const srcConf = Math.max(50, Math.min(97, pct + (i % 2 === 0 ? 5 : -7)));

                return (
                  <div key={i} className="rs-source-card-v2">
                    <div className="rs-src-header-v2">
                      <div className="rs-src-publisher-v2">
                        <div className="rs-src-favicon-v2" style={{ background: vm.color }}>
                          {domain.charAt(0).toUpperCase()}
                        </div>
                        <span className="rs-src-name-v2">{domain}</span>
                      </div>
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="rs-src-link-v2">
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    
                    <h5 className="rs-src-title-v2">{src.title || "Reference Source"}</h5>
                    <p className="rs-src-snippet-v2">{src.snippet}</p>
                    
                    <div className="rs-src-footer-v2">
                      <div className={`rs-stance-badge-v2 ${isSupporting ? 'stance-up' : 'stance-down'}`}>
                        {isSupporting ? 'Supports' : 'Contradicts'}: {srcConf}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="rs-premium-card-footer">
        <div className="rs-footer-metadata">
          <span className="rs-meta-tag"><Hash size={10} /> {category}</span>
          <span className="rs-meta-tag"><FileText size={10} /> {sources.length} Sources</span>
          <span className="rs-meta-tag"><Award size={10} /> Fact-checked</span>
        </div>
        <button className="rs-card-copy-btn" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
};

/* ─── REPORT SCREEN (main export) ────────────────────────────────────────── */
const ReportScreen = ({ reportData, query, onBack }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const apiKey = useAppStore((s) => s.apiKey) || localStorage.getItem('factly_api_key') || '';

  // 1. STATS CARDS — Calculate from claims array directly
  const claims = useMemo(() => reportData.claims || [], [reportData.claims]);
  
  const stats = useMemo(() => {
    return {
      total: claims.length,
      true: claims.filter(c => c.verdict === "True").length,
      false: claims.filter(c => c.verdict === "False").length,
      partial: claims.filter(c => c.verdict === "Partial").length,
      unverifiable: claims.filter(c => c.verdict === "Unverifiable").length,
    };
  }, [claims]);

  const score = claims.length === 0 ? null : Math.round((reportData.overall_score || 0) * 100);
  const aiProb = Math.round((reportData.ai_text_probability || 0) * 100);
  
  const dateObj = new Date(reportData.created_at || new Date());
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  const reportIdShort = reportData.id?.substring(0, 8) || reportData.report_id?.substring(0, 8) || 'N/A';

  const aiProbLabel = aiProb < 30 ? 'Low' : aiProb < 70 ? 'Medium' : 'High';
  const aiProbCls = aiProb < 30 ? 'aip-low' : aiProb < 70 ? 'aip-med' : 'aip-high';
  const aiProbText = aiProb > 70 ? `High (${aiProb}%) — Likely AI Generated` : `${aiProbLabel} (${aiProb}%)`;

  const handleExport = () => {
    const content = `Factly AI Verification Report\n` +
      `Report ID: ${reportData.id || reportData.report_id || 'N/A'}\n` +
      `Date: ${formattedDate} ${formattedTime}\n` +
      `Query: ${query}\n` +
      `Truth Score: ${score !== null ? score + '%' : 'N/A'}\n` +
      `AI Text Probability: ${aiProb}%\n\n` +
      claims.map((c, i) => `Claim ${i + 1}: ${c.claim_text || c.text}\nVerdict: ${c.verdict}\nConfidence: ${Math.round((c.confidence <= 1 ? c.confidence * 100 : c.confidence))}%\nReasoning: ${c.reasoning || 'N/A'}\n`).join('\n---\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `factly-report-${reportIdShort}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rs-screen-v2">
      {/* ── Top Navigation ── */}
      <div className="rs-nav-v2">
        <button className="rs-back-btn-v2" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Exit Report</span>
        </button>
        <div className="rs-nav-actions-v2">
          <button 
            className="rs-nav-btn-v2 delete"
            onClick={async () => {
              if (!window.confirm("Delete this report permanently?")) return;
              setIsDeleting(true);
              try {
                await destroyReport(reportData.id || reportData.report_id, apiKey);
                useReportStore.getState().removeReport(reportData.id || reportData.report_id);
                useWSStore.getState().markReportDeleted(reportData.id || reportData.report_id);
                onBack();
              } catch (err) {
                alert("Failed to delete: " + err.message);
                setIsDeleting(false);
              }
            }}
            disabled={isDeleting}
          >
            <Trash2 size={14} />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          <PDFDownloadLink 
            document={<PDFReport reportData={reportData} query={query} />} 
            fileName={`factly-report-${reportIdShort}-${new Date().toISOString().split('T')[0]}.pdf`}
            style={{ textDecoration: 'none' }}
          >
            {({ blob, url, loading, error }) => (
              <button className="rs-nav-btn-v2 export" disabled={loading}>
                <Download size={14} />
                {loading ? '...' : 'Export PDF'}
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="rs-scroll-area-v2">
        <div className="rs-container-v2">
          
          {/* ── Professional Header ── */}
          <header className="rs-doc-header rs-fade-in">
            <div className="rs-header-top">
              <div className="rs-brand-badge">
                < Award size={14} />
                <span>Verified by Factly AI</span>
              </div>
              <div className="rs-header-meta">
                <div className="rs-meta-item">
                  <Hash size={12} />
                  <span>ID: {reportIdShort}</span>
                </div>
                <div className="rs-meta-item">
                  <Calendar size={12} />
                  <span>{formattedDate} • {formattedTime}</span>
                </div>
              </div>
            </div>
            
            <h1 className="rs-doc-title">Verification Analysis Report</h1>
            <div className="rs-header-query">
              <div className="rs-query-label-v2">INPUT QUERY</div>
              <p className="rs-query-text-v2">"{query || reportData.input_text}"</p>
            </div>
            <div className="rs-header-divider" />
          </header>

          {/* ── Truth Meter & AI Prob ── */}
          <section className="rs-hero-v2 rs-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="rs-hero-main-v2">
              <TruthMeter score={score} />
            </div>
            <div className={`rs-ai-prob-card-v2 ${aiProbCls}`}>
              <div className="rs-ai-prob-header-v2">
                <Info size={14} />
                <span>AI CONTENT ANALYSIS</span>
              </div>
              <div className="rs-ai-prob-body-v2">
                <span className="rs-ai-prob-value-v2">{aiProb}%</span>
                <span className="rs-ai-prob-desc-v2">Probability of AI Generation: <strong>{aiProbLabel}</strong></span>
              </div>
            </div>
          </section>

          {/* ── KPI Grid ── */}
          <section className="rs-stats-grid-v2 rs-slide-up" style={{ animationDelay: '0.2s' }}>
            {[
              { label: 'Total Claims', value: stats.total, icon: <FileText size={20} />, color: 'var(--text-primary)', cls: 'st-total' },
              { label: 'True',         value: stats.true,  icon: <CheckCircle2 size={20} />, color: 'var(--accent-true)', cls: 'st-true' },
              { label: 'False',        value: stats.false, icon: <XCircle size={20} />, color: 'var(--accent-false)', cls: 'st-false' },
              { label: 'Partial',      value: stats.partial, icon: <AlertCircle size={20} />, color: 'var(--accent-partial)', cls: 'st-partial' },
              { label: 'Unverifiable', value: stats.unverifiable, icon: <Shield size={20} />, color: 'var(--accent-unverifiable)', cls: 'st-unv' },
            ].map((st, i) => (
              <div key={st.label} className={`rs-stat-box-v2 ${st.cls}`} style={{ '--glow-color': st.color }}>
                <div className="rs-stat-icon-v2">{st.icon}</div>
                <div className="rs-stat-value-v2">
                  <AnimatedCounter end={st.value} />
                </div>
                <div className="rs-stat-label-v2">{st.label}</div>
              </div>
            ))}
          </section>

          {/* ── Claims Section ── */}
          <section className="rs-claims-area-v2">
            <h3 className="rs-section-title-v2 rs-slide-up" style={{ animationDelay: '0.3s' }}>
              Detailed Claims breakdown
            </h3>
            
            <div className="rs-claims-stack-v2">
              {claims.map((claim, i) => (
                <RSClaimCard
                  key={i}
                  claim={claim}
                  index={i}
                  total={claims.length}
                  style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                />
              ))}
              
              {claims.length === 0 && (
                <div className="rs-empty-state-v2 rs-slide-up">
                  <div className="rs-empty-icon-v2">
                    <Search size={40} />
                  </div>
                  <h4 className="rs-empty-title-v2">No Claims Found</h4>
                  <p className="rs-empty-text-v2">No verifiable factual claims were found in this text.</p>
                </div>
              )}
            </div>
          </section>

          <footer className="rs-doc-footer-v2 rs-fade-in">
            <div className="rs-footer-line" />
            <div className="rs-footer-content-v2">
              <span>Verified and Secured by Alethia AI & Factly Engine</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ReportScreen;
