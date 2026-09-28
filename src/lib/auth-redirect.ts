export const canonicalDashboardUrl = 'https://app.stagelaboratories.com';

const legacyDashboardHosts = new Set([
  'app-stage-labs.ai.studio',
  'stage-dash.ai.studio',
]);

/**
 * Sends production sign-in and email-confirmation callbacks to the custom
 * Stage app domain while keeping local and explicit preview environments usable.
 */
export function resolveAuthRedirectUrl(
  currentOrigin: string,
  configuredAppUrl?: string,
) {
  const current = new URL(currentOrigin);

  if (
    current.hostname === new URL(canonicalDashboardUrl).hostname ||
    legacyDashboardHosts.has(current.hostname)
  ) {
    return canonicalDashboardUrl;
  }

  if (configuredAppUrl) {
    try {
      const configured = new URL(configuredAppUrl);
      return legacyDashboardHosts.has(configured.hostname)
        ? canonicalDashboardUrl
        : configured.origin;
    } catch {
      // A malformed build-time value must not break local or preview access.
    }
  }

  return current.origin;
}
