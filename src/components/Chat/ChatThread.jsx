import React, { useState, useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import LandingScreen from '../LandingScreen';
import '../../styles/chatbox.css';
import '../../styles/landing.css';
import '../../styles/chatthread.css';
import useReportStore from '../../store/useReportStore';
import useWSStore from '../../store/useWSStore';
import useAppStore from '../../store/useAppStore';
import { sendMessage } from '../../services/wsManager';
import { detectText, detectImage, detectPdf } from '../../services/api';

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

const ChatThread = ({ openSettingsOnApiTab, onViewReport }) => {
  // Zustand State
  const messages = useWSStore((s) => s.messages);
  const isProcessing = useWSStore((s) => s.isProcessing);
  const pipelineStage = useWSStore((s) => s.pipelineStage);
  const stageProgress = useWSStore((s) => s.pipelineProgress);
  const claims = useWSStore((s) => s.claims);
  const claimOrder = useWSStore((s) => s.claimOrder);
  const finalReport = useWSStore((s) => s.finalReport);
  const currentQuery = useWSStore((s) => s.currentQuery);
  const error = useWSStore((s) => s.error);
  const isVerifying = isProcessing && !finalReport && !error;

  // Local State
  const [replyRequest, setReplyRequest] = useState(null);
  const [inputFocusRequest, setInputFocusRequest] = useState(null);
  const [inputMode, setInputMode] = useState('fact-check');
  const [toastMessage, setToastMessage] = useState('');

  const defaultStage = inputMode !== 'fact-check' ? '🔬 Analyzing...' : '⚡ Processing...';
  const stageLabel = pipelineStage ? (STAGE_LABELS[pipelineStage] || pipelineStage) : defaultStage;
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [showReconnectBanner, setShowReconnectBanner] = useState(false); // To satisfy old usages

  const bottomRef = useRef(null);
  const timeoutRef = useRef(null);
  const currentQueryModeRef = useRef('fact-check');

  const isLanding = messages.length === 0;

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, [messages, claims, finalReport]);

  const showToast = useCallback((msg, duration = 4000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), duration);
  }, []);

  const handleSend = useCallback(async (textOrFile) => {
    console.log('SEND BUTTON CLICKED', textOrFile);
    
    const apiKey = useAppStore.getState().apiKey || localStorage.getItem('alethia_api_key') || '';
    if (!apiKey.trim()) {
      openSettingsOnApiTab('Please add your API key to continue');
      return;
    }

    const store = useWSStore.getState();
    store.resetClaims();
    store.setProcessing(true);
    
    const queryStr = typeof textOrFile === 'string' ? textOrFile : textOrFile.name;
    store.setCurrentQuery(queryStr);

    setShowTimeoutWarning(false);
    currentQueryModeRef.current = inputMode;

    const msgId = Date.now();
    const displayContent = typeof textOrFile === 'string' ? textOrFile : `📎 Uploaded ${textOrFile.name}`;
    store.addMessage({ id: msgId, type: 'user', content: displayContent, timestamp: getTime() });

    try {
      if (inputMode === 'fact-check') {
        const payload = { content: textOrFile, api_key: apiKey };
        await sendMessage(payload);

        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setShowTimeoutWarning(true);
        }, TIMEOUT_MS);
      } else {
        // AI Detection Modes
        let result;
        if (inputMode === 'ai-text') {
           result = await detectText(textOrFile, apiKey);
        } else if (inputMode === 'ai-image') {
           result = await detectImage(textOrFile, apiKey);
        } else if (inputMode === 'ai-pdf') {
           result = await detectPdf(textOrFile, apiKey);
        }
        
        const previewUrl = (inputMode === 'ai-image' && typeof textOrFile !== 'string') 
            ? URL.createObjectURL(textOrFile) 
            : null;

        const reportObj = {
          report_id: result.id,
          ai_text_probability: result.ai_probability, 
          result_status: result.result,
          confidence: result.confidence,
          signals: result.signals,
          processing_time_ms: result.processing_time_ms,
          previewUrl
        };
        store.setProcessing(false);
        store.setFinalReport(reportObj);
      }
    } catch (err) {
      console.error('API/WS Error:', err);
      // Fetch throws TypeError on network failure
      if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
        showToast('Could not connect');
      } else {
        showToast(err.message || 'Server error, try again');
      }
      store.setProcessing(false);
    }
  }, [openSettingsOnApiTab, showToast, inputMode]);

  const handleReplyRequest = (text) => setReplyRequest({ id: Date.now(), text });

  return (
    <div className="chat-container">
      {showReconnectBanner && (
        <div className="reconnect-banner">
          <span className="reconnect-spinner" /> Reconnecting...
        </div>
      )}

      {toastMessage && (
        <div className="ws-toast">{toastMessage}</div>
      )}

      {isLanding ? (
        <LandingScreen onSend={handleSend} mode={inputMode} setMode={setInputMode} />
      ) : (
        <div className="chat-feed">
          <div className="chat-messages-wrapper">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} onReply={handleReplyRequest} />
            ))}

            {error && (
              <div className="ct-verification-error-container">
                <div className="ct-verification-error-title">Verification Error</div>
                <div className="ct-verification-error-msg">{error}</div>
              </div>
            )}

            {isVerifying && currentQueryModeRef.current !== 'ai-text' && currentQueryModeRef.current !== 'ai-image' && currentQueryModeRef.current !== 'ai-pdf' && (
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

            {isVerifying && currentQueryModeRef.current === 'ai-text' && (
              <AITextAnalyzingCard />
            )}

            {/* In AI Text Mode, DO NOT show claims */}
            {currentQueryModeRef.current !== 'ai-text' && claimOrder.length > 0 && (
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
              finalReport.isDeleted ? (
                <div className="ct-report-deleted-container">
                  <div className="ct-report-deleted-title">
                    🗑️ Report Deleted
                  </div>
                  <div className="ct-report-deleted-query">
                    <strong>Query:</strong> "{currentQuery || 'this claim'}"
                  </div>
                  <div className="ct-report-deleted-desc">
                    This report has been deleted.
                  </div>
                  <button 
                    onClick={() => handleReplyRequest(currentQuery)}
                    className="ct-reverify-btn"
                  >
                    🔄 Re-verify this claim
                  </button>
                </div>
              ) : currentQueryModeRef.current !== 'fact-check' ? (
                <AIDetectionResultCard reportData={finalReport} query={currentQuery} mode={currentQueryModeRef.current} />
              ) : (
                <FinalReportBlock
                  reportData={finalReport}
                  query={currentQuery}
                  onViewReport={onViewReport}
                />
              )
            )}

            {showTimeoutWarning && (
              <div className="timeout-warning">
                ⏳ Verification is taking longer than usual...
              </div>
            )}

            <div ref={bottomRef} className="chat-bottom-spacer" />
          </div>
        </div>
      )}

      {!isLanding && (
        <div className="chat-input-area">
          <InputBar
            onSend={handleSend}
            isProcessing={isProcessing}
            replyRequest={replyRequest}
            focusRequest={inputFocusRequest}
            mode={inputMode}
            setMode={setInputMode}
          />
        </div>
      )}
    </div>
  );
};

// ─── Live Claim Card ────────────────────────────────────────────────────────
import LiveClaimCardComponent from '../Report/ClaimCard';
const LiveClaimCard = ({ claim, index }) => {
  return <LiveClaimCardComponent claim={claim} index={index} />;
};

// ─── AI Text Analyzing Card ──────────────────────────────────────────────────
const AITextAnalyzingCard = () => {
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = [
    "Scanning writing patterns...",
    "Checking sentence structure...",
    "Comparing AI signatures...",
    "Finalizing analysis..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="ai-text-analyzing-card">
      <div className="ai-analyzing-title">🤖 Analysing Text...</div>
      <div className="ai-analyzing-shimmer-bar">
        <div className="ai-analyzing-shimmer-fill" />
      </div>
      <div className="ai-analyzing-msg">{messages[msgIdx]}</div>
    </div>
  );
};


// ─── AI Detection Result Card ──────────────────────────────────────────────────
const AIDetectionResultCard = ({ reportData, query, mode }) => {
  const [animTime, setAnimTime] = useState(0);
  const [animProb, setAnimProb] = useState(0);
  
  const aiProb = Math.round((reportData.confidence || 0) * 100);
  const totalTimeSec = ((reportData.processing_time_ms || 0) / 1000).toFixed(1);
  const resultStatus = reportData.result_status || 'uncertain';
  const signals = reportData.signals || [];
  
  useEffect(() => {
    let startTime = null;
    const animate = (t) => {
      if (!startTime) startTime = t;
      const progress = Math.min((t - startTime) / 800, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setAnimTime((ease * parseFloat(totalTimeSec)).toFixed(1));
      setAnimProb(Math.round(ease * aiProb));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [totalTimeSec, aiProb]);

  let typeName = mode === 'ai-image' ? 'Image' : mode === 'ai-pdf' ? 'Document' : 'Text';
  let label = 'Uncertain / Mixed Signals';
  let colorClass = 'ai-mixed';
  let headerIcon = '🟡';
  let titleIcon = mode === 'ai-image' ? '' : mode === 'ai-pdf' ? '📄' : '';
  
  if (resultStatus === 'ai_generated') {
    label = `Likely AI Generated ${typeName}`;
    colorClass = 'ai-ai';
    headerIcon = '🔴';
  } else if (resultStatus === 'human_written') {
    label = mode === 'ai-image' ? 'Likely Real Image' : `Likely Human Written ${typeName}`;
    colorClass = 'ai-human';
    headerIcon = '🟢';
  }

  const rotation = (animProb / 100) * 180 - 90;

  return (
      <div className={`ai-text-result-card ${colorClass}`}>
        <div className="ai-img-header-row">
          <div className="ai-img-header-left">
            <div className={`ai-img-badge ai-banner-${colorClass}`}>
              {headerIcon} {label}
            </div>
            <div className="ai-text-title ct-ai-text-title">{titleIcon} AI {typeName} Analysis</div>
            {mode === 'ai-text' ? (
              <div className="ai-text-query-scrollable">{query}</div>
            ) : (
              <div className="ai-text-query">{query}</div>
            )}
          </div>
          
          <div className="ai-img-header-right">
            <div className="ai-text-gauge-container ct-ai-gauge-wrapper">
              <svg viewBox="0 0 200 110" className="ai-gauge-svg">
                <path d="M 15 95 A 80 80 0 0 1 185 95" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" strokeLinecap="round" />
                <defs>
                  <linearGradient id="aiGaugeGradImage" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                <path d="M 15 95 A 80 80 0 0 1 185 95" fill="none" stroke="url(#aiGaugeGradImage)" strokeWidth="16" strokeLinecap="round" 
                  strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * animProb / 100)} 
                  className="ai-gauge-fill-path" />
              </svg>
              <div className="ai-gauge-needle ct-ai-gauge-needle" style={{ transform: `rotate(${rotation}deg)` }}>
                <div className="ai-needle-base ct-ai-needle-base"></div>
                <div className="ai-needle-point ct-ai-needle-point"></div>
              </div>
              
              <div className="ai-gauge-center-text ct-ai-gauge-center">
                <div className="ai-gauge-score ct-ai-gauge-score">{animProb}%</div>
                <div className="ai-gauge-label ct-ai-gauge-label">PROBABILITY</div>
              </div>
            </div>
          </div>
        </div>
      
      <div className="ai-text-divider" />
      
      {reportData.previewUrl && (
        <div className="ai-img-preview-container">
          <img src={reportData.previewUrl} alt="Analyzed" />
        </div>
      )}

      {signals && signals.length > 0 && (
        <div className="ai-img-signals-container">
          <div className="ai-img-signals-title">🔬 Detection Reasoning</div>
          <ul className="ai-img-signals-list">
            {signals.map((sig, i) => (
              <li key={i}>{sig}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="ai-img-footer">
        <span className="ai-img-time-badge">⏱️ {animTime}s</span>
        <span className="ai-text-timestamp">Analyzed: {new Date().toLocaleString()}</span>
      </div>
    </div>
  );
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

  const glowColor = score < 40 ? 'rgba(239,68,68,0.12)' : score < 70 ? 'rgba(234,179,8,0.10)' : 'rgba(16,185,129,0.12)';

  return (
    <div
      className="final-report-block-v2 slideUpFadeIn"
      style={{ boxShadow: `0 8px 40px ${glowColor}` }}
    >
      <div className="frb-top-row">
        <div className="frb-top-left">
          <span className="frb-title">✦ Verification Complete</span>
          {query && <span className="frb-query">"{query}"</span>}
        </div>
        <span className="frb-timestamp">{new Date().toLocaleString()}</span>
      </div>

      <div className="frb-divider" />

      <TruthMeter score={score} />

      <div className="frb-divider" />

      <div className="frb-kpi-grid">
        {kpiData.map(({ label, value, cls }) => (
          <div key={label} className={`frb-kpi-cell ${cls}`}>
            <div className="frb-kpi-value"><AnimatedKpi end={value} /></div>
            <div className="frb-kpi-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="frb-divider" />

      <div className="frb-ai-row" style={{ background: aiProbBg }}>
        <span className="frb-ai-left">AI Text Probability</span>
        <span className="frb-ai-badge" style={{ color: aiProbColor, borderColor: aiProbColor }}>
          {aiProbText}
        </span>
      </div>

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
