import assert from "node:assert/strict";
import test from "node:test";
import { DevOneLicense } from "../core/license/service";
import type { LicenseEntitlement, LicenseProvider } from "../core/license/types";

const entitlement = (overrides: Partial<LicenseEntitlement> = {}): LicenseEntitlement => ({
  licenseId: "test-installation-license",
  product: "devone-cms",
  edition: "network",
  maxSites: null,
  features: ["multisite", "network_admin"],
  issuedAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2099-01-01T00:00:00.000Z",
  signature: "test-only",
  ...overrides,
});

function service(value: LicenseEntitlement | null): DevOneLicense {
  const provider: LicenseProvider = {
    getEntitlement: async () => value,
    activate: async () => { throw new Error("Not implemented in this test."); },
    deactivate: async () => undefined,
  };
  return new DevOneLicense(provider);
}

test("active Network entitlement allows declared features and unlimited sites", async () => {
  const license = service(entitlement());
  assert.equal(await license.isFeatureEnabled("network_admin"), true);
  assert.equal(await license.isFeatureEnabled("network_domains"), false);
  assert.equal(await license.canCreateSite(10), true);
});

test("expired Network entitlement loses feature access and additional sites", async () => {
  const license = service(entitlement({ expiresAt: "2020-01-01T00:00:00.000Z" }));
  assert.equal(await license.isFeatureEnabled("network_admin"), false);
  assert.equal(await license.canCreateSite(0), true);
  assert.equal(await license.canCreateSite(1), false);
  await assert.rejects(() => license.requireFeature("network_admin"));
});

test("invalid expiry fails closed rather than granting Network access", async () => {
  const license = service(entitlement({ expiresAt: "not-a-date" }));
  assert.equal(await license.isFeatureEnabled("multisite"), false);
  assert.equal(await license.canCreateSite(2), false);
});

test("single-site entitlement cannot grant Network permissions through flags", async () => {
  const license = service(entitlement({ edition: "single" }));
  assert.equal(await license.isFeatureEnabled("network_admin"), false);
  assert.equal(await license.canCreateSite(0), true);
  assert.equal(await license.canCreateSite(1), false);
});

test("non-expiring active Network entitlements remain valid", async () => {
  const license = service(entitlement({ expiresAt: null }));
  assert.equal(await license.isFeatureEnabled("multisite"), true);
});
