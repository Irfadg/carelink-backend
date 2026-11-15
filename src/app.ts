
import express from "express";

import authRoutes from "./modules/auth/auth.routes";

import patientLinksRoutes from "./modules/patient-links/patient-links.routes";

const app = express();

// Parse incoming JSON request bodies.
app.use(express.json());

// Register authentication routes.
// Example: /auth + /login = POST /auth/login
app.use("/auth", authRoutes);


// Register patient-links routes.
app.use("/patient-links", patientLinksRoutes);

// Health-check endpoint.
app.get("/health", (_req, res) => {
    res.json({
        status: "ok"
    });
});

// Export the Express app so Supertest can use it.
export default app;
