import { useMemo } from "react";
import { getAppbaseAppSdkClient } from "@sdkwork/manager-pc-core";
import {
  createSdkworkUserController,
  createSdkworkUserService,
  SdkworkUserCenterPage,
} from "@sdkwork/user-pc-react";

export function ManagerCurrentOperatorUserCenter({ locale }: { locale: string }) {
  const controller = useMemo(
    () => createSdkworkUserController({
      locale,
      service: createSdkworkUserService({
        getClient: getAppbaseAppSdkClient,
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
