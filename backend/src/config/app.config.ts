export function appConfig() {
  const port = Number(process.env.PORT ?? 4000);
  const apiPrefix = process.env.API_PREFIX ?? 'api';
  const rawOrigins = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    port,
    apiPrefix,
    allowedOrigins,
  };
}
