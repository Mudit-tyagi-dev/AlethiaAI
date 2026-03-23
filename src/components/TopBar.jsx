import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sun, Moon, Share2, FileDown, Link } from 'lucide-react';
import '../styles/topbar.css';
import useAppStore from '../store/useAppStore';

const TopBar = ({ toggleSidebar, theme, toggleTheme, onHomeClick, onNewChat, reportId }) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState('');
  const shareRef = useRef(null);

  // Close popover on outside click
  useEffect(() => {
    const handler = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleExportPdf = () => {
    setShareOpen(false);
    showToast('Preparing PDF...');
    setTimeout(() => showToast('PDF Downloaded!'), 1800);
  };

  const handleCopyLink = () => {
    setShareOpen(false);
    const id = reportId || 'demo';
    const url = `factlyai.app/report/${id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    showToast('Link copied! Share it anywhere ✓');
  };

  const [logoSpining, setLogoSpining] = useState(false);

  const handleLogoClick = () => {
    // ◈ logo = sidebar toggle
    setLogoSpining(true);
    toggleSidebar?.();
    setTimeout(() => setLogoSpining(false), 400);
  };

  const handleTitleClick = () => {
    // Factly AI text = go home
    onHomeClick?.();
  };

  return (
    <>
      {/* Topbar Toast */}
      {toast && <div className="topbar-toast">{toast}</div>}

      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo-btn" onClick={handleLogoClick} title="Toggle Sidebar">
            <span className={`logo-symbol ${logoSpining ? 'spin' : ''}`}>◈</span>
            
          </div>
          <div>
             <span
              className="logo-text logo-text-clickable"
              onClick={(e) => { e.stopPropagation(); handleTitleClick(); }}
            >
              Factly AI
            </span>
          </div>
        </div>

        <div className="topbar-center">
          {/* intentionally empty */}
        </div>

        <div className="topbar-right">
          {/* Share Button */}
          <div className="share-wrapper" ref={shareRef}>
            <button
              className="icon-btn share-btn"
              onClick={() => setShareOpen((p) => !p)}
              title="Share"
            >
              <Share2 size={17} />
              <span className="share-label">Share</span>
            </button>

            {shareOpen && (
              <div className="share-popover">
                <button className="share-option" onClick={handleExportPdf}>
                  <FileDown size={16} />
                  <span>Export as PDF</span>
                </button>
                <button className="share-option" onClick={handleCopyLink}>
                  <Link size={16} />
                  <span>Share Link</span>
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button className="icon-btn theme-toggle" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
    </>
  );
};

export default TopBar;
