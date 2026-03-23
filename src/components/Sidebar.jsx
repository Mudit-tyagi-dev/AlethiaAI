import React, { useState, useRef, useEffect } from 'react';
import {
  Home, Settings, ChevronLeft, ChevronRight,
  FileText, Zap
} from 'lucide-react';
import '../styles/sidebar.css';
import useReportStore from '../store/useReportStore';
import useAppStore from '../store/useAppStore';

const formatSidebarDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
};

const Sidebar = ({ isOpen, onClose, onHomeClick, isCollapsed, onToggleCollapse, onReportClick }) => {
  const reports = useReportStore((s) => s.reports);
  const openSettings = useAppStore((s) => s.openSettings);
  const openPricing = useAppStore((s) => s.openPricing);

  return (
    <>
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

      <aside className={`sidebar persistent ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        {/* Header */}
        <div className="sidebar-header-minimal" />

        {/* Nav */}
        <nav className="sidebar-nav">
          {/* Recent Reports Section */}
          {!isCollapsed && (
            <>
              <div className="nav-section-title">RECENT REPORTS</div>
              {reports.length === 0 ? (
                <div className="history-empty">
                  <p>No reports yet.</p>
                  <p>Start verifying claims!</p>
                </div>
              ) : (
                <ul className="history-list">
                  {reports.map(report => {
                    const score = report.overall_score ?? 0;
                    return (
                      <li
                        key={report.report_id}
                        className="history-item"
                        onClick={() => { onReportClick?.(report); onClose(); }}
                      >
                        <div className="history-title">
                          <FileText size={13} className="history-icon" />
                          <span className="history-title-text">
                            {report.title?.substring(0, 40) || 'Untitled'}
                          </span>
                        </div>
                        <div className="history-meta">
                          <span className="history-date">{formatSidebarDate(report.date)}</span>
                          <span className={`history-score ${score >= 0.7 ? 'good' : score >= 0.4 ? 'warning' : 'bad'}`}>
                            {Math.round(score * 100)}%
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-bottom">
          <button
            className={`sidebar-nav-item ${isCollapsed ? 'collapsed' : ''}`}
            onClick={openSettings}
            title={isCollapsed ? 'Settings' : ''}
          >
            <span className="nav-icon"><Settings size={18} /></span>
            {!isCollapsed && <span className="nav-label">Settings</span>}
          </button>

          <div className="profile-area">
            <div className={`profile-btn ${isCollapsed ? 'collapsed' : ''}`}>
              <div className="profile-avatar">U</div>
              {!isCollapsed && (
                <div className="profile-info">
                  <span className="profile-name">User</span>
                  <span className="profile-plan">Free Plan</span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button className="upgrade-btn" onClick={openPricing}>
                <Zap size={14} />
                <span>Upgrade</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
