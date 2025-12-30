import { Job } from '../types';

declare var chrome: any;

export async function syncJobsToSheets(jobs: Record<string, Job>, spreadsheetId: string): Promise<{ success: boolean; message: string }> {
  if (!spreadsheetId) {
    return { success: false, message: 'No Spreadsheet ID configured.' };
  }

  try {
    const token = await getAuthToken();
    if (!token) throw new Error("Failed to get OAuth token");

    const rows = Object.values(jobs).map(job => [
      job.id,
      job.company,
      job.title,
      job.status,
      job.atsScore,
      job.url,
      new Date(job.addedAt).toISOString()
    ]);

    // Header row
    const values = [
      ['ID', 'Company', 'Title', 'Status', 'ATS Score', 'URL', 'Added At'],
      ...rows
    ];

    // Clear existing (simple approach) or Append. Here we define a range "Sheet1!A1" to update
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:G${values.length}?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Sheets API request failed');
    }

    return { success: true, message: 'Sync complete' };

  } catch (error: any) {
    console.error('Sheets Sync Error:', error);
    return { success: false, message: error.message };
  }
}

function getAuthToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token: string) => {
      if (chrome.runtime.lastError || !token) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}
