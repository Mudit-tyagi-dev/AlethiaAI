import React, { useState, useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import LandingScreen from '../LandingScreen';
import GaugeMeter from '../GaugeMeter';
import '../../styles/chatbox.css';
import '../../styles/landing.css';
import '../../styles/chatthread.css';
import useReportStore from '../../store/useReportStore';
import useWSStore from '../../store/useWSStore';
import useAppStore from '../../store/useAppStore';
import { sendMessage } from '../../services/wsManager';
import { detectText, detectImage, detectPdf } from '../../services/api';
import { Download, FileText, Share2 } from 'lucide-react';



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
  const errorMessage = useWSStore((s) => s.errorMessage);
  const isVerifying = isProcessing && !finalReport && !error;

  // Local State
  const [replyRequest, setReplyRequest] = useState(null);
  const [inputFocusRequest, setInputFocusRequest] = useState(null);
  const [inputMode, setInputMode] = useState('fact-check');
  const [toastMessage, setToastMessage] = useState('');

  const defaultStage = inputMode !== 'fact-check' ? '🔬 Analyzing...' : '⚡ Processing...';
  const stageLabel = pipelineStage ? (STAGE_LABELS[pipelineStage] || pipelineStage) : defaultStage;
  const [showReconnectBanner, setShowReconnectBanner] = useState(false); // To satisfy old usages

  const bottomRef = useRef(null);
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
    
    const apiKey = useAppStore.getState().apiKey || localStorage.getItem('factly_api_key') || '';
    if (!apiKey.trim()) {
      openSettingsOnApiTab('Please add your API key to continue');
      return;
    }

    const store = useWSStore.getState();
    store.resetClaims();
    store.setErrorMessage(null);
    store.setProcessing(true);
    
    const queryStr = typeof textOrFile === 'string' ? textOrFile : textOrFile.name;
    store.setCurrentQuery(queryStr);

    currentQueryModeRef.current = inputMode;

    const msgId = Date.now();
    const displayContent = typeof textOrFile === 'string' ? textOrFile : `📎 Uploaded ${textOrFile.name}`;
    store.addMessage({ id: msgId, type: 'user', content: displayContent, timestamp: getTime() });

    try {
      if (inputMode === 'fact-check') {
        const payload = { action: 'verify', content: textOrFile, api_key: apiKey };
        await sendMessage(payload);
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
          result_status: result.result,
          confidence: result.confidence,
          signals: result.signals,
          processing_time_ms: result.processing_time_ms,
          previewUrl
        };
        store.setFinalReport(reportObj);
        store.setProcessing(false);
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

            {errorMessage?.type === 'api_exhausted' && (
              <APIExhaustedCard onUpdateClick={() => openSettingsOnApiTab()} />
            )}

            {errorMessage?.type === 'no_claims' && (
              <NoClaimsCard />
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
  
  const rawValue = reportData.confidence || 0;
  const aiProb = Math.round(rawValue * 100);
  const totalTimeSec = ((reportData.processing_time_ms || 0) / 1000).toFixed(1);
  
  let resultStatus = reportData.result_status || 'uncertain';
  if (mode === 'ai-text' && !reportData.result_status) {
    if (rawValue < 0.3) resultStatus = 'human_written';
    else if (rawValue > 0.7) resultStatus = 'ai_generated';
    else resultStatus = 'uncertain';
  }
  
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
  let label = 'Uncertain Signals';
  let colorClass = 'ai-mixed';
  let headerIcon = '🟡';
  
  if (resultStatus === 'ai_generated') {
    label = 'Likely AI Generated';
    colorClass = 'ai-ai';
    headerIcon = '🔴';
  } else if (resultStatus === 'human_written') {
    label = mode === 'ai-image' ? 'Likely Real Image' : 'Likely Human Written';
    colorClass = 'ai-human';
    headerIcon = '🟢';
  }

  const confidenceColor = resultStatus === 'human_written' ? '#10b981' : resultStatus === 'uncertain' ? '#eab308' : '#ef4444';

  const dateObj = new Date();
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className={`ai-text-result-card ${colorClass}`}>
      <div className="ai-img-header-v3">
        <div className="ai-img-header-left-v3">
          <div className={`gauge-badge gauge-badge--${resultStatus.replace('_', '-')}`} style={{ marginBottom: '12px', alignSelf: 'flex-start' }}>
            <span className="badge-dot-mini" />
            {label}
          </div>
          <div className="ai-text-title ct-ai-text-title">AI {typeName} Analysis</div>
          {mode === 'ai-text' ? (
            <div className="ai-text-query-scrollable">{query}</div>
          ) : (
            <div className="ai-text-query">{query}</div>
          )}
          
          <div className="ai-img-footer-v3" style={{ borderTop: 'none', marginTop: '12px', paddingTop: 0 }}>
            <div className="footer-left">
              <span>⏱️ {animTime}s</span>
              <span style={{ opacity: 0.5, margin: '0 8px' }}>•</span>
              <span>{formattedDate} {formattedTime}</span>
            </div>
          </div>
        </div>

        <div className="ai-img-header-right-v3">
          <GaugeMeter 
            value={Math.round((reportData.confidence || 0) * 100)} 
            result={resultStatus} 
          />
        </div>
      </div>

      <div className="ai-confidence-bar-section-v4">
        <div className="ai-confidence-label-v4">AI CONFIDENCE</div>
        <div className="ai-confidence-row-v4">
          <div className="ai-confidence-track-v4">
            <div 
              className="ai-confidence-fill-v4" 
              style={{ 
                width: `${Math.round((reportData.confidence || 0) * 100)}%`, 
                background: confidenceColor,
                boxShadow: `0 0 10px ${confidenceColor}44`
              }} 
            />
          </div>
          <div className="ai-confidence-value-v4" style={{ color: confidenceColor }}>
            {animProb}%
          </div>
        </div>
      </div>

      {reportData.previewUrl && (
        <div className="ai-img-preview-container" style={{ marginTop: '10px', marginBottom: '20px' }}>
          <img src={reportData.previewUrl} alt="Analyzed" />
        </div>
      )}

      <div className="ai-img-content-v3">
        {signals && signals.length > 0 && (
          <div className="ai-img-signals-container-v3">
            <div className="ai-img-signals-title-v3">🔍 SIGNALS (Reasoning):</div>
            <ul className="ai-img-signals-list-v3">
              {signals.map((sig, i) => (
                <li key={i}>• {sig}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};


// ─── Final Report Block ─────────────────────────────────────────────────────
import TruthMeter from '../Report/TruthMeter';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PDFReport from '../Report/PDFReport';

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
  const claims = reportData.claims || [];
  
  const stats = {
    total: claims.length,
    true: claims.filter(c => c.verdict === "True").length,
    false: claims.filter(c => c.verdict === "False").length,
    partial: claims.filter(c => c.verdict === "Partial").length,
    unverifiable: claims.filter(c => c.verdict === "Unverifiable").length,
  };

  const score = claims.length === 0 ? null : (reportData.overall_score || 0) * 100;
  const aiProb = Math.round((reportData.ai_text_probability || 0) * 100);

  const kpiData = [
    { label: 'Total',        value: stats.total,        type: 'total' },
    { label: 'True',         value: stats.true,         type: 'true' },
    { label: 'False',        value: stats.false,        type: 'false' },
    { label: 'Partial',      value: stats.partial,      type: 'partial' },
    { label: 'Unverifiable', value: stats.unverifiable, type: 'unverifiable' },
  ];

  const aiProbLabel = aiProb < 30 ? 'Low' : aiProb < 70 ? 'Medium' : 'High';
  let aiProbColor = '#10b981';
  if (aiProb >= 30 && aiProb < 70) aiProbColor = '#eab308';
  if (aiProb >= 70) aiProbColor = '#ef4444';
  
  const aiProbText = aiProb >= 70
    ? `High (${aiProb}%) — Likely AI Generated`
    : `${aiProbLabel} (${aiProb}%)`;

  const glowColor = score === null ? 'rgba(255,255,255,0.05)' : score < 40 ? 'rgba(239,68,68,0.15)' : score < 70 ? 'rgba(234,179,8,0.12)' : 'rgba(16,185,129,0.15)';

  return (
    <div
      className="vc-card slideUpFadeIn"
      style={{ '--score-glow': glowColor }}
    >
      <div className="vc-header">
        <div className="vc-header-left">
          <h3 className="vc-title">✦ Verification Complete</h3>
          {query && <p className="vc-query">"{query}"</p>}
        </div>
        <div className="vc-timestamp">{new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      <div className="vc-divider" />

      <div className="vc-meter-section">
        <TruthMeter score={score} />
      </div>

      <div className="vc-divider" />

      <div className="vc-kpi-grid">
        {kpiData.map((kpi) => (
          <div key={kpi.label} className={`vc-kpi-cell vc-kpi-${kpi.type}`}>
            <div className="vc-kpi-value">
              <AnimatedKpi end={kpi.value} />
            </div>
            <div className="vc-kpi-label">
              {kpi.type === 'true' && '✓ '}
              {kpi.type === 'false' && '✗ '}
              {kpi.type === 'partial' && '~ '}
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      <div className="vc-divider" />

      <div className="vc-ai-row">
        <div className="vc-ai-label">🤖 AI Text Probability</div>
        <div className="vc-ai-badge" style={{ color: aiProbColor, borderColor: `${aiProbColor}44`, background: `${aiProbColor}12` }}>
          {aiProbText}
        </div>
      </div>

      <div className="vc-footer">
        <div className="vc-footer-brand">Verified by Factly AI ✦</div>
        <div className="vc-footer-actions">
          <PDFDownloadLink 
            document={<PDFReport reportData={reportData} query={query} />} 
            fileName={`factly-report-${reportData.id?.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`}
            style={{ textDecoration: 'none' }}
          >
            {({ blob, url, loading, error }) => (
              <button className="vc-export-btn" disabled={loading}>
                <Download size={14} />
                <span>{loading ? '...' : 'Export'}</span>
              </button>
            )}
          </PDFDownloadLink>
          <button className="vc-view-report-btn" onClick={() => onViewReport?.(reportData, query)}>
            View Report →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatThread;

// ─── API Exhausted Card ──────────────────────────────────────────────────
const APIExhaustedCard = ({ onUpdateClick }) => {
  return (
    <div className="api-exhausted-card">
      <div className="api-exhausted-header">
        <span className="api-exhausted-title">⚠️ API Limit Reached</span>
      </div>
      <p className="api-exhausted-text">
        Your API key has exceeded its usage quota. Please update your API key to continue verifying claims.
      </p>
      <button className="api-exhausted-btn" onClick={onUpdateClick}>
        🔑 Update API Key →
      </button>
    </div>
  );
};

// ─── No Claims Card ──────────────────────────────────────────────────────
const NoClaimsCard = () => {
  return (
    <div className="no-claims-card">
      <div className="no-claims-header">
        <span className="no-claims-title">🔍 No Claims Found</span>
      </div>
      <p className="no-claims-text">
        We couldn't find any verifiable factual claims in this text. Try submitting a statement with clear facts.
      </p>
    </div>
  );
};
