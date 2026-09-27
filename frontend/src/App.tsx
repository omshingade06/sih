import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProactiveAlertModal } from './components/ProactiveAlertModal';
import { ManualDepthModal } from './components/ManualDepthModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { WellsPage } from './pages/WellsPage';
import { ActiveWellPage } from './pages/ActiveWellPage';
import { NearbyWellsPage } from './pages/NearbyWellsPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { HazardsPage } from './pages/HazardsPage';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { HistoricalIntelligencePage } from './pages/HistoricalIntelligencePage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AskNWISPage } from './pages/AskNWISPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { ReportsExportPage } from './pages/ReportsExportPage';
import { SettingsPage } from './pages/SettingsPage';

const DashboardLayout: React.FC = () => {
  const {
    selectedAlertModal,
    setSelectedAlertModal,
    showManualDepthModal,
    setShowManualDepthModal
  } = useApp();

  return (
    <div className="min-h-screen bg-[#121416] text-[#F5F6F8] flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#121416] pb-12">
          <Outlet />
        </main>
      </div>

      {/* Global Proactive Look-Ahead Hazard Modal */}
      <ProactiveAlertModal
        alert={selectedAlertModal}
        onClose={() => setSelectedAlertModal(null)}
      />

      {/* Manual Bit Depth Control Dialog */}
      <ManualDepthModal
        isOpen={showManualDepthModal}
        onClose={() => setShowManualDepthModal(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Login */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Application Command Center Suite */}
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="wells" element={<WellsPage />} />
            <Route path="active-well" element={<ActiveWellPage />} />
            <Route path="nearby-wells" element={<NearbyWellsPage />} />
            <Route path="telemetry" element={<TelemetryPage />} />
            <Route path="hazards" element={<HazardsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="historical" element={<HistoricalIntelligencePage />} />
            <Route path="knowledge-graph" element={<KnowledgeGraphPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="ask-nwis" element={<AskNWISPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="exports" element={<ReportsExportPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
