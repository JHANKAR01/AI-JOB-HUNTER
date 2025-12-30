import { QuickAddRequest, TriggerAutofillRequest } from './types';
import { performAutofill } from './scripts/autofill';

declare var chrome: any;

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'QUICK_ADD_JOB') {
    handleQuickAdd((message as QuickAddRequest).url)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'TRIGGER_AUTOFILL') {
    handleAutofill(message as TriggerAutofillRequest)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

// --- Handlers ---

async function handleAutofill(req: TriggerAutofillRequest) {
  // Get the active tab in the current window
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab?.id) throw new Error("No active tab found");

  // Inject the autofill logic
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: performAutofill,
    args: [req.profile, req.preferences]
  });
}

async function handleQuickAdd(url: string) {
  const tab = await chrome.tabs.create({ url, active: false });
  if (!tab.id) throw new Error("Failed to create tab");

  try {
    await waitForTabLoad(tab.id);

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJobDataDOM,
    });

    const extractedData = results[0]?.result;
    if (!extractedData) throw new Error("Failed to extract data");

    await chrome.tabs.remove(tab.id);
    await sendToN8n(extractedData, url);

  } catch (error) {
    console.error("Quick Add Failed:", error);
    chrome.tabs.remove(tab.id).catch(() => {});
    throw error;
  }
}

function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    const listener = (id: number, info: any) => {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// --- Content Script Logic (Injected) ---

function extractJobDataDOM() {
  const hostname = window.location.hostname;
  
  // Selectors for common ATS/Job Boards
  const selectors: Record<string, { title: string; company: string; description: string; location?: string }> = {
    'linkedin.com': {
      title: '.job-details-jobs-unified-top-card__job-title, .top-card-layout__title',
      company: '.job-details-jobs-unified-top-card__company-name, .top-card-layout__first-subline .topcard__org-name-link',
      description: '#job-details, .description__text',
      location: '.job-details-jobs-unified-top-card__primary-description-container, .top-card-layout__first-subline .topcard__flavor--bullet'
    },
    'greenhouse.io': {
      title: '.app-title, h1.app-title',
      company: '.company-name',
      description: '#content, #main',
      location: '.location'
    },
    'lever.co': {
      title: '.posting-headline h2',
      company: '.main-header-logo img', // Fallback needed usually
      description: '.content, .section-wrapper',
      location: '.posting-categories .location'
    },
    'workday.com': {
        title: '[data-automation-id="jobPostingHeader"]',
        company: '[data-automation-id="aboutCompany"]',
        description: '[data-automation-id="jobPostingDescription"]',
        location: '[data-automation-id="jobPostingLocation"]'
    }
  };

  let title = document.title;
  let company = '';
  let description = document.body.innerText;
  let location = '';

  // 1. Try Specific Domain Match
  for (const domain in selectors) {
    if (hostname.includes(domain)) {
      const sel = selectors[domain];
      const titleEl = document.querySelector(sel.title);
      const companyEl = document.querySelector(sel.company);
      const descEl = document.querySelector(sel.description);
      const locEl = sel.location ? document.querySelector(sel.location) : null;

      if (titleEl) title = (titleEl as HTMLElement).innerText.trim();
      if (companyEl) company = (companyEl as HTMLElement).innerText.trim();
      if (descEl) description = (descEl as HTMLElement).innerText.trim();
      if (locEl) location = (locEl as HTMLElement).innerText.trim();
      break;
    }
  }

  // 2. Heuristic Fallback
  if (!company) {
      // Try OG tags
      const ogSite = document.querySelector('meta[property="og:site_name"]');
      if (ogSite) company = ogSite.getAttribute('content') || '';
  }

  return {
    title,
    company,
    bodyText: description, // Mapping to 'rawDescription'
    location,
    metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
    url: window.location.href
  };
}

async function sendToN8n(data: any, originalUrl: string) {
  const storage = await chrome.storage.local.get('jobflow-storage');
  let webhookBaseUrl = 'http://localhost:5678/webhook/';
  
  if (storage && storage['jobflow-storage']) {
    try {
        const state = JSON.parse(storage['jobflow-storage']);
        if (state.state.config.n8n.webhookBaseUrl) {
            webhookBaseUrl = state.state.config.n8n.webhookBaseUrl;
        }
    } catch (e) { console.warn("Config load failed"); }
  }

  await fetch(`${webhookBaseUrl}job-intake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: originalUrl,
      rawHtml: data.bodyText,
      metadata: data
    })
  });
}