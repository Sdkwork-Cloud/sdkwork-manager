import { useEffect, useState } from "react";
import {
  getManagerPermissionScope,
  OPERATOR_SESSION_CHANGED_EVENT,
  OPERATOR_SESSION_STORAGE_CHANGED_EVENT,
} from "@sdkwork/manager-pc-core";

export function useManagerPermissionScope(): readonly string[] {
  const [permissionScope, setPermissionScope] = useState<readonly string[]>(
    () => getManagerPermissionScope(),
  );

  useEffect(() => {
    const syncPermissionScope = () => setPermissionScope(getManagerPermissionScope());
    window.addEventListener(OPERATOR_SESSION_CHANGED_EVENT, syncPermissionScope);
    window.addEventListener(OPERATOR_SESSION_STORAGE_CHANGED_EVENT, syncPermissionScope);
    syncPermissionScope();
    return () => {
      window.removeEventListener(OPERATOR_SESSION_CHANGED_EVENT, syncPermissionScope);
      window.removeEventListener(OPERATOR_SESSION_STORAGE_CHANGED_EVENT, syncPermissionScope);
    };
  }, []);

  return permissionScope;
}
