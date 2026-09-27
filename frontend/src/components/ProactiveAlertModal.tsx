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
  Sparkles
} from 'lucide-react';

interface ProactiveAlertModalProps {
  alert: Alert | null;
  onClose: () => void;
}

export const ProactiveAlertModal: React.FC<ProactiveAlertModalProps> = ({ alert, onClose }) => {
  const { acknowledgeAlert } = useApp();
  const [engineerNotes, setEngineerNotes] = useState<string>('Noted. Rig floor alerted. LCM pill mix underway on reserve pit.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!alert) return null;

  const handleAcknowledge = async () => {
    setIsSubmitting(true);
    await acknowledgeAlert(alert.alert_id, engineerNotes);
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
                PROACTIVE LOOK-AHEAD HAZARD ALERT
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
            <p className="text-[#F5F6F8] leading-relaxed">
              3 of 4 relevant offset wells experienced severe lost circulation in the Barail Sandstone
              horizon at normalized formation depth &eta;_norm &approx; 0.70 - 0.76.
            </p>

            {/* Evidence List */}
            <div className="space-y-1.5 pt-1">
              {alert.evidence.map((ev, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-[#15181B] border border-[#2E343A] flex items-center justify-between text-[11px]"
                >
                  <div>
                    <span className="font-bold text-white">{ev.well_name || 'Offset Well'}</span>
                    <span className="text-[#A0AAB2] ml-2 font-mono">
                      ({ev.distance_m}m away, Loss: {ev.loss_volume}, NPT: {ev.npt_hours})
                    </span>
                    <div className="text-[10px] text-[#6C7781] mt-0.5">{ev.summary}</div>
                  </div>
                  <div className="text-[10px] text-[#2D9CDB] font-mono shrink-0 ml-3 flex items-center space-x-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{ev.source_doc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Retrieved Historical Mitigation Strategy */}
          <div className="p-3.5 rounded-xl bg-[#15181B] border border-[#27AE60]/40 space-y-2">
            <div className="flex items-center space-x-2 text-[#27AE60]">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-bold uppercase tracking-wider text-[11px]">
                Historical Successful Mitigation (Zero-Hallucination Retrieval)
              </span>
            </div>

            {alert.mitigation_options && alert.mitigation_options.length > 0 ? (
              <div className="space-y-1.5 text-xs text-[#F5F6F8]">
                <div className="p-2.5 rounded-lg bg-[#1A1D20] border border-[#2E343A] space-y-1">
                  <div className="font-bold text-white">{alert.mitigation_options[0].strategy}</div>
                  <div className="text-[11px] text-[#A0AAB2]">
                    <span className="text-white font-semibold">Material:</span> {alert.mitigation_options[0].material}
                  </div>
                  <div className="flex items-center space-x-4 text-[11px] text-[#A0AAB2] pt-1">
                    <span><strong className="text-white">Volume:</strong> {alert.mitigation_options[0].volume}</span>
                    <span><strong className="text-white">Soaking:</strong> {alert.mitigation_options[0].soaking_time}</span>
                    <span className="text-[#27AE60] font-bold">{alert.mitigation_options[0].success_rate}</span>
                  </div>
                  <div className="text-[10px] text-[#2D9CDB] font-mono mt-1">
                    SOP Reference: {alert.mitigation_options[0].SOP_reference}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#A0AAB2]">
                Apply standard loss mitigation SOP OIL-SOP-DRL-042 Rev.3. Pre-mix 25 m³ LCM pill.
              </p>
            )}
          </div>

          {/* Recommended Proactive Action */}
          <div className="p-3.5 rounded-xl bg-[#231F20] border border-[#2E343A] space-y-1.5">
            <span className="font-bold text-white uppercase tracking-wider text-[10px]">
              Recommended Rig Protocol &amp; Preparation
            </span>
            <p className="text-xs text-[#A0AAB2] whitespace-pre-line leading-relaxed">
              {alert.recommended_action}
            </p>
          </div>

          {/* Operational Acknowledgment Form */}
          <div className="p-3.5 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-2">
            <label className="block text-[11px] font-bold text-white uppercase">
              Engineer Acknowledgment &amp; Action Log
            </label>
            <textarea
              rows={2}
              value={engineerNotes}
              onChange={(e) => setEngineerNotes(e.target.value)}
              className="w-full bg-[#1A1D20] border border-[#2E343A] rounded-lg p-2 text-xs text-white focus:border-[#ED1C24] focus:outline-none"
              placeholder="Log mitigation actions taken on rig site..."
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-[#2E343A] bg-[#15181B] flex items-center justify-between">
          <span className="text-[11px] text-[#6C7781] font-mono">
            Confidence: {(alert.confidence * 100).toFixed(0)}% | Risk Index: {alert.risk_score}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#231F20] border border-[#2E343A] text-[#A0AAB2] hover:text-white text-xs font-semibold"
            >
              Dismiss
            </button>
            <button
              onClick={handleAcknowledge}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-[#ED1C24]/25 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Logging Action...' : 'Acknowledge & Log Action'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
