import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  CloudRain, 
  Waves, 
  Sparkles, 
  Sliders, 
  Check, 
  Music,
  Headphones
} from 'lucide-react';
import { soundscape } from '../lib/audio';

interface AmbientSoundscapesProps {
  onClose?: () => void;
}

type SoundType = 'rain' | 'binaural' | 'stream' | 'whitenoise';

export const AmbientSoundscapes: React.FC<AmbientSoundscapesProps> = () => {
  const [activeSound, setActiveSound] = useState<SoundType | null>(null);
  const [volume, setVolume] = useState<number>(0.3);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const status = soundscape.getStatus();
    setActiveSound(status.type as SoundType);
    setVolume(status.volume);
  }, []);

  const handleToggleSound = (type: SoundType) => {
    if (activeSound === type) {
      soundscape.stop();
      setActiveSound(null);
    } else {
      soundscape.play(type);
      setActiveSound(type);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundscape.setVolume(newVol);
  };

  const SOUND_OPTIONS: Array<{ type: SoundType; label: string; sub: string; icon: any }> = [
    {
      type: 'rain',
      label: 'Gentle Rain',
      sub: 'Brownian soft rainfall',
      icon: CloudRain,
    },
    {
      type: 'binaural',
      label: '10Hz Alpha Tone',
      sub: 'Binaural flow focus',
      icon: Headphones,
    },
    {
      type: 'stream',
      label: 'Forest River',
      sub: 'Flowing water resonance',
      icon: Waves,
    },
    {
      type: 'whitenoise',
      label: 'Muted Slate',
      sub: 'Distraction shielding',
      icon: Sparkles,
    },
  ];

  return (
    <div className="relative">
      <button
        id="soundscape-toggle-btn"
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          activeSound
            ? 'bg-[#2D4A43] text-[#FAF7F2] border-[#2D4A43] shadow-xs'
            : 'bg-[#FFFFFF] text-[#5A5046] border-[#DCD3C4] hover:border-[#8C7E72]'
        }`}
        title="Focus Soundscapes"
      >
        {activeSound ? (
          <>
            <Volume2 className="w-3.5 h-3.5 text-[#E6C994] animate-pulse" />
            <span className="capitalize">{activeSound === 'binaural' ? 'Alpha Wave' : activeSound}</span>
          </>
        ) : (
          <>
            <Music className="w-3.5 h-3.5 text-[#8C7E72]" />
            <span>Soundscapes</span>
          </>
        )}
      </button>

      {isExpanded && (
        <div className="absolute right-0 mt-2 w-72 bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl shadow-xl p-4 z-40 animate-in fade-in zoom-in-95 duration-150 space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-2.5">
            <div className="flex items-center space-x-2">
              <Headphones className="w-4 h-4 text-[#2D4A43]" />
              <span className="font-serif font-bold text-xs text-[#182624]">Ambient Mind Soundscapes</span>
            </div>
            {activeSound && (
              <button
                type="button"
                onClick={() => {
                  soundscape.stop();
                  setActiveSound(null);
                }}
                className="text-[11px] font-bold text-[#9C4124] hover:underline"
              >
                Mute All
              </button>
            )}
          </div>

          {/* Sound options list */}
          <div className="space-y-1.5">
            {SOUND_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isCurrent = activeSound === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleToggleSound(opt.type)}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                    isCurrent
                      ? 'border-[#2D4A43] bg-[#F2ECE4] text-[#182624] shadow-2xs'
                      : 'border-[#EAE4DC] hover:border-[#D5C9B8] bg-[#FAF8F5] text-[#5A5046]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isCurrent ? 'bg-[#2D4A43] text-[#FAF7F2]' : 'bg-[#EAE3D5] text-[#4A3B32]'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#182624]">{opt.label}</div>
                      <div className="text-[10px] text-[#737C78]">{opt.sub}</div>
                    </div>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-[#2D4A43]" />}
                </button>
              );
            })}
          </div>

          {/* Volume Control */}
          <div className="pt-2 border-t border-[#F0EBE1] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-[#737C78]">
              <span className="flex items-center space-x-1">
                <Sliders className="w-3 h-3" />
                <span>Ambient Volume</span>
              </span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#EAE4DC] rounded-lg appearance-none cursor-pointer accent-[#2D4A43]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
