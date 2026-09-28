

import { Router } from "express";

import { signup, login } from "./auth.controller";


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


export default router;