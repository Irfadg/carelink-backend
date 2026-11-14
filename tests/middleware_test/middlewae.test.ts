
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { verifyToken } from "../../src/common/middleware/verifyToken";
import { requireRole } from "../../src/common/middleware/requireRole";

// Load the test environment variables.
dotenv.config({ path: ".env.test" });

const secret: string = process.env.JWT_SECRET ?? "";

if (!secret) {
    throw new Error("JWT_SECRET is missing from .env.test");
}

// Create a token for testing different user roles.
function generateToken(role: string) {
    return jwt.sign(
        {
            userId: 101,
            role,
        },
        secret,
        { expiresIn: "1h" }
    );
}

// Create a temporary Express app for middleware testing.
// This app does not start a server or connect to the database.
const app = express();

app.use(express.json());

// Protected route: requires a valid token.
app.get("/protected", verifyToken, (req, res) => {
    res.status(200).json({
        message: "Access granted",
        user: (req as any).user,
    });
});

// Doctor route: requires authentication and doctor role.
app.get(
    "/doctor",
    verifyToken,
    requireRole("doctor"),
    (req, res) => {
        res.status(200).json({
            message: "Doctor access granted",
        });
    }
);

// Multiple roles are allowed.
app.get(
    "/patient-care",
    verifyToken,
    requireRole("doctor", "caregiver"),
    (_req, res) => {
        res.status(200).json({
            message: "Access granted",
        });
    }
);

// Test requireRole without verifyToken.
app.get("/role-only", requireRole("doctor"), (_req, res) => {
    res.status(200).json({
        message: "Access granted",
    });
});

describe("Authentication Middleware", () => {

    // Test 1: Valid token.
    it("should allow access with a valid token", async () => {
        const token = generateToken("patient");

        const response = await request(app)
            .get("/protected")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.user).toEqual({
            userId: 101,
            role: "patient",
        });
    });

    // Test 2: Missing authorization header.
    it("should reject requests without an authorization header", async () => {
        const response = await request(app).get("/protected");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Authentication required");
    });

    // Test 3: Invalid authorization format.
    it("should reject an invalid authorization header", async () => {
        const response = await request(app)
            .get("/protected")
            .set("Authorization", "Basic sometoken");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Invalid authorization header");
    });

    // Test 4: Invalid token.
    it("should reject an invalid token", async () => {
        const response = await request(app)
            .get("/protected")
            .set("Authorization", "Bearer invalidtoken");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Invalid or expired token");
    });

    // Test 5: Expired token.
    it("should reject an expired token", async () => {
        const expiredToken = jwt.sign(
            { userId: 101, role: "patient" },
            secret,
            { expiresIn: -1 }
        );

        const response = await request(app)
            .get("/protected")
            .set("Authorization", `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Invalid or expired token");
    });

    // Test 6: Invalid token payload.
    it("should reject a token with an invalid payload", async () => {
        const invalidPayloadToken = jwt.sign(
            { userId: "101", role: "patient" },
            secret,
            { expiresIn: "1h" }
        );

        const response = await request(app)
            .get("/protected")
            .set("Authorization", `Bearer ${invalidPayloadToken}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Invalid token payload");
    });
});

describe("Role Authorization Middleware", () => {

    // Test 7: User has the required role.
    it("should allow doctors to access doctor routes", async () => {
        const token = generateToken("doctor");

        const response = await request(app)
            .get("/doctor")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Doctor access granted");
    });

    // Test 8: User does not have the required role.
    it("should reject patients from doctor routes", async () => {
        const token = generateToken("patient");

        const response = await request(app)
            .get("/doctor")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(403);
        expect(response.body.isaccess).toBe(false);
    });

    // Test 9: Multiple allowed roles.
    it("should allow users with any of the specified roles", async () => {
        const token = generateToken("caregiver");

        const response = await request(app)
            .get("/patient-care")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
    });

    // Test 10: requireRole used without authenticated user.
    it("should reject requests when req.user is missing", async () => {
        const response = await request(app).get("/role-only");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Authentication required");
    });
});
