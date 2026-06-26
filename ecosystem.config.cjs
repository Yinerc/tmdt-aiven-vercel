module.exports = {
  apps: [
    {
      name: "tmdt-admin",
      cwd: "./admin",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "tmdt-users",
      cwd: "./users",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "tmdt-ai",
      cwd: "./ai_service",
      script: "./.venv/bin/python",
      args: "-m uvicorn app:app --host 127.0.0.1 --port 8000",
      interpreter: "none",
      env: {
        PYTHONUNBUFFERED: "1",
      },
    },
  ],
};
