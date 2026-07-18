import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isSdkworkSdkSessionAuthError } from "@sdkwork/auth-runtime-pc-react";
import {
  clearManagerIamSession,
  getManagerIamRuntime,
  loadOperatorSession,
  OPERATOR_SESSION_CHANGED_EVENT,
  OPERATOR_SESSION_STORAGE_CHANGED_EVENT,
  resetManagerIamRuntime,
  resetOperatorTokenManager,
} from "@sdkwork/manager-pc-core";

import { useManagerShellMessages } from "../i18n";
import { verifyCurrentOperatorSession } from "./currentOperatorSessionVerification";
import {
  logManagerSessionDiagnostic,
  resolveManagerSessionDiagnostics,
} from "./managerSessionDiagnostics";

let nextGuardInstanceId = 1;

export function RequireOperatorSession({ children }: { children: ReactNode }) {
  const { session } = useManagerShellMessages();
  const location = useLocation();
  const diagnostics = useMemo(
    () => resolveManagerSessionDiagnostics(location.search),
    [location.search],
  );
  const guardInstanceId = useRef(nextGuardInstanceId++).current;
  const [status, setStatus] = useState<"anonymous" | "checking" | "unavailable" | "verified">(() =>
    loadOperatorSession()
      ? diagnostics.pauseValidation ? "verified" : "checking"
      : "anonymous",
  );

  useEffect(() => {
    logManagerSessionDiagnostic(diagnostics, "guard:mount", {
      guardInstanceId,
      pathname: location.pathname,
      validationPaused: diagnostics.pauseValidation,
    });
    return () => {
      logManagerSessionDiagnostic(diagnostics, "guard:unmount", {
        guardInstanceId,
        pathname: location.pathname,
      });
    };
  }, [diagnostics, guardInstanceId, location.pathname]);

  useEffect(() => {
    logManagerSessionDiagnostic(diagnostics, "guard:state", {
      guardInstanceId,
      status,
    });
  }, [diagnostics, guardInstanceId, status]);

  useEffect(() => {
    const handleLocalSessionChange = () => {
      logManagerSessionDiagnostic(diagnostics, "session:local-write", {
        guardInstanceId,
        hasSession: Boolean(loadOperatorSession()),
      });
    };
    const handleSessionStorageChange = () => {
      const hasSession = Boolean(loadOperatorSession());
      logManagerSessionDiagnostic(diagnostics, "session:storage-change", {
        guardInstanceId,
        hasSession,
      });
      setStatus(hasSession
        ? diagnostics.pauseValidation ? "verified" : "checking"
        : "anonymous");
    };
    window.addEventListener(OPERATOR_SESSION_CHANGED_EVENT, handleLocalSessionChange);
    window.addEventListener(OPERATOR_SESSION_STORAGE_CHANGED_EVENT, handleSessionStorageChange);
    return () => {
      window.removeEventListener(OPERATOR_SESSION_CHANGED_EVENT, handleLocalSessionChange);
      window.removeEventListener(OPERATOR_SESSION_STORAGE_CHANGED_EVENT, handleSessionStorageChange);
    };
  }, [diagnostics, guardInstanceId]);

  useEffect(() => {
    if (status !== "checking" || diagnostics.pauseValidation) {
      return;
    }
    let active = true;
    const startedAt = performance.now();
    logManagerSessionDiagnostic(diagnostics, "request:start", {
      guardInstanceId,
      pathname: location.pathname,
    });
    void verifyCurrentOperatorSession(
      () => getManagerIamRuntime().service.auth.sessions.current.retrieve(),
    )
      .then(() => {
        logManagerSessionDiagnostic(diagnostics, "request:success", {
          active,
          durationMs: Math.round(performance.now() - startedAt),
          guardInstanceId,
          hasSession: Boolean(loadOperatorSession()),
        });
        if (active) {
          setStatus("verified");
        }
      })
      .catch((error) => {
        logManagerSessionDiagnostic(diagnostics, "request:error", {
          active,
          durationMs: Math.round(performance.now() - startedAt),
          guardInstanceId,
          sessionAuthError: isSdkworkSdkSessionAuthError(error),
        });
        if (isSdkworkSdkSessionAuthError(error)) {
          clearManagerIamSession();
          resetOperatorTokenManager();
          resetManagerIamRuntime();
          if (active) {
            setStatus("anonymous");
          }
          return;
        }
        if (active) {
          setStatus("unavailable");
        }
      });
    return () => {
      active = false;
      logManagerSessionDiagnostic(diagnostics, "request:effect-cleanup", {
        guardInstanceId,
      });
    };
  }, [diagnostics, guardInstanceId, location.pathname, status]);

  if (status === "anonymous") {
    return <Navigate replace state={{ from: location }} to="/auth/login" />;
  }

  if (status === "checking") {
    return <main className="manager-session-check" role="status">{session.validating}</main>;
  }

  if (status === "unavailable") {
    return <main className="manager-session-check" role="alert">{session.unavailable}</main>;
  }

  return children;
}
