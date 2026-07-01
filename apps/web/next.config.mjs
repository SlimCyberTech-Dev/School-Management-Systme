/** @type {import('next').NextConfig} */
function normalizeApiBaseUrl(raw) {
  const trimmed = (raw ?? "http://localhost:5000/api").trim();
  if (!trimmed) return "http://localhost:5000/api";
  if (trimmed.startsWith("/")) {
    const path = trimmed.replace(/\/+$/, "");
    return /\/api$/i.test(path) ? path : `${path}/api`;
  }
  const withoutTrailing = trimmed.replace(/\/+$/, "");
  if (/\/api$/i.test(withoutTrailing)) return withoutTrailing;
  return `${withoutTrailing}/api`;
}

const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const apiBase = normalizeApiBaseUrl(publicApiUrl);
const apiOrigin = apiBase.replace(/\/api\/?$/i, "");
const internalOrigin = process.env.API_INTERNAL_ORIGIN?.trim();

let uploadHostname = "localhost";
try {
  uploadHostname = new URL(apiOrigin.startsWith("http") ? apiOrigin : `http://${apiOrigin}`).hostname;
} catch {
  /* keep default */
}

const nextConfig = {
  transpilePackages: ["@uganda-cbc-sms/brand", "@uganda-cbc-sms/shared"],
  reactStrictMode: true,
  allowedDevOrigins: [
    "localhost:3000",
    "*.localhost:3000",
    "default.localhost:3000",
    "platform.localhost:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: uploadHostname,
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: uploadHostname,
        pathname: "/uploads/**",
      },
    ],
  },
  async rewrites() {
    // Same-origin API: browser calls /api/* on the web host; proxy to the API service.
    if (!publicApiUrl.trim().startsWith("/") || !internalOrigin) return [];
    const target = internalOrigin.replace(/\/+$/, "");
    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
};

export default nextConfig;
