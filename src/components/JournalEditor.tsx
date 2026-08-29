import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User as UserIcon, 
  Download, 
  RotateCcw, 
  Check, 
  Copy, 
  Lightbulb, 
  ListChecks, 
  BookOpen, 
  Wand2, 
  Calendar, 
  Tag, 
  Smile, 
  ChevronDown,
  Menu,
  FileText,
  AlertTriangle,
  GitFork,
  Hourglass,
  Mic,
  Lock,
  Volume2,
  Square,
  Boxes,
  Compass
} from 'lucide-react';
import Markdown from 'react-markdown';
import { 
  JournalEntry, 
  JournalMessage, 
  AssistantMode, 
  JournalCategory, 
  AppUser,
  DecisionAnalysis,
  TimeCapsuleConfig,
  MentalModelDeconstruction,
  GuidedTemplate
} from '../types';
import { sendReflectionPrompt, synthesizeEntry } from '../services/api';
import { formatDate } from '../lib/utils';
import { speakText, stopSpeaking } from '../lib/audio';
import { DecisionStudio } from './DecisionStudio';
import { TimeCapsuleModal } from './TimeCapsuleModal';
import { VoiceRecorder } from './VoiceRecorder';
import { MentalModelsModal } from './MentalModelsModal';
import { TemplatePickerModal } from './TemplatePickerModal';
import { AmbientSoundscapes } from './AmbientSoundscapes';

interface JournalEditorProps {
  user: AppUser;
  entry: JournalEntry;
  onUpdateEntry: (updated: JournalEntry) => Promise<void>;
  onOpenMobileSidebar: () => void;
  onError: (msg: string, onRetry?: () => void) => void;
  onSuccess: (msg: string) => void;
}

const MODES: { id: AssistantMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { 
    id: 'reflection', 
    label: 'Reflect & Unpack', 
    icon: <BookOpen className="w-3.5 h-3.5" />, 
    desc: 'Empathetic processing, clarifying questions, and deeper insights' 
  },
  { 
    id: 'brainstorm', 
    label: 'Brainstorm & Explore', 
    icon: <Lightbulb className="w-3.5 h-3.5" />, 
    desc: 'Creative angles, divergent thinking, and alternative possibilities' 
  },
  { 
    id: 'action_items', 
    label: 'Action Items', 
    icon: <ListChecks className="w-3.5 h-3.5" />, 
    desc: 'Structured priority checklists, milestones, and actionable next steps' 
  },
  { 
    id: 'summary', 
    label: 'Synthesize & Summary', 
    icon: <Wand2 className="w-3.5 h-3.5" />, 
    desc: 'Key takeaways, emotional synopsis, and overarching themes' 
  },
];

const CATEGORIES: JournalCategory[] = [
  'Reflection',
  'Brainstorming',
  'Action Plan',
  'Gratitude',
  'Personal Growth',
  'Problem Solving',
  'Decision Making',
  'Time Capsule',
  'General',
];

const PROMPT_STARTERS = [
  'What went well today, and what made the biggest positive difference?',
  'I feel stuck on a difficult decision. Help me explore all angles and tradeoffs.',
  'Help me reframe this current frustration into a high-leverage growth opportunity.',
  'Synthesize my week’s thoughts into 3 high-impact priorities and next steps.',
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  user,
  entry,
  onUpdateEntry,
  onOpenMobileSidebar,
  onError,
  onSuccess,
}) => {
  const [localTitle, setLocalTitle] = useState(entry.title || '');
  const [inputText, setInputText] = useState('');
  const [selectedMode, setSelectedMode] = useState<AssistantMode>('reflection');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Sync local title when entry id or entry title updates externally
  useEffect(() => {
    setLocalTitle(entry.title || '');
    stopSpeaking();
    setSpeakingMessageId(null);
  }, [entry.id, entry.title]);

  const handleTitleCommit = () => {
    const trimmed = localTitle.trim() || 'Untitled Reflection';
    if (trimmed !== entry.title) {
      onUpdateEntry({ ...entry, title: trimmed });
    }
  };

  // Modal / Tool toggles
  const [showDecisionStudio, setShowDecisionStudio] = useState(false);
  const [showTimeCapsule, setShowTimeCapsule] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showMentalModels, setShowMentalModels] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleToggleSpeak = (msgId: string, content: string) => {
    if (speakingMessageId === msgId) {
      stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      setSpeakingMessageId(msgId);
      const started = speakText(
        content,
        () => setSpeakingMessageId(null),
        () => setSpeakingMessageId(null)
      );
      if (!started) {
        setSpeakingMessageId(null);
        onError('Voice narration is not supported in this browser environment.');
      }
    }
  };

  const handleApplyMentalModel = async (deconstruction: MentalModelDeconstruction) => {
    const formattedPoints = deconstruction.deconstructionPoints
      .map(p => `### ${p.title}\n${p.explanation}\n> **Crucial Question:** ${p.actionQuestion}`)
      .join('\n\n');

    const formattedContent = `## 🧠 Mental Model Deconstruction: ${deconstruction.modelName}
*${deconstruction.modelPhilosophy}*

${formattedPoints}

---
💡 **Counter-Intuitive Insight:**
${deconstruction.counterIntuitiveInsight}

⚡ **Recommended Immediate Action:**
${deconstruction.recommendedFrameworkAction}`;

    const modelMessage: JournalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'model',
      content: formattedContent,
      timestamp: Date.now(),
    };

    const updated: JournalEntry = {
      ...entry,
      category: 'Mental Models',
      messages: [...entry.messages, modelMessage],
      updatedAt: Date.now(),
    };

    await onUpdateEntry(updated);
    onSuccess('Mental model deconstruction inserted into journal!');
  };

  const handleApplyTemplate = async (template: GuidedTemplate) => {
    const templateContent = `## 📝 ${template.title}
*${template.description}*

${template.frameworkQuestions.map(q => `${q}\n\n[Write your reflection here...]\n`).join('\n')}`;

    setInputText(templateContent);
    const updated: JournalEntry = {
      ...entry,
      title: `${template.title} - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      category: template.category,
      updatedAt: Date.now(),
    };
    await onUpdateEntry(updated);
    onSuccess(`Template "${template.title}" loaded into editor.`);
  };

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [entry.messages, isGenerating]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  // Send message and get Gemini reflection
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isGenerating) return;

    const userMessage: JournalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...(entry.messages || []), userMessage];
    
    // Auto-update title if it's the first message and title is default, or respect current local title
    let updatedTitle = localTitle.trim() || entry.title;
    if (updatedTitle === 'Untitled Reflection' || updatedTitle === 'New Reflection') {
      const snippet = text.slice(0, 45).replace(/\n/g, ' ');
      updatedTitle = snippet.length < text.length ? `${snippet}...` : snippet;
    }
    setLocalTitle(updatedTitle);

    const optimisticEntry: JournalEntry = {
      ...entry,
      title: updatedTitle,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    // Save user message first to avoid losing input
    try {
      await onUpdateEntry(optimisticEntry);
      setInputText('');
    } catch (saveErr: any) {
      onError('Failed to save your journal entry to Firestore. Please try again.', () => handleSendMessage(text));
      return;
    }

    // Call Gemini API with Fallback
    try {
      setIsGenerating(true);
      const result = await sendReflectionPrompt(updatedMessages, selectedMode);
      setModelUsed(result.modelUsed);

      const geminiMessage: JournalMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'model',
        content: result.reply,
        timestamp: Date.now(),
      };

      const finalEntry: JournalEntry = {
        ...optimisticEntry,
        messages: [...updatedMessages, geminiMessage],
        updatedAt: Date.now(),
      };

      await onUpdateEntry(finalEntry);
    } catch (apiErr: any) {
      console.error('Gemini generation error:', apiErr);
      onError(
        `Gemini reflection failed: ${apiErr.message || 'Server error'}. You can retry anytime.`,
        () => handleSendMessage(text)
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto Synthesize Summary, Mood, & Tags
  const handleAutoSynthesize = async () => {
    if (entry.messages.length === 0) {
      onError('Write at least one reflection message before generating a summary.');
      return;
    }

    try {
      setIsSynthesizing(true);
      const combinedText = entry.messages
        .map((m) => `${m.role === 'user' ? 'User' : 'Gemini'}: ${m.content}`)
        .join('\n\n');

      const synth = await synthesizeEntry(combinedText);

      const updated: JournalEntry = {
        ...entry,
        title: synth.title || entry.title,
        summary: synth.summary || entry.summary,
        tags: synth.tags?.length ? synth.tags : entry.tags,
        mood: synth.mood || entry.mood,
        updatedAt: Date.now(),
      };

      await onUpdateEntry(updated);
      onSuccess('Journal entry synthesized and updated in Firestore!');
    } catch (err: any) {
      console.error('Synthesis error:', err);
      onError(`Synthesis failed: ${err.message || 'Server error'}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Handle Voice Transcription completion
  const handleVoiceComplete = async (
    formattedProse: string, 
    bulletInsights: string[], 
    suggestedTitle?: string, 
    detectedMood?: string
  ) => {
    const userMessage: JournalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: formattedProse,
      timestamp: Date.now(),
    };

    let geminiMessage: JournalMessage | null = null;
    if (bulletInsights.length > 0) {
      geminiMessage = {
        id: `msg-${Date.now() + 10}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'model',
        content: `### 💡 Spoken Reflection Epiphanies\n\n${bulletInsights.map((b) => `- ${b}`).join('\n')}\n\n*What would you like to explore next from these thoughts?*`,
        timestamp: Date.now() + 10,
      };
    }

    const updatedMessages = [...(entry.messages || []), userMessage];
    if (geminiMessage) updatedMessages.push(geminiMessage);

    const updated: JournalEntry = {
      ...entry,
      title: suggestedTitle || (entry.title === 'Untitled Reflection' ? 'Spoken Stream Reflection' : entry.title),
      mood: detectedMood || entry.mood,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    await onUpdateEntry(updated);
    onSuccess('Voice stream transcribed, structured, and saved!');
  };

  // Copy text to clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Export entry as Markdown file
  const handleExport = () => {
    const lines = [
      `# ${entry.title}`,
      `**Category:** ${entry.category} | **Mood:** ${entry.mood || 'N/A'} | **Date:** ${new Date(entry.createdAt).toLocaleDateString()}`,
      `**Summary:** ${entry.summary || 'N/A'}`,
      `**Tags:** ${entry.tags?.join(', ') || 'N/A'}`,
      `\n---\n`,
      ...entry.messages.map(
        (m) => `### ${m.role === 'user' ? user.displayName || 'You' : 'Gemini Assistant'} (${new Date(m.timestamp).toLocaleTimeString()}):\n\n${m.content}\n`
      ),
    ];

    if (entry.decisionAnalysis) {
      lines.push('\n## Decision Simulation Analysis\n');
      lines.push(`**Dilemma:** ${entry.decisionAnalysis.dilemma}`);
      lines.push(`**Recommended Path:** ${entry.decisionAnalysis.recommendedPath}`);
      lines.push(`**Next Step:** ${entry.decisionAnalysis.suggestedActionFirstStep}`);
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'reflection'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onSuccess('Markdown exported successfully!');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF7F2] overflow-hidden">
      {/* Top Bar: Title, Category, Mood & Action Buttons */}
      <div className="bg-[#FAF7F2] border-b border-[#EAE4DC] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="sm:hidden p-2 text-[#737C78] hover:text-[#1A2826] hover:bg-[#F0EBE1] rounded-lg"
            title="Open History"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <input
              id="entry-title-input"
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleCommit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              placeholder="Give this reflection a title..."
              className="w-full font-serif font-bold text-[#1A2826] text-xl sm:text-2xl bg-transparent border-b border-transparent hover:border-[#D5C9B8] focus:border-[#2D4A43] focus:outline-none transition-colors px-1 py-0.5 rounded placeholder:text-[#A69D92]"
            />
            
            <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
              {/* Category selector */}
              <div className="relative inline-block">
                <select
                  id="entry-category-select"
                  value={entry.category}
                  onChange={(e) =>
                    onUpdateEntry({ ...entry, category: e.target.value as JournalCategory })
                  }
                  className="text-xs font-sans font-medium bg-[#F0EBE1] text-[#4A3B32] hover:bg-[#E5DDCF] px-2.5 py-0.5 rounded-md border border-[#E2D8C7] cursor-pointer focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mood Badge */}
              {entry.mood && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-[#F3ECE6] text-[#8C5E3C] border border-[#E5D8CD]">
                  <Smile className="w-3 h-3 mr-1" />
                  {entry.mood}
                </span>
              )}

              {/* Time Capsule Badge */}
              {entry.timeCapsule && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-[#EAE2D5] text-[#8C5E3C] border border-[#DCD3C4]">
                  <Lock className="w-3 h-3 mr-1" />
                  {entry.timeCapsule.status === 'sealed' ? 'Capsule Sealed' : 'Capsule Unsealed'}
                </span>
              )}

              {/* Model fallback indicator */}
              {modelUsed && (
                <span className="hidden md:inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-[#8C827A] bg-[#F0EBE1] border border-[#E2D8C7] rounded">
                  {modelUsed}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
          {/* Ambient Soundscapes */}
          <AmbientSoundscapes />

          {/* Guided Templates Picker */}
          <button
            id="guided-templates-btn"
            onClick={() => setShowTemplatePicker(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FFFFFF] text-[#4A3B32] hover:bg-[#F0EBE1] border border-[#D5C9B8] shadow-2xs transition-all cursor-pointer"
            title="Explore Guided Reflection Templates"
          >
            <Compass className="w-3.5 h-3.5 text-[#2D4A43]" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          {/* Mental Models Sandbox */}
          <button
            id="mental-models-btn"
            onClick={() => setShowMentalModels(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FFFFFF] text-[#4A3B32] hover:bg-[#F0EBE1] border border-[#D5C9B8] shadow-2xs transition-all cursor-pointer"
            title="Deconstruct through First Principles, Inversion, 80/20"
          >
            <Boxes className="w-3.5 h-3.5 text-[#8C5E3C]" />
            <span className="hidden sm:inline">Mental Models</span>
          </button>

          {/* Decision Studio Button */}
          <button
            id="decision-studio-btn"
            onClick={() => setShowDecisionStudio((prev) => !prev)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border shadow-2xs transition-all cursor-pointer ${
              showDecisionStudio || entry.decisionAnalysis
                ? 'bg-[#2D4A43] text-[#FAF7F2] border-[#2D4A43]'
                : 'bg-[#FFFFFF] text-[#4A3B32] hover:bg-[#F0EBE1] border-[#D5C9B8]'
            }`}
            title="Simulate Decisions with 10/10/10 timeline"
          >
            <GitFork className="w-3.5 h-3.5 text-[#E6C994]" />
            <span className="hidden sm:inline">Decision Studio</span>
          </button>

          {/* Time Capsule Button */}
          <button
            id="time-capsule-btn"
            onClick={() => setShowTimeCapsule(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FFFFFF] text-[#4A3B32] hover:bg-[#F0EBE1] border border-[#D5C9B8] shadow-2xs transition-all cursor-pointer"
            title="Schedule Future Self Check-In"
          >
            <Hourglass className="w-3.5 h-3.5 text-[#8C5E3C]" />
            <span className="hidden sm:inline">Time Capsule</span>
          </button>

          {/* Voice Stream Button */}
          <button
            id="voice-journal-btn"
            onClick={() => setShowVoiceRecorder(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#EAE2D5] text-[#4A3B32] hover:bg-[#DDD3C2] border border-[#D5C9B8] shadow-2xs transition-all cursor-pointer"
            title="Record Spoken Stream-of-Consciousness"
          >
            <Mic className="w-3.5 h-3.5 text-[#8C5E3C]" />
            <span className="hidden sm:inline">Voice Stream</span>
          </button>

          {/* Auto Synthesize Button */}
          <button
            id="synthesize-btn"
            onClick={handleAutoSynthesize}
            disabled={isSynthesizing || entry.messages.length === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FFFFFF] text-[#4A3B32] hover:bg-[#F0EBE1] border border-[#D5C9B8] shadow-2xs transition-all disabled:opacity-40 cursor-pointer"
            title="Auto-generate title, tags, and summary"
          >
            {isSynthesizing ? (
              <span className="w-3.5 h-3.5 border-2 border-[#8C5E3C]/30 border-t-[#8C5E3C] rounded-full animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5 text-[#8C5E3C]" />
            )}
            <span className="hidden md:inline">Synthesize</span>
          </button>

          {/* Export Button */}
          <button
            id="export-btn"
            onClick={handleExport}
            disabled={entry.messages.length === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FFFFFF] text-[#4A3B32] hover:bg-[#F0EBE1] border border-[#D5C9B8] shadow-2xs transition-all disabled:opacity-40 cursor-pointer"
            title="Export as Markdown"
          >
            <Download className="w-3.5 h-3.5 text-[#737C78]" />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Summary Box (if generated) */}
      {entry.summary && (
        <div className="bg-[#F4EFE6] border-b border-[#E2D8C7] px-6 py-3 flex items-start space-x-2 text-xs text-[#3D332A]">
          <Sparkles className="w-4 h-4 text-[#C06014] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-serif font-bold text-sm text-[#1A2826] mr-1.5">Summary:</span>
            <span className="leading-relaxed">{entry.summary}</span>
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex items-center space-x-1 mt-1.5 flex-wrap gap-y-1">
                <Tag className="w-3 h-3 text-[#8C5E3C]" />
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-[#EAE2D5] text-[#4A3B32] text-[10px] font-medium border border-[#DDD3C2]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decision Studio View (Inline when toggled) */}
      {showDecisionStudio && (
        <div className="px-4 sm:px-6 pt-4">
          <DecisionStudio
            initialDilemma={entry.messages.length > 0 ? entry.messages[0].content : ''}
            existingAnalysis={entry.decisionAnalysis}
            onSaveAnalysis={async (analysis) => {
              const updated: JournalEntry = {
                ...entry,
                category: 'Decision Making',
                decisionAnalysis: analysis,
                updatedAt: Date.now(),
              };
              await onUpdateEntry(updated);
              onSuccess('Decision simulation saved to your journal entry!');
            }}
            onClose={() => setShowDecisionStudio(false)}
            onError={onError}
          />
        </div>
      )}

      {/* Conversation / Journal Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {entry.messages.length === 0 && !showDecisionStudio ? (
          <div className="max-w-2xl mx-auto py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EAE2D5] text-[#8C5E3C] flex items-center justify-center mx-auto mb-4 border border-[#DDD3C2]">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#1A2826] mb-2">
              What is on your mind today?
            </h3>
            <p className="text-sm font-sans text-[#5A6360] max-w-md mx-auto mb-8 leading-relaxed">
              Write your thoughts, challenges, or aspirations below. You can also use <strong>Voice Stream</strong> or <strong>Decision Studio</strong> to structure your thoughts.
            </p>

            {/* Prompt Starter Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {PROMPT_STARTERS.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(promptText)}
                  className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E8E2D8] hover:border-[#8C5E3C] hover:bg-[#FDFCFB] text-xs text-[#3D332A] font-medium transition-all shadow-2xs flex items-start space-x-3 text-left group"
                >
                  <Sparkles className="w-4 h-4 text-[#C06014] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="leading-snug">{promptText}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          entry.messages.map((message) => {
            const isUser = message.role === 'user';

            return (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={`flex items-start space-x-3 max-w-3xl ${
                  isUser ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs border ${
                    isUser
                      ? 'bg-[#202E2B] text-[#FAF7F2] border-[#202E2B]'
                      : 'bg-gradient-to-tr from-[#2D4A43] to-[#40695E] text-[#FDFBF7] border-[#2D4A43]/30'
                  }`}
                >
                  {isUser ? (
                    user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="You"
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-xl object-cover"
                      />
                    ) : (
                      <UserIcon className="w-4 h-4" />
                    )
                  ) : (
                    <Bot className="w-5 h-5 text-[#E6C994]" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`flex-1 rounded-2xl p-4 sm:p-5 shadow-xs border ${
                    isUser
                      ? 'bg-[#FFFFFF] border-[#E8E2D8] text-[#1A2826] rounded-tr-none'
                      : 'bg-[#FAF8F5] border-[#DFD7C7] text-[#1A2826] rounded-tl-none ring-1 ring-[#8C5E3C]/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="font-serif font-bold text-[#1A2826]">
                      {isUser ? user.displayName || 'You' : 'Gemini AI Assistant'}
                    </span>
                    <div className="flex items-center space-x-2 text-[#8C827A]">
                      <span>{formatDate(message.timestamp)}</span>
                      {!isUser && (
                        <>
                          <button
                            onClick={() => handleToggleSpeak(message.id, message.content)}
                            className={`p-1 hover:text-[#1A2826] transition-colors rounded ${
                              speakingMessageId === message.id ? 'text-[#8C5E3C] bg-[#F0EBE1]' : ''
                            }`}
                            title={speakingMessageId === message.id ? 'Stop Narration' : 'Listen with Voice Narration'}
                          >
                            {speakingMessageId === message.id ? (
                              <Square className="w-3.5 h-3.5 fill-current animate-pulse text-[#8C5E3C]" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopy(message.id, message.content)}
                            className="p-1 hover:text-[#1A2826] transition-colors"
                            title="Copy response"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-3.5 h-3.5 text-[#2D4A43]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="prose prose-sm prose-stone max-w-none text-sm leading-relaxed">
                    <div className="markdown-body">
                      <Markdown>{message.content}</Markdown>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Bubble */}
        {isGenerating && (
          <div className="flex items-start space-x-3 max-w-3xl mr-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2D4A43] to-[#40695E] text-[#FDFBF7] flex items-center justify-center flex-shrink-0 shadow-xs animate-pulse border border-[#2D4A43]/30">
              <Bot className="w-5 h-5 text-[#E6C994]" />
            </div>
            <div className="bg-[#FAF8F5] border border-[#DFD7C7] rounded-2xl rounded-tl-none p-4 shadow-xs flex items-center space-x-2 text-[#5A6360] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#2D4A43] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#2D4A43] animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-[#2D4A43] animate-bounce [animation-delay:0.4s]" />
              <span className="font-medium text-[#2D4A43] ml-2 font-serif">
                Gemini is reflecting with {selectedMode}...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Section with Mode Selectors */}
      <div className="bg-[#FAF7F2] border-t border-[#EAE4DC] p-4 sm:p-6 shadow-sm">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Mode Selector Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                id={`mode-btn-${mode.id}`}
                onClick={() => setSelectedMode(mode.id)}
                title={mode.desc}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold whitespace-nowrap transition-all border ${
                  selectedMode === mode.id
                    ? 'bg-[#2D4A43] text-[#FAF7F2] border-[#2D4A43] shadow-xs'
                    : 'bg-[#F0EBE1] text-[#5A5046] hover:bg-[#E5DDCF] border-[#E2D8C7]'
                }`}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Textarea + Submit button */}
          <div className="relative border border-[#DCD3C4] rounded-2xl focus-within:border-[#2D4A43] focus-within:ring-2 focus-within:ring-[#2D4A43]/20 bg-[#FFFFFF] transition-all shadow-xs">
            <textarea
              id="reflection-textarea"
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Write your reflection, thoughts, or questions (Cmd+Enter to send)...`}
              className="w-full bg-transparent px-4 py-3 text-sm text-[#1A2826] placeholder:text-[#9E958C] resize-none focus:outline-none max-h-48"
            />

            <div className="flex items-center justify-between px-4 py-2 border-t border-[#F0EBE1] bg-[#FAF8F5]/80 rounded-b-2xl">
              <div className="text-[11px] text-[#8C827A] font-medium font-sans flex items-center space-x-2">
                <span>Press </span>
                <kbd className="px-1.5 py-0.5 text-[10px] bg-[#EAE2D5] border border-[#DCD3C4] rounded font-mono text-[#4A3B32]">
                  Cmd/Ctrl + Enter
                </kbd>
                <span> to reflect</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowVoiceRecorder(true)}
                  className="p-2 rounded-xl text-[#8C5E3C] hover:bg-[#EAE2D5] transition-colors"
                  title="Record Spoken Stream"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  id="send-reflection-btn"
                  onClick={() => handleSendMessage()}
                  disabled={isGenerating || !inputText.trim()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#2D4A43] hover:bg-[#233A34] text-[#FAF7F2] shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-[#233A34]"
                >
                  {isGenerating ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Reflect</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Capsule Modal */}
      {showTimeCapsule && (
        <TimeCapsuleModal
          existingCapsule={entry.timeCapsule}
          onSaveCapsule={async (capsule) => {
            const updated: JournalEntry = {
              ...entry,
              category: 'Time Capsule',
              timeCapsule: capsule,
              updatedAt: Date.now(),
            };
            await onUpdateEntry(updated);
            onSuccess('Time Capsule configured and saved to Firestore!');
          }}
          onClose={() => setShowTimeCapsule(false)}
          onError={onError}
        />
      )}

      {/* Voice Stream Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onTranscribeComplete={handleVoiceComplete}
          onClose={() => setShowVoiceRecorder(false)}
          onError={onError}
        />
      )}

      {/* Mental Models Modal */}
      {showMentalModels && (
        <MentalModelsModal
          isOpen={showMentalModels}
          onClose={() => setShowMentalModels(false)}
          initialThought={entry.messages.length > 0 ? entry.messages[entry.messages.length - 1].content : inputText}
          onApplyToJournal={handleApplyMentalModel}
          onError={onError}
        />
      )}

      {/* Guided Template Picker Modal */}
      {showTemplatePicker && (
        <TemplatePickerModal
          isOpen={showTemplatePicker}
          onClose={() => setShowTemplatePicker(false)}
          onSelectTemplate={handleApplyTemplate}
        />
      )}
    </div>
  );
};

