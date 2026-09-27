import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WellSummary, WellDetail, TelemetryPoint, Alert, LookaheadSummary, User, AuthToken } from '../types';
import { api } from '../services/api';

interface AppContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  userRole: string;
  login: (tokenData: AuthToken) => void;
  logout: () => void;
  switchRoleQuick: (role: string) => void;
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
  showManualDepthModal: boolean;
  setShowManualDepthModal: (show: boolean) => void;
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
  submitAlertReview: (alertId: number, decision: string, comments?: string) => Promise<void>;
  updateBitDepthManual: (depth: number, ref?: string, unit?: string, note?: string) => Promise<void>;
  refreshWells: () => Promise<void>;
  refreshLookahead: () => Promise<void>;
  loading: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ertmac_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ertmac_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Default demo user: Drilling Engineer
    return {
      id: 2,
      username: 'driller',
      email: 'drilling.eng@oilindia.in',
      full_name: 'Er. Rajesh Sarmah (RTDC Lead)',
      role: 'DRILLING_ENGINEER',
      is_active: true
    };
  });

  const [userRole, setUserRole] = useState<string>(() => user?.role || 'DRILLING_ENGINEER');

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
  const [showManualDepthModal, setShowManualDepthModal] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  // Theme state: default 'dark'
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

  // Login handler
  const login = (tokenData: AuthToken) => {
    setToken(tokenData.access_token);
    localStorage.setItem('ertmac_token', tokenData.access_token);
    const usr: User = {
      id: tokenData.user_id,
      username: tokenData.username,
      email: `${tokenData.username}@oilindia.in`,
      full_name: tokenData.full_name,
      role: tokenData.role as any,
      is_active: true
    };
    setUser(usr);
    setUserRole(tokenData.role);
    localStorage.setItem('ertmac_user', JSON.stringify(usr));
  };

  // Logout handler
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ertmac_token');
    localStorage.removeItem('ertmac_user');
  };

  // Fast demo role switch
  const switchRoleQuick = (newRole: string) => {
    const roleMap: Record<string, { username: string; name: string; email: string }> = {
      ADMIN: { username: 'admin', name: 'Chief Drilling Engineer (Admin)', email: 'admin@oilindia.in' },
      DRILLING_ENGINEER: { username: 'driller', name: 'Er. Rajesh Sarmah (RTDC Lead)', email: 'drilling.eng@oilindia.in' },
      GEOLOGIST: { username: 'geologist', name: 'Dr. Ananya Dutta (Senior Geoscientist)', email: 'geology.ops@oilindia.in' },
      VIEWER: { username: 'viewer', name: 'Operations Stakeholder (Observer)', email: 'viewer@oilindia.in' }
    };
    const mapped = roleMap[newRole] || roleMap.DRILLING_ENGINEER;
    const usr: User = {
      id: 1,
      username: mapped.username,
      email: mapped.email,
      full_name: mapped.name,
      role: newRole as any,
      is_active: true
    };
    setUser(usr);
    setUserRole(newRole);
    localStorage.setItem('ertmac_user', JSON.stringify(usr));
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

  const refreshWells = async () => {
    try {
      const data = await api.getWells();
      setWells(data);
      if (activeWellId) {
        const single = await api.getWell(activeWellId);
        setActiveWell(single);
      }
    } catch (e) {
      console.error('Failed to refresh wells', e);
    }
  };

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
    const reviewer = user?.full_name || 'Drilling Engineer';
    await api.acknowledgeAlert(alertId, reviewer, notes);
    setAlerts((prev) =>
      prev.map((a) => (a.alert_id === alertId ? { ...a, status: 'ACKNOWLEDGED', acknowledged_by: reviewer } : a))
    );
  };

  const submitAlertReview = async (alertId: number, decision: string, comments?: string) => {
    const reviewer = user?.full_name || 'Drilling Engineer';
    await api.submitAlertReview(alertId, {
      review_decision: decision,
      comments,
      reviewer_name: reviewer
    });
    setAlerts((prev) =>
      prev.map((a) => (a.alert_id === alertId ? { ...a, status: decision.includes('NOT') ? 'DISMISSED' : 'ACKNOWLEDGED', acknowledged_by: reviewer } : a))
    );
  };

  const updateBitDepthManual = async (depth: number, ref?: string, unit?: string, note?: string) => {
    const reviewer = user?.full_name || 'Drilling Engineer';
    await api.enterManualDepth(activeWellId, {
      bit_depth: depth,
      depth_reference: ref || 'MD',
      depth_unit: unit || 'm',
      note,
      recorded_by: reviewer
    });
    // Refresh active well and lookahead
    const updated = await api.getWell(activeWellId);
    setActiveWell(updated);
    refreshLookahead();
  };

  const unreadAlertCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        userRole,
        login,
        logout,
        switchRoleQuick,
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
        showManualDepthModal,
        setShowManualDepthModal,
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
        submitAlertReview,
        updateBitDepthManual,
        refreshWells,
        refreshLookahead,
        loading,
        theme,
        toggleTheme,
        setTheme,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        toggleMobileSidebar
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
