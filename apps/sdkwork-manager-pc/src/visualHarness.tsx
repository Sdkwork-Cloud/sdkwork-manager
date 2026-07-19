import React from "react";
import { createRoot } from "react-dom/client";
import {
  LanguageProvider,
  type Language,
} from "../packages/sdkwork-manager-pc-admin-drive/node_modules/sdkwork-drive-pc-commons";
import {
  AuditAdminPage,
  DownloadPackagesAdminPage,
  LabelsAdminPage,
  MaintenanceAdminPage,
  QuotaAdminPage,
  SpacesAdminPage,
} from "../packages/sdkwork-manager-pc-admin-drive/node_modules/sdkwork-drive-pc-admin-operations";
import {
  StorageBindingsAdminPage,
  StorageProvidersAdminPage,
} from "../packages/sdkwork-manager-pc-admin-drive/node_modules/sdkwork-drive-pc-admin-storage-providers";
import "./index.css";

const now = Date.now();

const session = {
  context: {
    actorId: "operator-100086",
    tenantId: "tenant-enterprise-east-china-100001",
    userId: "user-100086",
  },
  user: { id: "user-100086" },
};

const providers = [
  {
    id: "oss-production-cn-hangzhou-primary-01",
    providerKind: "aliyun_oss",
    name: "生产环境阿里云 OSS",
    endpointUrl: "https://sdkwork-drive-production.oss-cn-hangzhou.aliyuncs.com",
    region: "cn-hangzhou",
    bucket: "sdkwork-drive-production-assets",
    pathStyle: false,
    credentialConfigured: true,
    serverSideEncryptionMode: "AES256",
    defaultStorageClass: "STANDARD",
    status: "active",
    version: 12,
    strictTls: true,
  },
  {
    id: "s3-archive-ap-southeast-1-secondary",
    providerKind: "s3_compatible",
    name: "跨区域归档 S3",
    endpointUrl: "https://s3.ap-southeast-1.amazonaws.com/sdkwork-enterprise-archive",
    region: "ap-southeast-1",
    bucket: "sdkwork-enterprise-archive-2026",
    pathStyle: false,
    credentialConfigured: true,
    status: "active",
    version: 8,
    strictTls: true,
  },
  {
    id: "minio-standalone-disaster-recovery-node",
    providerKind: "s3_compatible",
    name: "灾备 MinIO 节点",
    endpointUrl: "https://minio-disaster-recovery.internal.sdkwork.example.com:9443",
    region: "standalone-dr-1",
    bucket: "drive-disaster-recovery",
    pathStyle: true,
    credentialConfigured: false,
    status: "inactive",
    version: 3,
    strictTls: true,
  },
];

const binding = (spaceType: string, providerId: string, prefix: string) => ({
  id: `binding-${spaceType}-100001`,
  tenantId: session.context.tenantId,
  providerId,
  bindingScope: "space_type",
  purpose: spaceType,
  lifecycleStatus: "active",
  version: 4,
  storageRootPrefix: prefix,
});

const offsetPage = <T,>(items: T[]) => ({
  items,
  pageInfo: {
    mode: "offset",
    page: 1,
    pageSize: 20,
    totalItems: String(items.length + 23),
    totalPages: 3,
    hasMore: true,
  },
});

const backendSdkClient = {
  operations: {},
  async request({ operationId }: { operationId: string }) {
    switch (operationId) {
      case "auditEvents.list":
        return offsetPage([
          { id: 90381, tenantId: session.context.tenantId, action: "drive.storage.provider.credentials.rotate", resourceType: "storage_provider", resourceId: "oss-production-cn-hangzhou-primary-01", operatorId: "operator-platform-security-100086", correlationId: "req-01JZTBH8TB8SZZ7JMY4D4K57FQ", traceId: "4bf92f3577b34da6a3ce929d0e0e4736", createdAt: "2026-07-20T01:18:24.000Z" },
          { id: 90380, tenantId: session.context.tenantId, action: "drive.quota.policy.update", resourceType: "tenant_quota_policy", resourceId: session.context.tenantId, operatorId: "operator-storage-admin-100032", correlationId: "req-01JZTB82D1W05QBZRXMH5Q3J0V", traceId: "0af7651916cd43dd8448eb211c80319c", createdAt: "2026-07-20T00:51:03.000Z" },
          { id: 90379, tenantId: session.context.tenantId, action: "drive.space.lifecycle.archive", resourceType: "drive_space", resourceId: "space-knowledge-base-customer-success-2025", operatorId: "operator-compliance-100071", correlationId: "req-01JZTAZB3Q2RR1NHFG0C70VNH8", traceId: "6b1a8f47b1ce4a928a3df4c5614520bc", createdAt: "2026-07-19T23:42:17.000Z" },
        ]);
      case "maintenance.jobs.list":
        return offsetPage([
          { id: 71024, jobType: "object_sweep", status: "completed", dryRun: true, scannedCount: 128409, affectedCount: 276, operatorId: "operator-storage-admin-100032", startedAt: "2026-07-20T01:05:00.000Z", finishedAt: "2026-07-20T01:06:42.000Z", createdAt: "2026-07-20T01:05:00.000Z" },
          { id: 71023, jobType: "upload_session_sweep", status: "completed", dryRun: false, scannedCount: 8401, affectedCount: 93, operatorId: "operator-platform-sre-100018", startedAt: "2026-07-19T18:00:00.000Z", finishedAt: "2026-07-19T18:00:18.000Z", createdAt: "2026-07-19T18:00:00.000Z" },
          { id: 71022, jobType: "expired_upload_content_sweep", status: "failed", dryRun: false, scannedCount: 2844, affectedCount: 0, operatorId: "operator-platform-sre-100018", startedAt: "2026-07-19T12:00:00.000Z", finishedAt: "2026-07-19T12:00:09.000Z", createdAt: "2026-07-19T12:00:00.000Z" },
        ]);
      case "quotas.retrieve":
      case "quotas.update":
        return { tenantId: session.context.tenantId, totalBytes: 8796093022208, objectCount: 12840936, quotaBytes: 10995116277760 };
      case "labels.list":
        return {
          items: [
            { id: "label-confidential-legal-review", tenantId: session.context.tenantId, labelKey: "confidential_legal_review", displayName: "机密 · 法务审核", color: "#DC2626", description: "包含法律、合同或诉讼相关敏感资料，仅授权成员可访问。", lifecycleStatus: "active", version: 7 },
            { id: "label-customer-deliverable", tenantId: session.context.tenantId, labelKey: "customer_deliverable", displayName: "客户交付物", color: "#2563EB", description: "已确认可面向客户交付的文件与发布包。", lifecycleStatus: "active", version: 3 },
            { id: "label-retention-seven-years", tenantId: session.context.tenantId, labelKey: "retention_seven_years", displayName: "保留七年", color: "#7C3AED", description: "受财务或合规政策约束的长期留存内容。", lifecycleStatus: "active", version: 11 },
          ],
          pageInfo: { mode: "cursor", pageSize: 20, hasMore: true, nextCursor: "labels-next-page-token" },
          nextPageToken: "labels-next-page-token",
        };
      case "spaces.admin.list":
        return offsetPage([
          { id: "space-team-product-platform-cn-east", tenantId: session.context.tenantId, ownerSubjectType: "organization", ownerSubjectId: "organization-platform-engineering-100021", displayName: "平台研发团队共享空间", spaceType: "team", lifecycleStatus: "active", version: 18 },
          { id: "space-knowledge-base-customer-success-global", tenantId: session.context.tenantId, ownerSubjectType: "team", ownerSubjectId: "team-customer-success-global-100811", displayName: "全球客户成功知识库", spaceType: "knowledge_base", lifecycleStatus: "active", version: 26 },
          { id: "space-app-upload-commerce-product-assets", tenantId: session.context.tenantId, ownerSubjectType: "tenant", ownerSubjectId: session.context.tenantId, displayName: "商品中心媒体资源", spaceType: "app_upload", lifecycleStatus: "active", version: 41 },
          { id: "space-personal-user-100086", tenantId: session.context.tenantId, ownerSubjectType: "user", ownerSubjectId: "user-100086", displayName: "林晓的个人空间", spaceType: "personal", lifecycleStatus: "archived", version: 9 },
        ]);
      case "downloadPackages.list":
        return offsetPage([
          { id: "download-package-01JZTBM4M9MWKQ6ZBPSR5MTV2A", tenantId: session.context.tenantId, packageName: "2026-Q2-客户交付文档与验收材料.zip", state: "ready", storageProviderId: "oss-production-cn-hangzhou-primary-01", bucket: "sdkwork-drive-production-assets", archiveObjectKey: "tenants/100001/download-packages/2026/07/20/01JZTBM4M9MWKQ6ZBPSR5MTV2A.zip", contentType: "application/zip", fileCount: 284, totalBytes: 6818260582, archiveSizeBytes: 5225364301, expiresAtEpochMs: now + 5 * 24 * 60 * 60 * 1000, createdBy: "user-100086", updatedBy: "worker-download-03", createdAt: "2026-07-20T01:06:15.000Z", updatedAt: "2026-07-20T01:08:49.000Z" },
          { id: "download-package-01JZT7M1P3VKSME0FXT3H70WBR", tenantId: session.context.tenantId, packageName: "品牌中心原始设计文件.zip", state: "creating", storageProviderId: "s3-archive-ap-southeast-1-secondary", bucket: "sdkwork-enterprise-archive-2026", archiveObjectKey: "exports/brand/01JZT7M1P3VKSME0FXT3H70WBR.zip", contentType: "application/zip", fileCount: 1432, totalBytes: 44291850240, archiveSizeBytes: 0, expiresAtEpochMs: now + 7 * 24 * 60 * 60 * 1000, createdBy: "user-100112", updatedBy: "worker-download-07", createdAt: "2026-07-20T00:33:41.000Z", updatedAt: "2026-07-20T00:35:17.000Z" },
          { id: "download-package-01JZSZZ9X0DSC0F4R5E3Q2A1BC", tenantId: session.context.tenantId, packageName: "历史归档批量导出.zip", state: "failed", storageProviderId: "minio-standalone-disaster-recovery-node", bucket: "drive-disaster-recovery", archiveObjectKey: "exports/history/01JZSZZ9X0DSC0F4R5E3Q2A1BC.zip", contentType: "application/zip", fileCount: 911, totalBytes: 18496880640, archiveSizeBytes: 0, expiresAtEpochMs: now + 24 * 60 * 60 * 1000, errorMessage: "Provider connection timed out after 30 seconds while reading multipart object metadata.", createdBy: "user-100163", updatedBy: "worker-download-02", createdAt: "2026-07-19T23:05:10.000Z", updatedAt: "2026-07-19T23:05:42.000Z" },
        ]);
      case "labels.create":
      case "labels.update":
        return { id: "label-new", tenantId: session.context.tenantId, labelKey: "new_label", displayName: "新标签", color: "#2563EB", lifecycleStatus: "active", version: 1 };
      case "labels.delete":
        return undefined;
      default:
        if (operationId.startsWith("maintenance.")) {
          return { scannedCount: 12084, affectedCount: 137, dryRun: true };
        }
        throw new Error(`Unhandled backend operation: ${operationId}`);
    }
  },
};

const adminStorageSdkClient = {
  async request({ operationId }: { operationId: string }) {
    switch (operationId) {
      case "storageProviders.list":
        return { items: providers, pageInfo: { mode: "cursor", hasMore: true, nextCursor: "provider-next-token" } };
      case "storageProviderBindings.list":
        return {
          items: [
            binding("personal", providers[0].id, "tenants/100001/spaces/personal"),
            binding("team", providers[0].id, "tenants/100001/spaces/team"),
            binding("knowledge_base", providers[1].id, "knowledge-bases/production"),
            binding("app_upload", providers[0].id, "applications/uploads"),
            binding("im", providers[1].id, "communication/im"),
          ],
        };
      case "storageProviderBindings.default.retrieve":
        return { ...binding("tenant_default", providers[0].id, "tenants/100001/default"), bindingScope: "tenant_default" };
      case "storageProviders.test":
        return { reachable: true };
      default:
        return { changed: true, deleted: true };
    }
  },
};

const pages = {
  audit: AuditAdminPage,
  bindings: StorageBindingsAdminPage,
  downloads: DownloadPackagesAdminPage,
  labels: LabelsAdminPage,
  maintenance: MaintenanceAdminPage,
  providers: StorageProvidersAdminPage,
  quota: QuotaAdminPage,
  spaces: SpacesAdminPage,
};

const search = new URLSearchParams(window.location.search);
const pageKey = search.get("page") ?? "providers";
const language: Language = search.get("lang") === "en" ? "en-US" : "zh-CN";
const dark = search.get("dark") === "1";
const Page = pages[pageKey as keyof typeof pages] ?? StorageProvidersAdminPage;
const storagePage = pageKey === "providers" || pageKey === "bindings";

document.documentElement.classList.toggle("dark", dark);
document.documentElement.dataset.sdkColorMode = dark ? "dark" : "light";
document.documentElement.lang = language;

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LanguageProvider defaultLanguage={language} resolveHostLanguage={() => language}>
      <div className="h-screen min-h-0 overflow-hidden">
        {storagePage ? (
          <Page adminStorageSdkClient={adminStorageSdkClient as never} getSession={() => session as never} />
        ) : (
          <Page backendSdkClient={backendSdkClient as never} getSession={() => session as never} />
        )}
      </div>
    </LanguageProvider>
  </React.StrictMode>,
);
