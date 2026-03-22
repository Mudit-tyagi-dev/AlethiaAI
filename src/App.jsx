import React, { useEffect, useRef, useCallback } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import PricingModal from './components/PricingModal';
import ChatThread from './components/Chat/ChatThread';
import ReportScreen from './components/Report/ReportScreen';
import useAppStore from './store/useAppStore';
import { checkHealth, fetchReport } from './services/api';

const FONT_SIZES = { Small: '13px', Medium: '15px', Large: '17px' };

function App() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const isSettingsOpen = useAppStore((s) => s.isSettingsOpen);
  const closeSettings = useAppStore((s) => s.closeSettings);
  const isPricingOpen = useAppStore((s) => s.isPricingOpen);
  const closePricing = useAppStore((s) => s.closePricing);


  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = React.useState('appearance');
  const [settingsWarning, setSettingsWarning] = React.useState('');
  const [backendDown, setBackendDown] = React.useState(false);
  const [chatSessionId, setChatSessionId] = React.useState(Date.now());
  const [reportScreenData, setReportScreenData] = React.useState(null);
  const [fontSize, setFontSize] = React.useState(
    () => localStorage.getItem('alethia-fontsize') || 'Medium'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const px = FONT_SIZES[fontSize] || '15px';
    document.documentElement.style.fontSize = px;
    localStorage.setItem('alethia-fontsize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    checkHealth().catch(() => setBackendDown(true));
  }, []);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const handleHomeClick = () => {
    setChatSessionId(Date.now());
    setReportScreenData(null);
    setIsSidebarOpen(false);
  };

  const openSettingsOnApiTab = useCallback((warning = '') => {
    setSettingsWarning(warning);
    setSettingsInitialTab('api');
    useAppStore.getState().openSettings();
  }, []);

  const handleViewReport = useCallback((reportData, query) => {
    setReportScreenData({ reportData, query });
  }, []);

  const handleBackToChat = useCallback(() => {
    setReportScreenData(null);
  }, []);

  const handleSidebarReportForScreen = useCallback(async (report) => {
    setIsSidebarOpen(false);
    const apiKey = useAppStore.getState().apiKey || localStorage.getItem('alethia_api_key') || '';
    
    try {
      if (report.report_id) {
        const fullReport = await fetchReport(report.report_id, apiKey);
        fullReport.report_id = fullReport.id;
        setReportScreenData({ reportData: fullReport, query: fullReport.input_text || report.query || report.title || '' });
        return;
      }
    } catch (err) {
      console.error('Failed to fetch full report from backend, using local fallback', err);
    }
    
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
  }, []);

  return (
    <div className="app-shell">
      {backendDown && (
        <div style={{ background: '#ef4444', color: '#fff', textAlign: 'center', padding: '10px', zIndex: 9999, position: 'relative', fontSize: '0.9rem', fontWeight: 500 }}>
          Backend is currently unavailable. Some features may not work.
        </div>
      )}
      {/* Main Chat View - Hidden when ReportScreen is active to preserve state */}
      <div style={{ display: reportScreenData ? 'none' : 'contents' }}>
        <TopBar
          toggleSidebar={() => setIsSidebarOpen((p) => !p)}
          theme={theme}
          toggleTheme={toggleTheme}
          onHomeClick={handleHomeClick}
          onNewChat={() => setChatSessionId(Date.now())}
          reportId={reportScreenData?.reportData?.report_id}
        />

        <div className="app-body">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onHomeClick={handleHomeClick}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((p) => !p)}
            onReportClick={handleSidebarReportForScreen}
          />

          <main className="app-main">
            <ChatThread
              key={chatSessionId}
              openSettingsOnApiTab={openSettingsOnApiTab}
              onViewReport={handleViewReport}
            />
          </main>
        </div>
      </div>

      {/* Report Screen Overlay */}
      {reportScreenData && (
        <ReportScreen
          reportData={reportScreenData.reportData}
          query={reportScreenData.query}
          onBack={handleBackToChat}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => { closeSettings(); setSettingsWarning(''); }}
          theme={theme}
          toggleTheme={toggleTheme}
          fontSize={fontSize}
          setFontSize={setFontSize}
          initialTab={settingsInitialTab}
          warningMessage={settingsWarning}
        />
      )}

      {isPricingOpen && (
        <PricingModal onClose={closePricing} />
      )}
    </div>
  );
}

export default App;
