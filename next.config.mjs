/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      "pdf-parse",
      "@sparticuz/chromium-min",
      "playwright-core",
    ],
  },
};
export default nextConfig;
