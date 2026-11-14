

import { Router } from "express";

import { signup, login, getMe } from "./auth.controller";

import { verifyToken } from "../../common/middleware/verifyToken";

const router = Router();


/**
 * POST /auth/signup
 *
 * When this endpoint is called,
 * Express executes the signup controller.
 */
router.post(
    "/signup",
    signup
);

/**
 * POST /auth/signup
 *
 * When this endpoint is called,
 * Express executes the signup controller.
 */
router.post(
    "/login",
    login
);


/**
 * GET /auth/me
 *
 * Fetches the currently authenticated user's details.
 */
 
router.get(
    "/me",
    verifyToken,
    getMe
);


export default router;