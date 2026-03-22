import React, { useState, useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import LandingScreen from '../LandingScreen';
import '../../styles/chatbox.css';
import '../../styles/landing.css';

const WS_URL = 'wss://factify-backend-tcup.onrender.com/ws/verify';
const TIMEOUT_MS = 60000;

const STAGE_LABELS = {
  extracting: '⚡ Extracting Claims...',
  searching:  '🌐 Searching Sources...',
  verifying:  '🔍 Verifying Evidence...',
};

const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
};

function saveReport(reportEntry) {
  const existing = JSON.parse(localStorage.getItem('alethia_reports') || '[]');
  existing.unshift(reportEntry);
  localStorage.setItem('alethia_reports', JSON.stringify(existing));
}

const ChatThread = ({ wsRef, connectWS, openSettingsOnApiTab, selectedReport, onReportSaved, onViewReport }) => {
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [replyRequest, setReplyRequest] = useState(null);
  const [inputFocusRequest, setInputFocusRequest] = useState(null);

  // Real-time WebSocket state
  const [claims, setClaims] = useState({}); // claim_id → claim object
  const [claimOrder, setClaimOrder] = useState([]); // ordered list of claim_ids
  const [stageLabel, setStageLabel] = useState('');
  const [stageProgress, setStageProgress] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [finalReport, setFinalReport] = useState(null);

  // Status
  const [showReconnectBanner, setShowReconnectBanner] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  const bottomRef = useRef(null);
  const timeoutRef = useRef(null);
  const currentQueryRef = useRef('');

  const isLanding = messages.length === 0 && !selectedReport;

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, [messages, claims, finalReport]);

  // ── Load selected report (sidebar click) ─────────────────────────────────
  useEffect(() => {
    if (selectedReport) {
      setMessages([
        { id: 1, type: 'user', content: selectedReport.title || 'Saved Report', timestamp: formatDate(selectedReport.date) },
        { id: 2, type: 'saved-report', reportData: selectedReport, timestamp: formatDate(selectedReport.date) }
      ]);
    }
  }, [selectedReport]);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((msg, duration = 4000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), duration);
  }, []);

  // ── WS Event Handlers ─────────────────────────────────────────────────────
  const attachHandlers = useCallback((ws, resolve) => {
    ws.onmessage = (evt) => {
      let data;
      try { data = JSON.parse(evt.data); } catch { return; }

      const { event } = data;

      if (event === 'stage') {
        const { stage, progress } = data;
        setStageLabel(STAGE_LABELS[stage] || stage);
        setStageProgress(Math.round((progress || 0) * 100));
      }

      else if (event === 'claim_found') {
        const { claim_id, text } = data;
        setClaims(prev => ({
          ...prev,
          [claim_id]: {
            claim_id, text,
            status: 'searching',
            verdict: null,
            confidence: 0,
            reasoning: '',
            sources: [],
            conflicting: false,
          }
        }));
        setClaimOrder(prev => prev.includes(claim_id) ? prev : [...prev, claim_id]);
      }

      else if (event === 'search_done') {
        const { claim_id, sources = [], sources_found } = data;
        setClaims(prev => ({
          ...prev,
          [claim_id]: {
            ...(prev[claim_id] || {}),
            status: 'verifying',
            sources,
            sources_found,
          }
        }));
      }

      else if (event === 'claim_verified') {
        const { claim_id, verdict, confidence, reasoning, conflicting, sources } = data;
        setClaims(prev => ({
          ...prev,
          [claim_id]: {
            ...(prev[claim_id] || {}),
            status: 'verified',
            verdict,
            confidence: confidence || 0,
            reasoning: reasoning || '',
            conflicting: !!conflicting,
            sources: sources || prev[claim_id]?.sources || [],
          }
        }));
      }

      else if (event === 'report_done') {
        clearTimeout(timeoutRef.current);
        setShowTimeoutWarning(false);

        const { report_id, overall_score, ai_text_probability, total_claims, claims: claimsArr = [] } = data;
        const trueCount = data['true'] ?? 0;
        const falseCount = data['false'] ?? 0;
        const partialCount = data['partial'] ?? 0;
        const unverifiableCount = data['unverifiable'] ?? 0;

        const report = {
          report_id,
          overall_score,
          ai_text_probability,
          total_claims,
          true_count: trueCount,
          false_count: falseCount,
          partial_count: partialCount,
          unverifiable_count: unverifiableCount,
          claims: claimsArr,
        };

        setFinalReport(report);
        setIsVerifying(false);
        setIsProcessing(false);
        setStageLabel('');
        setStageProgress(0);

        // Save to localStorage
        const firstClaim = claimsArr[0];
        const title = firstClaim?.text
          ? firstClaim.text.substring(0, 40) + (firstClaim.text.length > 40 ? '...' : '')
          : currentQueryRef.current.substring(0, 40);

        const reportEntry = {
          report_id,
          title,
          query: currentQueryRef.current,
          date: new Date().toISOString(),
          overall_score: Math.round((overall_score || 0) * 100),
          total_claims,
          true_count: trueCount,
          false_count: falseCount,
          partial_count: partialCount,
          unverifiable_count: unverifiableCount,
          claims: claimsArr,
          ai_text_probability,
        };
        saveReport(reportEntry);
        onReportSaved?.();

        if (resolve) resolve();
      }
    };

    ws.onerror = () => {
      showToast('Connection error. Retrying...');
      setIsProcessing(false);
      setIsVerifying(false);
      clearTimeout(timeoutRef.current);
      // Auto-reconnect in 3s
      setTimeout(() => {
        const newWs = new WebSocket(WS_URL);
        wsRef.current = newWs;
        attachHandlers(newWs, null);
      }, 3000);
    };

    ws.onclose = (evt) => {
      if (!evt.wasClean) {
        setShowReconnectBanner(true);
        setTimeout(() => {
          const newWs = new WebSocket(WS_URL);
          wsRef.current = newWs;
          attachHandlers(newWs, null);
          newWs.onopen = () => setShowReconnectBanner(false);
        }, 3000);
      }
    };
  }, [wsRef, showToast, onReportSaved]);

  // ── Ensure WS connected ───────────────────────────────────────────────────
  const ensureConnected = useCallback(() => {
    return new Promise((resolve) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        attachHandlers(ws, resolve);
        resolve();
        return;
      }
      const newWs = new WebSocket(WS_URL);
      wsRef.current = newWs;
      newWs.onopen = () => {
        attachHandlers(newWs, resolve);
        resolve();
      };
    });
  }, [wsRef, attachHandlers]);

  // Also attach handlers to existing ws on mount (in case it's already open)
  useEffect(() => {
    const ws = wsRef?.current;
    if (ws) attachHandlers(ws, null);
  }, [wsRef, attachHandlers]);

  // ── Handle Send ───────────────────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    const apiKey = localStorage.getItem('alethia_api_key') || '';
    if (!apiKey.trim()) {
      openSettingsOnApiTab('Please add your API key to continue');
      return;
    }

    // Reset state for new query
    setClaims({});
    setClaimOrder([]);
    setFinalReport(null);
    setShowTimeoutWarning(false);
    currentQueryRef.current = text;

    const msgId = Date.now();
    setMessages(prev => [
      ...prev,
      { id: msgId, type: 'user', content: text, timestamp: getTime() },
    ]);
    setIsProcessing(true);
    setIsVerifying(true);
    setStageProgress(0);
    setStageLabel('⚡ Extracting Claims...');

    try {
      await ensureConnected();
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        showToast('Could not connect. Please try again.');
        setIsProcessing(false);
        setIsVerifying(false);
        return;
      }
      ws.send(JSON.stringify({ content: text, api_key: apiKey }));

      // 60s timeout warning
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setShowTimeoutWarning(true);
      }, TIMEOUT_MS);
    } catch {
      showToast('Connection error. Please try again.');
      setIsProcessing(false);
      setIsVerifying(false);
    }
  }, [ensureConnected, wsRef, openSettingsOnApiTab, showToast]);

  const handleReplyRequest = (text) => setReplyRequest({ id: Date.now(), text });

  const handleTryDemo = () => {
    handleSend('Humans only use 10% of their brains.');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="chat-container">
      {/* Reconnect Banner */}
      {showReconnectBanner && (
        <div className="reconnect-banner">
          <span className="reconnect-spinner" /> Reconnecting...
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="ws-toast">{toastMessage}</div>
      )}

      {isLanding ? (
        <LandingScreen
          onTryDemo={handleTryDemo}
          onPasteClick={() => setInputFocusRequest(Date.now())}
        />
      ) : (
        <div className="chat-feed">
          <div className="chat-messages-wrapper">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} onReply={handleReplyRequest} />
            ))}

            {/* Live: Progress Bar + Stage Label */}
            {isVerifying && (
              <div className="ws-pipeline-block">
                <div className="ws-stage-label">{stageLabel}</div>
                <div className="ws-progress-bar">
                  <div
                    className="ws-progress-fill"
                    style={{ width: `${stageProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Live: Claim Cards */}
            {claimOrder.length > 0 && (
              <div className="live-claims-section">
                {claimOrder.map((id, index) => {
                  const claim = claims[id];
                  if (!claim) return null;
                  return (
                    <LiveClaimCard
                      key={id}
                      claim={claim}
                      index={index}
                    />
                  );
                })}
              </div>
            )}

            {/* Final Report */}
            {finalReport && (
              <FinalReportBlock
                reportData={finalReport}
                query={currentQueryRef.current}
                onViewReport={onViewReport}
              />
            )}

            {/* Timeout Warning */}
            {showTimeoutWarning && (
              <div className="timeout-warning">
                ⏳ Verification is taking longer than usual...
              </div>
            )}

            <div ref={bottomRef} className="chat-bottom-spacer" />
          </div>
        </div>
      )}

      <div className="chat-input-area">
        <InputBar
          onSend={handleSend}
          isProcessing={isProcessing}
          replyRequest={replyRequest}
          focusRequest={inputFocusRequest}
        />
      </div>
    </div>
  );
};

// ─── Live Claim Card ────────────────────────────────────────────────────────
import LiveClaimCardComponent from '../Report/ClaimCard';
const LiveClaimCard = ({ claim, index }) => {
  return <LiveClaimCardComponent claim={claim} index={index} />;
};

// ─── Final Report Block ─────────────────────────────────────────────────────
import TruthMeter from '../Report/TruthMeter';

const AnimatedKpi = ({ end }) => {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    let startTime = null;
    const animate = (t) => {
      if (!startTime) startTime = t;
      const progress = Math.min((t - startTime) / 900, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * end));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(end);
    };
    requestAnimationFrame(animate);
  }, [end]);
  return <span>{count}</span>;
};

const FinalReportBlock = ({ reportData, query, onViewReport }) => {
  const score = Math.round((reportData.overall_score || 0) * 100);
  const aiProb = Math.round((reportData.ai_text_probability || 0) * 100);

  const kpiData = [
    { label: 'Total Claims', value: reportData.total_claims || 0, cls: 'kpi-grid-total' },
    { label: '✓ True',       value: reportData.true_count || 0,   cls: 'kpi-grid-true' },
    { label: '✗ False',      value: reportData.false_count || 0,  cls: 'kpi-grid-false' },
    { label: '~ Partial',    value: reportData.partial_count || 0, cls: 'kpi-grid-partial' },
  ];

  const aiProbLabel = aiProb < 30 ? 'Low' : aiProb < 70 ? 'Medium' : 'High';
  let aiProbColor = '#10b981';
  let aiProbBg = 'rgba(16,185,129,0.06)';
  if (aiProb >= 30 && aiProb < 70) { aiProbColor = '#eab308'; aiProbBg = 'rgba(234,179,8,0.06)'; }
  if (aiProb >= 70) { aiProbColor = '#ef4444'; aiProbBg = 'rgba(239,68,68,0.06)'; }
  const aiProbText = aiProb >= 70
    ? `High (${aiProb}%) — Likely AI Generated`
    : `${aiProbLabel} (${aiProb}%)`;

  // Score-based glow
  const glowColor = score < 40 ? 'rgba(239,68,68,0.12)' : score < 70 ? 'rgba(234,179,8,0.10)' : 'rgba(16,185,129,0.12)';

  return (
    <div
      className="final-report-block-v2 slideUpFadeIn"
      style={{ boxShadow: `0 8px 40px ${glowColor}` }}
    >
      {/* ── TOP ROW ── */}
      <div className="frb-top-row">
        <div className="frb-top-left">
          <span className="frb-title">✦ Verification Complete</span>
          {query && <span className="frb-query">"{query}"</span>}
        </div>
        <span className="frb-timestamp">{new Date().toLocaleString()}</span>
      </div>

      <div className="frb-divider" />

      {/* ── TRUTH METER ── */}
      <TruthMeter score={score} />

      <div className="frb-divider" />

      {/* ── KPI GRID (2x2) ── */}
      <div className="frb-kpi-grid">
        {kpiData.map(({ label, value, cls }) => (
          <div key={label} className={`frb-kpi-cell ${cls}`}>
            <div className="frb-kpi-value"><AnimatedKpi end={value} /></div>
            <div className="frb-kpi-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="frb-divider" />

      {/* ── AI TEXT PROBABILITY ── */}
      <div className="frb-ai-row" style={{ background: aiProbBg }}>
        <span className="frb-ai-left">🤖 AI Text Probability</span>
        <span className="frb-ai-badge" style={{ color: aiProbColor, borderColor: aiProbColor }}>
          {aiProbText}
        </span>
      </div>

      {/* ── FOOTER ── */}
      <div className="frb-footer">
        <span className="frb-footer-brand">Verified by AlethiaAI ✦</span>
        {reportData.report_id && (
          <span className="frb-footer-id">ID: {reportData.report_id.slice(0, 8)}…</span>
        )}
        <button className="frb-view-report-btn" onClick={() => onViewReport?.(reportData, query)}>
          View Full Report →
        </button>
      </div>
    </div>
  );
};

export default ChatThread;

