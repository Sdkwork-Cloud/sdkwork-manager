# SDKWork Manager Product Requirements

Status: active
Owner: SDKWork maintainers
Updated: 2026-07-17
Specs: `sdkwork-specs/REQUIREMENTS_SPEC.md`

## 1. Background, scope, and product goals

SDKWork Manager is the unified operator console for platform administration and
commercial operations. Its first operational release closes the path from
campaign exposure and offer configuration through order conversion, payment,
fulfillment, after-sales, refund, and retention analysis without copying domain
logic into the Manager application.

The Manager host owns navigation, operator session, permissions, runtime
configuration, and cross-domain workflow entry points. Order, Promotion,
Payment, Drive, and IAM remain the owners of their APIs, persistence, SDKs, and
business rules.

## 2. Operating loop

The supported operating loop is:

1. Configure offers, coupon inventory, and promotion codes in Marketing Center.
2. Observe discount applications and switch campaigns on or off by tenant.
3. Monitor order conversion, after-sales requests, shipments, refunds, and
   withdrawals in Trade Center.
4. Configure payment providers, channels, routing rules, webhooks, and
   reconciliation in Payment Center.
5. Manage storage capacity, provider bindings, audit, and maintenance in Drive
   Center for files used by operational workflows.
6. Use IAM roles and permissions to separate read-only operations, campaign
   management, transaction review, payment configuration, and storage
   administration.

No frontend module may call domain HTTP APIs directly. Every authenticated
domain SDK uses the Manager operator `TokenManager` and the configured platform
API gateway base URL.

## 3. Operational centers

### 3.1 Trade Center

Trade Center provides seven production routes:

| Route | Operator outcome |
| --- | --- |
| `/admin/trade/orders` | Search orders, inspect detail, cancel, or close eligible orders |
| `/admin/trade/afterSales` | Review tenant-scoped after-sales requests |
| `/admin/trade/shipments` | Track fulfillment and logistics state |
| `/admin/trade/packages` | Manage account-value recharge packages |
| `/admin/trade/tokenBank` | Review Token Bank plans |
| `/admin/trade/refunds` | Review, approve, reject, or retry refund requests |
| `/admin/trade/withdrawals` | Review, approve, reject, or retry withdrawal requests |

Read access requires `commerce.orders.read`; transaction mutations require
`commerce.orders.manage`. Destructive or financial commands remain subject to
server-side state transition, tenant, permission, and idempotency enforcement.

### 3.2 Marketing Center

Marketing Center provides five production routes:

| Route | Operator outcome |
| --- | --- |
| `/admin/marketing/overview` | Review offer, stock, code, and application KPIs |
| `/admin/marketing/offers` | Search offers and enable or disable campaigns |
| `/admin/marketing/stocks` | Review coupon stock and availability |
| `/admin/marketing/codes` | Review promotion-code inventory and status |
| `/admin/marketing/applications` | Review discount application and redemption records |

Read access requires `commerce.marketing.read`; campaign status changes require
`commerce.marketing.manage`. Every list is server-paginated and tenant scoped.

### 3.3 Payment Center

Payment Center provides three production routes and one non-production route:

| Route | Environment | Operator outcome |
| --- | --- | --- |
| `/admin/payments/monitor` | All | Monitor intents, attempts, webhook events, and reconciliation |
| `/admin/payments/providers` | All | Manage provider accounts and sub-merchants |
| `/admin/payments/channels` | All | Manage payment methods, channels, and route rules |
| `/admin/payments/integration` | Non-production only | Manage certificates and run sandbox/signature diagnostics |

The route-level `commerce.payments.*` permission family separates read,
create, update, delete, test, replay, reconcile, and credential-rotation
operations. Development tools must never be exposed in a production build.

### 3.4 Drive Center

Drive Center provides eight production routes under `/admin/drive` for storage
providers, storage bindings, quotas, spaces, labels, audit events, maintenance,
and asynchronous download packages. Each route uses its dedicated `drive.*.admin`
permission; storage-provider operations use the Drive admin-storage SDK while
the remaining routes use the Drive backend SDK.

### 3.5 Identity and access

IAM remains the authority for login, tenant and organization context, roles,
permissions, OAuth, account binding, audit, and session lifecycle. Manager does
not implement local roles or browser-only authorization exceptions.

### 3.6 Customer Center

Customer Center provides a permission-aware Customer 360 without creating a
second customer master-data store:

| Route | Operator outcome |
| --- | --- |
| `/admin/customers/overview` | Review current-page customer and membership operating signals |
| `/admin/customers/directory` | Search the server-paginated IAM user directory |
| `/admin/customers/:userId` | Inspect masked IAM identity and permission-gated membership records |

IAM remains the identity source of truth. Membership data is loaded lazily only
when the operator has `commerce.memberships.read`. Email and phone values are
masked by default. Asset, marketing, customer-service, and other tabs remain
absent until their owning domains publish real user-centric read contracts;
the browser must not synthesize them through full-list downloads or fake KPIs.

### 3.7 Membership Center

Membership Center provides seven production routes:

| Route | Operator outcome |
| --- | --- |
| `/admin/memberships/overview` | Review explicitly labelled current-page membership indicators |
| `/admin/memberships/members` | Filter subscriptions and open member detail |
| `/admin/memberships/members/:id` | Inspect a tenant/organization-scoped member and entitlements |
| `/admin/memberships/plans` | Create, update, and disable membership plans |
| `/admin/memberships/package-groups` | Create, update, and disable billing-cycle groups |
| `/admin/memberships/packages` | Create, update, and disable purchasable packages |
| `/admin/memberships/entitlements` | Inspect entitlement accounts and quota state |

Read access requires `commerce.memberships.read`; catalog and lifecycle
mutations require `commerce.memberships.manage`. Purchase fulfillment remains
a service-authenticated internal operation and is intentionally absent from the
Manager SDK service and UI. This P0 release uses the existing Membership schema
and introduces no table, column, index, or migration.

## 4. Roles and separation of duties

Recommended role templates:

| Role | Minimum capability |
| --- | --- |
| Operations viewer | Order, marketing, payment-monitor, and Drive read permissions only |
| Campaign operator | Marketing read/manage; no payment credential or transaction-review commands |
| Trade operator | Order read/manage; refund and withdrawal actions follow domain audit policy |
| Payment operator | Payment monitor, provider, channel, webhook, and reconciliation permissions |
| Storage operator | Required `drive.*.admin` permissions only |
| Platform administrator | IAM administration plus explicitly approved operational permissions |

Production roles should apply least privilege. Read-only sessions must not
render mutation actions, and the backend must reject direct attempts regardless
of browser state.

## 5. Operating metrics

The initial release must make these operational signals observable from domain
data and gateway telemetry:

- Marketing: active offers, coupon stock, active codes, discount applications,
  and campaign status-change failures.
- Trade: order volume and state distribution, after-sales backlog, unshipped
  orders, refund backlog/failures, and withdrawal backlog/failures.
- Payment: payment-intent success rate, attempt failure rate, webhook failure
  and replay rate, provider/channel availability, and unreconciled runs.
- Drive: quota pressure, provider test failures, maintenance failures, download
  job failures, and administration audit events.
- Platform: authentication failure, authorization denial, API problem response,
  route-load error, and gateway dependency-start failure rates.
- Customer: IAM directory query failures, Customer 360 detail failures, masked
  identity coverage, and cross-domain tab authorization denials.
- Membership: subscription status distribution, expiring memberships,
  entitlement exhaustion, catalog mutation failures, and organization-scope
  authorization denials. UI overview counts are labelled current-page unless a
  future aggregate API supplies authoritative totals.

## 6. Daily operating rhythm

- Start of day: review Payment Monitor, refund/withdrawal queues, shipment
  backlog, campaign inventory, and gateway health.
- During campaigns: monitor payment success, coupon stock, discount application
  growth, order conversion, and provider/channel failures.
- End of day: complete reconciliation, resolve failed webhooks and refunds,
  export required audit evidence, and record outstanding exceptions.
- Weekly: review routing rules, campaign effectiveness, refund reasons, storage
  capacity, operator permissions, and audit anomalies.

## 7. Release acceptance

A release is acceptable only when the PC build, SDK boundary checks, route and
permission composition, server pagination, domain API contracts, platform
gateway embedded features, and the smoke workflow in
`docs/runbooks/LAUNCH_READINESS.md` pass. Empty success responses, raw HTTP,
manual auth headers, client-side full-list pagination, and production exposure
of payment development tools are release blockers.
