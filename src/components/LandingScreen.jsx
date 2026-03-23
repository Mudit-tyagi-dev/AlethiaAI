import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronDown, Search, FileText, Image, FileDigit, Check, X, Upload } from 'lucide-react';
import FileUploadModal from './Chat/FileUploadModal';
import '../styles/landing.css';

const MODES = [
  { id: 'fact-check', icon: <Search size={14} />, label: 'Fact Check' },
  { id: 'ai-text', icon: <FileText size={14} />, label: 'AI Text Detection' },
  { id: 'ai-image', icon: <Image size={14} />, label: 'AI Image' },
  { id: 'ai-pdf', icon: <FileDigit size={14} />, label: 'AI PDF' },
];

const LandingScreen = ({ onSend, mode = 'fact-check', setMode }) => {
  const [value, setValue] = useState('');
  const [file, setFile] = useState(null);
  const [showModes, setShowModes] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const inputRef = useRef(null);
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModes) {
        setShowModes(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModes]);

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
    return 'Verify any Fact, Text or URL...';
  };

  const getCharColor = () => {
    if (isAiText && charCount > 0 && charCount < 100) return '#ef4444';
    if (charCount === 0 && isAiText) return 'var(--text-tertiary)';
    const warningLimit = isAiText ? 8000 : 1600;
    const dangerLimit = isAiText ? 9500 : 1900;
    if (charCount <= warningLimit) return '#10b981';
    if (charCount <= dangerLimit) return '#eab308';
    return '#ef4444';
  };

  const isSendDisabled = isAiFile ? true : (isAiText ? (charCount < 100 || charCount > maxChars) : (!value.trim() || charCount > maxChars));
  const activeModeObj = MODES.find(m => m.id === mode) || MODES[0];

  return (
    <div className="landing-screen">
      <div className="landing-content">
        <div className="landing-logo">
          <span className="landing-logo-symbol">◈</span>
        </div>

        <h1 className="landing-heading">Truth is One Query Away</h1>
        <p className="landing-subtitle">
          Verify any Fact, Text or URL —<br />
          Factly AI verifies it across multiple<br />
          sources instantly
        </p>

        <form className="landing-input-wrap" onSubmit={handleSubmit}>
          <div className="landing-input-inner" style={{ alignItems: isAiFile && !file ? 'flex-start' : 'center', marginTop: isAiFile && !file ? '8px' : '0' }}>
            
            <div className="landing-mode-selector" ref={popoverRef}>
              <button 
                type="button"
                className={`dropdown-trigger-btn ${showModes ? 'active' : ''}`} 
                onClick={() => setShowModes(p => !p)}
                title="Select Mode"
              >
                {activeModeObj.icon}
                <span>{activeModeObj.label}</span>
                <ChevronDown size={14} style={{ opacity: 0.6 }} />
              </button>
              
              {showModes && (
                <div className="dropdown-panel" style={{ bottom: 'calc(100% + 8px)', top: 'auto', transformOrigin: 'bottom left', zIndex: 9999 }}>
                  <div className="dropdown-section-header">VERIFICATION</div>
                  
                  <button
                    type="button"
                    className={`dropdown-item ${mode === 'fact-check' ? 'selected' : ''}`}
                    onClick={() => { setMode?.('fact-check'); setShowModes(false); }}
                  >
                    <Search size={20} />
                    <span className="dropdown-item-text">Fact Check</span>
                    {mode === 'fact-check' && <Check size={16} />}
                  </button>

                  <div className="dropdown-divider" />
                  <div className="dropdown-section-header">AI DETECTION</div>

                  <button
                    type="button"
                    className={`dropdown-item ${mode === 'ai-text' ? 'selected' : ''}`}
                    onClick={() => { setMode?.('ai-text'); setShowModes(false); }}
                  >
                    <FileText size={20} />
                    <span className="dropdown-item-text">AI Text Detection</span>
                    {mode === 'ai-text' && <Check size={16} />}
                  </button>

                  <button
                    type="button"
                    className={`dropdown-item ${mode === 'ai-image' ? 'selected' : ''}`}
                    onClick={() => { setMode?.('ai-image'); setShowModes(false); }}
                  >
                    <Image size={20} />
                    <span className="dropdown-item-text">AI Image</span>
                    {/* <span className="dropdown-new-badge">New</span> */}
                    {mode === 'ai-image' && <Check size={16} />}
                  </button>

                  <button
                    type="button"
                    className={`dropdown-item ${mode === 'ai-pdf' ? 'selected' : ''}`}
                    onClick={() => { setMode?.('ai-pdf'); setShowModes(false); }}
                  >
                    <FileDigit size={20} />
                    <span className="dropdown-item-text">AI PDF</span>
                    {/* <span className="dropdown-new-badge">New</span> */}
                    {mode === 'ai-pdf' && <Check size={16} />}
                  </button>
                </div>
              )}
            </div>

            <div className="input-divider" style={{ marginTop: '0' }} />

            {isAiFile ? (
              <>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    flex: 1,
                    background: 'rgba(124,92,252,0.1)',
                    border: '1px dashed #7c5cfc',
                    color: 'var(--text-primary)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    margin: '8px 12px 8px 8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    minHeight: '60px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,92,252,0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(124,92,252,0.1)'}
                >
                  <Upload size={22} color="#7c5cfc" />
                  <span>Click to open upload dialog ({mode === 'ai-image' ? 'Image' : 'PDF'})</span>
                </button>
                <FileUploadModal 
                  isOpen={isModalOpen} 
                  onClose={() => setIsModalOpen(false)} 
                  mode={mode} 
                  onSend={(uploadedFile) => {
                    onSend?.(uploadedFile);
                    setIsModalOpen(false);
                  }} 
                />
              </>
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
          
          <div className={`landing-char-count ${charCount > 0 || isAiText ? 'visible' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 4px', boxSizing: 'border-box' }}>
            {isAiText && charCount > 0 && charCount < 100 ? (
              <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500 }}>Minimum 100 characters required</span>
            ) : <span />}
            <span style={{ color: getCharColor(), fontWeight: 500, transition: 'color 0.2s' }}>
              {charCount} / {maxChars}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LandingScreen;
