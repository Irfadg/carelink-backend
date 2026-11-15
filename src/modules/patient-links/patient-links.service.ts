
import { searchPatients } from "./patient-links.repository";

/**
 * Search patients by name or email.
 *
 * Business rules:
 * - Search query must contain at least 2 characters.
 * - Default page size is 20.
 * - Maximum page size is 20.
 * - Offset cannot be negative.
 */
export async function searchPatientsService(
    query: string,
    limit: number = 20,
    offset: number = 0
) {
    // Remove leading and trailing spaces.
    const searchQuery = query.trim();

    // Validate minimum search length.
    if (searchQuery.length < 2) {
        throw new Error("Search query must contain at least 2 characters");
    }

    // Validate pagination values.
    if (!Number.isInteger(limit) || limit < 1) {
        throw new Error("Limit must be a positive integer");
    }

    if (!Number.isInteger(offset) || offset < 0) {
        throw new Error("Offset must be a non-negative integer");
    }

    // Restrict the maximum number of results.
    const pageSize = Math.min(limit, 20);

    // Fetch patients from the repository.
    const patients = await searchPatients(
        searchQuery,
        pageSize,
        offset
    );

    return patients;
}

