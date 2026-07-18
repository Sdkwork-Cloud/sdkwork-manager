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
import {
  invalidateCurrentOperatorSessionVerification,
  isCurrentOperatorSessionVerified,
  resolveOperatorSessionVerificationKey,
  verifyCurrentOperatorSession,
} from "./currentOperatorSessionVerification";
import {
  logManagerSessionDiagnostic,
  resolveManagerSessionDiagnostics,
} from "./managerSessionDiagnostics";

let nextGuardInstanceId = 1;

type OperatorSessionStatus = "anonymous" | "checking" | "unavailable" | "verified";

function resolveInitialStatus(pauseValidation: boolean): OperatorSessionStatus {
  const sessionKey = resolveOperatorSessionVerificationKey(loadOperatorSession());
  if (!sessionKey) {
    return "anonymous";
  }
  return pauseValidation || isCurrentOperatorSessionVerified(sessionKey)
    ? "verified"
    : "checking";
}

export function RequireOperatorSession({ children }: { children: ReactNode }) {
  const { session } = useManagerShellMessages();
  const location = useLocation();
  const diagnostics = useMemo(
    () => resolveManagerSessionDiagnostics(location.search),
    [location.search],
  );
  const [guardInstanceId] = useState(() => nextGuardInstanceId++);
  const [status, setStatus] = useState<OperatorSessionStatus>(() =>
    resolveInitialStatus(diagnostics.pauseValidation),
  );
  const observedSessionKey = useRef(resolveOperatorSessionVerificationKey(loadOperatorSession()));

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
      const sessionKey = resolveOperatorSessionVerificationKey(loadOperatorSession());
      logManagerSessionDiagnostic(diagnostics, "session:local-write", {
        guardInstanceId,
        hasSession: Boolean(sessionKey),
      });
      if (!sessionKey) {
        observedSessionKey.current = null;
        invalidateCurrentOperatorSessionVerification();
        setStatus("anonymous");
      }
    };
    const handleSessionStorageChange = () => {
      const sessionKey = resolveOperatorSessionVerificationKey(loadOperatorSession());
      const sessionIdentityChanged = sessionKey !== observedSessionKey.current;
      observedSessionKey.current = sessionKey;
      logManagerSessionDiagnostic(diagnostics, "session:storage-change", {
        guardInstanceId,
        hasSession: Boolean(sessionKey),
        sessionIdentityChanged,
      });
      if (!sessionKey) {
        invalidateCurrentOperatorSessionVerification();
        setStatus("anonymous");
        return;
      }
      if (sessionIdentityChanged) {
        invalidateCurrentOperatorSessionVerification();
        setStatus(diagnostics.pauseValidation ? "verified" : "checking");
      }
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
    const operatorSession = loadOperatorSession();
    const sessionKey = resolveOperatorSessionVerificationKey(operatorSession);
    if (!sessionKey) {
      setStatus("anonymous");
      return;
    }
    const startedAt = performance.now();
    logManagerSessionDiagnostic(diagnostics, "request:start", {
      guardInstanceId,
      pathname: location.pathname,
    });
    void verifyCurrentOperatorSession(
      sessionKey,
      async () => {
        await getManagerIamRuntime().service.auth.sessions.current.retrieve();
      },
      () => resolveOperatorSessionVerificationKey(loadOperatorSession()),
    )
      .then(() => {
        observedSessionKey.current = resolveOperatorSessionVerificationKey(loadOperatorSession()) ?? sessionKey;
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
          invalidateCurrentOperatorSessionVerification();
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
