import React from 'react';
import { Download, Sun, Moon } from 'lucide-react';
import '../styles/topbar.css';

const TopBar = ({ toggleSidebar, theme, toggleTheme }) => {
  const handleExport = () => alert('Report exported as PDF!');

  return (
    <header className="topbar">
      <div className="topbar-left">
         <div className="logo">
              <span className="logo-symbol">◈</span>
              <span className="logo-text">AlethiaAI</span>
            </div>
      </div>

      <div className="topbar-center">
        {/* intentionally empty — branding in sidebar */}
      </div>

      <div className="topbar-right">
        <button className="icon-btn export-btn" onClick={handleExport} title="Export Report">
          <Download size={18} />
        </button>
        <button className="icon-btn theme-toggle" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
