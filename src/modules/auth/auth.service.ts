import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


import {
    findUserByEmail,
    createUser,
    findUserById,
} from "./auth.repository";


/**
 * Generate an authentication token for a user.
 *
 * The token allows the client to prove that
 * they have already authenticated.
 */
function generateToken(userId: number, role: string) {

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        {
            userId,
            role
        },
        secret,
        {
            expiresIn: "7d"
        }
    );
}

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


/**
 * Login an existing user.
 *
 * Business logic:
 * 1. Normalize email
 * 2. Find user by email
 * 3. Compare entered password with stored password hash
 * 4. create Jwt token
 * 5. Return the authenticated user
 */

export async function loginUser(
    email: string,
    password: string
) {
    const normalizedEmail = email
        .trim()
        .toLowerCase();

    const user = await findUserByEmail(
        normalizedEmail
    );


    if (!user) {
        throw new Error("Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordMatches) {
        throw new Error("Invalid email or password");
    }

    const {
        password_hash: _passwordHash,
        ...safeUser
    } = user;




    const token = generateToken(
        user.id,
        user.role
    );



    return {
        user: safeUser,
        token
    };
}


/**
 * Get the currently authenticated user's details.
 *
 * Why:
 * The user ID comes from the verified JWT token.
 * We use it to fetch the latest user information from the database.
 */
export async function getCurrentUser(userId: number) {

    // Find the user using their ID.
    const user = await findUserById(userId);

    // If the user no longer exists, return an error.
    if (!user) {
        throw new Error("User not found");
    }

    // Return user details.
    return user;
}