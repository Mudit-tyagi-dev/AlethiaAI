import React, { useState, useRef, useEffect } from 'react';
import {
  Home, Clock, Star, Tag, Settings, User, ChevronLeft, ChevronRight,
  FileText, X, MessageSquarePlus
} from 'lucide-react';
import '../styles/sidebar.css';

const SidebarItem = ({ icon, label, collapsed, onClick, active }) => (
  <button
    className={`sidebar-nav-item ${active ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
    onClick={onClick}
    title={collapsed ? label : ''}
  >
    <span className="nav-icon">{icon}</span>
    {!collapsed && <span className="nav-label">{label}</span>}
  </button>
);

const formatSidebarDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
};

const Sidebar = ({ isOpen, onClose, openSettings, onHomeClick, isCollapsed, onToggleCollapse, onReportClick, sidebarVersion }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [reports, setReports] = useState([]);
  const profileRef = useRef(null);

  // Load reports from localStorage whenever sidebarVersion changes
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('alethia_reports') || '[]');
    setReports(stored);
  }, [sidebarVersion]);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

      <aside className={`sidebar persistent ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        {/* Header */}
        <div className="sidebar-header">
          {!isCollapsed && <div className="logo" />}
          {isCollapsed && <span className="logo-symbol-only">◈</span>}
          <button
            className="collapse-toggle"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <SidebarItem icon={<Home size={18} />} label="Home" collapsed={isCollapsed} onClick={onHomeClick} />
          <SidebarItem icon={<Clock size={18} />} label="History" collapsed={isCollapsed} onClick={() => {}} />
          <SidebarItem icon={<Star size={18} />} label="Saved" collapsed={isCollapsed} onClick={() => {}} />
          <SidebarItem icon={<Tag size={18} />} label="Labels" collapsed={isCollapsed} onClick={() => {}} />

          {!isCollapsed && (
            <>
              <div className="nav-section-title">Recent Reports</div>
              {reports.length === 0 ? (
                <div className="history-empty">No reports yet</div>
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
                          <span className="history-title-text">{report.title}</span>
                        </div>
                        <div className="history-meta">
                          <span className="history-date">{formatSidebarDate(report.date)}</span>
                          <span className={`history-score ${score >= 70 ? 'good' : score >= 40 ? 'warning' : 'bad'}`}>
                            {score}%
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
          <SidebarItem
            icon={<Settings size={18} />}
            label="Settings"
            collapsed={isCollapsed}
            onClick={() => openSettings()}
          />

          <div className="profile-area" ref={profileRef}>
            <button
              className={`profile-btn ${isCollapsed ? 'collapsed' : ''}`}
              onClick={() => setShowProfile(p => !p)}
              title={isCollapsed ? 'Account' : ''}
            >
              <div className="profile-avatar">U</div>
              {!isCollapsed && (
                <div className="profile-info">
                  <span className="profile-name">User</span>
                  <span className="profile-plan">Free Plan</span>
                </div>
              )}
            </button>

            {showProfile && (
              <div className={`profile-popover ${isCollapsed ? 'popover-right' : 'popover-up'}`}>
                <button className="popover-item">Profile</button>
                <button className="popover-item upgrade">⬆ Upgrade</button>
                <div className="popover-divider" />
                <button className="popover-item danger">Log out</button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
