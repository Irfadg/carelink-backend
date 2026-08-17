import express from "express";

import authRoutes from "./modules/auth/auth.routes";


const app = express();


// Parse JSON request bodies.
//
// Without this, req.body will not contain
// JSON sent from Postman/Flutter.
app.use(express.json());


// Authentication routes.
//
// /auth + /signup
// becomes:
// POST /auth/signup
app.use(
    "/auth",
    authRoutes
);


// Simple health-check endpoint.
//
// Used to verify that the server is running.
app.get(
    "/health",
    async (_req, res) => {

        res.json({
            status: "ok"
        });
    }
);


// Start the server.
app.listen(
    3000,
    () => {
        console.log(
            "CareLink server running on port 3000"
        );
    }
);