import React from 'react';
import { CornerUpLeft } from 'lucide-react';
import ClaimCard from '../Report/ClaimCard';
import TruthMeter from '../Report/TruthMeter';
import KpiCounters from '../Report/KpiCounters';
import TypewriterText from './TypewriterText';

const MessageBubble = ({ message, onReply }) => {
  const ts = <span className="message-time">{message.timestamp}</span>;

  const handleReply = () => {
    const text = message.type === 'saved-report'
      ? `Regarding the saved report: "${message.reportData?.title || 'report'}" `
      : `Regarding your previous answer: "${message.content?.substring(0, 60)}..." `;
    onReply(text);
  };

  if (message.type === 'user') {
    return (
      <div className="message message-user slideUpFadeIn">
        <div className="message-content-wrapper right-align">
          <div className="bubble user-bubble">{message.content}</div>
          {ts}
        </div>
        <div className="avatar user-avatar">U</div>
      </div>
    );
  }

  // Read-only saved report view (from sidebar click)
  if (message.type === 'saved-report') {
    const report = message.reportData;
    const score = report.overall_score ?? 0;
    const aiProb = Math.round((report.ai_text_probability || 0) * 100);
    const kpis = {
      total: report.total_claims || 0,
      true: report.true_count || 0,
      false: report.false_count || 0,
      partial: report.partial_count || 0,
      unverifiable: report.unverifiable_count || 0,
    };
    const aiProbColor = aiProb < 30 ? 'var(--accent-true)' : aiProb <= 70 ? 'var(--accent-partial)' : 'var(--accent-false)';

    return (
      <div className="message message-ai slideUpFadeIn">
        <div className="avatar ai-avatar">◈</div>
        <div className="message-content-wrapper">
          <div className="saved-report-view">
            <div className="final-report-block">
              <div className="final-report-header">
                <span className="final-report-title">Saved Report</span>
                <span className="final-report-time">{message.timestamp}</span>
              </div>
              <div className="report-dashboard">
                <TruthMeter score={score} />
                <KpiCounters kpis={kpis} />
              </div>
              {aiProb > 0 && (
                <div className="ai-prob-badge" style={{ borderColor: aiProbColor, color: aiProbColor }}>
                  🤖 AI Generated Probability: {aiProb}%
                </div>
              )}
            </div>

            {/* Claim list — expanded style */}
            {(report.claims || []).map((c, i) => (
              <ClaimCard
                key={c.claim_id || i}
                claim={{
                  ...c,
                  status: 'verified',
                  conflicting: c.conflicting || false,
                  sources: c.sources || [],
                }}
                index={i}
              />
            ))}

            <div className="report-footer">Verified by AlethiaAI</div>
          </div>
          {ts}
        </div>
      </div>
    );
  }

  if (message.type === 'typing') {
    return (
      <div className="message message-ai">
        <div className="avatar ai-avatar">◈</div>
        <div className="message-content-wrapper">
          <div className="typing-indicator">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  // Default: plain AI text message
  return (
    <div className="message message-ai slideUpFadeIn">
      <div className="avatar ai-avatar">◈</div>
      <div className="message-content-wrapper">
        <div className="bubble ai-bubble">
          {message.isStreaming
            ? <TypewriterText text={message.content} delay={35} />
            : message.content
          }
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          {ts}
          <button className="reply-btn" onClick={handleReply}>
            <CornerUpLeft size={12} /> Reply
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
