import bcrypt from "bcrypt";

import {
    findUserByEmail,
    createUser,
} from "./auth.repository";


/**
 * Signup a new user.
 *
 * Business logic:
 * 1. Normalize email
 * 2. Check duplicate email
 * 3. Hash password
 * 4. Create user
 */
export async function signupUser(
    name: string,
    email: string,
    password: string,
    role: string
) {

    // Remove unnecessary spaces and convert
    // email to lowercase.
    const normalizedEmail = email
        .trim()
        .toLowerCase();


    // Check whether this email already exists.
    const existingUser = await findUserByEmail(
        normalizedEmail
    );


    if (existingUser) {
        throw new Error("Email already registered");
    }


    // Convert the plain-text password
    // into a secure bcrypt hash.
    const passwordHash = await bcrypt.hash(
        password,
        10
    );


    // Create the user in PostgreSQL.
    const user = await createUser(
        name.trim(),
        normalizedEmail,
        passwordHash,
        role
    );


    return user;
}