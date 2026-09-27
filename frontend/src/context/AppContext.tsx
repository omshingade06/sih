import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WellSummary, WellDetail, TelemetryPoint, Alert, LookaheadSummary } from '../types';
import { api } from '../services/api';

interface AppContextType {
  wells: WellSummary[];
  activeWellId: number;
  activeWell: WellDetail | null;
  liveTelemetry: TelemetryPoint | null;
  telemetryHistory: TelemetryPoint[];
  simulatorRunning: boolean;
  simulationSpeed: number;
  activeAnomaly: string | null;
  lookaheadWindow: number;
  lookaheadSummary: LookaheadSummary | null;
  alerts: Alert[];
  unreadAlertCount: number;
  selectedAlertModal: Alert | null;
  setSelectedAlertModal: (alert: Alert | null) => void;
  setActiveWellId: (id: number) => void;
  setLookaheadWindow: (meters: number) => void;
  startSimulation: () => Promise<void>;
  pauseSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  stepSimulation: () => Promise<void>;
  setSimulationSpeed: (speed: number) => Promise<void>;
  triggerAnomaly: (anomalyType: string) => Promise<void>;
  acknowledgeAlert: (alertId: number, notes?: string) => Promise<void>;
  refreshLookahead: () => Promise<void>;
  loading: boolean;
  userRole: string;
  setUserRole: (role: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wells, setWells] = useState<WellSummary[]>([]);
  const [activeWellId, setActiveWellIdState] = useState<number>(1);
  const [activeWell, setActiveWell] = useState<WellDetail | null>(null);
  const [liveTelemetry, setLiveTelemetry] = useState<TelemetryPoint | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [simulatorRunning, setSimulatorRunning] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeedState] = useState<number>(1.0);
  const [activeAnomaly, setActiveAnomaly] = useState<string | null>(null);
  const [lookaheadWindow, setLookaheadWindowState] = useState<number>(50.0);
  const [lookaheadSummary, setLookaheadSummary] = useState<LookaheadSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertModal, setSelectedAlertModal] = useState<Alert | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('DRILLING_ENGINEER');
  
  // Theme state: default 'dark', persisted in localStorage
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('ertmac_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('ertmac_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
  };

  // Load initial wells and active well
  const loadWellsAndActive = useCallback(async (wellId: number) => {
    try {
      setLoading(true);
      const [wellsData, wellData, alertsData, lookaheadData] = await Promise.all([
        api.getWells(),
        api.getWell(wellId),
        api.getAlerts(wellId),
        api.getLookahead(wellId, lookaheadWindow)
      ]);
      setWells(wellsData);
      setActiveWell(wellData);
      setAlerts(alertsData);
      setLookaheadSummary(lookaheadData);
    } catch (err) {
      console.error('Error loading initial data', err);
    } finally {
      setLoading(false);
    }
  }, [lookaheadWindow]);

  useEffect(() => {
    loadWellsAndActive(activeWellId);
  }, [activeWellId, loadWellsAndActive]);

  const setActiveWellId = (id: number) => {
    setActiveWellIdState(id);
  };

  const setLookaheadWindow = (meters: number) => {
    setLookaheadWindowState(meters);
    if (activeWellId) {
      api.getLookahead(activeWellId, meters).then(setLookaheadSummary).catch(console.error);
    }
  };

  const refreshLookahead = async () => {
    if (activeWellId) {
      try {
        const [lookData, alertsData] = await Promise.all([
          api.getLookahead(activeWellId, lookaheadWindow),
          api.getAlerts(activeWellId)
        ]);
        setLookaheadSummary(lookData);
        setAlerts(alertsData);
      } catch (err) {
        console.error('Failed to refresh lookahead', err);
      }
    }
  };

  // WebSocket / Polling Telemetry Stream
  useEffect(() => {
    let ws: WebSocket | null = null;
    let pollInterval: any = null;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/telemetry/${activeWellId}`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const point: TelemetryPoint = JSON.parse(event.data);
          setLiveTelemetry(point);
          setSimulatorRunning(true);
          setActiveAnomaly(point.anomaly_type || null);
          
          setTelemetryHistory((prev) => {
            const updated = [...prev, point];
            return updated.slice(-60); // keep last 60 points
          });
        } catch (e) {
          console.error('WS Parse Error', e);
        }
      };

      ws.onerror = () => {
        // Fallback to REST polling if WebSocket fails
        if (!pollInterval) {
          pollInterval = setInterval(async () => {
            try {
              const pt = await api.getLatestTelemetry(activeWellId);
              setLiveTelemetry(pt);
              setActiveAnomaly(pt.anomaly_type || null);
              setTelemetryHistory((prev) => [...prev, pt].slice(-60));
            } catch (err) {
              // ignore
            }
          }, 1000);
        }
      };
    } catch (e) {
      console.error('WS Init error', e);
    }

    return () => {
      if (ws) ws.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [activeWellId]);

  // Periodic lookahead and alerts sync every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      refreshLookahead();
    }, 4000);
    return () => clearInterval(timer);
  }, [activeWellId, lookaheadWindow]);

  // Simulator controls
  const startSimulation = async () => {
    await api.controlTelemetry(activeWellId, 'start');
    setSimulatorRunning(true);
  };

  const pauseSimulation = async () => {
    await api.controlTelemetry(activeWellId, 'pause');
    setSimulatorRunning(false);
  };

  const resetSimulation = async () => {
    await api.controlTelemetry(activeWellId, 'reset');
    setTelemetryHistory([]);
    setSimulatorRunning(true);
    setActiveAnomaly(null);
    refreshLookahead();
  };

  const stepSimulation = async () => {
    await api.controlTelemetry(activeWellId, 'step');
    refreshLookahead();
  };

  const setSimulationSpeed = async (speed: number) => {
    setSimulationSpeedState(speed);
    await api.controlTelemetry(activeWellId, 'set_speed', speed);
  };

  const triggerAnomaly = async (anomalyType: string) => {
    await api.controlTelemetry(activeWellId, 'trigger_anomaly', simulationSpeed, anomalyType);
    setActiveAnomaly(anomalyType);
    refreshLookahead();
  };

  const acknowledgeAlert = async (alertId: number, notes?: string) => {
    await api.acknowledgeAlert(alertId, 'Er. Rajesh Sarmah (RTDC Lead)', notes);
    setAlerts((prev) =>
      prev.map((a) => (a.alert_id === alertId ? { ...a, status: 'ACKNOWLEDGED', acknowledged_by: 'Er. Rajesh Sarmah' } : a))
    );
  };

  const unreadAlertCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <AppContext.Provider
      value={{
        wells,
        activeWellId,
        activeWell,
        liveTelemetry,
        telemetryHistory,
        simulatorRunning,
        simulationSpeed,
        activeAnomaly,
        lookaheadWindow,
        lookaheadSummary,
        alerts,
        unreadAlertCount,
        selectedAlertModal,
        setSelectedAlertModal,
        setActiveWellId,
        setLookaheadWindow,
        startSimulation,
        pauseSimulation,
        resetSimulation,
        stepSimulation,
        setSimulationSpeed,
        triggerAnomaly,
        acknowledgeAlert,
        refreshLookahead,
        loading,
        userRole,
        setUserRole,
        theme,
        toggleTheme,
        setTheme
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
