import { GuidedTemplate } from '../types';

export const GUIDED_TEMPLATES: GuidedTemplate[] = [
  {
    id: 'stoic_evening',
    title: 'Stoic Evening Review',
    category: 'Reflection',
    description: 'Reflect on what went well, where virtue slipped, and prepare for tomorrow with equanimity.',
    iconName: 'Moon',
    initialPrompt: 'Conducting my Stoic Evening Review to assess actions, self-command, and areas of growth today.',
    frameworkQuestions: [
      '1. What did I do well and with integrity today?',
      '2. Where was my attention or composure challenged, and how did I respond?',
      '3. What was completely outside my control that I can let go of tonight?',
      '4. What is my highest-priority focus for tomorrow morning?'
    ]
  },
  {
    id: 'fear_setting',
    title: 'Fear-Setting Exercise (Tim Ferriss)',
    category: 'Decision Making',
    description: 'Define your worst-case scenarios, plan preventive actions, and measure the real cost of inaction.',
    iconName: 'ShieldAlert',
    initialPrompt: 'I want to run a Fear-Setting exercise to confront a major decision or anxiety holding me back.',
    frameworkQuestions: [
      '1. DEFINE: What is the absolute worst that could happen if I take this risk?',
      '2. PREVENT: What practical steps can I take to reduce the likelihood of this worst-case scenario?',
      '3. REPAIR: If the worst does happen, how would I recover or repair the damage?',
      '4. COST OF INACTION: If I do nothing out of fear, where will I be in 6 months, 1 year, and 3 years?'
    ]
  },
  {
    id: 'imposter_reframe',
    title: 'Imposter Syndrome Reframing',
    category: 'Personal Growth',
    description: 'Separate emotional feelings from objective evidence and celebrate competence.',
    iconName: 'Compass',
    initialPrompt: 'Deconstructing feelings of self-doubt and imposter syndrome to ground myself in objective reality.',
    frameworkQuestions: [
      '1. What specific trigger or situation made me feel like an imposter?',
      '2. What is the emotional story my inner critic is telling me right now?',
      '3. What are 3 undeniable facts, accomplishments, or evidence showing my competence in this domain?',
      '4. How can I reframe this challenge as an invitation to learn rather than proof of inadequacy?'
    ]
  },
  {
    id: 'morning_intention',
    title: 'Morning Intentions & Prime',
    category: 'Action Plan',
    description: 'Calibrate your mental energy, define top priorities, and set proactive emotional intentions.',
    iconName: 'Sun',
    initialPrompt: 'Setting my morning intentions to align energy, focus, and purposeful execution.',
    frameworkQuestions: [
      '1. What is the single most important outcome that would make today a success?',
      '2. What emotional state do I choose to embody when facing obstacles today?',
      '3. What potential distraction will I deliberately eliminate or avoid today?',
      '4. Who can I support, appreciate, or connect meaningfully with today?'
    ]
  },
  {
    id: 'gratitude_micro_wins',
    title: 'Gratitude & Micro-Wins',
    category: 'Gratitude',
    description: 'Cultivate deep presence by acknowledging small moments of grace, beauty, and progress.',
    iconName: 'Sparkles',
    initialPrompt: 'Reflecting on specific moments of gratitude and celebrating today\'s micro-progress.',
    frameworkQuestions: [
      '1. What is one tiny, overlooked moment today that brought me peace or a smile?',
      '2. What challenge or obstacle am I secretly grateful for because of how it sharpens me?',
      '3. What micro-win did I achieve today that deserves acknowledgement?',
      '4. Who is someone whose presence in my life I am deeply thankful for right now?'
    ]
  }
];
