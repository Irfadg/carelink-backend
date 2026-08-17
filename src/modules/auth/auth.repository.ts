import pool from "../../db";

/**
 * Find a user in the database using their email.
 *
 * Why:
 * We need this when:
 * - checking whether an email already exists during signup
 * - finding a user during login
 */
export async function findUserByEmail(email: string) {

    // Send a SQL query to PostgreSQL.
    // $1 is a placeholder for the email value.
    const result = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            password_hash,
            role,
            is_verified,
            created_at
        FROM users
        WHERE email = $1
        `,
        [email]
    );

    // If a user exists, return that user.
    // If no user exists, return null.
    return result.rows[0] ?? null;
}


/**
 * Create a new user in the users table.
 *
 * Why:
 * This will eventually be called during signup
 * after validation and password hashing.
 */
export async function createUser(
    name: string,
    email: string,
    passwordHash: string,
    role: string
) {

    // Insert the new user into PostgreSQL.
    const result = await pool.query(
        `
        INSERT INTO users (
            name,
            email,
            password_hash,
            role
        )
        VALUES ($1, $2, $3, $4)

        -- Return the newly created user.
        -- We intentionally DO NOT return password_hash.
        RETURNING
            id,
            name,
            email,
            role,
            is_verified,
            created_at
        `,
        [
            name,
            email,
            passwordHash,
            role
        ]
    );

    // Return the newly created user.
    return result.rows[0];
}