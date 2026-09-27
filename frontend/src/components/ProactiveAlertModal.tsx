import React, { useState } from 'react';
import { Alert } from '../types';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  ShieldCheck,
  FileText,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  BookOpen,
  ArrowRight,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Share2
} from 'lucide-react';

interface ProactiveAlertModalProps {
  alert: Alert | null;
  onClose: () => void;
}

export const ProactiveAlertModal: React.FC<ProactiveAlertModalProps> = ({ alert, onClose }) => {
  const { acknowledgeAlert, submitAlertReview, user } = useApp();
  const [engineerNotes, setEngineerNotes] = useState<string>('Noted. Rig floor alerted. LCM pill mix underway on reserve pit.');
  const [decision, setDecision] = useState<string>('CONFIRMED_RELEVANT');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!alert) return null;

  const handleSubmitDecision = async (selectedDecision: string) => {
    setIsSubmitting(true);
    await submitAlertReview(alert.alert_id, selectedDecision, engineerNotes);
    setIsSubmitting(false);
    onClose();
  };

  const isCritical = alert.severity === 'CRITICAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Alert Strip */}
        <div
          className={`p-4 flex items-center justify-between ${
            isCritical
              ? 'bg-[#ED1C24] text-white'
              : 'bg-orange-600 text-white'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-black/20">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold opacity-90">
                PROACTIVE LOOK-AHEAD HAZARD ALERT (50m HORIZON)
              </span>
              <h2 className="text-lg font-black tracking-tight">
                {alert.severity} {alert.hazard_type.toUpperCase()} RISK
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Well & Horizon Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#15181B] border border-[#2E343A]">
              <div className="text-[10px] text-[#A0AAB2] uppercase">Active Well</div>
              <div className="text-xs font-bold text-white mt-0.5">{alert.well_name || 'OIL-DEMO-001'}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#15181B] border border-[#2E343A]">
              <div className="text-[10px] text-[#A0AAB2] uppercase">Current Bit Depth</div>
              <div className="text-xs font-mono font-bold text-[#F5F6F8] mt-0.5">{alert.current_depth} m MD</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#15181B] border border-[#2E343A]">
              <div className="text-[10px] text-[#A0AAB2] uppercase">Predicted Hazard Zone</div>
              <div className="text-xs font-mono font-bold text-[#ED1C24] mt-0.5">
                {alert.predicted_depth_start}–{alert.predicted_depth_end} m MD
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#15181B] border border-[#2E343A]">
              <div className="text-[10px] text-[#A0AAB2] uppercase">Geological Horizon</div>
              <div className="text-xs font-bold text-[#2D9CDB] mt-0.5 truncate">{alert.formation}</div>
            </div>
          </div>

          {/* Root Cause & Historical Evidence */}
          <div className="p-3.5 rounded-xl bg-[#231F20] border border-[#2E343A] space-y-2">
            <div className="flex items-center space-x-2 text-[#FFC72C]">
              <Sparkles className="w-4 h-4" />
              <span className="font-bold uppercase tracking-wider text-[11px]">
                Why This Alert Was Generated (Historical Grounding)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {alert.evidence &&
                alert.evidence.map((ev, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#1A1D20] border border-[#2E343A]/60 space-y-1">
                    <div className="flex justify-between items-center text-white font-bold">
                      <span className="truncate">{ev.well_name}</span>
                      <span className="text-[10px] text-[#2D9CDB] font-mono">{ev.source_doc}</span>
                    </div>
                    <div className="text-[10px] text-[#A0AAB2]">
                      Distance: <strong className="text-white">{ev.distance_m}m</strong> | NPT:{' '}
                      <strong className="text-[#ED1C24]">{ev.npt_hours}</strong> | Loss:{' '}
                      <strong className="text-white">{ev.loss_volume}</strong>
                    </div>
                    <p className="text-[10px] text-[#6C7781] italic">"{ev.summary}"</p>
                  </div>
                ))}
            </div>
          </div>

          {/* SOP Actions */}
          <div className="p-3.5 rounded-xl bg-[#15181B] border border-[#27AE60]/40 space-y-2">
            <div className="flex items-center space-x-2 text-[#27AE60]">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-bold uppercase tracking-wider text-[11px]">
                Prescribed Standard Operating Procedure (SOP Checklist)
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#1A1D20] text-xs text-white leading-relaxed whitespace-pre-line font-mono">
              {alert.recommended_action}
            </div>
          </div>

          {/* Engineer Review Decision Form */}
          <div className="p-3.5 rounded-xl bg-[#121416] border border-[#2E343A] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#ED1C24]" />
                <span>Engineer Review &amp; Decision Sign-off</span>
              </span>
              <span className="text-[10px] text-[#A0AAB2]">
                Signed by: <strong className="text-white">{user?.full_name || 'Drilling Engineer'}</strong>
              </span>
            </div>

            <textarea
              rows={2}
              value={engineerNotes}
              onChange={(e) => setEngineerNotes(e.target.value)}
              placeholder="Record engineering observations, bit status, or mud adjustments..."
              className="w-full bg-[#1A1D20] border border-[#2E343A] rounded-xl p-3 text-xs text-white outline-none focus:border-[#ED1C24]"
            />

            {/* Decision Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitDecision('FLAGGED_INCORRECT')}
                className="px-3 py-1.5 rounded-xl bg-[#231F20] hover:bg-red-950 text-red-400 border border-red-900/60 text-xs font-semibold flex items-center space-x-1"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Flag Incorrect Evidence</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitDecision('NOT_RELEVANT')}
                className="px-3 py-1.5 rounded-xl bg-[#231F20] hover:bg-[#2E343A] text-[#A0AAB2] text-xs font-semibold flex items-center space-x-1"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Not Relevant</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitDecision('CONFIRMED_RELEVANT')}
                className="px-4 py-1.5 rounded-xl bg-[#27AE60] hover:bg-emerald-600 text-white text-xs font-bold shadow-lg flex items-center space-x-1"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Confirm &amp; Acknowledge</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
