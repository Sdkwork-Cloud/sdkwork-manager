import {
  createSdkworkCoreModuleRegistry,
  type AdminModuleContribution,
} from "./module-registry";

export function createSdkworkCoreHostRegistry(
  contributions: readonly AdminModuleContribution[],
) {
  return createSdkworkCoreModuleRegistry(contributions);
}
