
import request from "supertest";
import app from "../../src/app";
import pool from "../../src/db/index";

// Create a unique user for this login test suite.
const runId = Date.now();

const testEmail = `login.test.${runId}@example.com`;
const testPassword = "password123";

// Register a user before running login tests.
beforeAll(async () => {
    const response = await request(app)
        .post("/auth/signup")
        .send({
            name: "Login Test User",
            email: testEmail,
            password: testPassword,
            role: "patient",
        });

    if (response.status !== 201) {
        throw new Error("Could not create login test user");
    }
});

describe("POST /auth/login", () => {

    // Test 1: Login with valid credentials.
    it("should login successfully with valid credentials", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                email: testEmail,
                password: testPassword,
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Login successful");

        expect(response.body.user.email).toBe(testEmail);

        // Verify that a JWT token is returned.
        expect(typeof response.body.token).toBe("string");
        expect(response.body.token.length).toBeGreaterThan(0);
    });

    // Test 2: Email should be trimmed and converted to lowercase.
    it("should accept uppercase and whitespace in email", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                email: `  ${testEmail.toUpperCase()}  `,
                password: testPassword,
            });

        expect(response.status).toBe(200);
        expect(response.body.user.email).toBe(testEmail);
    });

    // Test 3: Reject an incorrect password.
    it("should reject an incorrect password", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                email: testEmail,
                password: "wrongpassword",
            });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Invalid email or password");
    });

    // Test 4: Reject an email that doesn't exist.
    it("should reject an unknown email address", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                email: `unknown.${runId}@example.com`,
                password: testPassword,
            });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Invalid email or password");
    });

    // Test 5: Reject a request without a password.
    it("should reject a missing password", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                email: testEmail,
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Validation failed");
    });

    // Test 6: Never expose the password hash in the response.
    it("should not expose password_hash in the response", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                email: testEmail,
                password: testPassword,
            });

        expect(response.status).toBe(200);
        expect(response.body.user).not.toHaveProperty("password_hash");
    });
});

// Clean up the login test user after all tests finish.
afterAll(async () => {
    try {
        await pool.query(
            "DELETE FROM users WHERE email = $1",
            [testEmail]
        );
    } finally {
        await pool.end();
    }
});
