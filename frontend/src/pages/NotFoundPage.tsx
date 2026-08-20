import { RouteMessagePage } from "./RouteMessagePage";

export function NotFoundPage() {
  return (
    <RouteMessagePage
      title="Page not found"
      message="The page you requested is not part of the archive."
    />
  );
}
