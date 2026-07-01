export function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
    };
  }

  const host = process.env.DB_HOST?.trim();
  const port = Number(process.env.DB_PORT ?? 5432);
  const database = process.env.DB_NAME?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? '';

  if (!host || !database || !user) {
    throw new Error(
      [
        'Configuracion de PostgreSQL incompleta.',
        'Define DATABASE_URL o completa DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD en backend/.env.',
      ].join(' '),
    );
  }

  return {
    host,
    port,
    database,
    user,
    password,
  };
}
