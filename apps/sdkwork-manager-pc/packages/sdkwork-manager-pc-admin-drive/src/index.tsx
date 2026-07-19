import { lazy, Suspense, type ComponentType } from "react";
import type {
  AdminModuleContribution,
  AdminModuleRoute,
} from "@sdkwork/manager-pc-core";
import { LanguageProvider, type Language } from "sdkwork-drive-pc-commons";
import {
  getManagerDriveAdminStorageSdkClient,
  getManagerDriveBackendSdkClient,
  getManagerDriveSessionSnapshot,
} from "@sdkwork/manager-pc-admin-core";

type DriveMessages = {
  description: string;
  displayName: string;
  loading: string;
  navigationGroups: Record<"governance" | "infrastructure" | "operations", string>;
  routes: Record<string, { description: string; label: string }>;
  title: string;
};

const DRIVE_MESSAGES: Record<Language, DriveMessages> = {
  "zh-CN": {
    description: "管理存储提供商、配额、空间、标签、审计与维护任务。",
    displayName: "存储与云盘",
    loading: "正在加载云盘管理模块…",
    navigationGroups: {
      governance: "空间与治理",
      infrastructure: "存储基础设施",
      operations: "运维与审计",
    },
    title: "存储与云盘",
    routes: {
      storageProviders: { label: "存储提供商", description: "配置和验证对象存储提供商" },
      storageBindings: { label: "存储绑定", description: "管理默认及空间类型存储绑定" },
      quotas: { label: "配额管理", description: "查看使用量并配置租户配额" },
      spaces: { label: "空间管理", description: "分页查看租户云盘空间" },
      labels: { label: "标签管理", description: "管理云盘标签定义" },
      audit: { label: "审计日志", description: "查询云盘管理审计事件" },
      maintenance: { label: "维护任务", description: "查看并执行云盘清理任务" },
      downloads: { label: "下载任务", description: "查看异步下载包状态" },
    },
  },
  "en-US": {
    description: "Manage storage providers, quotas, spaces, labels, audit, and maintenance jobs.",
    displayName: "Drive & Storage",
    loading: "Loading Drive administration…",
    navigationGroups: {
      governance: "Spaces & governance",
      infrastructure: "Storage infrastructure",
      operations: "Operations & audit",
    },
    title: "Drive & Storage",
    routes: {
      storageProviders: { label: "Storage Providers", description: "Configure and test object storage providers" },
      storageBindings: { label: "Storage Bindings", description: "Manage default and space-type storage bindings" },
      quotas: { label: "Quotas", description: "Review usage and configure tenant quotas" },
      spaces: { label: "Spaces", description: "Browse tenant Drive spaces" },
      labels: { label: "Labels", description: "Manage Drive label definitions" },
      audit: { label: "Audit Log", description: "Query Drive administration audit events" },
      maintenance: { label: "Maintenance", description: "Review and run Drive cleanup jobs" },
      downloads: { label: "Download Jobs", description: "Review asynchronous download packages" },
    },
  },
};

const LazyStorageProvidersPage = lazy(async () => {
  const { StorageProvidersAdminPage } = await import("sdkwork-drive-pc-admin-storage-providers");
  return { default: StorageProvidersAdminPage };
});
const LazyStorageBindingsPage = lazy(async () => {
  const { StorageBindingsAdminPage } = await import("sdkwork-drive-pc-admin-storage-providers");
  return { default: StorageBindingsAdminPage };
});
const LazyAuditPage = lazy(async () => ({ default: (await import("sdkwork-drive-pc-admin-operations")).AuditAdminPage }));
const LazyMaintenancePage = lazy(async () => ({ default: (await import("sdkwork-drive-pc-admin-operations")).MaintenanceAdminPage }));
const LazyQuotaPage = lazy(async () => ({ default: (await import("sdkwork-drive-pc-admin-operations")).QuotaAdminPage }));
const LazyLabelsPage = lazy(async () => ({ default: (await import("sdkwork-drive-pc-admin-operations")).LabelsAdminPage }));
const LazySpacesPage = lazy(async () => ({ default: (await import("sdkwork-drive-pc-admin-operations")).SpacesAdminPage }));
const LazyDownloadsPage = lazy(async () => ({ default: (await import("sdkwork-drive-pc-admin-operations")).DownloadPackagesAdminPage }));

function createDriveRoute(
  Component: ComponentType<any>,
  locale: Language,
  loading: string,
  clientKind: "backend" | "storage",
) {
  return function ManagerDriveRoute() {
    const clientProps = clientKind === "storage"
      ? { adminStorageSdkClient: getManagerDriveAdminStorageSdkClient() }
      : { backendSdkClient: getManagerDriveBackendSdkClient() };
    return (
      <LanguageProvider defaultLanguage={locale} resolveHostLanguage={() => locale}>
        <Suspense fallback={<div className="manager-module-loading" role="status">{loading}</div>}>
          <Component {...clientProps} getSession={getManagerDriveSessionSnapshot} />
        </Suspense>
      </LanguageProvider>
    );
  };
}

export function createSdkworkManagerDriveAdminContribution(locale: string): AdminModuleContribution {
  const language: Language = locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
  const messages = DRIVE_MESSAGES[language];
  const route = (
    id: string,
    path: string,
    messageKey: keyof DriveMessages["routes"],
    permission: string,
    navigationGroup: keyof DriveMessages["navigationGroups"],
    Component: ComponentType<any>,
    clientKind: "backend" | "storage" = "backend",
  ): AdminModuleRoute => ({
    Component: createDriveRoute(Component, language, messages.loading, clientKind),
    contentLayout: "edge-to-edge",
    description: messages.routes[messageKey].description,
    id,
    label: messages.routes[messageKey].label,
    navigationGroups: [{ id: navigationGroup, label: messages.navigationGroups[navigationGroup] }],
    path,
    requiredPermissions: [permission],
  });

  return {
    access: {
      permissionMode: "any",
      requiredPermissions: [
        "drive.storage.admin",
        "drive.quota.admin",
        "drive.spaces.admin",
        "drive.labels.admin",
        "drive.audit.admin",
        "drive.maintenance.admin",
        "drive.download_packages.admin",
      ],
    },
    capability: "drive-admin",
    commercial: {
      entitlementKey: "sdkwork.drive.admin",
      releaseChannel: "stable",
      tier: "professional",
    },
    defaultPath: "/admin/drive/storage-providers",
    displayName: messages.displayName,
    domain: "drive",
    header: { description: messages.description, title: messages.title },
    id: "drive.administration",
    packageName: "@sdkwork/manager-pc-admin-drive",
    pathPrefix: "/admin/drive",
    routes: [
      route("drive.storage-providers", "/admin/drive/storage-providers", "storageProviders", "drive.storage.admin", "infrastructure", LazyStorageProvidersPage, "storage"),
      route("drive.storage-bindings", "/admin/drive/storage-bindings", "storageBindings", "drive.storage.admin", "infrastructure", LazyStorageBindingsPage, "storage"),
      route("drive.quotas", "/admin/drive/quotas", "quotas", "drive.quota.admin", "governance", LazyQuotaPage),
      route("drive.spaces", "/admin/drive/spaces", "spaces", "drive.spaces.admin", "governance", LazySpacesPage),
      route("drive.labels", "/admin/drive/labels", "labels", "drive.labels.admin", "governance", LazyLabelsPage),
      route("drive.audit", "/admin/drive/audit", "audit", "drive.audit.admin", "operations", LazyAuditPage),
      route("drive.maintenance", "/admin/drive/maintenance", "maintenance", "drive.maintenance.admin", "operations", LazyMaintenancePage),
      route("drive.downloads", "/admin/drive/download-packages", "downloads", "drive.download_packages.admin", "operations", LazyDownloadsPage),
    ],
    surface: "backend-admin",
  };
}
