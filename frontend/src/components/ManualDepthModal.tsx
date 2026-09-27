import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Ruler, CheckCircle2, AlertCircle, X, Sparkles, Clock } from 'lucide-react';

interface ManualDepthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualDepthModal: React.FC<ManualDepthModalProps> = ({ isOpen, onClose }) => {
  const { activeWell, updateBitDepthManual, user } = useApp();
  const [depthInput, setDepthInput] = useState<number>(activeWell?.current_bit_depth_md || 2845.0);
  const [depthRef, setDepthRef] = useState<string>('MD');
  const [depthUnit, setDepthUnit] = useState<string>('m');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !activeWell) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (depthInput < 0) {
      setErrorMsg('Bit depth cannot be negative.');
      return;
    }

    if (depthInput > activeWell.total_depth_md + 300) {
      setErrorMsg(`Bit depth ${depthInput}m exceeds well planned TD ${activeWell.total_depth_md}m.`);
      return;
    }

    try {
      setSubmitting(true);
      await updateBitDepthManual(depthInput, depthRef, depthUnit, note);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update bit depth');
    } finally {
      setSubmitting(false);
    }
  };

  // Approximated TVDSS
  const ratio = activeWell.total_depth_md > 0 ? activeWell.total_depth_tvd / activeWell.total_depth_md : 0.94;
  const calcTvd = Math.round(depthInput * ratio * 10) / 10;
  const calcTvdss = Math.round((calcTvd - activeWell.KB_elevation) * 10) / 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#2E343A] flex items-center justify-between bg-[#15181B]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#ED1C24]/20 border border-[#ED1C24]/30 text-[#ED1C24]">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Manual Bit Depth Entry</h2>
              <p className="text-xs text-[#A0AAB2]">
                Active Well: <span className="text-white font-semibold">{activeWell.well_name}</span> ({activeWell.UWI})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A0AAB2] hover:text-white hover:bg-[#2E343A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Bit depth recorded and look-ahead radar synchronized successfully!</span>
            </div>
          )}

          {/* Current Depth vs New Depth */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#121416] border border-[#2E343A]">
            <div>
              <span className="text-[10px] text-[#A0AAB2] uppercase font-bold tracking-wider">Current Recorded MD</span>
              <div className="text-lg font-black font-mono text-white mt-0.5">
                {activeWell.current_bit_depth_md.toFixed(1)} <span className="text-xs text-[#A0AAB2]">m</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[#A0AAB2] uppercase font-bold tracking-wider">Well Total Depth</span>
              <div className="text-lg font-black font-mono text-[#2D9CDB] mt-0.5">
                {activeWell.total_depth_md.toFixed(1)} <span className="text-xs text-[#A0AAB2]">m</span>
              </div>
            </div>
          </div>

          {/* Input fields */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white flex items-center justify-between">
              <span>New Bit Depth</span>
              <span className="text-[10px] text-[#A0AAB2]">Kelly Bushing datum</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                step="0.1"
                min="0"
                max={activeWell.total_depth_md + 200}
                required
                value={depthInput}
                onChange={(e) => setDepthInput(parseFloat(e.target.value) || 0)}
                className="flex-1 bg-[#121416] border border-[#2E343A] focus:border-[#ED1C24] rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none transition-colors"
              />
              <select
                value={depthRef}
                onChange={(e) => setDepthRef(e.target.value)}
                className="bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2.5 text-xs font-semibold text-white outline-none"
              >
                <option value="MD">MD (Measured)</option>
                <option value="TVD">TVD (True Vertical)</option>
                <option value="TVDSS">TVDSS (Subsea)</option>
              </select>
              <select
                value={depthUnit}
                onChange={(e) => setDepthUnit(e.target.value)}
                className="bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2.5 text-xs font-semibold text-white outline-none"
              >
                <option value="m">meters (m)</option>
                <option value="ft">feet (ft)</option>
              </select>
            </div>
          </div>

          {/* Deterministic calculation feedback */}
          <div className="p-3 rounded-xl bg-[#15181B] border border-[#2E343A]/80 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[#A0AAB2]">
              <span>Approx. TVD (Vertical):</span>
              <span className="font-mono text-white font-semibold">{calcTvd} m</span>
            </div>
            <div className="flex items-center justify-between text-[#A0AAB2]">
              <span>Formula TVDSS (TVD - KB {activeWell.KB_elevation}m):</span>
              <span className="font-mono text-[#27AE60] font-semibold">{calcTvdss} m MSL</span>
            </div>
            <div className="flex items-center justify-between text-[#A0AAB2]">
              <span>Logged by:</span>
              <span className="text-white">{user?.full_name || 'Drilling Engineer'}</span>
            </div>
          </div>

          {/* Engineering remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white">Engineering Remarks / Connection Context (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Drilling ahead in Barail member after survey at Stand 92"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#121416] border border-[#2E343A] focus:border-[#ED1C24] rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#231F20] hover:bg-[#2E343A] text-xs font-semibold text-[#A0AAB2] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-xs font-bold text-white shadow-lg shadow-[#ED1C24]/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{submitting ? 'Updating...' : 'Save & Trigger Look-Ahead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
