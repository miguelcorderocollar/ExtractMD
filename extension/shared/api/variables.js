export const API_SOURCE_VARIABLES = Object.freeze({
  x: [
    'title',
    'author',
    'display_name',
    'handle',
    'date',
    'link',
    'content',
    'comments',
    'reposts',
    'likes',
    'bookmarks',
    'views',
    'extracted_at',
  ],
  youtube: [
    'title',
    'author',
    'channel_name',
    'channel_url',
    'date',
    'link',
    'content',
    'extracted_at',
  ],
  hackernews: [
    'title',
    'author',
    'date',
    'link',
    'content',
    'site',
    'points',
    'comments',
    'extracted_at',
  ],
  articles: [
    'title',
    'author',
    'date',
    'link',
    'content',
    'excerpt',
    'article_count',
    'extracted_at',
  ],
  universal: ['title', 'link', 'content', 'site', 'domain', 'word_count', 'extracted_at'],
});

export const API_SOURCE_KEYS = Object.freeze(Object.keys(API_SOURCE_VARIABLES));

export function getApiVariablesForSources(integrationAvailability = {}) {
  const variables = new Set();

  API_SOURCE_KEYS.forEach((source) => {
    if (integrationAvailability?.[source] !== true) return;
    (API_SOURCE_VARIABLES[source] || []).forEach((variable) => variables.add(variable));
  });

  return Array.from(variables).sort((a, b) => a.localeCompare(b));
}
