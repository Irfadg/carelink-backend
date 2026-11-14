
import express from "express";

import authRoutes from "./modules/auth/auth.routes";

const app = express();

// Parse incoming JSON request bodies.
app.use(express.json());

// Register authentication routes.
// Example: /auth + /login = POST /auth/login
app.use("/auth", authRoutes);

// Health-check endpoint.
app.get("/health", (_req, res) => {
    res.json({
        status: "ok"
    });
});

// Export the Express app so Supertest can use it.
export default app;
