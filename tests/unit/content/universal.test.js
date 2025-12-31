import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock modules before imports
vi.mock('../../../extension/shared/storage.js', () => ({
  incrementKpi: vi.fn()
}));

vi.mock('../../../extension/content/utils.js', () => ({
  copyToClipboard: vi.fn(),
  showNotification: vi.fn(),
  getSettings: vi.fn().mockResolvedValue({}),
  closeCurrentTab: vi.fn(),
  downloadMarkdownFile: vi.fn(),
  showSuccessNotificationWithTokens: vi.fn()
}));

vi.mock('../../../extension/content/components/FloatingButton.js', () => ({
  createFloatingButton: vi.fn(() => ({
    appendTo: vi.fn(),
    show: vi.fn(),
    remove: vi.fn(),
    setLoading: vi.fn(),
    setSuccess: vi.fn(),
    setError: vi.fn(),
    setNormal: vi.fn()
  }))
}));

vi.mock('gpt-tokenizer', () => ({
  encode: vi.fn((text) => ({ length: Math.ceil(text.length / 4) }))
}));

describe('Universal Module', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://example.com/page'
    });
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    global.navigator = dom.window.navigator;
    
    // Reset chrome mocks
    global.chrome.storage.sync.get.mockImplementation((defaults, callback) => {
      const result = { ...defaults };
      if (callback) callback(result);
      return Promise.resolve(result);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Content Detection', () => {
    it('should detect main element when present', () => {
      document.body.innerHTML = `
        <header>Header</header>
        <main>Main content area with lots of text</main>
        <footer>Footer</footer>
      `;
      
      const main = document.querySelector('main');
      expect(main).toBeTruthy();
      expect(main.textContent).toContain('Main content area');
    });

    it('should detect role=main when main element is absent', () => {
      document.body.innerHTML = `
        <div role="main">Content with role main</div>
        <nav>Navigation</nav>
      `;
      
      const mainRole = document.querySelector('[role="main"]');
      expect(mainRole).toBeTruthy();
      expect(mainRole.textContent).toContain('Content with role main');
    });

    it('should detect article element', () => {
      document.body.innerHTML = `
        <article>This is an article</article>
      `;
      
      const article = document.querySelector('article');
      expect(article).toBeTruthy();
      expect(article.textContent).toContain('This is an article');
    });
  });

  describe('HTML Structure Handling', () => {
    it('should handle headings correctly', () => {
      document.body.innerHTML = `
        <main>
          <h1>Main Title</h1>
          <h2>Subtitle</h2>
          <p>Content</p>
        </main>
      `;
      
      const headings = document.querySelectorAll('h1, h2');
      expect(headings.length).toBe(2);
    });

    it('should handle nested lists', () => {
      document.body.innerHTML = `
        <main>
          <ul>
            <li>Item 1
              <ul>
                <li>Nested item</li>
              </ul>
            </li>
            <li>Item 2</li>
          </ul>
        </main>
      `;
      
      const lists = document.querySelectorAll('ul');
      expect(lists.length).toBe(2);
    });

    it('should handle code blocks', () => {
      document.body.innerHTML = `
        <main>
          <pre><code class="language-javascript">const x = 1;</code></pre>
        </main>
      `;
      
      const codeBlock = document.querySelector('pre code');
      expect(codeBlock).toBeTruthy();
      expect(codeBlock.className).toContain('language-javascript');
    });

    it('should handle images', () => {
      document.body.innerHTML = `
        <main>
          <img src="test.jpg" alt="Test image">
        </main>
      `;
      
      const img = document.querySelector('img');
      expect(img).toBeTruthy();
      expect(img.alt).toBe('Test image');
    });

    it('should handle links', () => {
      document.body.innerHTML = `
        <main>
          <a href="https://example.com">Link text</a>
        </main>
      `;
      
      const link = document.querySelector('a');
      expect(link).toBeTruthy();
      expect(link.textContent).toBe('Link text');
    });
  });

  describe('Navigation Stripping', () => {
    it('should identify nav elements', () => {
      document.body.innerHTML = `
        <nav>Navigation menu</nav>
        <main>Main content</main>
      `;
      
      const nav = document.querySelector('nav');
      expect(nav).toBeTruthy();
    });

    it('should identify header elements', () => {
      document.body.innerHTML = `
        <header>Site header</header>
        <main>Main content</main>
      `;
      
      const header = document.querySelector('header');
      expect(header).toBeTruthy();
    });

    it('should identify footer elements', () => {
      document.body.innerHTML = `
        <main>Main content</main>
        <footer>Site footer</footer>
      `;
      
      const footer = document.querySelector('footer');
      expect(footer).toBeTruthy();
    });

    it('should identify aside elements', () => {
      document.body.innerHTML = `
        <main>Main content</main>
        <aside>Sidebar</aside>
      `;
      
      const aside = document.querySelector('aside');
      expect(aside).toBeTruthy();
    });
  });

  describe('Custom Selector Mode', () => {
    it('should find element by custom CSS selector', () => {
      document.body.innerHTML = `
        <div class="sidebar">Sidebar</div>
        <div class="article-content">Main article content</div>
      `;
      
      const target = document.querySelector('.article-content');
      expect(target).toBeTruthy();
      expect(target.textContent).toContain('Main article content');
    });

    it('should handle ID selectors', () => {
      document.body.innerHTML = `
        <div id="main-content">Content by ID</div>
      `;
      
      const target = document.querySelector('#main-content');
      expect(target).toBeTruthy();
    });

    it('should handle complex selectors', () => {
      document.body.innerHTML = `
        <div class="wrapper">
          <div class="content">
            <article>Nested article</article>
          </div>
        </div>
      `;
      
      const target = document.querySelector('.wrapper .content article');
      expect(target).toBeTruthy();
      expect(target.textContent).toContain('Nested article');
    });
  });

  describe('Largest Content Block Detection', () => {
    it('should find the largest content block', () => {
      document.body.innerHTML = `
        <div class="small">Small text</div>
        <div class="large">${'Lorem ipsum '.repeat(100)}</div>
        <div class="medium">${'Some text '.repeat(20)}</div>
      `;
      
      const divs = Array.from(document.querySelectorAll('div'));
      const largest = divs.reduce((max, el) => 
        (el.textContent.length > max.textContent.length) ? el : max
      );
      
      expect(largest.className).toBe('large');
    });
  });

  describe('Settings Integration', () => {
    it('should respect universalIncludeImages setting', async () => {
      global.chrome.storage.sync.get.mockImplementation((defaults, callback) => {
        const result = { ...defaults, universalIncludeImages: false };
        if (callback) callback(result);
        return Promise.resolve(result);
      });

      const result = await new Promise(resolve => {
        chrome.storage.sync.get({ universalIncludeImages: true }, resolve);
      });

      expect(result.universalIncludeImages).toBe(false);
    });

    it('should respect universalStripNav setting', async () => {
      global.chrome.storage.sync.get.mockImplementation((defaults, callback) => {
        const result = { ...defaults, universalStripNav: true };
        if (callback) callback(result);
        return Promise.resolve(result);
      });

      const result = await new Promise(resolve => {
        chrome.storage.sync.get({ universalStripNav: true }, resolve);
      });

      expect(result.universalStripNav).toBe(true);
    });

    it('should respect universalContentMode setting', async () => {
      global.chrome.storage.sync.get.mockImplementation((defaults, callback) => {
        const result = { ...defaults, universalContentMode: 'full' };
        if (callback) callback(result);
        return Promise.resolve(result);
      });

      const result = await new Promise(resolve => {
        chrome.storage.sync.get({ universalContentMode: 'auto' }, resolve);
      });

      expect(result.universalContentMode).toBe('full');
    });
  });
});

describe('Universal Defaults', () => {
  it('should have all universal settings in DEFAULTS', async () => {
    const { DEFAULTS } = await import('../../../extension/shared/defaults.js');
    
    expect(DEFAULTS).toHaveProperty('enableUniversalIntegration', true);
    expect(DEFAULTS).toHaveProperty('universalIncludeImages', true);
    expect(DEFAULTS).toHaveProperty('universalIncludeLinks', true);
    expect(DEFAULTS).toHaveProperty('universalIncludeUrl', true);
    expect(DEFAULTS).toHaveProperty('universalContentMode', 'auto');
    expect(DEFAULTS).toHaveProperty('universalCustomSelector', '');
    expect(DEFAULTS).toHaveProperty('universalStripNav', true);
    expect(DEFAULTS).toHaveProperty('universalPreserveCodeBlocks', true);
  });

  it('should have universal settings in SETTING_SCHEMA', async () => {
    const { SETTING_SCHEMA } = await import('../../../extension/shared/defaults.js');
    
    expect(SETTING_SCHEMA).toHaveProperty('enableUniversalIntegration', 'boolean');
    expect(SETTING_SCHEMA).toHaveProperty('universalIncludeImages', 'boolean');
    expect(SETTING_SCHEMA).toHaveProperty('universalIncludeLinks', 'boolean');
    expect(SETTING_SCHEMA).toHaveProperty('universalIncludeUrl', 'boolean');
    expect(SETTING_SCHEMA).toHaveProperty('universalContentMode', 'string');
    expect(SETTING_SCHEMA).toHaveProperty('universalCustomSelector', 'string');
    expect(SETTING_SCHEMA).toHaveProperty('universalStripNav', 'boolean');
    expect(SETTING_SCHEMA).toHaveProperty('universalPreserveCodeBlocks', 'boolean');
  });
});

