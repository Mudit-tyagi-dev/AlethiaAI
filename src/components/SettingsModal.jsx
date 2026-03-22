import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Moon, Sun, Monitor } from 'lucide-react';
import '../styles/settings.css';

const FONT_OPTIONS = ['Small', 'Medium', 'Large'];

const SettingsModal = ({ onClose, theme, toggleTheme, fontSize, setFontSize, initialTab = 'appearance', warningMessage = '' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('alethia_api_key') || '';
    setApiKey(stored);
  }, []);

  // Update active tab when initialTab prop changes (re-opens)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleApiKeyChange = (e) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('alethia_api_key', val);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal slideUpFadeIn">
        <div className="settings-header">
          <div className="settings-title-area">
            <div className="settings-icon-wrapper"><SettingsIcon size={18} /></div>
            <div>
              <h2>Settings</h2>
              <p className="settings-subtitle">Manage your API key and appearance</p>
            </div>
          </div>
          <button className="icon-btn close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="settings-tabs">
          <button className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>
            Appearance
          </button>
          <button className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`} onClick={() => setActiveTab('api')}>
            API Key
          </button>
        </div>

        <div className="settings-body">
          {activeTab === 'api' && (
            <div className="setting-group fade-in">
              {warningMessage && (
                <div className="api-key-warning">
                  ⚠️ {warningMessage}
                </div>
              )}
              <label>OpenAI API Key</label>
              <div className="api-input-wrapper">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  placeholder="sk-..."
                  className="custom-input"
                  autoFocus
                />
                <button className="toggle-visibility" onClick={() => setShowKey(p => !p)}>
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <span className="setting-hint">
                {saved ? '✓ Saved' : 'Keys are stored locally in your browser'}
              </span>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="appearance-tab fade-in">
              <div className="setting-group">
                <label className="section-label">THEME</label>
                <div className="theme-cards-container">
                  <div className={`theme-card ${theme === 'dark' ? 'selected' : ''}`} onClick={() => theme !== 'dark' && toggleTheme()}>
                    <div className="theme-preview dark-preview">
                      <div className="preview-header" />
                      <div className="preview-body" />
                    </div>
                    <div className="theme-card-info"><Moon size={13} /> Dark</div>
                    {theme === 'dark' && <div className="check-mark">✓</div>}
                  </div>
                  <div className={`theme-card ${theme === 'light' ? 'selected' : ''}`} onClick={() => theme !== 'light' && toggleTheme()}>
                    <div className="theme-preview light-preview">
                      <div className="preview-header" style={{ background: '#e4e4e7' }} />
                      <div className="preview-body" style={{ background: '#fafafa', border: '1px solid #e4e4e7' }} />
                    </div>
                    <div className="theme-card-info"><Sun size={13} /> Light</div>
                    {theme === 'light' && <div className="check-mark">✓</div>}
                  </div>
                  <div className="theme-card empty-card">
                    <div className="theme-preview system-preview">
                      <div className="preview-header" style={{ background: '#3f3f46' }} />
                      <div className="preview-body" style={{ background: '#e4e4e7' }} />
                    </div>
                    <div className="theme-card-info"><Monitor size={13} /> System</div>
                  </div>
                </div>
              </div>

              <div className="setting-group">
                <label className="section-label">FONT SIZE</label>
                <div className="font-size-options">
                  {FONT_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      className={`font-size-btn ${fontSize === opt ? 'selected' : ''}`}
                      onClick={() => setFontSize(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <span className="setting-hint">Changes apply immediately across the whole app</span>
              </div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="simple-close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
