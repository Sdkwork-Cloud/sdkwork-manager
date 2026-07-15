import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isSdkworkSdkSessionAuthError } from "@sdkwork/auth-runtime-pc-react";
import {
  clearManagerIamSession,
  getManagerIamRuntime,
  loadOperatorSession,
  OPERATOR_SESSION_CHANGED_EVENT,
  resetManagerIamRuntime,
  resetOperatorTokenManager,
} from "@sdkwork/manager-pc-core";

export function RequireOperatorSession({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<"anonymous" | "checking" | "unavailable" | "verified">(() =>
    loadOperatorSession() ? "checking" : "anonymous",
  );

  useEffect(() => {
    const handleSessionChange = () => {
      setStatus(loadOperatorSession() ? "checking" : "anonymous");
    };
    window.addEventListener(OPERATOR_SESSION_CHANGED_EVENT, handleSessionChange);
    return () => {
      window.removeEventListener(OPERATOR_SESSION_CHANGED_EVENT, handleSessionChange);
    };
  }, []);

  useEffect(() => {
    if (status !== "checking") {
      return;
    }
    let active = true;
    void getManagerIamRuntime().service.auth.sessions.current.retrieve()
      .then(() => {
        if (active) {
          setStatus("verified");
        }
      })
      .catch((error) => {
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
    };
  }, [status]);

  if (status === "anonymous") {
    return <Navigate replace state={{ from: location }} to="/auth/login" />;
  }

  if (status === "checking") {
    return <main className="manager-session-check" role="status">Validating operator session</main>;
  }

  if (status === "unavailable") {
    return <main className="manager-session-check" role="alert">IAM session validation is unavailable</main>;
  }

  return children;
}
