import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { loadOperatorSession } from "@sdkwork/manager-pc-core";

export function RequireOperatorSession({ children }: { children: ReactNode }) {
  const location = useLocation();
  const session = loadOperatorSession();

  if (!session?.accessToken && !session?.authToken) {
    return <Navigate replace state={{ from: location }} to="/auth/login" />;
  }

  return children;
}
