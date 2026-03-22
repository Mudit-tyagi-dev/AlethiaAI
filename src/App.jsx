import React, { useState, useEffect, useRef, useCallback } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import ChatThread from './components/Chat/ChatThread';
import ReportScreen from './components/Report/ReportScreen';

const WS_URL = 'wss://factify-backend-tcup.onrender.com/ws/verify';
const FONT_SIZES = { Small: '13px', Medium: '15px', Large: '17px' };

function App() {
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState('appearance');
  const [settingsWarning, setSettingsWarning] = useState('');
  const [chatSessionId, setChatSessionId] = useState(Date.now());
  const [selectedReport, setSelectedReport] = useState(null);
  const [sidebarVersion, setSidebarVersion] = useState(0);

  // Report Screen state
  const [reportScreenData, setReportScreenData] = useState(null); // { reportData, query }

  const wsRef = useRef(null);

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

  // Connect WebSocket once on app mount
  const connectWS = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connectWS();
    return () => {
      // Do not close on unmount in dev — let ChatThread manage lifecycle
    };
  }, [connectWS]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleHomeClick = () => {
    setChatSessionId(Date.now());
    setSelectedReport(null);
    setReportScreenData(null);
    setIsSidebarOpen(false);
  };

  const openSettingsOnApiTab = useCallback((warning = '') => {
    setSettingsWarning(warning);
    setSettingsInitialTab('api');
    setIsSettingsOpen(true);
  }, []);

  const handleReportSelect = useCallback((report) => {
    setSelectedReport(report);
    setChatSessionId(Date.now());
    setReportScreenData(null);
    setIsSidebarOpen(false);
  }, []);

  const handleReportSaved = useCallback(() => {
    setSidebarVersion(v => v + 1);
  }, []);

  // Open Report Screen
  const handleViewReport = useCallback((reportData, query) => {
    setReportScreenData({ reportData, query });
  }, []);

  // Back to Chat — preserve chat history (don't reset chatSessionId)
  const handleBackToChat = useCallback(() => {
    setReportScreenData(null);
  }, []);

  // Sidebar report click → open Report Screen directly
  const handleSidebarReportForScreen = useCallback((report) => {
    // Build a compatible reportData from saved entry
    const reportData = {
      report_id: report.report_id,
      overall_score: (report.overall_score || 0) / 100,
      ai_text_probability: report.ai_text_probability || 0,
      total_claims: report.total_claims || 0,
      true_count: report.true_count || 0,
      false_count: report.false_count || 0,
      partial_count: report.partial_count || 0,
      unverifiable_count: report.unverifiable_count || 0,
      claims: report.claims || [],
    };
    setReportScreenData({ reportData, query: report.query || report.title || '' });
    setIsSidebarOpen(false);
  }, []);

  return (
    <div className="app-shell">
      {/* Show Report Screen over everything */}
      {reportScreenData ? (
        <ReportScreen
          reportData={reportScreenData.reportData}
          query={reportScreenData.query}
          onBack={handleBackToChat}
        />
      ) : (
        <>
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
              onReportClick={handleSidebarReportForScreen}
              sidebarVersion={sidebarVersion}
            />

            <main className="app-main">
              <ChatThread
                key={chatSessionId}
                wsRef={wsRef}
                connectWS={connectWS}
                openSettingsOnApiTab={openSettingsOnApiTab}
                selectedReport={selectedReport}
                onReportSaved={handleReportSaved}
                onViewReport={handleViewReport}
              />
            </main>
          </div>

          {isSettingsOpen && (
            <SettingsModal
              onClose={() => { setIsSettingsOpen(false); setSettingsWarning(''); }}
              theme={theme}
              toggleTheme={toggleTheme}
              fontSize={fontSize}
              setFontSize={setFontSize}
              initialTab={settingsInitialTab}
              warningMessage={settingsWarning}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
