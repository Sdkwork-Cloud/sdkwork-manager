import { useMemo } from "react";
import { getAppbaseAppSdkClient } from "@sdkwork/manager-pc-core";
import {
  createSdkworkUserController,
  createSdkworkUserService,
  SdkworkUserCenterPage,
  type SdkworkUserClient,
} from "@sdkwork/user-pc-react";

export function ManagerCurrentOperatorUserCenter({ locale }: { locale: string }) {
  const controller = useMemo(
    () => createSdkworkUserController({
      locale,
      service: createSdkworkUserService({
        // user-pc-react declares its own loose SdkworkUserClient contract;
        // the appbase client satisfies it structurally at runtime (same seam
        // as the package's internal default getClient).
        getClient: getAppbaseAppSdkClient as unknown as () => SdkworkUserClient,
        locale,
      }),
    }),
    [locale],
  );

  return (
    <SdkworkUserCenterPage
      controller={controller}
      locale={locale}
    />
  );
}
