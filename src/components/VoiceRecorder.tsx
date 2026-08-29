import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Sparkles, 
  RefreshCw, 
  Volume2, 
  Check, 
  X,
  AlertCircle
} from 'lucide-react';

interface VoiceRecorderProps {
  onTranscribeComplete: (formattedProse: string, bulletInsights: string[], title?: string, mood?: string) => void;
  onClose: () => void;
  onError: (msg: string) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscribeComplete,
  onClose,
  onError,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const isRecordingRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    // Check for SpeechRecognition support in browser
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError('Speech Recognition API is not supported in this browser. Please type your reflection or use Chrome/Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalStr = '';
      let interimStr = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript + ' ';
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }

      if (finalStr) {
        setTranscript((prev) => prev + finalStr);
      }
      setInterimTranscript(interimStr);
    };

    recognition.onerror = (err: any) => {
      console.warn('Speech recognition error:', err);
      if (err.error === 'not-allowed') {
        onError('Microphone access was denied. Please allow microphone permissions in your browser settings.');
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      // If we were recording and it stopped unexpectedly, restart
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch {
          // ignore
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onError]);

  const startRecording = () => {
    if (!recognitionRef.current) {
      onError('Speech recognition not available.');
      return;
    }

    try {
      setTranscript('');
      setInterimTranscript('');
      setRecordingSeconds(0);
      recognitionRef.current.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (e: any) {
      console.error('Failed to start recording:', e);
      onError('Could not access microphone: ' + e.message);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFormatWithGemini = async () => {
    const fullText = (transcript + ' ' + interimTranscript).trim();
    if (!fullText) {
      onError('No speech was detected. Please try speaking into the microphone.');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch('/api/gemini/voice-format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fullText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to format voice stream.');
      }

      const data = await res.json();
      onTranscribeComplete(
        data.formattedProse || fullText,
        data.bulletInsights || [],
        data.suggestedTitle,
        data.detectedMood
      );
      onClose();
    } catch (err: any) {
      console.error('Voice format error:', err);
      // fallback to raw transcript if AI formatting fails
      onTranscribeComplete(fullText, [], undefined, undefined);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A2826]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FAF7F2] border border-[#EAE4DC] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE4DC] pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D4A43] text-[#FAF7F2] flex items-center justify-center">
              <Mic className="w-5 h-5 text-[#E6C994]" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1A2826]">
                Voice Stream-of-Consciousness
              </h2>
              <p className="text-xs font-sans text-[#737C78]">
                Speak freely. Gemini formats your raw stream into structured journal prose.
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

        {/* Live Audio Visualizer / Timer */}
        <div className="bg-[#FAF8F5] border border-[#DFD7C7] p-5 rounded-xl text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            {isRecording && (
              <span className="w-3 h-3 rounded-full bg-[#9C4124] animate-ping" />
            )}
            <span className="font-mono text-xl font-bold text-[#1A2826]">
              {formatSeconds(recordingSeconds)}
            </span>
          </div>

          {/* Record / Stop Button */}
          <div className="flex justify-center">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-[#2D4A43] hover:bg-[#233A34] text-[#FAF7F2] flex items-center justify-center shadow-md transition-transform hover:scale-105 border-4 border-[#EAE2D5]"
                title="Start Recording"
              >
                <Mic className="w-7 h-7" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-[#9C4124] hover:bg-[#7D341C] text-[#FAF7F2] flex items-center justify-center shadow-md transition-transform hover:scale-105 border-4 border-[#F3C4BE]"
                title="Pause / Stop Recording"
              >
                <Square className="w-6 h-6 fill-current" />
              </button>
            )}
          </div>
          <p className="text-xs font-sans text-[#737C78]">
            {isRecording ? 'Listening... Speak your mind without worrying about grammar.' : 'Click to start speaking'}
          </p>
        </div>

        {/* Live Transcript Preview */}
        <div className="bg-[#FFFFFF] border border-[#DCD3C4] rounded-xl p-3.5 max-h-40 overflow-y-auto text-xs text-[#1A2826] space-y-1">
          <span className="text-[10px] font-bold text-[#8C5E3C] uppercase tracking-wider block">
            Live Transcript
          </span>
          <p className="leading-relaxed whitespace-pre-wrap">
            {transcript || interimTranscript || (
              <span className="italic text-[#9E958C]">Your spoken words will appear here in real time...</span>
            )}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#8C827A] hover:text-[#1A2826]"
          >
            Cancel
          </button>

          <button
            onClick={handleFormatWithGemini}
            disabled={isProcessing || (!transcript.trim() && !interimTranscript.trim())}
            className="px-5 py-2.5 rounded-xl bg-[#2D4A43] hover:bg-[#233A34] text-[#FAF7F2] font-semibold text-xs shadow-sm flex items-center space-x-2 transition-all disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Formatting with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#E6C994]" />
                <span>Synthesize into Journal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
