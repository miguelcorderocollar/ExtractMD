import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();
const preview = document.getElementById('markdown-preview');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RENDER_MARKDOWN' && message.markdown) {
    preview.innerHTML = md.render(message.markdown);
  }
});

chrome.runtime.sendMessage({ type: 'REQUEST_MARKDOWN' });
preview.innerHTML = '<em>Waiting for markdown to preview...</em>'; 