import { z } from "zod";

/**
 * Validation rules for user signup.
 *
 * This schema defines exactly what the API
 * expects from a signup request.
 */
export const signupSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters"),

    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .transform((email) => email.toLowerCase()),

    password: z
        .string()
        .min(6, "Password must be at least 6 characters"),

    role: z
        .enum(["patient", "caregiver", "doctor"]),
});


/**
 * Validation rules for user login.
 *
 * Login only needs:
 * - email
 * - password
 */
export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .transform((email) => email.toLowerCase()),

    password: z
        .string()
        .min(1, "Password is required"),
});