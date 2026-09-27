import { PublicClientApplication } from '@azure/msal-browser';

// Microsoft Entra ID Config (Mondelez Single Sign-On)
// Users can set VITE_AZURE_CLIENT_ID in client/.env or pass dynamically
const DEFAULT_CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID || 'common';
const DEFAULT_TENANT = import.meta.env.VITE_AZURE_TENANT_ID || 'common';

let msalApp = null;

export function getMsalInstance(clientId = DEFAULT_CLIENT_ID, tenantId = DEFAULT_TENANT) {
  if (!msalApp || msalApp.config.auth.clientId !== clientId) {
    msalApp = new PublicClientApplication({
      auth: {
        clientId: clientId || 'common',
        authority: `https://login.microsoftonline.com/${tenantId || 'common'}`,
        redirectUri: window.location.origin
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false
      }
    });
  }
  return msalApp;
}

/**
 * Triggers the Microsoft / Mondelez Portal Login Popup
 * Scopes: User.Read, Mail.ReadWrite
 */
export async function loginAndGetToken(customClientId, customTenantId) {
  const clientId = customClientId || import.meta.env.VITE_AZURE_CLIENT_ID;
  const tenantId = customTenantId || import.meta.env.VITE_AZURE_TENANT_ID || 'common';

  if (!clientId || clientId === 'common') {
    // If no client ID configured yet, return null to proceed with seamless direct capture + clipboard/eml mode
    return null;
  }

  const app = getMsalInstance(clientId, tenantId);
  await app.initialize();

  const loginRequest = {
    scopes: ['User.Read', 'Mail.ReadWrite', 'Mail.Send']
  };

  try {
    // Attempt silent token first if already logged in
    const accounts = app.getAllAccounts();
    if (accounts.length > 0) {
      const silentResponse = await app.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0]
      });
      return {
        token: silentResponse.accessToken,
        account: silentResponse.account
      };
    }
  } catch (silentErr) {
    console.log('Silent token acquisition failed, opening popup login:', silentErr);
  }

  // Open official Microsoft / Mondelez login popup
  const response = await app.loginPopup(loginRequest);
  return {
    token: response.accessToken,
    account: response.account
  };
}
