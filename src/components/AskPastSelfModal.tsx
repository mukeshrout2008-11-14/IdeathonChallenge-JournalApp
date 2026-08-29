import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  History, 
  Calendar, 
  ArrowRight, 
  Bookmark, 
  Lightbulb, 
  ChevronRight, 
  MessageSquare,
  BookOpen
} from 'lucide-react';
import { JournalEntry, PastSelfAnswer } from '../types';

interface AskPastSelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onSelectEntry: (entryId: string) => void;
  onError: (msg: string) => void;
}

export const AskPastSelfModal: React.FC<AskPastSelfModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSelectEntry,
  onError,
}) => {
  const [question, setQuestion] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<PastSelfAnswer | null>(null);

  if (!isOpen) return null;

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim()) {
      onError('Please enter a question to ask your past self.');
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch('/api/gemini/ask-past-self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          entries: entries.map(e => ({
            id: e.id,
            title: e.title,
            category: e.category,
            mood: e.mood,
            summary: e.summary,
            createdAt: e.createdAt,
            messages: e.messages.slice(0, 4),
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to search your past journal archive.');
      }

      const data: PastSelfAnswer = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Ask past self error:', err);
      onError(err.message || 'Could not query past self archive.');
    } finally {
      setIsSearching(false);
    }
  };

  const sampleQueries = [
    'How did I handle stress or burnout in the past?',
    'What was my mindset when making a major career transition?',
    'What recurring habits or routines brought me the most energy?',
    'What lessons did I learn from past mistakes or failed attempts?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#182624]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#EAE4DC] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#8C5E3C] text-[#FAF7F2] flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#182624]">Ask My Past Self</h2>
              <p className="text-xs text-[#737C78]">Semantic wisdom synthesis across your {entries.length} past reflections</p>
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
          {/* Search Form */}
          <form onSubmit={handleAsk} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#737C78]">
              What would you like to ask your past self?
            </label>
            <div className="relative">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. When did I last feel stuck and what helped me break through?"
                className="w-full pl-4 pr-28 py-3 text-xs sm:text-sm bg-[#FFFFFF] border border-[#DCD3C4] rounded-xl focus:border-[#8C5E3C] focus:outline-none transition-colors placeholder:text-[#A69D92]"
              />
              <button
                type="submit"
                disabled={isSearching || !question.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 text-xs font-bold rounded-lg bg-[#8C5E3C] hover:bg-[#724B2F] text-[#FAF7F2] disabled:opacity-50 transition-all flex items-center space-x-1.5 shadow-2xs"
              >
                {isSearching ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Inspiration Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] font-medium text-[#8C7E72] self-center mr-1">Inspirations:</span>
              {sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuestion(q)}
                  className="px-2.5 py-1 rounded-full bg-[#EFE8DC] hover:bg-[#E5DAC8] text-[#4A3B32] text-[11px] font-medium transition-colors border border-[#E0D5C4]"
                >
                  {q}
                </button>
              ))}
            </div>
          </form>

          {/* Results Display */}
          {result && (
            <div className="space-y-4 pt-4 border-t border-[#EAE4DC] animate-in fade-in duration-300">
              {/* Answer Card */}
              <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E8E2D8] shadow-2xs space-y-4">
                <div className="flex items-center space-x-2 text-[#8C5E3C] border-b border-[#F0EBE1] pb-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-serif font-bold text-sm text-[#182624]">Synthesis From Your Archives</span>
                </div>

                <div className="text-xs sm:text-sm text-[#3D332A] leading-relaxed whitespace-pre-line">
                  {result.answer}
                </div>

                {/* Key Takeaway Banner */}
                {result.keyTakeaway && (
                  <div className="p-3.5 rounded-xl bg-[#F3ECE4] border border-[#E5DACD] flex items-start space-x-2 text-xs text-[#4A3B32]">
                    <Lightbulb className="w-4 h-4 text-[#8C5E3C] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#8C5E3C] block mb-0.5">Core Historical Lesson:</span>
                      <span>{result.keyTakeaway}</span>
                    </div>
                  </div>
                )}

                {/* Action Advice */}
                {result.actionAdvice && (
                  <div className="p-3.5 rounded-xl bg-[#2D4A43] text-[#FAF7F2] text-xs space-y-1">
                    <span className="font-bold text-[#E6C994] flex items-center space-x-1.5">
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Actionable Advice From Past Self</span>
                    </span>
                    <p className="text-[#E0EBE8]">{result.actionAdvice}</p>
                  </div>
                )}
              </div>

              {/* Matched Past Entries */}
              {result.relevantEntries && result.relevantEntries.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#737C78]">
                    Referenced Journal Reflections ({result.relevantEntries.length})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.relevantEntries.map((ref, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E8E2D8] hover:border-[#8C5E3C] transition-all flex flex-col justify-between shadow-2xs group"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-[#737C78] mb-1">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{ref.date}</span>
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-[#182624] group-hover:text-[#8C5E3C] transition-colors mb-1">
                            {ref.title}
                          </h4>
                          <p className="text-[11px] text-[#5A5046] italic line-clamp-2">
                            "{ref.contextExcerpt}"
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-[#F0EBE1] flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectEntry(ref.id);
                              onClose();
                            }}
                            className="text-[11px] font-bold text-[#8C5E3C] hover:text-[#5E3B22] flex items-center space-x-1"
                          >
                            <span>Open Reflection</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
