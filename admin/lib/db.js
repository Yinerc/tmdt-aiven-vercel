import mysql from "mysql2/promise";

const connectionUri =
  process.env.AIVEN_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  "";

const pool = mysql.createPool(
  connectionUri
    ? {
        uri: connectionUri,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: "utf8mb4",
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: "utf8mb4",
        ssl:
          process.env.DB_SSL === "true"
            ? { rejectUnauthorized: false }
            : undefined,
      }
);

// Export nhiều kiểu để không làm hỏng các trang cũ trong project.
// Các trang có thể dùng: import db, import { db }, import { query }, import { execute }, import { pool }.
const db = pool;

export { db, pool };
export default db;

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

export async function getConnection() {
  return pool.getConnection();
}
