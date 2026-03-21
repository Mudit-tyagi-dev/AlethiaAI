import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import ChatThread from './components/Chat/ChatThread';

const FONT_SIZES = { Small: '13px', Medium: '15px', Large: '17px' };

function App() {
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(Date.now());

  // Font size persisted in localStorage
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('alethia-fontsize') || 'Medium';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const px = FONT_SIZES[fontSize] || '15px';
    document.documentElement.style.fontSize = px;
    localStorage.setItem('alethia-fontsize', fontSize);
  }, [fontSize]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleHomeClick = () => {
    setChatSessionId(Date.now());
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      <TopBar
        toggleSidebar={() => setIsSidebarOpen(p => !p)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="app-body">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          openSettings={() => setIsSettingsOpen(true)}
          onHomeClick={handleHomeClick}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(p => !p)}
        />

        <main className="app-main">
          <ChatThread key={chatSessionId} />
        </main>
      </div>

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          theme={theme}
          toggleTheme={toggleTheme}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />
      )}
    </div>
  );
}

export default App;
