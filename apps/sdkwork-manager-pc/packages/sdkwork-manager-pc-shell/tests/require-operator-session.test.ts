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
  OPERATOR_SESSION_CHANGED_EVENT: "sdkwork-manager-pc:session-changed",
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
import { invalidateCurrentOperatorSessionVerification } from "../src/auth/currentOperatorSessionVerification";

describe("RequireOperatorSession", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    mocks.retrieveCurrentSession.mockReset();
    invalidateCurrentOperatorSessionVerification();
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

  it("does not revalidate after a same-token cross-tab session context change", async () => {
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

    expect(mocks.retrieveCurrentSession).toHaveBeenCalledOnce();
    expect(container.textContent).toBe("Manager homepage");

    await act(async () => {
      root.unmount();
    });
  });

  it("uses the IAM runtime current-session wrapper without a second Manager session write", async () => {
    mocks.retrieveCurrentSession.mockResolvedValue({});
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(
        MemoryRouter,
        { initialEntries: ["/admin/trade/orders"] },
        createElement(
          RequireOperatorSession,
          null,
          createElement("p", null, "Orders page"),
        ),
      ));
    });

    expect(mocks.retrieveCurrentSession).toHaveBeenCalledOnce();
    expect(container.textContent).toBe("Orders page");

    await act(async () => {
      root.unmount();
    });
  });
  it("can pause current-session validation for development diagnosis", async () => {
    mocks.retrieveCurrentSession.mockResolvedValue({});
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(
        MemoryRouter,
        { initialEntries: ["/?managerSessionCheck=paused"] },
        createElement(
          RequireOperatorSession,
          null,
          createElement("p", null, "Manager homepage"),
        ),
      ));
    });

    expect(mocks.retrieveCurrentSession).not.toHaveBeenCalled();
    expect(container.textContent).toBe("Manager homepage");

    await act(async () => {
      root.unmount();
    });
  });

  it("does not retrieve the session again when the global route guard remounts", async () => {
    mocks.retrieveCurrentSession.mockResolvedValue({});
    const firstRoot = createRoot(container);

    await act(async () => {
      firstRoot.render(createElement(
        MemoryRouter,
        { initialEntries: ["/admin/iam/users"] },
        createElement(
          RequireOperatorSession,
          null,
          createElement("p", null, "Users page"),
        ),
      ));
    });
    await act(async () => {
      firstRoot.unmount();
    });

    const replacementContainer = document.createElement("div");
    document.body.append(replacementContainer);
    const secondRoot = createRoot(replacementContainer);
    await act(async () => {
      secondRoot.render(createElement(
        MemoryRouter,
        { initialEntries: ["/admin/drive/spaces"] },
        createElement(
          RequireOperatorSession,
          null,
          createElement("p", null, "Drive page"),
        ),
      ));
    });

    expect(mocks.retrieveCurrentSession).toHaveBeenCalledTimes(1);
    expect(replacementContainer.textContent).toBe("Drive page");

    await act(async () => {
      secondRoot.unmount();
    });
    replacementContainer.remove();
  });
  it("does not revalidate when another tab broadcasts only an IAM context update", async () => {
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

    expect(mocks.retrieveCurrentSession).toHaveBeenCalledOnce();
    expect(container.textContent).toBe("Manager homepage");

    await act(async () => {
      root.unmount();
    });
  });
});
