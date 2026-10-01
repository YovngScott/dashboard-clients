export const canonicalDashboardUrl = 'https://app.stagelaboratories.com';

const legacyDashboardHosts = new Set([
  'app-stage-labs.ai.studio',
  'stage-dash.ai.studio',
]);

function isTrustedOrigin(url: URL): boolean {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;

  // Local development
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;

  // Require HTTPS for remote origins
  if (url.protocol !== 'https:') return false;

  // Canonical and company domains
  if (
    url.hostname === 'app.stagelaboratories.com' ||
    url.hostname === 'stagelaboratories.com' ||
    url.hostname.endsWith('.stagelaboratories.com')
  ) {
    return true;
  }

  // Cloudflare Pages deployments (*.pages.dev)
  if (url.hostname.endsWith('.pages.dev')) {
    return true;
  }

  return false;
}

/**
 * Sends production sign-in and email-confirmation callbacks to the custom
 * Stage app domain while keeping local and explicit preview environments usable.
 * Rejects untrusted or spoofed origins by falling back to canonicalDashboardUrl.
 */
export function resolveAuthRedirectUrl(
  currentOrigin: string,
  configuredAppUrl?: string,
) {
  let current: URL;
  try {
    current = new URL(currentOrigin);
  } catch {
    return canonicalDashboardUrl;
  }

  if (
    current.hostname === new URL(canonicalDashboardUrl).hostname ||
    legacyDashboardHosts.has(current.hostname)
  ) {
    return canonicalDashboardUrl;
  }

  if (configuredAppUrl) {
    try {
      const configured = new URL(configuredAppUrl);
      if (legacyDashboardHosts.has(configured.hostname)) {
        return canonicalDashboardUrl;
      }
      if (
        (isTrustedOrigin(configured) || configured.hostname === current.hostname) &&
        ['https:', 'http:'].includes(configured.protocol)
      ) {
        return configured.origin;
      }
    } catch {
      // A malformed build-time value must not break local or preview access.
    }
  }

  if (isTrustedOrigin(current)) {
    return current.origin;
  }

  return canonicalDashboardUrl;
}
