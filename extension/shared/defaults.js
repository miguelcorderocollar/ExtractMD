// Centralized defaults - single source of truth for all settings
// Used by popup, content scripts, and storage module

export const DEFAULTS = {
  // YouTube
  includeTimestamps: true,
  addTitleToTranscript: true,
  addChannelToTranscript: true,
  addUrlToTranscript: true,

  // HN Comments
  hnIncludeAuthor: true,
  hnIncludeTime: true,
  hnIncludeReplies: true,
  hnIncludeUrl: true,
  hnIncludeItemText: true,

  // HN News
  hnNewsIncludeTitle: true,
  hnNewsIncludeUrl: true,
  hnNewsIncludeSite: true,
  hnNewsIncludePoints: true,
  hnNewsIncludeAuthor: true,
  hnNewsIncludeTime: true,
  hnNewsIncludeComments: true,

  // Articles
  articleExporterIncludeImages: true,
  articleExporterOnlyLongest: false,
  articleExporterShowInfo: true,
  articleExporterIncludeUrl: true,

  // General
  globalEnabled: true,
  jumpToDomain: false,
  jumpToDomainUrl: 'https://chat.openai.com/',
  enableUsageKpi: true,
  closeTabAfterExtraction: false,
  downloadInsteadOfCopy: false,
  downloadIfTokensExceed: 0,
  showTokenCountInNotification: false,
  ignoredDomains: '',

  // Integration toggles
  enableYouTubeIntegration: true,
  enableHackerNewsIntegration: true,
  enableArticleIntegration: true,
  enableUniversalIntegration: true,

  // Universal (HTML-to-MD fallback)
  universalShowInfoNotification: false,
  universalIncludeImages: true,
  universalIncludeLinks: true,
  universalIncludeUrl: true,
  universalContentMode: 'auto', // 'auto' | 'full' | 'main' | 'selector'
  universalCustomSelector: '',
  universalStripNav: true,
  universalPreserveCodeBlocks: true,

  // Floating button behavior
  floatingButtonEnableDrag: true,
  floatingButtonEnableDismiss: true,
  floatingButtonSize: 'medium', // 'small' | 'medium' | 'large'
  floatingButtonTransparency: 'medium', // 'low' | 'medium' | 'high' | 'full'

  // AI Chat
  aiChatEnabled: false,
  aiChatModel: 'nvidia/nemotron-3-nano-30b-a3b:free',
  aiChatSystemPrompt: `When I provide you with an article or a very long text without context (but ONLY in these cases), produce a concise, structured summary that helps me learn from it. Follow these instructions exactly:

1. **TLDR (1–3 sentences)**
   • Provide a fairly concise overview summarizing all relevant information, capturing the article's core message, key takeaways, and essential details without fluff.

2. **Context & Purpose (1–2 sentences)**
   • Briefly state the article's topic and intended audience or goal.

3. **Main Insights (indented structured bullet points)**
   • Identify the core arguments, findings, or themes.
   • Highlight anything surprising or counterintuitive.
   • Keep it as long as needed, all relevant insights and interesting points should be included.

**Formatting Rules:**
- Use bullet points for every section except Context & Purpose.
- Avoid fluff; each bullet should be a stand-alone insight.
- Be blunt: call out weaknesses or unsupported statements without sugarcoating.
- Fix any potential transcription errors with the correct wording.

Apply this structure every time I provide you with an article or a very long text without context.
Be concise, evidence-based, and focus on learning, not just repeating the author's words.

For regular conversational messages or follow-up questions, respond naturally as a helpful assistant.`,
  aiChatAutoOpen: false,
  aiChatSendDirectly: true,
  aiChatOutputMode: 'copy', // 'copy' | 'sidebar' | 'both'
  aiChatShowTimestamps: false, // Show timestamps on messages
  aiChatTemperature: 1.0, // Temperature for AI responses (0-2)

  // Theme
  accentColor: '#14b8a6', // Default teal

  // Welcome/Onboarding
  welcomeCompleted: false, // Whether user has completed welcome modal
};

// Free AI models available on OpenRouter
export const FREE_AI_MODELS = [
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b:free',
    name: 'NVIDIA Nemotron 3 Nano',
    description: 'Fast, lightweight model',
  },
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'GPT OSS 120B',
    description: 'Balanced performance',
  },
  {
    id: 'z-ai/glm-4.5-air:free',
    name: 'GLM 4.5 Air',
    description: 'Bilingual model',
  },
  {
    id: 'moonshotai/kimi-k2:free',
    name: 'Kimi K2',
    description: 'Advanced reasoning',
  },
];

// Schema for validation during import
export const SETTING_SCHEMA = {
  includeTimestamps: 'boolean',
  addTitleToTranscript: 'boolean',
  addChannelToTranscript: 'boolean',
  addUrlToTranscript: 'boolean',
  hnIncludeAuthor: 'boolean',
  hnIncludeTime: 'boolean',
  hnIncludeReplies: 'boolean',
  hnIncludeUrl: 'boolean',
  hnIncludeItemText: 'boolean',
  hnNewsIncludeTitle: 'boolean',
  hnNewsIncludeUrl: 'boolean',
  hnNewsIncludeSite: 'boolean',
  hnNewsIncludePoints: 'boolean',
  hnNewsIncludeAuthor: 'boolean',
  hnNewsIncludeTime: 'boolean',
  hnNewsIncludeComments: 'boolean',
  articleExporterIncludeImages: 'boolean',
  articleExporterOnlyLongest: 'boolean',
  articleExporterShowInfo: 'boolean',
  articleExporterIncludeUrl: 'boolean',
  globalEnabled: 'boolean',
  jumpToDomain: 'boolean',
  jumpToDomainUrl: 'string',
  enableUsageKpi: 'boolean',
  closeTabAfterExtraction: 'boolean',
  downloadInsteadOfCopy: 'boolean',
  downloadIfTokensExceed: 'number',
  showTokenCountInNotification: 'boolean',
  ignoredDomains: 'string',
  enableYouTubeIntegration: 'boolean',
  enableHackerNewsIntegration: 'boolean',
  enableArticleIntegration: 'boolean',
  enableUniversalIntegration: 'boolean',
  universalShowInfoNotification: 'boolean',
  universalIncludeImages: 'boolean',
  universalIncludeLinks: 'boolean',
  universalIncludeUrl: 'boolean',
  universalContentMode: 'string',
  universalCustomSelector: 'string',
  universalStripNav: 'boolean',
  universalPreserveCodeBlocks: 'boolean',
  floatingButtonEnableDrag: 'boolean',
  floatingButtonEnableDismiss: 'boolean',
  floatingButtonSize: 'string',
  floatingButtonTransparency: 'string',
  aiChatEnabled: 'boolean',
  aiChatModel: 'string',
  aiChatSystemPrompt: 'string',
  aiChatAutoOpen: 'boolean',
  aiChatSendDirectly: 'boolean',
  aiChatOutputMode: 'string',
  aiChatShowTimestamps: 'boolean',
  aiChatTemperature: 'number',
  accentColor: 'string',
  welcomeCompleted: 'boolean',
};
