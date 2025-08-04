/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["wagmi", "@farcaster/miniapp-wagmi-connector"],
};

module.exports = nextConfig;