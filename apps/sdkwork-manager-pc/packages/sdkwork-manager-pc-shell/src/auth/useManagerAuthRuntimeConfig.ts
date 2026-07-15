import { useCallback, useEffect, useState } from "react";
import type { SdkworkAuthRuntimeConfig } from "@sdkwork/auth-pc-react";
import {
  loadManagerAuthRuntimeConfig,
  resetManagerAuthRuntimeConfig,
  resolveManagerAuthRuntimeConfig,
} from "@sdkwork/manager-pc-core";

export type ManagerAuthRuntimeConfigLoadState = "loading" | "ready" | "unavailable";

export interface ManagerAuthRuntimeConfigState {
  retry: () => void;
  runtimeConfig: SdkworkAuthRuntimeConfig;
  status: ManagerAuthRuntimeConfigLoadState;
}

export function useManagerAuthRuntimeConfig(): ManagerAuthRuntimeConfigState {
  const [runtimeConfig, setRuntimeConfig] = useState<SdkworkAuthRuntimeConfig>(
    resolveManagerAuthRuntimeConfig,
  );
  const [status, setStatus] = useState<ManagerAuthRuntimeConfigLoadState>("loading");
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    resetManagerAuthRuntimeConfig();
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setRuntimeConfig(resolveManagerAuthRuntimeConfig());
    void loadManagerAuthRuntimeConfig()
      .then((config) => {
        if (active) {
          setRuntimeConfig(config);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) {
          setRuntimeConfig(resolveManagerAuthRuntimeConfig());
          setStatus("unavailable");
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  return { retry, runtimeConfig, status };
}
