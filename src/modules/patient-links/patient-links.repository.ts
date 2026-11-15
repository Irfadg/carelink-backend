
import pool from "../../db";

/**
 * Search for patients using their name or email.
 *
 * Why:
 * Doctors and caregivers need to find patients
 * before sending them a connection request.
 *
 * Only minimal patient information is returned.
 */
export async function searchPatients(
    searchQuery: string,
    limit: number,
    offset: number
) {
    const result = await pool.query(
        `
        SELECT
            id,
            name,
            email
        FROM users
        WHERE role = 'patient'
        AND (
            name ILIKE $1
            OR email ILIKE $1
        )
        ORDER BY name ASC
        LIMIT $2
        OFFSET $3
        `,
        [`%${searchQuery}%`, limit, offset]
    );

    return result.rows;
}
