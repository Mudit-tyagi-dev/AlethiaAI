import React, { useState, useRef, useEffect } from 'react';
import {
  Home, Clock, Star, Tag, Settings, User, ChevronLeft, ChevronRight,
  FileText, X, MessageSquarePlus
} from 'lucide-react';
import '../styles/sidebar.css';
import mockData from '../data/mockData';

const SidebarItem = ({ icon, label, collapsed, onClick, active }) => {
  return (
    <button
      className={`sidebar-nav-item ${active ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
      onClick={onClick}
      title={collapsed ? label : ''}
    >
      <span className="nav-icon">{icon}</span>
      {!collapsed && <span className="nav-label">{label}</span>}
    </button>
  );
};

const Sidebar = ({ isOpen, onClose, openSettings, onHomeClick, isCollapsed, onToggleCollapse }) => {
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

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
          {!isCollapsed && (
            <div className="logo">
              {/* <span className="logo-symbol">◈</span>
              <span className="logo-text">AlethiaAI</span> */}
            </div>
          )}
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
          <SidebarItem
            icon={<Home size={18} />} label="Home"
            collapsed={isCollapsed} onClick={onHomeClick}
          />
          <SidebarItem
            icon={<Clock size={18} />} label="History"
            collapsed={isCollapsed} onClick={() => {}}
          />
          <SidebarItem
            icon={<Star size={18} />} label="Saved"
            collapsed={isCollapsed} onClick={() => {}}
          />
          <SidebarItem
            icon={<Tag size={18} />} label="Labels"
            collapsed={isCollapsed} onClick={() => {}}
          />

          {!isCollapsed && (
            <>
              <div className="nav-section-title">Recent Reports</div>
              <ul className="history-list">
                {mockData.previousReports.map(report => (
                  <li key={report.id} className="history-item" onClick={onClose}>
                    <div className="history-title">
                      <FileText size={13} className="history-icon" />
                      {report.title}
                    </div>
                    <div className="history-meta">
                      <span className="history-date">{report.date}</span>
                      <span className={`history-score ${report.score >= 70 ? 'good' : report.score >= 40 ? 'warning' : 'bad'}`}>
                        {report.score}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        {/* Footer / Profile */}
        <div className="sidebar-bottom">
          <SidebarItem
            icon={<Settings size={18} />} label="Settings"
            collapsed={isCollapsed}
            onClick={() => { openSettings(); }}
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
