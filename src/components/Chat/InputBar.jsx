import React, { useState, useEffect, useRef } from 'react';
import { Send, SlidersHorizontal, Search, FileText, Image, FileDigit } from 'lucide-react';

const MODES = [
  { id: 'fact-check', icon: <Search size={14} />, label: 'Fact Check' },
  { id: 'ai-text', icon: <FileText size={14} />, label: 'AI Text Detection' },
  { id: 'ai-image', icon: <Image size={14} />, label: 'AI Image (New)' },
  { id: 'ai-pdf', icon: <FileDigit size={14} />, label: 'AI PDF (New)' },
];

const InputBar = ({ onSend, isProcessing, replyRequest, focusRequest, mode = 'fact-check', setMode }) => {
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [showModes, setShowModes] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    setFile(null);
    setInput('');
  }, [mode]);

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

  useEffect(() => {
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowModes(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isAiText = mode === 'ai-text';
  const isAiFile = mode === 'ai-image' || mode === 'ai-pdf';
  const charCount = input.length;
  const maxChars = 2000;
  
  const handleSend = () => {
    if (isProcessing) return;
    if (isAiFile) {
      if (!file) return;
      onSend(file);
      setFile(null);
    } else {
      const trimmed = input.trim();
      if (isAiText && (trimmed.length < 10 || trimmed.length > maxChars)) return;
      if (!isAiText && trimmed.length > maxChars) return;
      if (!trimmed) return;
      
      onSend(trimmed);
      setInput('');
    }
  };

  const getPlaceholder = () => {
    if (isAiText) return 'Paste text to check if AI generated... (10-2000 chars)';
    return 'Paste a claim or news URL...';
  };

  const getCharColor = () => {
    if (isAiText && charCount < 10) return 'var(--text-tertiary)';
    if (charCount <= 1600) return '#10b981';
    if (charCount <= 1900) return '#eab308';
    return '#ef4444';
  };

  const isSendDisabled = isProcessing || (isAiFile ? !file : (isAiText ? (charCount < 10 || charCount > maxChars) : (!input.trim() || charCount > maxChars)));

  return (
    <div className="input-bar-container">
      {/* Modes list inside the chat-input area but position adjusted via CSS */}
      <div className="input-wrapper" style={{ position: 'relative', overflow: 'visible' }}>
        
        <div className="mode-selector-wrapper" ref={popoverRef} style={{ position: 'relative' }}>
          <button 
            className={`filter-icon-btn ${showModes ? 'active' : ''}`} 
            onClick={() => setShowModes(p => !p)}
            title="Select Mode"
          >
            <SlidersHorizontal size={16} />
          </button>
          
          {showModes && (
            <div className="mode-popover" style={{
              position: 'absolute', bottom: 'calc(100% + 12px)', left: '-10px',
              background: 'var(--card-bg)', border: '1px solid var(--card-border)',
              borderRadius: '12px', padding: '6px', minWidth: '180px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 300,
              display: 'flex', flexDirection: 'column', gap: '2px',
              animation: 'popoverIn 0.15s ease'
            }}>
              {MODES.map(m => {
                const disabled = m.id === 'ai-image' || m.id === 'ai-pdf';
                const selected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (!disabled) { setMode?.(m.id); setShowModes(false); }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: '8px', border: 'none',
                      background: selected ? 'var(--accent-unverifiable)' : 'transparent',
                      color: selected ? '#fff' : (disabled ? 'var(--text-tertiary)' : 'var(--text-secondary)'),
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem', width: '100%', textAlign: 'left',
                      transition: 'all 0.15s',
                      opacity: disabled ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) e.currentTarget.style.background = 'var(--input-bg)';
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ display: 'flex' }}>{m.icon}</span>
                    <span style={{ flex: 1 }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        <span className="input-divider" />
        
        {isAiFile ? (
          <div 
            className="chat-input" 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              display: 'flex', alignItems: 'center', cursor: 'pointer',
              color: file ? 'var(--text-primary)' : 'var(--text-tertiary)',
              paddingLeft: '12px'
            }}
          >
            {file ? file.name : `Click to select ${mode === 'ai-image' ? 'an image' : 'a PDF'} file...`}
            <input
              ref={fileInputRef}
              type="file"
              accept={mode === 'ai-image' ? 'image/*' : '.pdf'}
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder={getPlaceholder()}
            value={input}
            onChange={(e) => {
              if (e.target.value.length > maxChars) return;
              setInput(e.target.value);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isProcessing}
          />
        )}
        
        <button 
          className={`send-btn ${!isSendDisabled ? 'active' : ''}`} 
          onClick={handleSend} 
          disabled={isSendDisabled}
        >
          <Send size={15} style={{ marginLeft: '-1px' }} />
        </button>
      </div>

      <div style={{ color: getCharColor(), fontSize: '0.75rem', marginTop: '6px', textAlign: 'right', paddingRight: '12px', transition: 'color 0.2s', fontWeight: 500, opacity: charCount > 0 || isAiText ? 1 : 0 }}>
        {charCount} / {maxChars}
      </div>
    </div>
  );
};

export default InputBar;
