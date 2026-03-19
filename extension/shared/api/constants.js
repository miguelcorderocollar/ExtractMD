export const API_PROFILE_VERSION = 1;
export const DEFAULT_API_PROFILE_ID = 'default';
export const NOTION_EXAMPLE_PROFILE_ID = 'notion-x-posts';

export const NOTION_X_POST_HEADERS_TEMPLATE = `{
  "Authorization": "Bearer {{secret_notion_api_key}}",
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json"
}`;

export const NOTION_X_POST_BODY_TEMPLATE = `{
  "parent": {
    "database_id": "{{notion_database_id}}"
  },
  "properties": {
    "Author": {
      "title": [
        {
          "type": "text",
          "text": {
            "content": "{{author}}"
          }
        }
      ]
    },
    "Post": {
      "rich_text": [
        {
          "type": "text",
          "text": {
            "content": "{{content}}"
          }
        }
      ]
    },
    "URL": {
      "url": "{{link}}"
    },
    "Date": {
      "date": {
        "start": "{{date}}"
      }
    },
    "Comments": {
      "number": "{{comments}}"
    },
    "Repost": {
      "number": "{{reposts}}"
    },
    "Likes": {
      "number": "{{likes}}"
    },
    "Views": {
      "number": "{{views}}"
    }
  }
}`;

export function createDefaultApiProfile(overrides = {}) {
  return {
    id: DEFAULT_API_PROFILE_ID,
    name: 'Default API',
    enabled: false,
    method: 'POST',
    url: '',
    contentType: 'json', // json | text
    headersTemplate: '{\n  "Content-Type": "application/json"\n}',
    queryParamsTemplate: '{}',
    bodyTemplate:
      '{\n  "author": "{{author}}",\n  "date": "{{date}}",\n  "link": "{{link}}",\n  "content": "{{content}}",\n  "comments": "{{comments}}",\n  "reposts": "{{reposts}}",\n  "likes": "{{likes}}",\n  "bookmarks": "{{bookmarks}}",\n  "views": "{{views}}",\n  "extracted_at": "{{extracted_at}}"\n}',
    integrationAvailability: {
      x: true,
      youtube: false,
      hackernews: false,
      articles: false,
      universal: false,
    },
    ...overrides,
  };
}

export function createNotionExampleProfile(overrides = {}) {
  return createDefaultApiProfile({
    id: NOTION_EXAMPLE_PROFILE_ID,
    name: 'Notion (X Posts Example)',
    enabled: false,
    method: 'POST',
    url: 'https://api.notion.com/v1/pages',
    contentType: 'json',
    headersTemplate: NOTION_X_POST_HEADERS_TEMPLATE,
    queryParamsTemplate: '{}',
    bodyTemplate: NOTION_X_POST_BODY_TEMPLATE,
    ...overrides,
  });
}

export function getDefaultApiProfilesJson() {
  return JSON.stringify([createDefaultApiProfile()], null, 2);
}
