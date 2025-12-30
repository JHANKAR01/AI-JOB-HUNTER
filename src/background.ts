import { QuickAddRequest } from './types';

declare var chrome: any;

// Listen for messages from Mission Control
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'QUICK_ADD_JOB') {
    handleQuickAdd((message as QuickAddRequest).url)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }
});

// Configure Sidepanel behavior
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

async function handleQuickAdd(url: string) {
  // 1. Create a temporary, inactive tab
  const tab = await chrome.tabs.create({ url, active: false });
  if (!tab.id) throw new Error("Failed to create tab");

  try {
    // 2. Wait for DOM to load
    await waitForTabLoad(tab.id);

    // 3. Inject generic extraction script
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJobDataDOM,
    });

    const extractedData = results[0]?.result;
    if (!extractedData) throw new Error("Failed to extract data");

    // 4. Close the tab immediately
    await chrome.tabs.remove(tab.id);

    // 5. Send to n8n (Local Automation Brain)
    await sendToN8n(extractedData, url);

  } catch (error) {
    console.error("Quick Add Failed:", error);
    // Cleanup
    chrome.tabs.remove(tab.id).catch(() => {});
    throw error;
  }
}

function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    const listener = (id: number, info: chrome.tabs.TabChangeInfo) => {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// Injected function (must be self-contained)
function extractJobDataDOM() {
  return {
    title: document.title,
    bodyText: document.body.innerText,
    metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
  };
}

async function sendToN8n(data: any, originalUrl: string) {
  // Retrieve config from storage directly since we aren't in React context
  const storage = await chrome.storage.local.get('jobflow-storage');
  let webhookBaseUrl = 'http://localhost:5678/webhook/';
  
  if (storage && storage['jobflow-storage']) {
    try {
        const state = JSON.parse(storage['jobflow-storage']);
        if (state.state.config.n8n.webhookBaseUrl) {
            webhookBaseUrl = state.state.config.n8n.webhookBaseUrl;
        }
    } catch (e) {
        console.warn("Failed to parse storage config, using default webhook.");
    }
  }

  const webhookUrl = `${webhookBaseUrl}job-intake`;
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: originalUrl,
      rawHtml: data.bodyText,
      metadata: data
    })
  });
}