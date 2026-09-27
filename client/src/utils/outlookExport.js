/**
 * Outlook & Email Export Utilities for IDT Dashboard
 */

/**
 * Creates an RFC 822 MIME-compliant .eml file with an embedded/attached PNG screenshot.
 * Opening this file in Windows/Mac opens Outlook with the screenshot pre-attached!
 */
export function generateEmlBlob({
  subject = 'IDT Weekly Freight Report',
  bodyHtml = '<p>Hi Team,</p><p>Please find attached the latest IDT Weekly Freight Report summary.</p><p>Regards,<br/>Mondelez IDT Team</p>',
  imageBase64 = '',
  fileName = 'IDT_Weekly_Report.png'
}) {
  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const boundary = `----=_NextPart_${Date.now().toString(16)}_${Math.random().toString(16).substring(2, 8)}`;
  
  // Format formatted base64 with 76 char lines
  const formattedBase64 = cleanBase64.match(/.{1,76}/g)?.join('\r\n') || cleanBase64;

  const emlContent = [
    `X-Unsent: 1`, // Tells Outlook to open as an editable DRAFT rather than a sent message
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `This is a multi-part message in MIME format.`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="utf-8"`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    `<!DOCTYPE html>`,
    `<html>`,
    `<body style="font-family: Arial, sans-serif; color: #1E293B; line-height: 1.5;">`,
    bodyHtml,
    `<div style="margin-top: 15px;">`,
    `<p style="font-size: 13px; color: #64748B;">[Attached Snapshot: <b>${fileName}</b>]</p>`,
    `</div>`,
    `</body>`,
    `</html>`,
    ``,
    `--${boundary}`,
    `Content-Type: image/png; name="${fileName}"`,
    `Content-Transfer-Encoding: base64`,
    `Content-Disposition: attachment; filename="${fileName}"`,
    ``,
    formattedBase64,
    ``,
    `--${boundary}--`,
    ``
  ].join('\r\n');

  return new Blob([emlContent], { type: 'message/rfc822' });
}

/**
 * Downloads a generated .eml draft file which opens natively in Outlook with attachment
 */
export function downloadEmlDraft({ subject, bodyHtml, imageBase64, fileName = 'IDT_Weekly_Report.eml' }) {
  const blob = generateEmlBlob({
    subject,
    bodyHtml,
    imageBase64,
    fileName: fileName.replace(/\.eml$/i, '.png')
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.eml') ? fileName : `${fileName}.eml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

/**
 * Copies the canvas image directly into the operating system clipboard
 */
export async function copyCanvasToClipboard(canvas) {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) {
      return false;
    }
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return false;
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    return true;
  } catch (err) {
    console.warn('Clipboard write failed:', err);
    return false;
  }
}
