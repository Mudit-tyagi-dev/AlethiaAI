import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronDown, Search, FileText, Image, FileDigit, Check, X, Upload } from 'lucide-react';
import FileUploadModal from './FileUploadModal';

const MODES = [
  { id: 'fact-check', icon: <Search size={14} />, label: 'Fact Check' },
  { id: 'ai-text', icon: <FileText size={14} />, label: 'AI Text Detection' },
  { id: 'ai-image', icon: <Image size={14} />, label: 'AI Image' },
  { id: 'ai-pdf', icon: <FileDigit size={14} />, label: 'AI PDF' },
];

const InputBar = ({ onSend, isProcessing, replyRequest, focusRequest, mode = 'fact-check', setMode }) => {
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [showModes, setShowModes] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const inputRef = useRef(null);
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

  // Auto-close modal when processing finishes
  useEffect(() => {
    if (!isProcessing && isModalOpen) {
      setIsModalOpen(false);
    }
  }, [isProcessing]);

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
  const charCount = input.length;
  const maxChars = isAiText ? 10000 : 2000;
  
  const handleSend = () => {
    if (isProcessing) return;
    if (isAiFile) {
      if (!file) return;
      onSend(file);
      setFile(null);
    } else {
      const trimmed = input.trim();
      if (isAiText && (trimmed.length < 100 || trimmed.length > maxChars)) return;
      if (!isAiText && trimmed.length > maxChars) return;
      if (!trimmed) return;
      
      onSend(trimmed);
      setInput('');
    }
  };

  const getPlaceholder = () => {
    if (isAiText) return 'Paste text to check if AI generated .... (100-10000 chars)';
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

  const isSendDisabled = isProcessing || (isAiFile ? true : (isAiText ? (charCount < 100 || charCount > maxChars) : (!input.trim() || charCount > maxChars)));
  const activeModeObj = MODES.find(m => m.id === mode) || MODES[0];

  return (
    <div className="input-bar-container">
      <div className="input-wrapper" style={{ position: 'relative', overflow: 'visible', alignItems: isAiFile && !file ? 'flex-start' : 'center' }}>
        
        <div className="mode-selector-wrapper" ref={popoverRef} style={{ position: 'relative' }}>
          <button 
            className={`dropdown-trigger-btn ${showModes ? 'active' : ''}`} 
            onClick={() => setShowModes(p => !p)}
            title="Select Mode"
          >
            {activeModeObj.icon}
            <span>{activeModeObj.label}</span>
            <ChevronDown size={14} style={{ opacity: 0.6 }} />
          </button>
          
          {showModes && (
            <div className="dropdown-panel" style={{ bottom: 'calc(100% + 14px)', top: 'auto', transformOrigin: 'bottom left' }}>
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
        
        <span className="input-divider" />
        
        {isAiFile ? (
          <>
            <button 
              type="button"
              disabled={isProcessing}
              onClick={() => { if (!isProcessing) setIsModalOpen(true); }}
              style={{
                flex: 1,
                background: 'rgba(124,92,252,0.1)',
                border: '1px dashed #7c5cfc',
                color: 'var(--text-primary)',
                padding: '10px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '0 8px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                fontWeight: 500,
                opacity: isProcessing ? 0.5 : 1
              }}
              onMouseEnter={(e) => { if (!isProcessing) e.currentTarget.style.background = 'rgba(124,92,252,0.15)'; }}
              onMouseLeave={(e) => { if (!isProcessing) e.currentTarget.style.background = 'rgba(124,92,252,0.1)'; }}
            >
              <Upload size={18} color="#7c5cfc" />
              <span>Click to open upload dialog ({mode === 'ai-image' ? 'Image' : 'PDF'})</span>
            </button>
            <FileUploadModal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              mode={mode} 
              isProcessing={isProcessing}
              onSend={(uploadedFile) => {
                onSend(uploadedFile);
                // Modal stays open to show loading state
              }} 
            />
          </>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', padding: '0 12px', opacity: charCount > 0 || isAiText ? 1 : 0, transition: 'opacity 0.2s' }}>
        {isAiText && charCount > 0 && charCount < 100 ? (
          <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500 }}>Minimum 100 characters required</span>
        ) : <span />}
        <div style={{ color: getCharColor(), fontSize: '0.75rem', fontWeight: 500, transition: 'color 0.2s' }}>
          {charCount} / {maxChars}
        </div>
      </div>
    </div>
  );
};

export default InputBar;
