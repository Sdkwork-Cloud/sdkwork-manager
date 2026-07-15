import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { loadOperatorSession } from "@sdkwork/manager-pc-core";

function resolveSafeReturnPath(candidate: string | null): string {
  return candidate?.startsWith("/") && !candidate.startsWith("//") ? candidate : "/";
}

export function ManagerAuthenticatedAuthRouteGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!loadOperatorSession()) {
    return children;
  }
  return <Navigate replace to={resolveSafeReturnPath(new URLSearchParams(location.search).get("redirect"))} />;
}
