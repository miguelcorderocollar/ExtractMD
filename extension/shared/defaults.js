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
  enableArticleIntegration: true
};

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
  enableArticleIntegration: 'boolean'
};

