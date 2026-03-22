import React, { useState, useEffect, useRef } from 'react';
import { Send, SlidersHorizontal, Search, FileText, Image, FileDigit } from 'lucide-react';
import '../styles/landing.css';

const MODES = [
  { id: 'fact-check', icon: <Search size={14} />, label: 'Fact Check' },
  { id: 'ai-text', icon: <FileText size={14} />, label: 'AI Text Detection' },
  { id: 'ai-image', icon: <Image size={14} />, label: 'AI Image (New)' },
  { id: 'ai-pdf', icon: <FileDigit size={14} />, label: 'AI PDF (New)' },
];

const LandingScreen = ({ onSend, mode = 'fact-check', setMode }) => {
  const [value, setValue] = useState('');
  const [file, setFile] = useState(null);
  const [showModes, setShowModes] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    setFile(null);
    setValue('');
  }, [mode]);

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
  const charCount = value.length;
  const maxChars = 2000;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAiFile) {
      if (!file) return;
      onSend?.(file);
    } else {
      const trimmed = value.trim();
      if (isAiText && (trimmed.length < 10 || trimmed.length > maxChars)) return;
      if (!isAiText && trimmed.length > maxChars) return;
      if (!trimmed) return;
      onSend?.(trimmed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
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

  const isSendDisabled = isAiFile ? !file : (isAiText ? (charCount < 10 || charCount > maxChars) : (!value.trim() || charCount > maxChars));

  return (
    <div className="landing-screen">
      <div className="landing-content">
        <div className="landing-logo">
          <span className="landing-logo-symbol">◈</span>
        </div>

        <h1 className="landing-heading">Truth is One Query Away</h1>
        <p className="landing-subtitle">
          Paste any claim or news URL —<br />
          AlethiaAI verifies it across multiple<br />
          sources instantly
        </p>

        <form className="landing-input-wrap" onSubmit={handleSubmit}>
          <div className="landing-input-inner">
            
            <div className="landing-mode-selector" ref={popoverRef}>
              <button 
                type="button"
                className={`filter-icon-btn ${showModes ? 'active' : ''}`} 
                onClick={() => setShowModes(p => !p)}
                title="Select Mode"
              >
                <SlidersHorizontal size={20} />
              </button>
              
              {showModes && (
                <div className="mode-popover">
                  {MODES.map(m => {
                    const disabled = m.disabled;
                    const selected = mode === m.id;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => {
                          if (!disabled) { setMode?.(m.id); setShowModes(false); }
                        }}
                        className={`mode-option ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                        disabled={disabled}
                      >
                        <span className="mode-icon-span">{m.icon}</span>
                        <span className="mode-label-span">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="input-divider" />

            {isAiFile ? (
              <div 
                className="landing-input" 
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  display: 'flex', alignItems: 'center', cursor: 'pointer',
                  color: file ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  paddingLeft: '11px'
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
                className="landing-input"
                type="text"
                value={value}
                onChange={(e) => {
                  if (e.target.value.length > maxChars) return;
                  setValue(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                autoFocus
              />
            )}

            <button
              className="landing-send-btn"
              type="submit"
              disabled={isSendDisabled}
              aria-label="Send"
            >
              <div className="send-btn-inner">
                <Send size={18} style={{ marginLeft: '-2px' }} />
              </div>
            </button>
          </div>
          
          <div className={`landing-char-count ${charCount > 0 || isAiText ? 'visible' : ''}`} style={{ color: getCharColor() }}>
            {charCount} / {maxChars}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LandingScreen;
