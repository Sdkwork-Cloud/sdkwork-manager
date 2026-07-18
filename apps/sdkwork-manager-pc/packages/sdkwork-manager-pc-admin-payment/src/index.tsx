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
  routes: Record<string, { description: string; label: string }>;
  title: string;
};

const PAYMENT_MESSAGES: Record<"en-US" | "zh-CN", PaymentMessages> = {
  "zh-CN": {
    description: "管理支付机构、通道、路由、监控、Webhook、对账和集成配置。",
    displayName: "支付中心",
    loading: "正在加载支付管理模块…",
    title: "支付中心",
    routes: {
      monitor: { label: "支付监控", description: "查看支付意图、尝试、Webhook 与对账" },
      providers: { label: "支付机构", description: "管理支付机构账户和子商户" },
      channels: { label: "通道与路由", description: "管理支付方式、通道及路由规则" },
      integration: { label: "集成配置", description: "管理证书、凭据测试和沙箱工具" },
    },
  },
  "en-US": {
    description: "Manage providers, channels, routing, monitoring, webhooks, reconciliation, and integration configuration.",
    displayName: "Payment Center",
    loading: "Loading Payment administration…",
    title: "Payment Center",
    routes: {
      monitor: { label: "Payment Monitor", description: "Review intents, attempts, webhooks, and reconciliation" },
      providers: { label: "Providers", description: "Manage provider accounts and sub-merchants" },
      channels: { label: "Channels & Routing", description: "Manage methods, channels, and route rules" },
      integration: { label: "Integration", description: "Manage certificates, credential tests, and sandbox tools" },
    },
  },
};

const LazyMonitorWorkspace = lazy(async () => {
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
        />
      );
    },
  };
});
const LazyProviderWorkspace = lazy(async () => {
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
        />
      );
    },
  };
});
const LazyChannelWorkspace = lazy(async () => {
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
        />
      );
    },
  };
});
function createPaymentRoute(Component: ComponentType, loading: string) {
  return function ManagerPaymentRoute() {
    return (
      <Suspense fallback={<div className="manager-module-loading" role="status">{loading}</div>}>
        <Component />
      </Suspense>
    );
  };
}

function createPaymentIntegrationRoute(loading: string) {
  const LazyIntegrationWorkspace = lazy(async () => {
    const module = await import("@sdkwork/payment-pc-admin-devconfig");
    return {
      default: function PaymentIntegrationRoute() {
        const controller = useMemo(
          () => module.createPaymentDevConfigAdminController({ service: getManagerPaymentBackendService() }),
          [],
        );
        return <module.PaymentDevConfigAdminWorkspace controller={controller} />;
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
  const routes: Array<AdminModuleContribution["routes"][number]> = [
    {
      Component: createPaymentRoute(LazyMonitorWorkspace, messages.loading),
      description: messages.routes.monitor.description,
      id: "commerce.payment.monitor",
      label: messages.routes.monitor.label,
      path: "/admin/payments/monitor",
      permissionMode: "all",
      requiredPermissions: [
        "commerce.payments.intents.read",
        "commerce.payments.attempts.read",
        "commerce.payments.webhook_events.read",
        "commerce.payments.reconciliation_runs.read",
      ],
    },
    {
      Component: createPaymentRoute(LazyProviderWorkspace, messages.loading),
      description: messages.routes.providers.description,
      id: "commerce.payment.providers",
      label: messages.routes.providers.label,
      path: "/admin/payments/providers",
      permissionMode: "all",
      requiredPermissions: [
        "commerce.payments.provider_accounts.read",
        "commerce.payments.sub_merchants.read",
      ],
    },
    {
      Component: createPaymentRoute(LazyChannelWorkspace, messages.loading),
      description: messages.routes.channels.description,
      id: "commerce.payment.channels",
      label: messages.routes.channels.label,
      path: "/admin/payments/channels",
      permissionMode: "all",
      requiredPermissions: [
        "commerce.payments.channels.read",
        "commerce.payments.methods.read",
        "commerce.payments.route_rules.read",
        "commerce.payments.provider_accounts.read",
      ],
    },
  ];

  if (!import.meta.env.PROD && environment !== "production") {
    routes.push({
      Component: createPaymentIntegrationRoute(messages.loading),
      description: messages.routes.integration.description,
      id: "commerce.payment.integration",
      label: messages.routes.integration.label,
      path: "/admin/payments/integration",
      permissionMode: "all",
      requiredPermissions: [
        "commerce.payments.certificates.read",
        "commerce.payments.provider_accounts.read",
        "commerce.payments.webhook_events.read",
        "commerce.payments.dev.sandbox_trigger",
        "commerce.payments.dev.webhook_signature_test",
      ],
    });
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
