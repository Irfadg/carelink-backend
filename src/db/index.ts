
import { Pool } from "pg";
import dotenv from "dotenv";

// Identify the current environment.
const nodeEnv = process.env.NODE_ENV ?? "development";

// Load the correct local environment file.
if (nodeEnv === "development" || nodeEnv === "test") {
    dotenv.config({
        path: `.env.${nodeEnv}`,
    });
}

// Validate required database configuration.
const requiredVariables = [
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
];

for (const variable of requiredVariables) {
    if (!process.env[variable]) {
        throw new Error(`${variable} is missing from environment configuration`);
    }
}

// Protect against accidentally using the wrong local database.
if (nodeEnv === "development" && process.env.DB_NAME !== "carelink") {
    throw new Error("Development environment must use the carelink database");
}

if (nodeEnv === "test" && process.env.DB_NAME !== "carelink_test") {
    throw new Error("Test environment must use the carelink_test database");
}

// Create a PostgreSQL connection pool.
const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

export default pool;
