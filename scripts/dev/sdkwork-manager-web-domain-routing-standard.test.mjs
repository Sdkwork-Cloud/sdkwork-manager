import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (relativePath) => JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'));
const readText = (relativePath) => readFileSync(path.join(repoRoot, relativePath), 'utf8');

const deployment = readJson('etc/sdkwork.deployment.config.json');
const topology = readJson('specs/topology.spec.json');
const deployManifest = readText('deployments/deploy.yaml');

// APP_RUNTIME_TOPOLOGY_NAMING.md section 9.2: sdkwork-manager binds the
// `admin` role host on sdkwork.com (applicationCode stays manager; the
// registered host takes precedence over the formula).
const expectedOrigins = {
  development: 'https://admin-dev.sdkwork.com',
  test: 'https://admin-test.sdkwork.com',
  staging: 'https://admin-staging.sdkwork.com',
  production: 'https://admin.sdkwork.com',
};
const expectedCloudApiBaseUrls = {
  development: 'https://api-dev.sdkwork.com',
  test: 'https://api-test.sdkwork.com',
  staging: 'https://api-staging.sdkwork.com',
  production: 'https://api.sdkwork.com',
};

for (const [environment, expectedOrigin] of Object.entries(expectedOrigins)) {
  const canonical = deployment.environments?.[environment];
  assert.ok(canonical, `deployment config must declare ${environment}`);
  assert.equal(canonical.applicationOrigin, expectedOrigin);
  assert.equal(canonical.cloudApiBaseUrl, expectedCloudApiBaseUrls[environment]);
  const parsed = new URL(expectedOrigin);
  assert.doesNotMatch(parsed.hostname, /^api(?:-|\.)/u);
}

const publicHost = topology.cloudPublicHosts?.['application.public-ingress'];
assert.ok(publicHost, 'topology must register application.public-ingress');
assert.equal(publicHost.httpHost, 'admin.sdkwork.com');
assert.equal(publicHost.environments?.development?.httpHost, 'admin-dev.sdkwork.com');
assert.equal(publicHost.environments?.test?.httpHost, 'admin-test.sdkwork.com');
assert.equal(publicHost.environments?.staging?.httpHost, 'admin-staging.sdkwork.com');
assert.equal(
  topology.cloudPublicHosts?.['platform.api-gateway']?.environments?.test?.httpHost,
  'api-test.sdkwork.com',
);

const topologyEnvFiles = [
  'cloud.development.env', 'cloud.test.env', 'cloud.staging.env', 'cloud.production.env',
  'standalone.development.env', 'standalone.test.env', 'standalone.staging.env', 'standalone.production.env',
];

for (const environment of ['development', 'test', 'staging', 'production']) {
  const profileSource = readText(`etc/topology/cloud.${environment}.env`);
  assert.match(profileSource, new RegExp(`SDKWORK_MANAGER_ENVIRONMENT=${environment}`, 'u'));
  const appOrigin = expectedOrigins[environment].replace(/\/$/u, '');
  const apiOrigin = expectedCloudApiBaseUrls[environment].replace(/\/$/u, '');
  const appHostLine = profileSource.split('\n').find((l) => l.startsWith('SDKWORK_MANAGER_APPLICATION_PUBLIC_HTTP_URL='));
  assert.ok(appHostLine, `cloud ${environment} must declare APPLICATION_PUBLIC_HTTP_URL`);
  assert.ok(appHostLine.includes(appOrigin), `cloud ${environment} application public must use ${appOrigin}: ${appHostLine}`);
  const gatewayLine = profileSource.split('\n').find((l) => l.startsWith('SDKWORK_MANAGER_PLATFORM_API_GATEWAY_HTTP_URL='));
  assert.ok(gatewayLine, `cloud ${environment} must declare PLATFORM_API_GATEWAY_HTTP_URL`);
  assert.ok(gatewayLine.includes(apiOrigin), `cloud ${environment} gateway must use ${apiOrigin}: ${gatewayLine}`);
  // CORS origins must include the application origin; cloud.development
  // folds CORS to the local dev origin (127.0.0.1) with a remote API origin.
  const corsLine = profileSource.split('\n').find((l) => l.startsWith('SDKWORK_MANAGER_CORS_ALLOWED_ORIGINS='));
  assert.ok(corsLine, `cloud ${environment} must declare CORS_ALLOWED_ORIGINS`);
  if (environment === 'development') {
    assert.ok(/127\.0\.0\.1/u.test(corsLine), `cloud development CORS must fold to local dev origin: ${corsLine}`);
  } else {
    assert.ok(corsLine.includes(appOrigin), `cloud ${environment} CORS must include ${appOrigin}: ${corsLine}`);
  }
}

// Standalone profiles fold SDK base URLs to loopback and must not reference
// cloud hostnames.
for (const environment of ['development', 'test', 'staging', 'production']) {
  const profileSource = readText(`etc/topology/standalone.${environment}.env`);
  assert.doesNotMatch(profileSource, /\.sdkwork\.com/u, `standalone ${environment} must not reference cloud hostnames`);
  assert.match(profileSource, /127\.0\.0\.1/u, `standalone ${environment} must fold to loopback URLs`);
}

// Retired manager.* domain names and placeholders must not appear in source config.
const workspaceConfigText = [
  ...topologyEnvFiles.map((name) => readText(`etc/topology/${name}`)),
  readText('etc/sdkwork.deployment.config.json'),
  readText('specs/topology.spec.json'),
  deployManifest,
].join('\n');
assert.doesNotMatch(workspaceConfigText, /manager\.sdkwork\.com/u, 'manager.sdkwork.com is retired');
assert.doesNotMatch(workspaceConfigText, /\.invalid/u, 'placeholder .invalid domains are retired');

// deploy.yaml cloud expose domains must belong to the registered host set.
const cloudSection = deployManifest.split('standalone.production:')[0] ?? deployManifest;
const hostSets = new Set(Object.values(expectedOrigins).map((url) => new URL(url).hostname));
const exposeBlocks = [...cloudSection.matchAll(/domain:\s*([^\s]+)[\s\S]*?(?=\n\s{4}- domain:|\n\s{2}cloud\.|\n\s{2}standalone\.|$)/gu)];
assert.ok(exposeBlocks.length >= 3, 'deploy.yaml must declare cloud test/staging/production exposes');
for (const block of exposeBlocks) {
  assert.ok(hostSets.has(block[1]), `expose domain ${block[1]} must be registered in cloudPublicHosts`);
}

console.log('sdkwork-manager web domain routing standard passed');
