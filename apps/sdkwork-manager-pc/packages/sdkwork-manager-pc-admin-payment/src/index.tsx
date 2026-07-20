import { lazy, Suspense, useMemo, type ComponentType } from "react";
import { hasManagerPermission, type AdminModuleContribution } from "@sdkwork/manager-pc-core";
import {
  resolveManagerEnvironment,
  type ManagerEnvironment,
} from "@sdkwork/manager-client-core";
import { getManagerPaymentBackendService } from "@sdkwork/manager-pc-admin-core";
export { PAYMENT_ADMIN_I18N_CATALOG } from "@sdkwork/payment-pc-admin-core";

type PaymentMessages = {
  description: string;
  displayName: string;
  loading: string;
  navigationGroups: Record<
    "configuration" | "developerTools" | "institutions" | "operations",
    string
  >;
  routes: Record<PaymentRouteKey, PaymentRouteMessage>;
  title: string;
};

type PaymentRouteKey =
  | "attempts"
  | "channels"
  | "integration"
  | "methods"
  | "providerAccounts"
  | "reconciliation"
  | "records"
  | "routeRules"
  | "subMerchants"
  | "webhooks";

type PaymentRouteMessage = {
  description: string;
  label: string;
};

type PaymentIntegrationSection = "environment" | "webhook" | "certificates" | "logs";

const PAYMENT_INTEGRATION_MESSAGES: Record<
  "en-US" | "zh-CN",
  Record<PaymentIntegrationSection, PaymentRouteMessage>
> = {
  "zh-CN": {
    environment: {
      label: "环境与凭据测试",
      description: "管理支付机构运行环境，执行凭据与连通性验证",
    },
    webhook: {
      label: "Webhook 调试器",
      description: "触发沙箱事件并验证回调签名与原始载荷",
    },
    certificates: {
      label: "证书管理",
      description: "管理支付证书、有效期、指纹和轮换状态",
    },
    logs: {
      label: "集成日志",
      description: "查询联调事件、处理结果并重放失败回调",
    },
  },
  "en-US": {
    environment: {
      label: "Environment & credential tests",
      description: "Manage provider environments and validate credentials and connectivity",
    },
    webhook: {
      label: "Webhook debugger",
      description: "Trigger sandbox events and verify callback signatures and raw payloads",
    },
    certificates: {
      label: "Certificates",
      description: "Manage payment certificates, expiry, fingerprints, and rotation state",
    },
    logs: {
      label: "Integration logs",
      description: "Inspect integration events, processing results, and replay failed callbacks",
    },
  },
};

const PAYMENT_MESSAGES: Record<"en-US" | "zh-CN", PaymentMessages> = {
  "zh-CN": {
    description: "覆盖支付交易、机构执行、回调通知、资金对账和支付路由的全链路运营。",
    displayName: "支付管理",
    loading: "正在加载支付管理模块…",
    navigationGroups: {
      configuration: "支付配置",
      developerTools: "开发与联调",
      institutions: "机构管理",
      operations: "支付运营",
    },
    title: "支付管理",
    routes: {
      attempts: { label: "支付尝试", description: "追踪每次机构请求、通道选择和执行结果" },
      channels: { label: "支付通道", description: "配置支付方式与机构账户之间的可用通道" },
      integration: { label: "集成配置", description: "管理证书、凭据测试和沙箱工具" },
      methods: { label: "支付方式", description: "维护面向业务开放的支付方式及启停状态" },
      providerAccounts: { label: "支付机构", description: "管理支付服务商账户、环境和凭据状态" },
      reconciliation: { label: "对账中心", description: "创建并跟踪渠道账单与平台交易的核对批次" },
      records: { label: "支付记录", description: "查询支付意图、金额、订单归属和生命周期状态" },
      routeRules: { label: "路由规则", description: "按场景、优先级和可用性编排支付通道路由" },
      subMerchants: { label: "子商户", description: "管理服务商模式下的子商户进件与绑定关系" },
      webhooks: { label: "Webhook 事件", description: "审计回调验签、处理结果并重放失败事件" },
    },
  },
  "en-US": {
    description: "Operate the complete payment lifecycle across transactions, provider execution, webhooks, reconciliation, and routing.",
    displayName: "Payments",
    loading: "Loading Payment administration…",
    navigationGroups: {
      configuration: "Payment configuration",
      developerTools: "Developer tools",
      institutions: "Provider management",
      operations: "Payment operations",
    },
    title: "Payment administration",
    routes: {
      attempts: { label: "Payment attempts", description: "Trace provider requests, channel selection, and execution outcomes" },
      channels: { label: "Payment channels", description: "Configure available links between payment methods and provider accounts" },
      integration: { label: "Integration", description: "Manage certificates, credential tests, and sandbox tools" },
      methods: { label: "Payment methods", description: "Maintain customer-facing payment methods and availability" },
      providerAccounts: { label: "Providers", description: "Manage provider accounts, environments, and credential health" },
      reconciliation: { label: "Reconciliation", description: "Create and track matching runs across provider statements and platform payments" },
      records: { label: "Payment records", description: "Search payment intents, amounts, order ownership, and lifecycle status" },
      routeRules: { label: "Routing rules", description: "Orchestrate payment channels by scenario, priority, and availability" },
      subMerchants: { label: "Sub-merchants", description: "Manage onboarding and account links for partner-mode merchants" },
      webhooks: { label: "Webhook events", description: "Audit signature checks, processing outcomes, and replay failed events" },
    },
  },
};

function createPaymentRoute(Component: ComponentType, loading: string) {
  return function ManagerPaymentRoute() {
    return (
      <Suspense fallback={<div className="manager-module-loading" role="status">{loading}</div>}>
        <Component />
      </Suspense>
    );
  };
}

function createPaymentMonitorRoute(
  section: "attempts" | "intents" | "reconciliation" | "webhooks",
  message: PaymentRouteMessage,
  loading: string,
) {
  const LazyWorkspace = lazy(async () => {
    const module = await import("@sdkwork/payment-pc-admin-monitor");
    return {
      default: function PaymentMonitorRoute() {
        const controller = useMemo(
          () => module.createPaymentMonitorAdminController({ service: getManagerPaymentBackendService() }),
          [],
        );
        return (
          <module.PaymentMonitorAdminWorkspace
            capabilities={{
              canCreateReconciliationRun: hasManagerPermission("commerce.payments.reconciliation_runs.create"),
              canReplayWebhookEvent: hasManagerPermission("commerce.payments.webhook_events.replay"),
            }}
            controller={controller}
            description={message.description}
            section={section}
            title={message.label}
          />
        );
      },
    };
  });
  return createPaymentRoute(LazyWorkspace, loading);
}

function createPaymentProviderRoute(
  section: "accounts" | "submerchants",
  message: PaymentRouteMessage,
  loading: string,
) {
  const LazyWorkspace = lazy(async () => {
    const module = await import("@sdkwork/payment-pc-admin-provider");
    return {
      default: function PaymentProviderRoute() {
        const controller = useMemo(
          () => module.createPaymentProviderAdminController({ service: getManagerPaymentBackendService() }),
          [],
        );
        return (
          <module.PaymentProviderAdminWorkspace
            capabilities={{
              canCreateProviderAccount: hasManagerPermission("commerce.payments.provider_accounts.create"),
              canUpdateProviderAccount: hasManagerPermission("commerce.payments.provider_accounts.update"),
              canTestProviderAccount: hasManagerPermission("commerce.payments.provider_accounts.test"),
              canRotateProviderCredentials: hasManagerPermission("commerce.payments.provider_accounts.credentials.rotate"),
              canCreateSubMerchant: hasManagerPermission("commerce.payments.sub_merchants.create"),
              canUpdateSubMerchant: hasManagerPermission("commerce.payments.sub_merchants.update"),
              canDeleteSubMerchant: hasManagerPermission("commerce.payments.sub_merchants.delete"),
            }}
            controller={controller}
            description={message.description}
            section={section}
            title={message.label}
          />
        );
      },
    };
  });
  return createPaymentRoute(LazyWorkspace, loading);
}

function createPaymentChannelRoute(
  section: "channels" | "methods" | "rules",
  message: PaymentRouteMessage,
  loading: string,
) {
  const LazyWorkspace = lazy(async () => {
    const module = await import("@sdkwork/payment-pc-admin-channel");
    return {
      default: function PaymentChannelRoute() {
        const controller = useMemo(
          () => module.createPaymentChannelAdminController({ service: getManagerPaymentBackendService() }),
          [],
        );
        return (
          <module.PaymentChannelAdminWorkspace
            capabilities={{
              canCreateMethod: hasManagerPermission("commerce.payments.methods.create"),
              canUpdateMethod: hasManagerPermission("commerce.payments.methods.update"),
              canCreateChannel: hasManagerPermission("commerce.payments.channels.create"),
              canCreateRouteRule: hasManagerPermission("commerce.payments.route_rules.create"),
              canUpdateRouteRule: hasManagerPermission("commerce.payments.route_rules.update"),
              canDeleteRouteRule: hasManagerPermission("commerce.payments.route_rules.delete"),
            }}
            controller={controller}
            description={message.description}
            section={section}
            title={message.label}
          />
        );
      },
    };
  });
  return createPaymentRoute(LazyWorkspace, loading);
}

function createPaymentIntegrationRoute(
  section: PaymentIntegrationSection,
  message: PaymentRouteMessage,
  loading: string,
) {
  const LazyIntegrationWorkspace = lazy(async () => {
    const module = await import("@sdkwork/payment-pc-admin-devconfig");
    return {
      default: function PaymentIntegrationRoute() {
        const controller = useMemo(
          () => module.createPaymentDevConfigAdminController({ service: getManagerPaymentBackendService() }),
          [],
        );
        return (
          <module.PaymentDevConfigAdminWorkspace
            controller={controller}
            description={message.description}
            section={section}
            title={message.label}
          />
        );
      },
    };
  });
  return createPaymentRoute(LazyIntegrationWorkspace, loading);
}

export function createSdkworkManagerPaymentAdminContribution(
  locale: string,
  environment: ManagerEnvironment = resolveManagerEnvironment(),
): AdminModuleContribution {
  const language = locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
  const messages = PAYMENT_MESSAGES[language];
  const integrationMessages = PAYMENT_INTEGRATION_MESSAGES[language];
  const operationsGroup = [{ id: "operations", label: messages.navigationGroups.operations }];
  const institutionsGroup = [{ id: "institutions", label: messages.navigationGroups.institutions }];
  const configurationGroup = [{ id: "configuration", label: messages.navigationGroups.configuration }];
  const routes: Array<AdminModuleContribution["routes"][number]> = [
    {
      Component: createPaymentMonitorRoute("intents", messages.routes.records, messages.loading),
      description: messages.routes.records.description,
      id: "commerce.payment.records",
      label: messages.routes.records.label,
      navigationGroups: operationsGroup,
      path: "/admin/payments/monitor",
      permissionMode: "all",
      requiredPermissions: ["commerce.payments.intents.read"],
    },
    {
      Component: createPaymentMonitorRoute("attempts", messages.routes.attempts, messages.loading),
      description: messages.routes.attempts.description,
      id: "commerce.payment.attempts",
      label: messages.routes.attempts.label,
      navigationGroups: operationsGroup,
      path: "/admin/payments/attempts",
      permissionMode: "all",
      requiredPermissions: ["commerce.payments.attempts.read"],
    },
    {
      Component: createPaymentMonitorRoute("webhooks", messages.routes.webhooks, messages.loading),
      description: messages.routes.webhooks.description,
      id: "commerce.payment.webhooks",
      label: messages.routes.webhooks.label,
      navigationGroups: operationsGroup,
      path: "/admin/payments/webhooks",
      permissionMode: "all",
      requiredPermissions: ["commerce.payments.webhook_events.read"],
    },
    {
      Component: createPaymentMonitorRoute("reconciliation", messages.routes.reconciliation, messages.loading),
      description: messages.routes.reconciliation.description,
      id: "commerce.payment.reconciliation",
      label: messages.routes.reconciliation.label,
      navigationGroups: operationsGroup,
      path: "/admin/payments/reconciliation",
      permissionMode: "all",
      requiredPermissions: ["commerce.payments.reconciliation_runs.read"],
    },
    {
      Component: createPaymentProviderRoute("accounts", messages.routes.providerAccounts, messages.loading),
      description: messages.routes.providerAccounts.description,
      id: "commerce.payment.providers",
      label: messages.routes.providerAccounts.label,
      navigationGroups: institutionsGroup,
      path: "/admin/payments/providers",
      permissionMode: "all",
      requiredPermissions: ["commerce.payments.provider_accounts.read"],
    },
    {
      Component: createPaymentProviderRoute("submerchants", messages.routes.subMerchants, messages.loading),
      description: messages.routes.subMerchants.description,
      id: "commerce.payment.subMerchants",
      label: messages.routes.subMerchants.label,
      navigationGroups: institutionsGroup,
      path: "/admin/payments/sub-merchants",
      permissionMode: "all",
      requiredPermissions: [
        "commerce.payments.provider_accounts.read",
        "commerce.payments.sub_merchants.read",
      ],
    },
    {
      Component: createPaymentChannelRoute("methods", messages.routes.methods, messages.loading),
      description: messages.routes.methods.description,
      id: "commerce.payment.methods",
      label: messages.routes.methods.label,
      navigationGroups: configurationGroup,
      path: "/admin/payments/methods",
      permissionMode: "all",
      requiredPermissions: ["commerce.payments.methods.read"],
    },
    {
      Component: createPaymentChannelRoute("channels", messages.routes.channels, messages.loading),
      description: messages.routes.channels.description,
      id: "commerce.payment.channels",
      label: messages.routes.channels.label,
      navigationGroups: configurationGroup,
      path: "/admin/payments/channels",
      permissionMode: "all",
      requiredPermissions: [
        "commerce.payments.channels.read",
        "commerce.payments.methods.read",
        "commerce.payments.provider_accounts.read",
      ],
    },
    {
      Component: createPaymentChannelRoute("rules", messages.routes.routeRules, messages.loading),
      description: messages.routes.routeRules.description,
      id: "commerce.payment.routeRules",
      label: messages.routes.routeRules.label,
      navigationGroups: configurationGroup,
      path: "/admin/payments/route-rules",
      permissionMode: "all",
      requiredPermissions: [
        "commerce.payments.channels.read",
        "commerce.payments.route_rules.read",
      ],
    },
  ];

  if (!import.meta.env.PROD && environment !== "production") {
    const developerToolsGroup = [{ id: "developer-tools", label: messages.navigationGroups.developerTools }];
    routes.push(
      {
        Component: createPaymentIntegrationRoute("environment", integrationMessages.environment, messages.loading),
        description: integrationMessages.environment.description,
        id: "commerce.payment.integration.environments",
        label: integrationMessages.environment.label,
        navigationGroups: developerToolsGroup,
        path: "/admin/payments/integration/environments",
        permissionMode: "all",
        requiredPermissions: [
          "commerce.payments.provider_accounts.read",
          "commerce.payments.provider_accounts.update",
          "commerce.payments.provider_accounts.test",
        ],
      },
      {
        Component: createPaymentIntegrationRoute("webhook", integrationMessages.webhook, messages.loading),
        description: integrationMessages.webhook.description,
        id: "commerce.payment.integration.webhookDebugger",
        label: integrationMessages.webhook.label,
        navigationGroups: developerToolsGroup,
        path: "/admin/payments/integration/webhook-debugger",
        permissionMode: "all",
        requiredPermissions: [
          "commerce.payments.provider_accounts.read",
          "commerce.payments.webhook_events.read",
          "commerce.payments.dev.sandbox_trigger",
          "commerce.payments.dev.webhook_signature_test",
        ],
      },
      {
        Component: createPaymentIntegrationRoute("certificates", integrationMessages.certificates, messages.loading),
        description: integrationMessages.certificates.description,
        id: "commerce.payment.integration.certificates",
        label: integrationMessages.certificates.label,
        navigationGroups: developerToolsGroup,
        path: "/admin/payments/integration/certificates",
        permissionMode: "all",
        requiredPermissions: [
          "commerce.payments.certificates.read",
          "commerce.payments.certificates.create",
          "commerce.payments.certificates.delete",
        ],
      },
      {
        Component: createPaymentIntegrationRoute("logs", integrationMessages.logs, messages.loading),
        description: integrationMessages.logs.description,
        id: "commerce.payment.integration.logs",
        label: integrationMessages.logs.label,
        navigationGroups: developerToolsGroup,
        path: "/admin/payments/integration/logs",
        permissionMode: "all",
        requiredPermissions: [
          "commerce.payments.webhook_events.read",
          "commerce.payments.webhook_events.replay",
        ],
      },
    );
  }

  return {
    access: {
      permissionMode: "any",
      requiredPermissions: routes.flatMap((route) => route.requiredPermissions ?? []),
    },
    capability: "payment-admin",
    commercial: {
      entitlementKey: "sdkwork.payment.admin",
      releaseChannel: "stable",
      tier: "enterprise",
    },
    defaultPath: "/admin/payments/monitor",
    displayName: messages.displayName,
    domain: "commerce",
    header: { description: messages.description, title: messages.title },
    id: "commerce.payment",
    packageName: "@sdkwork/manager-pc-admin-payment",
    pathPrefix: "/admin/payments",
    routes,
    surface: "backend-admin",
  };
}
