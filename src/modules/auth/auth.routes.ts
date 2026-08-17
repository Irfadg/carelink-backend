

import { Router } from "express";

import { signup } from "./auth.controller";


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


export default router;