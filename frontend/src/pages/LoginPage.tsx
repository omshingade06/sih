import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Activity,
  Layers,
  ChevronRight,
  Compass,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, switchRoleQuick } = useApp();

  const [username, setUsername] = useState<string>('driller');
  const [password, setPassword] = useState<string>('oil123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const demoAccounts = [
    { role: 'DRILLING_ENGINEER', username: 'driller', label: 'Drilling Engineer', name: 'Er. Rajesh Sarmah', tag: 'Look-Ahead & Telemetry' },
    { role: 'GEOLOGIST', username: 'geologist', label: 'Data Reviewer / Geologist', name: 'Dr. Ananya Dutta', tag: 'Verification Center' },
    { role: 'ADMIN', username: 'admin', label: 'Administrator', name: 'Chief Drilling Engineer', tag: 'Full Control & Users' },
    { role: 'VIEWER', username: 'viewer', label: 'Read-Only Viewer', name: 'Operations Stakeholder', tag: 'Dashboard & Reports' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const tokenData = await api.login(username, password);
      login(tokenData);

      // Role-based redirection
      if (tokenData.role === 'ADMIN') {
        navigate('/app');
      } else if (tokenData.role === 'GEOLOGIST') {
        navigate('/app/documents');
      } else if (tokenData.role === 'DRILLING_ENGINEER') {
        navigate('/app');
      } else {
        navigate('/app');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelectRole = (acc: typeof demoAccounts[0]) => {
    setUsername(acc.username);
    setPassword(acc.username === 'admin' ? 'admin' : 'oil123');
  };

  return (
    <div className="min-h-screen bg-[#121416] text-[#F5F6F8] flex flex-col justify-center selection:bg-[#ED1C24] selection:text-white">
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#1A1D20] border border-[#2E343A] rounded-3xl shadow-2xl overflow-hidden min-h-[640px]">
          
          {/* Left Panel: Oilfield & Geological Intelligence Visualization */}
          <div className="lg:col-span-6 bg-gradient-to-br from-[#1E2227] via-[#15181B] to-[#121416] p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#2E343A]">
            {/* Background Decorative Grid and Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ED1C24_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
            <div className="absolute top-1/3 right-0 w-72 h-72 bg-[#ED1C24]/10 rounded-full blur-[90px] pointer-events-none" />

            {/* Header / Logo */}
            <div className="relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#ED1C24] flex items-center justify-center font-black text-white text-base tracking-wider shadow-xl shadow-[#ED1C24]/30">
                  OIL
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg tracking-tight text-white">eRTMAC-NWIS</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#ED1C24]/20 text-[#ED1C24] border border-[#ED1C24]/40 font-bold">
                      Enterprise
                    </span>
                  </div>
                  <div className="text-xs text-[#A0AAB2] font-medium">Nearby Wells Intelligence System</div>
                </div>
              </div>

              <div className="mt-8">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#121416] border border-[#2E343A] text-xs text-[#A0AAB2] mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#27AE60] animate-pulse" />
                  <span className="text-white font-semibold">Human-in-the-Loop Verified DSS</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Historical Drilling Intelligence, Geological Context &amp; Evidence-Grounded Alerts.
                </h1>
                <p className="mt-3 text-xs sm:text-sm text-[#A0AAB2] leading-relaxed">
                  Bridge the gap between unstructured historical completion reports (WCR/DDR) and real-time drilling operations. Anticipate formation hazards with 50-meter look-ahead radar.
                </p>
              </div>
            </div>

            {/* Geological Layer Strip Preview */}
            <div className="my-6 p-4 rounded-2xl bg-[#121416]/90 border border-[#2E343A] space-y-2.5 relative z-10 backdrop-blur">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6C7781] flex items-center justify-between">
                <span>Active Basin Stratigraphic Target</span>
                <span className="text-[#27AE60] font-mono">Barail Arenaceous (Sandstone)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-[#1A1D20] border border-[#2E343A]">
                  <div className="text-[10px] text-[#A0AAB2]">Depth TVDSS</div>
                  <div className="font-mono font-bold text-white mt-0.5">2,480 - 2,920m</div>
                </div>
                <div className="p-2 rounded-lg bg-[#1A1D20] border border-[#2E343A]">
                  <div className="text-[10px] text-[#A0AAB2]">Historical Offset Loss</div>
                  <div className="font-mono font-bold text-[#ED1C24] mt-0.5">45.0 m³</div>
                </div>
                <div className="p-2 rounded-lg bg-[#1A1D20] border border-[#2E343A]">
                  <div className="text-[10px] text-[#A0AAB2]">Verified Remediation</div>
                  <div className="font-mono font-bold text-[#27AE60] mt-0.5">LCM Pill SOP-042</div>
                </div>
              </div>
            </div>

            {/* Footer / Copyright */}
            <div className="text-[11px] text-[#6C7781] flex items-center justify-between relative z-10">
              <span>Oil India Limited (OIL) • eRTMAC</span>
              <span>v1.4.2 Enterprise Secure</span>
            </div>
          </div>

          {/* Right Panel: Clean Login Card */}
          <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-between bg-[#1A1D20]">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Sign In to eRTMAC-NWIS</h2>
                  <p className="text-xs text-[#A0AAB2] mt-0.5">
                    Enter your credentials or select a pre-configured demo account below.
                  </p>
                </div>
                <Link
                  to="/"
                  className="text-xs text-[#ED1C24] hover:underline font-semibold"
                >
                  Public Overview
                </Link>
              </div>

              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center space-x-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#ED1C24]" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Username / Email field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white">Username or Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A0AAB2]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. driller or admin@oilindia.in"
                      className="w-full bg-[#121416] border border-[#2E343A] focus:border-[#ED1C24] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white">Password</label>
                    <span className="text-[11px] text-[#A0AAB2] cursor-pointer hover:text-white transition-colors">
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A0AAB2]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#121416] border border-[#2E343A] focus:border-[#ED1C24] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A0AAB2] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-xs text-[#A0AAB2] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#2E343A] text-[#ED1C24] focus:ring-[#ED1C24] bg-[#121416]"
                    />
                    <span>Remember this station</span>
                  </label>
                  <span className="text-[10px] text-[#6C7781] font-mono">TLS 1.3 Encrypted</span>
                </div>

                {/* Sign in button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold shadow-lg shadow-[#ED1C24]/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? 'Authenticating Station...' : 'Sign In to Platform'}</span>
                </button>
              </form>

              {/* Demo Accounts Quick Selection */}
              <div className="mt-6 pt-5 border-t border-[#2E343A]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0AAB2]">
                    Quick Demo Accounts (1-Click Fill)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-[#FFC72C] font-mono font-bold">
                    DEMO FIXTURES
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => handleQuickSelectRole(acc)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        username === acc.username
                          ? 'bg-[#ED1C24]/15 border-[#ED1C24] text-white shadow-sm'
                          : 'bg-[#121416] border-[#2E343A] text-[#A0AAB2] hover:border-[#4B5563] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{acc.label}</span>
                        {username === acc.username && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#ED1C24] shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-[#A0AAB2] truncate mt-0.5">{acc.name}</div>
                      <div className="text-[9px] text-[#6C7781] font-mono mt-0.5">{acc.tag}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-[11px] text-[#6C7781]">
              Protected under Oil India Limited IT &amp; Cybersecurity Guidelines.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
