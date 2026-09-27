import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProactiveAlertModal } from './components/ProactiveAlertModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { OverviewPage } from './pages/OverviewPage';
import { ActiveWellPage } from './pages/ActiveWellPage';
import { NearbyWellsPage } from './pages/NearbyWellsPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { HazardsPage } from './pages/HazardsPage';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AskNWISPage } from './pages/AskNWISPage';
import { SettingsPage } from './pages/SettingsPage';

const DashboardLayout: React.FC = () => {
  const { selectedAlertModal, setSelectedAlertModal } = useApp();

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
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Application Command Center */}
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="active-well" element={<ActiveWellPage />} />
            <Route path="nearby-wells" element={<NearbyWellsPage />} />
            <Route path="telemetry" element={<TelemetryPage />} />
            <Route path="hazards" element={<HazardsPage />} />
            <Route path="knowledge-graph" element={<KnowledgeGraphPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="ask-nwis" element={<AskNWISPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
