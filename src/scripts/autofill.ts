import { UserConfig } from '../types';

/**
 * Main Auto-Fill Logic
 * Intended to be injected via chrome.scripting.executeScript
 */
export async function performAutofill(
  profile: UserConfig['profile'], 
  preferences: UserConfig['preferences']
) {
  
  // Mapping rules: Keywords to look for -> Value to fill
  const rules = [
    { keywords: ['first name', 'given name'], value: profile.fullName.split(' ')[0] },
    { keywords: ['last name', 'family name', 'surname'], value: profile.fullName.split(' ').slice(1).join(' ') },
    { keywords: ['full name', 'name'], value: profile.fullName },
    { keywords: ['email', 'e-mail'], value: profile.email },
    { keywords: ['phone', 'mobile', 'cell'], value: profile.phone },
    { keywords: ['linkedin', 'linked in'], value: profile.linkedinUrl },
    { keywords: ['portfolio', 'website', 'personal site'], value: profile.portfolioUrl },
    { keywords: ['salary', 'compensation', 'expectation'], value: preferences.salaryTarget.toString() },
    { keywords: ['notice', 'start date', 'earliest'], value: preferences.noticePeriod },
    { keywords: ['sponsorship', 'visa', 'authorized'], value: 'Yes' },
    { keywords: ['why us', 'why do you want', 'cover letter'], value: `I am excited about this opportunity at ${document.title} because...` },
  ];

  const inputs = Array.from(document.querySelectorAll('input, textarea, select')) as HTMLElement[];

  for (const input of inputs) {
    // Skip hidden fields to avoid breaking form logic
    if (input.getAttribute('type') === 'hidden' || input.getAttribute('type') === 'submit') continue;
    
    // Skip if already filled
    if ((input as HTMLInputElement).value && (input as HTMLInputElement).value.length > 0) continue;

    const label = findLabel(input);
    const labelText = label ? label.innerText.toLowerCase() : '';
    const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
    const nameAttr = input.getAttribute('name')?.toLowerCase() || '';
    const idAttr = input.getAttribute('id')?.toLowerCase() || '';

    // Create a context string for keyword matching
    const context = `${labelText} ${placeholder} ${nameAttr} ${idAttr}`;

    for (const rule of rules) {
      if (rule.keywords.some(k => context.includes(k))) {
        await simulateTyping(input, rule.value);
        highlightField(input);
        break; // Stop checking rules for this input once matched
      }
    }
  }
}

/**
 * Label Proximity Heuristic
 * Finds the most likely label for an input field.
 */
function findLabel(input: HTMLElement): HTMLElement | null {
  // 1. Explicit label with 'for'
  const id = input.getAttribute('id');
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label as HTMLElement;
  }
  
  // 2. Parent label wrapping input
  const parentLabel = input.closest('label');
  if (parentLabel) return parentLabel;

  // 3. Proximity (previous sibling or parent's previous sibling)
  let prev = input.previousElementSibling;
  // If wrapped in a div/span, look up one level
  if (!prev && input.parentElement) {
      prev = input.parentElement.previousElementSibling;
  }
  
  if (prev && ['LABEL', 'SPAN', 'DIV', 'H3', 'H4'].includes(prev.tagName)) return prev as HTMLElement;
  
  return null;
}

/**
 * Async Typing Simulator
 * Triggers React/Angular change listeners.
 */
async function simulateTyping(element: HTMLElement, value: string) {
  if (!value) return;
  
  element.focus();
  
  const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  
  // React 16+ hack to trigger native value setter
  const prototype = Object.getPrototypeOf(input);
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  
  if (setter) {
      setter.call(input, value);
  } else {
      input.value = value;
  }

  // Dispatch events
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.blur();

  // Async delay to mimic human behavior
  await new Promise(r => setTimeout(r, 150 + Math.random() * 150)); 
}

function highlightField(element: HTMLElement) {
  element.style.backgroundColor = '#e0e7ff'; // Indigo 50
  element.style.border = '2px solid #6366f1'; // Indigo 500
  element.style.transition = 'all 0.3s ease';
}