import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Award, 
  PieChart as PieIcon, 
  RefreshCw, 
  X,
  Target
} from 'lucide-react';
import { JournalEntry, CognitiveRadarReport } from '../types';

interface CognitiveRadarModalProps {
  entries: JournalEntry[];
  onClose: () => void;
  onError: (msg: string) => void;
}

export const CognitiveRadarModal: React.FC<CognitiveRadarModalProps> = ({
  entries,
  onClose,
  onError,
}) => {
  const [report, setReport] = useState<CognitiveRadarReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRadarReport = async () => {
    if (entries.length === 0) {
      onError('Write at least one reflection before generating your Cognitive Growth Radar.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/gemini/cognitive-radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: entries.map((e) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            mood: e.mood,
            summary: e.summary,
            messages: e.messages,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to analyze cognitive patterns.');
      }

      const data: CognitiveRadarReport = await res.json();
      setReport(data);
    } catch (err: any) {
      console.error('Cognitive Radar error:', err);
      onError(err?.message || 'Failed to analyze cognitive habits.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRadarReport();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#1A2826]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF7F2] border border-[#EAE4DC] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#EAE4DC] flex items-center justify-between sticky top-0 bg-[#FAF7F2] z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D4A43] text-[#FAF7F2] flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5 text-[#E6C994]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A2826]">
                Cognitive Growth &amp; Blind-Spot Radar
              </h2>
              <p className="text-xs font-sans text-[#737C78]">
                Long-term mental pattern analysis across {entries.length} reflections
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchRadarReport}
              disabled={isLoading}
              className="p-2 rounded-lg text-[#8C827A] hover:text-[#1A2826] hover:bg-[#EAE2D5] transition-colors"
              title="Refresh Analysis"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#8C827A] hover:text-[#1A2826] hover:bg-[#EAE2D5] transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {isLoading && !report && (
            <div className="py-20 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EAE2D5] border border-[#DDD3C2] flex items-center justify-center mx-auto text-[#8C5E3C] animate-pulse">
                <Compass className="w-6 h-6 animate-spin text-[#2D4A43]" />
              </div>
              <p className="text-base font-serif font-bold text-[#1A2826]">
                Gemini is synthesizing cross-journal mental patterns...
              </p>
              <p className="text-xs font-sans text-[#737C78] max-w-sm mx-auto">
                Comparing emotional trajectories, cognitive biases, and growth milestones.
              </p>
            </div>
          )}

          {report && (
            <>
              {/* Overall Mindset Banner */}
              <div className="bg-[#FAF8F5] border border-[#DFD7C7] p-5 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-xs font-serif font-bold text-[#8C5E3C]">
                  <Sparkles className="w-4 h-4 text-[#C06014]" />
                  <span>Psychological Trajectory &amp; Mindset Overview</span>
                </div>
                <p className="text-base font-serif text-[#1A2826] leading-relaxed">
                  {report.overallMindset}
                </p>
              </div>

              {/* Grid: Strengths & Blind Spots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Core Strengths */}
                <div className="bg-[#FFFFFF] border border-[#E8E2D8] p-5 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#2D4A43]">
                    <Award className="w-4 h-4 text-[#2D4A43]" />
                    <span>Top Observed Strengths</span>
                  </div>
                  <ul className="space-y-2 text-xs text-[#3D332A]">
                    {(report.topStrengths || []).map((str, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D4A43] mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Thematic Balance */}
                <div className="bg-[#FFFFFF] border border-[#E8E2D8] p-5 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#8C5E3C]">
                    <PieIcon className="w-4 h-4 text-[#8C5E3C]" />
                    <span>Thematic Energy Distribution</span>
                  </div>
                  <div className="space-y-2.5">
                    {(report.dominantThemes || []).map((thm, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-[#4A3B32]">
                          <span>{thm.theme}</span>
                          <span className="font-mono text-[11px] text-[#737C78]">
                            {thm.percentage}% ({thm.trend})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#F0EBE1] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#8C5E3C] rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(10, thm.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recurring Cognitive Habits & Blind Spots */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#9C4124]">
                  <AlertTriangle className="w-4 h-4 text-[#9C4124]" />
                  <span>Detected Cognitive Habits &amp; Recommended Reframing</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {(report.recurringBlockers || []).map((blocker, idx) => (
                    <div
                      key={idx}
                      className="bg-[#FDF8F5] border border-[#F0E3D7] p-4 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-serif font-bold text-sm text-[#1A2826]">
                          {blocker.biasName || 'Cognitive Friction Point'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#EAE2D5] text-[#4A3B32] font-mono text-[10px]">
                          {blocker.frequency}
                        </span>
                      </div>
                      <p className="text-[#5C2B1D]"><strong>Observed Pattern:</strong> {blocker.pattern}</p>
                      <div className="pt-2 border-t border-[#F0E3D7] text-[#1D3832] flex items-start space-x-2">
                        <span className="font-bold flex-shrink-0">Reframe Technique:</span>
                        <span>{blocker.suggestedReframing}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Focus for Next Week */}
              {report.recommendationForNextWeek && (
                <div className="bg-[#F0F5F2] border border-[#D0DFD4] p-4 sm:p-5 rounded-xl flex items-start space-x-3.5">
                  <Target className="w-5 h-5 text-[#2D4A43] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-serif font-bold text-[#2D4A43] uppercase tracking-wider block">
                      Targeted Practice for Upcoming Reflections
                    </span>
                    <p className="text-sm font-sans font-medium text-[#1A2826] mt-1 leading-relaxed">
                      {report.recommendationForNextWeek}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EAE4DC] flex justify-end bg-[#FAF7F2]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2D4A43] hover:bg-[#233A34] text-[#FAF7F2] font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
