/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  transpilePackages: ["@uganda-cbc-sms/brand"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
