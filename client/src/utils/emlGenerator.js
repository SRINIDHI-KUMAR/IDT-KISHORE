/**
 * Utility to generate and download an RFC 822 / MIME .eml draft file
 * that opens directly in Outlook Classic with X-Unsent: 1 header.
 */

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) { 
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function wrapBase64(b64, lineLength = 76) {
  const clean = b64.replace(/\s+/g, '');
  const lines = [];
  for (let i = 0; i < clean.length; i += lineLength) {
    lines.push(clean.slice(i, i + lineLength));
  }
  return lines.join('\r\n');
}

export function generateAndDownloadEml({ subject, htmlBody, plainTextBody, imageBase64 }) {
  const boundary = `----=_Part_IDT_${Date.now()}`;
  const subjectEncoded = `=?UTF-8?B?${utf8ToBase64(subject || 'IDT Logistics Weekly Report')}?=`;

  let finalHtml = htmlBody || '';
  let hasImage = false;
  let cleanImageB64 = '';

  if (imageBase64 && typeof imageBase64 === 'string') {
    if (imageBase64.includes(',')) {
      cleanImageB64 = imageBase64.split(',')[1];
    } else {
      cleanImageB64 = imageBase64;
    }
    hasImage = cleanImageB64.length > 50;
  }

  const cidImg = `<div style="margin: 8px 0;"><img src="cid:dashboard_screenshot" style="max-width: 100%; border: 1.5px solid #CBD5E1; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.06);" alt="IDT Dashboard Screenshot" /></div>`;

  if (hasImage) {
    if (finalHtml.includes('<!-- OPENING STATEMENT -->')) {
      finalHtml = finalHtml.replace('<!-- OPENING STATEMENT -->', `${cidImg}\n<!-- OPENING STATEMENT -->`);
    } else if (finalHtml.includes('<body')) {
      const idx = finalHtml.indexOf('>') + 1;
      finalHtml = finalHtml.slice(0, idx) + `\n${cidImg}\n` + finalHtml.slice(idx);
    } else {
      finalHtml = `<html><body>${cidImg}${finalHtml}</body></html>`;
    }
  }

  const htmlBase64Wrapped = wrapBase64(utf8ToBase64(finalHtml));

  let eml = '';
  eml += `X-Unsent: 1\r\n`;
  eml += `MIME-Version: 1.0\r\n`;
  eml += `Subject: ${subjectEncoded}\r\n`;
  eml += `Content-Type: multipart/related; boundary="${boundary}"\r\n\r\n`;

  // HTML Body Part
  eml += `--${boundary}\r\n`;
  eml += `Content-Type: text/html; charset="utf-8"\r\n`;  
  eml += `Content-Transfer-Encoding: base64\r\n\r\n`;
  eml += `${htmlBase64Wrapped}\r\n\r\n`;

  // Image Part
  if (hasImage) {
    const imgBase64Wrapped = wrapBase64(cleanImageB64);
    eml += `--${boundary}\r\n`;
    eml += `Content-Type: image/png; name="dashboard_screenshot.png"\r\n`;
    eml += `Content-Transfer-Encoding: base64\r\n`;
    eml += `Content-ID: <dashboard_screenshot>\r\n`;
    eml += `Content-Disposition: inline; filename="dashboard_screenshot.png"\r\n\r\n`;
    eml += `${imgBase64Wrapped}\r\n\r\n`;
  }

  eml += `--${boundary}--\r\n`;

  const blob = new Blob([eml], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeDate = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `IDT_Weekly_Report_${safeDate}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
