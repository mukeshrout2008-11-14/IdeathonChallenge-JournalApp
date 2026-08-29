import React, { useState } from 'react';
import { 
  Hourglass, 
  Lock, 
  Unlock, 
  Sparkles, 
  Send, 
  Calendar,
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { TimeCapsuleConfig } from '../types';

interface TimeCapsuleModalProps {
  existingCapsule?: TimeCapsuleConfig;
  onSaveCapsule: (capsule: TimeCapsuleConfig) => void;
  onClose: () => void;
  onError: (msg: string) => void;
}

export const TimeCapsuleModal: React.FC<TimeCapsuleModalProps> = ({
  existingCapsule,
  onSaveCapsule,
  onClose,
  onError,
}) => {
  const [targetDays, setTargetDays] = useState<number>(30);
  const [reflectionPrompt, setReflectionPrompt] = useState(
    existingCapsule?.reflectionPrompt || 
    'Where do you stand on this decision now? Have the worries you held today materialized, or did unexpected breakthroughs emerge?'
  );
  const [futureNotes, setFutureNotes] = useState(existingCapsule?.futureNotes || '');

  const now = Date.now();
  const isCurrentlySealed = existingCapsule?.status === 'sealed' && existingCapsule.deliverDate > now;
  const isReadyToUnseal = existingCapsule?.status === 'sealed' && existingCapsule.deliverDate <= now;

  const handleSeal = () => {
    if (!reflectionPrompt.trim()) {
      onError('Please provide a reflection prompt for your future self.');
      return;
    }

    const deliverDate = now + targetDays * 24 * 60 * 60 * 1000;
    const capsule: TimeCapsuleConfig = {
      id: existingCapsule?.id || `capsule-${Date.now()}`,
      deliverDate,
      reflectionPrompt: reflectionPrompt.trim(),
      futureNotes: futureNotes.trim(),
      status: 'sealed',
      sealedDate: now,
    };

    onSaveCapsule(capsule);
    onClose();
  };

  const handleUnseal = () => {
    if (!existingCapsule) return;
    const updated: TimeCapsuleConfig = {
      ...existingCapsule,
      status: 'unsealed',
    };
    onSaveCapsule(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A2826]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FAF7F2] border border-[#EAE4DC] rounded-2xl w-full max-w-lg shadow-2xl p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE4DC] pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAE2D5] text-[#8C5E3C] flex items-center justify-center border border-[#DDD3C2]">
              <Hourglass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1A2826]">
                Time Capsule &amp; Future Self
              </h2>
              <p className="text-xs font-sans text-[#737C78]">
                Schedule automatic check-ins to measure growth across time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#1A2826] hover:bg-[#EAE2D5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Sealed State */}
        {isCurrentlySealed ? (
          <div className="space-y-4 py-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F0EBE1] border border-[#E2D8C7] flex items-center justify-center mx-auto text-[#8C5E3C] shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1A2826]">
                Time Capsule Sealed
              </h3>
              <p className="text-xs font-sans text-[#737C78] mt-1">
                Scheduled for delivery on{' '}
                <strong className="text-[#1A2826]">
                  {new Date(existingCapsule.deliverDate).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </strong>
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#DFD7C7] text-left text-xs text-[#3D332A] space-y-1">
              <span className="font-serif font-bold text-[#8C5E3C] block">Future Self Prompt:</span>
              <p className="italic">"{existingCapsule.reflectionPrompt}"</p>
            </div>

            <button
              onClick={handleUnseal}
              className="px-4 py-2 rounded-xl bg-[#F0EBE1] hover:bg-[#E5DDCF] text-[#4A3B32] text-xs font-semibold border border-[#E2D8C7] transition-colors"
            >
              Unseal Early
            </button>
          </div>
        ) : isReadyToUnseal ? (
          /* Unsealed Notification */
          <div className="space-y-4 py-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#E8EFEA] border border-[#D0DFD4] flex items-center justify-center mx-auto text-[#2D4A43]">
              <Unlock className="w-8 h-8 text-[#2D4A43]" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1A2826]">
                Time Capsule Ready to Open!
              </h3>
              <p className="text-xs font-sans text-[#737C78] mt-1">
                Your past self sealed this prompt on{' '}
                {new Date(existingCapsule?.sealedDate || now).toLocaleDateString()}.
              </p>
            </div>

            <div className="bg-[#F0F5F2] p-4 rounded-xl border border-[#D0DFD4] text-left text-xs text-[#1D3832] space-y-2">
              <span className="font-serif font-bold block text-sm">Prompt for Today:</span>
              <p className="text-sm font-serif leading-relaxed">
                "{existingCapsule?.reflectionPrompt}"
              </p>
            </div>

            <button
              onClick={handleUnseal}
              className="w-full py-2.5 rounded-xl bg-[#2D4A43] hover:bg-[#233A34] text-[#FAF7F2] font-semibold text-xs transition-colors"
            >
              Open &amp; Start Follow-Up Reflection
            </button>
          </div>
        ) : (
          /* Creation Form */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-serif font-bold text-[#1A2826] mb-1.5">
                When should this check-in trigger?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { days: 7, label: '7 Days' },
                  { days: 30, label: '30 Days' },
                  { days: 90, label: '3 Months' },
                  { days: 365, label: '1 Year' },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setTargetDays(preset.days)}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                      targetDays === preset.days
                        ? 'bg-[#2D4A43] text-[#FAF7F2] border-[#2D4A43]'
                        : 'bg-[#FFFFFF] text-[#4A3B32] border-[#DCD3C4] hover:bg-[#F0EBE1]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif font-bold text-[#1A2826] mb-1.5">
                Prompt for Your Future Self
              </label>
              <textarea
                value={reflectionPrompt}
                onChange={(e) => setReflectionPrompt(e.target.value)}
                rows={3}
                className="w-full bg-[#FFFFFF] border border-[#DCD3C4] rounded-xl p-3 text-xs text-[#1A2826] focus:border-[#2D4A43] focus:outline-none placeholder:text-[#9E958C]"
                placeholder="What question do you want to answer when this unseals?"
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-bold text-[#1A2826] mb-1.5">
                Secret Note or Prediction (Optional)
              </label>
              <input
                type="text"
                value={futureNotes}
                onChange={(e) => setFutureNotes(e.target.value)}
                placeholder="e.g. Prediction: I think I will have closed 3 enterprise clients by then."
                className="w-full bg-[#FFFFFF] border border-[#DCD3C4] rounded-lg px-3 py-2 text-xs text-[#1A2826] focus:border-[#2D4A43] focus:outline-none"
              />
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#DFD7C7] flex items-center space-x-2 text-xs text-[#737C78]">
              <Clock className="w-4 h-4 text-[#8C5E3C] flex-shrink-0" />
              <span>
                Unseals on{' '}
                <strong className="text-[#1A2826]">
                  {new Date(now + targetDays * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </strong>
              </span>
            </div>

            <button
              onClick={handleSeal}
              className="w-full py-3 rounded-xl bg-[#2D4A43] hover:bg-[#233A34] text-[#FAF7F2] font-semibold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all border border-[#233A34]"
            >
              <Lock className="w-4 h-4 text-[#E6C994]" />
              <span>Seal Time Capsule</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
