module.exports = {
  apps: [
    {
      name: "vitagita-server",
      script: "index.js",
      watch: false,
      env: {
        NODE_ENV: "production",
        FIRESTORE_FALLBACK: "0",
        HOST: "0.0.0.0",
        PORT: "5000"
      },
      node_args: "--max-old-space-size=2048"
    }
  ]
};
