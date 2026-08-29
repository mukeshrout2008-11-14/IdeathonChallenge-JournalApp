export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface JournalMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  category: JournalCategory;
  summary: string;
  tags: string[];
  mood?: string;
  messages: JournalMessage[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  decisionAnalysis?: DecisionAnalysis;
  timeCapsule?: TimeCapsuleConfig;
}

export interface DecisionOption {
  name: string;
  pros: string[];
  cons: string[];
  impact10Days: string;
  impact10Months: string;
  impact10Years: string;
  worstCaseScenario: string;
  mitigationStrategy: string;
  emotionalScore: number; // 1-10
}

export interface DecisionAnalysis {
  dilemma: string;
  coreValuesAtStake: string[];
  options: DecisionOption[];
  recommendedPath: string;
  keyInsights: string[];
  suggestedActionFirstStep: string;
  createdTimestamp: number;
}

export interface CognitiveRadarReport {
  overallMindset: string;
  topStrengths: string[];
  recurringBlockers: Array<{
    pattern: string;
    biasName?: string;
    frequency: string;
    suggestedReframing: string;
  }>;
  growthMilestones: Array<{
    dateOrTheme: string;
    breakthrough: string;
  }>;
  dominantThemes: Array<{
    theme: string;
    percentage: number;
    trend: 'rising' | 'stable' | 'decreasing';
  }>;
  recommendationForNextWeek: string;
}

export interface TimeCapsuleConfig {
  id: string;
  deliverDate: number; // timestamp in ms
  reflectionPrompt: string;
  status: 'sealed' | 'unsealed';
  sealedDate: number;
  futureNotes?: string;
}

export interface MentalModelDeconstruction {
  modelName: string;
  modelPhilosophy: string;
  deconstructionPoints: Array<{
    title: string;
    explanation: string;
    actionQuestion: string;
  }>;
  counterIntuitiveInsight: string;
  recommendedFrameworkAction: string;
}

export interface PastSelfAnswer {
  answer: string;
  keyTakeaway: string;
  relevantEntries: Array<{
    id: string;
    title: string;
    date: string;
    contextExcerpt: string;
  }>;
  actionAdvice: string;
}

export interface GuidedTemplate {
  id: string;
  title: string;
  category: JournalCategory;
  description: string;
  iconName: string;
  initialPrompt: string;
  frameworkQuestions: string[];
}

export interface VaultSettings {
  isPinEnabled: boolean;
  pinHash?: string;
  lockedEntryIds: string[];
}

export type JournalCategory = 
  | 'Reflection'
  | 'Brainstorming'
  | 'Action Plan'
  | 'Gratitude'
  | 'Personal Growth'
  | 'Problem Solving'
  | 'Decision Making'
  | 'Time Capsule'
  | 'Mental Models'
  | 'General';

export type AssistantMode = 'reflection' | 'brainstorm' | 'action_items' | 'summary' | 'decision_studio' | 'cognitive_radar' | 'mental_models';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

