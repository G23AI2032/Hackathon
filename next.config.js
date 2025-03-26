/** @type {import('next').NextConfig} */
const nextConfig = {
  serverRuntimeConfig: {
    // Will only be available on the server side
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    GITHUB_API_URL: process.env.GITHUB_API_URL,
    GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
    GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,
    DEFAULT_CLUSTER_URL: process.env.DEFAULT_CLUSTER_URL,
    DEFAULT_CLUSTER_TOKEN: process.env.DEFAULT_CLUSTER_TOKEN,
    DEFAULT_CLUSTER_NAMESPACE: process.env.DEFAULT_CLUSTER_NAMESPACE,
  },
  experimental: {
    serverActions: true,
  }
}

module.exports = nextConfig