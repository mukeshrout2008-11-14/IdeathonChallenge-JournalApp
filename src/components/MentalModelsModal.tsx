import React, { useState } from 'react';
import { 
  Boxes, 
  Lightbulb, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  HelpCircle,
  Zap,
  RotateCcw
} from 'lucide-react';
import { MentalModelDeconstruction } from '../types';

interface MentalModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialThought?: string;
  onApplyToJournal: (deconstruction: MentalModelDeconstruction) => void;
  onError: (msg: string) => void;
}

const AVAILABLE_MODELS = [
  {
    key: 'first_principles',
    name: 'First Principles Thinking',
    badge: 'Foundational Truths',
    desc: 'Break problems down into irreducible truths and reason up, eliminating assumed conventions.',
  },
  {
    key: 'inversion',
    name: 'Inversion (Charlie Munger)',
    badge: 'Failure Prevention',
    desc: 'Solve challenges backwards by asking how to guarantee catastrophic failure, then avoiding those pitfalls.',
  },
  {
    key: 'second_order',
    name: 'Second-Order Thinking',
    badge: 'Long-term Ripple Effects',
    desc: 'Ask "And then what?" to anticipate downstream consequences that first-order thinkers overlook.',
  },
  {
    key: 'pareto_80_20',
    name: 'Pareto 80/20 Principle',
    badge: 'Extreme Leverage',
    desc: 'Isolate the vital 20% of inputs causing 80% of current outcomes or 80% of frustration.',
  },
  {
    key: 'occams_razor',
    name: "Occam's & Hanlon's Razor",
    badge: 'Simplicity & Clarity',
    desc: 'Choose the simplest hypothesis with fewest assumptions and assume ignorance over malice.',
  },
  {
    key: 'circle_of_competence',
    name: 'Circle of Competence',
    badge: 'Self-Aware Boundary',
    desc: 'Know the exact perimeter of what you deeply understand vs. where you are guessing or mimicking.',
  },
];

export const MentalModelsModal: React.FC<MentalModelsModalProps> = ({
  isOpen,
  onClose,
  initialThought = '',
  onApplyToJournal,
  onError,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('first_principles');
  const [thoughtInput, setThoughtInput] = useState<string>(initialThought);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [deconstruction, setDeconstruction] = useState<MentalModelDeconstruction | null>(null);

  if (!isOpen) return null;

  const handleDeconstruct = async () => {
    if (!thoughtInput.trim()) {
      onError('Please describe the thought, challenge, or situation you want to deconstruct.');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch('/api/gemini/mental-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dilemma: thoughtInput,
          modelKey: selectedModel,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate mental model deconstruction.');
      }

      const data: MentalModelDeconstruction = await response.json();
      setDeconstruction(data);
    } catch (err: any) {
      console.error('Mental models error:', err);
      onError(err.message || 'Could not deconstruct through mental model.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (deconstruction) {
      onApplyToJournal(deconstruction);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#182624]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#EAE4DC] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D4A43] text-[#FAF7F2] flex items-center justify-center shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#182624]">Mental Model Deconstruction</h2>
              <p className="text-xs text-[#737C78]">Deconstruct complex problems using world-class thinking frameworks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#DCD3C4] text-[#737C78] hover:text-[#182624] hover:bg-[#FAF7F2] transition-colors"
          >
            Close
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Framework Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#737C78] mb-2.5">
              1. Choose Mental Model Lens
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {AVAILABLE_MODELS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSelectedModel(m.key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedModel === m.key
                      ? 'border-[#2D4A43] bg-[#F2ECE4] text-[#1A2826] shadow-2xs'
                      : 'border-[#E8E2D8] bg-[#FFFFFF] text-[#5A5046] hover:border-[#D5C9B8]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#1A2826]">{m.name}</span>
                  </div>
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded bg-[#E4DACD] text-[#4A3B32] mb-1.5">
                    {m.badge}
                  </span>
                  <p className="text-[11px] text-[#737C78] leading-tight line-clamp-2">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Thought Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#737C78] mb-2">
              2. Describe the Challenge, Dilemma, or Project
            </label>
            <textarea
              value={thoughtInput}
              onChange={(e) => setThoughtInput(e.target.value)}
              rows={3}
              placeholder="e.g., I'm debating whether to completely rewrite our product architecture or patch existing modules under deadline pressure..."
              className="w-full p-3.5 text-xs sm:text-sm bg-[#FFFFFF] border border-[#DCD3C4] rounded-xl focus:border-[#2D4A43] focus:outline-none transition-colors placeholder:text-[#A69D92]"
            />
          </div>

          {/* Deconstruct Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handleDeconstruct}
              disabled={isProcessing || !thoughtInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#2D4A43] hover:bg-[#233A34] text-[#FAF7F2] text-xs sm:text-sm font-bold shadow-xs flex items-center space-x-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Deconstructing with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#E6C994]" />
                  <span>Deconstruct through {AVAILABLE_MODELS.find(m => m.key === selectedModel)?.name}</span>
                </>
              )}
            </button>
          </div>

          {/* Deconstruction Result Box */}
          {deconstruction && (
            <div className="space-y-4 pt-4 border-t border-[#EAE4DC] animate-in fade-in duration-300">
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E8E2D8] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-2">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4 text-[#8C5E3C]" />
                    <span className="font-serif font-bold text-sm text-[#182624]">{deconstruction.modelName}</span>
                  </div>
                  <span className="text-[11px] text-[#737C78] italic">{deconstruction.modelPhilosophy}</span>
                </div>

                {/* Core Deconstruction Points */}
                <div className="space-y-3">
                  {(deconstruction.deconstructionPoints || []).map((point, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EFE8DC] space-y-1.5">
                      <div className="text-xs font-bold text-[#2D4A43] flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D4A43]" />
                        <span>{point.title}</span>
                      </div>
                      <p className="text-xs text-[#4A3B32] leading-relaxed">{point.explanation}</p>
                      <div className="pt-1.5 mt-1 border-t border-[#E8DFD3] flex items-start space-x-1.5 text-[11px] text-[#8C5E3C] font-medium">
                        <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>Crucial Question: {point.actionQuestion}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Counter-Intuitive Insight */}
                {deconstruction.counterIntuitiveInsight && (
                  <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E5DAC8] text-xs space-y-1">
                    <span className="font-bold text-[#8C5E3C] flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Counter-Intuitive Realization</span>
                    </span>
                    <p className="text-[#3D332A] leading-relaxed">{deconstruction.counterIntuitiveInsight}</p>
                  </div>
                )}

                {/* Recommended Framework Action */}
                {deconstruction.recommendedFrameworkAction && (
                  <div className="p-3.5 rounded-xl bg-[#2D4A43] text-[#FAF7F2] text-xs space-y-1">
                    <span className="font-bold text-[#E6C994] flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Recommended Framework Action</span>
                    </span>
                    <p className="text-[#E0EBE8] leading-relaxed">{deconstruction.recommendedFrameworkAction}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2.5 rounded-xl bg-[#2D4A43] hover:bg-[#233A34] text-[#FAF7F2] text-xs font-bold shadow-xs flex items-center space-x-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Insert Deconstruction into Journal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
