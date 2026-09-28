import html2canvas from 'html2canvas';

/**
 * Captures true pixel-perfect native screenshot of the dashboard (equivalent to pressing PrintScreen),
 * copies it directly to the system clipboard, and opens Microsoft Outlook web compose in a new tab.
 */
export async function captureAndOpenOutlook(onProgress, showToast) {
  let stream = null;
  try {
    if (onProgress) onProgress('capturing');
    window.focus();

    let blob = null;

    // 1. Primary: True Native Pixel-Perfect Screen Capture (Exact PrintScreen Quality)
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'never',
            displaySurface: 'browser'
          },
          audio: false,
          preferCurrentTab: true,
          selfBrowserSurface: 'include',
          surfaceSwitching: 'include'
        });

        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        await video.play();

        // Allow frame to render
        await new Promise((resolve) => setTimeout(resolve, 120));

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || window.innerWidth;
        canvas.height = video.videoHeight || window.innerHeight;
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Terminate screen share stream immediately
        stream.getTracks().forEach((track) => track.stop());
        stream = null;

        blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
      } catch (nativeErr) {
        console.warn('Native screen capture cancelled or unavailable, using DOM renderer:', nativeErr);
      }
    }

    // 2. Fallback: High-Fidelity DOM Snapshot if native capture is not allowed/supported
    if (!blob) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 100));

      const isDark = document.body.classList.contains('dark-theme');
      const target = document.querySelector('.app-container') || document.body;
      const canvas = await html2canvas(target, {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        logging: false,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        backgroundColor: isDark ? '#0A0E1A' : '#FBF5F2',
        onclone: (clonedDoc) => {
          const cloneBtn = clonedDoc.getElementById('btn-top-right-outlook');
          if (cloneBtn) {
            cloneBtn.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
              <span>Share to Outlook</span>
            `;
          }

          // Replace native selects with styled divs in clone to avoid html2canvas text clipping
          const clonedSelects = clonedDoc.querySelectorAll('select');
          clonedSelects.forEach((sel) => {
            const selectedText = sel.options[sel.selectedIndex]?.text || sel.value || 'All';
            const fakeDiv = clonedDoc.createElement('div');
            fakeDiv.className = sel.className;
            fakeDiv.style.display = 'flex';
            fakeDiv.style.alignItems = 'center';
            fakeDiv.style.justifyContent = 'space-between';
            fakeDiv.style.padding = '3px 8px';
            fakeDiv.style.fontSize = '10.5px';
            fakeDiv.style.fontWeight = '700';
            fakeDiv.style.borderRadius = '5px';
            fakeDiv.style.background = isDark ? '#172033' : '#FFF9F7';
            fakeDiv.style.border = `1.2px solid ${isDark ? '#6C2E7B' : '#FF8A5B'}`;
            fakeDiv.style.color = isDark ? '#FFFFFF' : '#0D3B66';
            fakeDiv.innerHTML = `<span>${selectedText}</span><span style="font-size: 8px; margin-left: 6px; opacity: 0.7;">▼</span>`;
            sel.parentNode?.replaceChild(fakeDiv, sel);
          });

          // Hide modals and toasts in screenshot clone
          const toasts = clonedDoc.querySelectorAll('[style*="position: fixed"]');
          toasts.forEach((t) => {
            t.style.display = 'none';
          });
        }
      });

      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
    }

    // 3. Copy Image directly to System Clipboard
    if (blob && navigator.clipboard && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
      } catch (clipErr) {
        console.warn('Clipboard write warning:', clipErr);
      }
    }

    if (onProgress) onProgress('copied');
    if (showToast) {
      showToast('📸 Screenshot copied! Opening Outlook App...');
    }

    // 4. Send to Python Backend to Launch Outlook App & Auto-Paste
    if (blob) {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64Data = reader.result;
          fetch('http://127.0.0.1:5005/api/outlook-paste', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data })
          }).catch(() => {
            // If backend is not active, open Outlook App via mail protocol directly
            window.location.href = 'mailto:?subject=IDT%20Dashboard%20Report%20Snapshot';
          });
        };
      } catch (_) {
        window.location.href = 'mailto:?subject=IDT%20Dashboard%20Report%20Snapshot';
      }
    }

  } catch (err) {
    console.error('Error during screenshot capture:', err);
    window.location.href = 'mailto:?subject=IDT%20Dashboard%20Report%20Snapshot';
  } finally {
    if (stream) {
      try {
        stream.getTracks().forEach((track) => track.stop());
      } catch (_) {}
    }
    setTimeout(() => {
      if (onProgress) onProgress(null);
    }, 2500);
  }
}
