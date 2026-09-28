export const canonicalDashboardUrl = 'https://app-stage-labs.ai.studio';

const retiredDashboardHosts = new Set([
  'stage-dash.ai.studio',
]);

/**
 * Resolves every production auth callback to the live dashboard while keeping
 * local and preview environments usable during development.
 */
export function resolveAuthRedirectUrl(
  currentOrigin: string,
  configuredAppUrl?: string,
) {
  const current = new URL(currentOrigin);

  if (
    current.hostname === new URL(canonicalDashboardUrl).hostname ||
    retiredDashboardHosts.has(current.hostname)
  ) {
    return canonicalDashboardUrl;
  }

  if (configuredAppUrl) {
    try {
      const configured = new URL(configuredAppUrl);
      return retiredDashboardHosts.has(configured.hostname)
        ? canonicalDashboardUrl
        : configured.origin;
    } catch {
      // A malformed build-time value must not break local or preview access.
    }
  }

  return current.origin;
}
