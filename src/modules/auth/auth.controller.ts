import { Request, Response } from "express";

import { signupUser } from "./auth.service";


/**
 * POST /auth/signup
 *
 * Receives signup data from the client,
 * validates the request and calls the service.
 */
export async function signup(
    req: Request,
    res: Response
) {

    try {

        // Get data sent by the client.
        const {
            name,
            email,
            password,
            role
        } = req.body;


        // Check required fields.
        if (
            !name ||
            !email ||
            !password ||
            !role
        ) {
            return res.status(400).json({
                error:
                    "Name, email, password and role are required"
            });
        }


        // Allowed roles.
        const allowedRoles = [
            "patient",
            "caregiver",
            "doctor"
        ];


        // Check whether the requested role is valid.
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                error: "Invalid role"
            });
        }


        // Basic password validation.
        if (password.length < 6) {
            return res.status(400).json({
                error:
                    "Password must be at least 6 characters"
            });
        }


        // Call the service.
        //
        // The controller does NOT:
        // - hash the password
        // - write SQL
        // - check duplicate users
        //
        // Those responsibilities belong to the service
        // and repository.
        const user = await signupUser(
            name,
            email,
            password,
            role
        );


        // Return the newly created user.
        //
        // password/password_hash is NOT returned.
        return res.status(201).json({
            message: "User created successfully",
            user
        });

    } catch (error) {

        console.error(error);


        return res.status(400).json({
            error:
                error instanceof Error
                    ? error.message
                    : "Signup failed"
        });
    }
}