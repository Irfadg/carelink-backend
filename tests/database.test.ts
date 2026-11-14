
import pool from "../src/db/index";

describe("Database connection", () => {
    it("should connect to the test database", async () => {
        const result = await pool.query("SELECT current_database()");

        expect(result.rows[0].current_database).toBe("carelink_test");
    });

    afterAll(async () => {
        await pool.end();
    });
});
