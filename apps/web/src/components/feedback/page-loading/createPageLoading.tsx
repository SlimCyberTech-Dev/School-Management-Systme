import { PageLoadingShell, type PageLoadingVariant } from "./PageLoadingShell";

export function createPageLoading(variant: PageLoadingVariant = "table") {
  const showHeader = variant !== "dashboard";
  return function PageLoading() {
    return <PageLoadingShell variant={variant} showHeader={showHeader} />;
  };
}
