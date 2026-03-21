import React from 'react';
import { CornerUpLeft } from 'lucide-react';
import PipelineSteps from './PipelineSteps';
import ReportCard from '../Report/ReportCard';
import TypewriterText from './TypewriterText';

const MessageBubble = ({ message, onReply }) => {
  const ts = <span className="message-time">{message.timestamp}</span>;

  const handleReply = () => {
    const text = message.type === 'report'
      ? `Regarding the verification report for "${message.claimData?.text?.substring(0, 60)}..." `
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

  if (message.type === 'pipeline') {
    return (
      <div className="message message-ai">
        <div className="avatar ai-avatar">◈</div>
        <div className="message-content-wrapper">
          <PipelineSteps steps={message.steps} activeStep={message.activeStep} />
        </div>
      </div>
    );
  }

  if (message.type === 'report') {
    return (
      <div className="message message-ai slideUpFadeIn">
        <div className="avatar ai-avatar">◈</div>
        <div className="message-content-wrapper">
          <div className="report-wrapper">
            <ReportCard claim={message.claimData} />
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

  // Default AI text message
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
