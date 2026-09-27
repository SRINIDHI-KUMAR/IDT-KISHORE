import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';

export function isGraphConfigured() {
  return !!(
    process.env.AZURE_TENANT_ID &&
    process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_CLIENT_SECRET
  );
}

/**
 * Acquire application token using MSAL client credentials
 */
async function getApplicationAccessToken() {
  const msalConfig = {
    auth: {
      clientId: process.env.AZURE_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}`,
      clientSecret: process.env.AZURE_CLIENT_SECRET
    }
  };

  const cca = new ConfidentialClientApplication(msalConfig);
  const clientCredentialRequest = {
    scopes: ['https://graph.microsoft.com/.default']
  };

  const response = await cca.acquireTokenByClientCredential(clientCredentialRequest);
  return response.accessToken;
}

/**
 * Initialize Microsoft Graph client
 */
export async function getGraphClient(userAccessToken = null) {
  const token = userAccessToken || (await getApplicationAccessToken());
  return Client.init({
    authProvider: (done) => {
      done(null, token);
    }
  });
}

/**
 * Creates an Outlook email draft with attached dashboard PNG screenshot.
 */
export async function createOutlookDraft({
  image,
  fileName = 'IDT_Weekly_Report.png',
  subject = 'IDT Weekly Freight Report',
  bodyContent = '<p>Hi Team,</p><p>Please find attached the latest IDT Weekly Freight Report summary.</p><p>Regards,<br/>Mondelez IDT Team</p>',
  userEmail = process.env.DEFAULT_USER_EMAIL,
  userToken = null
}) {
  // Clean base64 image data
  let base64Data = image;
  if (typeof image === 'string' && image.includes(',')) {
    base64Data = image.split(',')[1];
  }

  const draftMessage = {
    subject: subject,
    importance: 'Normal',
    body: {
      contentType: 'HTML',
      content: bodyContent
    },
    attachments: [
      {
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: fileName,
        contentType: 'image/png',
        contentBytes: base64Data
      }
    ]
  };

  // If neither user delegated token nor app credentials are set, return demo mode
  if (!userToken && !isGraphConfigured()) {
    return {
      success: true,
      isDemoMode: true,
      message: 'Demo Mode: Microsoft 365 credentials not yet configured.',
      draftId: 'demo-draft-' + Date.now(),
      webLink: 'https://outlook.office.com/mail/deeplink/compose'
    };
  }

  const client = await getGraphClient(userToken);
  let draft;

  if (userToken || (!userEmail && !process.env.DEFAULT_USER_EMAIL)) {
    // Current signed-in user's mailbox (/me)
    draft = await client.api('/me/messages').post(draftMessage);
  } else {
    // Specific organizational mailbox (/users/{email})
    const target = userEmail || process.env.DEFAULT_USER_EMAIL;
    draft = await client.api(`/users/${target}/messages`).post(draftMessage);
  }

  return {
    success: true,
    isDemoMode: false,
    draftId: draft.id,
    webLink: draft.webLink || `https://outlook.office.com/mail/deeplink/read/${encodeURIComponent(draft.id)}`,
    message: 'Draft successfully created in Outlook with screenshot attached!'
  };
}
