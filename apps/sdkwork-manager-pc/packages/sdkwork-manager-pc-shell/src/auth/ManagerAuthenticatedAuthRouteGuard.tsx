import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { loadOperatorSession } from "@sdkwork/manager-pc-core";

function resolveSafeReturnPath(candidate: string | null): string {
  if (!candidate) {
    return "/";
  }
  let decoded = candidate;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return "/";
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return "/";
  }
  const target = new URL(decoded, "http://sdkwork-manager.local");
  // A redirect back into the auth surface (possibly nested/encoded) must be
  // rejected so the login page does not bounce through itself.
  if (target.pathname === "/auth" || target.pathname.startsWith("/auth/")) {
    return "/";
  }
  return `${target.pathname}${target.search}${target.hash}`;
}

export function ManagerAuthenticatedAuthRouteGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!loadOperatorSession()) {
    return children;
  }
  return <Navigate replace to={resolveSafeReturnPath(new URLSearchParams(location.search).get("redirect"))} />;
}
