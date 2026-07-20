import assert from "node:assert/strict";
import test from "node:test";

import { resolveManagerProfileEnv } from "./manager-profile-env.mjs";

test("Manager standalone development seeds Payment initialization data on startup", () => {
  const profile = resolveManagerProfileEnv({
    SDKWORK_MANAGER_PROFILE_ID: "standalone.development",
  });

  assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_ON_BOOT, "true");
  assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_PROFILE, "development");
  assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_LOCALE, "zh-CN");
});

test("Manager standalone production requires an explicit Payment seed opt-in", () => {
  const profile = resolveManagerProfileEnv({
    SDKWORK_MANAGER_PROFILE_ID: "standalone.production",
  });

  assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_ON_BOOT, "false");
  assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_PROFILE, "production");
  assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_LOCALE, "zh-CN");
});

test("Manager cloud profiles do not configure local Payment database seeding", () => {
  for (const profileId of ["cloud.development", "cloud.production"]) {
    const profile = resolveManagerProfileEnv({ SDKWORK_MANAGER_PROFILE_ID: profileId });

    assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_ON_BOOT, undefined, profileId);
    assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_PROFILE, undefined, profileId);
    assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_LOCALE, undefined, profileId);
  }
});
