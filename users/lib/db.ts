// users\lib\db.ts
import mysql from 'mysql2/promise';

const connectionUri =
  process.env.AIVEN_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  '';

const pool = mysql.createPool(
  connectionUri
    ? {
        uri: connectionUri,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'tmdt_next',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      }
);

export default pool;