export interface DbConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

export function parseDatabaseUrl(url: string): DbConfig {
  // Handles: mysql://user:pass@host:port/dbname
  const regex = /mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)/;
  const m = url.match(regex);
  if (!m) throw new Error("Invalid DATABASE_URL format — expected mysql://user:pass@host:port/db");
  return {
    user: decodeURIComponent(m[1]),
    password: decodeURIComponent(m[2]),
    host: m[3],
    port: parseInt(m[4], 10),
    database: m[5],
  };
}

export function buildTenantUrl(base: DbConfig, dbName: string): string {
  return `mysql://${encodeURIComponent(base.user)}:${encodeURIComponent(base.password)}@${base.host}:${base.port}/${dbName}`;
}
