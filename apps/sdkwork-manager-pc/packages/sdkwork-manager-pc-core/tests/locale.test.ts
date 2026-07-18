import { beforeEach, describe, expect, it } from "vitest";

import {
  getManagerLocale,
  normalizeManagerLocale,
  resolveManagerLocale,
  setManagerLocale,
} from "../src/i18n/locale";

describe("manager locale runtime", () => {
  beforeEach(() => {
    setManagerLocale("zh-CN");
  });

  it("normalizes supported BCP 47 language variants", () => {
    expect(normalizeManagerLocale("zh-Hans-CN")).toBe("zh-CN");
    expect(normalizeManagerLocale("en_GB")).toBe("en-US");
    expect(normalizeManagerLocale("ja-JP")).toBeUndefined();
  });

  it("uses the first supported candidate and an explicit fallback", () => {
    expect(resolveManagerLocale(["ja-JP", "en-CA"], "zh-CN")).toBe("en-US");
    expect(resolveManagerLocale(["ja-JP"], "en-US")).toBe("en-US");
  });

  it("exposes the active locale to SDK runtime providers", () => {
    expect(setManagerLocale("en-US")).toBe("en-US");
    expect(getManagerLocale()).toBe("en-US");
  });
});
