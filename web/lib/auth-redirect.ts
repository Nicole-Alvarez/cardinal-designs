const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

/** Allows post-login redirects only to routes inside the protected dashboard. */
export function authenticatedRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  try {
    const url = new URL(value, "http://cardinal.local");
    const isDashboardRoute =
      url.origin === "http://cardinal.local" &&
      (url.pathname === DEFAULT_AUTHENTICATED_PATH ||
        url.pathname.startsWith(`${DEFAULT_AUTHENTICATED_PATH}/`));
    return isDashboardRoute
      ? `${url.pathname}${url.search}${url.hash}`
      : DEFAULT_AUTHENTICATED_PATH;
  } catch {
    return DEFAULT_AUTHENTICATED_PATH;
  }
}
