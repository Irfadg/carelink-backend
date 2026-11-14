


import { Request, Response } from "express";
import { ZodError } from "zod";

import {
    signupUser,
    loginUser,
    getCurrentUser
} from "./auth.service";

import {
    signupSchema,
    loginSchema
} from "./auth.schema";

import { AuthenticatedRequest } from "../../common/middleware/verifyToken";




export async function signup(
    req: Request,
    res: Response
) {
    try {
        // Validate and transform the request body.
        const data = signupSchema.parse(req.body);

        // data now contains validated values.
        const user = await signupUser(
            data.name,
            data.email,
            data.password,
            data.role
        );

        return res.status(201).json({
            message: "User created successfully",
            user
        });

    } catch (error) {

        // Handle Zod validation errors.
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            });
        }

        console.error(error);

        return res.status(400).json({
            error:
                error instanceof Error
                    ? error.message
                    : "Signup failed"
        });
    }


}

/**
 * POST /auth/login
 *
 * Handles an existing user's login request.
 */
export async function login(
    req: Request,
    res: Response
) {
    try {
        // Validate and transform the request body.
        const data = loginSchema.parse(req.body);

        // Send the validated credentials to the service.
        const result = await loginUser(
            data.email,
            data.password
        );

        // Return the user and JWT.
        return res.status(200).json({
            message: "Login successful",
            user: result.user,
            token: result.token
        });

    } catch (error) {

        // Handle Zod validation errors.
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            });
        }

        console.error(error);

        return res.status(401).json({
            error:
                error instanceof Error
                    ? error.message
                    : "Login failed"
        });
    }
}


/**
 * GET /auth/me
 *
 * Fetch the currently authenticated user's details.
 */
export async function getMe(
    req: AuthenticatedRequest,
    res: Response
) {
    try {
        // Get the user ID from the verified JWT token.
        const userId = req.user!.userId;

        // Fetch the latest user details from the database.
        const user = await getCurrentUser(userId);

        // Return the authenticated user's details.
        return res.status(200).json({
            message: "User details fetched successfully",
            user
        });

    } catch (error) {

        console.error(error);

        if (error instanceof Error && error.message === "User not found") {
            return res.status(404).json({
                error: "User not found"
            });
        }

        return res.status(500).json({
            error: "Failed to fetch user details"
        });
    }
}