
import request from "supertest";
import app from "../../src/app";
import pool from "../../src/db/index";

// Generate unique emails so repeated test runs don't conflict.
const runId = Date.now();

const validEmail = `signup.valid.${runId}@example.com`;
const normalizedEmail = `signup.normalize.${runId}@example.com`;
const duplicateEmail = `signup.duplicate.${runId}@example.com`;

// Keep track of test users for database cleanup.
const testEmails = [
    validEmail,
    normalizedEmail,
    duplicateEmail,
];

describe("POST /auth/signup", () => {

    // Test 1: Successfully register a new user.
    it("should create a new user successfully", async () => {
        const response = await request(app)
            .post("/auth/signup")
            .send({
                name: "Test Patient",
                email: validEmail,
                password: "password123",
                role: "patient",
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe("User created successfully");

        expect(response.body.user).toMatchObject({
            name: "Test Patient",
            email: validEmail,
            role: "patient",
        });
    });

    // Test 2: Email should be trimmed and converted to lowercase.
    it("should normalize the email address", async () => {
        const response = await request(app)
            .post("/auth/signup")
            .send({
                name: "Test User",
                email: `  ${normalizedEmail.toUpperCase()}  `,
                password: "password123",
                role: "patient",
            });

        expect(response.status).toBe(201);
        expect(response.body.user.email).toBe(normalizedEmail);
    });

    // Test 3: Reject duplicate email addresses.
    it("should reject an already registered email", async () => {
        const userData = {
            name: "Duplicate User",
            email: duplicateEmail,
            password: "password123",
            role: "patient",
        };

        const firstResponse = await request(app)
            .post("/auth/signup")
            .send(userData);

        expect(firstResponse.status).toBe(201);

        const secondResponse = await request(app)
            .post("/auth/signup")
            .send(userData);

        expect(secondResponse.status).toBe(400);
    });

    // Test 4: Reject invalid email addresses.
    it("should reject an invalid email address", async () => {
        const response = await request(app)
            .post("/auth/signup")
            .send({
                name: "Test User",
                email: "invalid-email",
                password: "password123",
                role: "patient",
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Validation failed");
    });

    // Test 5: Reject passwords shorter than six characters.
    it("should reject a short password", async () => {
        const response = await request(app)
            .post("/auth/signup")
            .send({
                name: "Test User",
                email: `short.password.${runId}@example.com`,
                password: "123",
                role: "patient",
            });

        expect(response.status).toBe(400);
    });

    // Test 6: Reject invalid user roles.
    it("should reject an invalid role", async () => {
        const response = await request(app)
            .post("/auth/signup")
            .send({
                name: "Test User",
                email: `invalid.role.${runId}@example.com`,
                password: "password123",
                role: "admin",
            });

        expect(response.status).toBe(400);
    });

    // Test 7: Reject a missing name.
    it("should reject a request without a name", async () => {
        const response = await request(app)
            .post("/auth/signup")
            .send({
                email: `missing.name.${runId}@example.com`,
                password: "password123",
                role: "patient",
            });

        expect(response.status).toBe(400);
    });

    // Test 8: Never expose the password hash in the response.
    it("should not expose password_hash in the response", async () => {
        const response = await request(app)
            .post("/auth/signup")
            .send({
                name: "Security Test",
                email: `security.${runId}@example.com`,
                password: "password123",
                role: "patient",
            });

        expect(response.status).toBe(201);
        expect(response.body.user).not.toHaveProperty("password_hash");
    });

    // Clean up test users after the suite finishes.
    afterAll(async () => {
        try {
            await pool.query(
                "DELETE FROM users WHERE email = ANY($1::text[])",
                [[
                    ...testEmails,
                    `security.${runId}@example.com`,
                ]]
            );
        } finally {
         //   await pool.end();
        }
    });
});
