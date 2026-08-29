import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Smile, 
  Flame, 
  Calendar, 
  Activity, 
  Award, 
  Clock, 
  Zap,
  Sparkles,
  BarChart3,
  X
} from 'lucide-react';
import { JournalEntry } from '../types';

interface BiorythmVisualizerProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
}

export const BiorythmVisualizer: React.FC<BiorythmVisualizerProps> = ({
  isOpen,
  onClose,
  entries,
}) => {
  if (!isOpen) return null;

  // Compute analytics
  const analytics = useMemo(() => {
    const total = entries.length;
    
    // Mood counts
    const moodMap: Record<string, number> = {};
    entries.forEach(e => {
      const m = e.mood || 'Reflective';
      moodMap[m] = (moodMap[m] || 0) + 1;
    });

    const sortedMoods = Object.entries(moodMap).sort((a, b) => b[1] - a[1]);

    // Daily activity map for the last 28 days
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const daysGrid: Array<{ dateStr: string; timestamp: number; count: number; dayName: string }> = [];

    for (let i = 27; i >= 0; i--) {
      const dayStart = new Date(now - i * dayMs);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + dayMs);

      const matchingEntries = entries.filter(e => e.createdAt >= dayStart.getTime() && e.createdAt < dayEnd.getTime());
      daysGrid.push({
        dateStr: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: dayStart.getTime(),
        count: matchingEntries.length,
        dayName: dayStart.toLocaleDateString('en-US', { weekday: 'narrow' }),
      });
    }

    // Calculate streak
    let currentStreak = 0;
    for (let i = daysGrid.length - 1; i >= 0; i--) {
      if (daysGrid[i].count > 0) {
        currentStreak++;
      } else if (i === daysGrid.length - 1) {
        // Today hasn't happened yet, check yesterday
        continue;
      } else {
        break;
      }
    }

    // Word count / cognitive depth estimate
    const totalWords = entries.reduce((acc, e) => {
      const wordsInMsgs = e.messages.reduce((mAcc, m) => mAcc + (m.content.split(/\s+/).length || 0), 0);
      return acc + wordsInMsgs;
    }, 0);

    return {
      total,
      sortedMoods,
      daysGrid,
      currentStreak,
      totalWords,
      avgWordsPerEntry: total > 0 ? Math.round(totalWords / total) : 0,
    };
  }, [entries]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#182624]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#EAE4DC] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D4A43] text-[#FAF7F2] flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#182624]">Emotional Biorythm &amp; Momentum</h2>
              <p className="text-xs text-[#737C78]">Habit consistency, reflection rhythm, and emotional tone distribution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#DCD3C4] text-[#737C78] hover:text-[#182624] hover:bg-[#FAF7F2] transition-colors"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E8E2D8] shadow-2xs">
              <div className="flex items-center space-x-1.5 text-xs text-[#737C78] mb-1">
                <Flame className="w-3.5 h-3.5 text-[#9C4124]" />
                <span>Daily Streak</span>
              </div>
              <div className="text-2xl font-serif font-bold text-[#182624]">
                {analytics.currentStreak} <span className="text-xs font-sans text-[#737C78]">days</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E8E2D8] shadow-2xs">
              <div className="flex items-center space-x-1.5 text-xs text-[#737C78] mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#2D4A43]" />
                <span>Reflections</span>
              </div>
              <div className="text-2xl font-serif font-bold text-[#182624]">
                {analytics.total}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E8E2D8] shadow-2xs">
              <div className="flex items-center space-x-1.5 text-xs text-[#737C78] mb-1">
                <BarChart3 className="w-3.5 h-3.5 text-[#8C5E3C]" />
                <span>Total Words</span>
              </div>
              <div className="text-2xl font-serif font-bold text-[#182624]">
                {analytics.totalWords.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E8E2D8] shadow-2xs">
              <div className="flex items-center space-x-1.5 text-xs text-[#737C78] mb-1">
                <Zap className="w-3.5 h-3.5 text-[#E6C994]" />
                <span>Avg Depth</span>
              </div>
              <div className="text-2xl font-serif font-bold text-[#182624]">
                {analytics.avgWordsPerEntry} <span className="text-xs font-sans text-[#737C78]">w/entry</span>
              </div>
            </div>
          </div>

          {/* 28-Day Activity Heatmap */}
          <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E8E2D8] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#737C78] flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#2D4A43]" />
                <span>28-Day Consistency Heatmap</span>
              </h3>
              <span className="text-[11px] text-[#737C78]">Last 4 Weeks</span>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-2">
              {analytics.daysGrid.map((day, idx) => {
                let intensityClass = 'bg-[#F2ECE4] border-[#E8DFD3] text-[#A69D92]';
                if (day.count === 1) intensityClass = 'bg-[#D2E0DC] border-[#B5CCC6] text-[#2D4A43] font-bold';
                if (day.count === 2) intensityClass = 'bg-[#8CAEA4] border-[#779E93] text-[#FAF7F2] font-bold';
                if (day.count >= 3) intensityClass = 'bg-[#2D4A43] border-[#203732] text-[#FAF7F2] font-bold';

                return (
                  <div
                    key={idx}
                    className={`h-12 rounded-xl border p-1.5 flex flex-col justify-between transition-transform hover:scale-105 ${intensityClass}`}
                    title={`${day.dateStr}: ${day.count} reflection${day.count === 1 ? '' : 's'}`}
                  >
                    <span className="text-[10px] opacity-80">{day.dateStr.split(' ')[1]}</span>
                    <span className="text-[11px] self-end">{day.count > 0 ? `${day.count}x` : '—'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mood & Tone Distribution */}
          <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E8E2D8] shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#737C78] flex items-center space-x-1.5">
              <Smile className="w-3.5 h-3.5 text-[#8C5E3C]" />
              <span>Emotional Tone Resonance</span>
            </h3>

            {analytics.sortedMoods.length === 0 ? (
              <p className="text-xs text-[#737C78] italic">No mood data recorded yet. Reflect or synthesize entries to track emotional tone.</p>
            ) : (
              <div className="space-y-2.5">
                {analytics.sortedMoods.slice(0, 6).map(([mood, count], idx) => {
                  const percentage = Math.round((count / analytics.total) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#182624]">{mood}</span>
                        <span className="text-[11px] text-[#737C78]">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#EFE8DC] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#2D4A43] transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
