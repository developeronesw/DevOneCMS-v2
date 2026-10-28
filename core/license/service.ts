import type { LicenseEntitlement, LicenseFeature, LicenseProvider, LicenseService } from "./types";

const DEFAULT_SINGLE_SITE_LIMIT = 1;

/** Network features must fail closed for missing, expired, or invalid entitlements. */
function hasActiveNetworkEntitlement(entitlement: LicenseEntitlement | null): entitlement is LicenseEntitlement {
  if (!entitlement || entitlement.edition !== "network") return false;
  if (entitlement.expiresAt === null) return true;
  const expiry = Date.parse(entitlement.expiresAt);
  return Number.isFinite(expiry) && expiry > Date.now();
}

export class DevOneLicense implements LicenseService {
  constructor(private readonly provider: LicenseProvider) {}

  async get(): Promise<LicenseEntitlement | null> {
    return this.provider.getEntitlement();
  }

  async isFeatureEnabled(feature: LicenseFeature): Promise<boolean> {
    const entitlement = await this.get();
    return hasActiveNetworkEntitlement(entitlement) && entitlement.features.includes(feature);
  }

  async canCreateSite(currentSiteCount: number): Promise<boolean> {
    const entitlement = await this.get();
    if (!hasActiveNetworkEntitlement(entitlement)) {
      return currentSiteCount < DEFAULT_SINGLE_SITE_LIMIT;
    }

    // A Network entitlement is intentionally unlimited within its bound Installation.
    if (entitlement.maxSites === null) return true;

    // Retain a defensive finite limit for future signed entitlement formats.
    return currentSiteCount < Math.max(1, entitlement.maxSites);
  }

  async requireFeature(feature: LicenseFeature): Promise<void> {
    if (!(await this.isFeatureEnabled(feature))) {
      throw new Error("This DevOne feature requires a valid license entitlement.");
    }
  }
}
