export interface ManagerAdminHostMessages {
  adminBadge: string;
  brandLabel: string;
  capability: string;
  capabilityNavigation: string;
  commercialModulesNote: string;
  commercialTier: string;
  english: string;
  hideModuleNavigation: string;
  language: string;
  moduleAssemblyDescription: string;
  moduleAssemblyTitle: string;
  moduleNavigation: string;
  navigationCountTemplate: string;
  noAvailableCapabilities: string;
  registeredModules: string;
  releaseChannel: string;
  searchModules: string;
  selectModule: string;
  showModuleNavigation: string;
  signOut: string;
  simplifiedChinese: string;
  unifiedWorkspace: string;
  workspace: string;
}

export interface ManagerAuthMessages {
  connecting: string;
  retry: string;
  switchToDarkMode: string;
  switchToLightMode: string;
  unavailable: string;
}

export interface ManagerSessionMessages {
  unavailable: string;
  validating: string;
}

export interface ManagerIntegrationMessages {
  accessDescription: string;
  accessEyebrow: string;
  accessTitle: string;
  description: string;
  displayName: string;
  eyebrow: string;
  headerDescription: string;
  headerTitle: string;
  lifecycleRule: string;
  moduleOwnershipRule: string;
  overview: string;
  remoteCodeRule: string;
  routeDescription: string;
  title: string;
}

export interface ManagerShellMessages {
  adminHost: ManagerAdminHostMessages;
  auth: ManagerAuthMessages;
  integration: ManagerIntegrationMessages;
  session: ManagerSessionMessages;
}
