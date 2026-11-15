/**
 * Triggers native Windows Win+PrintScreen capture and launches Outlook via Python backend.
 * Zero browser confirmation popups.
 */
export async function captureAndOpenOutlook(onProgress, showToast) {
  try {
    if (onProgress) onProgress('capturing');

    // Trigger Python automation backend to press Win + PrintScreen and launch Outlook
    const response = await fetch('http://127.0.0.1:5005/api/trigger-screenshot-and-outlook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (onProgress) onProgress('copied');
    if (showToast) {
      showToast('📸 Win + PrintScreen captured & opening Outlook...');
    }
  } catch (err) {
    console.warn('Python backend not running on port 5005:', err);
    if (showToast) {
      showToast('⚠️ Please run "python server/app.py" or start_server.bat in your terminal.');
    }
  } finally {
    setTimeout(() => {
      if (onProgress) onProgress(null);
    }, 2500);
  }
}
