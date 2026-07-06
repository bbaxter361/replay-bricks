export function getVisiblePortalApps(user, apps) {
  const roles = new Set(user?.roles || []);
  return apps.filter((app) => (app.allowedRoles || []).some((role) => roles.has(role)));
}
