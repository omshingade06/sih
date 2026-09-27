import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { AskNWISResponse } from '../types';
import { Bot, Send, BookOpen, ShieldCheck, Sparkles, AlertCircle, HelpCircle, Layers } from 'lucide-react';

export const AskNWISPage: React.FC = () => {
  const { activeWellId, activeWell, liveTelemetry, lookaheadSummary } = useApp();
  const [query, setQuery] = useState<string>('Which nearby wells experienced circulation loss?');
  const [response, setResponse] = useState<AskNWISResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const currentMd = liveTelemetry?.measured_depth ?? activeWell?.current_bit_depth_md ?? 2845.0;
  const currentFormation = lookaheadSummary?.current_formation ?? 'Barail Sandstone';

  const handleAsk = async (questionText?: string) => {
    const q = questionText || query;
    if (!q.trim()) return;

    try {
      setLoading(true);
      const res = await api.askNWIS(q, activeWellId, currentFormation, currentMd);
      setResponse(res);
    } catch (err) {
      console.error('Failed to query NWIS assistant', err);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Which nearby wells experienced circulation loss?',
    'Why is the current well at high risk?',
    'What happened in Barail Sandstone?',
    'Show wells similar to the active well',
    'What mitigation was successful for stuck pipe?'
  ];

  return (
    <div className="p-5 space-y-5 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#2D9CDB]/20 text-[#2D9CDB]">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white uppercase tracking-wider">
                Ask NWIS — Grounded Drilling Intelligence Copilot
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#27AE60]/20 text-[#27AE60] font-bold">
                ZERO-HALLUCINATION
              </span>
            </div>
            <p className="text-xs text-[#A0AAB2] mt-0.5">
              Strictly queries ingested offset WCRs, DDRs, and Upper Assam incident databases with page citations.
            </p>
          </div>
        </div>

        <div className="text-xs text-[#A0AAB2] font-mono">
          Context: <strong className="text-white">{activeWell?.well_name}</strong> ({currentMd.toFixed(0)}m, {currentFormation})
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(prompt);
              handleAsk(prompt);
            }}
            className="px-3 py-1.5 rounded-lg bg-[#1A1D20] hover:bg-[#231F20] border border-[#2E343A] text-xs text-[#A0AAB2] hover:text-white transition-all flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2D9CDB]" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Query Input Box */}
      <div className="p-2 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Ask anything about offset wells, formations, historical hazards, or SOP mitigations..."
          className="flex-1 bg-transparent px-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#6C7781] focus:outline-none"
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-[#ED1C24]/20 transition-all disabled:opacity-50 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>{loading ? 'Searching Evidence...' : 'Ask Copilot'}</span>
        </button>
      </div>

      {/* Response Card with Grounded Citations */}
      {response && (
        <div className="p-6 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-2xl space-y-5 animate-in fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#2E343A] pb-3">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-[#2D9CDB]" />
              <span className="text-xs font-bold text-white uppercase">Engineered Response</span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="text-[#27AE60] font-bold flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Grounded Evidence ({(response.confidence * 100).toFixed(0)}% Confidence)</span>
              </span>
            </div>
          </div>

          {/* Answer Text */}
          <div className="text-sm text-[#F5F6F8] leading-relaxed whitespace-pre-line bg-[#15181B] p-4 rounded-xl border border-[#2E343A]">
            {response.answer}
          </div>

          {/* Source Document Citations List */}
          {response.citations && response.citations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#A0AAB2] uppercase">
                <BookOpen className="w-4 h-4 text-[#2D9CDB]" />
                <span>Primary Document &amp; Historical Offset Sources ({response.citations.length})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {response.citations.map((cite, cIdx) => (
                  <div
                    key={cIdx}
                    className="p-3 rounded-xl bg-[#231F20] border border-[#2E343A] space-y-1 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{cite.well_name}</span>
                      <span className="text-[10px] font-mono text-[#2D9CDB] bg-[#15181B] px-1.5 py-0.5 rounded">
                        {cite.source_document} (Pg {cite.page_number})
                      </span>
                    </div>

                    <div className="text-[11px] text-[#A0AAB2]">
                      {cite.formation} • {cite.depth_interval}
                    </div>

                    <p className="text-[11px] text-[#F5F6F8] italic bg-[#15181B] p-2 rounded mt-1 border-l-2 border-[#ED1C24]">
                      "{cite.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Followups */}
          {response.suggested_followups && response.suggested_followups.length > 0 && (
            <div className="pt-3 border-t border-[#2E343A] space-y-2">
              <span className="text-[10px] font-bold uppercase text-[#A0AAB2]">Suggested Follow-Up Inquiries:</span>
              <div className="flex flex-wrap gap-2">
                {response.suggested_followups.map((fUp, fIdx) => (
                  <button
                    key={fIdx}
                    onClick={() => {
                      setQuery(fUp);
                      handleAsk(fUp);
                    }}
                    className="text-xs text-[#2D9CDB] hover:underline bg-[#15181B] px-3 py-1.5 rounded-lg border border-[#2E343A]"
                  >
                    → {fUp}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
