import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type {
  AccountValuePackageResponse,
  AccountValueRequestResponse,
  AfterSalesRequestSummary,
  ShipmentSummary,
  TokenBankPlanResponse,
} from "@sdkwork/order-pc-admin-core";
import type {
  TradeOperationsPage,
  TradeOperationsQuery,
  TradeOperationsService,
  TradeRequestAction,
} from "@sdkwork/order-pc-admin-orders";
import {
  hasManagerPermission,
  type AdminModuleContribution,
} from "@sdkwork/manager-pc-core";
import { ConfirmDialog } from "@sdkwork/ui-pc-react";
import {
  getManagerOrderAdminService,
  getManagerTradeOperationsService,
} from "@sdkwork/manager-pc-admin-core";

type Language = "en-US" | "zh-CN";

const COPY = {
  "zh-CN": {
    description:
      "集中处理订单、售后、发货、充值方案、退款与提现，并与支付管理协同运营。",
    displayName: "交易中心",
    loading: "正在加载交易运营数据…",
    error: "数据加载失败，请检查交易权限与服务状态。",
    empty: "当前筛选条件下暂无交易记录。",
    actionError: "操作执行失败，记录状态未变更，请稍后重试。",
    actionSuccess: "操作已提交，最新状态已刷新。",
    confirmReview: (
      action: TradeRequestAction,
      kind: "refund" | "withdrawal",
    ) =>
      `确认对该${kind === "refund" ? "退款" : "提现"}请求执行“${{ approve: "批准", reject: "拒绝", retry: "重试" }[action]}”？`,
    actionLabels: { approve: "批准", reject: "拒绝", retry: "重试" },
    previous: "上一页",
    next: "下一页",
    title: "交易中心",
    navigationGroups: {
      financialReview: "资金审核",
      orderLifecycle: "订单履约",
      valueProducts: "储值产品",
    },
    routes: {
      orders: ["订单管理", "检索订单、查看详情，并执行取消或关闭"],
      afterSales: ["售后管理", "查询退款、退货与换货申请"],
      shipments: ["发货管理", "查看履约发货与物流单状态"],
      packages: ["充值套餐", "运营积分与账户价值充值套餐"],
      tokenBank: ["Token Bank", "运营 Token Bank 周期方案"],
      refunds: ["退款审核", "批准、拒绝或重试退款请求"],
      withdrawals: ["提现审核", "批准、拒绝或重试提现请求"],
    },
  },
  "en-US": {
    description:
      "Operate orders, after-sales, fulfillment, value plans, refunds, and withdrawals with Payments coordination.",
    displayName: "Trade Center",
    loading: "Loading trade operations…",
    error: "Unable to load trade data. Check permissions and service health.",
    empty: "No trade records match the current filters.",
    actionError: "The action failed and no status was changed. Try again.",
    actionSuccess: "The action was submitted and the latest status is shown.",
    confirmReview: (
      action: TradeRequestAction,
      kind: "refund" | "withdrawal",
    ) => `Apply the ${action} action to this ${kind} request?`,
    actionLabels: { approve: "Approve", reject: "Reject", retry: "Retry" },
    previous: "Previous",
    next: "Next",
    title: "Trade Center",
    navigationGroups: {
      financialReview: "Financial review",
      orderLifecycle: "Order lifecycle",
      valueProducts: "Stored-value products",
    },
    routes: {
      orders: [
        "Orders",
        "Search orders, inspect details, and cancel or close orders",
      ],
      afterSales: [
        "After-sales",
        "Review refund, return, and exchange requests",
      ],
      shipments: [
        "Shipments",
        "Review fulfillment shipments and tracking status",
      ],
      packages: [
        "Recharge Packages",
        "Operate points and account-value recharge packages",
      ],
      tokenBank: ["Token Bank", "Operate Token Bank recurring plans"],
      refunds: ["Refund Review", "Approve, reject, or retry refund requests"],
      withdrawals: [
        "Withdrawal Review",
        "Approve, reject, or retry withdrawal requests",
      ],
    },
  },
} as const;

const LazyOrdersPage = lazy(async () => {
  const module = await import("@sdkwork/order-pc-admin-orders");
  return {
    default: () => (
      <module.SdkworkOrderAdminOrdersPage
        capabilities={{
          canManageOrders: hasManagerPermission("commerce.orders.manage"),
        }}
        service={getManagerOrderAdminService()}
      />
    ),
  };
});

function useTradePage<T>(
  loader: (query: TradeOperationsQuery) => Promise<TradeOperationsPage<T>>,
) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<TradeOperationsPage<T>>({
    items: [],
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setResult(await loader({ page, pageSize: 20 }));
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loader, page]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { error, loading, page, reload, result, setPage };
}

function TradeTable<T>({
  columns,
  feedback,
  language,
  loader,
  renderRow,
}: {
  columns: string[];
  feedback?: ReactNode;
  language: Language;
  loader: (query: TradeOperationsQuery) => Promise<TradeOperationsPage<T>>;
  renderRow: (item: T, reload: () => Promise<boolean>) => ReactNode;
}) {
  const messages = COPY[language];
  const state = useTradePage(loader);
  return (
    <section className="manager-operations-page" aria-busy={state.loading}>
      {state.error ? (
        <p className="manager-feedback manager-feedback--error" role="alert">
          {messages.error}
        </p>
      ) : null}
      {feedback}
      {state.loading ? (
        <p className="manager-feedback" role="status">
          {messages.loading}
        </p>
      ) : null}
      <div aria-label={columns.join(", ")} className="manager-operations-table-wrap" role="region" tabIndex={0}>
        <table className="manager-operations-table">
          <caption className="sr-only">{columns.join(" / ")}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.result.items.length ? (
              state.result.items.map((item) => renderRow(item, state.reload))
            ) : !state.loading ? (
              <tr>
                <td colSpan={columns.length}>{messages.empty}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div
        aria-label={`${state.page} / ${Math.max(1, state.result.totalPages)}`}
        className="manager-operations-pagination"
        role="navigation"
      >
        <span className="manager-operations-pagination__summary">
          {state.result.totalItems.toLocaleString()} {language === "zh-CN" ? "条记录" : "records"}
        </span>
        <div className="manager-operations-pagination__controls">
          <button
            aria-label={messages.previous}
            disabled={state.page <= 1 || state.loading}
            onClick={() => state.setPage((value) => value - 1)}
            title={messages.previous}
            type="button"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <span className="manager-operations-pagination__page" aria-hidden="true">
            <strong>{state.page}</strong>
            <span>/</span>
            <span>{Math.max(1, state.result.totalPages)}</span>
          </span>
          <button
            aria-label={messages.next}
            disabled={
              state.page >= Math.max(1, state.result.totalPages) || state.loading
            }
            onClick={() => state.setPage((value) => value + 1)}
            title={messages.next}
            type="button"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function AfterSalesPage({ service, language }: TradePageProps) {
  const loader = useCallback(
    (query: TradeOperationsQuery) => service.listAfterSales(query),
    [service],
  );
  return (
    <TradeTable
      columns={
        language === "zh-CN"
          ? ["售后单", "订单", "类型", "金额", "状态"]
          : ["Request", "Order", "Type", "Amount", "Status"]
      }
      language={language}
      loader={loader}
      renderRow={(item: AfterSalesRequestSummary) => (
        <tr key={item.afterSalesRequestId}>
          <td>
            <strong>{item.afterSalesNo}</strong>
            <small>{item.afterSalesRequestId}</small>
          </td>
          <td>{item.orderId}</td>
          <td>{item.afterSalesType}</td>
          <td className="manager-numeric-cell">
            {item.requestedAmount} {item.currencyCode}
          </td>
          <td>
            <span className="manager-status-badge" data-status={item.status}>
              {item.status}
            </span>
          </td>
        </tr>
      )}
    />
  );
}
function ShipmentsPage({ service, language }: TradePageProps) {
  const loader = useCallback(
    (query: TradeOperationsQuery) => service.listShipments(query),
    [service],
  );
  return (
    <TradeTable
      columns={
        language === "zh-CN"
          ? ["发货单", "履约单", "承运商", "物流号", "状态"]
          : ["Shipment", "Fulfillment", "Carrier", "Tracking", "Status"]
      }
      language={language}
      loader={loader}
      renderRow={(item: ShipmentSummary) => (
        <tr key={item.shipmentId}>
          <td>
            <strong>{item.shipmentNo}</strong>
            <small>{item.shipmentId}</small>
          </td>
          <td>{item.fulfillmentId}</td>
          <td>{item.carrierCode}</td>
          <td>
            <code>{item.trackingNo || "-"}</code>
          </td>
          <td>
            <span className="manager-status-badge" data-status={item.status}>
              {item.status}
            </span>
          </td>
        </tr>
      )}
    />
  );
}
function PackagesPage({ service, language }: TradePageProps) {
  const loader = useCallback(
    (query: TradeOperationsQuery) => service.listAccountValuePackages(query),
    [service],
  );
  return (
    <TradeTable
      columns={
        language === "zh-CN"
          ? ["套餐", "资产", "赠送", "价格", "状态"]
          : ["Package", "Asset", "Grant", "Price", "Status"]
      }
      language={language}
      loader={loader}
      renderRow={(item: AccountValuePackageResponse) => (
        <tr key={item.packageId}>
          <td>
            <strong>{item.displayName || item.packageCode}</strong>
            <small>{item.packageCode}</small>
          </td>
          <td>{item.targetAsset}</td>
          <td className="manager-numeric-cell">{item.grantAmount}</td>
          <td className="manager-numeric-cell">
            {item.priceAmount} {item.currencyCode}
          </td>
          <td>
            <span className="manager-status-badge" data-status={item.status}>
              {item.status}
            </span>
          </td>
        </tr>
      )}
    />
  );
}
function TokenBankPage({ service, language }: TradePageProps) {
  const loader = useCallback(
    (query: TradeOperationsQuery) => service.listTokenBankPlans(query),
    [service],
  );
  return (
    <TradeTable
      columns={
        language === "zh-CN"
          ? ["方案", "周期", "额度", "价格", "状态"]
          : ["Plan", "Period", "Grant", "Price", "Status"]
      }
      language={language}
      loader={loader}
      renderRow={(item: TokenBankPlanResponse) => (
        <tr key={item.planCode}>
          <td>
            <strong>{item.displayName || item.planCode}</strong>
            <small>{item.planCode}</small>
          </td>
          <td>{item.planPeriod}</td>
          <td className="manager-numeric-cell">{item.grantAmount}</td>
          <td className="manager-numeric-cell">
            {item.priceAmount} {item.currencyCode}
          </td>
          <td>
            <span className="manager-status-badge" data-status={item.status}>
              {item.status}
            </span>
          </td>
        </tr>
      )}
    />
  );
}

type TradePageProps = { service: TradeOperationsService; language: Language };
function RequestPage({
  service,
  language,
  kind,
}: TradePageProps & { kind: "refund" | "withdrawal" }) {
  const messages = COPY[language];
  const canManage = hasManagerPermission("commerce.orders.manage");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{
    action: TradeRequestAction;
    id: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const reloadRef = useRef<(() => Promise<boolean>) | undefined>(undefined);
  const loader = useCallback(
    (query: TradeOperationsQuery) =>
      kind === "refund"
        ? service.listRefundRequests(query)
        : service.listWithdrawalRequests(query),
    [kind, service],
  );
  const review = (id: string, action: TradeRequestAction) =>
    kind === "refund"
      ? service.reviewRefundRequest(id, action)
      : service.reviewWithdrawalRequest(id, action);
  const executeReview = async (
    id: string,
    action: TradeRequestAction,
    reload: () => Promise<boolean>,
  ) => {
    if (!id) return;
    const actionKey = `${id}:${action}`;
    setPendingAction(actionKey);
    setFeedback(null);
    try {
      await review(id, action);
      if (!(await reload())) throw new Error("trade refresh failed");
      setFeedback({ kind: "success", message: messages.actionSuccess });
      setReviewTarget(null);
    } catch {
      setFeedback({ kind: "error", message: messages.actionError });
    } finally {
      setPendingAction(null);
    }
  };
  return (
    <>
      <TradeTable
        columns={
          language === "zh-CN"
            ? ["请求", "订单", "资产", "金额", "状态", "操作"]
            : ["Request", "Order", "Asset", "Amount", "Status", "Actions"]
        }
        feedback={
          feedback ? (
            <p
              className={`manager-feedback manager-feedback--${feedback.kind}`}
              role={feedback.kind === "error" ? "alert" : "status"}
            >
              {feedback.message}
            </p>
          ) : null
        }
        language={language}
        loader={loader}
        renderRow={(item: AccountValueRequestResponse, reload) => {
          reloadRef.current = reload;
          const id = item.accountValueRequestId || item.requestNo || "";
          return (
            <tr key={id}>
              <td>
                <strong>{item.requestNo}</strong>
                <small>{id}</small>
              </td>
              <td>{item.originalOrderId}</td>
              <td>{item.targetAsset}</td>
              <td className="manager-numeric-cell">
                {item.amount} {item.currencyCode}
              </td>
              <td>
                <span
                  className="manager-status-badge"
                  data-status={item.status}
                >
                  {item.status}
                </span>
              </td>
              <td className="manager-operations-actions">
                {canManage
                  ? (["approve", "reject", "retry"] as const).map((action) => {
                      const actionKey = `${id}:${action}`;
                      return (
                        <button
                          className={
                            action === "reject"
                              ? "manager-action-danger"
                              : undefined
                          }
                          disabled={!id || pendingAction !== null}
                          key={action}
                          onClick={() => setReviewTarget({ action, id })}
                          type="button"
                        >
                          {pendingAction === actionKey
                            ? `${messages.actionLabels[action]}…`
                            : messages.actionLabels[action]}
                        </button>
                      );
                    })
                  : "-"}
              </td>
            </tr>
          );
        }}
      />
      <ConfirmDialog
        cancelLabel={language === "zh-CN" ? "返回" : "Cancel"}
        closeOnConfirm={false}
        confirmLabel={
          reviewTarget ? messages.actionLabels[reviewTarget.action] : undefined
        }
        confirmLoading={pendingAction !== null}
        description={
          reviewTarget
            ? messages.confirmReview(reviewTarget.action, kind)
            : undefined
        }
        onConfirm={() => {
          if (reviewTarget && reloadRef.current)
            void executeReview(
              reviewTarget.id,
              reviewTarget.action,
              reloadRef.current,
            );
        }}
        onOpenChange={(open) => {
          if (!open && pendingAction === null) setReviewTarget(null);
        }}
        open={Boolean(reviewTarget)}
        title={
          kind === "refund"
            ? messages.routes.refunds[0]
            : messages.routes.withdrawals[0]
        }
        tone={reviewTarget?.action === "reject" ? "danger" : "warning"}
      />
    </>
  );
}

export function createSdkworkManagerTradeAdminContribution(
  locale: string,
): AdminModuleContribution {
  const language: Language = locale.toLowerCase().startsWith("zh")
    ? "zh-CN"
    : "en-US";
  const messages = COPY[language];
  const service = getManagerTradeOperationsService();
  const routeGroups = {
    afterSales: {
      id: "order-lifecycle",
      label: messages.navigationGroups.orderLifecycle,
    },
    orders: {
      id: "order-lifecycle",
      label: messages.navigationGroups.orderLifecycle,
    },
    packages: {
      id: "value-products",
      label: messages.navigationGroups.valueProducts,
    },
    refunds: {
      id: "financial-review",
      label: messages.navigationGroups.financialReview,
    },
    shipments: {
      id: "order-lifecycle",
      label: messages.navigationGroups.orderLifecycle,
    },
    tokenBank: {
      id: "value-products",
      label: messages.navigationGroups.valueProducts,
    },
    withdrawals: {
      id: "financial-review",
      label: messages.navigationGroups.financialReview,
    },
  } satisfies Record<
    keyof typeof messages.routes,
    { id: string; label: string }
  >;
  const operationRoute = (
    key: keyof typeof messages.routes,
    Component: (props: TradePageProps) => ReactNode,
  ) => ({
    Component: () => <Component language={language} service={service} />,
    description: messages.routes[key][1],
    id: `commerce.trade.${key}`,
    label: messages.routes[key][0],
    navigationGroups: [routeGroups[key]],
    path: `/admin/trade/${key}`,
    requiredPermissions: ["commerce.orders.read"],
  });
  return {
    access: {
      permissionMode: "any",
      requiredPermissions: ["commerce.orders.read", "commerce.orders.manage"],
    },
    capability: "trade-admin",
    commercial: {
      entitlementKey: "sdkwork.trade.admin",
      releaseChannel: "stable",
      tier: "standard",
    },
    defaultPath: "/admin/trade/orders",
    displayName: messages.displayName,
    domain: "commerce",
    header: {
      description: messages.description,
      title: messages.title,
    },
    id: "commerce.trade",
    packageName: "@sdkwork/manager-pc-admin-trade",
    pathPrefix: "/admin/trade",
    routes: [
      {
        Component: () => (
          <Suspense
            fallback={
              <div className="manager-module-loading">{messages.loading}</div>
            }
          >
            <LazyOrdersPage />
          </Suspense>
        ),
        description: messages.routes.orders[1],
        id: "commerce.trade.orders",
        label: messages.routes.orders[0],
        navigationGroups: [routeGroups.orders],
        path: "/admin/trade/orders",
        requiredPermissions: ["commerce.orders.read"],
      },
      operationRoute("afterSales", AfterSalesPage),
      operationRoute("shipments", ShipmentsPage),
      operationRoute("packages", PackagesPage),
      operationRoute("tokenBank", TokenBankPage),
      operationRoute("refunds", (props) => (
        <RequestPage {...props} kind="refund" />
      )),
      operationRoute("withdrawals", (props) => (
        <RequestPage {...props} kind="withdrawal" />
      )),
    ],
    surface: "backend-admin",
  };
}
