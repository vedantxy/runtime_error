/**
 * background.js
 * 
 * Extension service worker. Manages application states, routes messages
 * between UI, content scripts, and backend services.
 */

import { MessageActions } from '../shared/messageSchema.js';

const BACKEND_URL = 'http://localhost:4000';

chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Browser Companion Service Worker Installed.');
});

// Listener for extension icon action clicks
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_FLOATING_PANEL' }, (res) => {
    if (chrome.runtime.lastError) {
      console.log('Error sending message:', chrome.runtime.lastError.message);
      // Fallback: inject content script if not already present
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/Readability.js', 'content/content.js']
      }).then(() => {
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_FLOATING_PANEL' });
        }, 100);
      }).catch(err => {
        console.error('Failed to inject content script:', err);
      });
    }
  });
});

// Listener for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message);

  switch (message.action) {
    case 'TRIGGER_EXTRACTION':
      // Forward the extraction trigger to the active tab's content script
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (!tabs[0]) {
          sendResponse({ status: 'error', message: 'No active tab found' });
          return;
        }
        chrome.tabs.sendMessage(tabs[0].id, { action: 'TRIGGER_EXTRACTION' }, (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
          } else {
            sendResponse(response);
          }
        });
      });
      return true; // async response

    case 'USER_QUERY':
      handleUserQuery(message.payload)
        .then(response => sendResponse({ status: 'success', data: response }))
        .catch(err => sendResponse({ status: 'error', message: err.message }));
      return true; // async response

    case 'AGENT_GOTO_URL':
      chrome.tabs.create({ url: message.payload.url }, (tab) => {
        sendResponse({ status: 'success', tabId: tab.id });
      });
      return true;

    case 'AGENT_CLICK':
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (!tabs[0]) return sendResponse({ status: 'error', message: 'No active tab' });
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (selector) => {
            const el = document.querySelector(selector);
            if (el) { el.click(); return { success: true }; }
            return { success: false, error: 'Element not found' };
          },
          args: [message.payload.selector]
        }).then(results => sendResponse({ status: 'success', data: results[0].result }))
          .catch(err => sendResponse({ status: 'error', message: err.message }));
      });
      return true;

    case 'AGENT_TYPE':
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (!tabs[0]) return sendResponse({ status: 'error', message: 'No active tab' });
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (selector, text) => {
            const el = document.querySelector(selector);
            if (el) { 
              el.focus();
              el.value = text;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              return { success: true }; 
            }
            return { success: false, error: 'Element not found' };
          },
          args: [message.payload.selector, message.payload.text]
        }).then(results => sendResponse({ status: 'success', data: results[0].result }))
          .catch(err => sendResponse({ status: 'error', message: err.message }));
      });
      return true;

    case 'AGENT_GET_DOM':
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (!tabs[0]) return sendResponse({ status: 'error', message: 'No active tab' });
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            let elementsList = '';
            const interactives = document.querySelectorAll('a, button, input, textarea, select, [role="button"], [role="link"]');
            interactives.forEach((el, index) => {
              if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                let selector = el.id ? '#' + el.id : '';
                if (!selector) {
                   el.setAttribute('data-agent-id', `agent-${index}`);
                   selector = `[data-agent-id="agent-${index}"]`;
                }
                const type = el.tagName.toLowerCase();
                const text = (el.innerText || el.placeholder || el.value || el.name || el.title || '').replace(/\n/g, ' ').trim();
                if (text) {
                  elementsList += `[${type}] ${selector} - ${text.substring(0, 60)}\n`;
                }
              }
            });
            const textContent = document.body.innerText.substring(0, 3000);
            return `Page URL: ${window.location.href}\n\nInteractive Elements:\n${elementsList.substring(0, 3000)}\n\nPage Text:\n${textContent}`;
          }
        }).then(results => sendResponse({ status: 'success', data: results[0].result }))
          .catch(err => sendResponse({ status: 'error', message: err.message }));
      });
      return true;

    case 'AGENT_SCROLL':
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (!tabs[0]) return sendResponse({ status: 'error', message: 'No active tab' });
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (direction) => {
            const amount = direction === 'up' ? -window.innerHeight : window.innerHeight;
            window.scrollBy({ top: amount, left: 0, behavior: 'smooth' });
            return true;
          },
          args: [message.payload.direction || 'down']
        }).then(() => sendResponse({ status: 'success' }))
          .catch(err => sendResponse({ status: 'error', message: err.message }));
      });
      return true;

    case 'AGENT_WAIT':
      setTimeout(() => {
        sendResponse({ status: 'success' });
      }, message.payload.time || 2000);
      return true;

    case 'AGENT_EXTRACT_DATA':
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (!tabs[0]) return sendResponse({ status: 'error', message: 'No active tab' });
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (selector) => {
            const el = document.querySelector(selector);
            return el ? el.innerText : '';
          },
          args: [message.payload.selector]
        }).then(results => sendResponse({ status: 'success', data: results[0].result }))
          .catch(err => sendResponse({ status: 'error', message: err.message }));
      });
      return true;

    default:
      console.warn('[Background] Unknown action:', message.action);
      sendResponse({ status: 'error', message: `Unknown action: ${message.action}` });
      break;
  }
});

/**
 * Sends the query request to the backend API.
 * Routes to /api/summarize if the intent is SUMMARIZE.
 */
async function handleUserQuery(payload) {
  const isSummarize = payload.intent === 'SUMMARIZE';
  const endpoint = isSummarize ? `${BACKEND_URL}/api/summarize` : `${BACKEND_URL}/api/query`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
