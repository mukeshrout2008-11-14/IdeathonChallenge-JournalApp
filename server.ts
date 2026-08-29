import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// 1. Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy initialize Google GenAI SDK to avoid crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in server environment variables.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

async function generateContentWithFallback(
  contents: Array<{ role?: string; text?: string; parts?: Array<{ text: string }> } | string>,
  options?: FallbackOptions
): Promise<{ text: string; modelUsed: string }> {
  const ai = getAIClient();
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents as any,
        config: {
          systemInstruction: options?.systemInstruction,
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? 2048,
        },
      });

      const text = response.text || '';
      if (text.trim().length > 0) {
        return { text, modelUsed: modelName };
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || (err?.message?.includes('429') ? 429 : 500);
      const isRecoverable = [503, 429, 404, 500, 502, 504].includes(status) || 
        err?.message?.includes('quota') || 
        err?.message?.includes('not found') ||
        err?.message?.includes('overloaded') ||
        err?.message?.includes('rate');

      console.warn(`[Gemini Fallback] Model ${modelName} failed (${err.message}). Attempting next fallback if available...`);
      if (!isRecoverable && MODEL_FALLBACK_LADDER.indexOf(modelName) === MODEL_FALLBACK_LADDER.length - 1) {
        break;
      }
    }
  }

  throw lastError || new Error('All Gemini model fallbacks exhausted.');
}

/**
 * Robust JSON extraction helper that parses JSON even if wrapped with markdown fences or extra text
 */
function extractJSON<T>(rawText: string, fallback: T): T {
  if (!rawText || typeof rawText !== 'string') return fallback;
  
  let cleaned = rawText.trim();
  // Strip markdown fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt substring extraction between first { and last } or [ and ]
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const jsonSubstring = cleaned.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonSubstring);
      } catch (innerErr) {
        console.warn('Failed to parse JSON substring:', innerErr);
      }
    }
    return fallback;
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Reflect / Converse Endpoint
app.post('/api/gemini/reflect', async (req, res) => {
  try {
    // 2. Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const mode = typeof body.mode === 'string' ? body.mode : 'reflection';
    const contextPrompt = typeof body.contextPrompt === 'string' ? body.contextPrompt : '';

    if (messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required and cannot be empty.' });
    }

    let systemInstruction = `You are ReflectAI, an empathetic, insightful, and constructive thought partner and journaling companion.
Your mission is to help users reflect deeply, process their thoughts, organize their ideas, and find constructive insights.
Respond warmly, concisely, and with structure (bullet points, subtle highlights where beneficial).
Treat user journal thoughts as personal and confidential reflections. Never output harmful or derogatory text.`;

    if (mode === 'brainstorm') {
      systemInstruction += `\nFocus specifically on creative brainstorming, generating diverse possibilities, unexpected angles, and practical pathways.`;
    } else if (mode === 'action_items') {
      systemInstruction += `\nFocus specifically on synthesizing actionable next steps, priority ordering, and concrete, achievable milestones based on the user's reflection.`;
    } else if (mode === 'summary') {
      systemInstruction += `\nFocus specifically on providing a crystal-clear, structured synopsis of key themes, emotional tone, and takeaways.`;
    }

    if (contextPrompt) {
      systemInstruction += `\nAdditional Focus Context: ${contextPrompt}`;
    }

    // Format messages for @google/genai SDK
    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || m.text || '') }],
    }));

    const result = await generateContentWithFallback(formattedContents, {
      systemInstruction,
      temperature: mode === 'brainstorm' ? 0.85 : 0.65,
    });

    return res.json({
      reply: result.text,
      modelUsed: result.modelUsed,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate reflection with Gemini.',
    });
  }
});

// Decision Simulation Endpoint
app.post('/api/gemini/decision-simulate', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const dilemma = typeof body.dilemma === 'string' ? body.dilemma : '';
    const optionsRaw = Array.isArray(body.options) ? body.options : [];
    const context = typeof body.context === 'string' ? body.context : '';

    if (!dilemma.trim()) {
      return res.status(400).json({ error: 'Dilemma description is required for decision simulation.' });
    }

    const prompt = `You are a world-class Decision Architect and Strategic Thinking Coach.
Analyze the user's dilemma and simulate the choices using the Suzy Welch 10/10/10 rule (10 days, 10 months, 10 years) alongside worst-case mitigation and emotional score (1 to 10).

Dilemma:
"${dilemma.replace(/\n/g, ' ')}"

${optionsRaw.length > 0 ? `Given Options to compare:\n${optionsRaw.map((o: string, idx: number) => `${idx + 1}. ${o}`).join('\n')}` : `Generate 2 to 3 distinct strategic options (e.g. Option A, Option B, or a hybrid alternative).`}

Additional context:
"${context.replace(/\n/g, ' ')}"

Output STRICTLY a JSON object with this exact schema (no markdown fences):
{
  "dilemma": "${dilemma.replace(/\n/g, ' ').replace(/"/g, '\\"')}",
  "coreValuesAtStake": ["Value 1", "Value 2", "Value 3"],
  "options": [
    {
      "name": "Option Name",
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"],
      "impact10Days": "What happens in 10 days...",
      "impact10Months": "What happens in 10 months...",
      "impact10Years": "What happens in 10 years...",
      "worstCaseScenario": "Worst case risk...",
      "mitigationStrategy": "Concrete action to neutralize worst case...",
      "emotionalScore": 8
    }
  ],
  "recommendedPath": "Clear rationale recommending the optimal path based on long-term compound growth and alignment with core values.",
  "keyInsights": [
    "Key psychological insight 1",
    "Key psychological insight 2"
  ],
  "suggestedActionFirstStep": "Immediate concrete step to take within 24 hours."
}`;

    const result = await generateContentWithFallback([prompt], {
      systemInstruction: 'You are an analytical decision system. You MUST output ONLY valid JSON without any markdown formatting or commentary.',
      temperature: 0.3,
    });

    const fallbackAnalysis = {
      dilemma,
      coreValuesAtStake: ['Clarity', 'Growth', 'Well-being'],
      options: [
        {
          name: 'Primary Path',
          pros: ['Direct action', 'Clear trajectory'],
          cons: ['Requires adaptation'],
          impact10Days: 'Initial transition and adjustments',
          impact10Months: 'Stabilized progress and initial outcomes',
          impact10Years: 'Long-term compounding alignment',
          worstCaseScenario: 'Temporary friction',
          mitigationStrategy: 'Keep agile checkpoints',
          emotionalScore: 8,
        },
      ],
      recommendedPath: 'Evaluate alignment with long-term compound growth and take immediate reversible micro-steps.',
      keyInsights: ['Action produces clarifying feedback faster than overthinking.'],
      suggestedActionFirstStep: 'Write down your next single concrete step for the next 24 hours.',
    };

    const parsed = extractJSON(result.text, fallbackAnalysis);

    return res.json({
      ...parsed,
      dilemma: parsed.dilemma || dilemma,
      createdTimestamp: Date.now(),
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/decision-simulate:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to simulate decision.',
    });
  }
});

// Cognitive Growth & Blind-Spot Radar Endpoint
app.post('/api/gemini/cognitive-radar', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const entries = Array.isArray(body.entries) ? body.entries : [];

    if (entries.length === 0) {
      return res.status(400).json({ error: 'At least one past journal entry is required for cognitive analysis.' });
    }

    // Compile concise summaries of past entries
    const journalDigest = entries.slice(0, 20).map((e: any, idx: number) => {
      const msgs = Array.isArray(e.messages) ? e.messages.map((m: any) => `${m.role}: ${m.content}`).join('\n') : '';
      return `[Entry ${idx + 1}] Title: ${e.title || 'Untitled'} | Category: ${e.category || 'General'} | Mood: ${e.mood || 'N/A'}\nSummary: ${e.summary || msgs.slice(0, 300) || 'Brief personal reflection'}`;
    }).join('\n\n');

    const prompt = `You are a Master Cognitive Coach and Psychological Pattern Analyst.
Analyze this user's journal archive to discover cross-entry cognitive patterns, recurring mental habits or biases (like imposter syndrome, catastrophizing, overthinking, all-or-nothing thinking), key strengths, milestones, and thematic balance.

Journal Archive:
"""
${journalDigest}
"""

Output STRICTLY a JSON object with this exact structure (no markdown fences):
{
  "overallMindset": "Empathetic 2-3 sentence overview of their current psychological trajectory and mental state.",
  "topStrengths": [
    "High self-awareness and willingness to confront hard questions",
    "Resilience during career transitions",
    "Commitment to continuous learning"
  ],
  "recurringBlockers": [
    {
      "pattern": "Description of the recurring thought habit or hesitation",
      "biasName": "e.g., Analysis Paralysis or Imposter Syndrome",
      "frequency": "Present in multiple entries",
      "suggestedReframing": "Actionable cognitive reframe technique"
    }
  ],
  "growthMilestones": [
    {
      "dateOrTheme": "Recent Breakthrough",
      "breakthrough": "Concrete positive shift observed across reflections"
    }
  ],
  "dominantThemes": [
    { "theme": "Career Growth", "percentage": 45, "trend": "rising" },
    { "theme": "Personal Well-being", "percentage": 30, "trend": "stable" },
    { "theme": "Relationships & Communication", "percentage": 25, "trend": "decreasing" }
  ],
  "recommendationForNextWeek": "A targeted high-leverage prompt or practice to experiment with in upcoming reflections."
}`;

    const result = await generateContentWithFallback([prompt], {
      systemInstruction: 'You are an expert cognitive psychologist. Output ONLY valid JSON without markdown fences.',
      temperature: 0.3,
    });

    const fallbackRadar = {
      overallMindset: 'Reflective and thoughtful, displaying consistent engagement with personal self-development.',
      topStrengths: ['High emotional self-awareness', 'Willingness to process complex situations constructively'],
      recurringBlockers: [
        {
          pattern: 'Tendency to over-analyze decisions before initiating the first micro-step',
          biasName: 'Analysis Friction',
          frequency: 'Observed periodically',
          suggestedReframing: 'Shift focus from perfect certainty to small, low-risk experiments.',
        },
      ],
      growthMilestones: [
        {
          dateOrTheme: 'Self-Reflection Consistency',
          breakthrough: 'Established continuous journaling habit to untangle mental models.',
        },
      ],
      dominantThemes: [
        { theme: 'Personal Growth', percentage: 50, trend: 'rising' as const },
        { theme: 'Decisions & Clarity', percentage: 30, trend: 'stable' as const },
        { theme: 'Well-being', percentage: 20, trend: 'stable' as const },
      ],
      recommendationForNextWeek: 'Focus reflections on celebrating completed micro-actions rather than lingering uncertainties.',
    };

    const parsed = extractJSON(result.text, fallbackRadar);

    return res.json({
      ...parsed,
      topStrengths: Array.isArray(parsed.topStrengths) ? parsed.topStrengths : fallbackRadar.topStrengths,
      recurringBlockers: Array.isArray(parsed.recurringBlockers) ? parsed.recurringBlockers : fallbackRadar.recurringBlockers,
      dominantThemes: Array.isArray(parsed.dominantThemes) ? parsed.dominantThemes : fallbackRadar.dominantThemes,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/cognitive-radar:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate cognitive radar report.',
    });
  }
});

// Voice Stream-of-Consciousness Formatter Endpoint
app.post('/api/gemini/voice-format', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const rawTranscript = typeof body.transcript === 'string' ? body.transcript : '';

    if (!rawTranscript.trim()) {
      return res.status(400).json({ error: 'Transcript text is required.' });
    }

    const prompt = `A user spoke a raw, unedited stream-of-consciousness thought:
"""
${rawTranscript}
"""

Please transform this verbal stream-of-consciousness into:
1. "formattedProse": Beautifully structured, authentic journal prose that preserves the user's authentic voice, emotional nuance, and original intent without filler words ("um", "like", "you know").
2. "bulletInsights": An array of 2-4 core epiphanies, key takeaways, or realizations extracted from their speech.
3. "suggestedTitle": A sharp, poetic 3-6 word title.
4. "detectedMood": A single word describing their emotional state.

Output STRICTLY a JSON object with this schema (no markdown code blocks):
{
  "formattedProse": "...",
  "bulletInsights": ["...", "..."],
  "suggestedTitle": "...",
  "detectedMood": "..."
}`;

    const result = await generateContentWithFallback([prompt], {
      systemInstruction: 'You are a master literary editor and journal transcriptionist. Output ONLY valid JSON.',
      temperature: 0.4,
    });

    const fallbackVoice = {
      formattedProse: rawTranscript,
      bulletInsights: ['Captured stream-of-consciousness thoughts.'],
      suggestedTitle: 'Spoken Stream Reflection',
      detectedMood: 'Contemplative',
    };

    const parsed = extractJSON(result.text, fallbackVoice);

    return res.json({
      ...parsed,
      formattedProse: parsed.formattedProse || rawTranscript,
      bulletInsights: Array.isArray(parsed.bulletInsights) ? parsed.bulletInsights : fallbackVoice.bulletInsights,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/voice-format:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to format voice stream.',
    });
  }
});

// Auto-summarize & extract title/tags endpoint
app.post('/api/gemini/synthesize', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const content = typeof body.content === 'string' ? body.content : '';

    if (!content.trim()) {
      return res.status(400).json({ error: 'Content is required for synthesis.' });
    }

    const prompt = `Analyze this journal/reflection entry and return a concise JSON object with:
1. "title": A short, elegant 3-6 word title capturing the essence.
2. "summary": A 1-2 sentence crystal-clear summary of the entry.
3. "tags": An array of 2-4 lowercase thematic tags (e.g. ["mindfulness", "career", "gratitude"]).
4. "mood": A single descriptive word for the emotional tone (e.g. "Inspired", "Contemplative", "Anxious", "Determined", "Grateful", "Balanced").

Journal Entry Content:
"""${content.slice(0, 4000)}"""

Respond ONLY with valid JSON in this format:
{
  "title": "...",
  "summary": "...",
  "tags": ["..."],
  "mood": "..."
}`;

    const result = await generateContentWithFallback([prompt], {
      systemInstruction: 'You are an analytical assistant that extracts metadata from text and outputs ONLY valid raw JSON without markdown code fences.',
      temperature: 0.2,
    });

    const fallbackSynth = {
      title: 'Journal Reflection',
      summary: content.slice(0, 160).replace(/\n/g, ' '),
      tags: ['reflection'],
      mood: 'Contemplative',
    };

    const parsed = extractJSON(result.text, fallbackSynth);

    return res.json({
      ...parsed,
      tags: Array.isArray(parsed.tags) ? parsed.tags : fallbackSynth.tags,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/synthesize:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to synthesize journal entry.',
      title: 'Journal Reflection',
      summary: '',
      tags: ['reflection'],
      mood: 'Contemplative',
    });
  }
});

// Mental Models Deconstruction Endpoint
app.post('/api/gemini/mental-model', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const dilemma = typeof body.dilemma === 'string' ? body.dilemma.trim() : '';
    const modelKey = typeof body.modelKey === 'string' ? body.modelKey : 'first_principles';

    if (!dilemma) {
      return res.status(400).json({ error: 'A dilemma or thought description is required.' });
    }

    const modelGuides: Record<string, { name: string; desc: string }> = {
      first_principles: {
        name: 'First Principles Thinking',
        desc: 'Boil things down to the most fundamental truths and reason up from there rather than by analogy.',
      },
      inversion: {
        name: 'Inversion (Charlie Munger)',
        desc: 'Avoid stupidity and catastrophic failure rather than seeking brilliance. How could this fail completely?',
      },
      second_order: {
        name: 'Second-Order Thinking',
        desc: 'Ask "And then what?" beyond immediate consequences to anticipate systemic ripple effects.',
      },
      pareto_80_20: {
        name: 'Pareto Principle (80/20 Rule)',
        desc: 'Identify the 20% of inputs/actions producing 80% of desired outcomes or 80% of current friction.',
      },
      occams_razor: {
        name: "Occam's Razor & Hanlon's Razor",
        desc: 'The simplest explanation or action with fewest assumptions is usually the most effective.',
      },
      circle_of_competence: {
        name: 'Circle of Competence',
        desc: 'Distinguish clearly between what you truly know deeply vs. what you merely have an opinion on.',
      },
    };

    const targetModel = modelGuides[modelKey] || modelGuides.first_principles;

    const prompt = `Deconstruct the following user thought/dilemma through the lens of: "${targetModel.name}" (${targetModel.desc}).
User Thought/Dilemma:
"""${dilemma.slice(0, 4000)}"""

Respond ONLY with a valid JSON object matching this schema (no markdown formatting fences):
{
  "modelName": "${targetModel.name}",
  "modelPhilosophy": "${targetModel.desc.replace(/"/g, '\\"')}",
  "deconstructionPoints": [
    {
      "title": "Core Point 1",
      "explanation": "Detailed breakdown under this mental model",
      "actionQuestion": "A piercing, transformative question the user must answer"
    },
    {
      "title": "Core Point 2",
      "explanation": "Detailed breakdown under this mental model",
      "actionQuestion": "A piercing, transformative question the user must answer"
    },
    {
      "title": "Core Point 3",
      "explanation": "Detailed breakdown under this mental model",
      "actionQuestion": "A piercing, transformative question the user must answer"
    }
  ],
  "counterIntuitiveInsight": "A fresh, non-obvious realization that shifts perspective",
  "recommendedFrameworkAction": "One high-leverage immediate action to execute"
}`;

    const result = await generateContentWithFallback([prompt], {
      systemInstruction: 'You are a world-class cognitive scientist and mental models expert. You break down user challenges through structured mental frameworks into sharp, actionable clarity.',
      temperature: 0.3,
    });

    const fallbackDeconstruction = {
      modelName: targetModel.name,
      modelPhilosophy: targetModel.desc,
      deconstructionPoints: [
        {
          title: 'Foundational Truths',
          explanation: 'Identify the assumptions that can be verified versus those accepted purely by habit.',
          actionQuestion: 'What are the undeniable facts of this situation if you strip away all emotional narratives?',
        },
        {
          title: 'Core Leverage',
          explanation: 'Focus energy strictly on factors within direct agency.',
          actionQuestion: 'What single micro-decision removes the largest bottleneck?',
        },
      ],
      counterIntuitiveInsight: 'The complexity often resides in the emotional resistance to the simplest next step.',
      recommendedFrameworkAction: 'Write down the single most direct action you can take in the next hour.',
    };

    const parsed = extractJSON(result.text, fallbackDeconstruction);

    return res.json({
      ...parsed,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/mental-model:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate mental model deconstruction.' });
  }
});

// "Ask Past Self" Semantic Journal Search Endpoint
app.post('/api/gemini/ask-past-self', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const entries = Array.isArray(body.entries) ? body.entries : [];

    if (!question) {
      return res.status(400).json({ error: 'A search question is required.' });
    }

    if (entries.length === 0) {
      return res.json({
        answer: "You don't have any past journal entries yet! As you write and reflect over time, I will synthesize your historical wisdom to answer your queries.",
        keyTakeaway: "Begin journaling today to build your personal wisdom archive.",
        relevantEntries: [],
        actionAdvice: "Write your first journal reflection on this topic.",
      });
    }

    // Format past entries into digestible context
    const contextDigest = entries.slice(0, 25).map((e: any, idx: number) => {
      const msgs = Array.isArray(e.messages) ? e.messages.map((m: any) => `${m.role}: ${m.content}`).join('\n') : '';
      const dateStr = e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Past Entry';
      return `[Entry ID: ${e.id || idx}] Date: ${dateStr} | Title: ${e.title || 'Untitled'} | Category: ${e.category || 'Reflection'} | Mood: ${e.mood || 'N/A'}\nSummary: ${e.summary || ''}\nExcerpt:\n${msgs.slice(0, 400)}`;
    }).join('\n\n---\n\n');

    const prompt = `You are the user's "Past Self Archive Synthesizer". The user is asking a question to their past self based on their journal history.
User Question:
"${question}"

User Past Journal History Digest:
${contextDigest}

Analyze the user's past reflections to synthesize:
1. "answer": A heartfelt, insightful synthesis answering their question in the voice of their wiser past self (2-3 paragraphs citing concrete themes or past breakthroughs).
2. "keyTakeaway": A punchy 1-sentence reminder of what they learned in previous experiences.
3. "relevantEntries": An array of up to 3 entry references with:
   - "id": The matching entry ID from the digest
   - "title": Title of that entry
   - "date": Formatted date
   - "contextExcerpt": A 1-sentence quote or excerpt highlighting relevance
4. "actionAdvice": A concrete suggestion based on what worked before.

Output STRICTLY JSON format (no markdown):
{
  "answer": "...",
  "keyTakeaway": "...",
  "relevantEntries": [
    {
      "id": "...",
      "title": "...",
      "date": "...",
      "contextExcerpt": "..."
    }
  ],
  "actionAdvice": "..."
}`;

    const result = await generateContentWithFallback([prompt], {
      systemInstruction: 'You are an empathetic, insightful wisdom aggregator that analyzes personal journal archives to help users learn from their own past patterns.',
      temperature: 0.3,
    });

    const fallbackAnswer = {
      answer: `Based on your past reflections, you have consistently navigated challenges by stepping back to find clarity. Your journal shows resilience when taking small, intentional steps.`,
      keyTakeaway: "Trust the process of breaking down uncertainty into actionable micro-decisions.",
      relevantEntries: entries.slice(0, 2).map((e: any) => ({
        id: e.id,
        title: e.title || 'Journal Reflection',
        date: new Date(e.createdAt || Date.now()).toLocaleDateString(),
        contextExcerpt: e.summary || 'Previous reflection on personal growth.',
      })),
      actionAdvice: "Reflect on what gave you clarity in your previous entries and apply that perspective today.",
    };

    const parsed = extractJSON(result.text, fallbackAnswer);

    return res.json({
      ...parsed,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/ask-past-self:', error);
    return res.status(500).json({ error: error?.message || 'Failed to query past journal archive.' });
  }
});


// Vite Middleware & Static Serving Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReflectAI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
