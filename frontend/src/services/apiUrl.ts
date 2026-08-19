const DEVELOPMENT_API_URL = "http://localhost:5000/api/Movies";

export function buildMovieApiUrl(path = ""): URL {
  return appendPath(new URL(getMovieApiBaseUrl()), path);
}

export function buildSiblingApiUrl(resource: string, path = ""): URL {
  const url = new URL(getMovieApiBaseUrl());
  const pathSegments = url.pathname.split("/").filter(Boolean);
  pathSegments[pathSegments.length - 1] = resource;
  url.pathname = `/${pathSegments.join("/")}`;
  return appendPath(url, path);
}

function appendPath(url: URL, path: string): URL {
  const normalizedPath = path.replace(/^\/+/, "");
  if (normalizedPath) {
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/${normalizedPath}`;
  }
  return url;
}

function getMovieApiBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  const candidate =
    configuredUrl || (import.meta.env.DEV ? DEVELOPMENT_API_URL : undefined);

  if (!candidate) {
    throw new Error(
      "The Movie API is not configured. Set VITE_API_URL for this deployment.",
    );
  }

  const normalizedUrl = candidate.replace(/\/+$/, "");

  try {
    const parsedUrl = new URL(normalizedUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new Error(
      "The Movie API configuration is invalid. VITE_API_URL must be an absolute HTTP or HTTPS URL.",
    );
  }

  return normalizedUrl;
}
