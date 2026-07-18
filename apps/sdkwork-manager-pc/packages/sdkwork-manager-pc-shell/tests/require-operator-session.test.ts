import { act, createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  retrieveCurrentSession: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("@sdkwork/auth-runtime-pc-react", () => ({
  isSdkworkSdkSessionAuthError: () => false,
}));

vi.mock("@sdkwork/manager-pc-core", () => ({
  clearManagerIamSession: vi.fn(),
  getManagerIamRuntime: () => ({
    service: {
      auth: {
        sessions: {
          current: {
            retrieve: mocks.retrieveCurrentSession,
          },
        },
      },
    },
  }),
  loadOperatorSession: () => ({
    accessToken: "access-token",
    authToken: "auth-token",
  }),
  OPERATOR_SESSION_STORAGE_CHANGED_EVENT: "sdkwork-manager-pc:session-storage-changed",
  resetManagerIamRuntime: vi.fn(),
  resetOperatorTokenManager: vi.fn(),
}));

vi.mock("../src/i18n", () => ({
  useManagerShellMessages: () => ({
    session: {
      unavailable: "Session unavailable",
      validating: "Validating session",
    },
  }),
}));

import { RequireOperatorSession } from "../src/auth/RequireOperatorSession";

describe("RequireOperatorSession", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    mocks.retrieveCurrentSession.mockReset();
  });

  afterEach(() => {
    container.remove();
  });

  it("stays verified when a successful current-session response writes the session", async () => {
    mocks.retrieveCurrentSession.mockImplementation(async () => {
      window.dispatchEvent(new Event("sdkwork-manager-pc:session-changed"));
      return {};
    });
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(
        StrictMode,
        null,
        createElement(
          MemoryRouter,
          { initialEntries: ["/"] },
          createElement(
            RequireOperatorSession,
            null,
            createElement("p", null, "Manager homepage"),
          ),
        ),
      ));
    });

    expect(mocks.retrieveCurrentSession).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe("Manager homepage");

    await act(async () => {
      root.unmount();
    });
  });

  it("revalidates after a cross-tab session storage change", async () => {
    mocks.retrieveCurrentSession.mockResolvedValue({});
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(
        MemoryRouter,
        { initialEntries: ["/"] },
        createElement(
          RequireOperatorSession,
          null,
          createElement("p", null, "Manager homepage"),
        ),
      ));
    });
    await act(async () => {
      window.dispatchEvent(new Event("sdkwork-manager-pc:session-storage-changed"));
    });

    expect(mocks.retrieveCurrentSession).toHaveBeenCalledTimes(2);
    expect(container.textContent).toBe("Manager homepage");

    await act(async () => {
      root.unmount();
    });
  });
});
