import assert from "node:assert/strict";
import test from "node:test";

import { resolveManagerProfileEnv } from "./manager-profile-env.mjs";

const developmentProfiles = ["standalone.development", "cloud.development"];
const productionProfiles = ["standalone.production", "cloud.production"];

test("Manager development profiles seed Payment initialization data on startup", () => {
  for (const profileId of developmentProfiles) {
    const profile = resolveManagerProfileEnv({ SDKWORK_MANAGER_PROFILE_ID: profileId });

    assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_ON_BOOT, "true", profileId);
    assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_PROFILE, "development", profileId);
    assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_LOCALE, "zh-CN", profileId);
  }
});

test("Manager production profiles require an explicit Payment seed opt-in", () => {
  for (const profileId of productionProfiles) {
    const profile = resolveManagerProfileEnv({ SDKWORK_MANAGER_PROFILE_ID: profileId });

    assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_ON_BOOT, "false", profileId);
    assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_PROFILE, "production", profileId);
    assert.equal(profile.SDKWORK_PAYMENT_DATABASE_SEED_LOCALE, "zh-CN", profileId);
  }
});
