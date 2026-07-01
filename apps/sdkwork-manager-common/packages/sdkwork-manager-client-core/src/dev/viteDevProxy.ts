import {
  DEFAULT_LOCAL_APPLICATION_PUBLIC_HTTP_URL,
  DEFAULT_LOCAL_PLATFORM_API_GATEWAY_HTTP_URL,
  MANAGER_APP_API_SEGMENT,
  SDKWORK_APP_API_PREFIX,
  SDKWORK_BACKEND_API_PREFIX,
  VITE_SDKWORK_MANAGER_APPLICATION_PUBLIC_HTTP_URL,
  VITE_SDKWORK_MANAGER_PLATFORM_API_GATEWAY_HTTP_URL,
} from "../config/topologyEnvKeys";

function readEnvString(
  env: Record<string, string | undefined>,
  key: string,
  fallback: string,
): string {
  const value = env[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export function buildManagerViteDevProxy(
  env: Record<string, string | undefined> = {},
): Record<string, { changeOrigin: true; target: string }> {
  const applicationOrigin = readEnvString(
    env,
    VITE_SDKWORK_MANAGER_APPLICATION_PUBLIC_HTTP_URL,
    DEFAULT_LOCAL_APPLICATION_PUBLIC_HTTP_URL,
  );
  const platformOrigin = readEnvString(
    env,
    VITE_SDKWORK_MANAGER_PLATFORM_API_GATEWAY_HTTP_URL,
    DEFAULT_LOCAL_PLATFORM_API_GATEWAY_HTTP_URL,
  );

  const managerBackendPrefix = `${SDKWORK_BACKEND_API_PREFIX}/${MANAGER_APP_API_SEGMENT}`;
  const managerAppPrefix = `${SDKWORK_APP_API_PREFIX}/${MANAGER_APP_API_SEGMENT}`;

  return {
    [managerBackendPrefix]: {
      changeOrigin: true,
      target: applicationOrigin,
    },
    [managerAppPrefix]: {
      changeOrigin: true,
      target: applicationOrigin,
    },
    [SDKWORK_BACKEND_API_PREFIX]: {
      changeOrigin: true,
      target: platformOrigin,
    },
    [SDKWORK_APP_API_PREFIX]: {
      changeOrigin: true,
      target: platformOrigin,
    },
  };
}
