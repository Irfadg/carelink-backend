
import request from "supertest";
import app from "../src/app";

describe("GET /health", () => {

    // Test 1: API should return HTTP 200.
    it("should return status code 200", async () => {
        const response = await request(app).get("/health");

        expect(response.status).toBe(200);
    });

    // Test 2: API should return status ok.
    it("should return status ok", async () => {
        const response = await request(app).get("/health");

        expect(response.body).toEqual({
            status: "ok"
        });
    });

    // Test 3: API should return JSON.
    it("should return JSON content type", async () => {
        const response = await request(app).get("/health");

        expect(response.headers["content-type"]).toMatch(/application\/json/);
    });

    // Test 4: Unknown endpoint should return 404.
    it("should return 404 for an unknown endpoint", async () => {
        const response = await request(app).get("/unknown");

        expect(response.status).toBe(404);
    });
});
