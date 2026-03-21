import React, { useState, useEffect, useRef } from 'react';
import { Link as LinkIcon, Type, Send, Download, Share, RefreshCw, SlidersHorizontal } from 'lucide-react';

const InputBar = ({ onSend, isProcessing, replyRequest, focusRequest }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (replyRequest) {
      setInput(replyRequest.text);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [replyRequest]);

  useEffect(() => {
    if (focusRequest) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [focusRequest]);

  const isUrl = (text) => { try { new URL(text); return true; } catch { return false; } };
  const modeIsUrl = isUrl(input);

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="input-bar-container">
      <div className="input-actions-top">
        <button className="action-tag"><Download size={13} /> Download</button>
        <button className="action-tag"><Share size={13} /> Share</button>
        <button className="action-tag"><RefreshCw size={13} /> Re-verify</button>
      </div>
      <div className="input-wrapper">
        <button className="filter-icon-btn" title="Filters">
          <SlidersHorizontal size={16} />
        </button>
        <span className="input-divider" />
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Type a claim or paste a link"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isProcessing}
        />
        <span className="mode-badge">
          {modeIsUrl ? <LinkIcon size={13} /> : <Type size={13} />}
          {modeIsUrl ? ' URL' : ' TEXT'}
        </span>
        <button className={`send-btn ${input.trim() ? 'active' : ''}`} onClick={handleSend} disabled={isProcessing}>
          <Send size={15} style={{ marginLeft: '-1px' }} />
        </button>
      </div>
    </div>
  );
};

export default InputBar;
