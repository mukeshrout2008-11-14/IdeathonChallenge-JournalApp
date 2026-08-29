import React, { useState, useEffect } from 'react';
import { 
  GitFork, 
  Scale, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  ShieldAlert, 
  Lightbulb, 
  Calendar,
  X,
  RefreshCw
} from 'lucide-react';
import { DecisionAnalysis } from '../types';

interface DecisionStudioProps {
  initialDilemma?: string;
  existingAnalysis?: DecisionAnalysis;
  onSaveAnalysis: (analysis: DecisionAnalysis) => void;
  onClose?: () => void;
  onError: (msg: string) => void;
}

export const DecisionStudio: React.FC<DecisionStudioProps> = ({
  initialDilemma = '',
  existingAnalysis,
  onSaveAnalysis,
  onClose,
  onError,
}) => {
  const [dilemma, setDilemma] = useState(existingAnalysis?.dilemma || initialDilemma);
  const [context, setContext] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(existingAnalysis || null);

  useEffect(() => {
    if (existingAnalysis) {
      setAnalysis(existingAnalysis);
      setDilemma(existingAnalysis.dilemma || initialDilemma);
    } else {
      setAnalysis(null);
      setDilemma(initialDilemma);
    }
  }, [existingAnalysis, initialDilemma]);

  const handleSimulate = async () => {
    if (!dilemma.trim()) {
      onError('Please describe the dilemma or choice you are facing.');
      return;
    }

    try {
      setIsSimulating(true);
      const options = [];
      if (optionA.trim()) options.push(optionA.trim());
      if (optionB.trim()) options.push(optionB.trim());

      const res = await fetch('/api/gemini/decision-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dilemma: dilemma.trim(),
          options,
          context: context.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to simulate decision choices.');
      }

      const data: DecisionAnalysis = await res.json();
      setAnalysis(data);
      onSaveAnalysis(data);
    } catch (err: any) {
      console.error('Decision simulation error:', err);
      onError(err?.message || 'Failed to simulate decision outcomes.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-[#FAF7F2] p-4 sm:p-6 rounded-2xl border border-[#EAE4DC] shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EAE4DC] pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAE2D5] text-[#8C5E3C] flex items-center justify-center border border-[#DDD3C2]">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A2826]">
              Decision Architecture Studio
            </h2>
            <p className="text-xs font-sans text-[#737C78]">
              10/10/10 timeline simulation, risk neutralizers, &amp; compound outcome modeling.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#1A2826] hover:bg-[#EAE2D5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Input Section */}
      {!analysis ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-serif font-bold text-[#1A2826] mb-1.5">
              What major dilemma or strategic crossroads are you considering?
            </label>
            <textarea
              value={dilemma}
              onChange={(e) => setDilemma(e.target.value)}
              placeholder="e.g. Should I accept the senior leadership role at a Series B startup, or stay in my stable enterprise position to build my own project?"
              rows={3}
              className="w-full bg-[#FFFFFF] border border-[#DCD3C4] rounded-xl p-3 text-sm text-[#1A2826] focus:border-[#2D4A43] focus:ring-2 focus:ring-[#2D4A43]/20 focus:outline-none placeholder:text-[#9E958C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                Option A (Optional custom branch)
              </label>
              <input
                type="text"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder="e.g. Take the startup leadership role"
                className="w-full bg-[#FFFFFF] border border-[#DCD3C4] rounded-lg px-3 py-2 text-xs text-[#1A2826] focus:border-[#2D4A43] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                Option B (Optional custom branch)
              </label>
              <input
                type="text"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder="e.g. Stay put &amp; launch side venture"
                className="w-full bg-[#FFFFFF] border border-[#DCD3C4] rounded-lg px-3 py-2 text-xs text-[#1A2826] focus:border-[#2D4A43] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A3B32] mb-1">
              Personal stakes or hidden constraints (financial buffer, family, health)
            </label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. 6-month savings runway, want more autonomy, feeling stagnant lately."
              className="w-full bg-[#FFFFFF] border border-[#DCD3C4] rounded-lg px-3 py-2 text-xs text-[#1A2826] focus:border-[#2D4A43] focus:outline-none"
            />
          </div>

          <button
            onClick={handleSimulate}
            disabled={isSimulating || !dilemma.trim()}
            className="w-full py-3 px-4 rounded-xl bg-[#2D4A43] hover:bg-[#233A34] text-[#FAF7F2] font-semibold text-sm shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50 border border-[#233A34]"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Simulating 10/10/10 Timelines with Gemini...</span>
              </>
            ) : (
              <>
                <Scale className="w-4 h-4 text-[#E6C994]" />
                <span>Simulate Decision Architecture</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Analysis Results Display */
        <div className="space-y-6">
          {/* Rationale & Values */}
          <div className="bg-[#FAF8F5] border border-[#DFD7C7] p-4 sm:p-5 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#8C5E3C]">
              <Sparkles className="w-4 h-4 text-[#C06014]" />
              <span>Recommended Strategic Path</span>
            </div>
            <p className="text-base font-serif font-bold text-[#1A2826] leading-relaxed">
              {analysis.recommendedPath}
            </p>

            <div className="pt-2 border-t border-[#EAE4DC] flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[#737C78]">Core Values at Stake:</span>
              {(analysis.coreValuesAtStake || []).map((val, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full bg-[#EAE2D5] text-[#4A3B32] text-xs font-medium border border-[#DCD3C4]"
                >
                  {val}
                </span>
              ))}
            </div>
          </div>

          {/* Option Comparison Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(analysis.options || []).map((opt, idx) => (
              <div
                key={idx}
                className="bg-[#FFFFFF] border border-[#E8E2D8] rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:border-[#D5C9B8] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#F0EBE1] text-[#4A3B32] border border-[#E2D8C7]">
                      Branch {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-[#737C78]">
                      Emotional Resonance: <strong className="text-[#1A2826]">{opt.emotionalScore}/10</strong>
                    </span>
                  </div>

                  <h3 className="text-lg font-serif font-bold text-[#1A2826] mb-2">
                    {opt.name}
                  </h3>

                  {/* 10/10/10 Framework */}
                  <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#EAE4DC] space-y-2 mb-3 text-xs">
                    <div className="font-serif font-bold text-[#8C5E3C] flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>The 10/10/10 Time Horizon</span>
                    </div>
                    <div className="text-[#3D332A]">
                      <strong className="text-[#1A2826]">In 10 Days: </strong>
                      {opt.impact10Days}
                    </div>
                    <div className="text-[#3D332A]">
                      <strong className="text-[#1A2826]">In 10 Months: </strong>
                      {opt.impact10Months}
                    </div>
                    <div className="text-[#3D332A]">
                      <strong className="text-[#1A2826]">In 10 Years: </strong>
                      {opt.impact10Years}
                    </div>
                  </div>

                  {/* Worst Case & Mitigation */}
                  <div className="p-3 bg-[#FDF8F5] border border-[#F0E3D7] rounded-lg text-xs space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-[#9C4124] font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Worst-Case Risk &amp; Mitigation</span>
                    </div>
                    <p className="text-[#5C2B1D]"><strong>Risk:</strong> {opt.worstCaseScenario}</p>
                    <p className="text-[#1D3832]"><strong>Recovery Strategy:</strong> {opt.mitigationStrategy}</p>
                  </div>
                </div>

                {/* Pros & Cons list */}
                <div className="pt-2 border-t border-[#F0EBE1] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-bold text-[#2D4A43] block mb-1">Pros</span>
                    <ul className="space-y-1 list-disc list-inside text-[#3D332A]">
                      {(opt.pros || []).map((p, pIdx) => (
                        <li key={pIdx} className="leading-tight">{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold text-[#9C4124] block mb-1">Cons</span>
                    <ul className="space-y-1 list-disc list-inside text-[#5A5046]">
                      {(opt.cons || []).map((c, cIdx) => (
                        <li key={cIdx} className="leading-tight">{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Immediate Action Step */}
          {analysis.suggestedActionFirstStep && (
            <div className="bg-[#F0F5F2] border border-[#D0DFD4] p-4 rounded-xl flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-[#2D4A43] flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-[#2D4A43] uppercase tracking-wider block">
                  Next 24-Hour Micro-Action
                </span>
                <p className="text-sm font-sans font-medium text-[#1A2826] mt-0.5">
                  {analysis.suggestedActionFirstStep}
                </p>
              </div>
            </div>
          )}

          {/* Re-simulate or reset button */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setAnalysis(null)}
              className="text-xs font-semibold text-[#8C5E3C] hover:underline"
            >
              &larr; Adjust inputs &amp; re-simulate
            </button>
            <span className="text-[11px] text-[#737C78]">
              Saved to your isolated Firestore journal record
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
